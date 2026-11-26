import { SpatialCharacterController } from './SpatialCharacterController.ts';
import type { MovementIntent, MotionSnapshot, WalkableWorld } from './motion.ts';
import { finitePoint, type Capsule, type Point3, type WorldQuery } from '../world/WorldQuery.ts';
import type { WaterVolume } from '../water/WaterVolume.ts';
import { characterCapsules } from './motion.ts';

const step = 1 / 60;
const depthEpsilon = 1e-6;
const surfaceBandDepth = .4;
const maxFloatSpeed = .55;
const zero = (): Point3 => ({ x: 0, y: 0, z: 0 });
export type SwimDepthDirection = -1 | 1;
export type WaterLocation = '00' | '01' | '02' | '03';
// Midpoint of Chest and Neck in each normalized, upright GLB.
export const swimWaterlineHeight = { man: 1.397012, woman: 1.315266, child: .792177 } as const;
const rigWaterlines = Object.entries(swimWaterlineHeight).map(([variant, height]) =>
  [characterCapsules[variant as keyof typeof characterCapsules].height, height] as const);
const probeDirections = Array.from({ length: 8 }, (_, index) => {
  const angle = index * Math.PI / 4;
  return { x: Math.sin(angle), z: Math.cos(angle) };
});
const climbDuration = 1.2;
const smooth = (t: number): number => {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
};

export interface SwimExit {
  readonly surfaceId: string;
}

interface ClimbPath {
  start: MotionSnapshot;
  edge: Point3;
  raised: Point3;
  landing: Point3;
  heading: number;
}

export class SwimController {
  private ground: SpatialCharacterController;
  private readonly query: WorldQuery;
  private state: MotionSnapshot;
  private capsule: Capsule;
  private velocity = zero();
  private remainder = 0;
  private wet = false;
  private swimming = false;
  private spiralDirection?: SwimDepthDirection;
  private spiralBlockedTime = 0;
  private discarded = 0;
  private climb?: ClimbPath;
  private climbTime = 0;

  constructor(private readonly world: WalkableWorld, capsule: Capsule, private readonly spawn: { x: number; z: number },
    private readonly water: WaterVolume, private readonly exit: SwimExit) {
    if (!world.query) throw new Error('Swimming requires a world query');
    this.query = world.query;
    this.capsule = { ...capsule };
    this.ground = new SpatialCharacterController(world, capsule, spawn);
    this.state = { ...this.ground.snapshot };
  }

  get snapshot(): Readonly<MotionSnapshot> { return { ...this.state }; }
  get shape(): Capsule { return { ...this.capsule }; }
  get walkSpeed(): number { return this.ground.walkSpeed; }
  get mode(): 'ground' | 'swim' | 'bottom' | 'climb' {
    return this.climb ? 'climb' : !this.swimming ? 'ground' : this.atBottom ? 'bottom' : 'swim';
  }
  get climbProgress(): number | undefined { return this.climb && this.climbTime / climbDuration; }
  get submerged(): boolean { return this.wet; }
  get waterLocation(): WaterLocation {
    if (!this.touchesWater(this.state)) return '00';
    if (this.atBottom) return '03';
    return this.touchesWater(this.state, this.water.level - surfaceBandDepth) ? '01' : '02';
  }
  get atWaterline(): boolean { return this.waterLocation === '01'; }
  get depthPathBlocked(): boolean { return this.spiralBlockedTime >= .5; }
  get droppedTime(): number { return this.discarded; }
  private get swimCeiling(): number { return this.water.level - .15; }
  private get spiralSurfaceY(): number {
    const height = rigWaterlines.find(([capsuleHeight]) => capsuleHeight === this.capsule.height)?.[1];
    return this.water.level - (height ?? this.capsule.height * .77);
  }
  private get atBottom(): boolean { return this.state.y <= this.water.bottom + depthEpsilon; }

  private touchesWater({ x, y, z }: Point3, lower = this.water.bottom): boolean {
    const { footprint, bottom, level } = this.water;
    const { radius, height } = this.capsule;
    if (y >= level || y + height < bottom - depthEpsilon) return false;
    const dx = Math.max(0, footprint.minX - x, x - footprint.maxX);
    const dz = Math.max(0, footprint.minZ - z, z - footprint.maxZ);
    const dy = Math.max(0, lower - (y + height - radius), y + radius - level);
    return Math.hypot(dx, dy, dz) <= radius + depthEpsilon;
  }

