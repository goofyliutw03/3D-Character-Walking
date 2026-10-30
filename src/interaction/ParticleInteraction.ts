import { Group, Line3, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';

export interface ParticleSettings { color: string; speed: number; size: number; lifetime: number; maxCount: number }
export interface ParticleSnapshot { active: number; hits: number; expired: number; lastEvent: string }
interface Flight {
  group: Group; material: MeshBasicMaterial; direction: Vector3; age: number;
  settings: ParticleSettings; burst: boolean;
}

export class ParticleInteraction {
  readonly root = new Group();
  readonly geometry = new SphereGeometry(1,8,6);
  private config: ParticleSettings = { color:'#66ddff',speed:8,size:.14,lifetime:3,maxCount:32 };
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
      || !Number.isInteger(settings.maxCount) || !inRange(settings.maxCount,1,128)) return false;
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
    this.flights.push({group,material,direction:direction.normalize(),age:0,settings:{...this.config},burst:false});
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
        f.group.children.forEach((mesh,index)=> {
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
        f.group.clear();
        for(let j=0;j<8;j++) {const mesh=new Mesh(this.geometry,f.material);mesh.scale.setScalar(f.settings.size*.65);f.group.add(mesh);}
      } else {
        f.group.position.copy(this.segment.end);f.age+=dt;
        if(f.age>=f.settings.lifetime) {this.expired++;this.event='Expired';this.remove(i);}
      }
    }
  }
  private remove(index: number): void {
    const [f]=this.flights.splice(index,1);
    if(f) {f.group.removeFromParent();f.group.clear();f.material.dispose();}
  }
  clear(): void {
    while(this.flights.length) this.remove(this.flights.length-1);
    this.hits=0;this.expired=0;this.event='Ready';
  }
  dispose(): void {
    if(this.disposed) return;
    this.disposed=true;this.clear();this.geometry.dispose();this.root.removeFromParent();
  }
}
