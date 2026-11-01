import type { WalkableBounds } from '../character/motion';

export interface SurfacePoint { x: number; z: number }
export interface NavPortal { readonly to: number; readonly point: Readonly<SurfacePoint> }
export interface NavPolygon extends WalkableBounds {
  readonly id: number;
  readonly center: Readonly<SurfacePoint>;
  readonly portals: readonly NavPortal[];
}
const eps = 1e-7;
const inside = (p: SurfacePoint, b: WalkableBounds): boolean => p.x >= b.minX-eps && p.x <= b.maxX+eps && p.z >= b.minZ-eps && p.z <= b.maxZ+eps;
const distance = (a: SurfacePoint,b: SurfacePoint): number => Math.hypot(a.x-b.x,a.z-b.z);

/** Exact planar convex decomposition at surface/obstacle boundaries, not a resolution grid.
 * Surfaces describe agent-center space; obstacles are expanded for the supplied radius. */
export class SurfaceNavMesh {
  readonly polygons: readonly NavPolygon[];
  constructor(surfaces: readonly WalkableBounds[], obstacles: readonly WalkableBounds[], radius: number) {
    const valid = (b: WalkableBounds): boolean => [b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite) && b.maxX>b.minX && b.maxZ>b.minZ;
    if (!Number.isFinite(radius) || radius<0 || !surfaces.every(valid) || !obstacles.every(valid)) throw new Error('Invalid navigation surfaces.');
    const expanded = obstacles.map(b=>({minX:b.minX-radius,maxX:b.maxX+radius,minZ:b.minZ-radius,maxZ:b.maxZ+radius}));
    const all = [...surfaces,...expanded];
    const xs=[...new Set(all.flatMap(b=>[b.minX,b.maxX]))].sort((a,b)=>a-b);
    const zs=[...new Set(all.flatMap(b=>[b.minZ,b.maxZ]))].sort((a,b)=>a-b);
    const polygons: (NavPolygon & {portals: NavPortal[]})[]=[];
    for(let i=1;i<xs.length;i++) for(let j=1;j<zs.length;j++) {
      const center={x:(xs[i-1]!+xs[i]!)/2,z:(zs[j-1]!+zs[j]!)/2};
      if(!surfaces.some(b=>inside(center,b)) || expanded.some(b=>inside(center,b))) continue;
      polygons.push({id:polygons.length,minX:xs[i-1]!,maxX:xs[i]!,minZ:zs[j-1]!,maxZ:zs[j]!,center,portals:[]});
    }
    for(let i=0;i<polygons.length;i++) for(let j=i+1;j<polygons.length;j++) {
      const a=polygons[i]!,b=polygons[j]!;
      let point: SurfacePoint | undefined;
      const loZ=Math.max(a.minZ,b.minZ),hiZ=Math.min(a.maxZ,b.maxZ);
      const loX=Math.max(a.minX,b.minX),hiX=Math.min(a.maxX,b.maxX);
      if(hiZ-loZ>eps && (Math.abs(a.maxX-b.minX)<eps || Math.abs(b.maxX-a.minX)<eps))
        point={x:Math.abs(a.maxX-b.minX)<eps?a.maxX:b.maxX,z:(loZ+hiZ)/2};
      else if(hiX-loX>eps && (Math.abs(a.maxZ-b.minZ)<eps || Math.abs(b.maxZ-a.minZ)<eps))
        point={x:(loX+hiX)/2,z:Math.abs(a.maxZ-b.minZ)<eps?a.maxZ:b.maxZ};
      if(point) {a.portals.push(Object.freeze({to:b.id,point:Object.freeze(point)}));b.portals.push(Object.freeze({to:a.id,point:Object.freeze({...point})}));}
    }
    this.polygons=Object.freeze(polygons.map(p=>Object.freeze({...p,center:Object.freeze(p.center),portals:Object.freeze(p.portals)})));
  }
  contains(point: SurfacePoint): boolean {return Number.isFinite(point.x)&&Number.isFinite(point.z)&&this.polygons.some(p=>inside(point,p));}
  segmentContains(a:SurfacePoint,b:SurfacePoint):boolean {
    if(!this.contains(a)||!this.contains(b))return false;
    if(this.polygons.some(p=>inside(a,p)&&inside(b,p)))return true;
    const spans:[number,number][]=[];
    for(const p of this.polygons) {
      let lo=0,hi=1;
      for(const [start,delta,min,max] of [[a.x,b.x-a.x,p.minX,p.maxX],[a.z,b.z-a.z,p.minZ,p.maxZ]]) {
        if(Math.abs(delta!)<eps) {if(start!<min!-eps||start!>max!+eps){hi=-1;break;}}
        else {const t1=(min!-start!)/delta!,t2=(max!-start!)/delta!;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));}
      }
      if(hi>=lo-eps)spans.push([lo,hi]);
    }
    spans.sort((x,y)=>x[0]-y[0]);let covered=0;
    for(const [lo,hi] of spans) {if(lo>covered+eps)return false;covered=Math.max(covered,hi);if(covered>=1-eps)return true;}
    return false;
  }
  findPath(start: SurfacePoint,end: SurfacePoint): SurfacePoint[] | null {
    if(!this.contains(start)||!this.contains(end))return null;
    const first=this.polygons.find(p=>inside(start,p))!,last=this.polygons.find(p=>inside(end,p))!;
    if(first.id===last.id)return [{...start},{...end}];
    const open=new Set([first.id]),cost=new Map([[first.id,0]]),parent=new Map<number,{from:number;portal:SurfacePoint}>();
    while(open.size) {
      let current=-1,best=Infinity;
      for(const id of open) {const score=cost.get(id)!+distance(this.polygons[id]!.center,last.center);if(score<best){best=score;current=id;}}
      if(current===last.id) {
        const links: {from:number;portal:SurfacePoint}[]=[];
        for(let id=current;id!==first.id;) {const link=parent.get(id)!;links.unshift(link);id=link.from;}
        const points:SurfacePoint[]=[{...start},{...first.center}];
        for(let i=0;i<links.length;i++) {points.push({...links[i]!.portal});points.push({...this.polygons[i+1<links.length?links[i+1]!.from:last.id]!.center});}
        points.push({...end});
        const clean=points.filter((p,i)=>i===0||distance(p,points[i-1]!)>eps),short=[clean[0]!];
        for(let i=0;i<clean.length-1;) {let j=clean.length-1;while(j>i+1&&!this.segmentContains(clean[i]!,clean[j]!))j--;short.push(clean[j]!);i=j;}
        return short;
      }
      open.delete(current);
      for(const portal of this.polygons[current]!.portals) {
        const next=cost.get(current)!+distance(this.polygons[current]!.center,portal.point)+distance(portal.point,this.polygons[portal.to]!.center);
        if(next<(cost.get(portal.to)??Infinity)) {cost.set(portal.to,next);parent.set(portal.to,{from:current,portal:portal.point});open.add(portal.to);}
      }
    }
    return null;
  }
}
