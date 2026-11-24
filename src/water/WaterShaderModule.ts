import { DoubleSide, ShaderMaterial, Vector2 } from 'three';
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
    uHalfSize:{value:new Vector2(2, 1.5)},
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
  setSurfaceSize(width: number, depth: number): void {
    this.uniforms.uHalfSize.value.set(width / 2, depth / 2);
  }
  /** CPU counterpart of heightAt in waterShaders.ts, in surface-local metres. */
  surfaceOffset(x: number, z: number): number {
    const { enabled, waveStrength, flowSpeed } = this.state;
    if (!enabled) return 0;
    const t = this.time * flowSpeed;
    const d = Math.hypot(x, (z + 1.1) * 1.15);
    return waveStrength * (
      Math.sin(x * 4.2 + z * 2.8 + t * 1.3) * .013 +
      Math.sin(x * -2.8 + z * 5.4 - t * 1.7) * .009 +
      Math.sin(x * 7.1 - z * 3 + t * 2.1) * .004 +
      Math.sin(d * 19 - t * 5) * Math.exp(-d * 1.8) * .012);
  }
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
