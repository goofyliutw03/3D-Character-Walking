import { CameraModeManager } from '../camera/CameraModeManager';
import type { ProjectileAim, SceneSettings, ViewerSettings } from '../settings/ViewerSettings';
import { validViewerSettings } from '../settings/validateViewerSettings';
import { sceneControlPolicy } from '../scene/SceneControlPolicy';
import { SceneSwitch, type Environment, type EnvironmentId, type TerrainSettings } from '../scene/SceneSwitch';
import { isEnvironmentId } from '../scene/EnvironmentId';
import { PathTour, parseWaypoints, type TourSnapshot } from '../navigation/PathTour';
import { cameraHeading, solarPosition, type SolarSettings } from '../scene/SolarPosition.ts';
import type { LightSettings } from '../scene/EnvironmentLights';
import type { HeadlampSettings } from '../scene/HeadlampSettings';
import { Box3, Color, InstancedMesh, Light, PointLight, Mesh, MeshBasicMaterial, PerspectiveCamera, SphereGeometry, Vector3 } from 'three';
import { TargetActor } from '../character/TargetActor';
import { ParticleInteraction, type ParticleSettings, type ParticleSnapshot } from '../interaction/ParticleInteraction';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CityScene, type TimeOfDay } from '../scene/CityScene';
import { SceneRenderer, type RenderStats } from './SceneRenderer';
import { preparePointLightMeshes } from './PointLightShader';
import type { NeedleRuntime } from './NeedleRuntime';
import { Character } from '../character/Character';
import { CharacterController } from '../character/CharacterController';
import { FlightController } from '../character/FlightController';
import { PoolSwimController } from '../character/PoolSwimController';
import { SwimController, type SwimDepthDirection } from '../character/SwimController';
import { defaultSwimAppearance, validSwimAppearance, type SwimAppearance } from '../character/SwimAppearance.ts';
import { resetShadowResources, releaseSceneGpuResources } from './ContextResources';
import type { CharacterVariant, MotionSnapshot } from '../character/motion';
import { characterCapsules } from '../character/motion';
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
import { GroundPicker } from '../navigation/GroundPicker';
import { TapGesture } from '../input/TapGesture';
import { MouseOrbitGesture } from '../input/MouseOrbitGesture';
import { AutoRunControls, type LookSensitivity } from '../input/AutoRunControls';
import { CameraInputManager } from '../input/CameraInputManager';
import { CameraObstruction, type ObstructionMode } from '../camera/CameraObstruction';
import { createSpraySource, type WaterSettings } from '../water/index.ts';
import { SceneObjectInspector } from '../inspector/SceneObjectInspector';
import { TrafficSimulation, type TrafficSettings, type TrafficSnapshot } from '../simulation/TrafficSimulation.ts';
import { TrafficView } from '../simulation/TrafficView.ts';
import { CityBuildings, type CityAssetState } from '../scene/CityBuildings.ts';

export type CameraPreset = CameraView;
export interface SwimStatus { waterLocation: SwimController['waterLocation']; swimming: boolean; climbing: boolean; bottom: boolean; canClimb: boolean; atWaterline: boolean; submerged: boolean; cameraSubmerged: boolean; droppedTime: number; rigged: boolean }
export interface CharacterStatus { flight: { mode: 'ground' | 'flight'; warning: string | null; droppedTime: number } | null; groundPenetration: boolean; autoRun: boolean; autoRunPaused: boolean; variant: CharacterVariant; action: MotionSnapshot['action']; running: boolean; following: boolean; firstPerson: boolean; cameraView: CameraView; navigation: NavigationStatus; tour: TourSnapshot; obstructionMode: ObstructionMode; motion: Readonly<MotionSnapshot>; walkSpeed: number; buildings: CityAssetState }

