import { ACESFilmicToneMapping, PCFShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { FisheyePass } from './FisheyePass';
export interface RenderStats { drawCalls: number; triangles: number; geometries: number; textures: number }

export class SceneRenderer {
  readonly renderer: WebGLRenderer;
  private readonly observer: ResizeObserver;
  private fisheye: FisheyePass | undefined;
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
  render(scene: Scene, fisheye = false): void {
    this.renderer.info.reset();
    if (!fisheye) { this.renderer.render(scene, this.camera); return; }
    if (!this.fisheye) {
      this.fisheye = new FisheyePass(this.renderer.extensions.has('EXT_color_buffer_float'));
      this.fisheye.resize(this.width, this.height, this.renderer.getPixelRatio());
    }
    this.fisheye.render(this.renderer, scene, this.camera);
  }
  setShadows(enabled: boolean): void { this.renderer.shadowMap.enabled = enabled; }
  get stats(): RenderStats {
    const { render, memory } = this.renderer.info;
    return { drawCalls: render.calls, triangles: render.triangles, geometries: memory.geometries, textures: memory.textures };
  }
  dispose(): void {
    this.observer.disconnect();
    this.renderer.setAnimationLoop(null);
    this.fisheye?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
