import { Mesh, ShaderChunk, type Material, type Object3D } from 'three';

const lights = ShaderChunk.lights_fragment_begin;
// Keep Three's direct-light calculation and index only the ordinary light
// uniforms in a loop. Shadow samplers still require the original static indices.
const pointLoop = /#pragma unroll_loop_start\s*for \( int i = 0; i < NUM_POINT_LIGHTS; i \+\+ \) \{([\s\S]*?)#pragma unroll_loop_end/;
const compactLights = lights.replace(pointLoop, (_, body: string) =>
  'for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {' + body.replace(/#if [^\n]*UNROLLED_LOOP_INDEX[^\n]*\n[\s\S]*?#endif/, ''));
const prepared = new WeakSet<Material>();

export function preparePointLightMaterial(material: Material): void {
  if (!['MeshStandardMaterial', 'MeshPhysicalMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshToonMaterial'].includes(material.type) ||
      prepared.has(material) || compactLights === lights) return;
  prepared.add(material);
  const compile = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.customProgramCacheKey = () => key + '|compact-point-lights-v1';
  material.onBeforeCompile = (shader, renderer) => {
    compile.call(material, shader, renderer);
    if (shader.numPointLights >= 24 && shader.numPointLightShadows === 0) {
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', compactLights);
    }
  };
  material.needsUpdate = true;
}

export function preparePointLightMeshes(root: Object3D): void {
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      preparePointLightMaterial(material);
    }
  });
}
