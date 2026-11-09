import type { MotionSnapshot } from '../character/motion';
import type { CityAssetState } from '../scene/CityBuildings';

export const characterEditorContent = `
<output id="character-position" class="hint">X 0.00 · Y 0.08 · Z 5.00 · 0.00 m/s</output>
<label class="select-label" for="walk-speed">Manual walk speed · m/s</label>
<input id="walk-speed" type="range" min="0.5" max="4" step="0.1" value="1.8" aria-describedby="walk-speed-value position-help">
<output id="walk-speed-value" for="walk-speed">1.8 m/s</output>
<div class="particle-settings">
${(['x','y','z'] as const).map(axis=>`<label for="position-${axis}">${axis.toUpperCase()} · m<input id="position-${axis}" type="number" step="any" value="${axis==='z'?5:axis==='y'?.075:0}"></label>`).join('')}
</div>
<label class="toggle-row" for="position-snap"><span>Snap Y to ground</span><input id="position-snap" type="checkbox" checked></label>
<div class="object-filter-actions"><button id="position-read" type="button">Read current XYZ</button><button id="position-apply" type="button">Apply XYZ</button></div>
<p id="position-result" class="hint" role="status" aria-live="polite">Position drafts apply only when you choose Apply XYZ.</p>
<p id="position-help" class="hint">Meters, Y up. Snap uses the destination ground. Turn off Snap to place up to 10 m above ground and fall naturally. Obstacles and out-of-bounds coordinates are rejected. Editing stops movement. Shift / Run stays 4 m/s; tour and tap speed keep their own settings.</p>`;

export function showEditorState(root: ParentNode, motion: Pick<MotionSnapshot,'x'|'y'|'z'|'speed'>, speed: number, buildings: CityAssetState): void {
  const text = `X ${motion.x.toFixed(2)} · Y ${motion.y.toFixed(2)} · Z ${motion.z.toFixed(2)} · ${motion.speed.toFixed(2)} m/s`;
  const position = root.querySelector('#character-position')!;
  if (position.textContent !== text) position.textContent = text;
  root.querySelector('#walk-speed-value')!.textContent = `${speed.toFixed(1)} m/s`;
  const status = root.querySelector('#building-status')!;
  if (status.textContent !== buildings.message) status.textContent = buildings.message;
  root.querySelector<HTMLButtonElement>('#retry-buildings')!.hidden = buildings.phase !== 'error';
}

interface EditorAPI {
  getCharacterStatus(): {motion: Readonly<MotionSnapshot>};
  applyPosition(position: {x:number;y:number;z:number}, snap: boolean): boolean;
  setWalkSpeed(speed: number): boolean;
  retryBuildings(): void;
}
export function bindCharacterEditor(root: ParentNode, api: EditorAPI, signal: AbortSignal): void {
  const field = (axis: string): HTMLInputElement => root.querySelector<HTMLInputElement>(`#position-${axis}`)!;
  const snap = root.querySelector<HTMLInputElement>('#position-snap')!;
  const result = root.querySelector('#position-result')!;
  root.querySelector('#position-read')!.addEventListener('click', () => {
    const p = api.getCharacterStatus().motion;
    for (const axis of ['x','y','z'] as const) field(axis).value = String(p[axis]);
    result.textContent = 'Current XYZ copied. Edit, then Apply XYZ.';
  }, {signal});
  root.querySelector('#position-apply')!.addEventListener('click', () => {
    const accepted = api.applyPosition({x:field('x').valueAsNumber,y:field('y').valueAsNumber,z:field('z').valueAsNumber},snap.checked);
    result.textContent = accepted ? 'Position applied. Movement and navigation stopped.'
      : 'Position rejected. Use finite XYZ on clear ground within the street; Y must be ground to ground + 10 m. The scene must be active.';
  }, {signal});
  const speed = root.querySelector<HTMLInputElement>('#walk-speed')!;
  speed.addEventListener('input', () => {
    result.textContent = api.setWalkSpeed(speed.valueAsNumber) ? 'Manual walk speed updated.' : 'Speed rejected. Use 0.5–4 m/s.';
  }, {signal});
  root.querySelector('#retry-buildings')!.addEventListener('click', () => api.retryBuildings(), {signal});
}
