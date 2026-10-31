import { emotions, speechLimit } from '../expression/ExpressionManager';
import { renderFunctionTree } from './FunctionTree';

export function controlPanelContent(obstructionHint: string): string {
  return renderFunctionTree([
    { id: 'character', label: 'Character', open: true, children: [
      { id: 'character-choice', label: 'Selection', open: true, content: `<span class="tag" id="character-source">LOADING</span><label class="select-label" for="character">Choose a character</label>
        <select id="character"><option value="man">Man</option><option value="woman">Woman</option><option value="child">Child</option></select>
        ` },
      { id: 'character-assets', label: 'Asset & action status', open: false, content: `<p class="hint" id="character-asset-hint">Loading a local rigged character. Procedural preview is available.</p>
        <a class="asset-credits" href="/assets/characters/ATTRIBUTION.md" target="_blank" rel="noopener">Character sources & modifications ↗</a>
        <p id="character-status" class="character-status" role="status" aria-live="polite" aria-atomic="true">Man · Idle</p>
        <p class="hint">Movement controls are below the scene. Keyboard: WASD / arrows, Shift to run, Space to jump. Directions follow the street axes. Keyboard-activate a direction to keep moving; Stop ends it.</p>` }
    ] },
    { id: 'expression', label: 'Expression', open: false, children: [
      { id: 'mood', label: 'Mood', open: true, content: `<label class="select-label" for="emotion">Mood</label>
        <select id="emotion">${Object.entries(emotions).map(([value, mood]) => `<option value="${value}">${mood.icon ? `${mood.icon} ` : ''}${mood.label}</option>`).join('')}</select>
        ` },
      { id: 'speech', label: 'Speech bubble', open: true, content: `<label class="select-label" for="speech">Your character’s words</label>
        <textarea id="speech" rows="3" aria-describedby="speech-help speech-count" placeholder="A thought for the neighborhood…"></textarea>
        <div class="speech-toolbar"><span id="speech-count">0 / ${speechLimit}</span><button id="clear-speech" type="button">Clear speech</button></div>
        <p id="speech-help" class="hint">Up to 160 characters. Text stays on this page only. Your character stops while you edit. Overlays are hidden in First person.</p>
        <p id="expression-status" class="expression-status" role="status" aria-live="polite" aria-atomic="true">Mood: None. No speech.</p>` }
    ] },
    { id: 'particles', label: 'Particle interaction', open: false, children: [
      { id: 'actors', label: 'Caster & Target', open: true, content: `<p class="hint">You control Caster. Target stands independently. Fire toward its current position; shots do not follow it.</p>
        <p id="target-status" role="status" aria-live="polite">Target · Loading · procedural preview</p>
        <button id="retry-target" type="button" hidden>Retry target</button>
        ` },
      { id: 'particle-appearance', label: 'Appearance', open: true, content: `<div class="particle-settings"><label for="particle-color">Color<input id="particle-color" type="color" value="#66ddff"></label><label for="particle-size">Size · m<input id="particle-size" type="number" min="0.03" max="0.5" step="0.01" value="0.14"></label></div>` },
      { id: 'particle-lighting', label: 'Light', open: true, content: `<div class="particle-settings">
        <label class="toggle-row" for="particle-light-enabled"><span>Light up surroundings</span><input id="particle-light-enabled" type="checkbox" checked></label>
        <label for="particle-light-color">Light color<input id="particle-light-color" type="color" value="#66ddff"></label>
        <label for="particle-light-intensity">Intensity · cd<input id="particle-light-intensity" type="number" min="0" max="200" step="1" value="20"></label>
        <label for="particle-light-radius">Light radius · m<input id="particle-light-radius" type="number" min="0.1" max="30" step="0.1" value="5"></label>
        <label for="particle-light-decay">Decay<input id="particle-light-decay" type="number" min="0" max="4" step="0.1" value="2"></label>
        </div><p class="hint">Up to 8 effects light their surroundings at once. Extra shots still appear; lighting resumes as slots become free. No light shadows.</p>` },
      { id: 'particle-motion', label: 'Motion & limits', open: true, content: `<div class="particle-settings"><label for="particle-speed">Speed · m/s<input id="particle-speed" type="number" min="0.5" max="30" step="0.5" value="8"></label><label for="particle-lifetime">Lifetime · s<input id="particle-lifetime" type="number" min="0.1" max="10" step="0.1" value="3"></label><label for="particle-limit">Effect limit<input id="particle-limit" type="number" min="1" max="128" step="1" value="32"></label></div>
        <button id="apply-particles" type="button">Apply settings</button>
        <p id="particle-settings-status" class="hint" role="status" aria-live="polite">Settings apply to new shots.</p>` }
    ] },
    { id: 'camera', label: 'Camera', open: false, children: [
      { id: 'camera-views', label: 'View presets', open: true, content: `<div class="camera-options" role="group" aria-label="Camera views">
          <button data-camera="overview" aria-pressed="true"><span class="view-icon">◇</span><span>Overview<small>See the whole neighborhood</small></span><span class="selection-dot"></span></button>
          <button data-camera="street" aria-pressed="false"><span class="view-icon">↗</span><span>Street level<small>Step into the scene</small></span><span class="selection-dot"></span></button>
          <button data-camera="overhead" aria-pressed="false"><span class="view-icon">⊞</span><span>From above<small>A bird’s-eye perspective</small></span><span class="selection-dot"></span></button>
          <button data-camera="first-person" aria-pressed="false"><span class="view-icon">◎</span><span>First person<small>See through your character’s eyes</small></span><span class="selection-dot"></span></button>
          <button data-camera="third-person" aria-pressed="false"><span class="view-icon">◉</span><span>Third person<small>Follow behind your character</small></span><span class="selection-dot"></span></button>
          <button data-camera="front" aria-pressed="false"><span class="view-icon">◌</span><span>Front<small>Face your character</small></span><span class="selection-dot"></span></button>
          <button data-camera="character-overhead" aria-pressed="false"><span class="view-icon">⊙</span><span>Character overhead<small>Look straight down at your character</small></span><span class="selection-dot"></span></button>
          <button data-camera="low-angle" aria-pressed="false"><span class="view-icon">↟</span><span>Low angle<small>A view from near the ground</small></span><span class="selection-dot"></span></button>
          <button data-camera="fisheye" aria-pressed="false"><span class="view-icon">◍</span><span>Fisheye<small>160° circular wide view</small></span><span class="selection-dot"></span></button>
        </div>` },
      { id: 'camera-follow', label: 'Follow', open: true, content: `<span class="tag" id="camera-mode">ORBIT</span><label class="toggle-row follow-row" for="follow"><span>Follow character</span><input id="follow" type="checkbox"></label>
        <p class="hint" id="camera-hint">Choose a starting angle, then explore.</p>
        ` },
      { id: 'camera-obstruction', label: 'Objects block mode', open: true, content: `<label class="select-label" for="obstruction-mode">Objects block mode</label>
        <select id="obstruction-mode" aria-describedby="obstruction-hint">
          <option value="zoom">1 · Auto zoom (default)</option>
          <option value="transparent">2 · Transparent blockers · 75%</option>
          <option value="wireframe">3 · Wireframe scene</option>
          <option value="xray">4 · X-ray character · 50%</option>
        </select>
        <p class="hint" id="obstruction-hint">${obstructionHint}</p>
        ` }
    ] },
    { id: 'scene', label: 'Scene display', open: false, children: [
      { id: 'scene-objects', label: 'Scene objects', open: false, content: '<div id="scene-object-inspector"></div>' },
      { id: 'atmosphere', label: 'Lighting & shadows', open: true, content: `<label class="select-label" for="lighting">Time of day</label>
        <select id="lighting"><option value="day">☀ &nbsp; Soft daylight</option><option value="evening">◐ &nbsp; Golden hour</option><option value="night">☾ &nbsp; Night</option></select>
        <label class="toggle-row" for="shadows"><span>Cast shadows</span><input id="shadows" type="checkbox" checked></label>` },
      { id: 'water-feature', label: 'Water feature', open: true, content: `
        <p class="hint">A small cascade at the far end of the street. Walk around the stone basin.</p>
        <label class="toggle-row" for="water-enabled"><span>Dynamic water</span><input id="water-enabled" type="checkbox" checked></label>
        <label class="toggle-row" for="water-paused"><span>Pause water animation</span><input id="water-paused" type="checkbox"></label>
        <label class="toggle-row" for="water-lens"><span>Camera mist & droplets</span><input id="water-lens" type="checkbox" checked></label>
        <p class="hint">Move the camera close to the cascade to catch a little spray. Droplets drain away when you leave.</p>
        <label class="select-label" for="water-quality">Water quality</label>
        <select id="water-quality"><option value="standard">Standard</option><option value="low">Low</option></select>
        <label class="select-label" for="water-wave">Wave strength · <output id="water-wave-value" for="water-wave">1.0</output></label>
        <input id="water-wave" type="range" min="0" max="2" step="0.1" value="1">
        <label class="select-label" for="water-flow">Flow speed · <output id="water-flow-value" for="water-flow">1.0</output></label>
        <input id="water-flow" type="range" min="0" max="3" step="0.1" value="1">
        <p class="hint" id="water-settings-status" role="status" aria-live="polite">Dynamic water · Standard quality.</p>
        <a class="asset-credits" href="./water.html" target="_blank" rel="noopener">Open water study ↗</a>` }
    ] }
  ]);
}
