import type { MovementIntent, MotionSnapshot, WalkableWorld } from './motion';
import { characterRadius as RADIUS } from './motion.ts';

const GRAVITY = 18;

export class CharacterController {
  private readonly state: MotionSnapshot;
  private velocityY = 0;
  private jumpHeld = false;
  private walkingSpeed = 1.8;
  get snapshot(): Readonly<MotionSnapshot> { return { ...this.state }; }
  get walkSpeed(): number { return this.walkingSpeed; }
  setWalkSpeed(speed: number): boolean {
    if (!Number.isFinite(speed) || speed < .5 || speed > 4) return false;
    this.walkingSpeed = speed;
    return true;
  }
  relocate(position: { x: number; y: number; z: number }, snap = true): boolean {
    const { x, y, z } = position;
    const b = this.world.bounds;
    if (![x, y, z].every(Number.isFinite) || x < b.minX + RADIUS || x > b.maxX - RADIUS ||
      z < b.minZ + RADIUS || z > b.maxZ - RADIUS || this.world.obstacles.some(o =>
        x > o.minX - RADIUS && x < o.maxX + RADIUS && z > o.minZ - RADIUS && z < o.maxZ + RADIUS)) return false;
    const ground = this.world.groundHeight(x, z);
    if (!Number.isFinite(ground) || (!snap && (y < ground || y > ground + 10))) return false;
    Object.assign(this.state, { x, y: snap ? ground : y, z, speed: 0, grounded: snap || y === ground,
      action: snap || y === ground ? 'idle' : 'jump' });
    this.velocityY = 0;
    this.jumpHeld = false;
    return true;
  }
  constructor(private readonly world: WalkableWorld) {
    this.state = { x: 0, y: world.groundHeight(0, 5), z: 5, heading: Math.PI, speed: 0, grounded: true, action: 'idle' };
  }
  update(delta: number, intent: MovementIntent, speedOverride?: number): Readonly<MotionSnapshot> {
    const dt = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 0.05);
    const magnitude = Math.hypot(intent.x, intent.z);
    const speed = speedOverride ?? (intent.run ? 4 : this.walkingSpeed);
    const scale = speed / Math.max(1, magnitude);
    const vx = intent.x * scale;
    const vz = intent.z * scale;
    if (magnitude > 0) this.state.heading = Math.atan2(intent.x, intent.z);
    if (intent.jump && !this.jumpHeld && this.state.grounded) {
      this.velocityY = 6;
      this.state.grounded = false;
    }
    this.jumpHeld = intent.jump;
    const startX = this.state.x;
    const startZ = this.state.z;
    const steps = Math.max(1, Math.ceil(dt * 120));
    const step = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.state.x = this.moveAxis('x', vx * step);
      this.state.z = this.moveAxis('z', vz * step);
      const ground = this.world.groundHeight(this.state.x, this.state.z);
      if (this.state.grounded) this.state.y = ground;
      else {
        this.state.y += this.velocityY * step - GRAVITY * step * step / 2;
        this.velocityY -= GRAVITY * step;
        if (this.state.y <= ground) {
          this.state.y = ground;
          this.velocityY = 0;
          this.state.grounded = true;
        }
      }
    }
    this.state.speed = dt > 0 ? Math.hypot(this.state.x - startX, this.state.z - startZ) / dt : 0;
    this.state.action = !this.state.grounded ? 'jump' : this.state.speed < 0.00001 ? 'idle' : intent.run || speed > 1.8 ? 'run' : 'walk';
    return { ...this.state };
  }
  private moveAxis(axis: 'x' | 'z', distance: number): number {
    const xAxis = axis === 'x';
    const minKey = xAxis ? 'minX' : 'minZ';
    const maxKey = xAxis ? 'maxX' : 'maxZ';
    const other = xAxis ? this.state.z : this.state.x;
    const start = this.state[axis];
    let next = Math.max(this.world.bounds[minKey] + RADIUS, Math.min(this.world.bounds[maxKey] - RADIUS, start + distance));
    for (const obstacle of this.world.obstacles) {
      const otherMin = (xAxis ? obstacle.minZ : obstacle.minX) - RADIUS;
      const otherMax = (xAxis ? obstacle.maxZ : obstacle.maxX) + RADIUS;
      if (other <= otherMin || other >= otherMax) continue;
      const min = obstacle[minKey] - RADIUS;
      const max = obstacle[maxKey] + RADIUS;
      if (distance > 0 && start <= min && next > min) next = min;
      if (distance < 0 && start >= max && next < max) next = max;
    }
    return next;
  }
}
