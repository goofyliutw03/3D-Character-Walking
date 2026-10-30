import type { ScreenPoint } from '../camera/AnchorProjection';

interface Candidate extends ScreenPoint { id: number; time: number }
export class TapGesture {
  private readonly events = new AbortController();
  private readonly pointers = new Set<number>();
  private candidate: Candidate | undefined;
  constructor(canvas: HTMLElement, onTap: (point: ScreenPoint) => void, win: Window = window) {
    const options = { signal: this.events.signal, capture: true };
    const inside = (p: ScreenPoint): boolean => {
      const rect = canvas.getBoundingClientRect();
      return p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom;
    };
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      this.pointers.add(event.pointerId);
      if (this.pointers.size !== 1 || !inside({ x: event.clientX, y: event.clientY })) this.candidate = undefined;
      else this.candidate = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
    }, options);
    canvas.addEventListener('pointermove', event => {
      const c = this.candidate;
      if (c && event.pointerId === c.id && (Math.hypot(event.clientX - c.x, event.clientY - c.y) > 8
        || !inside({ x: event.clientX, y: event.clientY }))) this.candidate = undefined;
    }, options);
    canvas.addEventListener('pointerleave', () => { this.candidate = undefined; }, options);
    canvas.addEventListener('pointerup', event => {
      const c = this.candidate;
      this.candidate = undefined;
      const single = this.pointers.size === 1;
      this.pointers.delete(event.pointerId);
      const point = { x: event.clientX, y: event.clientY };
      if (c && single && event.pointerId === c.id && event.button === 0 && event.timeStamp - c.time <= 350
        && Math.hypot(point.x - c.x, point.y - c.y) <= 8 && inside(point)) onTap(point);
    }, options);
    for (const type of ['pointercancel', 'lostpointercapture'] as const) {
      canvas.addEventListener(type, event => { this.candidate = undefined; this.pointers.delete(event.pointerId); }, options);
    }
    for (const type of ['blur', 'resize'] as const) win.addEventListener(type, () => this.cancel(), options);
    canvas.ownerDocument.addEventListener('visibilitychange', () => { if (canvas.ownerDocument.hidden) this.cancel(); }, options);
  }
  /** Suppress this tap while retaining held fingers for multi-touch rejection. */
  cancelCandidate(): void { this.candidate = undefined; }
  cancel(): void { this.cancelCandidate(); this.pointers.clear(); }
  dispose(): void { this.cancel(); this.events.abort(); }
}
