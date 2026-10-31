import type { WaterQuality } from './WaterShaderModule.ts';

export interface LensSettings { nearDistance:number; farDistance:number; enterSeconds:number; exitSeconds:number }
export interface LensOptions { enabled:boolean; paused:boolean; quality:WaterQuality; reducedMotion:boolean }
export interface LensDrop { id:number; x:number; y:number; radius:number; opacity:number; age:number; life:number; speed:number }
export interface LensSnapshot { mist:number; emitted:number; drops:ReadonlyArray<Readonly<LensDrop>> }

/** Camera-independent state; normalized lens coordinates have Y pointing up. */
export class WetLensState {
  private settings:LensSettings={nearDistance:1,farDistance:3,enterSeconds:.8,exitSeconds:2.5};
  private readonly drops:LensDrop[]=Array.from({length:24},()=>({id:0,x:0,y:0,radius:0,opacity:0,age:0,life:0,speed:0}));
  private mist=0;
  private spawn=0;
  private emitted=0;
  private seed=4157;
  private disposed=false;
  get configuration():Readonly<LensSettings> { return {...this.settings}; }
  get snapshot():LensSnapshot { return {mist:this.mist,emitted:this.emitted,drops:this.drops.filter(d=>d.life>0).map(d=>({...d}))}; }
  get visible():boolean { return this.mist>0 || this.drops.some(d=>d.life>0); }
  configure(patch:Partial<LensSettings>):boolean {
    const next={...this.settings,...patch};
    if(this.disposed || !Object.values(next).every(Number.isFinite) || next.nearDistance<0 || next.farDistance<=next.nearDistance
      || next.enterSeconds<=0 || next.exitSeconds<=0) return false;
    this.settings=next;return true;
  }
  clear():void {this.mist=0;this.spawn=0;for(const drop of this.drops)drop.life=0;}
  update(delta:number,exposure:number,options:LensOptions):void {
    if(this.disposed) return;
    if(!options.enabled) {this.clear();return;}
    if(!Number.isFinite(delta) || delta<0 || !Number.isFinite(exposure))return;
    const limit=options.quality==='low'?10:24;
    for(let i=limit;i<24;i++)this.drops[i]!.life=0;
    if(options.reducedMotion) {for(const drop of this.drops)drop.life=0;this.spawn=0;}
    if(options.paused || delta===0)return;
    const dt=Math.min(delta,.1),target=Math.min(1,Math.max(0,exposure));
    // 95% transition in the configured duration; snap the invisible tail to dry.
    this.mist+=(target-this.mist)*(1-Math.exp(-3*dt/(target>this.mist?this.settings.enterSeconds:this.settings.exitSeconds)));
    if(target===0 && this.mist<.001)this.mist=0;
    for(const drop of this.drops) {
      if(drop.life<=0)continue;
      drop.age+=dt;drop.y-=drop.speed*dt;
      if(drop.age>=drop.life || drop.y<-.15) {drop.life=0;continue;}
      drop.opacity=Math.min(1,drop.age/.18)*Math.min(1,(drop.life-drop.age)/.9);
    }
    if(target===0 || options.reducedMotion) {this.spawn=0;return;}
    this.spawn+=dt*target*(options.quality==='low'?1.5:3);
    if(this.spawn<1)return;
    this.spawn-=1;
    let drop:LensDrop|undefined;
    for(let i=0;i<limit;i++)if(this.drops[i]!.life<=0){drop=this.drops[i];break;}
    if(!drop)return;
    drop.id=++this.emitted;drop.x=.08+this.random()*.84;drop.y=.25+this.random()*.65;
    drop.radius=.009+this.random()*.014;drop.life=2+this.random()*2;drop.age=0;drop.opacity=0;
    drop.speed=.025+this.random()*.045;
  }
  /** Writes uniforms into caller-owned vectors without allocating snapshots per frame. */
  writeDrops(target:ReadonlyArray<{set:(x:number,y:number,z:number,w:number)=>unknown}>):void {
    for(let i=0;i<target.length;i++) {
      const d=this.drops[i];target[i]!.set(d?.x??0,d?.y??0,d?.radius??0,d && d.life>0?d.opacity:0);
    }
  }
  get mistAmount():number {return this.mist;}
  private random():number {this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  dispose():void {this.clear();this.disposed=true;}
}
