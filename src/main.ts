import { ViewerApp, type CameraPreset, type CharacterStatus } from './engine/ViewerApp';
import type { CharacterVariant } from './character/motion';
import type { MoveDirection } from './input/InputManager';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Application root was not found.');
app.innerHTML = `
  <header>
    <a class="brand" href="/" aria-label="Walk Studio home"><span class="brand-mark">W</span> WALK<span class="brand-light">STUDIO</span></a>
    <div class="project-name">City street <span>/</span> Untitled scene</div>
    <span class="version">CHARACTER STUDY <b>03</b></span>
  </header>
  <main>
    <aside>
      <div class="panel-heading"><span class="eyebrow">YOUR WORKSPACE</span><span class="step">03 / 06</span></div>
      <h1>A little city.<br> A world of stories.</h1>
      <p class="intro">Choose a character. Take a walk.<br>Find a new point of view.</p>
      <section>
        <div class="section-heading"><h2>Character</h2><span class="tag">PROTOTYPE</span></div>
        <label class="select-label" for="character">Choose a character</label>
        <select id="character"><option value="man">Man</option><option value="woman">Woman</option><option value="child">Child</option></select>
        <p class="hint">Procedural prototype · final rigged characters come later.</p>
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
      <section>
        <div class="section-heading"><h2>Camera</h2><span class="tag" id="camera-mode">ORBIT</span></div>
        <label class="toggle-row follow-row" for="follow"><span>Follow character</span><input id="follow" type="checkbox"></label>
        <p class="hint">Choose a starting angle, then explore.</p>
        <div class="camera-options" role="group" aria-label="Camera views">
          <button data-camera="overview" aria-pressed="true"><span class="view-icon">◇</span><span>Overview<small>See the whole neighborhood</small></span><span class="selection-dot"></span></button>
          <button data-camera="street" aria-pressed="false"><span class="view-icon">↗</span><span>Street level<small>Step into the scene</small></span><span class="selection-dot"></span></button>
          <button data-camera="overhead" aria-pressed="false"><span class="view-icon">⊞</span><span>From above<small>A bird’s-eye perspective</small></span><span class="selection-dot"></span></button>
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
    <section class="viewport" aria-label="City scene workspace">
      <div id="scene"></div>
      <div class="scene-title"><span class="eyebrow">THE NEIGHBORHOOD</span><h2>Maple Avenue</h2><p>A quiet street. An open canvas.</p></div>
      <div class="scene-badge"><span class="status-dot"></span> LIVE SCENE</div>
      <div class="scene-bottom"><div class="interaction-guide"><span><b>Drag</b> orbit</span><span><b>Scroll</b> zoom</span><span><b>Right drag</b> pan</span></div><button id="reset" class="reset-button" aria-label="Reset camera">↺ <span>Reset view</span></button></div>
      <div id="scene-error" class="error-panel" role="alert" hidden></div>
    </section>
  </main>
  <footer><span><span class="status-dot"></span> <span id="renderer-status" role="status">Starting scene…</span></span><span id="camera-status">Camera: Overview</span><span><span id="fps">—</span> FPS <span class="footer-divider">/</span> 1 unit = 1 meter</span></footer>
`;
const scene = document.querySelector<HTMLElement>('#scene')!;
const status = document.querySelector<HTMLElement>('#renderer-status')!;
const fps = document.querySelector<HTMLElement>('#fps')!;
const error = document.querySelector<HTMLElement>('#scene-error')!;
const uiEvents = new AbortController();
let viewer: ViewerApp | undefined;
let previousCharacterStatus = '';
const updateCharacterStatus = (state: CharacterStatus): void => {
  const key = `${state.variant}/${state.action}/${state.running}/${state.following}`;
  if (key === previousCharacterStatus) return;
  previousCharacterStatus = key;
  const names = { man: 'Man', woman: 'Woman', child: 'Child' };
  const actions = { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump' };
  document.querySelector('#character-status')!.textContent = `${names[state.variant]} · ${actions[state.action]}`;
  document.querySelector('#run')!.setAttribute('aria-pressed', String(state.running));
  document.querySelector<HTMLInputElement>('#follow')!.checked = state.following;
  document.querySelector('#camera-mode')!.textContent = state.following ? 'FOLLOW' : 'ORBIT';
  if (state.following) {
    document.querySelector('#camera-status')!.textContent = 'Camera: Follow';
    document.querySelectorAll('[data-camera]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  } else if (document.querySelector('#camera-status')!.textContent === 'Camera: Follow') {
    document.querySelector('#camera-status')!.textContent = 'Camera: Free orbit';
  }
};
try {
  viewer = new ViewerApp(scene, message => { status.textContent = message; }, value => { fps.textContent = String(value); }, updateCharacterStatus);
  document.querySelector<HTMLSelectElement>('#character')!.addEventListener('change', event => viewer?.setCharacter((event.target as HTMLSelectElement).value as CharacterVariant), { signal: uiEvents.signal });
  document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => viewer?.bindDirection(button, button.dataset.direction as MoveDirection));
  document.querySelector('#run')!.addEventListener('click', () => viewer?.setRunning(!viewer.getCharacterStatus().running), { signal: uiEvents.signal });
  document.querySelector('#jump')!.addEventListener('click', () => viewer?.jump(), { signal: uiEvents.signal });
  document.querySelector('#stop')!.addEventListener('click', () => viewer?.stop(), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#follow')!.addEventListener('change', event => viewer?.setFollowing((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
  const cameraButtons = document.querySelectorAll<HTMLButtonElement>('[data-camera]');
  const selectCamera = (preset: CameraPreset): void => {
    viewer?.setCamera(preset);
    cameraButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.camera === preset)));
    document.querySelector('#camera-status')!.textContent = `Camera: ${{ overview: 'Overview', street: 'Street level', overhead: 'From above' }[preset]}`;
  };
  cameraButtons.forEach(button => button.addEventListener('click', () => selectCamera(button.dataset.camera as CameraPreset), { signal: uiEvents.signal }));
  document.querySelector('#reset')!.addEventListener('click', () => selectCamera('overview'), { signal: uiEvents.signal });
  document.querySelector<HTMLSelectElement>('#lighting')!.addEventListener('change', event => viewer?.setEvening((event.target as HTMLSelectElement).value === 'evening'), { signal: uiEvents.signal });
  document.querySelector<HTMLInputElement>('#shadows')!.addEventListener('change', event => viewer?.setShadows((event.target as HTMLInputElement).checked), { signal: uiEvents.signal });
} catch (cause) {
  status.textContent = 'Scene unavailable';
  error.hidden = false;
  error.textContent = 'The 3D scene could not start. Enable browser hardware acceleration and reload the page. Your browser needs WebGL2.';
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button, input, select').forEach(control => { control.disabled = true; });
  console.error('Scene initialization failed:', cause);
}
const dispose = (): void => { uiEvents.abort(); viewer?.dispose(); };
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { signal: uiEvents.signal });
if (import.meta.hot) import.meta.hot.dispose(dispose);
