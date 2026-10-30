import {
  Color, HalfFloatType, Material, Mesh, MeshDepthMaterial, NearestFilter, NoBlending,
  OrthographicCamera, PlaneGeometry, RGBADepthPacking, Scene, ShaderMaterial,
  UnsignedByteType, Vector2, WebGLRenderTarget,
  type Camera, type Object3D, type WebGLRenderer,
} from 'three';

/** Compares independent frontmost depths; the actor can never occlude itself. */
export class CharacterXrayPass {
  private readonly base: WebGLRenderTarget;
  private readonly blockers = new WebGLRenderTarget(1, 1, { minFilter: NearestFilter, magFilter: NearestFilter });
  private readonly actor = new WebGLRenderTarget(1, 1, { minFilter: NearestFilter, magFilter: NearestFilter });
  private readonly depths = new Map<Material, MeshDepthMaterial>();
  private readonly hidden = new MeshDepthMaterial();
  private readonly output = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly geometry = new PlaneGeometry(2, 2);
  private readonly material: ShaderMaterial;
  private readonly size = new Vector2();
  private disposed = false;

  constructor(halfFloat = false) {
    this.base = new WebGLRenderTarget(1, 1, { type: halfFloat ? HalfFloatType : UnsignedByteType });
    this.hidden.visible = false;
    this.material = new ShaderMaterial({
      uniforms: { source: { value: this.base.texture }, blockers: { value: this.blockers.texture }, actor: { value: this.actor.texture } },
      depthTest: false, depthWrite: false, blending: NoBlending,
      vertexShader: `varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform sampler2D source;
        uniform sampler2D blockers;
        uniform sampler2D actor;
        varying vec2 vUv;
        #include <packing>
        void main() {
          vec4 base = texture2D(source, vUv);
          float body = unpackRGBAToDepth(texture2D(actor, vUv));
          float wall = unpackRGBAToDepth(texture2D(blockers, vUv));
          gl_FragColor = base;
          // Both depths use the same projection; bias suppresses contact-edge noise.
          if (body < 0.999999 && wall + 0.000002 < body) {
            vec3 display = sRGBTransferOETF(vec4(clamp(base.rgb, 0.0, 1.0), 1.0)).rgb;
            vec3 ghost = vec3(1.0) - display;
            float contrast = length(ghost - display);
            if (contrast < 0.6) ghost = dot(display, vec3(0.2126, 0.7152, 0.0722)) > 0.45
              ? vec3(0.0, 0.04, 0.08) : vec3(0.35, 1.0, 1.0);
            gl_FragColor.rgb = mix(base.rgb, sRGBTransferEOTF(vec4(ghost, 1.0)).rgb, 0.5);
          }
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.output.add(new Mesh(this.geometry, this.material));
  }

  render(renderer: WebGLRenderer, scene: Scene, camera: Camera, subject: Object3D, environment: Object3D): void {
    if (this.disposed) return;
    const destination = renderer.getRenderTarget();
    if (destination) this.size.set(destination.width, destination.height);
    else renderer.getDrawingBufferSize(this.size);
    for (const target of [this.base, this.blockers, this.actor]) {
      if (target.width !== this.size.x || target.height !== this.size.y) target.setSize(this.size.x, this.size.y);
    }
    const clear = renderer.getClearColor(new Color()), alpha = renderer.getClearAlpha();
    const autoClear = renderer.autoClear, shadows = renderer.shadowMap.autoUpdate;
    const background = scene.background, override = scene.overrideMaterial;
    const used = new Set<Material>();
    try {
      renderer.autoClear = true;
      renderer.setRenderTarget(this.base);
      renderer.render(scene, camera);
      scene.background = null; scene.overrideMaterial = null;
      renderer.shadowMap.autoUpdate = false;
      renderer.setClearColor(0xffffff, 1);
      this.depth(renderer, scene, camera, environment, false, this.blockers, used);
      this.depth(renderer, scene, camera, subject, true, this.actor, used);
      renderer.setRenderTarget(destination);
      renderer.render(this.output, this.camera);
    } finally {
      scene.background = background; scene.overrideMaterial = override;
      renderer.setClearColor(clear, alpha); renderer.autoClear = autoClear;
      renderer.shadowMap.autoUpdate = shadows; renderer.setRenderTarget(destination);
      for (const [original, depth] of this.depths) if (!used.has(original)) { depth.dispose(); this.depths.delete(original); }
    }
  }

  private depth(renderer: WebGLRenderer, scene: Scene, camera: Camera, root: Object3D, subject: boolean,
    target: WebGLRenderTarget, used: Set<Material>): void {
    const restore: Array<() => void> = [];
    try {
      scene.traverse(object => {
        if (object instanceof Mesh) {
          const original = object.material as Material | Material[];
          let included = false, excluded = false;
          for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
            if (!ancestor.visible || (!subject && ancestor.userData.cameraObstruction === false)) excluded = true;
            if (ancestor === root) included = true;
          }
          const convert = (material: Material): Material => {
            const translucent = material.transparent || material.opacity < 1 || material.alphaHash
              || ('transmission' in material && typeof material.transmission === 'number' && material.transmission > 0);
            if (!included || excluded || !material.visible || (!subject && translucent)) return this.hidden;
            used.add(material);
            let depth = this.depths.get(material);
            if (!depth) { depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking }); this.depths.set(material, depth); }
            depth.side = material.side;
            depth.alphaTest = material.alphaTest;
            depth.map = 'map' in material ? material.map as MeshDepthMaterial['map'] : null;
            depth.alphaMap = 'alphaMap' in material ? material.alphaMap as MeshDepthMaterial['alphaMap'] : null;
            depth.clippingPlanes = material.clippingPlanes;
            depth.clipIntersection = material.clipIntersection;
            return depth;
          };
          object.material = Array.isArray(original) ? original.map(convert) : convert(original);
          restore.push(() => { object.material = original; });
        } else if ('isPoints' in object || 'isSprite' in object || 'isLine' in object) {
          const visible = object.visible; object.visible = false;
          restore.push(() => { object.visible = visible; });
        }
      });
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    } finally { for (const reset of restore) reset(); }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const target of [this.base, this.blockers, this.actor]) target.dispose();
    for (const material of this.depths.values()) material.dispose();
    this.depths.clear(); this.hidden.dispose(); this.material.dispose(); this.geometry.dispose(); this.output.clear();
  }
}
