import type { ViewerApp, CameraPreset, CharacterStatus } from './engine/ViewerApp';
import type { CharacterVariant } from './character/motion';
import type { MoveDirection } from './input/InputManager';
import { emotions, speechLimit, type Emotion } from './expression/ExpressionManager';
import { presentLoading, type LoadingState } from './ui/LoadingFeedback';
import { SpeechEditor } from './ui/SpeechEditor';
import { LoadingPanel } from './ui/LoadingPanel';
import './style.css';

const cameraNames: Record<CameraPreset, string> = {
  overview: 'Overview', street: 'Street level', overhead: 'From above',
  'first-person': 'First person', 'third-person': 'Third person', front: 'Front',
  'character-overhead': 'Character overhead', 'low-angle': 'Low angle', fisheye: 'Fisheye · 160°',
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Application root was not found.');
app.innerHTML = `
  <header>
    <a class="brand" href="/" aria-label="Walk Studio home"><span class="brand-mark">W</span> WALK<span class="brand-light">STUDIO</span></a>
    <div class="project-name">City street <span>/</span> Untitled scene</div>
    <span class="version">CHARACTER STUDY <b>06</b></span>
  </header>
  <main>
    <aside>
      <div class="panel-heading"><span class="eyebrow">YOUR WORKSPACE</span><span class="step">06 / 06</span></div>
      <h1>A little city.<br> A world of stories.</h1>
      <p class="intro">Choose a character. Take a walk.<br>Find a new point of view.</p>
      <section>
        <div class="section-heading"><h2>Character</h2><span class="tag" id="character-source">LOADING</span></div>
        <label class="select-label" for="character">Choose a character</label>
        <select id="character"><option value="man">Man</option><option value="woman">Woman</option><option value="child">Child</option></select>
        <p class="hint" id="character-asset-hint">Loading a local rigged character. Procedural preview is available.</p>
        <a class="asset-credits" href="/assets/characters/ATTRIBUTION.md" target="_blank" rel="noopener">Character sources & modifications ↗</a>
        <p id="character-status" class="character-status" role="status" aria-live="polite" aria-atomic="true">Man · Idle</p>
        <div class="direction-pad" role="group" aria-label="Movement directions">
          <button data-direction="forward" aria-label="Move forward">↑</button>
          <button data-direction="left" aria-label="Move left">←</button>
          <button data-direction="backward" aria-label="Move backward">↓</button>
          <button data-direction="right" aria-label="Move right">→</button>
        </div>
        <div class="action-controls" role="group" aria-label="Character actions">
          <button id="run" aria-pressed="false">Run</button><button id="jump">Jump</button><button id="stop">Stop</button>
        </div>
        <p class="hint movement-help">Hold arrows to move. Keyboard: click the scene, then WASD / arrows, Shift to run, Space to jump. Directions follow the street axes. Keyboard-activate a direction to keep moving; Stop ends it.</p>
      </section>
      <section aria-labelledby="expression-heading">
        <div class="section-heading"><h2 id="expression-heading">Expression</h2><span class="tag">SAY SOMETHING</span></div>
        <label class="select-label" for="emotion">Mood</label>
        <select id="emotion">${Object.entries(emotions).map(([value, mood]) => `<option value="${value}">${mood.icon ? `${mood.icon} ` : ''}${mood.label}</option>`).join('')}</select>
        <label class="select-label" for="speech">Your character’s words</label>
        <textarea id="speech" rows="3" aria-describedby="speech-help speech-count" placeholder="A thought for the neighborhood…"></textarea>
        <div class="speech-toolbar"><span id="speech-count">0 / ${speechLimit}</span><button id="clear-speech" type="button">Clear speech</button></div>
        <p id="speech-help" class="hint">Up to 160 characters. Text stays on this page only. Your character stops while you edit. Overlays are hidden in First person.</p>
        <p id="expression-status" class="expression-status" role="status" aria-live="polite" aria-atomic="true">Mood: None. No speech.</p>
      </section>
      <section>
        <div class="section-heading"><h2>Camera</h2><span class="tag" id="camera-mode">ORBIT</span></div>
        <label class="toggle-row follow-row" for="follow"><span>Follow character</span><input id="follow" type="checkbox"></label>
        <p class="hint" id="camera-hint">Choose a starting angle, then explore.</p>
        <div class="camera-options" role="group" aria-label="Camera views">
          <button data-camera="overview" aria-pressed="true"><span class="view-icon">◇</span><span>Overview<small>See the whole neighborhood</small></span><span class="selection-dot"></span></button>
          <button data-camera="street" aria-pressed="false"><span class="view-icon">↗</span><span>Street level<small>Step into the scene</small></span><span class="selection-dot"></span></button>
          <button data-camera="overhead" aria-pressed="false"><span class="view-icon">⊞</span><span>From above<small>A bird’s-eye perspective</small></span><span class="selection-dot"></span></button>
          <button data-camera="first-person" aria-pressed="false"><span class="view-icon">◎</span><span>First person<small>See through your character’s eyes</small></span><span class="selection-dot"></span></button>
          <button data-camera="third-person" aria-pressed="false"><span class="view-icon">◉</span><span>Third person<small>Follow behind your character</small></span><span class="selection-dot"></span></button>
          <button data-camera="front" aria-pressed="false"><span class="view-icon">◌</span><span>Front<small>Face your character</small></span><span class="selection-dot"></span></button>
          <button data-camera="character-overhead" aria-pressed="false"><span class="view-icon">⊙</span><span>Character overhead<small>Look straight down at your character</small></span><span class="selection-dot"></span></button>
          <button data-camera="low-angle" aria-pressed="false"><span class="view-icon">↟</span><span>Low angle<small>A view from near the ground</small></span><span class="selection-dot"></span></button>
          <button data-camera="fisheye" aria-pressed="false"><span class="view-icon">◍</span><span>Fisheye<small>160° circular wide view</small></span><span class="selection-dot"></span></button>
        </div>
      </section>
      <section>
        <div class="section-heading"><h2>Atmosphere</h2><span class="tiny-label">LOCAL SCENE</span></div>
        <label class="select-label" for="lighting">Time of day</label>
        <select id="lighting"><option value="day">☀ &nbsp; Soft daylight</option><option value="evening">◐ &nbsp; Golden hour</option></select>
        <label class="toggle-row" for="shadows"><span>Cast shadows</span><input id="shadows" type="checkbox" checked></label>
      </section>
      <div class="sidebar-bottom"><span class="status-dot"></span> Everything runs on your computer.</div>
    </aside>
    <section class="viewport" aria-label="City scene workspace" aria-busy="true">
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
  </main>
  <div class="asset-feedback"><div id="asset-status" class="asset-status" role="status" aria-live="polite" aria-atomic="true">Starting scene…</div></div>
  <footer><span><span class="status-dot"></span> <span id="renderer-status" role="status">Starting scene…</span></span><span id="camera-status">Camera: Overview</span><span><span id="fps">—</span> FPS <span class="footer-divider">/</span> <span id="scene-metrics">1 unit = 1 meter</span></span></footer>
`;
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
const controls = document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('button, input, select, textarea');
controls.forEach(control => { if (control !== retryCharacter) control.disabled = true; });
let viewer: ViewerApp | undefined;
let fatal = false;
retryCharacter.addEventListener('click', () => {
  if (fatal) window.location.reload();
  else viewer?.retryCharacter();
}, { signal: uiEvents.signal });
let previousCharacterStatus = '';
const updateCharacterStatus = (state: CharacterStatus): void => {
  const key = `${state.variant}/${state.action}/${state.running}/${state.following}/${state.cameraView}`;
  if (key === previousCharacterStatus) return;
  previousCharacterStatus = key;
  const names = { man: 'Man', woman: 'Woman', child: 'Child' };
  const actions = { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump' };
  document.querySelector('#character-status')!.textContent = `${names[state.variant]} · ${actions[state.action]}`;
  document.querySelector('#run')!.setAttribute('aria-pressed', String(state.running));
  document.querySelector<HTMLInputElement>('#follow')!.checked = state.following;
  document.querySelector<HTMLInputElement>('#follow')!.disabled = state.firstPerson;
  document.querySelector('#camera-mode')!.textContent = state.cameraView === 'fisheye' ? '160° FISHEYE' : cameraNames[state.cameraView].toUpperCase();
  document.querySelector('.viewport')!.classList.toggle('fisheye-view', state.cameraView === 'fisheye');
  document.querySelector('#camera-hint')!.textContent = state.firstPerson
    ? 'Eye-level view stays attached to your character.'
    : state.following ? 'Following your character. Turn off to pause this view.' : 'Tracking paused. Drag to orbit, scroll to zoom.';
  const staticView = ['overview', 'street', 'overhead'].includes(state.cameraView);
  document.querySelector('#interaction-guide')!.innerHTML = state.following && !staticView
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
  });
  controls.forEach(control => { control.disabled = false; });
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
  document.querySelector('#jump')!.addEventListener('click', () => viewer?.jump(), { signal: uiEvents.signal });
  document.querySelector('#stop')!.addEventListener('click', () => viewer?.stop(), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#follow')!.addEventListener('change', event => viewer?.setFollowing((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
  const cameraButtons = document.querySelectorAll<HTMLButtonElement>('[data-camera]');
  const selectCamera = (preset: CameraPreset): void => {
    viewer?.setCamera(preset);
  };
  cameraButtons.forEach(button => button.addEventListener('click', () => selectCamera(button.dataset.camera as CameraPreset), { signal: uiEvents.signal }));
  document.querySelector('#reset')!.addEventListener('click', () => selectCamera('overview'), { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#lighting')!.addEventListener('change', event => viewer?.setEvening((event.target as HTMLSelectElement).value === 'evening'), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#shadows')!.addEventListener('change', event => viewer?.setShadows((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
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
const dispose = (): void => { uiEvents.abort(); viewer?.dispose(); };
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { signal: uiEvents.signal });
if (import.meta.hot) import.meta.hot.dispose(dispose);
