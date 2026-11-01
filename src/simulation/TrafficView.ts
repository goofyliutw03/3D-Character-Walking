import { BoxGeometry, Group, LOD, Mesh, MeshStandardMaterial } from 'three';
import type { Camera } from 'three';
import { Character } from '../character/Character.ts';
import type { TrafficSnapshot, NpcSnapshot, VehicleSnapshot } from './TrafficSimulation.ts';
import { trafficLayout as layout } from './streetLayout.ts';

interface ActorVisual {lod:LOD;character?:Character;id:number;kind:'npc'|'vehicle'}
/** Owns only simulation meshes. Shared box/material resources are released exactly once. */
export class TrafficView {
  readonly root=new Group();
  private readonly actors=new Group();
  private readonly geometry=new BoxGeometry(1,1,1);
  private readonly materials=new Map<string,MeshStandardMaterial>();
  private readonly visuals:ActorVisual[]=[];
  private readonly lamps:{vehicle:Mesh[];pedestrian:Mesh}[]=[];
  private signature='';
  private disposed=false;
  private shadows=true;
  constructor() {
    this.root.name='City traffic simulation';this.actors.name='Traffic actors';this.root.add(this.actors);this.root.visible=false;
    for(const side of [-1,1]) {
      const signal=new Group();signal.name=`Traffic signal ${side}`;this.root.add(signal);
      this.box(signal,side*4.8,1.6,-side*4.5,.12,3.2,.12,'#43534e');
      this.box(signal,side*4.8,3,-side*4.5,.55,1.45,.4,'#25322e');
      const vehicle=['#ff4d4d','#ffc247','#58ed94'].map((color,i)=>{
        const lamp=this.box(signal,side*4.8,3.45-i*.43,-side*4.5+side*.23,.3,.3,.06,color);
        // Each signal lens needs independent emissive state, shared by equal colors across signals.
        return lamp;
      });
      this.box(signal,side*5.4,1.2,0,.1,2.4,.1,'#43534e');
      this.box(signal,side*5.4,2.35,0,.5,.7,.3,'#25322e');
      const pedestrian=this.box(signal,side*5.4,2.35,.18,.28,.45,.06,'#f45c5c');
      // The second pole faces the opposite sidewalk through a matching back lens.
      this.lamps.push({vehicle,pedestrian});
      this.box(this.root,side*2.2,.09,-side*layout.stopZ,3.6,.025,.12,'#eee9dc');
    }
  }
  private material(color:string):MeshStandardMaterial {
    let m=this.materials.get(color);if(!m){m=new MeshStandardMaterial({color,roughness:.8});this.materials.set(color,m);}return m;
  }
  private box(parent:Group,x:number,y:number,z:number,w:number,h:number,d:number,color:string):Mesh {
    const mesh=new Mesh(this.geometry,this.material(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=this.shadows;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  private rebuild(snapshot:TrafficSnapshot):void {
    for(const v of this.visuals)v.character?.dispose();
    this.visuals.length=0;this.actors.clear();
    for(const n of snapshot.npcs) {
      const lod=new LOD();lod.name=`NPC ${n.id} · ${n.variant}`;lod.autoUpdate=false;
      const character=new Character();character.setVariant(n.variant);character.setShadows(this.shadows);
      const far=new Group();this.box(far,0,character.height/2,0,.4,character.height,.3,['#4c7183','#a65e4c','#ce9b3e'][n.id%3]!);
      lod.addLevel(character.root,0).addLevel(far,24,.15);this.actors.add(lod);this.visuals.push({id:n.id,kind:'npc',lod,character});
    }
    for(const car of snapshot.vehicles) {
      const lod=new LOD();lod.name=`Vehicle ${car.id}`;lod.autoUpdate=false;
      const near=new Group(),far=new Group();const color=['#638b9e','#c98860','#909b67','#b3b5bb'][car.id%4]!;
      this.box(near,0,.6,0,1.6,.65,layout.carLength,color);
      this.box(near,0,1.13,-.1,1.35,.55,1.65,'#354d58');
      for(const x of [-.8,.8])for(const z of [-1,1])this.box(near,x,.35,z,.18,.48,.55,'#26332e');
      for(const x of [-.53,.53])this.box(near,x,.62,1.61,.3,.16,.03,'#fff0c0');
      this.box(far,0,.7,0,1.6,1.05,layout.carLength,color);
      lod.addLevel(near,0).addLevel(far,24,.15);this.actors.add(lod);this.visuals.push({id:car.id,kind:'vehicle',lod});
    }
  }
  update(snapshot:TrafficSnapshot,camera:Camera,delta:number):void {
    if(this.disposed)return;
    this.root.visible=snapshot.settings.enabled;
    if(!this.root.visible)return;
    const signature=snapshot.npcs.map(n=>`${n.id}:${n.variant}`).join(',')+'/'+snapshot.vehicles.map(c=>c.id).join(',');
    if(signature!==this.signature){this.signature=signature;this.rebuild(snapshot);}
    for(const visual of this.visuals) {
      const actor:NpcSnapshot|VehicleSnapshot|undefined=visual.kind==='npc'?snapshot.npcs.find(n=>n.id===visual.id):snapshot.vehicles.find(c=>c.id===visual.id);
      if(!actor)continue;
      const npc='heading' in actor?actor:undefined;
      visual.lod.position.set(actor.x,npc?.y??.075,actor.z);
      visual.lod.rotation.y=npc?.heading??('lane' in actor&&actor.lane<0?Math.PI:0);
      visual.lod.updateMatrixWorld(true);
      if(snapshot.settings.lod)visual.lod.update(camera);
      else visual.lod.levels.forEach((level,i)=>{level.object.visible=i===0;});
      if(npc&&visual.character&&visual.lod.levels[0]!.object.visible) {
        // The LOD owns world transform; the Character only owns local animated limbs.
        visual.character.update({...npc,x:0,y:0,z:0,heading:0},snapshot.settings.paused?0:delta);
      }
    }
    const active=snapshot.phase==='vehicles'?2:snapshot.phase==='yellow'?1:0;
    for(const lamps of this.lamps) {
      lamps.vehicle.forEach((lamp,i)=>{const m=lamp.material as MeshStandardMaterial;m.emissive.copy(m.color);m.emissiveIntensity=i===active?1.5:0;});
      const m=lamps.pedestrian.material as MeshStandardMaterial;
      m.color.set(snapshot.phase==='pedestrians'?'#58ed94':'#f45c5c');m.emissive.copy(m.color);m.emissiveIntensity=1;
    }
  }
  setShadows(enabled:boolean):void {
    this.shadows=enabled;this.root.traverse(o=>{if(o instanceof Mesh)o.castShadow=enabled;});
  }
  dispose():void {
    if(this.disposed)return;this.disposed=true;
    for(const v of this.visuals)v.character?.dispose();this.visuals.length=0;
    this.geometry.dispose();for(const material of this.materials.values())material.dispose();
    this.materials.clear();this.root.clear();this.root.removeFromParent();
  }
}
