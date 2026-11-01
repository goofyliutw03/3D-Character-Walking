import type { CharacterVariant, MotionSnapshot, WalkableWorld } from '../character/motion';
import { SurfaceNavMesh, type SurfacePoint } from '../navigation/SurfaceNavMesh.ts';
import { pedestrianSurfaces, trafficLayout as layout } from './streetLayout.ts';

export interface TrafficSettings { enabled: boolean; paused: boolean; npcCount: number; vehicleCount: number; lod: boolean }
export type TrafficPhase = 'vehicles' | 'yellow' | 'all-red' | 'pedestrians' | 'clearance';
export type NpcState = 'idle' | 'walking' | 'waiting-signal' | 'yielding';
export interface NpcSnapshot extends MotionSnapshot { id:number; variant:CharacterVariant; state:NpcState; crossing:boolean }
export interface VehicleSnapshot { id:number; lane:1|-1; x:number; z:number; speed:number }
export interface TrafficSnapshot {settings:TrafficSettings;time:number;phase:TrafficPhase;phaseTime:number;npcs:NpcSnapshot[];vehicles:VehicleSnapshot[]}
interface Npc extends NpcSnapshot { path:SurfacePoint[]; waypoint:number; dwell:number; trip:number; crossingStart:number; crossingEnd:number; home:SurfacePoint }
const dist = (a:SurfacePoint,b:SurfacePoint):number => Math.hypot(a.x-b.x,a.z-b.z);

