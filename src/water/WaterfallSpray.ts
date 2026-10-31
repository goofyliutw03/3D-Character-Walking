import { BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector2, type WebGLRenderer } from 'three';
import type { WaterSettings } from './WaterShaderModule.ts';

/** Fixed GPU trajectories: no per-frame particle allocations or emitter loop. */
export class WaterfallSpray {
  private readonly geometry = new BufferGeometry();
  private readonly material = new ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{uTime:{value:0},uFlow:{value:1},uPixels:{value:600},uMaxSize:{value:64}},
    vertexShader:`attribute vec3 velocity;
      attribute vec4 life;
      uniform float uTime, uFlow, uPixels, uMaxSize;
      varying float vAlpha, vKind;
      void main() {
        float age = mod(uTime * uFlow + life.y, life.x);
        vec3 p = position + velocity * age + vec3(0.0,-4.9*age*age,0.0);
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(life.z * uPixels * projectionMatrix[1][1] / max(-mv.z,.1),1.0,uMaxSize);
        vAlpha = smoothstep(0.0,.08,age) * (1.0-smoothstep(life.x*.65,life.x,age)) * step(.33,p.y);
        vKind = life.w;
      }`,
    fragmentShader:`varying float vAlpha, vKind;
      void main() {
        vec2 p = (gl_PointCoord-.5)*2.0;
        p.x *= mix(2.8,1.25,vKind);
        float r = length(p);
        if(r>1.0) discard;
        float alpha = (1.0-smoothstep(.18,1.0,r)) * vAlpha * mix(.62,.48,vKind);
        gl_FragColor = vec4(mix(vec3(.77,.91,.94),vec3(.95,.99,1.0),vKind),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  readonly points = new Points(this.geometry,this.material);
  private readonly size = new Vector2();
  private disposed = false;
  private maxSize = 64;
  private lastRenderer: WebGLRenderer | undefined;
  constructor() {
    const positions=new Float32Array(384*3), velocities=new Float32Array(384*3), lives=new Float32Array(384*4);
    // Stable seed makes quality comparisons reproducible; every prefix mixes both emitters.
    let seed=1234567;
    const random=():number=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<384;i++) {
      const splash=i%3!==0, j=i*3,k=i*4;
      positions[j]=(random()-.5)*(splash?1.05:1.12);
      positions[j+1]=splash?.35:2.31;
      positions[j+2]=-1.02+random()*.18;
      velocities[j]=(random()-.5)*(splash?2.2:.15);
      velocities[j+1]=splash?1.4+random()*1.5:-.8-random()*.9;
      velocities[j+2]=splash?.25+random()*1.3:.04+random()*.12;
      lives[k]=splash?.34+random()*.25:.46+random()*.07;
      lives[k+1]=random()*lives[k]!;
      lives[k+2]=splash?.014+random()*.022:.018+random()*.025;
      lives[k+3]=Number(splash);
    }
    this.geometry.setAttribute('position',new BufferAttribute(positions,3));
    this.geometry.setAttribute('velocity',new BufferAttribute(velocities,3));
    this.geometry.setAttribute('life',new BufferAttribute(lives,4));
    this.geometry.setDrawRange(0,384);
    this.points.name='Waterfall droplets'; this.points.frustumCulled=false;
    this.points.userData.cameraObstruction=false; this.points.renderOrder=3;
    this.points.onBeforeRender=(renderer:WebGLRenderer):void=>{
      renderer.getDrawingBufferSize(this.size);
      this.material.uniforms.uPixels!.value=this.size.y*.5;
      if(this.lastRenderer!==renderer) {
        const range=renderer.getContext().getParameter(renderer.getContext().ALIASED_POINT_SIZE_RANGE) as Float32Array;
        this.maxSize=Math.min(64,range[1]??64);this.lastRenderer=renderer;
      }
      this.material.uniforms.uMaxSize!.value=this.maxSize;
    };
  }
  update(settings: WaterSettings, elapsed: number): void {
    if(this.disposed) return;
    this.points.visible=settings.enabled && settings.flowSpeed>0;
    this.geometry.setDrawRange(0,settings.quality==='low'?128:384);
    this.material.uniforms.uTime!.value=elapsed;
    this.material.uniforms.uFlow!.value=settings.flowSpeed;
  }
  dispose(): void {
    if(this.disposed) return;this.disposed=true;
    this.points.removeFromParent();this.geometry.dispose();this.material.dispose();
  }
}
