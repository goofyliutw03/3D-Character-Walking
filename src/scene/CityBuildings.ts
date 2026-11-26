import { Box3, Group, Mesh } from 'three';
import { disposeModel } from '../character/RiggedCharacter.ts';

export interface CityAssetState { phase: 'loading' | 'ready' | 'error'; message: string }
const defaultLoad = async (): Promise<Group> => {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  return (await new GLTFLoader().loadAsync('/assets/city/buildings.glb')).scene;
};

/** Optional visual buildings; existing ground and collision authority stays unchanged. */
export class CityBuildings {
  private pending = false;
  private disposed = false;
  private readonly adopted: Group[] = [];
  private current: CityAssetState = { phase: 'loading', message: 'Loading original Blender buildings…' };
  get state(): CityAssetState { return { ...this.current }; }
  constructor(private readonly environment: Group, private readonly fallbacks: readonly Group[],
    private readonly report: (state: CityAssetState) => void, private readonly loader = defaultLoad) {}
  async load(): Promise<void> {
    if (this.disposed || this.pending || this.current.phase === 'ready') return;
    this.pending = true;
    this.publish({ phase: 'loading', message: 'Loading original Blender buildings…' });
    let root: Group | undefined;
    try {
      root = await this.loader();
      if (this.disposed) { disposeModel(root); return; }
      root.updateMatrixWorld(true);
      const ids = new Set<string>();
      if (root.children.length !== 8) throw new Error('Expected eight buildings');
      for (const child of root.children) {
        if (!(child instanceof Group) || !/^Building_[0-7]$/.test(child.name) || ids.has(child.name)) throw new Error('Invalid building root');
        ids.add(child.name);
        const index = Number(child.name.split('_')[1]);
        const bounds = new Box3().setFromObject(child);
        const x = (bounds.min.x + bounds.max.x) / 2, z = (bounds.min.z + bounds.max.z) / 2;
        if (bounds.isEmpty() || Math.abs(x - (index < 4 ? -12.1 : 12.1)) > .02 ||
          Math.abs(z - [-20, -7, 7, 20][index % 4]!) > .02 || bounds.min.y < .29 || bounds.max.y > 12 ||
          !(bounds.min.x >= 8.29 || bounds.max.x <= -8.29)) throw new Error('Building coordinates do not match this street');
      }
      root.traverse(object => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; } });
      // Keep individual environment roots so obstruction transparency stays local to each building.
      for (const child of [...root.children]) {
        const building = child as Group;
        this.environment.add(building); this.adopted.push(building);
      }
      for (const fallback of this.fallbacks) fallback.visible = false;
      this.publish({ phase: 'ready', message: '8 original Blender buildings · procedural streetscape.' });
    } catch {
      if (root) disposeModel(root);
      if (!this.disposed) this.publish({ phase: 'error', message: 'Building asset unavailable · procedural buildings retained. Retry buildings.' });
    } finally { this.pending = false; }
  }
  private publish(state: CityAssetState): void { this.current = state; this.report(this.state); }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const resources = new Group();
    for (const building of this.adopted) resources.add(building);
    this.adopted.length = 0;
    disposeModel(resources);
    for (const fallback of this.fallbacks) fallback.visible = true;
  }
}