export class ViewerApp {
  private sceneSettings: Partial<Record<EnvironmentId, SceneSettings>> = {};
  private sceneDefaults: Partial<Record<EnvironmentId, SceneSettings>> = {};
  private projectileAim: ProjectileAim = 'target';
  private readonly camera = new PerspectiveCamera(43, 1, 0.1, 200);
  private readonly indoorCameraBounds = new Box3();
  private readonly desiredCamera = this.camera.clone();
  private obstruction: CameraObstruction;
  private readonly city: CityScene;
  private readonly cityEnvironment: Environment;
  private readonly scenes: SceneSwitch;
  private readonly follow: FollowCamera;
  private readonly buildings: CityBuildings;
  private readonly view: SceneRenderer;
  private readonly controls: OrbitControls;
  private readonly character: Character;
  private movement: CharacterController | FlightController | SwimController | PoolSwimController;
  private cameraSubmerged = false;
  private readonly swimCameraPosition = new Vector3();
  private readonly swimCameraAim = new Vector3();
  private swimAppearance: SwimAppearance = { ...defaultSwimAppearance };
  private swimSpiral?: SwimDepthDirection;
  private swimCameraY?: number;
  private swimEyeHeight?: number;
  private readonly input: InputManager;
  private navigation: DestinationNavigation;
  private groundPicker: GroundPicker;
  private groundPenetration = true;
  private readonly tour: PathTour;
  private readonly tap: TapGesture;
  private readonly mouseOrbit: MouseOrbitGesture;
  private readonly autoRun = new AutoRunControls();
  private readonly cameraInput: CameraInputManager;
  private readonly cameraModes: CameraModeManager;
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
  private readonly traffic: TrafficSimulation;
  private readonly trafficView = new TrafficView();
  private readonly particles = new ParticleInteraction();
  private readonly casterMarker = new Mesh(new SphereGeometry(.075,12,8), new MeshBasicMaterial({color:'#66ddff'}));
  private readonly targetMarker = new Mesh(new SphereGeometry(.09,12,8), new MeshBasicMaterial({color:'#ffbf69'}));
  private readonly actorLabels: HTMLDivElement[] = [];
  private shadows = true;
  private variant: CharacterVariant = 'man';
  private motion: Readonly<MotionSnapshot>;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly events = new AbortController();
  private solarReport: ((heading: number, elevation: number) => void) | null = null;
  private solarHeading = 0;
  private readonly solarDirection = new Vector3();
  private lastTime = 0;
  private sampleTime = 0;
  private frameCount = 0;
  private contextLost = false;
  private disposed = false;
  private needle?: NeedleRuntime;
  private needleReady = false;
  constructor(private readonly container: HTMLElement, private readonly report: (message: string) => void, private readonly fps: (value: number) => void, private readonly characterReport?: (status: CharacterStatus) => void, assetReport?: (state: LoadingState) => void, private readonly metricsReport?: (stats: RenderStats) => void, targetReport?: (state: LoadingState) => void, private readonly particleReport?: (state: ParticleSnapshot) => void, private readonly trafficReport?: (state: TrafficSnapshot) => void) {
    this.view = new SceneRenderer(container, this.camera);
    this.city = new CityScene();
    this.cityEnvironment = {
      id: 'city', scene: this.city.scene, environment: this.city.environment,
      walkableWorld: this.city.walkableWorld, spawn: { x: 0, z: 5 }, cityFeatures: true,
      controls: sceneControlPolicy('open'),
      // Retain the loaded city and settings for the return trip.
      dispose() {},
    };
    this.scenes = new SceneSwitch(this.cityEnvironment);
    this.groundPicker = new GroundPicker(this.city.environment.children);
    this.buildings = new CityBuildings(this.city.environment, this.city.buildingFallbacks, () => {});
    this.traffic = new TrafficSimulation(this.city.walkableWorld);
    this.city.scene.add(this.trafficView.root);
    this.view.environmentScan.watch(this.city.environment);
    this.view.environmentScan.watch(this.trafficView.actors);
    this.obstruction = new CameraObstruction(this.city.environment, this.view.environmentScan.prepareMaterial);
    this.follow = new FollowCamera(this.city.environment.children);
    this.desiredCamera.copy(this.camera);
    this.controls = new OrbitControls(this.desiredCamera, this.view.renderer.domElement);
    this.character = new Character();
    this.movement = new CharacterController(this.city.walkableWorld);
    this.navigation = new DestinationNavigation(this.city.walkableWorld);
    this.tour = new PathTour(this.city.walkableWorld);
    this.input = new InputManager(window, document, () => { this.navigation.cancel(); this.tour.cancel(); this.tap?.cancel(); },
      () => {
        this.stopSwimSpiral();
        if (this.movement instanceof FlightController || this.movement instanceof SwimController || this.movement instanceof PoolSwimController) this.movement.stop();
      });
    this.motion = this.movement.update(0, this.input.sample());
    this.city.updateLampShadowPosition(this.motion);
    this.character.update(this.motion, 0);
    preparePointLightMeshes(this.character.root);
    this.scenes.root.add(this.character.root);
    this.target = new TargetActor(this.city.walkableWorld, state => targetReport?.(state));
    this.view.environmentScan.watch(this.target.root);
    this.scenes.root.add(this.target.root,this.particles.root,this.particles.lightRoot,this.casterMarker,this.targetMarker);
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
    this.cameras = new CameraController(this.desiredCamera, this.controls, this.follow, new FirstPersonCamera());
    this.controls.addEventListener('start', () => this.cameras.interrupt());
    this.cameras.select('overview', this.getCameraSubject(), true);
    this.controls.update();
    this.updateObstruction(0, true);
    this.overlay = new ExpressionOverlay(container);
    this.inspector = new SceneObjectInspector(container, this.scenes.root);
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
          preparePointLightMeshes(model.root);
          model.setShadows(this.shadows);
          this.updateRiggedCharacter(model, 0);
          model.root.visible = this.cameras.characterVisible;
          this.scenes.root.add(model.root);
        }
        this.character.root.visible = !model && this.cameras.characterVisible;
        this.view.renderer.domElement.setAttribute('aria-label', `Interactive ${this.environmentId} with a ${model ? 'rigged character' : 'procedural fallback'}. Tap the ground to run there. Drag to orbit, pinch to zoom. Keyboard: WASD or arrows, Shift to run, Space to jump.`);
      },
    });
    const canvas = this.view.renderer.domElement;
    this.cameraModes = new CameraModeManager(this.cameras, this.autoRun,
      () => this.getCameraSubject(), () => this.reducedMotion.matches, this.camera,
      () => this.cameraInput?.reset(), () => this.motion.action === 'idle');
    this.cameraModes.configureScene(this.scenes.controls);
    this.cameraInput = new CameraInputManager(canvas, {
      lockEnabled: () => this.autoRun.enabled && !this.autoRun.paused && this.cameraModes.inputMode !== 'standard',
      mode: () => this.cameraModes.inputMode,
      clearGesture: () => this.cameraModes.resetGestures(),
      wheelEnabled: () => this.cameraModes.wheelEnabled,
      reverseEnabled: () => this.autoRun.running,
      move: (dx, dy, ctrl, time) => {
        const mode = this.cameraModes.inputMode;
        this.autoRun.move(dx, dy, canvas.clientWidth, ctrl || mode === 'stationary-look',
          time, this.cameras.view, this.cameraInput.locked);
        if (mode === 'stationary-look' || (ctrl && mode === 'standard')) this.cameraModes.follow();
      },
      wheel: delta => {
        const result = this.cameraModes.wheel(delta);
        if (result) this.setCamera(result);
      },
      reverse: () => {
        if (!this.autoRun.running) return;
        this.autoRun.reverse();
        this.motion = this.movement.update(0, { x: Math.sin(this.autoRun.heading), z: Math.cos(this.autoRun.heading), run: true, jump: false });
        this.setCamera(this.cameras.view);
      },
      reset: () => {
        this.cameraModes.resetLook();
      },
      suspend: () => { this.stopSwimSpiral(); this.cameraModes.resetGestures(); this.autoRun.suspend(); this.characterReport?.(this.getCharacterStatus()); },
      toggle: () => this.setAutoRun(this.autoRun.inspecting || !this.autoRun.enabled ||
        this.cameraModes.inputMode === 'stationary-look'),
      depthEnabled: () => this.hasExternalSwimControls(),
      depth: direction => this.setSwimSpiral(direction),
    });
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
      if (this.contextLost || this.disposed || !this.cameraModes.groundTapEnabled) return;
      const rect = canvas.getBoundingClientRect();
      const target = this.groundPicker.pick({ x: point.x - rect.left, y: point.y - rect.top }, this.camera,
        rect.width, rect.height, this.cameras.fisheye, this.scenes.active.walkableWorld,
        [this.assets.current?.root ?? this.character.root, this.target.root,
          ...(this.cityFeatures ? this.trafficView.npcPickBlockers : [])], this.groundPenetration, this.movement.shape);
      this.input.stop();
      if (target) {
        this.cameraModes.beginDestination();
        this.navigation.select(this.motion, target);
      }
      else this.navigation.reject();
    });
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }), { signal: this.events.signal });
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.contextLost = true; this.scenes.cancel();
      this.view.releaseContextResources();
      resetShadowResources([this.scenes.root, this.city.scene]);
      releaseSceneGpuResources([this.scenes.root, this.city.scene]);
      this.stop(); this.destinationMarker.hidden = true;
      this.autoRun.clear();
      this.particles.clear(); this.particleReport?.(this.particles.snapshot);
      this.view.waterLens.clear();
      this.actorLabels.forEach(label => {label.hidden=true;});
      this.overlay.place(null);
      this.inspector.hide();
      this.report('Graphics connection lost. Waiting for recovery…');
    }, { signal: this.events.signal });
    canvas.addEventListener('webglcontextrestored', () => {
      this.view.restoreContext();
      const valid = this.scenes.active.walkableWorld.query?.overlap(this.motion, this.movement.shape);
      if (valid && (!valid.ok || valid.value)) { this.report('Recovery position invalid. Reload to recover.'); return; }
      this.contextLost = false; this.lastTime = 0; this.report('WebGL2 · connection restored'); }, { signal: this.events.signal });
    document.addEventListener('visibilitychange', () => { this.lastTime = 0; if (document.hidden) this.stop(); }, { signal: this.events.signal });
    if (new URLSearchParams(location.search).get('engine') === 'legacy') {
      this.view.renderer.setAnimationLoop(time => this.update(time));
    } else {
      void this.startNeedle();
    }
    this.report('WebGL2 · ready');
    void this.assets.select(assetCatalog[this.variant]);
    void this.buildings.load();
  }
  private async startNeedle(): Promise<void> {
    void this.view.prepareEnvironmentShaders(this.city.environment, this.scenes.root);
    try {
      const { NeedleRuntime } = await import('./NeedleRuntime');
      if (this.disposed) return;
      this.needle = new NeedleRuntime(this.view.renderer, time => this.update(time));
      await this.needle.start(this.camera);
      if (!this.disposed) {
        this.needleReady = true;
        this.report('Needle Engine · WebGL2 ready');
      }
    } catch (error) {
      if (this.disposed) return;
      console.error('Needle Engine initialization failed', error);
      try {
        this.needle?.dispose(true);
      } catch (cleanupError) {
        console.error('Needle Engine cleanup failed', cleanupError);
      }
      this.needle = undefined;
      this.view.renderer.setAnimationLoop(time => this.update(time));
      this.report('WebGL2 · Needle Engine unavailable');
    }
  }
  private update(time: number): void {
    if (this.disposed || this.contextLost) return;
    const waterDelta = this.lastTime && !document.hidden ? Math.min(Math.max((time - this.lastTime) / 1000, 0), 0.05) : 0;
    const frameDelta = this.lastTime && !document.hidden ? Math.max(0, (time - this.lastTime) / 1000) : 0;
    const delta = Math.min((time - this.lastTime) / 1000 || 1 / 60, 0.05);
    this.lastTime = time;
    const active = this.scenes.active;
    if (active.cityFeatures) this.city.update(waterDelta);
    else active.update?.(waterDelta, this.reducedMotion.matches);
    this.scenes.syncAppearance();
    this.mouseOrbit.update(delta);
    const manual = this.input.sample();
    const swim = this.movement instanceof SwimController ? this.movement : undefined;
    const manualOverride = (!this.autoRun.inspecting || !!swim) && !!(manual.x || manual.z || manual.jump || (swim && manual.vertical));
    if (manualOverride) {
      this.stopSwimSpiral(); this.autoRun.stop(); this.navigation.cancel(); this.tour.cancel();
    }
    if (this.cameraInput.lockActive && !this.autoRun.enabled) this.cameraInput.releaseLock();
    const automated = this.tour.snapshot.status === 'running' || this.navigation.status === 'running';
    const pitch = swim?.mode === 'swim' && this.hasExternalSwimControls() ? this.autoRun.pitch : 0;
    const intent = this.autoRun.running ? { x: Math.sin(this.autoRun.heading) * Math.cos(pitch),
      z: Math.cos(this.autoRun.heading) * Math.cos(pitch), vertical: Math.sin(pitch), run: true, jump: false }
      : this.autoRun.active && !manualOverride ? { x: 0, z: 0, run: false, jump: false }
      : this.tour.snapshot.status === 'running' ? this.tour.sample(this.motion, delta)
      : this.navigation.status === 'running' ? this.navigation.sample(this.motion, delta) : manual;
    const speedOverride = automated ? (intent.run ? 4 : 1.8) : undefined;
    this.motion = swim ? swim.update(frameDelta, intent, speedOverride, this.autoRun.running ? this.swimSpiral : undefined)
      : this.movement.update(this.movement instanceof CharacterController ? delta : frameDelta, intent, speedOverride);
    if (swim && this.swimSpiral) {
      this.autoRun.heading = this.motion.heading;
      if (swim.depthPathBlocked || !swim.canSwimVertically(this.swimSpiral)) this.stopSwimSpiral();
    }
    if (active.cityFeatures) this.city.updateLampShadowPosition(this.motion);
    this.character.update(this.motion, delta);
    if (this.assets.current) this.updateRiggedCharacter(this.assets.current, delta);
    this.target.update(delta);
    if (active.cityFeatures) this.traffic.update(waterDelta, [this.motion, this.target.anchor]);
    const casterAnchor = this.getCasterAnchor();
    const targetAnchor = this.target.anchor;
    this.casterMarker.position.copy(casterAnchor); this.targetMarker.position.copy(targetAnchor);
    this.particles.update(delta,targetAnchor,this.target.height*.25);
    this.particleReport?.(this.particles.snapshot);
    const immediate = this.reducedMotion.matches;
    const eyeHeight = (this.assets.current ?? this.character).eyeHeight;
    this.swimEyeHeight = swim && !immediate && this.swimEyeHeight !== undefined
      ? this.swimEyeHeight + (eyeHeight - this.swimEyeHeight) * (1 - Math.exp(-16 * delta))
      : swim ? eyeHeight : undefined;
    this.swimCameraY = swim && !immediate && this.swimCameraY !== undefined
      ? this.swimCameraY + (this.motion.y - this.swimCameraY) * (1 - Math.exp(-16 * delta))
      : swim ? this.motion.y : undefined;
    this.desiredCamera.aspect = this.camera.aspect;
    this.desiredCamera.updateProjectionMatrix();
    this.syncCameraOffsets();
    this.cameras.update(this.getCameraSubject(), delta, immediate);
    this.updateObstruction(delta, immediate);
    if (active.updateCamera) {
      active.updateCamera(this.camera.position);
      this.scenes.syncAppearance();
    }
    if (active.swim) {
      this.cameraSubmerged = active.swim.updateCamera(this.camera.position);
      this.scenes.syncAppearance();
    }
    this.characterReport?.(this.getCharacterStatus());
    active.headlamp?.update(this.getCameraSubject(), waterDelta, immediate,
      this.cameras.view === 'first-person' ? this.camera : undefined);
    if (this.solarReport) {
      this.camera.getWorldDirection(this.solarDirection);
      this.solarHeading = cameraHeading(this.solarDirection.x, this.solarDirection.z, this.solarHeading);
      const settings = this.getSolarSettings();
      this.solarReport(this.solarHeading, solarPosition(settings.hour, settings.season, settings.latitude).elevation);
    }
    if (active.cityFeatures) {
      const trafficState = this.traffic.snapshot;
      this.trafficView.update(trafficState, this.camera, waterDelta);
      this.trafficReport?.(trafficState);
      this.view.waterLens.update(waterDelta,this.camera,
        this.city.getWaterSpraySource(this.waterSource)?this.waterSource:undefined,
        this.city.environment,this.city.waterSettings,immediate);
    }
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
    const destination = this.tour.target ?? this.navigation.target;
    const marker = destination ? projectAnchor(new Vector3(destination.x, (destination.y ?? active.walkableWorld.groundHeight(destination.x, destination.z)) + 0.06, destination.z),
      this.camera, this.container.clientWidth, this.container.clientHeight, this.cameras.fisheye) : null;
    this.destinationMarker.hidden = !marker;
    if (marker) {
      this.destinationMarker.style.left = `${marker.x}px`;
      this.destinationMarker.style.top = `${marker.y}px`;
      this.destinationMarker.dataset.state = this.tour.snapshot.status === 'running' ? 'running' : this.navigation.status;
    }
    if (time - this.inspectorSyncTime >= 250) {
      this.inspector.sync(); this.inspectorSyncTime = time;
    }
    this.inspector.update(this.camera, this.cameras.fisheye);
    const xray = this.obstruction.mode === 'xray' && this.cameras.characterVisible
      ? { subject: (this.assets.current ?? this.character).root, environment: active.environment, staticBlockers: this.fixedManorStreet } : undefined;
    this.view.environmentScan.update(time);
    const render = () => this.view.render(this.scenes.root, this.cameras.fisheyeAmount, xray);
    if (this.needleReady && this.needle) this.needle.render(render);
    else render();
    this.frameCount++;
    if (time - this.sampleTime >= 1000) {
      this.fps(Math.round(this.frameCount * 1000 / (time - this.sampleTime)));
      this.metricsReport?.(this.view.stats);
      this.frameCount = 0; this.sampleTime = time;
    }
  }
  get environmentId(): EnvironmentId { return this.scenes.active.id; }
  get cityFeatures(): boolean { return this.scenes.active.cityFeatures; }

  scanEnvironment(): void {
    if (this.disposed || this.contextLost) return;
    this.view.environmentScan.start(this.motion);
  }

  private createMovement(environment: Environment): CharacterController | FlightController | SwimController | PoolSwimController {
    const { id, walkableWorld, spawn, swim } = environment;
    const shape = characterCapsules[this.variant];
    if (swim) return new SwimController(walkableWorld, shape, spawn, swim.water, swim.exit);
    if (id === 'flight') return new FlightController(walkableWorld, shape);
    if (id === 'pool') return new PoolSwimController(walkableWorld, shape);
    return new CharacterController(walkableWorld, shape, spawn);
  }

  async selectEnvironment(id: EnvironmentId): Promise<boolean> {
    if (this.disposed || this.contextLost || !isEnvironmentId(id)) return false;
    this.sceneSettings[this.environmentId] = this.captureSceneSettings();
    return this.scenes.select(id, async () => {
      const next = id === 'city'
      ? this.cityEnvironment
      : id === 'room' ? await (await import('../scene/ManorScene')).createManor()
      : id === 'flight' ? (await import('../scene/FlightScene')).createFlight()
      : id === 'swim' ? (await import('../scene/SwimScene')).createSwim()
      : id === 'pool' ? (await import('../scene/PoolScene')).createPool()
      : id === 'terrain' ? (await import('../scene/TerrainScene')).createTerrain()
      : (await import('../scene/CaveScene')).createCave();
      try {
        const candidate = this.createMovement(next);
        next.swim?.water.shader.configure(this.getWaterSettings());
        if (!candidate.relocate({ ...next.spawn, y: 0 })) throw Error('Invalid scene spawn');
      } catch (error) { next.dispose(); throw error; }
      return next;
    }, next => {
      this.stop();
      this.view.environmentScan.clear();
      this.view.environmentScan.prepare(next.environment);
      this.sceneDefaults[next.id] ??= this.captureSceneSettings();
      const saved = this.sceneSettings[next.id];
      if (saved) this.applySceneSettings(saved);
      const speed = this.movement.walkSpeed;
      this.movement = this.createMovement(next);
      this.swimCameraY = undefined;
      this.swimEyeHeight = undefined;
      this.cameraSubmerged = false;
      this.input.setFlightControls(next.id === 'flight' || next.id === 'swim' || next.id === 'pool');
      this.movement.setWalkSpeed(speed);
      this.movement.relocate({ ...next.spawn, y: 0 });
      this.motion = this.movement.snapshot;
      this.navigation = new DestinationNavigation(next.walkableWorld, this.movement.shape);
      this.groundPicker = new GroundPicker(next.environment.children);
      this.target.setWorld(next.walkableWorld, next.targetSpawn);
      this.particles.clear();
      this.view.waterLens.clear();
      this.destinationMarker.hidden = true;
      this.overlay.place(null);
      this.inspector.hide();
      this.inspector.sync();
      this.follow.setObstructions(next.environment.children);
      const mode = this.obstruction.mode;
      this.obstruction.dispose();
      this.obstruction = new CameraObstruction(next.environment, this.view.environmentScan.prepareMaterial);
      this.obstruction.setMode(mode);
      const following = this.cameras.following;
      this.cameraModes.configureScene(this.scenes.controls);
      this.cameras.select(this.cameras.view, this.getCameraSubject(), true);
      this.cameras.setFollowing(following, this.getCameraSubject(), true);
      this.updateObstruction(0, true);
      this.character.update(this.motion, 0);
      if (this.assets.current) this.updateRiggedCharacter(this.assets.current, 0);
      next.headlamp?.update(this.getCameraSubject(), 0, this.reducedMotion.matches);
      this.view.renderer.domElement.setAttribute('aria-label', `Interactive ${id}`);
    });
  }

  private captureSceneSettings(): SceneSettings {
    return { time: this.scenes.active.solar?.getTime() ?? this.city.lightingPreset, solar: this.getSolarSettings(),
      lights: this.getEnvironmentLights().map(({ id, enabled, intensity, color, effects }) => ({ id, settings: { enabled, intensity, color, effects } })),
      headlamp: this.getHeadlampSettings() ?? null,
      ...(this.getTerrainSettings() ? { terrain: this.getTerrainSettings() } : {}) };
  }
  private applySceneSettings(settings: SceneSettings): void {
    this.setTimeOfDay(settings.time); this.configureSolar(settings.solar);
    for (const light of settings.lights) if (!this.configureEnvironmentLight(light.id, light.settings)) throw Error('Invalid environment light: ' + light.id);
    if (settings.headlamp && !this.configureHeadlamp(settings.headlamp)) throw Error('Invalid headlamp settings');
    if (settings.terrain && !this.configureTerrain(settings.terrain)) throw Error('Invalid terrain settings');
  }
  getPanelSettings(): ViewerSettings {
    this.sceneSettings[this.environmentId] = this.captureSceneSettings();
    this.sceneDefaults[this.environmentId] ??= structuredClone(this.sceneSettings[this.environmentId]!);
    return structuredClone({ environment: this.environmentId, scenes: this.sceneSettings,
      variant: this.variant, camera: this.cameras.view, following: this.cameras.following,
      cameraPose: {
        position: this.desiredCamera.position.toArray(), target: this.controls.target.toArray(),
        yaw: this.autoRun.yaw, pitch: this.autoRun.pitch, zoom: this.autoRun.zoom,
      },
      obstruction: this.obstruction.mode, groundPenetration: this.groundPenetration,
      sensitivity: this.autoRun.lookSensitivity, walkSpeed: this.movement.walkSpeed,
      expression: this.getExpression(), traffic: this.traffic.snapshot.settings, particles: this.particles.settings,
      projectileAim: this.projectileAim,
      water: this.getWaterSettings(), swimAppearance: this.getSwimAppearance(), waterLens: this.getWaterLensEnabled(), shadows: this.shadows,
      lamps: this.getLampShadowOptions().filter(item => item.selected).map(item => item.id),
      lampDetection: this.getLampShadowDetection(), inspector: this.inspector.getSettings() });
  }
  async applyPanelSettings(settings: ViewerSettings, reset = false): Promise<void> {
    if (!validViewerSettings(settings)) throw Error('Invalid panel settings');
    this.stop();
    if (!await this.selectEnvironment(settings.environment)) throw Error('Could not restore environment');
    this.sceneSettings = structuredClone(reset ? this.sceneDefaults : settings.scenes);
    const active = this.sceneSettings[this.environmentId];
    if (active) this.applySceneSettings(active);
    if (!this.setCharacter(settings.variant)) throw Error('Character needs more clearance');
    this.setSwimAppearance(reset ? defaultSwimAppearance : settings.swimAppearance ?? defaultSwimAppearance);
    this.setWalkSpeed(settings.walkSpeed);
    this.setEmotion(settings.expression.emotion); this.setSpeech(settings.expression.speech);
    if (!this.configureTraffic(settings.traffic) || !this.configureParticles(settings.particles) ||
        !this.configureWater(settings.water) || !this.configureLookSensitivity(settings.sensitivity) ||
        !this.setLampShadowDetection(settings.lampDetection.enabled, settings.lampDetection.radius) ||
        !this.setLampShadowSelection(settings.lamps)) throw Error('Invalid panel setting ranges');
    this.setWaterLensEnabled(settings.waterLens); this.setShadows(settings.shadows);
    this.setObstructionMode(settings.obstruction); this.setGroundPenetration(settings.groundPenetration);
    this.projectileAim = settings.projectileAim ?? 'target';
    this.particles.clear();
    this.particleReport?.(this.particles.snapshot);
    this.setCamera(settings.camera);
    const { yaw = 0, pitch = 0, zoom = 1 } = settings.cameraPose ?? {};
    Object.assign(this.autoRun, { yaw, pitch, zoom });
    this.syncCameraOffsets();
    this.cameras.select(settings.camera, this.getCameraSubject(), true);
    this.cameras.setFollowing(settings.following, this.getCameraSubject(), true);
    if (settings.cameraPose) this.cameras.restorePose(settings.cameraPose);
    this.cameras.update(this.getCameraSubject(), 0, true);
    this.updateObstruction(0, true);
    this.inspector.applySettings(settings.inspector);
    this.characterReport?.(this.getCharacterStatus());
  }

  private syncCameraOffsets(): void {
    const { enabled, yaw, pitch, zoom } = this.autoRun;
    Object.assign(this.cameras.controlOffsets, {
      active: enabled || zoom !== 1 || yaw !== 0 || pitch !== 0,
      eye: this.cameras.view === 'first-person' && (yaw !== 0 || pitch !== 0 || this.cameraModes.inputMode !== 'standard'),
      yaw, pitch, zoom,
    });
  }

  setCamera(preset: CameraPreset): void {
    if (preset !== this.cameras.view) this.stopSwimSpiral();
    if (this.movement instanceof SwimController && preset !== 'first-person' && preset !== 'third-person' && preset !== 'fisheye' && this.autoRun.enabled) {
      this.setAutoRun(false);
    }
    this.tap.cancel();
    this.mouseOrbit.cancel();
    this.cameraModes.select(preset);
    if (this.cameraModes.inputMode === 'standard' && this.cameraInput.lockActive) {
      this.cameraInput.releaseLock(); this.autoRun.suspend();
    }
    this.character.root.visible = !this.assets.current && this.cameras.characterVisible;
    if (this.assets.current) this.assets.current.root.visible = this.cameras.characterVisible;
    if (!this.cameras.characterVisible) this.overlay.place(null);
  }
  mountObjectInspector(host: HTMLElement): void { if (!this.disposed) this.inspector.mount(host); }
  getTrafficState(): TrafficSnapshot { return this.traffic.snapshot; }
  configureTraffic(patch: Partial<TrafficSettings>): boolean { return !this.disposed && this.traffic.configure(patch); }
  resetTraffic(): void { if (!this.disposed) this.traffic.reset(); }
  setEmotion(emotion: Emotion): void { this.expressions.setEmotion(emotion); this.updateExpression(); }
  setObstructionMode(mode: ObstructionMode): void {
    this.obstruction.setMode(mode);
    this.cameras.setObstructionAvoidance(mode === 'zoom');
    this.characterReport?.(this.getCharacterStatus());
  }
  setGroundPenetration(enabled: boolean): void {
    this.groundPenetration = enabled;
    this.characterReport?.(this.getCharacterStatus());
  }
  private get fixedManorStreet(): boolean {
    return this.scenes.active.id === 'room' && this.cameras.view === 'street' && !this.cameras.following;
  }
  private updateObstruction(delta: number, immediate: boolean): void {
    const { ceiling, walkableWorld } = this.scenes.active;
    const bounded = this.scenes.controls.constrainCamera && ceiling !== undefined;
    if (bounded) {
      const { minX, maxX, minZ, maxZ } = walkableWorld.bounds;
      this.indoorCameraBounds.min.set(minX + .25, .2, minZ + .25);
      this.indoorCameraBounds.max.set(maxX - .25, ceiling - .25, maxZ - .25);
    }
    this.obstruction.update(this.desiredCamera, this.camera, this.controls.target, this.getCameraSubject(), delta, immediate,

      this.cameras.characterVisible, bounded ? this.indoorCameraBounds : undefined, !this.fixedManorStreet);
    const swim = this.scenes.active.swim;
    if (!swim || !this.cameras.characterVisible) return;
    const camera = this.camera;
    const halfHeight = camera.near * Math.tan(camera.fov * Math.PI / 360) / camera.zoom;
    const halfWidth = halfHeight * (this.cameras.fisheye ? 1 : camera.aspect);
    this.swimCameraPosition.copy(camera.position);
    swim.constrainCamera(this.swimCameraPosition, Math.hypot(camera.near, halfWidth, halfHeight));
    if (camera.position.equals(this.swimCameraPosition)) return;
    const aimDistance = Math.max(1, camera.position.distanceTo(this.controls.target));
    camera.getWorldDirection(this.swimCameraAim).multiplyScalar(aimDistance).add(camera.position);
    camera.position.copy(this.swimCameraPosition);
    camera.lookAt(this.swimCameraAim);
    camera.updateMatrixWorld(true);
  }
  setSpeech(text: string): void { this.expressions.setSpeech(text); this.updateExpression(); }
  getExpression(): Readonly<ExpressionState> { return this.expressions.snapshot; }
  private updateExpression(): void {
    const state = this.expressions.snapshot;
    this.overlay.setContent(state, emotions[state.emotion].icon);
  }
  setEvening(evening: boolean): void { this.city.setEvening(evening); }
  getLampShadowDetection(): ReturnType<CityScene['getLampShadowDetection']> { return this.city.getLampShadowDetection(); }
  setLampShadowDetection(enabled: boolean, radius: number): boolean { return !this.disposed && this.city.setLampShadowDetection(enabled, radius); }
  getLampShadowOptions(): ReturnType<CityScene['getLampShadowOptions']> { return this.city.getLampShadowOptions(); }
  setLampShadowSelection(ids: readonly number[]): boolean { return !this.disposed && this.city.setLampShadowSelection(ids); }
  getSolarSettings(): SolarSettings { return this.scenes.active.solar?.getSettings() ?? this.city.getSolarSettings(); }
  getEnvironmentLights() {
    return (this.scenes.active.lights ?? []).map(light => ({
      id: light.id, label: light.label, kind: light.kind, maxIntensity: light.maxIntensity,
      ...light.getSettings(),
    }));
  }
  configureEnvironmentLight(id: string, patch: Partial<LightSettings>): boolean {
    return !this.disposed && (this.scenes.active.lights?.find(light => light.id === id)?.configure(patch) ?? false);
  }
  getHeadlampSettings(): HeadlampSettings | undefined { return this.scenes.active.headlamp?.getSettings(); }
  getTerrainSettings(): TerrainSettings | undefined { return this.scenes.active.terrain?.getSettings(); }
  configureTerrain(patch: Partial<TerrainSettings>): boolean {
    return !this.disposed && (this.scenes.active.terrain?.configure(patch) ?? false);
  }
  configureHeadlamp(patch: Partial<HeadlampSettings>): boolean {
    return !this.disposed && (this.scenes.active.headlamp?.configure(patch) ?? false);
  }
  configureSolar(patch: Partial<SolarSettings>): boolean { return !this.disposed && (this.scenes.active.solar?.configure(patch) ?? this.city.configureSolar(patch)); }
  getTimeOfDay(): TimeOfDay { return this.scenes.active.solar?.getTime() ?? this.city.timeOfDay; }
  setSolarReport(report: ((heading: number, elevation: number) => void) | null): void { this.solarReport = this.disposed ? null : report; }
  setTimeOfDay(time: TimeOfDay): boolean { return !this.disposed && (this.scenes.active.solar?.setTime(time) ?? this.city.setTimeOfDay(time)); }
  configureWater(patch: Partial<WaterSettings>): boolean {
    if(this.disposed || !this.city.configureWater(patch)) return false;
    this.scenes.active.swim?.water.shader.configure(this.city.waterSettings);
    if(!this.city.waterSettings.enabled)this.view.waterLens.clear();
    return true;
  }
  setWaterLensEnabled(enabled: boolean): void { if(!this.disposed)this.view.waterLens.enabled=enabled; }
  getWaterLensEnabled(): boolean { return this.view.waterLens.enabled; }
  getWaterSettings(): WaterSettings { return this.city.waterSettings; }
  capture3DDebug(settings: ViewerSettings) {
    const active = this.scenes.active;
    const cameraState = (camera: PerspectiveCamera) => ({
      position: camera.position.toArray(), quaternion: camera.quaternion.toArray(),
      fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far,
      projection: camera.projectionMatrix.toArray(),
    });
    const objects: object[] = [];
    this.scenes.root.updateMatrixWorld(true);
    this.scenes.root.traverse(object => {
      const materials = object instanceof Mesh ? [object.material].flat().map(material => ({
        id: material.id, name: material.name, type: material.type, visible: material.visible,
        opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite,
        side: material.side, wireframe: 'wireframe' in material && material.wireframe,
        color: 'color' in material && material.color instanceof Color ? material.color.getHexString() : undefined,
        roughness: 'roughness' in material ? material.roughness : undefined,
        metalness: 'metalness' in material ? material.metalness : undefined,
      })) : undefined;
      objects.push({
        id: object.id, parent: object.parent?.id, name: object.name, type: object.type,
        visible: object.visible, layers: object.layers.mask, matrixWorld: object.matrixWorld.toArray(),
        position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray(),
        castShadow: object.castShadow, receiveShadow: object.receiveShadow,
        cameraObstruction: object.userData.cameraObstruction !== false,
        geometry: object instanceof Mesh ? {
          id: object.geometry.id, type: object.geometry.type,
          vertices: object.geometry.getAttribute('position')?.count, indices: object.geometry.index?.count,
        } : undefined,
        instances: object instanceof InstancedMesh ? object.count : undefined, materials,
        light: object instanceof Light ? {
          color: object.color.getHexString(), intensity: object.intensity,
          distance: object instanceof PointLight ? object.distance : undefined,
          decay: object instanceof PointLight ? object.decay : undefined,
        } : undefined,
      });
    });
    const renderer = this.view.renderer;
    return {
      settings, objects,
      camera: { desired: cameraState(this.desiredCamera), rendered: cameraState(this.camera),
        orbitTarget: this.controls.target.toArray(), fisheye: this.cameras.fisheye },
      character: { motion: { ...this.motion }, status: this.getCharacterStatus(), destination: this.navigation.target },
      targetAnchor: this.target.anchor.toArray(), particles: this.particles.snapshot,
      water: { elapsed: this.getWaterElapsed(), pool: active.swim ? {
        footprint: active.swim.water.footprint, bottom: active.swim.water.bottom,
        level: active.swim.water.level, current: active.swim.water.current, cameraUnderwater: this.cameraSubmerged,
        swimmer: this.movement instanceof SwimController ? {
          mode: this.movement.mode, atWaterline: this.movement.atWaterline, submerged: this.movement.submerged,
        } : undefined,
      } : undefined },
      renderer: { ...this.view.stats, pixelRatio: renderer.getPixelRatio(),
        canvas: [renderer.domElement.width, renderer.domElement.height],
        shadows: renderer.shadowMap.enabled, toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure },
    };
  }


  getWaterElapsed(): number { return this.scenes.active.swim?.water.shader.elapsed ?? this.city.waterElapsed; }
  setCharacter(variant: CharacterVariant): boolean {
    if (!characterCapsules[variant] || !this.movement.setCapsule(characterCapsules[variant])) return false;
    this.mouseOrbit.cancel(); this.cameras.endCharacterOrbit(true);
    this.stop();
    this.navigation = new DestinationNavigation(this.scenes.active.walkableWorld, this.movement.shape);
    this.variant = variant; this.character.setVariant(variant);
    void this.assets.select(assetCatalog[variant]);
    return true;
  }
  retryCharacter(): void { void this.assets.retry(); }
  retryBuildings(): void { void this.buildings.load(); }
  setWalkSpeed(speed: number): boolean { return !this.disposed && this.movement.setWalkSpeed(speed); }
  applyPosition(position: { x: number; y: number; z: number }, snap: boolean): boolean {
    if (this.disposed || this.contextLost || document.hidden ||
      !this.movement.relocate(position, snap)) return false;
    this.stop();
    this.motion = this.movement.snapshot;
    this.swimCameraY = this.movement instanceof SwimController ? this.motion.y : undefined;
    this.character.update(this.motion, 0);
    if (this.assets.current) this.updateRiggedCharacter(this.assets.current, 0);
    this.city.updateLampShadowPosition(this.motion);
    this.characterReport?.(this.getCharacterStatus());
    return true;
  }
  retryTarget(): void { void this.target.retry(); }
  resetTarget(): void { if(this.disposed)return; this.target.reset(); this.particles.clear(); this.particleReport?.(this.particles.snapshot); }
  configureParticles(settings: ParticleSettings): boolean { return this.particles.configure(settings); }
  setProjectileAim(aim: ProjectileAim): void { this.projectileAim = aim; }
  getProjectileAim(): ProjectileAim { return this.projectileAim; }
  fireParticle(): void {
    if(this.contextLost || this.disposed) return;
    const origin = this.getCasterAnchor();
    const aim = this.projectileAim === 'camera'
      ? origin.clone().add(this.camera.getWorldDirection(new Vector3()))
      : this.target.anchor;
    this.particles.fire(origin, aim);
    this.particleReport?.(this.particles.snapshot);
  }
  private getCasterAnchor(): Vector3 {
    return new Vector3(this.motion.x+Math.sin(this.motion.heading)*.3,this.motion.y+this.getSubjectHeight()*.6,this.motion.z+Math.cos(this.motion.heading)*.3);
  }
  private getSubjectHeight(): number { return this.assets.current?.height ?? this.character.height; }
  setFollowing(enabled: boolean): void {
    if (this.cameraModes.followingLocked) return;
    this.mouseOrbit.cancel();
    this.cameras.setFollowing(enabled, this.getCameraSubject(), this.reducedMotion.matches);
  }
  private getCameraSubject(): CameraSubject {
    const subject = this.assets?.current ?? this.character;
    const y = this.swimCameraY ?? (this.motion.grounded
      ? this.scenes.active.cameraGroundHeight?.(this.motion) ?? this.motion.y
      : this.motion.y);
    // The horizontal presentation extends past the upright capsule; keep the eye inside its XZ clearance.
    const eyeForward = this.movement instanceof SwimController && this.movement.mode === 'swim'
      ? Math.min(subject.eyeForward, this.movement.shape.radius - .06) : subject.eyeForward;
    return { ...this.motion, y,
      height: subject.height, eyeHeight: this.swimEyeHeight ?? subject.eyeHeight, eyeForward };
  }
  startTour(text: string, loop: boolean, speed: number): boolean {
    if (this.disposed || this.contextLost || document.hidden || !this.cityFeatures) return false;
    this.autoRun.stop();
    this.cameraInput.releaseLock();
    this.input.stop();
    return this.tour.start(this.motion, parseWaypoints(text) ?? [], loop, speed);
  }
  pauseTour(): void { this.tour.pause(); }
  resumeTour(): boolean {
    return !this.disposed && !this.contextLost && !document.hidden && this.cityFeatures && this.tour.resume(this.motion);
  }
  setAutoRun(enabled: boolean): void {
    if (this.disposed || this.contextLost || document.hidden || (enabled && !this.cameraModes.autoRunEnabled)) return;
    if (enabled && this.movement instanceof SwimController && !this.hasExternalSwimView()) return;
    this.input.stop();
    this.navigation.cancel();
    this.tour.cancel();
    this.mouseOrbit.cancel();
    this.tap.cancel();
    this.cameraModes.resetGestures();
    if (enabled && this.cameraModes.inputMode === 'stationary-look') this.autoRun.resetLook();
    this.autoRun.setEnabled(enabled, this.motion.heading);
    this.characterReport?.(this.getCharacterStatus());
    if (this.cameraModes.followingLocked) this.cameraModes.follow();
    if (enabled) this.cameraInput.requestLock(); else this.cameraInput.releaseLock();
  }
  private hasExternalSwimControls(): boolean {
    return this.movement instanceof SwimController && this.movement.mode !== 'ground' &&
      this.hasExternalSwimView();
  }
  private hasExternalSwimView(): boolean {
    return this.cameras.view === 'first-person' || this.cameras.view === 'third-person' || this.cameras.view === 'fisheye';
  }
  private setSwimSpiral(direction: SwimDepthDirection): void {
    if (!(this.movement instanceof SwimController) || !this.hasExternalSwimControls()) return;
    if (!this.movement.canSwimVertically(direction)) {
      this.setAutoRun(false);
      return;
    }
    this.setAutoRun(true);
    if (this.autoRun.running) this.swimSpiral = direction;
  }
  private stopSwimSpiral(): void {
    if (!this.swimSpiral) return;
    this.swimSpiral = undefined;
    this.autoRun.stop();
    if (this.movement instanceof SwimController) this.movement.stop(false);
  }
  getLookSensitivity(): LookSensitivity { return this.autoRun.lookSensitivity; }
  configureLookSensitivity(patch: Partial<LookSensitivity>): boolean { return this.autoRun.configureSensitivity(patch); }
  getMouseLockStatus(): string { return this.cameraInput.lockStatus; }
  requestMouseLock(): void { this.cameraInput.requestLock(); }
  reverseAutoRun(): void {
    if (!this.autoRun.running) return;
    this.autoRun.reverse();
    this.motion = this.movement.update(0, { x: Math.sin(this.autoRun.heading), z: Math.cos(this.autoRun.heading), run: true, jump: false });
    this.setCamera(this.cameras.view);
  }
  resetCameraLook(): void { this.cameraModes.resetLook(); }
  setRunning(enabled: boolean): void { this.input.setRun(enabled); }
  jump(): void { this.input.jump(); }
  stop(): void {
    this.stopSwimSpiral();
    this.cameraInput?.releaseLock();
    this.cameraModes.resetGestures(); this.autoRun.stop(); this.mouseOrbit.cancel(); this.cameras.endCharacterOrbit(true); this.input.stop();
    this.characterReport?.(this.getCharacterStatus());
  }
  setFlightMode(mode: 'flight' | 'ground'): boolean {
    if (this.disposed || this.contextLost || document.hidden || !(this.movement instanceof FlightController)) return false;
    const accepted = mode === 'flight' ? this.movement.takeOff() : this.movement.land();
    if (accepted) { this.input.stop(); this.motion = this.movement.snapshot; this.characterReport?.(this.getCharacterStatus()); }
    return accepted;
  }

  leaveWater(): boolean {
    if (!this.disposed && !this.contextLost && !document.hidden && this.movement instanceof PoolSwimController) {
      const accepted = this.movement.climbOut();
      if (accepted) { this.input.stop(); this.motion = this.movement.snapshot; this.characterReport?.(this.getCharacterStatus()); }
      return accepted;
    }
    if (this.disposed || this.contextLost || document.hidden || !(this.movement instanceof SwimController)) return false;
    if (!this.movement.canLeaveWater()) return false;
    this.input.stop();
    if (!this.movement.leaveWater()) return false;
    this.motion = this.movement.snapshot;
    if (this.assets.current) this.updateRiggedCharacter(this.assets.current, 0);
    this.characterReport?.(this.getCharacterStatus());
    return true;
  }

  getSwimStatus(): SwimStatus | null {
    if (this.movement instanceof PoolSwimController) {
      const swimming = this.movement.mode === 'swim';
      return { swimming, climbing: false, bottom: false, waterLocation: swimming ? '02' : '00',
        canClimb: this.movement.canClimb, atWaterline: swimming && this.movement.depth < this.movement.shape.height,
        submerged: swimming, cameraSubmerged: this.cameraSubmerged, droppedTime: 0, rigged: !!this.assets.current };
    }
    if (!(this.movement instanceof SwimController)) return null;
    return {
      swimming: this.movement.mode === 'swim', climbing: this.movement.mode === 'climb', bottom: this.movement.mode === 'bottom',
      waterLocation: this.movement.waterLocation, canClimb: this.movement.canLeaveWater(), atWaterline: this.movement.atWaterline, submerged: this.movement.submerged,
      cameraSubmerged: this.cameraSubmerged, droppedTime: this.movement.droppedTime, rigged: !!this.assets.current,
    };
  }
  getSwimAppearance(): SwimAppearance { return { ...this.swimAppearance }; }
  setSwimAppearance(appearance: SwimAppearance): boolean {
    if (this.disposed || !validSwimAppearance(appearance)) return false;
    this.swimAppearance = { ...appearance };
    if (this.assets.current) this.updateRiggedCharacter(this.assets.current, 0);
    this.characterReport?.(this.getCharacterStatus());
    return true;
  }

  private updateRiggedCharacter(model: RiggedCharacter, delta: number): void {
    const swim = this.movement instanceof SwimController ? this.movement : null;
    model.update(this.motion, delta, swim ? this.swimAppearance : undefined, swim?.mode === 'swim',
      this.reducedMotion.matches, swim?.climbProgress);
  }
  bindDirection(button: HTMLButtonElement, direction: MoveDirection): void { this.input.bindDirection(button, direction); }
  getCharacterStatus(): CharacterStatus {
    return { flight: this.movement instanceof FlightController ? { mode: this.movement.mode, warning: this.movement.warning?.id ?? null, droppedTime: this.movement.droppedTime } : null, groundPenetration: this.groundPenetration, autoRun: this.autoRun.enabled, autoRunPaused: this.autoRun.enabled && !this.autoRun.running, variant: this.variant, action: this.motion.action, running: this.autoRun.running || this.input.running || this.navigation.status === 'running' || (this.tour.snapshot.status === 'running' && this.tour.snapshot.speed > 1.8), following: this.cameras.following, firstPerson: this.cameras.view === 'first-person', cameraView: this.cameras.view, navigation: this.navigation.status, tour: this.tour.snapshot, obstructionMode: this.obstruction.mode, motion: { ...this.motion }, walkSpeed: this.movement.walkSpeed, buildings: this.buildings.state };
  }
  setShadows(enabled: boolean): void {
    this.shadows = enabled;
    this.view.setShadows(enabled);
    this.city.setShadows(enabled);
    this.character.setShadows(enabled);
    this.assets.current?.setShadows(enabled);
    this.target.setShadows(enabled);
    this.trafficView.setShadows(enabled);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.solarReport = null; this.events.abort();
    this.inspector.dispose();
    this.traffic.dispose(); this.trafficView.dispose();
    this.cameraInput.dispose(); this.mouseOrbit.dispose(); this.tap.dispose(); this.destinationMarker.remove();
    this.assets.dispose(); this.input.dispose(); this.character.dispose(); this.overlay.dispose();
    this.target.dispose(); this.particles.dispose(); this.actorLabels.forEach(label=>label.remove());
    for(const marker of [this.casterMarker,this.targetMarker]) {marker.geometry.dispose();marker.material.dispose();marker.removeFromParent();}
    this.needle?.dispose();
    this.controls.dispose(); this.obstruction.dispose(); this.buildings.dispose(); this.scenes.dispose(); this.city.dispose(); this.view.dispose();
  }
}
