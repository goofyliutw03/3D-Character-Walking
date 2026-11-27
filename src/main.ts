import { isEnvironmentId } from './scene/EnvironmentId';
import { bindEnvironmentLights } from './ui/EnvironmentLightControls';
import { PanelProfiles, profileControlsContent } from './ui/PanelProfiles';
import { showTourStatus } from './ui/TourControls';
import { bindCharacterEditor, showEditorState } from './ui/CharacterEditor';
import { SolarControls } from './ui/SolarControls';
import { bindHeadlampControls } from './ui/HeadlampControls';
import type { ViewerApp, CameraPreset, CharacterStatus } from './engine/ViewerApp';
import type { CharacterVariant } from './character/motion';
import { swimPoseLabels, validSwimAppearance } from './character/SwimAppearance.ts';
import type { MoveDirection } from './input/InputManager';
import type { TimeOfDay } from './scene/CityScene';
import { emotions, speechLimit, type Emotion } from './expression/ExpressionManager';
import { presentLoading, type LoadingState } from './ui/LoadingFeedback';
import { SpeechEditor } from './ui/SpeechEditor';
import { LoadingPanel } from './ui/LoadingPanel';
import type { ObstructionMode } from './camera/CameraObstruction';
import { controlPanelContent } from './ui/controlPanelContent';
import { ControlPanel } from './ui/ControlPanel';
import type { TrafficSnapshot } from './simulation/TrafficSimulation';
import './style.css';

const cameraNames: Record<CameraPreset, string> = {
  overview: 'Overview', street: 'Street level', overhead: 'From above',
  'first-person': 'First person', 'third-person': 'Third person', front: 'Front',
  'character-overhead': 'Character overhead', 'low-angle': 'Low angle', fisheye: 'Fisheye · 160°',
};
const obstructionHints: Record<ObstructionMode, string> = {
  zoom: 'Move smoothly closer when scenery blocks your character, then return to your chosen view.',
  transparent: 'Keep your view. Scenery blocking your character becomes 75% transparent.',
  wireframe: 'Show the whole scene as a wireframe. Your character keeps its normal appearance.',
  xray: 'Reveal only hidden parts of your character with a 50% contrast overlay. Water, particles and transparent materials do not block this view.',
};

