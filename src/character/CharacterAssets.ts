import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { AssetDefinition } from './assetCatalog';
import type { RiggedCharacter } from './RiggedCharacter';
import type { DownloadProgress, LoadingState } from '../ui/LoadingFeedback';

interface AssetServices {
  load(url: string, report: (progress: DownloadProgress) => void): Promise<GLTF>;
  create(data: GLTF, definition: AssetDefinition): RiggedCharacter;
  release(data: GLTF): void;
  onState(state: LoadingState): void;
  onSwap(model: RiggedCharacter | null): void;
}
export class CharacterAssets {
  private version = 0;
  private disposed = false;
  private selected: AssetDefinition | undefined;
  private model: RiggedCharacter | null = null;
  get current(): RiggedCharacter | null { return this.model; }
  constructor(private readonly services: AssetServices) {}
  async select(definition: AssetDefinition): Promise<void> {
    if (this.disposed) return;
    this.selected = definition;
    const version = ++this.version;
    this.model?.dispose(); this.model = null;
    this.services.onSwap(null);
    this.services.onState({ phase: 'loading', stage: 'loader', message: 'Preparing character loader… Procedural preview is available.' });
    let settled = false;
    try {
      const data = await this.services.load(definition.url, download => {
        if (settled || this.disposed || version !== this.version) return;
        this.services.onState({ phase: 'loading', stage: 'download', message: 'Downloading character… Procedural preview is available.', download: { ...download } });
      });
      settled = true;
      if (this.disposed || version !== this.version) { this.services.release(data); return; }
      this.services.onState({ phase: 'loading', stage: 'prepare', message: 'Preparing character and animations…' });
      try { this.model = this.services.create(data, definition); }
      catch (error) { this.services.release(data); throw error; }
      this.services.onSwap(this.model);
      this.services.onState({ phase: 'ready', message: `${definition.label} · Ready` });
    } catch {
      settled = true;
      if (this.disposed || version !== this.version) return;
      this.services.onState({ phase: 'error', message: 'Character could not load.', recovery: 'Retry or choose another character. Procedural fallback remains available.' });
    }
  }
  retry(): Promise<void> { return this.selected ? this.select(this.selected) : Promise.resolve(); }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.version++;
    this.model?.dispose(); this.model = null;
    this.services.onSwap(null);
  }
}
