import { Mesh, MeshBasicMaterial, PerspectiveCamera, SphereGeometry, Vector3 } from 'three';
import { TargetActor } from '../character/TargetActor';
import { ParticleInteraction, type ParticleSettings, type ParticleSnapshot } from '../interaction/ParticleInteraction';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CityScene, type TimeOfDay } from '../scene/CityScene';
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
import { DestinationNavigation, type NavigationStatus } from '../navigation/DestinationNavigation';
import { pickGround } from '../navigation/GroundPicker';
import { TapGesture } from '../input/TapGesture';
import { MouseOrbitGesture } from '../input/MouseOrbitGesture';
import { CameraObstruction, type ObstructionMode } from '../camera/CameraObstruction';
import { createSpraySource, type WaterSettings } from '../water/index.ts';
import { SceneObjectInspector } from '../inspector/SceneObjectInspector';

export type CameraPreset = CameraView;
export interface CharacterStatus { variant: CharacterVariant; action: MotionSnapshot['action']; running: boolean; following: boolean; firstPerson: boolean; cameraView: CameraView; navigation: NavigationStatus; obstructionMode: ObstructionMode }

export class ViewerApp {
  private readonly camera = new PerspectiveCamera(43, 1, 0.1, 200);
  private readonly desiredCamera = this.camera.clone();
  private readonly obstruction: CameraObstruction;
  private readonly city: CityScene;
  private readonly view: SceneRenderer;
  private readonly controls: OrbitControls;
  private readonly character: Character;
  private readonly movement: CharacterController;
  private readonly input: InputManager;
  private readonly navigation: DestinationNavigation;
  private readonly tap: TapGesture;
  private readonly mouseOrbit: MouseOrbitGesture;
  private readonly destinationMarker: HTMLDivElement;
  private readonly cameras: CameraController;
  private readonly expressions = new ExpressionManager();
  private readonly overlay: ExpressionOverlay;
  private readonly inspector: SceneObjectInspector;
  private inspectorSyncTime = -Infinity;
  private readonly anchor = new Vector3();
  private readonly waterSource = createSpraySource();
  private readonly assets: CharacterAssets;
  private readonly target: TargetActor;
  private readonly particles = new ParticleInteraction();
  private readonly casterMarker = new Mesh(new SphereGeometry(.075,12,8), new MeshBasicMaterial({color:'#66ddff'}));
  private readonly targetMarker = new Mesh(new SphereGeometry(.09,12,8), new MeshBasicMaterial({color:'#ffbf69'}));
  private readonly actorLabels: HTMLDivElement[] = [];
  private shadows = true;
  private variant: CharacterVariant = 'man';
  private motion: Readonly<MotionSnapshot>;
  private readonly events = new AbortController();
  private lastTime = 0;
  private sampleTime = 0;
  private frameCount = 0;
  private contextLost = false;
  private disposed = false;
  constructor(private readonly container: HTMLElement, private readonly report: (message: string) => void, private readonly fps: (value: number) => void, private readonly characterReport?: (status: CharacterStatus) => void, assetReport?: (state: LoadingState) => void, private readonly metricsReport?: (stats: RenderStats) => void, targetReport?: (state: LoadingState) => void, private readonly particleReport?: (state: ParticleSnapshot) => void) {
    this.view = new SceneRenderer(container, this.camera);
    this.city = new CityScene();
    this.obstruction = new CameraObstruction(this.city.environment);
    const obstructions = [...this.city.environment.children];
    this.desiredCamera.copy(this.camera);
    this.controls = new OrbitControls(this.desiredCamera, this.view.renderer.domElement);
    this.character = new Character();
    this.movement = new CharacterController(this.city.walkableWorld);
    this.navigation = new DestinationNavigation(this.city.walkableWorld);
    this.input = new InputManager(window, document, () => { this.navigation.cancel(); this.tap?.cancel(); });
    this.motion = this.movement.update(0, this.input.sample());
    this.character.update(this.motion, 0);
    this.city.scene.add(this.character.root);
    this.target = new TargetActor(this.city.walkableWorld, state => targetReport?.(state));
    this.city.scene.add(this.target.root,this.particles.root,this.particles.lightRoot,this.casterMarker,this.targetMarker);
    for (const role of ['Caster','Target']) {
      const label = document.createElement('div'); label.className = `actor-label actor-${role.toLowerCase()}`;
      label.textContent = role; label.setAttribute('aria-hidden','true'); label.hidden = true;
      container.append(label); this.actorLabels.push(label);
    }
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 95;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.cameras = new CameraController(this.desiredCamera, this.controls, new FollowCamera(obstructions), new FirstPersonCamera());
    this.controls.addEventListener('start', () => this.cameras.interrupt());
    this.cameras.select('overview', this.getCameraSubject(), true);
    this.controls.update();
    this.updateObstruction(0, true);
    this.overlay = new ExpressionOverlay(container);
    this.inspector = new SceneObjectInspector(container, this.city.scene);
    this.assets = new CharacterAssets({
      load: async (url, reportProgress) => {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        return new GLTFLoader().loadAsync(url, event => reportProgress({ loaded: event.loaded, total: event.lengthComputable ? event.total : undefined }));
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
        this.view.renderer.domElement.setAttribute('aria-label', `Interactive city with a ${model ? 'rigged character' : 'procedural fallback'}. Tap the ground to run there. Drag to orbit, pinch to zoom. Keyboard: WASD or arrows, Shift to run, Space to jump.`);
      },
    });
    const canvas = this.view.renderer.domElement;
    this.mouseOrbit = new MouseOrbitGesture(canvas,
      () => { this.tap.cancelCandidate(); this.cameras.beginCharacterOrbit(); },
      cancelled => this.cameras.endCharacterOrbit(cancelled));
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Interactive city with a procedural character. Tap the ground to run there. Drag to orbit, pinch to zoom. Keyboard: WASD or arrows, Shift to run, Space to jump.');
    this.destinationMarker = document.createElement('div');
    this.destinationMarker.className = 'destination-marker';
    this.destinationMarker.setAttribute('aria-hidden', 'true');
    this.destinationMarker.hidden = true;
    container.append(this.destinationMarker);
    this.tap = new TapGesture(canvas, point => {
      if (this.contextLost || this.disposed) return;
      const rect = canvas.getBoundingClientRect();
      const target = pickGround({ x: point.x - rect.left, y: point.y - rect.top }, this.camera,
        rect.width, rect.height, this.cameras.fisheye, obstructions, this.city.walkableWorld);
      this.input.stop();
      if (target) this.navigation.select(this.motion, target);
      else this.navigation.reject();
    });
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }), { signal: this.events.signal });
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.contextLost = true;
      this.stop(); this.destinationMarker.hidden = true;
      this.particles.clear(); this.particleReport?.(this.particles.snapshot);
      this.view.waterLens.clear();
      this.actorLabels.forEach(label => {label.hidden=true;});
      this.overlay.place(null);
      this.inspector.hide();
      this.report('Graphics connection lost. Waiting for recovery…');
    }, { signal: this.events.signal });
    canvas.addEventListener('webglcontextrestored', () => { this.contextLost = false; this.lastTime = 0; this.report('WebGL2 · connection restored'); }, { signal: this.events.signal });
    document.addEventListener('visibilitychange', () => { this.lastTime = 0; }, { signal: this.events.signal });
    this.view.renderer.setAnimationLoop(time => this.update(time));
    this.report('WebGL2 · ready');
    void this.assets.select(assetCatalog[this.variant]);
  }
  private update(time: number): void {
    if (this.disposed || this.contextLost) return;
    const waterDelta = this.lastTime && !document.hidden ? Math.min(Math.max((time - this.lastTime) / 1000, 0), 0.05) : 0;
    const delta = Math.min((time - this.lastTime) / 1000 || 1 / 60, 0.05);
    this.lastTime = time;
    this.city.update(waterDelta);
    this.mouseOrbit.update(delta);
    const manual = this.input.sample();
    if (manual.x || manual.z || manual.jump) this.navigation.cancel();
    const intent = this.navigation.status === 'running' ? this.navigation.sample(this.motion, delta) : manual;
    this.motion = this.movement.update(delta, intent);
    this.character.update(this.motion, delta);
    this.assets.current?.update(this.motion, delta);
    this.target.update(delta);
    const casterAnchor = this.getCasterAnchor();
    const targetAnchor = this.target.anchor;
    this.casterMarker.position.copy(casterAnchor); this.targetMarker.position.copy(targetAnchor);
    this.particles.update(delta,targetAnchor,this.target.height*.25);
    this.particleReport?.(this.particles.snapshot);
    this.characterReport?.(this.getCharacterStatus());
    const immediate = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.desiredCamera.aspect = this.camera.aspect;
    this.desiredCamera.updateProjectionMatrix();
    this.cameras.update(this.getCameraSubject(), delta, immediate);
    this.updateObstruction(delta, immediate);
    this.view.waterLens.update(waterDelta,this.camera,
      this.city.getWaterSpraySource(this.waterSource)?this.waterSource:undefined,
      this.city.environment,this.city.waterSettings,immediate);
    this.character.root.visible = !this.assets.current && this.cameras.characterVisible;
    if (this.assets.current) this.assets.current.root.visible = this.cameras.characterVisible;
    this.casterMarker.visible = this.cameras.characterVisible;
    const labelAnchors = [new Vector3(this.motion.x,this.motion.y+this.getSubjectHeight()+.55,this.motion.z),
      targetAnchor.clone().add(new Vector3(0,this.target.height*.4+.3,0))];
    this.actorLabels.forEach((label,index) => {
      const point = index===0 && !this.cameras.characterVisible ? null : projectAnchor(labelAnchors[index]!,this.camera,this.container.clientWidth,this.container.clientHeight,this.cameras.fisheye);
      label.hidden = !point;
      if(point) {label.style.left=`${point.x}px`;label.style.top=`${point.y}px`;}
    });
    this.anchor.set(this.motion.x, this.motion.y + this.getSubjectHeight() + 0.25, this.motion.z);
    this.overlay.place(this.cameras.characterVisible
      ? projectAnchor(this.anchor, this.camera, this.container.clientWidth, this.container.clientHeight, this.cameras.fisheye)
      : null);
    const destination = this.navigation.target;
    const marker = destination ? projectAnchor(new Vector3(destination.x, this.city.walkableWorld.groundHeight(destination.x, destination.z) + 0.06, destination.z),
      this.camera, this.container.clientWidth, this.container.clientHeight, this.cameras.fisheye) : null;
    this.destinationMarker.hidden = !marker;
    if (marker) {
      this.destinationMarker.style.left = `${marker.x}px`;
      this.destinationMarker.style.top = `${marker.y}px`;
      this.destinationMarker.dataset.state = this.navigation.status;
    }
    if (time - this.inspectorSyncTime >= 250) {
      this.inspector.sync(); this.inspectorSyncTime = time;
    }
    this.inspector.update(this.camera, this.cameras.fisheye);
    this.view.render(this.city.scene, this.cameras.fisheye,
      this.obstruction.mode === 'xray' && this.cameras.characterVisible
        ? { subject: (this.assets.current ?? this.character).root, environment: this.city.environment } : undefined);
    this.frameCount++;
    if (time - this.sampleTime >= 1000) {
      this.fps(Math.round(this.frameCount * 1000 / (time - this.sampleTime)));
      this.metricsReport?.(this.view.stats);
      this.frameCount = 0; this.sampleTime = time;
    }
  }
  setCamera(preset: CameraPreset): void {
    this.mouseOrbit.cancel();
    this.cameras.select(preset, this.getCameraSubject(), window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.character.root.visible = !this.assets.current && this.cameras.characterVisible;
    if (this.assets.current) this.assets.current.root.visible = this.cameras.characterVisible;
    if (!this.cameras.characterVisible) this.overlay.place(null);
  }
  mountObjectInspector(host: HTMLElement): void { if (!this.disposed) this.inspector.mount(host); }
  setEmotion(emotion: Emotion): void { this.expressions.setEmotion(emotion); this.updateExpression(); }
  setObstructionMode(mode: ObstructionMode): void {
    this.obstruction.setMode(mode);
    this.cameras.setObstructionAvoidance(mode === 'zoom');
    this.characterReport?.(this.getCharacterStatus());
  }
  private updateObstruction(delta: number, immediate: boolean): void {
    this.obstruction.update(this.desiredCamera, this.camera, this.controls.target, this.getCameraSubject(), delta, immediate, this.cameras.characterVisible);
  }
  setSpeech(text: string): void { this.expressions.setSpeech(text); this.updateExpression(); }
  getExpression(): Readonly<ExpressionState> { return this.expressions.snapshot; }
  private updateExpression(): void {
    const state = this.expressions.snapshot;
    this.overlay.setContent(state, emotions[state.emotion].icon);
  }
  setEvening(evening: boolean): void { this.city.setEvening(evening); }
  setTimeOfDay(time: TimeOfDay): boolean { return !this.disposed && this.city.setTimeOfDay(time); }
  configureWater(patch: Partial<WaterSettings>): boolean {
    if(this.disposed || !this.city.configureWater(patch)) return false;
    if(!this.city.waterSettings.enabled)this.view.waterLens.clear();
    return true;
  }
  setWaterLensEnabled(enabled: boolean): void { if(!this.disposed)this.view.waterLens.enabled=enabled; }
  getWaterLensEnabled(): boolean { return this.view.waterLens.enabled; }
  getWaterSettings(): WaterSettings { return this.city.waterSettings; }
  getWaterElapsed(): number { return this.city.waterElapsed; }
  setCharacter(variant: CharacterVariant): void {
    this.mouseOrbit.cancel(); this.cameras.endCharacterOrbit(true);
    this.stop();
    this.variant = variant; this.character.setVariant(variant);
    void this.assets.select(assetCatalog[variant]);
  }
  retryCharacter(): void { void this.assets.retry(); }
  retryTarget(): void { void this.target.retry(); }
  resetTarget(): void { if(this.disposed)return; this.target.reset(); this.particles.clear(); this.particleReport?.(this.particles.snapshot); }
  configureParticles(settings: ParticleSettings): boolean { return this.particles.configure(settings); }
  fireParticle(): void {
    if(this.contextLost || this.disposed) return;
    this.particles.fire(this.getCasterAnchor(),this.target.anchor); this.particleReport?.(this.particles.snapshot);
  }
  private getCasterAnchor(): Vector3 {
    return new Vector3(this.motion.x+Math.sin(this.motion.heading)*.3,this.motion.y+this.getSubjectHeight()*.6,this.motion.z+Math.cos(this.motion.heading)*.3);
  }
  private getSubjectHeight(): number { return this.assets.current?.height ?? this.character.height; }
  setFollowing(enabled: boolean): void {
    this.mouseOrbit.cancel();
    this.cameras.setFollowing(enabled, this.getCameraSubject(), window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  private getCameraSubject(): CameraSubject {
    const subject = this.assets?.current ?? this.character;
    return { ...this.motion, height: subject.height, eyeHeight: subject.eyeHeight, eyeForward: subject.eyeForward };
  }
  setRunning(enabled: boolean): void { this.input.setRun(enabled); }
  jump(): void { this.input.jump(); }
  stop(): void { this.mouseOrbit.cancel(); this.cameras.endCharacterOrbit(true); this.input.stop(); }
  bindDirection(button: HTMLButtonElement, direction: MoveDirection): void { this.input.bindDirection(button, direction); }
  getCharacterStatus(): CharacterStatus {
    return { variant: this.variant, action: this.motion.action, running: this.input.running || this.navigation.status === 'running', following: this.cameras.following, firstPerson: this.cameras.view === 'first-person', cameraView: this.cameras.view, navigation: this.navigation.status, obstructionMode: this.obstruction.mode };
  }
  setShadows(enabled: boolean): void {
    this.shadows = enabled;
    this.view.setShadows(enabled);
    this.city.setShadows(enabled);
    this.character.setShadows(enabled);
    this.assets.current?.setShadows(enabled);
    this.target.setShadows(enabled);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.events.abort();
    this.inspector.dispose();
    this.mouseOrbit.dispose(); this.tap.dispose(); this.destinationMarker.remove();
    this.assets.dispose(); this.input.dispose(); this.character.dispose(); this.overlay.dispose();
    this.target.dispose(); this.particles.dispose(); this.actorLabels.forEach(label=>label.remove());
    for(const marker of [this.casterMarker,this.targetMarker]) {marker.geometry.dispose();marker.material.dispose();marker.removeFromParent();}
    this.controls.dispose(); this.obstruction.dispose(); this.city.dispose(); this.view.dispose();
  }
}
