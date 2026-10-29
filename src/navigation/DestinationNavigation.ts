import { characterRadius } from '../character/motion.ts';
import type { MovementIntent, WalkableBounds, WalkableWorld } from '../character/motion';

export interface PointXZ { x: number; z: number }
export type NavigationStatus = 'idle' | 'running' | 'arrived' | 'blocked';
const stopped = (): MovementIntent => ({ x: 0, z: 0, run: false, jump: false });
const distance = (a: PointXZ, b: PointXZ): number => Math.hypot(a.x - b.x, a.z - b.z);
const expanded = (b: WalkableBounds): WalkableBounds => ({
  minX: b.minX - characterRadius, maxX: b.maxX + characterRadius,
  minZ: b.minZ - characterRadius, maxZ: b.maxZ + characterRadius,
});

export function isWalkable(p: PointXZ, world: WalkableWorld): boolean {
  const b = world.bounds;
  return Number.isFinite(p.x + p.z)
    && p.x >= b.minX + characterRadius && p.x <= b.maxX - characterRadius
    && p.z >= b.minZ + characterRadius && p.z <= b.maxZ - characterRadius
    && !world.obstacles.some(obstacle => {
      const o = expanded(obstacle);
      return p.x > o.minX + 1e-8 && p.x < o.maxX - 1e-8 && p.z > o.minZ + 1e-8 && p.z < o.maxZ - 1e-8;
    });
}

export function segmentClear(a: PointXZ, b: PointXZ, world: WalkableWorld): boolean {
  if (!isWalkable(a, world) || !isWalkable(b, world)) return false;
  return !world.obstacles.some(obstacle => {
    const o = expanded(obstacle);
    let enter = 0, leave = 1;
    for (const axis of ['x', 'z'] as const) {
      const low = (axis === 'x' ? o.minX : o.minZ) + 1e-8;
      const high = (axis === 'x' ? o.maxX : o.maxZ) - 1e-8;
      const delta = b[axis] - a[axis];
      if (Math.abs(delta) < 1e-12) {
        if (a[axis] <= low || a[axis] >= high) return false;
      } else {
        const t1 = (low - a[axis]) / delta, t2 = (high - a[axis]) / delta;
        enter = Math.max(enter, Math.min(t1, t2));
        leave = Math.min(leave, Math.max(t1, t2));
        if (enter >= leave) return false;
      }
    }
    return enter < leave && leave > 0 && enter < 1;
  });
}

function findPath(start: PointXZ, target: PointXZ, world: WalkableWorld): PointXZ[] | undefined {
  if (!isWalkable(start, world) || !isWalkable(target, world)) return undefined;
  if (segmentClear(start, target, world)) return [{ ...target }];
  const nodes: PointXZ[] = [{ ...start }, { ...target }];
  for (const obstacle of world.obstacles) {
    const o = expanded(obstacle);
    for (const x of [o.minX - 0.02, o.maxX + 0.02]) {
      for (const z of [o.minZ - 0.02, o.maxZ + 0.02]) {
        if (isWalkable({ x, z }, world)) nodes.push({ x, z });
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
      if (candidate < costs[i]! && segmentClear(nodes[current]!, nodes[i]!, world)) {
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
  constructor(private readonly world: WalkableWorld) {}
  get status(): NavigationStatus { return this.state; }
  get target(): Readonly<PointXZ> | undefined { return this.destination ? { ...this.destination } : undefined; }
  select(start: PointXZ, target: PointXZ): boolean {
    this.cancel();
    const path = findPath(start, target, this.world);
    if (!path) { this.reject(); return false; }
    this.path = path; this.destination = { ...target }; this.state = 'running';
    this.lastPosition = { ...start };
    return true;
  }
  cancel(): void {
    this.path = []; this.destination = undefined; this.lastPosition = undefined; this.stalled = 0; this.state = 'idle';
  }
  reject(): void { this.cancel(); this.state = 'blocked'; }
  sample(position: PointXZ, delta: number): MovementIntent {
    if (this.state !== 'running' || !this.destination) return stopped();
    if (distance(position, this.destination) <= 0.08) { this.path = []; this.state = 'arrived'; return stopped(); }
    const dt = Math.min(0.05, Math.max(0, Number.isFinite(delta) ? delta : 0));
    if (this.lastPosition && distance(position, this.lastPosition) < 0.001) this.stalled += dt;
    else { this.stalled = 0; this.lastPosition = { ...position }; }
    if (this.stalled >= 1.5) { this.reject(); return stopped(); }
    while (this.path.length > 1 && distance(position, this.path[0]!) <= 0.015) this.path.shift();
    const next = this.path[0]!;
    const d = distance(position, next);
    const divisor = Math.max(d, 4 * dt, 1e-8);
    return { x: (next.x - position.x) / divisor, z: (next.z - position.z) / divisor, run: true, jump: false };
  }
}
