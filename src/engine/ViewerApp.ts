import type { ProjectileAim, SceneSettings, ViewerSettings } from '../settings/ViewerSettings';
import { validViewerSettings } from '../settings/validateViewerSettings';
import { SwimController, type SwimDepthDirection } from '../character/SwimController';
import { defaultSwimAppearance, validSwimAppearance, type SwimAppearance } from '../character/SwimAppearance';
import { EnvironmentScan } from './EnvironmentScan';
import { worldQuery } from '../world/LegacyWorldQuery';
import { Color, Group, InstancedMesh, Light, Mesh, MeshBasicMaterial, PerspectiveCamera, PointLight, SphereGeometry, Vector3 } from 'three';
import { TargetActor } from '../character/TargetActor';
import { ParticleInteraction, type ParticleSettings, type ParticleSnapshot } from '../interaction/ParticleInteraction';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CityScene, type TimeOfDay } from '../scene/CityScene';
import { SceneRenderer, type RenderStats } from './SceneRenderer';
import { Character } from '../character/Character';
import { CharacterController } from '../character/CharacterController';
import { characterCapsules, type CharacterVariant, type MotionSnapshot } from '../character/motion';
import { FlightController } from '../character/FlightController';
import { SpatialCharacterController } from '../character/SpatialCharacterController';
import { SceneSwitch, type Environment, type EnvironmentId } from '../scene/SceneSwitch';
import { releaseSceneGpuResources, resetShadowResources } from './ContextResources';
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
import { CameraObstruction, type ObstructionMode } from '../camera/CameraObstruction';
import { createSpraySource, type WaterSettings } from '../water/index.ts';
import { SceneObjectInspector } from '../inspector/SceneObjectInspector';

export type CameraPreset = CameraView;
export interface CharacterStatus { flightMode?: 'flight' | 'ground'; flightWarning?: string; variant: CharacterVariant; action: MotionSnapshot['action']; running: boolean; following: boolean; firstPerson: boolean; cameraView: CameraView; navigation: NavigationStatus; obstructionMode: ObstructionMode }