/** One authority for time, reservations and signal state. No renderer or DOM dependency. */
export class TrafficSimulation {
  readonly navMesh: SurfaceNavMesh;
  private settings: TrafficSettings={enabled:false,paused:false,npcCount:6,vehicleCount:4,lod:true};
  private npcs:Npc[]=[];
  private vehicles:VehicleSnapshot[]=[];
  private time=0;
  private phase:TrafficPhase='vehicles';
  private phaseTime=0;
  private nextCrossId=1;
  private disposed=false;
  constructor(private readonly world:WalkableWorld) {
    this.navMesh=new SurfaceNavMesh(pedestrianSurfaces,world.obstacles,.3);
    this.reset();
  }
  get snapshot():TrafficSnapshot {
    return {settings:{...this.settings},time:this.time,phase:this.phase,phaseTime:this.phaseTime,
      npcs:this.npcs.map(n=>({id:n.id,variant:n.variant,state:n.state,crossing:n.crossing,x:n.x,y:n.y,z:n.z,heading:n.heading,speed:n.speed,grounded:true,action:n.action})),
      vehicles:this.vehicles.map(c=>({...c}))};
  }
  configure(patch:Partial<TrafficSettings>):boolean {
    if(this.disposed||!patch||typeof patch!=='object'||Array.isArray(patch))return false;
    for(const [key,value] of Object.entries(patch)) {
      if(key==='enabled'||key==='paused'||key==='lod') {if(typeof value!=='boolean')return false;}
      else if(key==='npcCount'||key==='vehicleCount') {if(!Number.isInteger(value)||typeof value!=='number'||value<0||value>(key==='npcCount'?24:8))return false;}
      else return false;
    }
    const next={...this.settings,...patch};
    const rebuild=next.npcCount!==this.settings.npcCount||next.vehicleCount!==this.settings.vehicleCount;
    this.settings=next;if(rebuild)this.reset();return true;
  }
  reset():void {
    if(this.disposed)return;
    this.time=0;this.phase='vehicles';this.phaseTime=0;this.nextCrossId=1;this.npcs=[];this.vehicles=[];
    for(let i=0;i<this.settings.npcCount;i++) {
      const side=i%2?1:-1, desired={x:side*5.8,z:-21+Math.floor(i/2)*3.65};
      const spawn=this.nearestSide(desired,side);
      if(!spawn || this.npcs.some(n=>dist(n,spawn)<.7))continue;
      this.npcs.push({id:i+1,variant:(['man','woman','child'] as const)[i%3]!,...spawn,y:this.world.groundHeight(spawn.x,spawn.z),heading:0,speed:0,grounded:true,action:'idle',state:'idle',crossing:false,path:[],waypoint:0,dwell:i*.15,trip:0,crossingStart:-1,crossingEnd:-1,home:{...spawn}});
    }
    for(let i=0;i<this.settings.vehicleCount;i++) {
      const lane=i%2?1:-1;
      this.vehicles.push({id:i+1,lane,x:lane*layout.laneX,z:lane*(-22+Math.floor(i/2)*6),speed:0});
    }
  }
  private nearestSide(desired:SurfacePoint,side:number):SurfacePoint | null {
    // Prefer the requested legal point, otherwise a convex polygon center on the same sidewalk.
    if(this.navMesh.contains(desired))return {...desired};
    let nearest:SurfacePoint|null=null,best=Infinity;
    for(const p of this.navMesh.polygons) if(p.center.x*side>=layout.sidewalk) {
      const d=dist(p.center,desired);if(d<best){best=d;nearest={...p.center};}
    }
    return nearest;
  }
  private plan(n:Npc):void {
    const side=Math.sign(n.x),crossZ=side<0?.8:-.8;
    if(n.id!==this.nextCrossId) {
      const destination=this.nearestSide({x:n.home.x,z:n.home.z+(n.trip++%2?.7:-.7)},side);
      const path=destination&&this.navMesh.findPath(n,destination);
      if(path){n.path=path.slice(1);n.waypoint=0;n.crossingStart=-1;n.crossingEnd=-1;}
      return;
    }
    const entrance={x:side*5.8,z:crossZ},exit={x:-side*5.8,z:crossZ};
    const target=this.nearestSide({x:-side*5.8,z:-side*(15+(n.id%3)*2)},-side);
    if(!target)return;
    const approach=this.navMesh.findPath(n,entrance),leave=this.navMesh.findPath(exit,target);
    if(!approach||!leave)return;
    // The crossing is a straight portal-connected strip; opposing streams have separate z lanes.
    n.path=[...approach.slice(1),exit,...leave.slice(1)];n.crossingStart=approach.length-1;n.crossingEnd=n.crossingStart+1;n.waypoint=0;n.trip++;
  }
  update(delta:number,blockers:readonly SurfacePoint[]):void {
    if(this.disposed||!this.settings.enabled||this.settings.paused||!Number.isFinite(delta)||delta<=0)return;
    const dt=Math.min(delta,.05);this.time+=dt;this.phaseTime+=dt;
    const carsClear=!this.vehicles.some(c=>Math.abs(c.z)<layout.stopZ+layout.carLength/2-1e-6);
    const peopleClear=!this.npcs.some(n=>n.crossing || Math.abs(n.x)<layout.sidewalk);
    const transition=(phase:TrafficPhase):void=>{this.phase=phase;this.phaseTime=0;};
    if(this.phase==='vehicles'&&this.phaseTime>=10)transition('yellow');
    else if(this.phase==='yellow'&&this.phaseTime>=2)transition('all-red');
    else if(this.phase==='all-red'&&this.phaseTime>=2&&carsClear)transition('pedestrians');
    else if(this.phase==='pedestrians'&&this.phaseTime>=4)transition('clearance');
    else if(this.phase==='clearance'&&this.phaseTime>=10&&peopleClear)transition('vehicles');
    for(const n of this.npcs) {
      n.speed=0;n.action='idle';
      if(n.dwell>0){n.dwell-=dt;n.state='idle';continue;}
      if(n.waypoint>=n.path.length) {n.path=[];this.plan(n);if(!n.path.length){n.dwell=1;n.state='idle';continue;}}
      let next=n.path[n.waypoint]!;
      if(dist(n,next)<.001) {n.waypoint++;if(n.crossingEnd>=0&&n.waypoint>=n.crossingEnd)n.crossing=false;if(n.waypoint>=n.path.length){
        if(n.crossingEnd>=0){this.nextCrossId=this.npcs[(this.npcs.indexOf(n)+1)%this.npcs.length]!.id;n.home={x:n.x,z:n.z};}
        n.dwell=1+(n.id%3)*.3;n.state='idle';continue;}next=n.path[n.waypoint]!;}
      if(n.waypoint===n.crossingStart&&!n.crossing) {
        if(this.phase!=='pedestrians'||this.npcs.some(other=>other.crossing)) {n.state='waiting-signal';continue;}
        n.crossing=true;
      }
      if(!this.navMesh.segmentContains(n,next)) {
        const detour=this.navMesh.findPath(n,next)?.slice(1,-1);
        if(detour?.length) {
          n.path.splice(n.waypoint,0,...detour);
          if(n.crossingStart>=n.waypoint)n.crossingStart+=detour.length;
          if(n.crossingEnd>=n.waypoint)n.crossingEnd+=detour.length;
          next=n.path[n.waypoint]!;
        }
      }
      const length=dist(n,next),step=Math.min(length,(n.variant==='child'?1.15:1.35)*dt);
      const dx=(next.x-n.x)/length,dz=(next.z-n.z)/length;
      let proposed={x:n.x+dx*step,z:n.z+dz*step};
      let entering=Math.abs(proposed.x)<layout.sidewalk;
      if(entering&&!n.crossing) {n.state='waiting-signal';continue;}
      const free=(p:SurfacePoint):boolean => this.navMesh.segmentContains(n,p) &&
        !(Math.abs(p.x)<layout.sidewalk&&!n.crossing) &&
        !blockers.some(b=>dist(b,p)<.7) && !this.npcs.some(other=>other!==n&&dist(other,p)<.6);
      if(!free(proposed)) {
        // Try right/left sidesteps inside the mesh; opposing walkers naturally pass on their right.
        const alternatives=[1,-1].flatMap(sign=>[
          {x:n.x+(dx*.35+dz*sign*.94)*step,z:n.z+(dz*.35-dx*sign*.94)*step},
          {x:n.x+dz*sign*step,z:n.z-dx*sign*step},
          {x:n.x+(-dx*.7+dz*sign*.7)*step,z:n.z+(-dz*.7-dx*sign*.7)*step},
        ]);
        const alternate=alternatives.find(free);
        if(!alternate){n.state='yielding';continue;}
        proposed=alternate;entering=Math.abs(proposed.x)<layout.sidewalk;
      }
      n.heading=Math.atan2(proposed.x-n.x,proposed.z-n.z);n.x=proposed.x;n.z=proposed.z;n.y=this.world.groundHeight(n.x,n.z);
      n.speed=step/dt;n.action='walk';n.state='walking';
      if(entering)n.crossing=true;
    }
    // Front-to-back ordering prevents rear vehicles from stepping into a leader's new position.
    for(const lane of [-1,1] as const) {
      const cars=this.vehicles.filter(c=>c.lane===lane).sort((a,b)=>lane*(b.z-a.z));
      for(const car of cars) {
        const oldZ=car.z,progress=lane*car.z;
        let step=3.5*dt;
        const stop=-layout.stopZ-layout.carLength/2;
        if(progress<=stop+1e-7 && (this.phase!=='vehicles'||!peopleClear))step=Math.min(step,Math.max(0,stop-progress));
        for(const other of cars) if(other!==car) {
          const ahead=lane*(other.z-car.z);
          if(ahead>0)step=Math.min(step,Math.max(0,ahead-layout.headway));
        }
        for(const b of [...blockers,...this.npcs]) {
          const ahead=lane*(b.z-car.z);
          if(Math.abs(b.x-car.x)<1.35&&ahead>=0)step=Math.min(step,Math.max(0,ahead-2.3));
        }
        car.z+=lane*step;
        if(lane*car.z>layout.endZ) {
          const spawnZ=-lane*layout.endZ;
          if(!cars.some(c=>c!==car&&Math.abs(c.z-spawnZ)<layout.headway) && !blockers.some(b=>Math.abs(b.x-car.x)<1.35&&Math.abs(b.z-spawnZ)<2.3))car.z=spawnZ;
          else car.z=oldZ;
        }
        car.speed=Math.abs(car.z-oldZ)>1?0:Math.abs(car.z-oldZ)/dt;
      }
    }
  }
  dispose():void {this.disposed=true;this.npcs=[];this.vehicles=[];this.settings={...this.settings,enabled:false};}
}
