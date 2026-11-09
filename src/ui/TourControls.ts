import type { TourSnapshot } from '../navigation/PathTour';
export const tourControlsContent = `
<label class="select-label" for="tour-route">Waypoints · X, Z in meters</label>
<textarea id="tour-route" rows="4" aria-describedby="tour-help">0, 5
0, -18
6.4, -15
-6.4, 16</textarea>
<label class="toggle-row" for="tour-loop"><span>Loop route</span><input id="tour-loop" type="checkbox" checked></label>
<label class="select-label" for="tour-speed">Tour speed · m/s</label>
<input id="tour-speed" type="number" min="0.5" max="4" step="0.1" value="1.8">
<div class="object-filter-actions"><button id="tour-start" type="button">Start route</button><button id="tour-pause" type="button">Pause</button><button id="tour-resume" type="button">Resume</button><button id="tour-stop" type="button">Stop tour</button></div>
<p id="tour-status" class="hint" role="status" aria-live="polite">Tour off.</p>
<p id="tour-help" class="hint">One X, Z pair per line, up to 32. Start replaces the current route. Pause keeps your next waypoint. Movement, tapping the ground, editing, leaving the window or Stop cancels the tour. Change settings then Start again. Routes stay on this page only.</p>`;
export function showTourStatus(root: ParentNode, state: TourSnapshot): void {
  const labels = {idle:'Tour off',running:'Tour moving',paused:'Tour paused',completed:'Tour completed',blocked:'Tour blocked · check coordinates and clear ground'};
  const text = `${labels[state.status]}${state.count ? ` · Waypoint ${state.index+1}/${state.count} · ${state.speed.toFixed(1)} m/s` : ''}.`;
  const status = root.querySelector('#tour-status')!;
  if (status.textContent !== text) status.textContent = text;
  root.querySelector<HTMLButtonElement>('#tour-pause')!.disabled = state.status !== 'running';
  root.querySelector<HTMLButtonElement>('#tour-resume')!.disabled = state.status !== 'paused';
}
