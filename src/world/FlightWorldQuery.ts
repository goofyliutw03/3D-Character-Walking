import { GroundWorldQuery, type GroundData } from './GroundWorldQuery.ts';
import { capsuleBoxOverlap, sweepCapsuleBox, validBox, type SolidBox } from './CapsuleBox.ts';
import { finitePoint, validCapsule, type Capsule, type Point3, type QueryHit, type QueryResult,
  type RegionSample, type SurfaceOptions, type WorldQuery } from './WorldQuery.ts';

export interface FlightData extends GroundData { forbidden: readonly SolidBox[] }
export interface FlightWarning { id: string; distance: number; normal: Point3 }
/** One allowed finite box minus forbidden boxes. Clouds and decoration never enter this query. */
export class FlightWorldQuery implements WorldQuery {
  readonly capabilities = Object.freeze({ geometry: 'ground-volume' as const,
    motion: ['ground', 'flight'] as const, horizontalRaycast: true as const });
  private readonly ground: GroundWorldQuery;
  constructor(private readonly data: FlightData) { this.ground = new GroundWorldQuery(data); }
  regionSample(p: Point3, c: Capsule): QueryResult<RegionSample> {
    if (!this.data.forbidden.every(validBox)) return { ok: false, error: 'unavailable' };
    const base = this.ground.regionSample(p,c);
    if (!base.ok || !base.value.allowed) return base;
    const denied = this.data.forbidden.find(b => capsuleBoxOverlap(p,c,b));
    return { ok: true, value: { allowed: !denied, regionId: denied?.id ?? 'flight-range', reason: denied ? 'boundary' : null } };
  }
  overlap(p: Point3,c: Capsule): QueryResult<boolean> {
    const r=this.regionSample(p,c); return r.ok ? {ok:true,value:!r.value.allowed} : r;
  }
  sweep(p: Point3,d: Point3,c: Capsule): QueryResult<QueryHit|null> {
    const start=this.overlap(p,c);
    if(!start.ok) return start;
    if(start.value) return {ok:false,error:'unavailable'};
    const base=this.ground.sweep(p,d,c);
    if(!base.ok) return base;
    let hit=base.value;
    for(const b of this.data.forbidden){
      const next=sweepCapsuleBox(p,d,c,b);
      if(next && (!hit || next.fraction<hit.fraction)) hit={...next,layer:'boundary'};
    }
    return {ok:true,value:hit};
  }
  surfaceSample(p:Point3,options?:SurfaceOptions) { return this.ground.surfaceSample(p,options); }
  raycast(p:Point3,d:Point3) { return this.ground.raycast(p,d); }
  groundSegment(start:Point3,end:Point3,c:Capsule):QueryResult<boolean> {
    const path=this.ground.groundSegment(start,end,c);
    if(!path.ok || !path.value) return path;
    const sweep=this.sweep(start,{x:end.x-start.x,y:end.y-start.y,z:end.z-start.z},c);
    return sweep.ok ? {ok:true,value:!sweep.value} : sweep;
  }
  warning(p:Point3,c:Capsule):FlightWarning|null {
    if(!finitePoint(p)||!validCapsule(c)||!this.regionSample(p,c).ok) return null;
    const b=this.data.bounds;
    const candidates:FlightWarning[]=[
      {id:'flight-range',distance:p.x-b.minX-c.radius,normal:{x:1,y:0,z:0}},
      {id:'flight-range',distance:b.maxX-p.x-c.radius,normal:{x:-1,y:0,z:0}},
      {id:'flight-range',distance:p.z-b.minZ-c.radius,normal:{x:0,y:0,z:1}},
      {id:'flight-range',distance:b.maxZ-p.z-c.radius,normal:{x:0,y:0,z:-1}},
      {id:'flight-range',distance:p.y-b.minY,normal:{x:0,y:1,z:0}},
      {id:'flight-range',distance:b.maxY-p.y-c.height,normal:{x:0,y:-1,z:0}},
    ];
    for(const box of this.data.forbidden){
      // Conservative capsule envelope for warning only; the hard boundary uses rounded capsule geometry.
      const dx=p.x-Math.max(box.minX-c.radius,Math.min(box.maxX+c.radius,p.x));
      const dy=p.y-Math.max(box.minY-c.height,Math.min(box.maxY,p.y));
      const dz=p.z-Math.max(box.minZ-c.radius,Math.min(box.maxZ+c.radius,p.z));
      const distance=Math.hypot(dx,dy,dz);
      if(distance>1e-10)candidates.push({id:box.id,distance,normal:{x:dx/distance,y:dy/distance,z:dz/distance}});
    }
    return candidates.sort((a,z)=>a.distance-z.distance||a.id.localeCompare(z.id)).find(w=>w.distance<3)??null;
  }
}
