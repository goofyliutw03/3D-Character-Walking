import type { EnvironmentLight, LightSettings } from '../scene/EnvironmentLights';

interface LightRow extends LightSettings {
  id: string; label: string; kind: EnvironmentLight['kind']; maxIntensity: number;
}
interface LightApp {
  getEnvironmentLights(): LightRow[];
  configureEnvironmentLight(id: string, patch: Partial<LightSettings>): boolean;
}
export const environmentLightsContent = '<div id="environment-lights" hidden inert></div>';

export function bindEnvironmentLights(host: HTMLElement, app: LightApp, signal: AbortSignal): () => void {
  function sync(): void {
    const lights = app.getEnvironmentLights();
    host.hidden = host.inert = lights.length === 0;
    host.replaceChildren();
    if (!lights.length) return;
    const heading = document.createElement('h3');
    heading.textContent = 'Enclosed space lights';
    host.append(heading);
    for (const enabled of [true, false]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = enabled ? 'All on' : 'All off';
      button.addEventListener('click', () => {
        for (const light of app.getEnvironmentLights()) app.configureEnvironmentLight(light.id, { enabled });
        sync();
      });
      host.append(button);
    }
    for (const kind of ['sun', 'ambient', 'torch', 'crystal'] as const) {
      const group = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = { sun: 'Skylight', ambient: 'Ambient', torch: 'Torches', crystal: 'Crystals' }[kind];
      group.append(summary);
      for (const light of lights.filter(item => item.kind === kind)) {
        const row = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = light.label;
        row.append(legend);
        for (const key of ['enabled', 'intensity', 'color', 'effects'] as const) {
          if (key === 'effects' && kind === 'ambient') continue;
          const label = document.createElement('label');
          label.className = 'toggle-row';
          const caption = document.createElement('span');
          caption.textContent = { enabled: 'Light', intensity: 'Intensity ×', color: 'Color', effects: 'Effects' }[key];
          const input = document.createElement('input');
          input.type = key === 'intensity' ? 'range' : key === 'color' ? 'color' : 'checkbox';
          input.name = key;
          input.dataset.lightId = light.id;
          input.setAttribute('aria-label', light.label + ' ' + caption.textContent);
          if (key === 'intensity') {
            input.min = '0'; input.max = String(light.maxIntensity); input.step = '.05';
          }
          if (typeof light[key] === 'boolean') input.checked = light[key];
          else input.value = String(light[key]);
          const output = document.createElement('output');
          if (key === 'intensity') output.value = String(light.intensity);
          input.addEventListener('input', () => {
            const value = input.type === 'checkbox' ? input.checked : key === 'intensity' ? input.valueAsNumber : input.value;
            app.configureEnvironmentLight(light.id, { [key]: value });
            const current = app.getEnvironmentLights().find(item => item.id === light.id)!;
            if (key === 'intensity') { input.value = String(current.intensity); output.value = input.value; }
          });
          label.append(caption, input);
          if (key === 'intensity') label.append(output);
          row.append(label);
        }
        group.append(row);
      }
      host.append(group);
    }
  }
  signal.addEventListener('abort', () => host.replaceChildren(), { once: true });
  sync();
  return sync;
}
