/** Distinguish a single-pointer hold/drag from the existing short ground tap. */
export class MouseOrbitGesture {
  private readonly events = new AbortController();
  private readonly pointers = new Set<number>();
  private candidate: { id: number; x: number; y: number; elapsed: number; active: boolean } | undefined;
  constructor(canvas: HTMLElement, private readonly begin: () => void, private readonly end: (cancelled: boolean) => void, win: Window = window) {
    const options = { capture: true, signal: this.events.signal };
    canvas.addEventListener('pointerdown', event => {
      this.pointers.add(event.pointerId);
      if (this.pointers.size !== 1 || !['mouse', 'touch'].includes(event.pointerType) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) { this.clearCandidate(true); return; }
      this.candidate = { id: event.pointerId, x: event.clientX, y: event.clientY, elapsed: 0, active: false };
    }, options);
    canvas.addEventListener('pointermove', event => {
      const c = this.candidate;
      if (!c || event.pointerId !== c.id) return;
      if (!(event.buttons & 1) || event.ctrlKey || event.metaKey || event.shiftKey) { this.cancel(); return; }
      if (Math.hypot(event.clientX - c.x, event.clientY - c.y) > 8) this.activate();
    }, options);
    win.addEventListener('pointerup', event => {
      this.pointers.delete(event.pointerId);
      if (event.pointerId === this.candidate?.id) this.clearCandidate(false);
    }, options);
    for (const type of ['pointercancel', 'lostpointercapture'] as const) canvas.addEventListener(type, event => {
      // Normal pointerup precedes implicit capture loss. Ignore already released pointers.
      if (!this.pointers.delete(event.pointerId)) return;
      this.clearCandidate(true);
    }, options);
    // Suppress the canvas long-press menu without swallowing OrbitControls input.
    canvas.addEventListener('contextmenu', event => event.preventDefault(), { signal: this.events.signal });
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
  private clearCandidate(cancelled: boolean): void {
    if (this.candidate?.active) this.end(cancelled);
    this.candidate = undefined;
  }
  cancel(): void { this.clearCandidate(true); this.pointers.clear(); }
  dispose(): void { this.cancel(); this.events.abort(); }
}
