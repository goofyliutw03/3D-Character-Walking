import { Group, Line3, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import { ObjectLightPool, validPointLightSettings } from '../lighting/ObjectLightPool.ts';
import type { ObjectLightHandle, PointLightSettings } from '../lighting/ObjectLightPool.ts';

export interface ParticleSettings {
  color: string; speed: number; size: number; lifetime: number; maxCount: number;
  lightEnabled: boolean; lightColor: string; lightIntensity: number; lightRadius: number; lightDecay: number;
}
export interface ParticleSnapshot { active: number; hits: number; expired: number; lastEvent: string }
interface Flight {
  group: Group; material: MeshBasicMaterial; direction: Vector3; age: number;
  settings: ParticleSettings; burst: boolean; light: ObjectLightHandle | null;
}

function lightSettings(settings: ParticleSettings): PointLightSettings {
  return { enabled: settings.lightEnabled, color: settings.lightColor, intensity: settings.lightIntensity, radius: settings.lightRadius, decay: settings.lightDecay };
}

export class ParticleInteraction {
  readonly root = new Group();
  readonly geometry = new SphereGeometry(1,8,6);
  private readonly lights = new ObjectLightPool(8);
  readonly lightRoot = this.lights.root;
  private config: ParticleSettings = { color:'#66ddff',speed:8,size:.14,lifetime:3,maxCount:32,
    lightEnabled:true,lightColor:'#66ddff',lightIntensity:20,lightRadius:5,lightDecay:2 };
  private readonly flights: Flight[] = [];
  private readonly segment = new Line3();
  private readonly nearest = new Vector3();
  private hits = 0;
  private expired = 0;
  private event = 'Ready';
  private disposed = false;
  get settings(): ParticleSettings { return { ...this.config }; }
  get snapshot(): ParticleSnapshot { return {active:this.flights.length,hits:this.hits,expired:this.expired,lastEvent:this.event}; }
  configure(settings: ParticleSettings): boolean {
    const inRange = (v: number,min: number,max: number): boolean => Number.isFinite(v) && v>=min && v<=max;
    if(this.disposed || !/^#[0-9a-f]{6}$/i.test(settings.color) || !inRange(settings.speed,.5,30)
      || !inRange(settings.size,.03,.5) || !inRange(settings.lifetime,.1,10)
      || !Number.isInteger(settings.maxCount) || !inRange(settings.maxCount,1,128)
      || !validPointLightSettings(lightSettings(settings))) return false;
    this.config={...settings};
    while(this.flights.length>settings.maxCount) this.remove(0);
    this.event='Settings applied'; return true;
  }
  fire(origin: Vector3, aim: Vector3): boolean {
    if(this.disposed) return false;
    if(this.flights.length>=this.config.maxCount) { this.event='Capacity reached'; return false; }
    if(![...origin.toArray(),...aim.toArray()].every(Number.isFinite)) return false;
    const direction=aim.clone().sub(origin);
    if(direction.lengthSq()<1e-10) {this.event='Caster is at Target';return false;}
    const material=new MeshBasicMaterial({color:this.config.color,transparent:true,depthWrite:false});
    const group=new Group(); group.position.copy(origin);
    const mesh=new Mesh(this.geometry,material);mesh.scale.setScalar(this.config.size);group.add(mesh);
    this.root.add(group);
    const settings = { ...this.config };
    const light = settings.lightEnabled ? this.lights.attach(group, lightSettings(settings)) : null;
    this.flights.push({group,material,direction:direction.normalize(),age:0,settings,burst:false,light});
    this.event='Fired';return true;
  }
  update(delta: number, target: Vector3, radius: number): void {
    if(this.disposed) return;
    const dt=Number.isFinite(delta)?Math.max(0,delta):0;
    for(let i=this.flights.length-1;i>=0;i--) {
      const f=this.flights[i]!;
      if(f.burst) {
        f.age+=dt;
        if(f.age>=.25) {this.remove(i);continue;}
        f.material.opacity=1-f.age/.25;
        if (f.light) this.lights.update(f.light, { intensity: f.settings.lightIntensity * f.material.opacity });
        f.group.children.forEach((mesh,index)=> {
          if (!(mesh instanceof Mesh)) return;
          // Meshes remain before the retained light in the burst group.
          const angle=index*Math.PI/4;
          mesh.position.set(Math.cos(angle),Math.sin(angle),index%2?.5:-.5).multiplyScalar(f.age*3);
        });
        continue;
      }
      const step=Math.min(dt,Math.max(0,f.settings.lifetime-f.age));
      this.segment.start.copy(f.group.position);
      this.segment.end.copy(f.group.position).addScaledVector(f.direction,f.settings.speed*step);
      this.segment.closestPointToPoint(target,true,this.nearest);
      if(this.nearest.distanceToSquared(target)<=(Math.max(0,radius)+f.settings.size)**2) {
        f.group.position.copy(this.nearest); f.burst=true;f.age=0;this.hits++;this.event='Hit';
        // Keep the leased light attached; only replace visual particles.
        const retained = f.group.children.filter(child => !(child instanceof Mesh));
        f.group.clear();
        for(let j=0;j<8;j++) {const mesh=new Mesh(this.geometry,f.material);mesh.scale.setScalar(f.settings.size*.65);f.group.add(mesh);}
        for (const child of retained) f.group.add(child);
      } else {
        f.group.position.copy(this.segment.end);f.age+=dt;
        if(f.age>=f.settings.lifetime) {this.expired++;this.event='Expired';this.remove(i);}
      }
    }
    // Overflow effects stay visual-only until a slot is returned. Never exceed the fixed pool.
    for (const f of this.flights) {
      if (this.lights.activeCount === this.lights.capacity) break;
      if (!f.light && f.settings.lightEnabled) {
        f.light = this.lights.attach(f.group, lightSettings(f.settings));
        if (f.light && f.burst) this.lights.update(f.light, { intensity: f.settings.lightIntensity * (1 - f.age / .25) });
      }
    }
  }
  private remove(index: number): void {
    const [f]=this.flights.splice(index,1);
    if(f) {
      if (f.light) this.lights.remove(f.light);
      f.group.removeFromParent();f.group.clear();f.material.dispose();
    }
  }
  clear(): void {
    while(this.flights.length) this.remove(this.flights.length-1);
    this.hits=0;this.expired=0;this.event='Ready';
  }
  dispose(): void {
    if(this.disposed) return;
    this.disposed=true;this.clear();this.lights.dispose();this.geometry.dispose();this.root.removeFromParent();
  }
}
