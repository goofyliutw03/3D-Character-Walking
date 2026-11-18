import { DirectionalLight, PointLight, SpotLight, Mesh, Line, Points, SkinnedMesh, Texture,
  type BufferGeometry, type Material, type Object3D } from 'three';

/** Dispose GPU registrations during loss, retaining CPU attributes, pixels and scene membership. */
export function releaseSceneGpuResources(roots: readonly Object3D[]): void {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>();
  for (const root of roots) root.traverse(object => {
    if (object instanceof Mesh || object instanceof Line || object instanceof Points) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      if (object instanceof Mesh) {
        if (object.customDepthMaterial) materials.add(object.customDepthMaterial);
        if (object.customDistanceMaterial) materials.add(object.customDistanceMaterial);
      }
    }
    if (object instanceof SkinnedMesh && object.skeleton.boneTexture) textures.add(object.skeleton.boneTexture);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    if ('uniforms' in material) for (const uniform of Object.values(material.uniforms as Record<string, { value: unknown }>)) {
      if (uniform.value instanceof Texture) textures.add(uniform.value);
    }
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

/** Retained inactive scenes also own render targets from the lost graphics context. */
export function resetShadowResources(roots: readonly Object3D[]): void {
  const visited = new Set<Object3D>();
  for (const root of roots) root.traverse(object => {
    if (visited.has(object)) return;
    visited.add(object);
    if (!(object instanceof DirectionalLight || object instanceof PointLight || object instanceof SpotLight)) return;
    for (const target of [object.shadow.map, object.shadow.mapPass]) {
      if (target?.depthTexture) { target.depthTexture.dispose(); target.depthTexture = null; }
    }
    object.shadow.dispose();
    object.shadow.map = null;
    object.shadow.mapPass = null;
    object.shadow.needsUpdate = true;
  });
}
