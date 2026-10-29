/** Distinguish a mouse hold/drag from the existing short ground tap. */
export class MouseOrbitGesture {
  private readonly events = new AbortController();
  private candidate: { id: number; x: number; y: number; elapsed: number; active: boolean } | undefined;
  constructor(canvas: HTMLElement, private readonly begin: () => void, private readonly end: (cancelled: boolean) => void, win: Window = window) {
    const options = { capture: true, signal: this.events.signal };
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) { this.cancel(); return; }
      this.candidate = { id: event.pointerId, x: event.clientX, y: event.clientY, elapsed: 0, active: false };
    }, options);
    canvas.addEventListener('pointermove', event => {
      const c = this.candidate;
      if (!c || event.pointerId !== c.id) return;
      if (!(event.buttons & 1) || event.ctrlKey || event.metaKey || event.shiftKey) { this.cancel(); return; }
      if (Math.hypot(event.clientX - c.x, event.clientY - c.y) > 8) this.activate();
    }, options);
    win.addEventListener('pointerup', event => {
      if (event.pointerId !== this.candidate?.id) return;
      if (this.candidate.active) this.end(false);
      this.candidate = undefined;
    }, options);
    for (const type of ['pointercancel', 'lostpointercapture'] as const) canvas.addEventListener(type, () => this.cancel(), options);
    for (const type of ['blur', 'resize'] as const) win.addEventListener(type, () => this.cancel(), options);
    canvas.ownerDocument.addEventListener('visibilitychange', () => { if (canvas.ownerDocument.hidden) this.cancel(); }, options);
  }
  update(delta: number): void {
    if (!this.candidate) return;
    this.candidate.elapsed += Math.max(0, delta);
    if (this.candidate.elapsed > 0.35) this.activate();
  }
  private activate(): void {
    if (!this.candidate || this.candidate.active) return;
    this.candidate.active = true;
    this.begin();
  }
  cancel(): void {
    if (this.candidate?.active) this.end(true);
    this.candidate = undefined;
  }
  dispose(): void { this.cancel(); this.events.abort(); }
}
