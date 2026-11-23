import { Mesh, Vector2, Vector3, type Material, type Object3D } from 'three';
import { preparePointLightMaterial } from './PointLightShader.ts';

const travelMs = 2000;
const fadeMs = 250;
const range = 20;
const frontWidth = 0.16;
const tailLength = 3.4;
const supportedMaterials = new Set([
  'MeshBasicMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial',
  'MeshPhysicalMaterial', 'MeshToonMaterial', 'MeshMatcapMaterial',
]);

export class EnvironmentScan {
  private readonly origin = { value: new Vector3() };
  private readonly wave = { value: -1 };
  private readonly squaredBand = { value: new Vector2() };
  private readonly strength = { value: 0 };
  private readonly materials = new WeakSet<Material>();
  private readonly roots = new Set<Object3D>();
  private startedAt: number | undefined;

  start(foot: { x: number; y: number; z: number }): void {
    this.origin.value.copy(foot);
    this.startedAt = undefined;
    this.setRadius(0);
    this.strength.value = 1;
  }

  update(time: number): void {
    if (this.strength.value === 0) return;
    this.startedAt ??= time;
    const elapsed = Math.max(0, time - this.startedAt);
    if (elapsed >= travelMs + fadeMs) { this.clear(); return; }
    this.setRadius(range * Math.min(1, elapsed / travelMs));
    this.strength.value = 1 - Math.max(0, elapsed - travelMs) / fadeMs;
  }

  private setRadius(radius: number): void {
    this.wave.value = radius;
    this.squaredBand.value.set(Math.max(0, radius - tailLength) ** 2, (radius + frontWidth) ** 2);
  }

  prepare(root: Object3D): void {
    root.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) this.prepareMaterial(material);
    });
  }

  private readonly prepareChild = ({ child }: { child: Object3D }): void => this.prepare(child);

  // These roots receive complete subtrees when assets load or traffic rebuilds.
  watch(root: Object3D): void {
    this.prepare(root);
    this.roots.add(root);
    root.addEventListener('childadded', this.prepareChild);
  }

  clear(): void {
    this.startedAt = undefined;
    this.strength.value = 0;
  }

  dispose(): void {
    this.clear();
    for (const root of this.roots) root.removeEventListener('childadded', this.prepareChild);
    this.roots.clear();
  }

  readonly prepareMaterial = (material: Material): void => {
    if (this.materials.has(material) || !supportedMaterials.has(material.type)) return;
    this.materials.add(material);
    preparePointLightMaterial(material);
    const compile = material.onBeforeCompile;
    const originalKey = material.customProgramCacheKey();
    material.customProgramCacheKey = () => originalKey + '|environment-scan-v4';
    material.onBeforeCompile = (shader, renderer) => {
      compile.call(material, shader, renderer);
      shader.uniforms.environmentScanOrigin = this.origin;
      shader.uniforms.environmentScanWave = this.wave;
      shader.uniforms.environmentScanSquaredBand = this.squaredBand;
      shader.uniforms.environmentScanStrength = this.strength;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `
        #include <common>
        uniform float environmentScanStrength;
        varying vec3 vEnvironmentScanPosition;`)
        .replace('#include <project_vertex>', `
        #include <project_vertex>
        vEnvironmentScanPosition = vec3(0.0);
        if (environmentScanStrength > 0.0) {
          vec4 scanPosition = vec4(transformed, 1.0);
          #ifdef USE_BATCHING
            scanPosition = batchingMatrix * scanPosition;
          #endif
          #ifdef USE_INSTANCING
            scanPosition = instanceMatrix * scanPosition;
          #endif
          vEnvironmentScanPosition = (modelMatrix * scanPosition).xyz;
        }`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
        #include <common>
        uniform vec3 environmentScanOrigin;
        uniform float environmentScanWave;
        uniform vec2 environmentScanSquaredBand;
        uniform float environmentScanStrength;
        varying vec3 vEnvironmentScanPosition;`)
        .replace('#include <tonemapping_fragment>', `
        if (environmentScanStrength > 0.0) {
          vec3 scanOffset = vEnvironmentScanPosition - environmentScanOrigin;
          float scanDistanceSquared = dot(scanOffset, scanOffset);
          if (scanDistanceSquared >= environmentScanSquaredBand.x && scanDistanceSquared <= environmentScanSquaredBand.y) {
            float scanLag = environmentScanWave - sqrt(scanDistanceSquared);
            float scanFront = smoothstep(-${frontWidth}, 0.0, scanLag) * (1.0 - smoothstep(0.0, 0.32, scanLag));
            float scanEdge = smoothstep(-0.07, 0.0, scanLag) * (1.0 - smoothstep(0.025, 0.14, scanLag));
            float scanTail = smoothstep(0.0, 0.23, scanLag) * (1.0 - smoothstep(0.23, ${tailLength}, scanLag));
            vec3 scanGlow = vec3(0.02, 0.55, 0.92) * (0.52 * scanFront + 0.30 * scanTail);
            scanGlow += vec3(0.62, 0.95, 1.15) * scanEdge;
            gl_FragColor.rgb += scanGlow * environmentScanStrength;
          }
        }
        #include <tonemapping_fragment>`);
    };
    material.needsUpdate = true;
  };
}
