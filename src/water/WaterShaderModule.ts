import { DoubleSide, ShaderMaterial } from 'three';
import { fallFragment, fallVertex, waterFragment, waterVertex } from './waterShaders.ts';

export type WaterQuality = 'low' | 'standard';
export interface WaterSettings {
  enabled: boolean; paused: boolean; waveStrength: number; flowSpeed: number; quality: WaterQuality;
}

/** Copies follow their source clock; opacity remains local to each appearance. */
class WaterShaderMaterial extends ShaderMaterial {
  override copy(source: ShaderMaterial): this {
    super.copy(source);
    this.uniforms = {...source.uniforms, uOpacity:{value:source.opacity}};
    return this;
  }
  override onBeforeRender(): void {
    this.uniforms.uOpacity!.value = this.opacity;
  }
}

/** Renderer/DOM/geometry-independent water materials. The host owns the clock. */
export class WaterShaderModule {
  private state: WaterSettings = {enabled:true, paused:false, waveStrength:1, flowSpeed:1, quality:'standard'};
  private time = 0;
  private disposed = false;
  private readonly uniforms = {
    uTime:{value:0}, uWave:{value:1}, uFlow:{value:1}, uEnabled:{value:1}, uLow:{value:0},
  };
  readonly surfaceMaterial = new WaterShaderMaterial({
    uniforms:{...this.uniforms,uOpacity:{value:1}},
    vertexShader:waterVertex, fragmentShader:waterFragment, side:DoubleSide,
  });
  readonly fallMaterial = new WaterShaderMaterial({
    uniforms:{...this.uniforms,uOpacity:{value:1}},
    vertexShader:fallVertex, fragmentShader:fallFragment,
    transparent:true, depthWrite:false, side:DoubleSide,
  });
  get settings(): WaterSettings { return {...this.state}; }
  get elapsed(): number { return this.time; }
  configure(patch: Partial<WaterSettings>): boolean {
    if (this.disposed) return false;
    const next = {...this.state,...patch};
    if (typeof next.enabled !== 'boolean' || typeof next.paused !== 'boolean'
      || !Number.isFinite(next.waveStrength) || next.waveStrength < 0 || next.waveStrength > 2
      || !Number.isFinite(next.flowSpeed) || next.flowSpeed < 0 || next.flowSpeed > 3
      || !['low','standard'].includes(next.quality)) return false;
    this.state = next;
    this.uniforms.uWave.value = next.waveStrength;
    this.uniforms.uFlow.value = next.flowSpeed;
    this.uniforms.uEnabled.value = Number(next.enabled);
    this.uniforms.uLow.value = Number(next.quality === 'low');
    return true;
  }
  update(deltaSeconds: number): void {
    if (this.disposed || !this.state.enabled || this.state.paused || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
    this.time += Math.min(deltaSeconds,.1);
    this.uniforms.uTime.value = this.time;
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.surfaceMaterial.dispose(); this.fallMaterial.dispose();
  }
}