  canSwimVertically(direction: SwimDepthDirection): boolean {
    return this.swimming && !this.climb &&
      (direction > 0 ? this.state.y < this.spiralSurfaceY - depthEpsilon : !this.atBottom);
  }

  setWalkSpeed(speed: number): boolean { return this.ground.setWalkSpeed(speed); }
  setCapsule(shape: Capsule): boolean {
    if (this.climb && !this.legal(this.climb.start, shape)) return false;
    if (!this.legal(this.state, shape)) return false;
    if (!this.swimming && !this.ground.setCapsule(shape)) return false;
    if (this.climb) this.stop();
    this.capsule = { ...shape };
    this.sampleTorso();
    return true;
  }

  relocate(position: Point3, snap = true): boolean {
    if (!finitePoint(position)) return false;
    const support = this.query.surfaceSample(position);
    if (snap && !support.ok) return false;
    const next = { ...position, y: snap && support.ok ? support.value.height : position.y };
    if (!this.legal(next)) return false;
    const swimming = this.touchesWater(next);
    if (swimming) {
      const grounded = next.y <= this.water.bottom + depthEpsilon;
      this.state = { ...this.state, ...next, grounded, action: grounded ? 'idle' : 'jump' };
    } else {
      // A position edit cannot place a walking actor in mid-air over the pool.
      if (!support.ok || support.value.surfaceId !== this.exit.surfaceId || !this.placeOnDeck(next, snap)) return false;
      this.state = { ...this.ground.snapshot };
    }
    this.climb = undefined;
    this.swimming = swimming;
    this.wet = false;
    this.sampleTorso();
    this.stop();
    return true;
  }

  stop(cancelClimb = true): void {
    if (cancelClimb && this.climb) {
      this.state = this.climb.start;
      this.climb = undefined;
      this.sampleTorso();
    }
    this.velocity = zero();
    this.remainder = 0;
    this.state.speed = 0;
    this.spiralDirection = undefined;
    this.spiralBlockedTime = 0;
  }

  canLeaveWater(): boolean {
    return !!this.findClimb();
  }

  leaveWater(): boolean {
    const path = this.findClimb();
    if (!path) return false;
    this.startClimb(path);
    return true;
  }

  private findClimb(direction?: Point3): ClimbPath | undefined {
    if (!this.swimming || this.climb || this.state.y < this.spiralSurfaceY - .08) return;
    const start = this.snapshot;
    let bestDistance = Infinity;
    let best: ClimbPath | undefined;
    for (const axis of direction ? [direction] : probeDirections) {
      const length = Math.hypot(axis.x, axis.z);
      const reach = direction ? Math.min(length, .45) : .45;
      const displacement = { x: axis.x / length * reach, y: 0, z: axis.z / length * reach };
      const contact = this.query.sweep(start, displacement, this.capsule);
      const hit = contact.ok ? contact.value : null;
      if (hit?.stepSurface?.id !== this.exit.surfaceId || Math.abs(hit.normal.y) > .5 ||
        hit.stepSurface.height <= start.y || hit.stepSurface.height > this.water.level + .38) continue;
      const distance = reach * hit.fraction;
      if (distance >= bestDistance) continue;
      const fraction = Math.max(0, hit.fraction - .001 / reach);
      const edge = { x: start.x + displacement.x * fraction, y: start.y, z: start.z + displacement.z * fraction };
      const raised = { ...edge, y: hit.stepSurface.height };
      const crossing = this.capsule.radius * 2 + .045;
      const landing = { x: edge.x - hit.normal.x * crossing, y: raised.y, z: edge.z - hit.normal.z * crossing };
      if (!this.supportedLanding(landing) ||
        !this.clear(start, edge) || !this.clear(edge, raised) || !this.clear(raised, landing)) continue;
      bestDistance = distance;
      best = { start, edge, raised, landing, heading: Math.atan2(-hit.normal.x, -hit.normal.z) };
    }
    return best;
  }

