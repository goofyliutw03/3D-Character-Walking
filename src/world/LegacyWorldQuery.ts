import type { WalkableWorld } from '../character/motion';
import { RangePolicy } from './RangePolicy.ts';
import { finitePoint, type Capsule, type Point3, type QueryHit, type QueryResult, type RegionSample, type SurfaceSample, type WorldQuery } from './WorldQuery.ts';

/** Conservative legacy proxies remain solid at every Y; no ceiling or multilayer support. */
export class LegacyWorldQuery implements WorldQuery {
  readonly capabilities = Object.freeze({ geometry: 'planar-extrusion' as const, motion: ['ground'] as const, horizontalRaycast: true as const });
  private readonly range: RangePolicy;
  constructor(private readonly world: WalkableWorld) { this.range = new RangePolicy(world); }
  sweep(position: Point3, displacement: Point3, capsule: Capsule): QueryResult<QueryHit | null> {
    if (!finitePoint({ x: position.x + displacement.x, y: position.y + displacement.y, z: position.z + displacement.z })) {
      return { ok: false, error: 'invalid-input' };
    }
    return this.range.sweep(position, displacement, capsule);
  }
  overlap(position: Point3, capsule: Capsule): QueryResult<boolean> {
    const region = this.regionSample(position, capsule);
    return region.ok ? { ok: true, value: !region.value.allowed } : region;
  }
  raycast(origin: Point3, displacement: Point3): QueryResult<QueryHit | null> { return this.range.raycast(origin, displacement); }
  regionSample(position: Point3, capsule: Capsule): QueryResult<RegionSample> { return this.range.sample(position, capsule); }
  surfaceSample(position: Point3): QueryResult<SurfaceSample> {
    if (!finitePoint(position)) return { ok: false, error: 'invalid-input' };
    try {
      const height = this.world.groundHeight(position.x, position.z);
      return Number.isFinite(height) ? { ok: true, value: { height, surfaceId: 'legacy-ground' } } : { ok: false, error: 'unavailable' };
    } catch { return { ok: false, error: 'unavailable' }; }
  }
}

const adapters = new WeakMap<WalkableWorld, WorldQuery>();
export function worldQuery(world: WalkableWorld): WorldQuery {
  if (world.query) return world.query;
  let query = adapters.get(world);
  if (!query) { query = new LegacyWorldQuery(world); adapters.set(world, query); }
  return query;
}