let solarControls: SolarControls | undefined;
let panelProfiles: PanelProfiles | undefined;
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Application root was not found.');
app.innerHTML = `
  <header>
    <a class="brand" href="/" aria-label="Walk Studio home"><span class="brand-mark">W</span> WALK<span class="brand-light">STUDIO</span></a>
    <div class="project-name">City street <span>/</span> Untitled scene</div>
    <span class="version">CHARACTER STUDY <b>06</b></span>
  </header>
  <main>
    <aside class="control-panel" aria-label="Function panel">
      <div class="panel-toolbar">
        <button id="panel-toggle" data-panel-layout type="button" aria-expanded="true" aria-controls="control-panel-content" aria-label="Collapse function panel" title="Expand or collapse function panel"><span class="panel-toggle-icon" aria-hidden="true">☰</span><span class="panel-toggle-label">Function panel</span><span class="panel-toggle-chevron" aria-hidden="true">‹</span></button>
      </div>
      <div id="control-panel-content" class="panel-content">
        <h1 class="panel-title">Your workspace</h1>
        ${profileControlsContent}
        <p class="panel-help">Expand a category to explore.<span class="panel-resize-copy"> Drag the right edge to resize.</span></p>
        <nav class="function-tree" aria-label="Viewer functions">${controlPanelContent(obstructionHints.zoom)}</nav>
        <div class="sidebar-bottom"><span class="status-dot"></span> Everything runs on your computer.</div>
      </div>
      <div id="panel-resize" role="separator" tabindex="0" aria-label="Function panel width" aria-orientation="vertical" aria-controls="control-panel-content" aria-describedby="panel-resize-help" title="Drag to resize · Left / Right arrows · Home / End"></div>
      <span id="panel-resize-help" class="sr-only">Use Left and Right arrows to resize, Shift for larger steps, Home for minimum and End for maximum width.</span>
    </aside>
    <div class="scene-workspace">
    <section class="viewport" aria-label="Scene workspace" aria-busy="true">
      <div id="scene"></div>
      <div class="scene-title"><span class="eyebrow">THE NEIGHBORHOOD</span><h2>Maple Avenue</h2><p>A quiet street. An open canvas.</p></div>
      <div class="scene-badge"><span class="status-dot"></span> LIVE SCENE</div>
      <div class="scene-bottom"><div class="interaction-guide" id="interaction-guide"><span><b>Drag</b> orbit</span><span><b>Scroll</b> zoom</span><span><b>Right drag</b> pan</span></div><button id="reset" class="reset-button" aria-label="Reset camera">↺ <span>Reset view</span></button></div>
      <div id="scene-error" class="error-panel" role="alert" hidden></div>
      <div id="loading-panel" class="loading-panel" data-state="loading">
        <p class="loading-eyebrow">GETTING YOUR CITY READY</p>
        <div class="loading-sculpture" aria-hidden="true"><div class="loading-word">${Array.from({ length: 13 }, (_, layer) => `<span style="--layer:${layer}">LOADING</span>`).join('')}</div></div>
        <progress max="100" aria-label="Initialization progress"></progress>
        <p class="loading-message" data-loading-message>Preparing the viewer…</p>
        <span class="loading-amount" data-loading-amount>Working…</span>
        <button id="retry-character" type="button" hidden>Retry character</button>
      </div>
    </section>
    <section class="movement-controls" aria-label="Movement controls">
      <div class="direction-pad" role="group" aria-label="Movement directions">
        <button data-direction="forward" aria-label="Move forward">↑</button>
        <button data-direction="left" aria-label="Move left">←</button>
        <button data-direction="backward" aria-label="Move backward">↓</button>
        <button data-direction="right" aria-label="Move right">→</button>
      </div>
      <div class="action-controls" role="group" aria-label="Character actions">
        <button id="run" aria-pressed="false">Run</button><button id="jump">Jump</button><span id="flight-touch" hidden><button id="flight-up" aria-label="Ascend">↑ Ascend</button><button id="flight-down" aria-label="Descend">↓ Descend</button></span><button id="stop">Stop</button>
        <button id="fire-particle" type="button">Fire particle</button><button id="reset-target" type="button">Reset target</button>
        <button id="mobile-auto-run" class="mobile-camera-action" type="button" aria-pressed="false">自動奔跑</button>
        <button id="mobile-reverse" class="mobile-camera-action" type="button">反向</button>
        <button id="mobile-look-reset" class="mobile-camera-action" type="button">鏡頭歸位</button>
      </div>
      <div class="movement-copy">
        <p id="navigation-status" role="status" aria-live="polite" aria-atomic="true">Tap the ground to run there.</p>
        <p class="movement-help">Hold arrows to move · Stop cancels · Drag to orbit / pinch to zoom</p>
        <p id="particle-status" role="status" aria-live="polite" aria-atomic="true">Ready · Active 0 · Hits 0 · Expired 0</p>
      </div>
    </section>
    </div>
  </main>
  <div class="asset-feedback"><div id="asset-status" class="asset-status" role="status" aria-live="polite" aria-atomic="true">Starting scene…</div></div>
  <footer><span><span class="status-dot"></span> <span id="renderer-status" role="status">Starting scene…</span></span><span id="camera-status">Camera: Overview</span><span><span id="fps">—</span> FPS <span class="footer-divider">/</span> <span id="scene-metrics">1 unit = 1 meter</span></span></footer>
`;
const controlPanel = new ControlPanel(document.querySelector<HTMLElement>('main')!);
const scene = document.querySelector<HTMLElement>('#scene')!;
const status = document.querySelector<HTMLElement>('#renderer-status')!;
const fps = document.querySelector<HTMLElement>('#fps')!;
const error = document.querySelector<HTMLElement>('#scene-error')!;
const assetStatus = document.querySelector<HTMLElement>('#asset-status')!;
const viewport = document.querySelector<HTMLElement>('.viewport')!;
const retryCharacter = document.querySelector<HTMLButtonElement>('#retry-character')!;
const loadingPanel = new LoadingPanel(document.querySelector<HTMLElement>('#loading-panel')!);
const reportAsset = (state: LoadingState): void => {
  presentLoading(assetStatus, state);
  loadingPanel.update(state);
  viewport.setAttribute('aria-busy', String(state.phase === 'loading'));
  retryCharacter.hidden = state.phase !== 'error';
  document.querySelector('#character-source')!.textContent = state.phase === 'ready' ? 'RIGGED GLB' : state.phase === 'error' ? 'FALLBACK' : 'LOADING';
  document.querySelector('#character-asset-hint')!.textContent = state.phase === 'error' ? 'Procedural fallback · selected rigged asset unavailable.' : state.message;
};
reportAsset({ phase: 'loading', stage: 'engine', message: 'Preparing the viewer…' });
const uiEvents = new AbortController();
const controls = document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('button:not([data-panel-layout]), input, select, textarea');
controls.forEach(control => { if (control !== retryCharacter) control.disabled = true; });
let viewer: ViewerApp | undefined;
let fatal = false;
retryCharacter.addEventListener('click', () => {
  if (fatal) window.location.reload();
  else viewer?.retryCharacter();
}, { signal: uiEvents.signal });
let previousCharacterStatus = '';
const updateCharacterStatus = (state: CharacterStatus): void => {
  if (viewer) document.querySelector('#mouse-lock-status')!.textContent = viewer.getMouseLockStatus();
  document.querySelector<HTMLInputElement>('#auto-run')!.checked = state.autoRun;
  document.querySelector('#mobile-auto-run')!.setAttribute('aria-pressed', String(state.autoRun));
  document.querySelector('#mobile-auto-run')!.textContent = state.autoRunPaused && !state.firstPerson ? '恢復奔跑' : state.autoRun ? '停止自動跑' : '自動奔跑';
  document.querySelector<HTMLButtonElement>('#mobile-reverse')!.disabled = !state.autoRun || state.autoRunPaused;
  document.querySelector<HTMLButtonElement>('#auto-run-resume')!.hidden = !state.autoRunPaused || state.firstPerson;
  document.querySelector('#auto-run-status')!.textContent = state.autoRun ? (state.autoRunPaused ? 'Paused' : 'Running') : 'Off';
  showTourStatus(document, state.tour);
  showEditorState(document, state.motion, state.walkSpeed, state.buildings);
  const swim = viewer?.getSwimStatus();
  const swimming = swim?.swimming === true;
  if (swim) {
    const label = swim.climbing ? 'Climbing onto the platform' : swimming ? (swim.atWaterline ? 'At the surface' : 'Swimming · underwater')
      : swim.bottom ? 'On the pool floor' : 'On the platform';
    const appearance = viewer!.getSwimAppearance();
    const message = swimming ? label + ' · ' + (!swim.rigged ? 'Procedural preview'
      : state.motion.speed < 1e-6 ? '立游' : swimPoseLabels[appearance.pose]) : label;
    const status = document.querySelector('#swim-status')!;
    if (status.textContent !== message) status.textContent = message;
    document.querySelector<HTMLButtonElement>('#swim-exit')!.disabled = !swim.canClimb;
    const hint = !swim.canClimb && swimming ? 'Surface beside the edge of the gold platform to climb.' : '';
    const climbHint = document.querySelector('#swim-climb-hint')!;
    if (climbHint.textContent !== hint) climbHint.textContent = hint;
  }
  const key = `${state.variant}/${state.action}/${state.running}/${state.following}/${state.cameraView}/${state.navigation}/${state.obstructionMode}/${state.groundPenetration}/${state.autoRun}/${state.autoRunPaused}/${state.flight?.mode}/${state.flight?.warning}/${state.flight ? state.motion.speed.toFixed(1) : ""}/${state.flight?.droppedTime.toFixed(2)}`;
  const sceneKey = key + '/' + (swim ? swimming || swim.bottom : '');
  if (sceneKey === previousCharacterStatus) return;
  previousCharacterStatus = sceneKey;
  const names = { man: 'Man', woman: 'Woman', child: 'Child' };
  const actions = { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump' };
  const verticalMovement = swimming || swim?.bottom === true || state.flight?.mode === 'flight';
  document.querySelector<HTMLElement>('#flight-touch')!.hidden = !verticalMovement;
  document.querySelector<HTMLButtonElement>('#jump')!.disabled = verticalMovement;
  document.querySelector('#run')!.textContent = verticalMovement ? 'Boost' : 'Run';
  for (const id of ['mobile-auto-run','auto-run','auto-run-resume','touch-auto-run']) {
    const button = document.getElementById(id) as HTMLButtonElement | null;
      if (button) button.disabled = swim?.climbing === true;
  }
  if (state.flight) {
    document.querySelector('#flight-status')!.textContent = `${state.flight.mode === 'flight' ? 'Flying · Jump animation fallback' : 'Landed · ground movement'} · ${state.motion.speed.toFixed(1)}m/s${state.flight.warning ? ' · Boundary warning: ' + state.flight.warning : ''} · discarded ${state.flight.droppedTime.toFixed(2)}s`;
    document.querySelector<HTMLButtonElement>('#flight-takeoff')!.disabled = state.flight.mode === 'flight';
    document.querySelector<HTMLButtonElement>('#flight-land')!.disabled = state.flight.mode !== 'flight';
  }
  document.querySelector('#character-status')!.textContent = `${names[state.variant]} · ${swimming ? 'Swim' : actions[state.action]}`;
  document.querySelector('#run')!.setAttribute('aria-pressed', String(state.running));
  const navigationMessages = {
    idle: 'Tap the ground to run there.', running: 'Running to destination…',
    arrived: 'Destination reached.', blocked: 'Cannot reach that spot. Tap clear ground.',
  };
  const navigationStatus = document.querySelector('#navigation-status')!;
  const navigationMessage = swim ? 'Use the gold platform to enter and leave the pool.'
    : state.flight ? 'Flight area: E / Space ↑ · Q ↓ · Shift boost · explicit Land within 2m. Ground navigation and auto run unavailable.' : navigationMessages[state.navigation];
  if (navigationStatus.textContent !== navigationMessage) navigationStatus.textContent = navigationMessage;
  document.querySelector<HTMLInputElement>('#follow')!.checked = state.following;
  document.querySelector<HTMLInputElement>('#follow')!.disabled = state.firstPerson;
  document.querySelector<HTMLSelectElement>('#obstruction-mode')!.value = state.obstructionMode;
  document.querySelector<HTMLInputElement>('#ground-penetration')!.checked = state.groundPenetration;
  document.querySelector('#obstruction-hint')!.textContent = state.firstPerson && state.obstructionMode !== 'wireframe'
    ? 'First person keeps your eye position. This mode resumes when you return to an external view.'
    : obstructionHints[state.obstructionMode];
  document.querySelector('#camera-mode')!.textContent = state.cameraView === 'fisheye' ? '160° FISHEYE' : cameraNames[state.cameraView].toUpperCase();
  document.querySelector('.viewport')!.classList.toggle('fisheye-view', state.cameraView === 'fisheye');
  document.querySelector('#camera-hint')!.textContent = state.firstPerson
    ? 'Eye-level view stays attached to your character.'
    : state.following ? 'Following your character. Turn off to pause this view.' : 'Tracking paused. Drag to orbit, scroll to zoom.';
  const staticView = ['overview', 'street', 'overhead'].includes(state.cameraView);
  const touch = window.matchMedia('(pointer: coarse)').matches;
  document.querySelector('#interaction-guide')!.innerHTML = verticalMovement
    ? '<span><b>E / Space ↑ · Q ↓</b> ascend / descend</span><span><b>Shift</b> boost</span><span><b>Stop</b> brake</span>'
    : touch
    ? state.firstPerson
      ? '<span>單指看四周 · 捏合退出</span>'
      : state.autoRun && (state.cameraView === 'third-person' || state.cameraView === 'fisheye')
        ? '<span>單指轉向 · 雙指環繞／縮放</span>'
        : '<span>單指拖曳 · 雙指縮放</span>'
    : state.autoRun && (state.cameraView === 'third-person' || state.cameraView === 'fisheye' || state.firstPerson)
    ? '<span><b>Mouse</b> steer / look</span><span><b>Ctrl</b> orbit</span><span><b>F1</b> reset · <b>Y</b> auto run</span>'
    : state.following && !staticView
    ? '<span><b>WASD / arrows</b> move</span><span><b>Shift</b> run</span><span><b>Space</b> jump</span>'
    : '<span><b>Drag</b> orbit</span><span><b>Scroll</b> zoom</span><span><b>Right drag</b> pan</span>';
  document.querySelector('#camera-status')!.textContent = `Camera: ${cameraNames[state.cameraView]}${state.following ? ' · following' : ''}`;
  document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.camera === state.cameraView)));
};
async function initialize(): Promise<void> {
try {
  // Yield for the initial DOM before downloading and constructing the engine.
  await new Promise<void>(resolve => requestAnimationFrame(() => { setTimeout(resolve, 0); }));
  if (uiEvents.signal.aborted) return;
  const { ViewerApp } = await import('./engine/ViewerApp');
  if (uiEvents.signal.aborted) return;
  reportAsset({ phase: 'loading', stage: 'scene', message: 'Building the city scene…' });
  const reportTraffic = (state: TrafficSnapshot): void => {
    const phases = { vehicles: 'Vehicle green', yellow: 'Vehicle yellow', 'all-red': 'All red · clearing vehicles', pedestrians: 'Pedestrian green', clearance: 'All red · clearing pedestrians' };
    const text = `${!state.settings.enabled ? 'Simulation off' : state.settings.paused ? 'Simulation paused' : phases[state.phase]} · ${state.npcs.length} pedestrians · ${state.vehicles.length} vehicles`;
    const element = document.querySelector('#traffic-status')!;
    if (element.textContent !== text) element.textContent = text;
  };
  viewer = new ViewerApp(scene, message => { status.textContent = message; }, value => { fps.textContent = String(value); }, updateCharacterStatus, reportAsset, metrics => {
    const element = document.querySelector<HTMLElement>('#scene-metrics')!;
    element.textContent = `${metrics.drawCalls} draws · ${(metrics.triangles / 1000).toFixed(1)}k triangles`;
    element.dataset.geometries = String(metrics.geometries); element.dataset.textures = String(metrics.textures);
  }, state => {
    document.querySelector('#target-status')!.textContent = `Target · ${state.phase === 'ready' ? 'Rigged woman · Ready' : state.phase === 'error' ? 'Fallback · Could not load' : 'Loading · procedural preview'}`;
    document.querySelector<HTMLButtonElement>('#retry-target')!.hidden = state.phase !== 'error';
  }, state => {
    const element = document.querySelector('#particle-status')!;
    const text = `${state.lastEvent} · Active ${state.active} · Hits ${state.hits} · Expired ${state.expired}`;
    if(element.textContent !== text) element.textContent = text;
  }, reportTraffic);
  const environment = document.querySelector<HTMLSelectElement>('#environment')!;
  const environmentStatus = document.querySelector('#environment-status')!;
  document.querySelector<HTMLButtonElement>('#scan-environment')!.addEventListener('click',
    () => viewer?.scanEnvironment(), { signal: uiEvents.signal });
  const syncEnvironmentLights = bindEnvironmentLights(document.querySelector<HTMLElement>('#environment-lights')!, viewer, uiEvents.signal);
  const syncHeadlamp = bindHeadlampControls(document.querySelector<HTMLFieldSetElement>('#headlamp-controls')!, viewer, uiEvents.signal);
  let environmentRequest = 0;
  let environmentOperation = Promise.resolve();
  const syncEnvironment = (ready: boolean): void => {
    const active = viewer!.environmentId;
    const city = viewer!.cityFeatures;
    const swim = active === 'swim' || active === 'pool';
    environment.value = active;
    viewport.dataset.environment = active;
    environmentStatus.textContent = ready ? (swim ? 'Tidal Pool ready.' : active === 'room' ? '莊園豪宅已就緒。' : city ? 'City street ready.' : active === 'flight' ? 'Flight ready.' : active === 'terrain' ? 'Terrain ready.' : 'Cave ready.') : 'Could not switch. Current environment kept.';
    document.querySelector<HTMLElement>('#swim-controls')!.hidden = !swim;
    document.querySelector<HTMLElement>('#swim-controls')!.inert = !swim;
    document.querySelector('#swim-result')!.textContent = '';
    const appearance = viewer!.getSwimAppearance();
    document.querySelector<HTMLSelectElement>('#swim-pose')!.value = appearance.pose;
    document.querySelector<HTMLSelectElement>('#swim-outfit')!.value = appearance.outfit;
    document.querySelector<HTMLElement>('#flight-controls')!.hidden = active !== 'flight';
    document.querySelector<HTMLElement>('#flight-controls')!.inert = active !== 'flight';
    document.querySelector('#flight-result')!.textContent = '';
    const terrain = viewer!.getTerrainSettings();
    document.querySelector<HTMLElement>('#terrain-controls')!.hidden = !terrain;
    document.querySelector<HTMLElement>('#terrain-controls')!.inert = !terrain;
    if (terrain) {
      document.querySelector<HTMLSelectElement>('#terrain-quality')!.value = terrain.quality;
      document.querySelector<HTMLInputElement>('#terrain-wind')!.checked = terrain.wind;
    }
    for (const id of ['city-buildings', 'traffic-simulation', 'water-feature', 'character-tour']) {
      const group = document.querySelector<HTMLElement>(`#function-${id}`)!;
      const visible = city || swim && id === 'water-feature';
      group.hidden = !visible;
      group.inert = !visible;
    }
    lampFieldset.hidden = !city;
    lampFieldset.inert = !city;
    lighting.value = viewer!.getTimeOfDay();
    solarControls?.sync();
    syncHeadlamp();
    syncEnvironmentLights();
    syncLampControls();
    document.querySelector('#water-feature-hint')!.textContent = swim ? 'Water quality also controls plants and bubbles.' : 'A small cascade at the far end of the street. Walk around the stone basin.';
    document.querySelector<HTMLElement>('label[for="water-lens"]')!.hidden = swim;
    document.querySelector<HTMLElement>('#water-lens-hint')!.hidden = swim;
    document.querySelector('.project-name')!.innerHTML = swim ? 'Tidal Pool <span>/</span> Validation area' : active === 'room' ? '莊園豪宅 <span>/</span> Manor estate' : city ? 'City street <span>/</span> Untitled scene' : active === 'flight' ? 'Bounded flight <span>/</span> Validation area' : active === 'terrain' ? 'Natural terrain <span>/</span> Validation area' : 'Underground <span>/</span> Validation area';
    document.querySelector('.scene-title .eyebrow')!.textContent = swim ? 'THE POOL' : active === 'room' ? 'THE ESTATE' : city ? 'THE NEIGHBORHOOD' : active === 'flight' ? 'THE AIRSPACE' : active === 'terrain' ? 'THE HILLS' : 'UNDERGROUND';
    document.querySelector('.scene-title h2')!.textContent = swim ? 'Tidal Pool' : active === 'room' ? '莊園豪宅' : city ? 'Maple Avenue' : active === 'flight' ? 'Sky Range' : active === 'terrain' ? 'Wind Meadow' : 'Rock Chamber';
    document.querySelector('.scene-title p')!.textContent = swim ? 'Walk off the gold platform to swim.' : active === 'room' ? '從前庭進入莊園，沿樓梯探索地下室、四層樓和屋頂陽台，或穿過後門前往花園。' : city ? 'A quiet street. An open canvas.' : active === 'flight' ? 'Finite airspace. Clear landings. Procedural clouds.' : active === 'terrain' ? 'Rolling ground. Shared heights. Moving grass.' : 'A walkable chamber with solid walls.';
  };
  const changeEnvironment = async (): Promise<void> => {
    const id = isEnvironmentId(environment.value) ? environment.value : 'city';
    const request = ++environmentRequest;
    environmentStatus.textContent = 'Preparing environment…';
    const ready = await viewer!.selectEnvironment(id);
    if (uiEvents.signal.aborted || request !== environmentRequest) return;
    syncEnvironment(ready);
    panelProfiles?.changed();
  };
  environment.addEventListener('change', () => { environmentOperation = changeEnvironment(); }, { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#terrain-quality')!.addEventListener('change', event => {
    viewer?.configureTerrain({ quality: (event.target as HTMLSelectElement).value as 'standard' | 'low' });
    panelProfiles?.changed();
  }, { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#terrain-wind')!.addEventListener('change', event => {
    viewer?.configureTerrain({ wind: (event.target as HTMLInputElement).checked });
    panelProfiles?.changed();
  }, { signal: uiEvents.signal });
  document.querySelector('#tour-start')!.addEventListener('click', () => {
    viewer?.startTour(document.querySelector<HTMLTextAreaElement>('#tour-route')!.value,
      document.querySelector<HTMLInputElement>('#tour-loop')!.checked,
      document.querySelector<HTMLInputElement>('#tour-speed')!.valueAsNumber);
  }, {signal:uiEvents.signal});
  document.querySelector('#tour-pause')!.addEventListener('click', () => viewer?.pauseTour(), {signal:uiEvents.signal});
  document.querySelector('#tour-resume')!.addEventListener('click', () => viewer?.resumeTour(), {signal:uiEvents.signal});
  document.querySelector('#tour-stop')!.addEventListener('click', () => viewer?.stop(), {signal:uiEvents.signal});
  viewer.mountObjectInspector(document.querySelector<HTMLElement>('#scene-object-inspector')!);
  const syncTraffic = (): void => {
    if (!viewer) return;
    const state = viewer.getTrafficState();
    for (const [id,key] of [['traffic-enabled','enabled'],['traffic-paused','paused'],['traffic-lod','lod']] as const)
      document.querySelector<HTMLInputElement>(`#${id}`)!.checked = state.settings[key];
    for (const [id,key] of [['traffic-npcs','npcCount'],['traffic-vehicles','vehicleCount']] as const)
      document.querySelector<HTMLInputElement>(`#${id}`)!.value = String(state.settings[key]);
    reportTraffic(state);
  };
  for (const [id,key] of [['traffic-enabled','enabled'],['traffic-paused','paused'],['traffic-lod','lod']] as const) {
    document.querySelector<HTMLInputElement>(`#${id}`)!.addEventListener('change', event => {
      viewer?.configureTraffic({[key]:(event.target as HTMLInputElement).checked}); syncTraffic();
    }, {signal:uiEvents.signal});
  }
  for (const [id,key] of [['traffic-npcs','npcCount'],['traffic-vehicles','vehicleCount']] as const) {
    const field = document.querySelector<HTMLInputElement>(`#${id}`)!;
    field.addEventListener('input', () => {
      if (viewer?.configureTraffic({[key]:field.valueAsNumber})) reportTraffic(viewer.getTrafficState());
    }, {signal:uiEvents.signal});
    field.addEventListener('change', () => {
      viewer?.configureTraffic({[key]:field.valueAsNumber}); syncTraffic();
    }, {signal:uiEvents.signal});
  }
  document.querySelector('#traffic-reset')!.addEventListener('click', () => { viewer?.resetTraffic(); syncTraffic(); }, {signal:uiEvents.signal});
  controls.forEach(control => { if (!control.closest('.profile-toolbar')) control.disabled = false; });
  bindCharacterEditor(document, viewer, uiEvents.signal);
  const syncWater = (): void => {
    if (!viewer) return;
    const state = viewer.getWaterSettings();
    document.querySelector<HTMLInputElement>('#water-enabled')!.checked = state.enabled;
    document.querySelector<HTMLInputElement>('#water-paused')!.checked = state.paused;
    document.querySelector<HTMLInputElement>('#water-lens')!.checked = viewer.getWaterLensEnabled();
    document.querySelector<HTMLSelectElement>('#water-quality')!.value = state.quality;
    document.querySelector<HTMLInputElement>('#water-wave')!.value = String(state.waveStrength);
    document.querySelector<HTMLInputElement>('#water-flow')!.value = String(state.flowSpeed);
    document.querySelector('#water-settings-status')!.textContent = `${!state.enabled ? 'Static water' : state.paused ? 'Water paused' : 'Dynamic water'} · ${state.quality === 'low' ? 'Low' : 'Standard'} quality.`;
    document.querySelector('#water-wave-value')!.textContent = state.waveStrength.toFixed(1);
    document.querySelector('#water-flow-value')!.textContent = state.flowSpeed.toFixed(1);
  };
  document.querySelector<HTMLInputElement>('#water-lens')!.addEventListener('change', event => {
    viewer?.setWaterLensEnabled((event.target as HTMLInputElement).checked);
  }, {signal:uiEvents.signal});
  for (const [id, key] of [['water-enabled','enabled'],['water-paused','paused']] as const) {
    document.querySelector<HTMLInputElement>(`#${id}`)!.addEventListener('change', event => {
      viewer?.configureWater({[key]:(event.target as HTMLInputElement).checked}); syncWater();
    }, {signal:uiEvents.signal});
  }
  document.querySelector<HTMLSelectElement>('#water-quality')!.addEventListener('change', event => {
    const quality = (event.target as HTMLSelectElement).value;
    if (quality === 'low' || quality === 'standard') viewer?.configureWater({quality});
    syncWater();
  }, {signal:uiEvents.signal});
  for (const [id, key] of [['water-wave','waveStrength'],['water-flow','flowSpeed']] as const) {
    document.querySelector<HTMLInputElement>(`#${id}`)!.addEventListener('input', event => {
      const input = event.target as HTMLInputElement;
      if (!input.checkValidity() || !viewer?.configureWater({[key]:input.valueAsNumber})) {
        document.querySelector('#water-settings-status')!.textContent = 'Check the allowed water ranges. Settings were not changed.';
        return;
      }
      syncWater();
    }, {signal:uiEvents.signal});
  }
  const projectileAim = document.querySelector<HTMLSelectElement>('#projectile-aim')!;
  projectileAim.addEventListener('change', () => {
    viewer?.setProjectileAim(projectileAim.value === 'camera' ? 'camera' : 'target');
  }, { signal: uiEvents.signal });
  document.querySelector('#fire-particle')!.addEventListener('click',()=>viewer?.fireParticle(),{signal:uiEvents.signal});
  document.querySelector('#reset-target')!.addEventListener('click',()=>viewer?.resetTarget(),{signal:uiEvents.signal});
  document.querySelector('#retry-target')!.addEventListener('click',()=>viewer?.retryTarget(),{signal:uiEvents.signal});
  document.querySelector('#apply-particles')!.addEventListener('click',()=>{
    const number = (id: string): number => document.querySelector<HTMLInputElement>(`#particle-${id}`)!.valueAsNumber;
    const fields = [...document.querySelectorAll<HTMLInputElement>('.particle-settings input')];
    const invalid = fields.find(field => !field.checkValidity());
    if (invalid) {
      // Reveal an invalid field even when its appearance subgroup was collapsed.
      let group = invalid.closest('details');
      while (group) { group.open = true; group = group.parentElement?.closest('details') ?? null; }
      invalid.reportValidity();
    }
    const valid = !invalid && viewer?.configureParticles({
      color:document.querySelector<HTMLInputElement>('#particle-color')!.value,
      speed:number('speed'),size:number('size'),lifetime:number('lifetime'),maxCount:number('limit'),
      lightEnabled:document.querySelector<HTMLInputElement>('#particle-light-enabled')!.checked,
      lightColor:document.querySelector<HTMLInputElement>('#particle-light-color')!.value,
      lightIntensity:number('light-intensity'),lightRadius:number('light-radius'),lightDecay:number('light-decay'),
    });
    document.querySelector('#particle-settings-status')!.textContent = valid ? 'Settings applied to new shots.' : 'Check the allowed ranges. Settings were not changed.';
  },{signal:uiEvents.signal});
  const speech = document.querySelector<HTMLTextAreaElement>('#speech')!;
  const expressionStatus = document.querySelector<HTMLElement>('#expression-status')!;
  const syncExpression = (announce: boolean): void => {
    if (!viewer) return;
    const state = viewer.getExpression();
    if (speech.value !== state.speech) speech.value = state.speech;
    document.querySelector('#speech-count')!.textContent = `${Array.from(state.speech).length} / ${speechLimit}`;
    if (announce) {
      const message = `Mood: ${emotions[state.emotion].label}. ${state.speech.trim() ? `Speech: ${state.speech}` : 'No speech.'}`;
      if (expressionStatus.textContent !== message) expressionStatus.textContent = message;
    }
  };
  document.querySelector<HTMLSelectElement>('#emotion')!.addEventListener('change', event => {
    viewer?.setEmotion((event.target as HTMLSelectElement).value as Emotion);
    syncExpression(true);
  }, { signal: uiEvents.signal });
  speech.addEventListener('focus', () => viewer?.stop(), { signal: uiEvents.signal });
  new SpeechEditor(speech, (text, announce) => {
    viewer?.setSpeech(text); syncExpression(announce);
  }, uiEvents.signal);
  document.querySelector('#clear-speech')!.addEventListener('click', () => {
    viewer?.setSpeech(''); syncExpression(true); speech.focus();
  }, { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#character')!.addEventListener('change', event => {
    const select = event.target as HTMLSelectElement;
    if (viewer && !viewer.setCharacter(select.value as CharacterVariant)) {
      select.value = viewer.getCharacterStatus().variant;
      document.querySelector('#position-result')!.textContent = 'Character change rejected: insufficient clearance.';
    }
  }, { signal: uiEvents.signal });
  document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => viewer?.bindDirection(button, button.dataset.direction as MoveDirection));
  document.querySelector('#run')!.addEventListener('click', () => viewer?.setRunning(!viewer.getCharacterStatus().running), { signal: uiEvents.signal });
  document.querySelector('#auto-run')!.addEventListener('change', event => viewer?.setAutoRun((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
  for (const key of ['thirdHorizontal', 'thirdVertical', 'firstHorizontal', 'firstVertical'] as const) {
    const input = document.querySelector<HTMLInputElement>(`#look-${key}`)!;
    input.addEventListener('input', () => {
      if (input.checkValidity()) viewer?.configureLookSensitivity({ [key]: input.valueAsNumber });
    }, { signal: uiEvents.signal });
  }
  document.querySelector('#auto-run-resume')!.addEventListener('click', () => viewer?.setAutoRun(true), { signal: uiEvents.signal });
  document.querySelector('#touch-reverse')!.addEventListener('click', () => viewer?.reverseAutoRun(), { signal: uiEvents.signal });
  document.querySelector('#touch-look-reset')!.addEventListener('click', () => viewer?.resetCameraLook(), { signal: uiEvents.signal });
  document.querySelector('#mobile-auto-run')!.addEventListener('click', () => {
    const state = viewer?.getCharacterStatus();
    if (state) viewer?.setAutoRun(state.autoRunPaused && !state.firstPerson ? true : !state.autoRun);
  }, { signal: uiEvents.signal });
  document.querySelector('#mobile-reverse')!.addEventListener('click', () => viewer?.reverseAutoRun(), { signal: uiEvents.signal });
  document.querySelector('#mobile-look-reset')!.addEventListener('click', () => viewer?.resetCameraLook(), { signal: uiEvents.signal });
  document.querySelector('#jump')!.addEventListener('click', () => viewer?.jump(), { signal: uiEvents.signal });
  viewer.bindDirection(document.querySelector<HTMLButtonElement>('#flight-up')!, 'up');
  viewer.bindDirection(document.querySelector<HTMLButtonElement>('#flight-down')!, 'down');
  const swimPose = document.querySelector<HTMLSelectElement>('#swim-pose')!;
  const swimOutfit = document.querySelector<HTMLSelectElement>('#swim-outfit')!;
  const chooseSwimAppearance = (): void => {
    const appearance = { pose: swimPose.value, outfit: swimOutfit.value };
    if (validSwimAppearance(appearance)) viewer?.setSwimAppearance(appearance);
  };
  swimPose.addEventListener('change', chooseSwimAppearance, { signal: uiEvents.signal });
  swimOutfit.addEventListener('change', chooseSwimAppearance, { signal: uiEvents.signal });
  document.querySelector('#swim-exit')!.addEventListener('click', () => {
    document.querySelector('#swim-result')!.textContent = viewer?.leaveWater()
      ? '' : 'Surface beside the platform edge, then try again.';
  }, { signal: uiEvents.signal });
  for (const [id, mode] of [['flight-takeoff','flight'],['flight-land','ground']] as const) {
    document.getElementById(id)!.addEventListener('click', () => {
      const accepted = viewer?.setFlightMode(mode);
      document.querySelector('#flight-result')!.textContent = accepted ? (mode === 'flight' ? 'Takeoff ready.' : 'Landing complete.') : 'Landing rejected. Descend within 2m of a clear, walkable surface.';
    }, { signal: uiEvents.signal });
  }
  document.querySelector('#stop')!.addEventListener('click', () => viewer?.stop(), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#follow')!.addEventListener('change', event => viewer?.setFollowing((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#obstruction-mode')!.addEventListener('change', event => viewer?.setObstructionMode((event.target as HTMLSelectElement).value as ObstructionMode), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#ground-penetration')!.addEventListener('change', event => viewer?.setGroundPenetration((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
  const cameraButtons = document.querySelectorAll<HTMLButtonElement>('[data-camera]');
  const selectCamera = (preset: CameraPreset): void => {
    viewer?.setCamera(preset);
  };
  cameraButtons.forEach(button => button.addEventListener('click', () => selectCamera(button.dataset.camera as CameraPreset), { signal: uiEvents.signal }));
  document.querySelector('#reset')!.addEventListener('click', () => selectCamera('overview'), { signal: uiEvents.signal });
  const lighting = document.querySelector<HTMLSelectElement>('#lighting')!;
  const shadows = document.querySelector<HTMLInputElement>('#shadows')!;
  const lampFieldset = document.querySelector<HTMLFieldSetElement>('#lamp-shadows')!;
  const lampAuto = document.querySelector<HTMLInputElement>('#lamp-shadow-auto')!;
  const lampRadius = document.querySelector<HTMLInputElement>('#lamp-shadow-radius')!;
  const lampRadiusValue = document.querySelector<HTMLOutputElement>('#lamp-shadow-radius-value')!;
  const lampInputs = [...document.querySelectorAll<HTMLInputElement>('[data-lamp-shadow]')];
  const syncLampControls = (): void => {
    const options = viewer!.getLampShadowOptions();
    for (const input of lampInputs) input.checked = options.find(option => option.id === Number(input.dataset.lampShadow))!.selected;
    lampFieldset.disabled = viewer!.getTimeOfDay() !== 'night' || !shadows.checked;
    const detection = viewer!.getLampShadowDetection();
    lampAuto.checked = detection.enabled;
    lampRadius.value = String(detection.radius);
    lampRadius.disabled = !detection.enabled;
    lampRadiusValue.value = `${detection.radius} m`;
  };
  lampInputs.forEach(input => input.addEventListener('change', () => {
    viewer?.setLampShadowSelection(lampInputs.filter(option => option.checked).map(option => Number(option.dataset.lampShadow)));
    syncLampControls();
  }, { signal: uiEvents.signal }));
  const updateLampDetection = (): void => {
    viewer?.setLampShadowDetection(lampAuto.checked, lampRadius.valueAsNumber);
    syncLampControls();
  };
  lampAuto.addEventListener('change', updateLampDetection, { signal: uiEvents.signal });
  lampRadius.addEventListener('input', updateLampDetection, { signal: uiEvents.signal });
  solarControls = new SolarControls(document.querySelector<HTMLElement>('.solar-controls')!, viewer!, syncLampControls);
  lighting.addEventListener('change', () => { viewer?.setTimeOfDay(lighting.value as TimeOfDay); solarControls?.sync(); syncLampControls(); }, { signal: uiEvents.signal });
  shadows.addEventListener('change', () => { viewer?.setShadows(shadows.checked); syncLampControls(); }, { signal: uiEvents.signal });
  syncLampControls();
  panelProfiles = new PanelProfiles(document.querySelector<HTMLElement>('.control-panel')!, viewer, controlPanel, settings => {
    shadows.checked = settings.shadows;
    projectileAim.value = viewer!.getProjectileAim();
    document.querySelector<HTMLInputElement>('#walk-speed')!.value = String(settings.walkSpeed);
    for (const [key, sensitivity] of Object.entries(settings.sensitivity)) {
      document.querySelector<HTMLInputElement>(`#look-${key}`)!.value = String(sensitivity);
    }
    syncEnvironment(true);
    syncTraffic(); syncWater(); syncExpression(false);
    updateCharacterStatus(viewer!.getCharacterStatus());
  }, () => environmentOperation);
  await panelProfiles.initialize();
} catch (cause) {
  fatal = true;
  reportAsset({ phase: 'error', message: 'Scene unavailable.', recovery: 'Reload the page to retry. If the problem continues, check your connection and WebGL2 hardware acceleration.' });
  retryCharacter.textContent = 'Reload page';
  status.textContent = 'Scene unavailable';
  error.hidden = false;
  error.textContent = 'The 3D scene could not start. Enable browser hardware acceleration and reload the page. Your browser needs WebGL2.';
  controls.forEach(control => { if (control !== retryCharacter) control.disabled = true; });
  console.error('Scene initialization failed:', cause);
}
}
void initialize();
const dispose = (): void => { uiEvents.abort(); panelProfiles?.dispose(); solarControls?.dispose(); controlPanel.dispose(); viewer?.dispose(); };
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { signal: uiEvents.signal });
if (import.meta.hot) import.meta.hot.dispose(dispose);
