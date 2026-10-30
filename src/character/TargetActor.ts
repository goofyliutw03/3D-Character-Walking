import { Group, Vector3 } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { Character } from './Character.ts';
import { CharacterAssets } from './CharacterAssets.ts';
import { RiggedCharacter, disposeModel } from './RiggedCharacter.ts';
import { assetCatalog } from './assetCatalog.ts';
import type { MotionSnapshot, WalkableWorld } from './motion';
import type { LoadingState, DownloadProgress } from '../ui/LoadingFeedback';

type LoadTarget = (url: string, progress: (value: DownloadProgress) => void) => Promise<GLTF>;
const loadTarget: LoadTarget = async (url, progress) => {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  return new GLTFLoader().loadAsync(url, event => progress({ loaded: event.loaded, total: event.lengthComputable ? event.total : undefined }));
};

/** Owns a separately parsed rig; never shares disposable resources with Caster. */
export class TargetActor {
  readonly root = new Group();
  readonly ready: Promise<void>;
  private readonly fallback = new Character();
  private readonly assets: CharacterAssets;
  private readonly motion: MotionSnapshot;
  private shadows = true;
  private disposed = false;
  get model(): RiggedCharacter | null { return this.assets.current; }
  get height(): number { return this.model?.height ?? this.fallback.height; }
  get anchor(): Vector3 { return new Vector3(this.motion.x, this.motion.y + this.height * .6, this.motion.z); }
  constructor(private readonly world: WalkableWorld, report: (state: LoadingState) => void, load: LoadTarget = loadTarget) {
    this.motion = { x: 0, y: world.groundHeight(0,-1), z: -1, heading: 0, speed: 0, grounded: true, action: 'idle' };
    this.root.name = 'target-actor';
    this.fallback.setVariant('woman'); this.root.add(this.fallback.root);
    this.assets = new CharacterAssets({
      load, create: (data, definition) => new RiggedCharacter(data, definition), release: data => disposeModel(data.scene),
      onState: report,
      onSwap: model => {
        this.fallback.root.visible = !model && !this.disposed;
        if (model) { model.setShadows(this.shadows); model.update(this.motion,0); this.root.add(model.root); }
      },
    });
    this.update(0);
    this.ready = this.assets.select(assetCatalog.woman);
  }
  update(delta: number): void {
    if (this.disposed) return;
    this.fallback.update(this.motion,delta); this.model?.update(this.motion,delta);
  }
  reset(): void {
    if (this.disposed) return;
    Object.assign(this.motion,{ x:0, y:this.world.groundHeight(0,-1), z:-1 }); this.update(0);
  }
  retry(): Promise<void> { return this.assets.retry(); }
  setShadows(enabled: boolean): void {
    this.shadows = enabled; this.fallback.setShadows(enabled); this.model?.setShadows(enabled);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.assets.dispose(); this.fallback.dispose(); this.root.clear(); this.root.removeFromParent();
  }
}
