import { PanelProfiles, profileControlsContent } from './ui/PanelProfiles';
import { defaultSwimAppearance, swimPoseLabels, validSwimAppearance } from './character/SwimAppearance';
import type { ViewerApp, CameraPreset, CharacterStatus } from './engine/ViewerApp';
import type { CharacterVariant } from './character/motion';
import type { MoveDirection } from './input/InputManager';
import type { EnvironmentId } from './scene/SceneSwitch';
import type { TimeOfDay } from './scene/CityScene';
import { emotions, speechLimit, type Emotion } from './expression/ExpressionManager';
import { presentLoading, type LoadingState } from './ui/LoadingFeedback';
import { SpeechEditor } from './ui/SpeechEditor';
import { LoadingPanel } from './ui/LoadingPanel';
import type { ObstructionMode } from './camera/CameraObstruction';
import { controlPanelContent } from './ui/controlPanelContent';
import { ControlPanel } from './ui/ControlPanel';
import { mouseSensitivity } from './settings/MouseSensitivity';
import './style.css';

const sceneNames: Record<EnvironmentId, string> = {
  city: 'Maple Avenue', cave: 'Cave', terrain: 'Natural terrain', flight: 'Flight field', room: '莊園豪宅', swim: 'Tidal Pool',
};

let panelProfiles: PanelProfiles | undefined;

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

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Application root was not found.');
app.innerHTML = `
  <header>
    <a class="brand" href="/" aria-label="Walk Studio home"><span class="brand-mark">W</span> WALK<span class="brand-light">STUDIO</span></a>
    <div class="project-name" id="project-name">Maple Avenue</div>
    <span class="version">CHARACTER STUDY <b>06</b></span>
  </header>
  <main>
    <aside class="control-panel" aria-label="Function panel">
      <div class="panel-toolbar">
        <button id="panel-toggle" data-panel-layout type="button" aria-expanded="true" aria-controls="control-panel-content" aria-label="Collapse function panel" title="Expand or collapse function panel"><span class="panel-toggle-icon" aria-hidden="true">☰</span><span class="panel-toggle-label">Function panel</span><span class="panel-toggle-chevron" aria-hidden="true">‹</span></button>
      </div>
      <div id="control-panel-content" class="panel-content">
        ${profileControlsContent}
        <button id="scan-environment" type="button">Scan environment</button>
        <h1 class="panel-title">Your workspace</h1>
        <p class="panel-help">Expand a category to explore.<span class="panel-resize-copy"> Drag the right edge to resize.</span></p>
        <label class="select-label" for="environment">Scene</label>
        <select id="environment">${Object.entries(sceneNames).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</select>
        <p class="hint" id="environment-status" role="status"></p>
        <label for="walk-speed">Walk speed · m/s</label>
        <input id="walk-speed" type="number" min="0.5" max="4" step="0.1" value="1.8">
        <label for="mouse-sensitivity">Mouse sensitivity</label>
        <div>
          <input id="mouse-sensitivity" type="range" min="${mouseSensitivity.min}" max="${mouseSensitivity.max}" step="${mouseSensitivity.step}" value="${mouseSensitivity.defaultValue}">
          <output id="mouse-sensitivity-value" for="mouse-sensitivity">${mouseSensitivity.defaultValue.toFixed(1)}×</output>
        </div>
        <div id="swim-controls" hidden>
          <label for="swim-pose">Swim stroke</label>
          <select id="swim-pose">${Object.entries(swimPoseLabels).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select>
          <label for="swim-outfit">Swim outfit</label>
          <select id="swim-outfit"><option value="swimwear">Swimwear</option><option value="scuba">Scuba</option></select>
        </div>
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
        <button id="run" aria-pressed="false">Run</button><button id="jump">Jump</button><button id="stop">Stop</button>
        <div id="flight-controls" hidden>
          <button data-direction="ascend" type="button">Ascend</button>
          <button data-direction="descend" type="button">Descend</button>
          <button id="flight-mode" type="button">Land</button>
        </div>
        <button id="swim-exit" type="button" hidden>Climb out</button>
        <span id="swim-status" role="status" hidden></span>
        <button id="fire-particle" type="button">Fire particle</button><button id="reset-target" type="button">Reset target</button>
      </div>
      <div class="movement-copy">
        <p id="navigation-status" role="status" aria-live="polite" aria-atomic="true">Tap the ground to run there.</p>
        <p id="movement-help" class="movement-help">Hold arrows to move · Stop cancels · Drag to orbit / pinch to zoom</p>
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
  const swim = viewer?.getSwimStatus();
  const key = `${state.variant}/${state.action}/${state.running}/${state.following}/${state.cameraView}/${state.navigation}/${state.obstructionMode}/${state.flightMode}/${state.flightWarning}/${swim?.mode}/${swim?.atWaterline}/${swim?.canLeave}/${swim?.autoForward}`;
  if (key === previousCharacterStatus) return;
  previousCharacterStatus = key;
  const names = { man: 'Man', woman: 'Woman', child: 'Child' };
  const actions = { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump' };
  document.querySelector('#character-status')!.textContent = `${names[state.variant]} · ${actions[state.action]}`;
  document.querySelector('#run')!.setAttribute('aria-pressed', String(state.running));
  const navigationMessages = {
    idle: 'Tap the ground to run there.', running: 'Running to destination…',
    arrived: 'Destination reached.', blocked: 'Cannot reach that spot. Tap clear ground.',
  };
  const navigationStatus = document.querySelector('#navigation-status')!;
  const navigationMessage = state.flightMode === 'flight'
    ? state.flightWarning ? `Approaching ${state.flightWarning === 'flight-range' ? 'flight boundary' : 'restricted airspace'}.` : 'Flying'
    : state.flightMode === 'ground' ? 'On the ground' : navigationMessages[state.navigation];
  if (navigationStatus.textContent !== navigationMessage) navigationStatus.textContent = navigationMessage;
  const flightMode = document.querySelector<HTMLButtonElement>('#flight-mode')!;
  flightMode.textContent = state.flightMode === 'ground' ? 'Take off' : 'Land';
  flightMode.dataset.mode = state.flightMode ?? '';
  for (const button of document.querySelectorAll<HTMLButtonElement>('#flight-controls [data-direction]')) {
    button.disabled = !swim && state.flightMode !== 'flight';
  }
  document.querySelector<HTMLButtonElement>('#jump')!.hidden = state.flightMode === 'flight' || !!swim && swim.mode !== 'ground';
  const swimExit = document.querySelector<HTMLButtonElement>('#swim-exit')!;
  swimExit.hidden = !swim;
  swimExit.disabled = !swim?.canLeave;
  const swimStatus = document.querySelector<HTMLElement>('#swim-status')!;
  swimStatus.hidden = !swim;
  swimStatus.textContent = !swim ? '' : swim.mode === 'swim' ? (swim.atWaterline ? 'At the surface' : 'Underwater') :
    swim.mode === 'climb' ? 'Climbing out' : swim.mode === 'bottom' ? 'On the pool floor' : 'On the platform';
  if (swim?.autoForward) swimStatus.textContent += ' · Auto-forward on';
  document.querySelector<HTMLInputElement>('#follow')!.checked = state.following;
  document.querySelector<HTMLInputElement>('#follow')!.disabled = state.firstPerson;
  document.querySelector<HTMLSelectElement>('#obstruction-mode')!.value = state.obstructionMode;
  document.querySelector('#obstruction-hint')!.textContent = state.firstPerson && state.obstructionMode !== 'wireframe'
    ? 'First person keeps your eye position. This mode resumes when you return to an external view.'
    : obstructionHints[state.obstructionMode];
  document.querySelector('#camera-mode')!.textContent = state.cameraView === 'fisheye' ? '160° FISHEYE' : cameraNames[state.cameraView].toUpperCase();
  document.querySelector('.viewport')!.classList.toggle('fisheye-view', state.cameraView === 'fisheye');
  document.querySelector('#camera-hint')!.textContent = state.firstPerson
    ? 'Eye-level view stays attached to your character.'
    : state.following ? 'Following your character. Turn off to pause this view.' : 'Tracking paused. Drag to orbit, scroll to zoom.';
  const staticView = ['overview', 'street', 'overhead'].includes(state.cameraView);
  document.querySelector('#interaction-guide')!.innerHTML = state.flightMode === 'flight'
    ? '<span><b>WASD / arrows</b> fly</span><span><b>Space / C</b> ascend / descend</span><span><b>Shift</b> boost</span>'
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
  });
  viewer.mountObjectInspector(document.querySelector<HTMLElement>('#scene-object-inspector')!);
  controls.forEach(control => { control.disabled = false; });
  const syncWater = (): void => {
    if (!viewer) return;
    const state = viewer.getWaterSettings();
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
  document.querySelector<HTMLSelectElement>('#character')!.addEventListener('change', event => viewer?.setCharacter((event.target as HTMLSelectElement).value as CharacterVariant), { signal: uiEvents.signal });
  document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => viewer?.bindDirection(button, button.dataset.direction as MoveDirection));
  document.querySelector('#run')!.addEventListener('click', () => viewer?.setRunning(!viewer.getCharacterStatus().running), { signal: uiEvents.signal });
  const sceneSelect = document.querySelector<HTMLSelectElement>('#environment')!;
  const sceneStatus = document.querySelector('#environment-status')!;
  let selection = 0;
  let environmentOperation = Promise.resolve();
  const swimPose = document.querySelector<HTMLSelectElement>('#swim-pose')!;
  const swimOutfit = document.querySelector<HTMLSelectElement>('#swim-outfit')!;
  const syncEnvironment = (): void => {
    const active = viewer!.environmentId;
    sceneSelect.value = active;
    document.querySelector<HTMLSelectElement>('#lighting')!.value = viewer!.getTimeOfDay();
    document.querySelector('.scene-title h2')!.textContent = sceneNames[active];
    document.querySelector('#project-name')!.textContent = sceneNames[active];
    viewport.dataset.environment = active;
    for (const selector of ['.scene-title .eyebrow', '.scene-title p']) {
      document.querySelector<HTMLElement>(selector)!.hidden = active !== 'city';
    }
    document.querySelector<HTMLElement>('#function-water-feature')!.hidden = active !== 'city' && active !== 'swim';
    document.querySelector<HTMLElement>('#flight-controls')!.hidden = active !== 'flight' && active !== 'swim';
    document.querySelector<HTMLElement>('#flight-mode')!.hidden = active !== 'flight';
    document.querySelector<HTMLElement>('#swim-controls')!.hidden = active !== 'swim';
    document.querySelector('#movement-help')!.textContent = active === 'swim'
      ? 'Walk off the platform to enter · Space / C change depth · I / O spiral · In first or third person, Y toggles auto-forward and the mouse steers · Surface at the edge to climb out'
      : active === 'flight' ? 'Hold arrows to move · Stop cancels · Land within 2 m of a surface'
      : 'Hold arrows to move · Stop cancels · Drag to orbit / pinch to zoom';
    updateCharacterStatus(viewer!.getCharacterStatus());
  };
  sceneSelect.addEventListener('change', () => {
    const version = ++selection;
    const id = sceneSelect.value as EnvironmentId;
    sceneStatus.textContent = `Loading ${sceneNames[id]}…`;
    environmentOperation = viewer!.selectEnvironment(id).catch(() => false).then(accepted => {
      if (version !== selection) return;
      syncEnvironment();
      sceneStatus.textContent = accepted ? '' : `Could not load ${sceneNames[id]}. ${sceneNames[viewer!.environmentId]} is still active.`;
      panelProfiles?.changed();
    });
  }, { signal: uiEvents.signal });
  for (const control of [swimPose, swimOutfit]) control.addEventListener('change', () => {
    const appearance = { pose: swimPose.value, outfit: swimOutfit.value };
    if (validSwimAppearance(appearance)) viewer?.setSwimAppearance(appearance);
  }, { signal: uiEvents.signal });
  document.querySelector('#swim-exit')!.addEventListener('click', () => viewer?.leaveWater(), { signal: uiEvents.signal });
  document.querySelector('#scan-environment')!.addEventListener('click', () => viewer?.scanEnvironment(), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#walk-speed')!.addEventListener('change', event => {
    const field = event.currentTarget as HTMLInputElement;
    if (field.validity.valid) viewer?.setWalkSpeed(field.valueAsNumber);
  }, { signal: uiEvents.signal });
  const mouseSensitivityField = document.querySelector<HTMLInputElement>('#mouse-sensitivity')!;
  const mouseSensitivityValue = document.querySelector<HTMLOutputElement>('#mouse-sensitivity-value')!;
  const showMouseSensitivity = () => {
    const value = mouseSensitivityField.valueAsNumber;
    mouseSensitivityValue.value = `${value.toFixed(1)}×`;
    mouseSensitivityField.setAttribute('aria-valuetext', `${value.toFixed(1)} times`);
  };
  showMouseSensitivity();
  mouseSensitivityField.addEventListener('input', () => {
    showMouseSensitivity();
    viewer?.setMouseSensitivity(mouseSensitivityField.valueAsNumber);
  }, { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#projectile-aim')!.addEventListener('change', event => {
    viewer?.setProjectileAim((event.currentTarget as HTMLSelectElement).value === 'camera' ? 'camera' : 'target');
  }, { signal: uiEvents.signal });
  syncEnvironment();
  const flightMode = document.querySelector<HTMLButtonElement>('#flight-mode')!;
  flightMode.addEventListener('click', () => {
    const landing = flightMode.dataset.mode === 'flight';
    const accepted = viewer!.setFlightMode(landing ? 'ground' : 'flight');
    sceneStatus.textContent = accepted ? '' : landing ? 'Move within 2 m of a clear landing surface.' : 'Takeoff needs more clearance.';
  }, { signal: uiEvents.signal });
  document.querySelector('#jump')!.addEventListener('click', () => viewer?.jump(), { signal: uiEvents.signal });
  document.querySelector('#stop')!.addEventListener('click', () => viewer?.stop(), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#follow')!.addEventListener('change', event => viewer?.setFollowing((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#obstruction-mode')!.addEventListener('change', event => viewer?.setObstructionMode((event.target as HTMLSelectElement).value as ObstructionMode), { signal: uiEvents.signal });
  const cameraButtons = document.querySelectorAll<HTMLButtonElement>('[data-camera]');
  const selectCamera = (preset: CameraPreset): void => {
    viewer?.setCamera(preset);
  };
  cameraButtons.forEach(button => button.addEventListener('click', () => selectCamera(button.dataset.camera as CameraPreset), { signal: uiEvents.signal }));
  document.querySelector('#reset')!.addEventListener('click', () => selectCamera('overview'), { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#lighting')!.addEventListener('change', event => viewer?.setTimeOfDay((event.target as HTMLSelectElement).value as TimeOfDay), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#shadows')!.addEventListener('change', event => viewer?.setShadows((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
  panelProfiles = new PanelProfiles(document.querySelector<HTMLElement>('.control-panel')!, viewer, controlPanel, settings => {
    document.querySelector<HTMLSelectElement>('#character')!.value = settings.variant;
    document.querySelector<HTMLSelectElement>('#lighting')!.value = settings.scenes[settings.environment]!.time;
    document.querySelector<HTMLInputElement>('#shadows')!.checked = settings.shadows;
    const { pose, outfit } = settings.swimAppearance ?? defaultSwimAppearance;
    document.querySelector<HTMLInputElement>('#walk-speed')!.value = String(settings.walkSpeed);
    mouseSensitivityField.value = String(settings.mouseSensitivity ?? mouseSensitivity.defaultValue);
    showMouseSensitivity();
    document.querySelector<HTMLSelectElement>('#projectile-aim')!.value = settings.projectileAim ?? 'target';
    swimPose.value = pose;
    swimOutfit.value = outfit;
    document.querySelector<HTMLInputElement>('#water-lens')!.checked = settings.waterLens;
    document.querySelector<HTMLInputElement>('#water-enabled')!.checked = settings.water.enabled;
    document.querySelector<HTMLInputElement>('#water-paused')!.checked = settings.water.paused;
    document.querySelector<HTMLSelectElement>('#water-quality')!.value = settings.water.quality;
    document.querySelector<HTMLInputElement>('#water-wave')!.value = String(settings.water.waveStrength);
    document.querySelector<HTMLInputElement>('#water-flow')!.value = String(settings.water.flowSpeed);
    syncEnvironment();
    syncExpression(false);
    syncWater();
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
const dispose = (): void => { uiEvents.abort(); panelProfiles?.dispose(); controlPanel.dispose(); viewer?.dispose(); };
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { signal: uiEvents.signal });
if (import.meta.hot) import.meta.hot.dispose(dispose);
