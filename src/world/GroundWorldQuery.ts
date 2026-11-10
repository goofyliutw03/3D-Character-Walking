import { RangePolicy, contactTolerance as epsilon, type Footprint } from './RangePolicy.ts';
import { capsuleBoxOverlap, sweepCapsuleBox, validBox, type SolidBox } from './CapsuleBox.ts';
import { finitePoint, validCapsule, type Capsule, type Point3, type QueryHit, type QueryResult,
  type RegionSample, type SurfaceSample, type SurfaceOptions, type WorldQuery } from './WorldQuery.ts';

export const maxStepHeight = .25;
export const minimumGroundNormal = Math.cos(Math.PI / 4);
export interface GroundSurface extends Footprint { id: string; height: number }
export interface GroundData {
  bounds: Footprint & { minY: number; maxY: number };
  solids: readonly SolidBox[];
  surfaces: readonly GroundSurface[];
  terrain?: {
    surfaceAt(x: number, z: number): { height: number; normal: Point3 };
    raycast(origin: Point3, delta: Point3): QueryHit | null;
  };
}
const ok = <T>(value: T): QueryResult<T> => ({ ok: true, value });
const invalid = { ok: false, error: 'invalid-input' } as const;
const unavailable = { ok: false, error: 'unavailable' } as const;
const within = (p: Point3, b: Footprint): boolean => p.x >= b.minX - epsilon && p.x <= b.maxX + epsilon &&
  p.z >= b.minZ - epsilon && p.z <= b.maxZ + epsilon;
const validFootprint = (b: Footprint): boolean => [b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite) && b.minX < b.maxX && b.minZ < b.maxZ;

