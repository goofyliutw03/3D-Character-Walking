import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CityScene } from '../scene/CityScene';
import { SceneRenderer, type RenderStats } from './SceneRenderer';
import { Character } from '../character/Character';
import { CharacterController } from '../character/CharacterController';
import type { CharacterVariant, MotionSnapshot } from '../character/motion';
import { InputManager, type MoveDirection } from '../input/InputManager';
import { FollowCamera } from '../camera/FollowCamera';
import { FirstPersonCamera } from '../camera/FirstPersonCamera';
import { CameraController, type CameraSubject, type CameraView } from '../camera/CameraController';
import { projectAnchor } from '../camera/AnchorProjection';
import { ExpressionManager, emotions, type Emotion, type ExpressionState } from '../expression/ExpressionManager';
import { ExpressionOverlay } from '../expression/ExpressionOverlay';
import { assetCatalog } from '../character/assetCatalog';
import { RiggedCharacter, disposeModel } from '../character/RiggedCharacter';
import { CharacterAssets } from '../character/CharacterAssets';
import type { LoadingState } from '../ui/LoadingFeedback';

export type CameraPreset = CameraView;
export interface CharacterStatus { variant: CharacterVariant; action: MotionSnapshot['action']; running: boolean; following: boolean; firstPerson: boolean; cameraView: CameraView }

