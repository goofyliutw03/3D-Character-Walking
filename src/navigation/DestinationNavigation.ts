import { characterRadius } from '../character/motion.ts';
import type { MovementIntent, NavigationPortal, WalkableBounds, WalkableWorld } from '../character/motion';
import { worldQuery } from '../world/LegacyWorldQuery.ts';
import { defaultCapsule, type Capsule, type Point3 } from '../world/WorldQuery.ts';

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

function routeLayers(portals: readonly NavigationPortal[], start: readonly number[], goal: readonly number[]): Set<number> {
  const parent = new Map(start.map(layer => [layer, undefined as number | undefined]));
  const queue = [...start];
  for (const layer of queue) {
    if (goal.includes(layer)) {
      const route = new Set([...start, ...goal]);
      for (let next = parent.get(layer); next !== undefined; next = parent.get(next)) route.add(next);
      return route;
    }
    for (const { lower, upper } of portals) {
      const next = lower.y === layer ? upper.y : upper.y === layer ? lower.y : undefined;
      if (next === undefined || parent.has(next)) continue;
      parent.set(next, layer);
      queue.push(next);
    }
  }
  return new Set();
}

type LinkCache = WeakMap<PointXZ, WeakMap<PointXZ, boolean>>;
const samePoint = (a: PointXZ, b: PointXZ): boolean => a.x === b.x && a.y === b.y && a.z === b.z;

function findPath(start: PointXZ, target: PointXZ, world: WalkableWorld, capsule: Capsule, cache: LinkCache): PointXZ[] | undefined {
  if (!isWalkable(start, world, capsule) || !isWalkable(target, world, capsule)) return undefined;
  const portals = world.navigationPortals;
  const atHeight = (point: PointXZ): Point3 => {
    const surface = worldQuery(world).surfaceSample({ ...point, y: point.y ?? 0 });
    return { ...point, y: surface.ok ? surface.value.height : point.y ?? 0 };
  };
  const startOnGround = portals && atHeight(start), goalOnGround = portals && atHeight(target);
  const from = startOnGround ?? start, to = goalOnGround ?? target;
  const startStair = startOnGround && portals?.find(portal => portal.contains(startOnGround));
  const goalStair = goalOnGround && portals?.find(portal => portal.contains(goalOnGround));
  const canConnectDirectly = !portals || (startStair || goalStair ? startStair === goalStair : from.y === to.y);
  if (canConnectDirectly && segmentClear(from, to, world, capsule)) return [{ ...to }];

  const layersOf = (point: PointXZ, stair?: NavigationPortal): number[] =>
    stair ? [stair.lower.y, stair.upper.y] : [point.y!];
  const layers = portals && routeLayers(portals, layersOf(from, startStair), layersOf(to, goalStair));
  if (layers?.size === 0) return undefined;
  const path = searchWaypoints(from, to, world, capsule, cache, startStair, goalStair, layers);
  // A blocked local route may need a detour through an otherwise unused floor.
  return path ?? (layers ? searchWaypoints(from, to, world, capsule, cache, startStair, goalStair) : undefined);
}

function searchWaypoints(start: PointXZ, target: PointXZ, world: WalkableWorld, capsule: Capsule,
  cache: LinkCache, startStair?: NavigationPortal, goalStair?: NavigationPortal, layers?: ReadonlySet<number>): PointXZ[] | undefined {
  const authored = world.navigationWaypoints;
  const portals = world.navigationPortals;
  const nodes: PointXZ[] = [start, target, ...(authored ?? []).filter(p => (!layers || layers.has(p.y)) && isWalkable(p, world, capsule))];
  for (const obstacle of authored ? [] : world.obstacles) {
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
  const heuristic = nodes.map(point => authored ? distance(point, target) : 0);
  const rejected = new Map<number, Set<number>>([[1, new Set([0])]]);
  const onLanding = (point: PointXZ, portal: NavigationPortal): boolean => samePoint(point, portal.lower) || samePoint(point, portal.upper);
  const edgeCost = (i: number, j: number): number => {
    const from = nodes[i]!, to = nodes[j]!;
    const length = distance(from, to);
    if (portals) {
      if (i === 0 && startStair) return onLanding(to, startStair) ? length : Infinity;
      if (j === 1 && goalStair) return onLanding(from, goalStair) ? length : Infinity;
      if (from.y !== to.y) {
        return portals.some(({ lower, upper }) =>
          (samePoint(from, lower) && samePoint(to, upper)) || (samePoint(from, upper) && samePoint(to, lower))) ? length : Infinity;
      }
      return i >= 2 && j >= 2 && length > 12 ? Infinity : length;
    }
    if (authored && i >= 2 && j >= 2 &&
      (length > 12 || (from.y !== to.y && (from.x !== to.x || Math.abs(from.z - to.z) < Math.abs(from.y! - to.y!))))) return Infinity;
    return length;
  };
  const linkIsClear = (i: number, j: number): boolean => {
    const from = nodes[i]!, to = nodes[j]!;
    if (!portals || i < 2 || j < 2) return segmentClear(from, to, world, capsule);
    let outgoing = cache.get(from);
    if (!outgoing) { outgoing = new WeakMap(); cache.set(from, outgoing); }
    const known = outgoing.get(to);
    if (known !== undefined) return known;
    const clear = segmentClear(from, to, world, capsule);
    outgoing.set(to, clear);
    return clear;
  };
  costs[0] = 0;
  for (;;) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i) && (current === -1 ||
        costs[i]! + heuristic[i]! < costs[current]! + heuristic[current]!)) current = i;
    }
    if (current < 0 || !Number.isFinite(costs[current])) return undefined;
    // Validate an authored edge only when its destination is next in the queue.
    // If blocked, restore the cheapest remaining candidate from settled nodes.
    const parent = previous[current]!;
    if (authored && parent >= 0 && !linkIsClear(parent, current)) {
      const blocked = rejected.get(current) ?? new Set<number>();
      blocked.add(parent);
      rejected.set(current, blocked);
      costs[current] = Infinity;
      previous[current] = -1;
      for (const from of visited) {
        if (blocked.has(from)) continue;
        const candidate = costs[from]! + edgeCost(from, current);
        if (candidate < costs[current]!) {
          costs[current] = candidate;
          previous[current] = from;
        }
      }
      continue;
    }
    if (current === 1) {
      const path: PointXZ[] = [];
      for (let i = 1; i !== 0; i = previous[i]!) path.unshift(nodes[i]!);
      return path;
    }
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || rejected.get(i)?.has(current)) continue;
      const candidate = costs[current]! + edgeCost(current, i);
      if (candidate < costs[i]! && (authored || segmentClear(nodes[current]!, nodes[i]!, world, capsule))) {
        costs[i] = candidate; previous[i] = current;
      }
    }
  }
}

export class DestinationNavigation {
  // Layered scene geometry and this controller's capsule are fixed for its lifetime.
  private readonly waypointLinks: LinkCache = new WeakMap();
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
    const path = findPath(start, target, this.world, this.capsule, this.waypointLinks);
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
