import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CityScene } from '../scene/CityScene';
import { SceneRenderer } from './SceneRenderer';
import { Character } from '../character/Character';
import { CharacterController } from '../character/CharacterController';
import type { CharacterVariant, MotionSnapshot } from '../character/motion';
import { InputManager, type MoveDirection } from '../input/InputManager';
import { FollowCamera } from '../camera/FollowCamera';

export type CameraPreset = 'overview' | 'street' | 'overhead';
export interface CharacterStatus { variant: CharacterVariant; action: MotionSnapshot['action']; running: boolean; following: boolean }
const presets: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  overview: { position: [38, 46, 48], target: [0, 1, 0] },
  street: { position: [0, 3, 23], target: [0, 2, -8] },
  overhead: { position: [0, 55, 0.01], target: [0, 0, 0] },
};

export class ViewerApp {
  private readonly camera = new PerspectiveCamera(43, 1, 0.1, 200);
  private readonly city: CityScene;
  private readonly view: SceneRenderer;
  private readonly controls: OrbitControls;
  private readonly character: Character;
  private readonly movement: CharacterController;
  private readonly input: InputManager;
  private readonly follow: FollowCamera;
  private following = false;
  private variant: CharacterVariant = 'man';
  private motion: Readonly<MotionSnapshot>;
  private readonly events = new AbortController();
  private transition: { position: Vector3; target: Vector3 } | undefined;
  private lastTime = 0;
  private sampleTime = 0;
  private frameCount = 0;
  private contextLost = false;
  private disposed = false;
  constructor(container: HTMLElement, private readonly report: (message: string) => void, private readonly fps: (value: number) => void, private readonly characterReport?: (status: CharacterStatus) => void) {
    this.view = new SceneRenderer(container, this.camera);
    this.city = new CityScene();
    this.follow = new FollowCamera([...this.city.scene.children]);
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
    this.controls.addEventListener('start', () => { this.transition = undefined; });
    this.camera.position.set(...presets.overview.position);
    this.controls.target.set(...presets.overview.target);
    this.controls.update();
    const canvas = this.view.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Interactive city with a procedural character. Click then use WASD or arrows, Shift to run, Space to jump.');
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }), { signal: this.events.signal });
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.contextLost = true;
      this.report('Graphics connection lost. Waiting for recovery…');
    }, { signal: this.events.signal });
    canvas.addEventListener('webglcontextrestored', () => { this.contextLost = false; this.report('WebGL2 · connection restored'); }, { signal: this.events.signal });
    this.view.renderer.setAnimationLoop(time => this.update(time));
    this.report('WebGL2 · ready');
  }
  private update(time: number): void {
    if (this.disposed || this.contextLost) return;
    const delta = Math.min((time - this.lastTime) / 1000 || 1 / 60, 0.05);
    this.lastTime = time;
    this.motion = this.movement.update(delta, this.input.sample());
    this.character.update(this.motion, delta);
    this.characterReport?.(this.getCharacterStatus());
    if (this.transition) {
      const smoothing = 1 - Math.exp(-5 * delta);
      this.camera.position.lerp(this.transition.position, smoothing);
      this.controls.target.lerp(this.transition.target, smoothing);
      if (this.camera.position.distanceToSquared(this.transition.position) < 0.0001) this.transition = undefined;
    }
    if (this.following) this.follow.update(this.camera, this.controls.target, this.motion, this.character.height, delta, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    else this.controls.update();
    this.view.render(this.city.scene);
    this.frameCount++;
    if (time - this.sampleTime >= 1000) {
      this.fps(Math.round(this.frameCount * 1000 / (time - this.sampleTime)));
      this.frameCount = 0; this.sampleTime = time;
    }
  }
  setCamera(preset: CameraPreset): void {
    this.setFollowing(false);
    this.transition = { position: new Vector3(...presets[preset].position), target: new Vector3(...presets[preset].target) };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.camera.position.copy(this.transition.position); this.controls.target.copy(this.transition.target);
      this.transition = undefined; this.controls.update();
    }
  }
  setEvening(evening: boolean): void { this.city.setEvening(evening); }
  setCharacter(variant: CharacterVariant): void { this.variant = variant; this.character.setVariant(variant); }
  setFollowing(enabled: boolean): void {
    this.following = enabled;
    this.transition = undefined;
    this.controls.enabled = !enabled;
    if (enabled) this.follow.update(this.camera, this.controls.target, this.motion, this.character.height, 0, true);
    else {
      // Clear damping accumulated before Follow, preserving the current composition.
      this.controls.enableDamping = false; this.controls.update(); this.controls.enableDamping = true;
    }
  }
  setRunning(enabled: boolean): void { this.input.setRun(enabled); }
  jump(): void { this.input.jump(); }
  stop(): void { this.input.stop(); }
  bindDirection(button: HTMLButtonElement, direction: MoveDirection): void { this.input.bindDirection(button, direction); }
  getCharacterStatus(): CharacterStatus {
    return { variant: this.variant, action: this.motion.action, running: this.input.running, following: this.following };
  }
  setShadows(enabled: boolean): void {
    this.view.setShadows(enabled);
    this.city.setShadows(enabled);
    this.character.setShadows(enabled);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.events.abort();
    this.input.dispose(); this.character.dispose();
    this.controls.dispose(); this.city.dispose(); this.view.dispose();
  }
}
