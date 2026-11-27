import { CharacterController } from './CharacterController.ts';
import type { MovementIntent, MotionSnapshot, WalkableWorld } from './motion.ts';
import { PoolWorldQuery, pool } from '../world/PoolWorldQuery.ts';
import { finitePoint, type Capsule, type Point3 } from '../world/WorldQuery.ts';

const step = 1 / 60;
const zero = (): Point3 => ({ x: 0, y: 0, z: 0 });

export class PoolSwimController {
  private readonly ground: CharacterController;
  private readonly query: PoolWorldQuery;
  private state: MotionSnapshot;
  private velocity = zero();
  private remainder = 0;
  private swimming = false;

  constructor(world: WalkableWorld, capsule: Capsule) {
    if (!(world.query instanceof PoolWorldQuery)) throw Error('Pool query required');
    this.query = world.query;
    this.ground = new CharacterController(world, capsule);
    if (!this.ground.relocate({ x: 0, y: pool.deck, z: pool.exitZ })) throw Error('Pool spawn unavailable');
    this.state = { ...this.ground.snapshot };
  }

  get snapshot(): Readonly<MotionSnapshot> { return { ...this.state }; }
  get mode(): 'ground' | 'swim' { return this.swimming ? 'swim' : 'ground'; }
  get depth(): number { return this.query.waterAt(this.state)?.depth ?? 0; }
  get canClimb(): boolean { return this.query.exit(this.state, this.shape) !== null; }
  get walkSpeed(): number { return this.ground.walkSpeed; }
  get shape(): Capsule { return this.ground.shape; }
  setWalkSpeed(speed: number): boolean { return this.ground.setWalkSpeed(speed); }
  setCapsule(capsule: Capsule): boolean {
    return this.query.clear(this.state, capsule) && this.ground.setCapsule(capsule);
  }

  stop(): void { this.velocity = zero(); this.remainder = 0; this.state.speed = 0; }

  relocate(position: Point3, snap = true): boolean {
    if (!finitePoint(position)) return false;
    const support = snap ? this.query.surfaceSample(position) : null;
    if (snap && !support?.ok) return false;
    const next = { ...position, y: support?.ok ? support.value.height : position.y };
    if (Boolean(this.query.waterAt(next)?.submerged) !== this.swimming || !this.query.clear(next, this.shape)) return false;
    if (this.swimming) Object.assign(this.state, next);
    else {
      if (!this.ground.relocate(next, snap)) return false;
      this.state = { ...this.ground.snapshot };
    }
    this.stop();
    return true;
  }

  climbOut(): boolean {
    if (!this.swimming) return false;
    const exit = this.query.exit(this.state, this.shape);
    if (!exit || !this.ground.relocate(exit)) return false;
    this.swimming = false;
    this.state = { ...this.ground.snapshot };
    this.stop();
    return true;
  }

  update(delta: number, intent: MovementIntent, speedOverride?: number): Readonly<MotionSnapshot> {
    if (!Number.isFinite(delta) || delta < 0 || delta > 3600 ||
      ![intent.x, intent.z, intent.vertical ?? 0].every(Number.isFinite)) return this.snapshot;
    if (!this.swimming) {
      this.state = { ...this.ground.update(delta, intent, speedOverride) };
      if (!this.query.waterAt(this.state)?.submerged) return this.snapshot;
      this.swimming = true;
      this.stop();
      Object.assign(this.state, { grounded: false, action: 'jump' });
      return this.snapshot;
    }

    const time = this.remainder + delta;
    const available = Math.floor((time + 1e-10) / step);
    this.remainder = Math.max(0, time - available * step);
    const vertical = intent.vertical ?? (intent.jump ? 1 : 0);
    const scale = Math.max(1, Math.hypot(intent.x, vertical, intent.z));
    for (let i = 0; i < Math.min(4, available); i++) {
      const acceleration = intent.run ? 16 : 9;
      const buoyancy = Math.min(4, (this.depth - this.shape.height * .55) * 7);
      const drag = Math.exp(-2.4 * step);
      const next = {
        x: (this.velocity.x + intent.x / scale * acceleration * step) * drag,
        y: (this.velocity.y + (vertical / scale * acceleration + buoyancy) * step) * drag,
        z: (this.velocity.z + intent.z / scale * acceleration * step) * drag,
      };
      const speed = Math.hypot(next.x, next.y, next.z);
      const clamp = Math.max(1, speed / (intent.run ? 6 : 3.5));
      next.x /= clamp; next.y /= clamp; next.z /= clamp;
      if (!this.move(next)) { this.stop(); break; }
    }
    this.state.speed = Math.hypot(this.velocity.x, this.velocity.y, this.velocity.z);
    if (Math.hypot(this.velocity.x, this.velocity.z) > 1e-8) {
      this.state.heading = Math.atan2(this.velocity.x, this.velocity.z);
    }
    this.state.action = 'jump';
    this.state.grounded = false;
    return this.snapshot;
  }

  private move(velocity: Point3): boolean {
    const position = { x: this.state.x, y: this.state.y, z: this.state.z };
    const ceiling = pool.water - .08;
    const rest = { x: velocity.x * step, y: velocity.y * step, z: velocity.z * step };
    if (rest.y > 0 && position.y + rest.y > ceiling) {
      rest.y = Math.max(0, ceiling - position.y);
      velocity.y = 0;
    }
    for (let i = 0; i < 4; i++) {
      const result = this.query.sweep(position, rest, this.shape);
      if (!result.ok) return false;
      const hit = result.value;
      const fraction = hit?.fraction ?? 1;
      position.x += rest.x * fraction; position.y += rest.y * fraction; position.z += rest.z * fraction;
      if (!hit) break;
      rest.x *= 1 - fraction; rest.y *= 1 - fraction; rest.z *= 1 - fraction;
      for (const vector of [rest, velocity]) {
        const dot = Math.min(0, vector.x * hit.normal.x + vector.y * hit.normal.y + vector.z * hit.normal.z);
        vector.x -= dot * hit.normal.x; vector.y -= dot * hit.normal.y; vector.z -= dot * hit.normal.z;
      }
      if (Math.hypot(rest.x, rest.y, rest.z) < 1e-10) break;
    }
    if (!this.query.waterAt(position)?.submerged || !this.query.clear(position, this.shape)) return false;
    Object.assign(this.state, position);
    this.velocity = velocity;
    return true;
  }
}
