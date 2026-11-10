import type { MovementIntent, MotionSnapshot, WalkableWorld } from './motion';
import { worldQuery } from '../world/LegacyWorldQuery.ts';
import { defaultCapsule, finitePoint, type Capsule, type Point3, type WorldQuery } from '../world/WorldQuery.ts';
import { maxStepHeight, minimumGroundNormal } from '../world/GroundWorldQuery.ts';

const GRAVITY = 18;

export class CharacterController {
  private readonly state: MotionSnapshot;
  private velocityY = 0;
  private jumpHeld = false;
  private walkingSpeed = 1.8;
  private readonly query: WorldQuery;
  get snapshot(): Readonly<MotionSnapshot> { return { ...this.state }; }
  get walkSpeed(): number { return this.walkingSpeed; }
  setWalkSpeed(speed: number): boolean {
    if (!Number.isFinite(speed) || speed < .5 || speed > 4) return false;
    this.walkingSpeed = speed;
    return true;
  }
  relocate(position: { x: number; y: number; z: number }, snap = true): boolean {
    const { x, y, z } = position;
    const surface = this.query.surfaceSample(position);
    if (!finitePoint(position) || !surface.ok) return false;
    const ground = surface.value.height;
    if ((!snap && (y < ground || y > ground + 10)) || !this.canPlace({ x, y: snap ? ground : y, z })) return false;
    Object.assign(this.state, { x, y: snap ? ground : y, z, speed: 0, grounded: snap || y === ground,
      action: snap || y === ground ? 'idle' : 'jump' });
    this.velocityY = 0;
    this.jumpHeld = false;
    return true;
  }
  get shape(): Capsule { return { ...this.capsule }; }
  setCapsule(capsule: Capsule): boolean {
    const previous = this.capsule;
    this.capsule = { ...capsule };
    if (!this.canPlace(this.state)) { this.capsule = previous; return false; }
    return true;
  }
  constructor(world: WalkableWorld, private capsule: Capsule = defaultCapsule) {
    this.query = worldQuery(world);
    const surface = this.query.surfaceSample({ x: 0, y: 0, z: 5 });
    if (!surface.ok || !this.canPlace({ x: 0, y: surface.value.height, z: 5 })) throw new Error('Character spawn is unavailable');
    this.state = { x: 0, y: surface.value.height, z: 5, heading: Math.PI, speed: 0, grounded: true, action: 'idle' };
  }
  update(delta: number, intent: MovementIntent, speedOverride?: number): Readonly<MotionSnapshot> {
    const dt = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 0.05);
    const magnitude = Math.hypot(intent.x, intent.z);
    const speed = speedOverride ?? (intent.run ? 4 : this.walkingSpeed);
    if (![intent.x, intent.z, magnitude, speed].every(Number.isFinite) || speed < 0) return this.snapshot;
    const before = this.snapshot, velocityY = this.velocityY, jumpHeld = this.jumpHeld;
    const reject = (): Readonly<MotionSnapshot> => {
      Object.assign(this.state, before); this.velocityY = velocityY; this.jumpHeld = jumpHeld;
      return this.snapshot;
    };
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
      if (this.query.capabilities.geometry === 'ground-volume') {
        if (!this.moveGround(step, vx, vz)) return reject();
        continue;
      }
      const x = this.moveAxis(this.state, 'x', vx * step);
      if (x === null) return reject();
      const z = this.moveAxis({ ...this.state, x }, 'z', vz * step);
      if (z === null) return reject();
      const surface = this.query.surfaceSample({ x, y: this.state.y, z });
      if (!surface.ok) return reject();
      const ground = surface.value.height;
      this.state.x = x; this.state.z = z;
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
      if (!finitePoint(this.state) || !this.canPlace(this.state)) return reject();
    }
    this.state.speed = dt > 0 ? Math.hypot(this.state.x - startX, this.state.z - startZ) / dt : 0;
    this.state.action = !this.state.grounded ? 'jump' : this.state.speed < 0.00001 ? 'idle' : intent.run || speed > 1.8 ? 'run' : 'walk';
    return { ...this.state };
  }
  private canPlace(position: Point3): boolean {
    const region = this.query.regionSample(position, this.capsule);
    const overlap = this.query.overlap(position, this.capsule);
    return region.ok && region.value.allowed && overlap.ok && !overlap.value;
  }
  /** Resolve a finite displacement with at most four contacts. Never write partial query failures. */
  private slide(start: Point3, delta: Point3, horizontalOnly = false): Point3 | null {
    const position = { ...start }, remaining = { ...delta };
    for (let i = 0; i < 4; i++) {
      const result = this.query.sweep(position, remaining, this.capsule);
      if (!result.ok) return null;
      const hit = result.value, fraction = hit?.fraction ?? 1;
      position.x += remaining.x * fraction; position.y += remaining.y * fraction; position.z += remaining.z * fraction;
      if (!hit) break;
      const normal = { ...hit.normal };
      if (horizontalOnly) {
        const length = Math.hypot(normal.x, normal.z);
        if (length < 1e-10) break;
        normal.x /= length; normal.z /= length; normal.y = 0;
      }
      const rest = 1 - fraction;
      remaining.x *= rest; remaining.y *= rest; remaining.z *= rest;
      const inward = remaining.x * normal.x + remaining.y * normal.y + remaining.z * normal.z;
      if (inward >= -1e-12) break;
      remaining.x -= inward * normal.x; remaining.y -= inward * normal.y; remaining.z -= inward * normal.z;
      if (Math.hypot(remaining.x, remaining.y, remaining.z) < 1e-10) break;
    }
    return this.canPlace(position) ? position : null;
  }
  private clear(start: Point3, delta: Point3): boolean {
    const hit = this.query.sweep(start, delta, this.capsule);
    return hit.ok && (!hit.value || hit.value.fraction >= 1 - 1e-8);
  }
  private moveGround(dt: number, vx: number, vz: number): boolean {
    const start = { x: this.state.x, y: this.state.y, z: this.state.z };
    let delta = { x: vx * dt, y: 0, z: vz * dt };
    const candidate = { x: start.x + delta.x, y: start.y, z: start.z + delta.z };
    const support = this.query.surfaceSample(candidate, { maxRise: this.state.grounded ? maxStepHeight : 1e-8 });
    if (!support.ok) return false;
    const rise = support.value.height - start.y;
    if (this.state.grounded && ((support.value.normal?.y ?? 1) < minimumGroundNormal || rise > maxStepHeight + 1e-8)) {
      delta = { x: 0, y: 0, z: 0 };
    } else if (this.state.grounded && Math.abs(rise) <= maxStepHeight + 1e-8 && support.value.surfaceId === 'terrain-ground') {
      delta.y = rise;
    }
    const terrain = support.value.surfaceId === 'terrain-ground';
    const firstContact = this.query.sweep(start, delta, this.capsule);
    if (!firstContact.ok) return false;
    let moved = this.slide(start, delta, !terrain);
    if (!moved) return false;
    const desired = Math.hypot(delta.x, delta.z), achieved = Math.hypot(moved.x - start.x, moved.z - start.z);
    let steppedGround = false;
    const stepSurface = firstContact.value?.stepSurface;
    if (this.state.grounded && !terrain && stepSurface && stepSurface.height-start.y <= maxStepHeight+1e-8 &&
      desired > 1e-10 && achieved < desired - 1e-8) {
      const elevated = { ...start, y: start.y + maxStepHeight };
      if (this.clear(start, { x: 0, y: maxStepHeight, z: 0 })) {
        const stepped = this.slide(elevated, { x: delta.x, y: 0, z: delta.z }, true);
        if (stepped && Math.hypot(stepped.x - start.x, stepped.z - start.z) > achieved + 1e-8) { moved = stepped; steppedGround = true; }
      }
    }
    const ground = this.query.surfaceSample(moved, { maxRise: this.state.grounded ? maxStepHeight : 1e-8 });
    if (!ground.ok) return false;
    if (this.state.grounded && (steppedGround || moved.y - ground.value.height <= maxStepHeight + 1e-8)) {
      const down = { x: 0, y: ground.value.height - moved.y, z: 0 };
      const contact = this.query.sweep(moved, down, this.capsule);
      if (!contact.ok) return false;
      moved.y += down.y * (contact.value?.fraction ?? 1);
      this.state.grounded = !contact.value || contact.value.normal.y >= minimumGroundNormal || steppedGround && contact.value.normal.y > 0;
      this.velocityY = 0;
    } else {
      this.state.grounded = false;
      let dy = this.velocityY * dt - GRAVITY * dt * dt / 2;
      this.velocityY -= GRAVITY * dt;
      const floor = ground.value.height;
      if (dy < 0 && moved.y + dy < floor) dy = floor - moved.y;
      const result = this.query.sweep(moved, { x: 0, y: dy, z: 0 }, this.capsule);
      if (!result.ok) return false;
      moved.y += dy * (result.value?.fraction ?? 1);
      if (result.value) {
        if (dy > 0) this.velocityY = Math.min(0, this.velocityY);
        else if (result.value.normal.y >= minimumGroundNormal) { this.velocityY = 0; this.state.grounded = true; }
      } else if (dy <= 0 && moved.y <= floor + 1e-8) {
        moved.y = floor; this.velocityY = 0; this.state.grounded = true;
      }
    }
    if (!finitePoint(moved) || !this.canPlace(moved)) return false;
    Object.assign(this.state, moved);
    return true;
  }
  private moveAxis(position: Point3, axis: 'x' | 'z', distance: number): number | null {
    const displacement = { x: 0, y: 0, z: 0 }; displacement[axis] = distance;
    const result = this.query.sweep(position, displacement, this.capsule);
    return result.ok ? position[axis] + distance * (result.value?.fraction ?? 1) : null;
  }
}
