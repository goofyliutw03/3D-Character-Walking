import { ACESFilmicToneMapping, Group, Mesh, MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, Scene, WebGLRenderer, type Object3D } from 'three';
import { FisheyePass } from './FisheyePass';
import { CharacterXrayPass } from './CharacterXrayPass';
import { EnvironmentScan } from './EnvironmentScan';
import { WetLensEffect } from '../water/index.ts';
export interface RenderStats { drawCalls: number; triangles: number; geometries: number; textures: number }

export class SceneRenderer {
  readonly waterLens = new WetLensEffect();
  readonly environmentScan = new EnvironmentScan();
  readonly renderer: WebGLRenderer;
  private readonly observer: ResizeObserver;
  private fisheye: FisheyePass | undefined;
  private xray: CharacterXrayPass | undefined;
  private width = 1;
  private height = 1;
  constructor(private readonly container: HTMLElement, private readonly camera: PerspectiveCamera) {
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.info.autoReset = false;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D city street. Drag to orbit, scroll to zoom.');
    this.renderer.domElement.setAttribute('role', 'img');
    container.append(this.renderer.domElement);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
  }
  private resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.width = width; this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.fisheye?.resize(width, height, this.renderer.getPixelRatio());
  }
  async prepareEnvironmentShaders(environment: Object3D, scene: Scene): Promise<void> {
    if (!this.renderer.extensions.has('KHR_parallel_shader_compile') || this.renderer.getContext().isContextLost()) return;
    try {
      // Three.js gathers lights from both roots. The detached meshes reuse the
      // environment materials while the render scene supplies the lights once.
      const meshes = new Group();
      environment.traverseVisible(object => {
        if (object instanceof Mesh && object.material instanceof MeshStandardMaterial) meshes.add(object.clone(false));
      });
      await this.renderer.compileAsync(meshes, this.camera, scene);
    } catch (error) {
      console.warn('Environment shader preparation failed', error);
    }
  }
  render(scene: Scene, fisheye: boolean | number = false, xray?: { subject: Object3D; environment: Object3D; staticBlockers: boolean }): void {
    this.renderer.info.reset();
    if (xray && !this.xray) this.xray = new CharacterXrayPass(this.renderer.extensions.has('EXT_color_buffer_float'));
    if (!xray && this.xray) { this.xray.dispose(); this.xray = undefined; }
    const capture = (camera: PerspectiveCamera): void => {
      if (xray) this.xray!.render(this.renderer, scene, camera, xray.subject, xray.environment, xray.staticBlockers);
      else this.renderer.render(scene, camera);
    };
    if (!fisheye) { this.fisheye?.finishBlend(); capture(this.camera); this.waterLens.render(this.renderer); return; }
    if (!this.fisheye) {
      this.fisheye = new FisheyePass(this.renderer.extensions.has('EXT_color_buffer_float'));
      this.fisheye.resize(this.width, this.height, this.renderer.getPixelRatio());
    }
    this.fisheye.render(this.renderer, scene, this.camera, capture, Number(fisheye));
    this.waterLens.render(this.renderer, Number(fisheye) >= .5);
  }
  setShadows(enabled: boolean): void { this.renderer.shadowMap.enabled = enabled; }
  releaseContextResources(): void {
    this.environmentScan.clear();
    this.fisheye?.dispose(); this.fisheye = undefined;
    this.xray?.dispose(); this.xray = undefined;
    this.waterLens.clear();
  }
  restoreContext(): void {
    this.renderer.setRenderTarget(null);
    this.resize();
  }
  get stats(): RenderStats {
    const { render, memory } = this.renderer.info;
    return { drawCalls: render.calls, triangles: render.triangles, geometries: memory.geometries, textures: memory.textures };
  }
  dispose(): void {
    this.environmentScan.dispose();
    this.observer.disconnect();
    this.renderer.setAnimationLoop(null);
    this.fisheye?.dispose();
    this.xray?.dispose();
    this.waterLens.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
