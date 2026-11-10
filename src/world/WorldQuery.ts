export interface Point3 { x: number; y: number; z: number }
/** Upright capsule, positioned at its feet. Planar adapters use its conservative XZ envelope. */
export interface Capsule { readonly radius: number; readonly height: number }
export const defaultCapsule: Capsule = Object.freeze({ radius: .28, height: 1.8 });
export type QueryError = 'invalid-input' | 'unavailable' | 'unsupported';
export type QueryResult<T> = { ok: true; value: T } | { ok: false; error: QueryError };
export interface QueryHit {
  fraction: number;
  normal: Point3;
  layer: 'solid' | 'boundary';
  id: string;
  stepSurface?: { height: number; id: string };
}
export interface RegionSample { allowed: boolean; regionId: string; reason: 'solid' | 'boundary' | null }
export interface SurfaceSample { height: number; surfaceId: string; normal?: Point3 }
export interface SurfaceOptions { maxRise?: number }
export interface WorldQuery {
  readonly capabilities: {
    readonly geometry: 'planar-extrusion' | 'ground-volume';
    readonly motion: readonly ['ground'];
    readonly horizontalRaycast: true;
  };
  sweep(position: Point3, displacement: Point3, capsule: Capsule): QueryResult<QueryHit | null>;
  overlap(position: Point3, capsule: Capsule): QueryResult<boolean>;
  raycast(origin: Point3, displacement: Point3): QueryResult<QueryHit | null>;
  surfaceSample(position: Point3, options?: SurfaceOptions): QueryResult<SurfaceSample>;
  regionSample(position: Point3, capsule: Capsule): QueryResult<RegionSample>;
  groundSegment?(start: Point3, end: Point3, capsule: Capsule): QueryResult<boolean>;
}
export const finitePoint = (p: Point3): boolean => [p.x, p.y, p.z].every(Number.isFinite);
export const validCapsule = (c: Capsule): boolean =>
  Number.isFinite(c.radius) && Number.isFinite(c.height) && c.radius > 0 && c.height >= 2 * c.radius;
