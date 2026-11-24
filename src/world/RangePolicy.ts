import { finitePoint, validCapsule, type Capsule, type Point3, type QueryHit, type QueryResult, type RegionSample } from './WorldQuery.ts';

export interface Footprint { minX: number; maxX: number; minZ: number; maxZ: number }
export interface PlanarRegions { readonly bounds?: Footprint; readonly obstacles: readonly Footprint[] }
export const contactTolerance = 1e-8;
const validBounds = (b: Footprint): boolean =>
  [b.minX, b.maxX, b.minZ, b.maxZ].every(Number.isFinite) && b.minX < b.maxX && b.minZ < b.maxZ;
const expanded = (b: Footprint, r: number): Footprint =>
  ({ minX: b.minX - r, maxX: b.maxX + r, minZ: b.minZ - r, maxZ: b.maxZ + r });
const inside = (p: Point3, b: Footprint): boolean =>
  p.x > b.minX + contactTolerance && p.x < b.maxX - contactTolerance &&
  p.z > b.minZ + contactTolerance && p.z < b.maxZ - contactTolerance;

/** Continuous intersection with an open rectangle; touching and tangential motion are legal. */
function intersect(p: Point3, d: Point3, b: Footprint, id: string): QueryHit | null {
  let enter = -Infinity, leave = Infinity;
  let innerEnter = -Infinity, innerLeave = Infinity;
  let normal: Point3 = { x: 0, y: 0, z: 0 };
  for (const axis of ['x', 'z'] as const) {
    const low = axis === 'x' ? b.minX : b.minZ;
    const high = axis === 'x' ? b.maxX : b.maxZ;
    if (d[axis] === 0) {
      if (p[axis] <= low + contactTolerance || p[axis] >= high - contactTolerance) return null;
    } else {
      const t1 = (low - p[axis]) / d[axis], t2 = (high - p[axis]) / d[axis];
      const near = Math.min(t1, t2);
      const innerT1 = (low + contactTolerance - p[axis]) / d[axis];
      const innerT2 = (high - contactTolerance - p[axis]) / d[axis];
      innerEnter = Math.max(innerEnter, Math.min(innerT1, innerT2));
      innerLeave = Math.min(innerLeave, Math.max(innerT1, innerT2));
      if (near > enter) {
        enter = near;
        normal = { x: 0, y: 0, z: 0 }; normal[axis] = d[axis] > 0 ? -1 : 1;
      }
      leave = Math.min(leave, Math.max(t1, t2));
    }
  }
  if (enter >= leave || leave <= 0 || enter >= 1 || innerEnter >= innerLeave || innerLeave <= 0 || innerEnter >= 1) return null;
  if (inside(p, b)) return { fraction: 0, normal: { x: 0, y: 0, z: 0 }, layer: 'solid', id };
  return { fraction: Math.max(0, enter), normal, layer: 'solid', id };
}

/** City compatibility: one allowed footprint minus infinitely extruded solid footprints. */
export class RangePolicy {
  constructor(private readonly regions: PlanarRegions) {}
  private ready(): boolean {
    return !!this.regions.bounds && validBounds(this.regions.bounds) && this.regions.obstacles.every(validBounds);
  }
  sample(position: Point3, capsule: Capsule): QueryResult<RegionSample> {
    if (!finitePoint(position) || !validCapsule(capsule)) return { ok: false, error: 'invalid-input' };
    if (!this.ready()) return { ok: false, error: 'unavailable' };
    const b = this.regions.bounds!, r = capsule.radius, e = contactTolerance;
    if (b.maxX - b.minX < 2 * r || b.maxZ - b.minZ < 2 * r ||
      position.x < b.minX + r - e || position.x > b.maxX - r + e ||
      position.z < b.minZ + r - e || position.z > b.maxZ - r + e) {
      return { ok: true, value: { allowed: false, regionId: 'legacy-range', reason: 'boundary' } };
    }
    const blocked = this.regions.obstacles.some(o => inside(position, expanded(o, r)));
    return { ok: true, value: { allowed: !blocked, regionId: 'legacy-range', reason: blocked ? 'solid' : null } };
  }
  sweep(position: Point3, displacement: Point3, capsule: Capsule): QueryResult<QueryHit | null> {
    if (!finitePoint(displacement) || !finitePoint({ x: position.x + displacement.x, y: position.y + displacement.y,
      z: position.z + displacement.z })) return { ok: false, error: 'invalid-input' };
    const start = this.sample(position, capsule);
    if (!start.ok) return start;
    if (!start.value.allowed) return { ok: false, error: 'unavailable' };
    const b = this.regions.bounds!, r = capsule.radius;
    let hit: QueryHit | null = null;
    for (const axis of ['x', 'z'] as const) {
      const low = (axis === 'x' ? b.minX : b.minZ) + r;
      const high = (axis === 'x' ? b.maxX : b.maxZ) - r;
      const end = position[axis] + displacement[axis];
      if (!Number.isFinite(end)) return { ok: false, error: 'invalid-input' };
      if (end < low - contactTolerance || end > high + contactTolerance) {
        const fraction = Math.max(0, ((end < low ? low : high) - position[axis]) / displacement[axis]);
        const normal: Point3 = { x: 0, y: 0, z: 0 }; normal[axis] = end < low ? 1 : -1;
        if (!hit || fraction < hit.fraction) hit = { fraction, normal, layer: 'boundary', id: 'legacy-range' };
      }
    }
    for (let i = 0; i < this.regions.obstacles.length; i++) {
      const candidate = intersect(position, displacement, expanded(this.regions.obstacles[i]!, r), `legacy-solid-${i}`);
      if (candidate && (!hit || candidate.fraction < hit.fraction)) hit = candidate;
    }
    return { ok: true, value: hit };
  }
  raycast(origin: Point3, displacement: Point3): QueryResult<QueryHit | null> {
    if (!finitePoint(origin) || !finitePoint(displacement) ||
      !finitePoint({ x: origin.x + displacement.x, y: origin.y + displacement.y, z: origin.z + displacement.z })) {
      return { ok: false, error: 'invalid-input' };
    }
    if (displacement.y !== 0) return { ok: false, error: 'unsupported' };
    if (!this.ready()) return { ok: false, error: 'unavailable' };
    let hit: QueryHit | null = null;
    for (let i = 0; i < this.regions.obstacles.length; i++) {
      const candidate = intersect(origin, displacement, this.regions.obstacles[i]!, `legacy-solid-${i}`);
      if (candidate && (!hit || candidate.fraction < hit.fraction)) hit = candidate;
    }
    return { ok: true, value: hit };
  }
}
