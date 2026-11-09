import { headlampKeys, headlampRanges, type HeadlampSettings } from '../scene/HeadlampSettings.ts';

export const headlampControlsContent = `<fieldset id="headlamp-controls" hidden inert>
  <legend>Character headlamp</legend>
  <label class="toggle-row"><span>Headlamp</span><input name="enabled" type="checkbox"></label>
  <label class="toggle-row"><span>Light color</span><input name="color" type="color"></label>
  <label class="toggle-row"><span>Beam dust</span><input name="dust" type="checkbox"></label>
  ${headlampKeys.map(key => {
    const { label, min, max, step } = headlampRanges[key];
    return `<label class="select-label" for="headlamp-${key}">${label} · <output for="headlamp-${key}"></output></label>
      <input id="headlamp-${key}" name="${key}" type="range" min="${min}" max="${max}" step="${step}">`;
  }).join('')}
</fieldset>`;

interface HeadlampApp {
  getHeadlampSettings(): HeadlampSettings | undefined;
  configureHeadlamp(patch: Partial<HeadlampSettings>): boolean;
}

export function bindHeadlampControls(host: HTMLFieldSetElement, app: HeadlampApp, signal: AbortSignal): () => void {
  const inputs = [...host.querySelectorAll('input')];
  const outputs = [...host.querySelectorAll('output')];
  function sync(): void {
    const settings = app.getHeadlampSettings();
    host.hidden = host.inert = !settings;
    if (!settings) return;
    for (const input of inputs) {
      const key = input.name as keyof HeadlampSettings;
      const value = settings[key];
      if (typeof value === 'boolean') input.checked = value;
      else input.value = String(value);
      input.disabled = key !== 'enabled' && (!settings.enabled || (!settings.dust && (key === 'density' || key === 'speed')));
    }
    for (const key of headlampKeys) {
      const output = outputs.find(item => item.htmlFor.contains(`headlamp-${key}`))!;
      output.value = `${settings[key]}${headlampRanges[key].unit}`;
    }
  }
  for (const input of inputs) {
    input.addEventListener('input', () => {
      const value = input.type === 'checkbox' ? input.checked : input.type === 'range' ? input.valueAsNumber : input.value;
      app.configureHeadlamp({ [input.name]: value });
      sync();
    }, { signal });
  }
  sync();
  return sync;
}
