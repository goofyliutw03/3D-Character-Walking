import { characterRadius } from '../character/motion.ts';
import type { MovementIntent, WalkableBounds, WalkableWorld } from '../character/motion';
import { worldQuery } from '../world/LegacyWorldQuery.ts';
import { defaultCapsule, type Capsule } from '../world/WorldQuery.ts';

export interface PointXZ { x: number; z: number; y?: number }
export type NavigationStatus = 'idle' | 'running' | 'arrived' | 'blocked';
const stopped = (): MovementIntent => ({ x: 0, z: 0, run: false, jump: false });
const distance = (a: PointXZ, b: PointXZ): number => Math.hypot(a.x - b.x, a.z - b.z, a.y !== undefined && b.y !== undefined ? a.y - b.y : 0);
const expanded = (b: WalkableBounds, radius = characterRadius): WalkableBounds => ({
  minX: b.minX - radius, maxX: b.maxX + radius,
  minZ: b.minZ - radius, maxZ: b.maxZ + radius,
});

export function isWalkable(p: PointXZ, world: WalkableWorld, capsule: Capsule = defaultCapsule): boolean {
  const query = worldQuery(world), position = { ...p, y: p.y ?? 0 };
  const surface = query.surfaceSample(position);
  if (!surface.ok) return false;
  if (query.capabilities.geometry === 'ground-volume' && p.y !== undefined && Math.abs(p.y - surface.value.height) > 1e-5) return false;
  position.y = surface.value.height;
  const region = query.regionSample(position, capsule), overlap = query.overlap(position, capsule);
  return region.ok && region.value.allowed && overlap.ok && !overlap.value;
}

export function segmentClear(a: PointXZ, b: PointXZ, world: WalkableWorld, capsule: Capsule = defaultCapsule): boolean {
  if (!isWalkable(a, world, capsule) || !isWalkable(b, world, capsule)) return false;
  const query = worldQuery(world), surface = query.surfaceSample({ ...a, y: a.y ?? 0 });
  if (!surface.ok) return false;
  if (query.groundSegment) {
    const target = query.surfaceSample({ ...b, y: b.y ?? 0 });
    if (!target.ok) return false;
    const result = query.groundSegment({ ...a, y: surface.value.height }, { ...b, y: target.value.height }, capsule);
    return result.ok && result.value;
  }
  const result = query.sweep({ ...a, y: surface.value.height }, { x: b.x - a.x, y: 0, z: b.z - a.z }, capsule);
  return result.ok && result.value === null;
}

function findPath(start: PointXZ, target: PointXZ, world: WalkableWorld, capsule: Capsule): PointXZ[] | undefined {
  if (!isWalkable(start, world, capsule) || !isWalkable(target, world, capsule)) return undefined;
  if (segmentClear(start, target, world, capsule)) return [{ ...target }];
  const nodes: PointXZ[] = [{ ...start }, { ...target }];
  for (const obstacle of world.obstacles) {
    const o = expanded(obstacle, capsule.radius);
    for (const x of [o.minX - 0.02, o.maxX + 0.02]) {
      for (const z of [o.minZ - 0.02, o.maxZ + 0.02]) {
        const point: PointXZ = { x, z };
        if (worldQuery(world).capabilities.geometry === 'ground-volume') {
          const surface = worldQuery(world).surfaceSample({ x, z, y: start.y ?? 0 });
          if (!surface.ok) continue;
          point.y = surface.value.height;
        }
        if (isWalkable(point, world, capsule)) nodes.push(point);
      }
    }
  }
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
  costs[0] = 0;
  for (;;) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i) && (current === -1 || costs[i]! < costs[current]!)) current = i;
    }
    if (current < 0 || !Number.isFinite(costs[current])) return undefined;
    if (current === 1) {
      const path: PointXZ[] = [];
      for (let i = 1; i !== 0; i = previous[i]!) path.unshift(nodes[i]!);
      return path;
    }
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i)) continue;
      const candidate = costs[current]! + distance(nodes[current]!, nodes[i]!);
      if (candidate < costs[i]! && segmentClear(nodes[current]!, nodes[i]!, world, capsule)) {
        costs[i] = candidate; previous[i] = current;
      }
    }
  }
}

export class DestinationNavigation {
  private path: PointXZ[] = [];
  private destination: PointXZ | undefined;
  private state: NavigationStatus = 'idle';
  private lastPosition: PointXZ | undefined;
  private stalled = 0;
  constructor(private readonly world: WalkableWorld, private readonly capsule: Capsule = defaultCapsule) {}
  get status(): NavigationStatus { return this.state; }
  get target(): Readonly<PointXZ> | undefined { return this.destination ? { ...this.destination } : undefined; }
  select(start: PointXZ, target: PointXZ): boolean {
    this.cancel();
    const path = findPath(start, target, this.world, this.capsule);
    if (!path) { this.reject(); return false; }
    this.path = path; this.destination = { ...target }; this.state = 'running';
    this.lastPosition = { ...start };
    return true;
  }
  cancel(): void {
    this.path = []; this.destination = undefined; this.lastPosition = undefined; this.stalled = 0; this.state = 'idle';
  }
  reject(): void { this.cancel(); this.state = 'blocked'; }
  sample(position: PointXZ, delta: number, speed = 4): MovementIntent {
    if (this.state !== 'running' || !this.destination) return stopped();
    if (distance(position, this.destination) <= 0.08) { this.path = []; this.state = 'arrived'; return stopped(); }
    const dt = Math.min(0.05, Math.max(0, Number.isFinite(delta) ? delta : 0));
    if (this.lastPosition && distance(position, this.lastPosition) < 0.001) this.stalled += dt;
    else { this.stalled = 0; this.lastPosition = { ...position }; }
    if (this.stalled >= 1.5) { this.reject(); return stopped(); }
    while (this.path.length > 1 && distance(position, this.path[0]!) <= 0.015) this.path.shift();
    const next = this.path[0]!;
    const d = distance(position, next);
    const divisor = Math.max(d, speed * dt, 1e-8);
    return { x: (next.x - position.x) / divisor, z: (next.z - position.z) / divisor, run: true, jump: false };
  }
}
