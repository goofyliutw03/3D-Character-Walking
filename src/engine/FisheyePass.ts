import { HalfFloatType, Mesh, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, UnsignedByteType, WebGLRenderer, WebGLRenderTarget } from 'three';

export class FisheyePass {
  private readonly target: WebGLRenderTarget;
  private readonly capture = new PerspectiveCamera(160, 1, 0.1, 200);
  private readonly output = new Scene();
  private readonly screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly geometry = new PlaneGeometry(2, 2);
  private readonly material: ShaderMaterial;
  private disposed = false;
  constructor(halfFloat = true) {
    this.target = new WebGLRenderTarget(256, 256, { type: halfFloat ? HalfFloatType : UnsignedByteType, depthBuffer: true, stencilBuffer: false });
    this.material = new ShaderMaterial({
      uniforms: { source: { value: this.target.texture }, aspect: { value: 1 } },
      depthTest: false, depthWrite: false,
      vertexShader: `varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform sampler2D source;
        uniform float aspect;
        varying vec2 vUv;
        void main() {
          vec2 scale = vec2(max(aspect, 1.0), max(1.0 / aspect, 1.0));
          vec2 p = (vUv - 0.5) * 2.0 * scale;
          float r = length(p);
          if (r > 1.0) gl_FragColor = vec4(0.012, 0.018, 0.014, 1.0);
          else {
            float halfFov = 1.3962634016;
            float sourceRadius = tan(r * halfFov) / tan(halfFov);
            vec2 sourceUv = vec2(0.5) + p / max(r, 0.000001) * sourceRadius * 0.5;
            gl_FragColor = texture2D(source, sourceUv);
          }
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.output.add(new Mesh(this.geometry, this.material));
  }
  resize(width: number, height: number, pixelRatio: number): void {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    const size = Math.max(1536, Math.min(2048, Math.round(Math.max(safeWidth, safeHeight) * pixelRatio * 2)));
    this.target.setSize(size, size);
    this.material.uniforms.aspect!.value = safeWidth / safeHeight;
  }
  render(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, capture?: (camera: PerspectiveCamera) => void): void {
    const previous = renderer.getRenderTarget();
    this.capture.copy(camera, false);
    this.capture.aspect = 1;
    this.capture.fov = 160;
    this.capture.updateProjectionMatrix();
    try {
      renderer.setRenderTarget(this.target);
      if (capture) capture(this.capture);
      else renderer.render(scene, this.capture);
      renderer.setRenderTarget(previous);
      renderer.render(this.output, this.screenCamera);
    } finally { renderer.setRenderTarget(previous); }
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.target.dispose(); this.geometry.dispose(); this.material.dispose();
    this.output.clear();
  }
}
