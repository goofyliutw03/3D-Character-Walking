import { Mesh, MeshStandardMaterial, type Group, type Material, type Object3D } from 'three';

type AppearanceMode = 'normal' | 'transparent' | 'wireframe';
interface Override { original: Material | Material[]; clones: Material[]; mode: AppearanceMode }

export class SceneAppearance {
  private readonly overrides = new Map<Mesh, Override>();
  private readonly transparentMaterials = new Map<Material, Material>();
  constructor(private readonly environment: Group, private readonly prepareMaterial?: (material: Material) => void) {}

  apply(mode: AppearanceMode, blockers: ReadonlySet<Object3D> = new Set()): void {
    const affected = new Set<Mesh>();
    if (mode !== 'normal') {
      for (const root of this.environment.children) {
        if (mode === 'transparent' && !blockers.has(root)) continue;
        root.traverse(object => { if (object instanceof Mesh && !object.userData.preserveLightMaterial) affected.add(object); });
      }
    }
    for (const [mesh, override] of this.overrides) {
      if (!affected.has(mesh) || override.mode !== mode) this.restore(mesh, override);
    }
    for (const mesh of affected) {
      const active = this.overrides.get(mesh);
      if (active) {
        if (active.mode === 'transparent') {
          for (let index = 0; index < active.clones.length; index++) {
            const original = Array.isArray(active.original) ? active.original[index]! : active.original;
            this.syncTransparency(original, active.clones[index]!);
          }
        }
        continue;
      }
      const original = mesh.material as Material | Material[];
      const clones = (Array.isArray(original) ? original : [original]).map(material => {
        if (mode === 'transparent') {
          let clone = this.transparentMaterials.get(material);
          if (!clone) {
            clone = material.clone();
            this.prepareMaterial?.(clone);
            clone.opacity = 0.25; clone.transparent = true; clone.depthWrite = false;
            this.transparentMaterials.set(material, clone);
          }
          this.syncTransparency(material, clone);
          return clone;
        }
        const clone = material.clone();
        this.prepareMaterial?.(clone);
        if ('wireframe' in clone) clone.wireframe = true;
        return clone;
      });
      mesh.material = Array.isArray(original) ? clones : clones[0]!;
      this.overrides.set(mesh, { original, clones, mode });
    }
  }
  private syncTransparency(original: Material, clone: Material): void {
    // Street lamp lenses change emissive intensity when the time of day changes.
    if (original instanceof MeshStandardMaterial && clone instanceof MeshStandardMaterial) {
      clone.emissiveIntensity = original.emissiveIntensity;
    }
  }
  prepareTransparency(compile: () => void): void {
    try {
      this.apply('transparent', new Set(this.environment.children));
      compile();
    } finally {
      this.apply('normal');
    }
  }
  private restore(mesh: Mesh, override: Override): void {
    mesh.material = override.original;
    if (override.mode === 'wireframe') for (const clone of override.clones) clone.dispose();
    this.overrides.delete(mesh);
  }
  dispose(): void {
    for (const [mesh, override] of this.overrides) this.restore(mesh, override);
    for (const material of this.transparentMaterials.values()) material.dispose();
    this.transparentMaterials.clear();
  }
}