export class ViewerApp {
  private readonly camera = new PerspectiveCamera(43, 1, 0.1, 200);
  private readonly city: CityScene;
  private readonly view: SceneRenderer;
  private readonly controls: OrbitControls;
  private readonly character: Character;
  private readonly movement: CharacterController;
  private readonly input: InputManager;
  private readonly cameras: CameraController;
  private readonly expressions = new ExpressionManager();
  private readonly overlay: ExpressionOverlay;
  private readonly anchor = new Vector3();
  private readonly assets: CharacterAssets;
  private shadows = true;
  private variant: CharacterVariant = 'man';
  private motion: Readonly<MotionSnapshot>;
  private readonly events = new AbortController();
  private lastTime = 0;
  private sampleTime = 0;
  private frameCount = 0;
  private contextLost = false;
  private disposed = false;
  constructor(private readonly container: HTMLElement, private readonly report: (message: string) => void, private readonly fps: (value: number) => void, private readonly characterReport?: (status: CharacterStatus) => void, assetReport?: (state: LoadingState) => void, private readonly metricsReport?: (stats: RenderStats) => void) {
    this.view = new SceneRenderer(container, this.camera);
    this.city = new CityScene();
    const obstructions = [...this.city.scene.children];
    this.controls = new OrbitControls(this.camera, this.view.renderer.domElement);
    this.character = new Character();
    this.movement = new CharacterController(this.city.walkableWorld);
    this.input = new InputManager();
    this.motion = this.movement.update(0, this.input.sample());
    this.character.update(this.motion, 0);
    this.city.scene.add(this.character.root);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 95;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.cameras = new CameraController(this.camera, this.controls, new FollowCamera(obstructions), new FirstPersonCamera());
    this.controls.addEventListener('start', () => this.cameras.interrupt());
    this.cameras.select('overview', this.getCameraSubject(), true);
    this.controls.update();
    this.overlay = new ExpressionOverlay(container);
    this.assets = new CharacterAssets({
      load: async url => {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        return new GLTFLoader().loadAsync(url);
      },
      create: (data, definition) => new RiggedCharacter(data, definition),
      release: data => disposeModel(data.scene),
      onState: state => assetReport?.(state),
      onSwap: model => {
        if (model) {
          model.setShadows(this.shadows);
          model.update(this.motion, 0);
          model.root.visible = this.cameras.characterVisible;
          this.city.scene.add(model.root);
        }
        this.character.root.visible = !model && this.cameras.characterVisible;
        this.view.renderer.domElement.setAttribute('aria-label', `Interactive city with a ${model ? 'rigged character' : 'procedural fallback'}. Click then use WASD or arrows, Shift to run, Space to jump.`);
      },
    });
    const canvas = this.view.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Interactive city with a procedural character. Click then use WASD or arrows, Shift to run, Space to jump.');
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }), { signal: this.events.signal });
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.contextLost = true;
      this.overlay.place(null);
      this.report('Graphics connection lost. Waiting for recovery…');
    }, { signal: this.events.signal });
    canvas.addEventListener('webglcontextrestored', () => { this.contextLost = false; this.report('WebGL2 · connection restored'); }, { signal: this.events.signal });
    this.view.renderer.setAnimationLoop(time => this.update(time));
    this.report('WebGL2 · ready');
    void this.assets.select(assetCatalog[this.variant]);
  }
  private update(time: number): void {
    if (this.disposed || this.contextLost) return;
    const delta = Math.min((time - this.lastTime) / 1000 || 1 / 60, 0.05);
    this.lastTime = time;
    this.motion = this.movement.update(delta, this.input.sample());
    this.character.update(this.motion, delta);
    this.assets.current?.update(this.motion, delta);
    this.characterReport?.(this.getCharacterStatus());
    this.cameras.update(this.getCameraSubject(), delta, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.character.root.visible = !this.assets.current && this.cameras.characterVisible;
    if (this.assets.current) this.assets.current.root.visible = this.cameras.characterVisible;
    this.anchor.set(this.motion.x, this.motion.y + this.getSubjectHeight() + 0.25, this.motion.z);
    this.overlay.place(this.cameras.characterVisible
      ? projectAnchor(this.anchor, this.camera, this.container.clientWidth, this.container.clientHeight, this.cameras.fisheye)
      : null);
    this.view.render(this.city.scene, this.cameras.fisheye);
    this.frameCount++;
    if (time - this.sampleTime >= 1000) {
      this.fps(Math.round(this.frameCount * 1000 / (time - this.sampleTime)));
      this.metricsReport?.(this.view.stats);
      this.frameCount = 0; this.sampleTime = time;
    }
  }
  setCamera(preset: CameraPreset): void {
    this.cameras.select(preset, this.getCameraSubject(), window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.character.root.visible = !this.assets.current && this.cameras.characterVisible;
    if (this.assets.current) this.assets.current.root.visible = this.cameras.characterVisible;
    if (!this.cameras.characterVisible) this.overlay.place(null);
  }
  setEmotion(emotion: Emotion): void { this.expressions.setEmotion(emotion); this.updateExpression(); }
  setSpeech(text: string): void { this.expressions.setSpeech(text); this.updateExpression(); }
  getExpression(): Readonly<ExpressionState> { return this.expressions.snapshot; }
  private updateExpression(): void {
    const state = this.expressions.snapshot;
    this.overlay.setContent(state, emotions[state.emotion].icon);
  }
  setEvening(evening: boolean): void { this.city.setEvening(evening); }
  setCharacter(variant: CharacterVariant): void {
    this.variant = variant; this.character.setVariant(variant);
    void this.assets.select(assetCatalog[variant]);
  }
  retryCharacter(): void { void this.assets.retry(); }
  private getSubjectHeight(): number { return this.assets.current?.height ?? this.character.height; }
  setFollowing(enabled: boolean): void {
    this.cameras.setFollowing(enabled, this.getCameraSubject(), window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  private getCameraSubject(): CameraSubject {
    const subject = this.assets?.current ?? this.character;
    return { ...this.motion, height: subject.height, eyeHeight: subject.eyeHeight, eyeForward: subject.eyeForward };
  }
  setRunning(enabled: boolean): void { this.input.setRun(enabled); }
  jump(): void { this.input.jump(); }
  stop(): void { this.input.stop(); }
  bindDirection(button: HTMLButtonElement, direction: MoveDirection): void { this.input.bindDirection(button, direction); }
  getCharacterStatus(): CharacterStatus {
    return { variant: this.variant, action: this.motion.action, running: this.input.running, following: this.cameras.following, firstPerson: this.cameras.view === 'first-person', cameraView: this.cameras.view };
  }
  setShadows(enabled: boolean): void {
    this.shadows = enabled;
    this.view.setShadows(enabled);
    this.city.setShadows(enabled);
    this.character.setShadows(enabled);
    this.assets.current?.setShadows(enabled);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.events.abort();
    this.assets.dispose(); this.input.dispose(); this.character.dispose(); this.overlay.dispose();
    this.controls.dispose(); this.city.dispose(); this.view.dispose();
  }
}
