import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector4, type Object3D, type PerspectiveCamera, type WebGLRenderer } from 'three';
import { SprayExposure, type SpraySource } from './SpraySource.ts';
import { WetLensState, type LensSettings, type LensSnapshot } from './WetLensState.ts';
import type { WaterSettings } from './WaterShaderModule.ts';

/** Final transparent lens layer. No scene texture, DOM, animation loop or renderer ownership. */
export class WetLensEffect {
  private readonly state=new WetLensState();
  private readonly exposure=new SprayExposure();
  private readonly scene=new Scene();
  private readonly camera=new OrthographicCamera(-1,1,1,-1,0,1);
  private readonly geometry=new PlaneGeometry(2,2);
  private readonly drops=Array.from({length:24},()=>new Vector4());
  private readonly size=new Vector2();
  private active=true;
  private disposed=false;
  private readonly material=new ShaderMaterial({
    transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
    uniforms:{mist:{value:0},drops:{value:this.drops},aspect:{value:1},fisheye:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader:`varying vec2 vUv;uniform float mist,aspect,fisheye;uniform vec4 drops[24];
      void main(){
        vec2 scale=vec2(max(aspect,1.0),max(1.0/aspect,1.0));
        if(fisheye>.5 && length((vUv-.5)*2.0*scale)>1.0)discard;
        float veil=mist*(.055+.045*pow(abs(vUv.x-.5)*2.0,2.0));
        vec3 color=vec3(.85,.94,.95);float alpha=veil;
        for(int i=0;i<24;i++){
          vec4 d=drops[i];
          if(d.w<=0.0)continue;
          vec2 p=(vUv-d.xy)*scale/max(d.z,.0001);p.y*=.78;
          float r=length(p);if(r>1.15)continue;
          float edge=exp(-pow((r-.85)*12.0,2.0))*.22;
          float glint=exp(-dot(p-vec2(-.3,.35),p-vec2(-.3,.35))*24.0)*.5;
          float body=(1.0-smoothstep(.1,1.0,r))*.025;
          float a=(edge+glint+body)*d.w;
          color=mix(color,vec3(.91,.98,1.0),a/max(alpha+a,.0001));
          alpha=1.0-(1.0-alpha)*(1.0-a);
        }
        gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }`,
  });
  constructor() {const quad=new Mesh(this.geometry,this.material);quad.frustumCulled=false;this.scene.add(quad);}
  get enabled():boolean {return this.active;}
  set enabled(value:boolean) {this.active=value;if(!value)this.clear();}
  get snapshot():LensSnapshot {return this.state.snapshot;}
  configure(patch:Partial<LensSettings>):boolean {return !this.disposed && this.state.configure(patch);}
  clear():void {this.state.clear();}
  update(delta:number,camera:PerspectiveCamera,source:SpraySource|undefined,environment:Object3D,water:Pick<WaterSettings,'enabled'|'paused'|'quality'|'flowSpeed'>,reducedMotion:boolean):void {
    if(this.disposed)return;
    const config=this.state.configuration;
    const exposure=this.active && water.enabled && water.flowSpeed>0 && source && !water.paused && delta>0
      ? this.exposure.sample(camera,source,environment,config.nearDistance,config.farDistance):0;
    this.state.update(delta,exposure,{enabled:this.active&&water.enabled,paused:water.paused,quality:water.quality,reducedMotion});
  }
  render(renderer:WebGLRenderer,fisheye=false):void {
    if(this.disposed || !this.active || !this.state.visible)return;
    renderer.getDrawingBufferSize(this.size);
    this.material.uniforms.aspect!.value=this.size.x/Math.max(1,this.size.y);
    this.material.uniforms.fisheye!.value=Number(fisheye);
    this.material.uniforms.mist!.value=this.state.mistAmount;
    this.state.writeDrops(this.drops);
    const autoClear=renderer.autoClear,target=renderer.getRenderTarget();
    try {renderer.autoClear=false;renderer.render(this.scene,this.camera);}
    finally {renderer.autoClear=autoClear;renderer.setRenderTarget(target);}
  }
  dispose():void {
    if(this.disposed)return;this.disposed=true;
    this.state.dispose();this.geometry.dispose();this.material.dispose();this.scene.clear();
  }
}
