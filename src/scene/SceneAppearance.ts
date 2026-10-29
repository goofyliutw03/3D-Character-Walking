import { Mesh, type Group, type Material, type Object3D } from 'three';

type AppearanceMode = 'normal' | 'transparent' | 'wireframe';
interface Override { original: Material | Material[]; clones: Material[]; mode: AppearanceMode }

export class SceneAppearance {
  private readonly overrides = new Map<Mesh, Override>();
  constructor(private readonly environment: Group) {}

  apply(mode: AppearanceMode, blockers: ReadonlySet<Object3D> = new Set()): void {
    const affected = new Set<Mesh>();
    if (mode !== 'normal') {
      for (const root of this.environment.children) {
        if (mode === 'transparent' && !blockers.has(root)) continue;
        root.traverse(object => { if (object instanceof Mesh) affected.add(object); });
      }
    }
    for (const [mesh, override] of this.overrides) {
      if (!affected.has(mesh) || override.mode !== mode) this.restore(mesh, override);
    }
    for (const mesh of affected) {
      if (this.overrides.has(mesh)) continue;
      const original = mesh.material as Material | Material[];
      const clones = (Array.isArray(original) ? original : [original]).map(material => {
        const clone = material.clone();
        if (mode === 'transparent') {
          clone.opacity = 0.25; clone.transparent = true; clone.depthWrite = false;
        } else if ('wireframe' in clone) clone.wireframe = true;
        return clone;
      });
      mesh.material = Array.isArray(original) ? clones : clones[0]!;
      this.overrides.set(mesh, { original, clones, mode });
    }
  }
  private restore(mesh: Mesh, override: Override): void {
    mesh.material = override.original;
    for (const clone of override.clones) clone.dispose();
    this.overrides.delete(mesh);
  }
  dispose(): void {
    for (const [mesh, override] of this.overrides) this.restore(mesh, override);
  }
}
