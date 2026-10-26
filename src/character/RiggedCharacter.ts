import { AnimationMixer, Box3, Group, LoopOnce, LoopRepeat, Mesh, Texture, Vector3 } from 'three';
import type { AnimationAction, BufferGeometry, Material, Object3D, Skeleton, SkinnedMesh } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { AssetDefinition } from './assetCatalog';
import type { CharacterAction, MotionSnapshot } from './motion';

export function disposeModel(root: Object3D): void {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>();
  const textures = new Set<Texture>(), skeletons = new Set<Skeleton>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
    if ('isSkinnedMesh' in object && object.isSkinnedMesh) skeletons.add((object as SkinnedMesh).skeleton);
  });
  for (const resource of [...textures, ...materials, ...geometries, ...skeletons]) resource.dispose();
  root.removeFromParent();
}

export class RiggedCharacter {
  readonly root = new Group();
  readonly mixer: AnimationMixer;
  private readonly actions: Record<CharacterAction, AnimationAction>;
  private active: AnimationAction;
  private fading: AnimationAction | undefined;
  private fadeRemaining = 0;
  private selected: CharacterAction = 'idle';
  private disposed = false;
  get action(): CharacterAction { return this.selected; }
  get height(): number { return this.definition.height; }
  get eyeHeight(): number { return this.definition.eyeHeight; }
  get eyeForward(): number { return this.definition.eyeForward; }
  constructor(private readonly gltf: GLTF, readonly definition: AssetDefinition) {
    let hasSkin = false;
    gltf.scene.traverse(o => { if ('isSkinnedMesh' in o && o.isSkinnedMesh) hasSkin = true; });
    if (!hasSkin) throw new Error('Character has no skinned mesh.');
    const clips = Object.fromEntries(Object.entries(definition.clips).map(([action, name]) => {
      const clip = gltf.animations.find(a => a.name === name);
      if (!clip || clip.duration <= 0) throw new Error(`Character is missing required animation ${name}.`);
      return [action, clip];
    }));
    this.mixer = new AnimationMixer(gltf.scene);
    this.actions = Object.fromEntries(Object.entries(clips).map(([name, clip]) => [name, this.mixer.clipAction(clip)])) as Record<CharacterAction, AnimationAction>;
    this.actions.jump.setLoop(LoopOnce, 1);
    this.actions.jump.clampWhenFinished = true;
    this.actions.jump.timeScale = clips.jump!.duration / 0.8;
    for (const action of ['idle','walk','run'] as const) this.actions[action].setLoop(LoopRepeat, Infinity);
    this.active = this.actions.idle;
    this.active.play(); this.mixer.update(0);
    gltf.scene.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(gltf.scene);
    const size = bounds.getSize(new Vector3());
    if (!Number.isFinite(size.y) || size.y < 0.001) throw new Error('Character has invalid dimensions.');
    const scale = definition.height / size.y;
    const center = bounds.getCenter(new Vector3());
    const visual = new Group();
    visual.add(gltf.scene); visual.scale.setScalar(scale);
    visual.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    this.root.name = 'rigged-character'; this.root.add(visual);
    this.setShadows(true);
  }
  update(state: Readonly<MotionSnapshot>, delta: number): void {
    if (this.disposed) return;
    const dt = Math.min(Math.max(delta, 0), 0.05);
    this.root.position.set(state.x, state.y, state.z);
    this.root.rotation.y = state.heading;
    if (state.action !== this.selected) {
      this.fading?.stop();
      const next = this.actions[state.action];
      next.reset().setEffectiveWeight(1).play();
      this.active.crossFadeTo(next, 0.18, false);
      this.fading = this.active; this.fadeRemaining = 0.18;
      this.active = next; this.selected = state.action;
    }
    if (this.selected === 'walk') this.active.timeScale = Math.max(0.5, state.speed / 1.9);
    if (this.selected === 'run') this.active.timeScale = Math.max(0.5, state.speed / 4.5);
    this.mixer.update(dt);
    this.fadeRemaining -= dt;
    if (this.fading && this.fadeRemaining <= 0) { this.fading.stop(); this.fading = undefined; }
  }
  setShadows(enabled: boolean): void {
    this.root.traverse(o => { if (o instanceof Mesh) { o.castShadow = enabled; o.receiveShadow = true; } });
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.gltf.scene);
    disposeModel(this.gltf.scene); this.root.removeFromParent();
  }
}