  private supportedLanding(landing: Point3): boolean {
    const r = this.capsule.radius;
    return [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([x, z]) => {
      const surface = this.query.surfaceSample({ ...landing, x: landing.x + x!, z: landing.z + z! });
      return surface.ok && surface.value.surfaceId === this.exit.surfaceId &&
        Math.abs(surface.value.height - landing.y) < depthEpsilon;
    });
  }

  private startClimb(path: ClimbPath): void {
    this.stop();
    this.climb = path;
    this.climbTime = 0;
    this.state.speed = 0;
  }

  private advanceClimb(): void {
    const path = this.climb!;
    this.climbTime = Math.min(climbDuration, this.climbTime + step);
    const progress = this.climbTime / climbDuration;
    const [from, to, weight] = progress < .24 ? [path.start, path.edge, smooth(progress / .24)] :
      progress < .64 ? [path.edge, path.raised, smooth((progress - .24) / .40)] :
        [path.raised, path.landing, smooth((progress - .64) / .22)];
    const next = { x: from.x + (to.x - from.x) * weight, y: from.y + (to.y - from.y) * weight,
      z: from.z + (to.z - from.z) * weight };
    if (!this.clear(this.state, next)) { this.stop(); return; }
    const turn = path.heading - path.start.heading;
    Object.assign(this.state, next, { heading: path.start.heading + Math.atan2(Math.sin(turn), Math.cos(turn)) * smooth(progress / .24) });
    this.sampleTorso();
    if (progress < 1) return;
    if (!this.placeOnDeck(path.landing, true)) { this.stop(); return; }
    this.climb = undefined;
    this.swimming = this.wet = false;
    this.state = { ...this.ground.snapshot };
    this.stop();
  }

  update(delta: number, intent: MovementIntent, speedOverride?: number, spiral?: SwimDepthDirection): Readonly<MotionSnapshot> {
    const vertical = intent.vertical ?? Number(intent.jump);
    const magnitude = Math.hypot(intent.x, vertical, intent.z);
    if (!Number.isFinite(delta) || delta < 0 || delta > 3600 || !Number.isFinite(magnitude)) return this.snapshot;
    if (!this.swimming) {
      this.state = { ...this.ground.update(delta, intent, speedOverride) };
      this.sampleTorso();
      return this.snapshot;
    }

    const total = this.remainder + delta;
    const available = Math.floor((total + 1e-10) / step);
    const steps = Math.min(4, available);
    this.remainder = Math.max(0, total - available * step);
    this.discarded += (available - steps) * step;
    if (spiral !== this.spiralDirection) {
      this.spiralDirection = spiral;
      this.spiralBlockedTime = 0;
    }
    if (!magnitude && !spiral) this.velocity = zero();
    if (!this.climb && !spiral && (intent.x || intent.z)) this.state.heading = Math.atan2(intent.x, intent.z);
    for (let i = 0; i < steps; i++) {
      if (this.climb) {
        this.advanceClimb();
        if (!this.climb) return this.snapshot;
        continue;
      }
      if (spiral && (!this.canSwimVertically(spiral) || this.depthPathBlocked)) break;
      const beforeY = this.state.y;
      const floating = !magnitude && !spiral && this.atWaterline;
      const difference = this.spiralSurfaceY - this.state.y;
      const velocity = floating
        ? { x: 0, y: Math.sign(difference) * Math.min(maxFloatSpeed, Math.abs(difference) / step), z: 0 }
        : this.nextVelocity(intent, vertical, magnitude, speedOverride, spiral);
      const path = !spiral && vertical >= 0 && intent.x * velocity.x + intent.z * velocity.z > depthEpsilon
        ? this.findClimb({ x: velocity.x * step, y: 0, z: velocity.z * step }) : undefined;
      if (path) { this.startClimb(path); return this.snapshot; }
      const position = this.move(velocity, spiral === 1 ? this.spiralSurfaceY : Math.max(this.swimCeiling, this.state.y));
      if (!position) {
        this.velocity = zero();
        if (spiral) this.spiralBlockedTime = .5;
        break;
      }
      this.velocity = floating ? zero() : velocity;
      Object.assign(this.state, position);
      this.sampleTorso();
      if (spiral) {
        const progressed = (position.y - beforeY) * spiral > depthEpsilon;
        this.spiralBlockedTime = progressed ? 0 : this.spiralBlockedTime + step;
        if (!this.canSwimVertically(spiral) || this.depthPathBlocked) this.velocity = zero();
      }
    }
    this.state.speed = Math.hypot(this.velocity.x, this.velocity.y, this.velocity.z);
    this.state.grounded = this.atBottom;
    this.state.action = !this.atBottom ? 'jump' : this.state.speed < depthEpsilon ? 'idle' : intent.run ? 'run' : 'walk';
    return this.snapshot;
  }

