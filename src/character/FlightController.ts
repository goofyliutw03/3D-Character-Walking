import { CharacterController } from './CharacterController.ts';
import type { MovementIntent, MotionSnapshot, WalkableWorld } from './motion.ts';
import { FlightWorldQuery } from '../world/FlightWorldQuery.ts';
import { defaultCapsule, finitePoint, type Capsule, type Point3 } from '../world/WorldQuery.ts';
import { minimumGroundNormal } from '../world/GroundWorldQuery.ts';

const step=1/60;
const zero=():Point3=>({x:0,y:0,z:0});
/** Explicit strategy owner. Only the selected flight/ground branch may commit a transform. */
export class FlightController {
  private ground:CharacterController;
  private capsule:Capsule;
  private readonly query:FlightWorldQuery;
  private state:MotionSnapshot;
  private speedVector=zero();
  private accumulator=0;
  private discarded=0;
  private strategy:'ground'|'flight'='flight';
  constructor(private readonly world:WalkableWorld, capsule:Capsule=defaultCapsule){
    if(!(world.query instanceof FlightWorldQuery))throw Error('Flight requires a flight world query');
    this.query=world.query;
    this.capsule={...capsule};
    this.ground=new CharacterController(world,capsule);
    this.state={...this.ground.snapshot,grounded:false,action:'jump'};
  }
  get mode(){return this.strategy;}
  get snapshot():Readonly<MotionSnapshot>{return {...this.state};}
  get shape(){return {...this.capsule};}
  get walkSpeed(){return this.ground.walkSpeed;}
  get velocity(){return {...this.speedVector};}
  get droppedTime(){return this.discarded;}
  get warning(){return this.query.warning(this.state,this.shape);}
  setWalkSpeed(v:number){return this.ground.setWalkSpeed(v);}
  private legal(p:Point3,c=this.shape):boolean{
    const r=this.query.overlap(p,c);return r.ok&&!r.value;
  }
  setCapsule(c:Capsule):boolean{
    if(!this.legal(this.state,c))return false;
    if(this.strategy==='ground'&&!this.ground.setCapsule(c))return false;
    this.capsule={...c};return true;
  }
  relocate(p:Point3,snap=true):boolean{
    if(!finitePoint(p))return false;
    const surface=snap?this.query.surfaceSample(p,{maxRise:0}):null;
    if(snap&&!surface?.ok)return false;
    const next={...p,y:surface?.ok?surface.value.height:p.y};
    if(!this.legal(next))return false;
    if(this.strategy==='ground'){
      if(!this.ground.relocate(next,snap))return false;
      this.state={...this.ground.snapshot};
    }else Object.assign(this.state,next,{grounded:false,action:'jump'});
    this.stop();return true;
  }
  stop():void{this.speedVector=zero();this.accumulator=0;this.state.speed=0;}
  takeOff():boolean{
    if(!this.legal(this.state))return false;
    this.strategy='flight';this.stop();this.state.grounded=false;this.state.action='jump';return true;
  }
  land():boolean{
    if(this.strategy!=='flight')return false;
    const surface=this.query.surfaceSample(this.state,{maxRise:0});
    if(!surface.ok||(surface.value.normal?.y??1)<minimumGroundNormal)return false;
    const distance=this.state.y-surface.value.height;
    if(distance< -1e-8||distance>2)return false;
    const down={x:0,y:-distance,z:0},target={...this.state,y:surface.value.height};
    const hit=this.query.sweep(this.state,down,this.shape);
    if(!hit.ok||(hit.value&&hit.value.fraction<1-1e-8)||!this.legal(target))return false;
    const ground=new CharacterController(this.world,this.shape);
    ground.setWalkSpeed(this.walkSpeed);
    if(!ground.relocate(target,true))return false;
    this.ground=ground;
    this.strategy='ground';this.state={...this.ground.snapshot};this.stop();return true;
  }
  update(delta:number,intent:MovementIntent,speedOverride?:number):Readonly<MotionSnapshot>{
    if(!Number.isFinite(delta)||delta<0||delta>3600||![intent.x,intent.z,intent.vertical??0].every(Number.isFinite))return this.snapshot;
    if(this.strategy==='ground'){
      this.state={...this.ground.update(delta,intent,speedOverride)};return this.snapshot;
    }
    const previous={...this.state},velocity={...this.speedVector},accumulator=this.accumulator,discarded=this.discarded;
    const total=this.accumulator+delta, available=Math.floor((total+1e-10)/step),steps=Math.min(4,available);
    this.accumulator=Math.max(0,total-available*step);this.discarded+=Math.max(0,available-steps)*step;
    const direction={x:intent.x,y:intent.vertical??(intent.jump?1:0),z:intent.z};
    const magnitude=Math.hypot(direction.x,direction.y,direction.z);
    if(magnitude>1){direction.x/=magnitude;direction.y/=magnitude;direction.z/=magnitude;}
    for(let i=0;i<steps;i++){
      const warning=this.warning;
      const acceleration={...direction};
      if(warning){
        const into=acceleration.x*warning.normal.x+acceleration.y*warning.normal.y+acceleration.z*warning.normal.z;
        if(into<0){const reduction=into*(1-Math.max(.1,warning.distance/3));
          acceleration.x-=reduction*warning.normal.x;acceleration.y-=reduction*warning.normal.y;acceleration.z-=reduction*warning.normal.z;}
      }
      if(magnitude){
        this.speedVector.x+=acceleration.x*18*step;this.speedVector.y+=acceleration.y*18*step;this.speedVector.z+=acceleration.z*18*step;
      }else{
        const length=Math.hypot(this.speedVector.x,this.speedVector.y,this.speedVector.z);
        const scale=length?Math.max(0,length-12*step)/length:0;
        this.speedVector.x*=scale;this.speedVector.y*=scale;this.speedVector.z*=scale;
      }
      const length=Math.hypot(this.speedVector.x,this.speedVector.y,this.speedVector.z),limit=intent.run?24:8;
      if(length>limit){this.speedVector.x*=limit/length;this.speedVector.y*=limit/length;this.speedVector.z*=limit/length;}
      if(!this.move({x:this.speedVector.x*step,y:this.speedVector.y*step,z:this.speedVector.z*step})){
        this.state=previous;this.speedVector=velocity;this.accumulator=accumulator;this.discarded=discarded;return this.snapshot;
      }
    }
    this.state.speed=Math.hypot(this.speedVector.x,this.speedVector.y,this.speedVector.z);
    if(Math.hypot(this.speedVector.x,this.speedVector.z)>1e-8)this.state.heading=Math.atan2(this.speedVector.x,this.speedVector.z);
    this.state.action='jump';this.state.grounded=false;return this.snapshot;
  }
  private move(delta:Point3):boolean{
    const position={x:this.state.x,y:this.state.y,z:this.state.z},rest={...delta};
    for(let i=0;i<4;i++){
      const result=this.query.sweep(position,rest,this.shape);if(!result.ok)return false;
      const hit=result.value,f=hit?.fraction??1;
      position.x+=rest.x*f;position.y+=rest.y*f;position.z+=rest.z*f;
      if(!hit)break;
      rest.x*=1-f;rest.y*=1-f;rest.z*=1-f;
      for(const vector of [rest,this.speedVector]){
        const dot=vector.x*hit.normal.x+vector.y*hit.normal.y+vector.z*hit.normal.z;
        if(dot<0){vector.x-=dot*hit.normal.x;vector.y-=dot*hit.normal.y;vector.z-=dot*hit.normal.z;}
      }
      if(Math.hypot(rest.x,rest.y,rest.z)<1e-10)break;
    }
    if(!this.legal(position))return false;
    Object.assign(this.state,position);return true;
  }
}
