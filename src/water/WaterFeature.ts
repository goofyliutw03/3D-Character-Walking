import { Group, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { WaterShaderModule, type WaterQuality, type WaterSettings } from './WaterShaderModule.ts';
import { WaterfallSpray } from './WaterfallSpray.ts';
import type { SpraySource } from './SpraySource.ts';
export type { WaterQuality, WaterSettings } from './WaterShaderModule.ts';

/** Owns only its meshes; the host owns rendering, timing and lights. */
export class WaterFeature {
  readonly root = new Group();
  private readonly shader = new WaterShaderModule();
  private readonly spray = new WaterfallSpray();
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
    this.root.add(this.surface,this.fall,this.spray.points);
  }
  get settings(): WaterSettings { return this.shader.settings; }
  get elapsed(): number { return this.shader.elapsed; }
  getSpraySource(target: SpraySource): boolean {
    if(this.disposed) return false;
    this.root.updateWorldMatrix(true,false);
    target.matrixWorld.copy(this.root.matrixWorld);
    target.center.set(0,1.1,-.85);target.halfSize.set(.65,.9,.35);
    return true;
  }

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
    this.spray.update(next,this.elapsed);
    return true;
  }
  update(deltaSeconds: number): void {
    this.shader.update(deltaSeconds);
    this.spray.update(this.settings,this.elapsed);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.root.removeFromParent();
    this.surface.geometry.dispose(); this.fall.geometry.dispose();
    this.shader.dispose();
    this.spray.dispose();
    this.root.clear();
  }
  private surfaceGeometry(quality: WaterQuality): PlaneGeometry {
    const g = quality === 'low' ? new PlaneGeometry(4,3,32,24) : new PlaneGeometry(4,3,96,72);
    return g.rotateX(-Math.PI/2);
  }
}
