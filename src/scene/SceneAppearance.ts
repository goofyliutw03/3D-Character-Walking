import { Mesh, type Group, type Material, type Object3D } from 'three';

type AppearanceMode = 'normal' | 'transparent' | 'wireframe';
interface Override { original: Material | Material[]; clones: Material[]; mode: AppearanceMode }

export class SceneAppearance {
  private readonly overrides = new Map<Mesh, Override>();
  private readonly fadeMaterials = new Map<Material, Material>();
  private readonly affected = new Set<Mesh>();
  constructor(
    private readonly environment: Group,
    private readonly prepareMaterial?: (material: Material) => void,
    private readonly reuseFadeMaterials = false,
  ) {}

  apply(mode: AppearanceMode, blockers?: ReadonlySet<Object3D>): void {
    const affected = this.affected;
    affected.clear();
    if (mode !== 'normal') {
      for (const root of mode === 'transparent' ? blockers ?? [] : this.environment.children) {
        root.traverse(object => { if (object instanceof Mesh && object.userData.preserveLightMaterial !== true) affected.add(object); });
      }
    }
    for (const [mesh, override] of this.overrides) {
      if (!affected.has(mesh) || override.mode !== mode) this.restore(mesh, override);
    }
    for (const mesh of affected) {
      if (this.overrides.has(mesh)) continue;
      const original = mesh.material as Material | Material[];
      const clones = (Array.isArray(original) ? original : [original]).map(material => {
        const reusable = mode === 'transparent' && this.reuseFadeMaterials;
        const cached = reusable ? this.fadeMaterials.get(material) : undefined;
        if (cached) return cached;
        const clone = material.clone();
        if (mode === 'transparent') {
          clone.opacity = 0.25; clone.transparent = true; clone.depthWrite = false;
        } else if ('wireframe' in clone) clone.wireframe = true;
        this.prepareMaterial?.(clone);
        if (reusable) this.fadeMaterials.set(material, clone);
        return clone;
      });
      mesh.material = Array.isArray(original) ? clones : clones[0]!;
      this.overrides.set(mesh, { original, clones, mode });
    }
    affected.clear();
    if (mode !== 'transparent') this.disposeFadeMaterials();
  }
  private restore(mesh: Mesh, override: Override): void {
    mesh.material = override.original;
    if (override.mode !== 'transparent' || !this.reuseFadeMaterials)
      for (const clone of override.clones) clone.dispose();
    this.overrides.delete(mesh);
  }
  dispose(): void {
    for (const [mesh, override] of this.overrides) this.restore(mesh, override);
    this.disposeFadeMaterials();
  }
  private disposeFadeMaterials(): void {
    for (const clone of this.fadeMaterials.values()) clone.dispose();
    this.fadeMaterials.clear();
  }
}