  private nextVelocity(intent: MovementIntent, vertical: number, magnitude: number, speedOverride?: number,
    spiral?: SwimDepthDirection): Point3 {
    if (spiral) {
      this.state.heading += spiral * 1.8 * step;
      return { x: Math.sin(this.state.heading) * 1.6, y: spiral * 1.1, z: Math.cos(this.state.heading) * 1.6 };
    }
    if (this.atBottom && vertical <= 0) {
      const scale = (speedOverride ?? (intent.run ? 4 : this.walkSpeed)) / Math.max(1, Math.hypot(intent.x, intent.z));
      return { x: intent.x * scale, y: 0, z: intent.z * scale };
    }
    const scale = (intent.run ? 13 : 8) / Math.max(magnitude, 1);
    const drag = Math.exp(-2.8 * step);
    return {
      x: (this.velocity.x + intent.x * scale * step) * drag,
      y: (this.velocity.y + vertical * scale * step) * drag,
      z: (this.velocity.z + intent.z * scale * step) * drag,
    };
  }

  private sampleTorso(): void {
    this.wet = this.water.submerged({ ...this.state, y: this.state.y + this.capsule.height * .5 }, this.wet);
    if (this.wet && !this.swimming) {
      this.swimming = true;
      this.velocity.y = -Math.min(this.state.speed, 2);
      this.state.action = 'jump';
      this.state.grounded = false;
    }
  }

  private legal(point: Point3, shape = this.capsule): boolean {
    const overlap = this.query.overlap(point, shape);
    return overlap.ok && !overlap.value;
  }

  private placeOnDeck(point: Point3, snap: boolean): boolean {
    // The dormant ground position can be too close to the edge for the current capsule.
    const support = this.query.surfaceSample({ ...this.spawn, y: 0 });
    if (!support.ok || !this.legal({ ...this.spawn, y: support.value.height })) return false;
    const ground = new SpatialCharacterController(this.world, this.capsule, this.spawn);
    ground.setWalkSpeed(this.walkSpeed);
    if (!ground.relocate(point, snap, this.state.heading)) return false;
    this.ground = ground;
    return true;
  }

  private clear(start: Point3, end: Point3): boolean {
    const hit = this.query.sweep(start, { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z }, this.capsule);
    return hit.ok && (!hit.value || hit.value.fraction >= 1 - 1e-8) && this.legal(end);
  }

  private move(velocity: Point3, ceiling: number): Point3 | null {
    const { x, y, z } = this.state;
    const position = { x, y, z };
    const rest = { x: velocity.x * step, y: Math.min(velocity.y * step, ceiling - y), z: velocity.z * step };
    if (y + velocity.y * step > ceiling) velocity.y = Math.min(0, velocity.y);
    for (let i = 0; i < 4; i++) {
      const result = this.query.sweep(position, rest, this.capsule);
      if (!result.ok) return null;
      const hit = result.value;
      const fraction = hit?.fraction ?? 1;
      position.x += rest.x * fraction;
      position.y += rest.y * fraction;
      position.z += rest.z * fraction;
      if (!hit) break;
      rest.x *= 1 - fraction;
      rest.y *= 1 - fraction;
      rest.z *= 1 - fraction;
      for (const vector of [rest, velocity]) {
        const into = Math.min(0, vector.x * hit.normal.x + vector.y * hit.normal.y + vector.z * hit.normal.z);
        vector.x -= into * hit.normal.x;
        vector.y -= into * hit.normal.y;
        vector.z -= into * hit.normal.z;
      }
      if (Math.hypot(rest.x, rest.y, rest.z) < 1e-10) break;
    }
    return this.legal(position) && position.y <= ceiling + 1e-8 ? position : null;
  }
}
