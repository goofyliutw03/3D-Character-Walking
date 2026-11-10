import type { Capsule, Point3, QueryHit } from './WorldQuery.ts';
import { contactTolerance as epsilon } from './RangePolicy.ts';

export interface SolidBox {
  id: string; minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number;
}
export const validBox = (b: SolidBox): boolean => !!b.id &&
  [b.minX, b.maxX, b.minY, b.maxY, b.minZ, b.maxZ].every(Number.isFinite) &&
  b.minX < b.maxX && b.minY < b.maxY && b.minZ < b.maxZ;

/** Signed nearest separation from a box to the capsule's vertical centre segment. */
function gaps(p: Point3, c: Capsule, b: SolidBox): Point3 {
  return {
    x: p.x < b.minX ? p.x - b.minX : p.x > b.maxX ? p.x - b.maxX : 0,
    y: p.y + c.height - c.radius < b.minY ? p.y + c.height - c.radius - b.minY
      : p.y + c.radius > b.maxY ? p.y + c.radius - b.maxY : 0,
    z: p.z < b.minZ ? p.z - b.minZ : p.z > b.maxZ ? p.z - b.maxZ : 0,
  };
}
export function capsuleBoxOverlap(p: Point3, c: Capsule, b: SolidBox): boolean {
  const g = gaps(p, c, b);
  return Math.hypot(g.x, g.y, g.z) < c.radius - epsilon;
}

/** Exact continuous upright capsule/AABB contact, split at the distance function's knots. */
export function sweepCapsuleBox(p: Point3, d: Point3, c: Capsule, b: SolidBox): QueryHit | null {
  if (Math.max(p.x, p.x + d.x) + c.radius < b.minX || Math.min(p.x, p.x + d.x) - c.radius > b.maxX ||
    Math.max(p.z, p.z + d.z) + c.radius < b.minZ || Math.min(p.z, p.z + d.z) - c.radius > b.maxZ ||
    Math.max(p.y, p.y + d.y) + c.height < b.minY || Math.min(p.y, p.y + d.y) > b.maxY) return null;
  const at = (t: number): Point3 => ({ x: p.x + d.x * t, y: p.y + d.y * t, z: p.z + d.z * t });
  const times = [0, 1];
  for (const [axis, low, high] of [
    ['x', b.minX, b.maxX], ['y', b.minY - c.height + c.radius, b.maxY - c.radius],
    ['z', b.minZ, b.maxZ],
  ] as const) {
    if (d[axis] === 0) continue;
    for (const limit of [low, high]) {
      const t = (limit - p[axis]) / d[axis];
      if (t > 0 && t < 1) times.push(t);
    }
  }
  times.sort((a, z) => a - z);
  for (let i = 0; i < times.length - 1; i++) {
    const lo = times[i]!, hi = times[i + 1]!, mid = (lo + hi) / 2;
    if (hi - lo < 1e-14) continue;
    const g = gaps(at(mid), c, b), intercept: Point3 = { x: 0, y: 0, z: 0 }, slope: Point3 = { x: 0, y: 0, z: 0 };
    let a = 0, dot = 0, constant = -c.radius * c.radius;
    for (const axis of ['x', 'y', 'z'] as const) {
      slope[axis] = g[axis] === 0 ? 0 : d[axis];
      intercept[axis] = g[axis] - slope[axis] * mid;
      a += slope[axis] ** 2; dot += slope[axis] * intercept[axis]; constant += intercept[axis] ** 2;
    }
    const minimum = a ? Math.max(lo, Math.min(hi, -dot / a)) : lo;
    const q = gaps(at(minimum), c, b);
    if (Math.hypot(q.x, q.y, q.z) >= c.radius - epsilon) continue;
    const root = a ? (-dot - Math.sqrt(Math.max(0, dot * dot - a * constant))) / a : lo;
    const fraction = Math.max(lo, root, 0) < 1e-14 ? 0 : Math.max(lo, root, 0);
    if (fraction >= 1) continue;
    const n = gaps(at(fraction), c, b), length = Math.hypot(n.x, n.y, n.z);
    return { fraction, normal: length > 0 ? { x: n.x / length, y: n.y / length, z: n.z / length }
      : { x: 0, y: 0, z: 0 }, id: b.id, layer: 'solid' };
  }
  return null;
}