/** Feet follow declared support surfaces; finite solid contact uses an upright capsule, not an expanded box. */
export class GroundWorldQuery implements WorldQuery {
  readonly capabilities = Object.freeze({ geometry: 'ground-volume' as const, motion: ['ground'] as const, horizontalRaycast: true as const });
  private readonly range: RangePolicy;
  constructor(private readonly data: GroundData) { this.range = new RangePolicy({ bounds: data.bounds, obstacles: [] }); }
  private ready(): boolean {
    const b = this.data.bounds;
    return validFootprint(b) && Number.isFinite(b.minY) && Number.isFinite(b.maxY) && b.minY < b.maxY &&
      this.data.solids.every(validBox) && this.data.surfaces.every(s => validFootprint(s) && !!s.id && Number.isFinite(s.height));
  }
  regionSample(p: Point3, c: Capsule): QueryResult<RegionSample> {
    if (!finitePoint(p) || !validCapsule(c)) return invalid;
    if (!this.ready()) return unavailable;
    const r = this.range.sample(p, c);
    if (!r.ok) return r;
    const allowed = r.value.allowed && p.y >= this.data.bounds.minY - epsilon && p.y + c.height <= this.data.bounds.maxY + epsilon;
    const terrain = this.data.terrain?.surfaceAt(p.x,p.z);
    if (terrain && (!Number.isFinite(terrain.height) || !finitePoint(terrain.normal))) return unavailable;
    const solid = allowed && (this.data.solids.some(b => capsuleBoxOverlap(p,c,b)) ||
      !!terrain && p.y < terrain.height-epsilon);
    return ok({ allowed: allowed && !solid, regionId: 'ground-range', reason: !allowed ? 'boundary' : solid ? 'solid' : null });
  }
  overlap(p: Point3, c: Capsule): QueryResult<boolean> {
    const r = this.regionSample(p,c);
    return r.ok ? ok(!r.value.allowed) : r;
  }
  sweep(p: Point3, d: Point3, c: Capsule): QueryResult<QueryHit | null> {
    if (!finitePoint(p) || !finitePoint(d) || !validCapsule(c) ||
      !finitePoint({ x:p.x+d.x,y:p.y+d.y,z:p.z+d.z })) return invalid;
    const start = this.overlap(p,c);
    if (!start.ok) return start;
    if (start.value) return unavailable;
    const horizontal = this.range.sweep(p,d,c);
    if (!horizontal.ok) return horizontal;
    let hit = horizontal.value;
    const select = (candidate: QueryHit | null): void => { if (candidate && (!hit || candidate.fraction < hit.fraction)) hit = candidate; };
    const low = this.data.bounds.minY, high = this.data.bounds.maxY - c.height;
    if (p.y+d.y < low-epsilon || p.y+d.y > high+epsilon) select({
      fraction: Math.max(0, ((d.y < 0 ? low : high) - p.y) / d.y),
      normal: {x:0,y:d.y<0?1:-1,z:0},layer:'boundary',id:'ground-range',
    });
    for (const b of this.data.solids) {
      const contact = sweepCapsuleBox(p,d,c,b);
      if (contact) {
        const surface = this.data.surfaces.find(s => Math.abs(s.height-b.maxY)<epsilon &&
          s.minX===b.minX && s.maxX===b.maxX && s.minZ===b.minZ && s.maxZ===b.maxZ);
        if (surface) contact.stepSurface={height:surface.height,id:surface.id};
      }
      select(contact);
    }
    const terrainHit = this.data.terrain?.raycast(p,d);
    if (terrainHit && d.x*terrainHit.normal.x+d.y*terrainHit.normal.y+d.z*terrainHit.normal.z < -epsilon) select(terrainHit);
    return ok(hit);
  }
  surfaceSample(p: Point3, options: SurfaceOptions = {}): QueryResult<SurfaceSample> {
    const rise = options.maxRise ?? maxStepHeight;
    if (!finitePoint(p) || !Number.isFinite(rise) || rise < 0) return invalid;
    if (!this.ready() || !within(p,this.data.bounds)) return unavailable;
    let sample: SurfaceSample | undefined;
    if (this.data.terrain) {
      const s = this.data.terrain.surfaceAt(p.x,p.z);
      if (!Number.isFinite(s.height) || !finitePoint(s.normal)) return unavailable;
      sample = { ...s, surfaceId:'terrain-ground' };
    }
    for (const s of this.data.surfaces) if (within(p,s) && s.height <= p.y+rise+epsilon && (!sample || s.height > sample.height)) {
      sample = { height:s.height,normal:{x:0,y:1,z:0},surfaceId:s.id };
    }
    return sample ? ok(sample) : unavailable;
  }
  raycast(p: Point3, d: Point3): QueryResult<QueryHit | null> {
    if (!finitePoint(p) || !finitePoint(d) || !finitePoint({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z})) return invalid;
    if (!this.ready()) return unavailable;
    let hit = this.data.terrain?.raycast(p,d) ?? null;
    // A zero-radius ray is the limiting slab case, with explicit contact normal.
    for (const b of this.data.solids) {
      let enter=0,leave=1,normal:Point3={x:0,y:0,z:0};
      for (const [axis,low,high] of [['x',b.minX,b.maxX],['y',b.minY,b.maxY],['z',b.minZ,b.maxZ]] as const) {
        if (!d[axis]) { if(p[axis]<low || p[axis]>high) {leave=-1;break;} continue; }
        const a=(low-p[axis])/d[axis],z=(high-p[axis])/d[axis],near=Math.min(a,z);
        if(near>enter){enter=near;normal={x:0,y:0,z:0};normal[axis]=d[axis]>0?-1:1;}
        leave=Math.min(leave,Math.max(a,z));
      }
      if(enter<=leave && (!hit || enter<hit.fraction)) hit={fraction:enter,normal,layer:'solid',id:b.id};
    }
    for (const s of this.data.surfaces) {
      if (!d.y) continue;
      const t=(s.height-p.y)/d.y;
      if(t>=0 && t<=1 && (!hit || t<hit.fraction) && within({x:p.x+d.x*t,y:s.height,z:p.z+d.z*t},s))
        hit={fraction:t,normal:{x:0,y:1,z:0},id:s.id,layer:'solid'};
    }
    return ok(hit);
  }
  groundSegment(start: Point3, end: Point3, capsule: Capsule): QueryResult<boolean> {
    if (!finitePoint(start) || !finitePoint(end) || !validCapsule(capsule)) return invalid;
    const steps = Math.max(1,Math.ceil(Math.hypot(end.x-start.x,end.z-start.z)/.1));
    if (steps > 10000) return invalid;
    let previous={...start};
    const initial=this.overlap(previous,capsule);
    if(!initial.ok) return initial;
    if(initial.value) return ok(false);
    for(let i=1;i<=steps;i++){
      const next={x:start.x+(end.x-start.x)*i/steps,y:previous.y,z:start.z+(end.z-start.z)*i/steps};
      const surface=this.surfaceSample(next);
      if(!surface.ok) return surface;
      next.y=surface.value.height;
      if((surface.value.normal?.y ?? 1)<minimumGroundNormal || Math.abs(next.y-previous.y)>maxStepHeight+epsilon) return ok(false);
      const horizontal={x:next.x-previous.x,y:0,z:next.z-previous.z};
      if(this.data.terrain) {
        const sweep=this.sweep(previous,{...horizontal,y:next.y-previous.y},capsule);
        if(!sweep.ok) return sweep;
        if(sweep.value && sweep.value.fraction<1-epsilon) return ok(false);
        previous=next; continue;
      }
      let elevated={...previous};
      const direct=this.sweep(previous,horizontal,capsule);
      if(!direct.ok) return direct;
      if(direct.value || next.y>previous.y+epsilon){
        const up=this.sweep(previous,{x:0,y:maxStepHeight,z:0},capsule);
        if(!up.ok) return up;
        if(up.value && up.value.fraction<1-epsilon) return ok(false);
        elevated.y+=maxStepHeight;
        const across=this.sweep(elevated,horizontal,capsule);
        if(!across.ok) return across;
        if(across.value && across.value.fraction<1-epsilon) return ok(false);
      }
      const destination={...next,y:elevated.y};
      const down={x:0,y:next.y-elevated.y,z:0};
      const landing=this.sweep(destination,down,capsule);
      if(!landing.ok) return landing;
      if(landing.value && landing.value.normal.y<=epsilon) return ok(false);
      destination.y+=down.y*(landing.value?.fraction??1);
      const valid=this.overlap(destination,capsule);
      if(!valid.ok) return valid;
      if(valid.value) return ok(false);
      previous=destination;
    }
    return ok(Math.abs(previous.y-end.y)<1e-5);
  }
}
