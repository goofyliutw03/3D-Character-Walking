import { dialHour, type Season, type SolarSettings } from '../scene/SolarPosition.ts';

const ticks = Array.from({ length: 120 }, (_, index) => {
  const angle = index * Math.PI / 60, major = index % 5 === 0;
  const point = (radius: number): string => `${100 + Math.sin(angle) * radius},${100 - Math.cos(angle) * radius}`;
  return `<line x1="${point(major ? 77 : 82).split(',')[0]}" y1="${point(major ? 77 : 82).split(',')[1]}" x2="${point(88).split(',')[0]}" y2="${point(88).split(',')[1]}" class="${major ? 'solar-major' : 'solar-minor'}"/>`;
}).join('');
const hours = Array.from({ length: 24 }, (_, hour) => {
  const angle = hour * Math.PI / 12;
  return `<text x="${100 + Math.sin(angle) * 65}" y="${100 - Math.cos(angle) * 65}">${String(hour).padStart(2, '0')}</text>`;
}).join('');
export const solarControlsContent = `<details class="solar-controls"><summary>Solar Sport</summary>
  <label><input id="solar-enabled" type="checkbox"> Enable solar time</label>
  <div class="solar-instruments">
    <div><svg id="solar-dial" viewBox="0 0 200 200" role="slider" tabindex="0" aria-label="Solar time" aria-valuemin="0" aria-valuemax="1439" aria-valuenow="720" aria-valuetext="12:00" aria-disabled="true" aria-describedby="solar-help">
      <circle cx="100" cy="100" r="96" class="solar-face"/>${ticks}${hours}
      <g id="solar-hand"><path d="M100 29 L94 103 L106 103 Z"/><circle cx="100" cy="100" r="5"/></g>
    </svg><output id="solar-time-label">12:00</output></div>
    <div><div class="solar-compass" role="img" aria-label="Camera compass: north is world minus Z">
      <span class="solar-view-mark" aria-hidden="true">▼</span>
      <div id="solar-compass-card"><b class="north">N</b><b class="east">E</b><b class="south">S</b><b class="west">W</b><span class="solar-needle">↑</span></div>
    </div><output id="solar-heading" aria-live="off">View 0°</output></div>
  </div>
  <fieldset id="solar-fields" disabled><legend>Sun position</legend>
    <label for="solar-time">Solar time<input id="solar-time" type="time" step="60" value="12:00"></label>
    <label for="solar-season">Season<select id="solar-season"><option value="spring">Spring · equinox</option><option value="summer">Summer · solstice</option><option value="autumn">Autumn · equinox</option><option value="winter">Winter · solstice</option></select></label>
    <label for="solar-latitude">Latitude · °N<input id="solar-latitude" type="number" min="-90" max="90" step="0.1" value="25"></label>
  </fieldset>
  <output id="solar-elevation" aria-live="off">Sun elevation 65°</output>
  <p id="solar-help" class="hint">Scene solar time, not local clock time. Drag the hand; arrow keys ±12 min, Home 00:00, End 23:48. Each hour has 5 divisions. North = −Z, east = +X. Seasons use northern equinox/solstice dates; negative latitude shows the southern sky. Choose a lighting preset to exit solar mode.</p>
</details>`;
interface SolarApp {
  getSolarSettings(): SolarSettings;
  configureSolar(patch: Partial<SolarSettings>): boolean;
  setSolarReport(report: ((heading: number, elevation: number) => void) | null): void;
}
export class SolarControls {
  private readonly events = new AbortController();
  private pointer: number | null = null;
  private readonly dial: SVGSVGElement;
  private readonly enabled: HTMLInputElement;
  private readonly fields: HTMLFieldSetElement;
  private readonly time: HTMLInputElement;
  private readonly season: HTMLSelectElement;
  private readonly latitude: HTMLInputElement;
  private readonly hand: SVGGElement;
  private lastReport = '';
  private readonly app: SolarApp;
  private readonly changed: () => void;
  constructor(host: HTMLElement, app: SolarApp, changed: () => void) {
    this.app = app; this.changed = changed;
    const find = <T extends Element>(id: string): T => host.querySelector<T>(id)!;
    this.dial = find('#solar-dial'); this.enabled = find('#solar-enabled'); this.fields = find('#solar-fields');
    this.time = find('#solar-time'); this.season = find('#solar-season'); this.latitude = find('#solar-latitude'); this.hand = find('#solar-hand');
    const options = { signal: this.events.signal };
    this.enabled.addEventListener('change', () => this.apply({ enabled: this.enabled.checked }), options);
    this.time.addEventListener('input', () => {
      if (!this.time.value) return;
      const [hours, minutes] = this.time.value.split(':').map(Number);
      this.apply({ hour: hours! + minutes! / 60 });
    }, options);
    this.season.addEventListener('change', () => this.apply({ season: this.season.value as Season }), options);
    this.latitude.addEventListener('input', () => {
      if (this.latitude.value.trim() && this.latitude.validity.valid) this.apply({ latitude: this.latitude.valueAsNumber });
    }, options);
    this.latitude.addEventListener('change', () => {
      if (!this.latitude.value.trim() || !this.latitude.validity.valid) { this.sync(); return; }
      this.apply({ latitude: this.latitude.valueAsNumber });
    }, options);
    const move = (event: PointerEvent): void => {
      const box = this.dial.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2, y = event.clientY - box.top - box.height / 2;
      if (Math.hypot(x, y) < box.width * .08) return;
      this.apply({ hour: (Math.round(dialHour(x, y) * 60) % 1440) / 60 });
    };
    this.dial.addEventListener('pointerdown', event => {
      if (!this.enabled.checked || this.pointer !== null || !event.isPrimary || event.button !== 0) return;
      event.preventDefault(); this.pointer = event.pointerId; this.dial.setPointerCapture(event.pointerId); this.dial.focus(); move(event);
    }, options);
    this.dial.addEventListener('pointermove', event => { if (event.pointerId === this.pointer) move(event); }, options);
    const end = (event: PointerEvent): void => {
      if (event.pointerId !== this.pointer) return;
      this.pointer = null;
      if (this.dial.hasPointerCapture(event.pointerId)) this.dial.releasePointerCapture(event.pointerId);
    };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) this.dial.addEventListener(name, end, options);
    this.dial.addEventListener('keydown', event => {
      if (!this.enabled.checked) return;
      const delta = { ArrowRight: 12, ArrowUp: 12, ArrowLeft: -12, ArrowDown: -12 }[event.key];
      if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault(); event.stopPropagation();
      const minute = Math.round(this.app.getSolarSettings().hour * 60);
      this.apply({ hour: event.key === 'Home' ? 0 : event.key === 'End' ? 23.8 : ((minute + delta! + 1440) % 1440) / 60 });
    }, options);
    app.setSolarReport((heading, elevation) => {
      const report = `${Math.round(heading)},${elevation.toFixed(1)}`;
      if (report === this.lastReport) return;
      this.lastReport = report;
      find<HTMLElement>('#solar-compass-card').style.transform = `rotate(${-heading}deg)`;
      find<HTMLOutputElement>('#solar-heading').value = `View ${Math.round(heading) % 360}°`;
      find<HTMLOutputElement>('#solar-elevation').value = this.enabled.checked ? `Sun elevation ${elevation.toFixed(1)}°` : 'Solar mode off';
    });
    this.sync();
  }
  private apply(patch: Partial<SolarSettings>): void {
    this.app.configureSolar(patch); this.lastReport = ''; this.sync(); this.changed();
  }
  sync(): void {
    const state = this.app.getSolarSettings();
    this.enabled.checked = state.enabled; this.fields.disabled = !state.enabled;
    this.dial.setAttribute('aria-disabled', String(!state.enabled));
    const minute = Math.round(state.hour * 60) % 1440;
    const label = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    this.time.value = label; this.season.value = state.season; this.latitude.value = String(state.latitude);
    this.hand.setAttribute('transform', `rotate(${state.hour * 15} 100 100)`);
    this.dial.setAttribute('aria-valuenow', String(minute)); this.dial.setAttribute('aria-valuetext', label);
    this.dial.parentElement!.querySelector('output')!.value = label;
    this.lastReport = '';
    if (!state.enabled && this.pointer !== null) {
      if (this.dial.hasPointerCapture(this.pointer)) this.dial.releasePointerCapture(this.pointer);
      this.pointer = null;
    }
  }
  dispose(): void {
    this.events.abort(); this.app.setSolarReport(null);
    if (this.pointer !== null && this.dial.hasPointerCapture(this.pointer)) this.dial.releasePointerCapture(this.pointer);
    this.pointer = null;
  }
}