export class ViewerApp {
  private readonly camera = new PerspectiveCamera(43, 1, 0.1, 200);
  private readonly desiredCamera = this.camera.clone();
  private readonly swimCameraPosition = new Vector3();
  private readonly swimCameraAim = new Vector3();
  private cameraUnderwater = false;
  private obstruction: CameraObstruction;
  private readonly followObstruction: FollowCamera;
  private readonly scenes: SceneSwitch;
  private timeOfDay: TimeOfDay = 'day';
  private readonly city: CityScene;
  private readonly cityScene: Environment;
  private readonly view: SceneRenderer;
  private readonly controls: OrbitControls;
  private readonly character: Character;
  private movement: CharacterController | SpatialCharacterController | FlightController | SwimController;
  private readonly input: InputManager;
  private navigation: DestinationNavigation;
  private groundPicker: GroundPicker;
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
  private readonly interactionActors = new Group();
  private readonly target: TargetActor;
  private readonly particles = new ParticleInteraction();
  private readonly casterMarker = new Mesh(new SphereGeometry(.075,12,8), new MeshBasicMaterial({color:'#66ddff'}));
  private readonly targetMarker = new Mesh(new SphereGeometry(.09,12,8), new MeshBasicMaterial({color:'#ffbf69'}));
  private readonly actorLabels: HTMLDivElement[] = [];
  private readonly environmentScan = new EnvironmentScan();
  private swimSpiral?: SwimDepthDirection;
  private swimAppearance: SwimAppearance = { ...defaultSwimAppearance };
  private sceneSettings: ViewerSettings['scenes'] = {};
  private walkSpeed = 1.8;
  private projectileAim: ProjectileAim = 'target';
  private shadows = true;
  private variant: CharacterVariant = 'man';
  private motion: Readonly<MotionSnapshot>;
  private readonly events = new AbortController();
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private lastTime = 0;
  private sampleTime = 0;
  private frameCount = 0;
  private contextLost = false;
  private disposed = false;
  constructor(private readonly container: HTMLElement, private readonly report: (message: string) => void, private readonly fps: (value: number) => void, private readonly characterReport?: (status: CharacterStatus) => void, assetReport?: (state: LoadingState) => void, private readonly metricsReport?: (stats: RenderStats) => void, targetReport?: (state: LoadingState) => void, private readonly particleReport?: (state: ParticleSnapshot) => void) {
    this.view = new SceneRenderer(container, this.camera);
    this.city = new CityScene();
    this.cityScene = {
      id: 'city', scene: this.city.scene, environment: this.city.environment,
      walkableWorld: this.city.walkableWorld, spawn: { x: 0, z: 5 }, cityFeatures: true,
      dispose() { /* The Viewer retains the city until shutdown. */ },
    };
    this.scenes = new SceneSwitch(this.cityScene);
    this.obstruction = new CameraObstruction(this.city.environment, this.environmentScan.prepareMaterial);
    this.followObstruction = new FollowCamera(this.city.environment.children);
    this.desiredCamera.copy(this.camera);
    this.controls = new OrbitControls(this.desiredCamera, this.view.renderer.domElement);
    this.character = new Character();
    this.movement = new CharacterController(this.city.walkableWorld);
    this.navigation = new DestinationNavigation(this.city.walkableWorld);
    this.groundPicker = new GroundPicker(this.city.environment.children);
    this.input = new InputManager(window, document, () => { this.swimSpiral = undefined; this.navigation.cancel(); this.tap?.cancel(); });
    this.motion = this.movement.update(0, this.input.sample());
    this.character.update(this.motion, 0);
    this.scenes.root.add(this.character.root);
    this.target = new TargetActor(this.city.walkableWorld, state => targetReport?.(state));
    this.interactionActors.add(this.target.root, this.particles.root, this.particles.lightRoot, this.casterMarker, this.targetMarker);
    this.scenes.root.add(this.interactionActors);
    this.environmentScan.prepare(this.city.environment);
    this.environmentScan.watch(this.target.root);
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
    this.cameras = new CameraController(this.desiredCamera, this.controls, this.followObstruction, new FirstPersonCamera());
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
          model.setShadows(this.shadows);
          model.update(this.motion, 0);
          model.root.visible = this.cameras.characterVisible;
          this.scenes.root.add(model.root);
        }
        this.character.root.visible = !model && this.cameras.characterVisible;
        this.updateCanvasLabel(Boolean(model));
      },
    });
    const canvas = this.view.renderer.domElement;
    this.mouseOrbit = new MouseOrbitGesture(canvas,
      () => { this.tap.cancelCandidate(); this.cameras.beginCharacterOrbit(); },
      cancelled => this.cameras.endCharacterOrbit(cancelled));
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', event => {
      const swimmer = this.movement;
      if (!(swimmer instanceof SwimController) || event.repeat || event.isComposing ||
          event.altKey || event.ctrlKey || event.metaKey || !['KeyI', 'KeyO', 'KeyY'].includes(event.code)) return;
      event.preventDefault();
      const direction = event.code === 'KeyI' ? -1 : 1;
      this.stop();
      if (event.code !== 'KeyY' && swimmer.canSwimVertically(direction)) this.swimSpiral = direction;
    }, { signal: this.events.signal });
    this.updateCanvasLabel(false);
    this.destinationMarker = document.createElement('div');
    this.destinationMarker.className = 'destination-marker';
    this.destinationMarker.setAttribute('aria-hidden', 'true');
    this.destinationMarker.hidden = true;
    container.append(this.destinationMarker);
    this.tap = new TapGesture(canvas, point => {
      if (this.contextLost || this.disposed || !this.scenes.controls.groundNavigation || this.environmentId === 'flight') return;
      const active = this.scenes.active;
      const rect = canvas.getBoundingClientRect();
      const target = this.groundPicker.pick({ x: point.x - rect.left, y: point.y - rect.top }, this.camera,
        rect.width, rect.height, this.cameras.fisheye, active.walkableWorld,
        [], active.id === 'room', characterCapsules[this.variant]);
      this.input.stop();
      if (target) this.navigation.select(this.motion, target);
      else this.navigation.reject();
    });
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }), { signal: this.events.signal });
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.contextLost = true;
      this.scenes.cancel();
      this.environmentScan.clear();
      const roots = [this.scenes.root, this.city.scene, this.interactionActors];
      resetShadowResources(roots);
      releaseSceneGpuResources(roots);
      this.view.releaseContextResources();
      this.stop(); this.destinationMarker.hidden = true;
      this.particles.clear(); this.particleReport?.(this.particles.snapshot);
      this.view.waterLens.clear();
      this.actorLabels.forEach(label => {label.hidden=true;});
      this.overlay.place(null);
      this.inspector.hide();
      this.report('Graphics connection lost. Waiting for recovery…');
    }, { signal: this.events.signal });
    canvas.addEventListener('webglcontextrestored', () => { this.view.restoreContext(); this.contextLost = false; this.lastTime = 0; this.report('WebGL2 · connection restored'); }, { signal: this.events.signal });
    document.addEventListener('visibilitychange', () => { this.lastTime = 0; if (document.hidden) this.stop(); }, { signal: this.events.signal });
    window.addEventListener('blur', () => this.stop(), { signal: this.events.signal });
    this.obstruction.prepareTransparency(() => {
      this.view.renderer.compile(this.scenes.root, this.camera);
    });
    this.view.renderer.setAnimationLoop(time => this.update(time));
    this.report('WebGL2 · ready');
    void this.assets.select(assetCatalog[this.variant]);
  }
  private update(time: number): void {
    if (this.disposed || this.contextLost) return;
    const waterDelta = this.lastTime && !document.hidden ? Math.min(Math.max((time - this.lastTime) / 1000, 0), 0.05) : 0;
    const delta = Math.min((time - this.lastTime) / 1000 || 1 / 60, 0.05);
    this.lastTime = time;
    const active = this.scenes.active;
    if (active.cityFeatures) this.city.update(waterDelta);
    else active.update?.(waterDelta, this.reducedMotion.matches);
    this.mouseOrbit.update(delta);
    const manual = this.input.sample();
    if (manual.x || manual.z || manual.jump) this.navigation.cancel();
    const intent = this.navigation.status === 'running' ? this.navigation.sample(this.motion, delta) : manual;
    const movement = this.movement;
    if (movement instanceof SwimController) {
      this.motion = movement.update(delta, intent, undefined, this.swimSpiral);
      if (this.swimSpiral && (movement.depthPathBlocked || !movement.canSwimVertically(this.swimSpiral))) {
        this.swimSpiral = undefined;
        movement.stop(false);
      }
    } else {
      this.motion = movement.update(delta, intent);
    }
    this.character.update(this.motion, delta);
    this.updateRig(delta);
    this.target.update(delta);
    const casterAnchor = this.getCasterAnchor();
    const targetAnchor = this.target.anchor;
    this.casterMarker.position.copy(casterAnchor); this.targetMarker.position.copy(targetAnchor);
    this.particles.update(delta,targetAnchor,this.target.height*.25);
    this.particleReport?.(this.particles.snapshot);
    this.characterReport?.(this.getCharacterStatus());
    const immediate = this.reducedMotion.matches;
    this.desiredCamera.aspect = this.camera.aspect;
    this.desiredCamera.updateProjectionMatrix();
    this.cameras.update(this.getCameraSubject(), delta, immediate);
    this.updateObstruction(delta, immediate);
    if (active.swim) {
      this.cameraUnderwater = active.swim.updateCamera(this.camera.position);
      this.scenes.syncAppearance();
    }
    active.headlamp?.update(this.getCameraSubject(), waterDelta, immediate,
      this.cameras.view === 'first-person' ? this.camera : undefined);
    if (active.cityFeatures) this.view.waterLens.update(waterDelta,this.camera,
      this.city.getWaterSpraySource(this.waterSource)?this.waterSource:undefined,
      this.city.environment,this.city.waterSettings,immediate);
    this.character.root.visible = !this.assets.current && this.cameras.characterVisible;
    if (this.assets.current) this.assets.current.root.visible = this.cameras.characterVisible;
    this.casterMarker.visible = this.cameras.characterVisible;
    const labelAnchors = [new Vector3(this.motion.x,this.motion.y+this.getSubjectHeight()+.55,this.motion.z),
      this.target.anchor.clone().add(new Vector3(0,this.target.height*.4+.3,0))];
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
    const marker = destination ? projectAnchor(new Vector3(destination.x, (destination.y ?? active.walkableWorld.groundHeight(destination.x, destination.z)) + 0.06, destination.z),
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
    this.environmentScan.update(time);
    this.view.render(this.scenes.root, this.cameras.fisheye,
      this.obstruction.mode === 'xray' && this.cameras.characterVisible
        ? { subject: (this.assets.current ?? this.character).root, environment: active.environment } : undefined);
    this.frameCount++;
    if (time - this.sampleTime >= 1000) {
      this.fps(Math.round(this.frameCount * 1000 / (time - this.sampleTime)));
      this.metricsReport?.(this.view.stats);
      this.frameCount = 0; this.sampleTime = time;
    }
  }
  get environmentId(): EnvironmentId { return this.scenes.active.id; }

  private updateCanvasLabel(rigged: boolean): void {
    const controls = this.environmentId === 'flight'
      ? 'WASD or arrows to move. Space to ascend, C to descend in flight.'
      : 'Tap the ground to run there. WASD or arrows to move, Shift to run, Space to jump.';
    this.view.renderer.domElement.setAttribute('aria-label',
      `Interactive ${this.environmentId} with a ${rigged ? 'rigged' : 'procedural'} character. ${controls} Drag to orbit, pinch to zoom.`);
  }

  async selectEnvironment(id: EnvironmentId): Promise<boolean> {
    if (this.disposed || this.contextLost) return false;
    const previous = this.scenes.active;
    this.sceneSettings[previous.id] = this.captureSceneSettings();
    const previousMovement = this.movement;
    const previousNavigation = this.navigation;
    let candidate: typeof this.movement;
    return this.scenes.select(id, async () => {
      const next = id === 'city' ? this.cityScene
        : id === 'cave' ? (await import('../scene/CaveScene')).createCave()
        : id === 'terrain' ? (await import('../scene/TerrainScene')).createTerrain()
        : id === 'flight' ? (await import('../scene/FlightScene')).createFlight()
        : id === 'room' ? await (await import('../scene/ManorScene')).createManor()
        : (await import('../scene/SwimScene')).createSwim();
      try {
        const capsule = characterCapsules[this.variant];
        candidate = next.id === 'city' ? new CharacterController(next.walkableWorld)
          : next.id === 'flight' ? new FlightController(next.walkableWorld, capsule)
          : next.swim ? new SwimController(next.walkableWorld, capsule, next.spawn, next.swim.water, next.swim.exit)
          : new SpatialCharacterController(next.walkableWorld, capsule, next.spawn);
        if (candidate instanceof FlightController &&
          !candidate.relocate({ ...next.spawn, y: next.walkableWorld.groundHeight(next.spawn.x, next.spawn.z) })) {
          throw new Error('Scene spawn is unavailable');
        }
        next.swim?.water.shader.configure(this.getWaterSettings());
        this.getTargetSpawn(next);
        next.solar?.setTime(this.timeOfDay);
        return next;
      } catch (error) {
        next.dispose();
        throw error;
      }
    }, next => {
      this.stop();
      const following = this.cameras.following;
      const mode = this.obstruction.mode;
      this.obstruction.dispose();
      this.obstruction = new CameraObstruction(next.environment, this.environmentScan.prepareMaterial);
      this.obstruction.setMode(mode);
      this.followObstruction.setObstructions(next.environment.children);
      const restoring = next === previous;
      this.movement = restoring ? previousMovement : candidate;
      this.movement.setWalkSpeed(this.walkSpeed);
      const settings = this.sceneSettings[next.id];
      if (settings) this.applySceneSettings(settings);
      this.navigation = restoring ? previousNavigation : new DestinationNavigation(next.walkableWorld);
      this.input.setFlightControls(!!next.swim || this.movement instanceof FlightController && this.movement.mode === 'flight');
      this.motion = this.movement instanceof CharacterController
        ? this.movement.update(0, this.input.sample()) : this.movement.snapshot;
      this.character.update(this.motion, 0);
      this.assets.current?.update(this.motion, 0);
      this.groundPicker = new GroundPicker(next.environment.children);
      this.target.setWorld(next.walkableWorld, this.getTargetSpawn(next));
      this.environmentScan.clear();
      this.environmentScan.prepare(next.environment);
      this.particles.clear();
      this.view.waterLens.clear();
      this.destinationMarker.hidden = true;
      this.overlay.place(null);
      this.inspector.hide();
      this.inspector.sync();
      this.cameras.setEnvironmentPresets(next.controls?.staticFraming ?? (next.id === 'cave' ? {
        overview: { position: [1, 4.4, 12], target: [0, 1, 0] },
        street: { position: [0, 2.4, 12], target: [0, 1.5, 0] },
        overhead: { position: [0, 4.8, 5.01], target: [0, 0, 5] },
      } : undefined));
      this.cameras.select(this.cameras.view, this.getCameraSubject(), true);
      this.cameras.setFollowing(following, this.getCameraSubject(), true);
      this.updateObstruction(0, true);
      this.updateCanvasLabel(Boolean(this.assets.current));
    });
  }

  private getTargetSpawn(scene: Environment): { x: number; z: number } {
    const { spawn, walkableWorld: world } = scene;
    for (const point of [scene.targetSpawn ?? { x: 0, z: -1 }, { x: spawn.x + 1.5, z: spawn.z }, { x: spawn.x - 1.5, z: spawn.z }]) {
      if (Math.hypot(point.x - spawn.x, point.z - spawn.z) < 1) continue;
      const feet = { ...point, y: world.groundHeight(point.x, point.z) };
      const overlap = worldQuery(world).overlap(feet, characterCapsules.woman);
      if (overlap.ok && !overlap.value) return point;
    }
    throw new Error('Target spawn is unavailable');
  }

  scanEnvironment(): void {
    if (!this.disposed && !this.contextLost) this.environmentScan.start(this.motion);
  }

  getSwimStatus() {
    const controller = this.movement;
    return controller instanceof SwimController
      ? { mode: controller.mode, canLeave: controller.canLeaveWater(), atWaterline: controller.atWaterline }
      : null;
  }

  leaveWater(): boolean {
    if (this.disposed || this.contextLost || !(this.movement instanceof SwimController)) return false;
    this.input.stop();
    return this.movement.leaveWater();
  }

  setSwimAppearance(appearance: SwimAppearance): void {
    if (validSwimAppearance(appearance)) this.swimAppearance = { ...appearance };
  }

  private updateRig(delta: number): void {
    const swim = this.movement instanceof SwimController ? this.movement : undefined;
    this.assets.current?.update(this.motion, delta, swim ? this.swimAppearance : undefined,
      swim?.mode === 'swim', this.reducedMotion.matches, swim?.climbProgress);
  }

  private captureSceneSettings(): SceneSettings {
    const active = this.scenes.active;
    return {
      time: active.solar?.getTime() ?? this.timeOfDay,
      solar: active.solar?.getSettings() ?? { enabled: false, hour: 12, season: 'spring', latitude: 0 },
      lights: active.lights?.map(light => ({ id: light.id, settings: light.getSettings() })) ?? [],
      headlamp: active.headlamp?.getSettings() ?? null,
      terrain: active.terrain?.getSettings(),
    };
  }

  private applySceneSettings(settings: SceneSettings): void {
    const active = this.scenes.active;
    this.setTimeOfDay(settings.time);
    active.solar?.configure(settings.solar);
    for (const { id, settings: light } of settings.lights) active.lights?.find(item => item.id === id)?.configure(light);
    if (settings.headlamp) active.headlamp?.configure(settings.headlamp);
    if (settings.terrain) active.terrain?.configure(settings.terrain);
  }

  getPanelSettings(): ViewerSettings {
    this.sceneSettings[this.environmentId] = this.captureSceneSettings();
    return structuredClone({
      environment: this.environmentId, scenes: this.sceneSettings,
      variant: this.variant, camera: this.cameras.view, following: this.cameras.following,
      cameraPose: { position: this.desiredCamera.position.toArray(), target: this.controls.target.toArray(), yaw: 0, pitch: 0, zoom: 1 },
      obstruction: this.obstruction.mode, walkSpeed: this.walkSpeed, expression: this.getExpression(),
      particles: this.particles.settings, projectileAim: this.projectileAim, water: this.getWaterSettings(), swimAppearance: this.swimAppearance,
      waterLens: this.getWaterLensEnabled(), shadows: this.shadows, inspector: this.inspector.getSettings(),
    });
  }

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
        level: active.swim.water.level, current: active.swim.water.current, cameraUnderwater: this.cameraUnderwater,
        swimmer: this.movement instanceof SwimController ? {
          mode: this.movement.mode, atWaterline: this.movement.atWaterline, submerged: this.movement.submerged,
        } : undefined,
      } : undefined },
      renderer: { ...this.view.stats, pixelRatio: renderer.getPixelRatio(),
        canvas: [renderer.domElement.width, renderer.domElement.height],
        shadows: renderer.shadowMap.enabled, toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure },
    };
  }

  async applyPanelSettings(settings: ViewerSettings): Promise<void> {
    if (!validViewerSettings(settings)) throw new Error('Invalid panel settings');
    this.stop();
    if (!await this.selectEnvironment(settings.environment)) throw new Error('Could not restore environment');
    if (this.variant !== settings.variant && !this.setCharacter(settings.variant)) throw new Error('Character needs more clearance');
    this.sceneSettings = structuredClone(settings.scenes);
    this.applySceneSettings(settings.scenes[settings.environment]!);
    this.setWalkSpeed(settings.walkSpeed);
    this.setEmotion(settings.expression.emotion);
    this.setSpeech(settings.expression.speech);
    this.configureParticles(settings.particles);
    this.setProjectileAim(settings.projectileAim ?? 'target');
    this.particles.clear();
    this.particleReport?.(this.particles.snapshot);
    this.configureWater(settings.water);
    this.setSwimAppearance(settings.swimAppearance ?? defaultSwimAppearance);
    this.setWaterLensEnabled(settings.waterLens);
    this.setShadows(settings.shadows);
    this.setObstructionMode(settings.obstruction);
    this.cameras.select(settings.camera, this.getCameraSubject(), true);
    this.cameras.setFollowing(settings.following, this.getCameraSubject(), true);
    if (settings.cameraPose && !settings.following && settings.camera !== 'first-person') {
      this.desiredCamera.position.fromArray(settings.cameraPose.position);
      this.controls.target.fromArray(settings.cameraPose.target);
      this.controls.update();
    }
    this.updateObstruction(0, true);
    this.inspector.applySettings(settings.inspector);
    this.characterReport?.(this.getCharacterStatus());
  }

  setFlightMode(mode: 'flight' | 'ground'): boolean {
    if (this.disposed || this.contextLost || !(this.movement instanceof FlightController)) return false;
    const accepted = mode === 'flight' ? this.movement.takeOff() : this.movement.land();
    if (accepted) this.input.setFlightControls(mode === 'flight');
    return accepted;
  }

  setCamera(preset: CameraPreset): void {
    this.mouseOrbit.cancel();
    this.cameras.select(preset, this.getCameraSubject(), this.reducedMotion.matches);
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
    this.obstruction.update(this.desiredCamera, this.camera, this.controls.target, this.getCameraSubject(), delta, immediate, this.cameras.characterVisible, !(this.environmentId === 'room' && this.cameras.view === 'street'));
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
  setEvening(evening: boolean): void { this.setTimeOfDay(evening ? 'evening' : 'day'); }
  setTimeOfDay(time: TimeOfDay): boolean {
    if (this.disposed || !this.city.setTimeOfDay(time)) return false;
    this.timeOfDay = time;
    this.scenes.active.solar?.setTime(time);
    this.scenes.syncAppearance();
    return true;
  }
  configureWater(patch: Partial<WaterSettings>): boolean {
    if(this.disposed || !this.city.configureWater(patch)) return false;
    this.scenes.active.swim?.water.shader.configure(this.city.waterSettings);
    if(!this.city.waterSettings.enabled)this.view.waterLens.clear();
    return true;
  }
  setWaterLensEnabled(enabled: boolean): void { if(!this.disposed)this.view.waterLens.enabled=enabled; }
  getWaterLensEnabled(): boolean { return this.view.waterLens.enabled; }
  getWaterSettings(): WaterSettings { return this.city.waterSettings; }
  getWaterElapsed(): number { return this.scenes.active.swim?.water.shader.elapsed ?? this.city.waterElapsed; }
  setCharacter(variant: CharacterVariant): boolean {
    this.mouseOrbit.cancel(); this.cameras.endCharacterOrbit(true);
    this.stop();
    if (!(this.movement instanceof CharacterController) && !this.movement.setCapsule(characterCapsules[variant])) return false;
    this.variant = variant; this.character.setVariant(variant);
    void this.assets.select(assetCatalog[variant]);
    return true;
  }
  retryCharacter(): void { void this.assets.retry(); }
  retryTarget(): void { void this.target.retry(); }
  resetTarget(): void { if(this.disposed)return; this.target.reset(); this.particles.clear(); this.particleReport?.(this.particles.snapshot); }
  setWalkSpeed(speed: number): void {
    if (this.movement.setWalkSpeed(speed)) this.walkSpeed = speed;
  }
  setProjectileAim(aim: ProjectileAim): void { this.projectileAim = aim; }
  getTimeOfDay(): TimeOfDay { return this.scenes.active.solar?.getTime() ?? this.timeOfDay; }
  configureParticles(settings: ParticleSettings): boolean { return this.particles.configure(settings); }
  fireParticle(): void {
    if(this.contextLost || this.disposed) return;
    const origin = this.getCasterAnchor();
    const aim = this.projectileAim === 'camera'
      ? origin.clone().add(this.camera.getWorldDirection(new Vector3())) : this.target.anchor;
    this.particles.fire(origin, aim);
    this.particleReport?.(this.particles.snapshot);
  }
  private getCasterAnchor(): Vector3 {
    return new Vector3(this.motion.x+Math.sin(this.motion.heading)*.3,this.motion.y+this.getSubjectHeight()*.6,this.motion.z+Math.cos(this.motion.heading)*.3);
  }
  private getSubjectHeight(): number { return this.assets.current?.height ?? this.character.height; }
  setFollowing(enabled: boolean): void {
    this.mouseOrbit.cancel();
    this.cameras.setFollowing(enabled, this.getCameraSubject(), this.reducedMotion.matches);
  }
  private getCameraSubject(): CameraSubject {
    const subject = this.assets?.current ?? this.character;
    const active = this.scenes.active;
    const y = this.motion.grounded ? active.cameraGroundHeight?.(this.motion) ?? this.motion.y : this.motion.y;
    const eyeForward = this.movement instanceof SwimController && this.movement.mode === 'swim'
      ? Math.min(subject.eyeForward, this.movement.shape.radius - .06) : subject.eyeForward;
    return { ...this.motion, y, height: subject.height, eyeHeight: subject.eyeHeight, eyeForward };
  }
  setRunning(enabled: boolean): void { this.input.setRun(enabled); }
  jump(): void { this.input.jump(); }
  stop(): void { this.mouseOrbit.cancel(); this.cameras.endCharacterOrbit(true); this.input.stop(); if (this.movement instanceof FlightController || this.movement instanceof SwimController) this.movement.stop(); }
  bindDirection(button: HTMLButtonElement, direction: MoveDirection): void { this.input.bindDirection(button, direction); }
  getCharacterStatus(): CharacterStatus {
    const flight = this.movement instanceof FlightController ? this.movement : undefined;
    const warning = flight?.mode === 'flight' ? flight.warning : null;
    return { flightMode: flight?.mode, flightWarning: warning?.id, variant: this.variant, action: this.motion.action, running: this.input.running || this.navigation.status === 'running', following: this.cameras.following, firstPerson: this.cameras.view === 'first-person', cameraView: this.cameras.view, navigation: this.navigation.status, obstructionMode: this.obstruction.mode };
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
    this.environmentScan.dispose();
    this.controls.dispose(); this.obstruction.dispose(); this.scenes.dispose(); this.city.dispose(); this.view.dispose();
  }
}
