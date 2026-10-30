import { Group, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { WaterShaderModule, type WaterQuality, type WaterSettings } from './WaterShaderModule.ts';
export type { WaterQuality, WaterSettings } from './WaterShaderModule.ts';

/** Owns only its meshes; the host owns rendering, timing and lights. */
export class WaterFeature {
  readonly root = new Group();
  private readonly shader = new WaterShaderModule();
  private disposed = false;
  private readonly surface: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly fall: Mesh<PlaneGeometry, ShaderMaterial>;

  constructor() {
    this.root.name = 'WaterFeature';
    this.surface = new Mesh(this.surfaceGeometry('standard'),this.shader.surfaceMaterial);
    this.surface.position.y = .32;
    this.surface.frustumCulled = false;
    this.surface.name = 'Pool surface';
    this.fall = new Mesh(new PlaneGeometry(1.12,2.04,12,32),this.shader.fallMaterial);
    this.fall.position.set(0,1.32,-1.1);
    this.fall.renderOrder = 2;
    this.fall.name = 'Waterfall';
    this.surface.userData.cameraObstruction = false;
    this.fall.userData.cameraObstruction = false;
    this.root.add(this.surface,this.fall);
  }
  get settings(): WaterSettings { return this.shader.settings; }
  get elapsed(): number { return this.shader.elapsed; }

  configure(patch: Partial<WaterSettings>): boolean {
    if (this.disposed) return false;
    const previous = this.shader.settings;
    if (!this.shader.configure(patch)) return false;
    const next = this.shader.settings;
    if (next.quality !== previous.quality) {
      const old = this.surface.geometry;
      this.surface.geometry = this.surfaceGeometry(next.quality);
      old.dispose();
    }
    this.fall.visible = next.enabled;
    return true;
  }
  update(deltaSeconds: number): void {
    this.shader.update(deltaSeconds);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.root.removeFromParent();
    this.surface.geometry.dispose(); this.fall.geometry.dispose();
    this.shader.dispose();
    this.root.clear();
  }
  private surfaceGeometry(quality: WaterQuality): PlaneGeometry {
    const g = quality === 'low' ? new PlaneGeometry(4,3,32,24) : new PlaneGeometry(4,3,96,72);
    return g.rotateX(-Math.PI/2);
  }
}
