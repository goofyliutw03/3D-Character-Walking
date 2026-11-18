import type { MovementIntent } from '../character/motion';

export type MoveDirection = 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';
const gameKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space']);
const directions: Record<MoveDirection, readonly [number, number]> = {
  forward: [0, -1], backward: [0, 1], left: [-1, 0], right: [1, 0],
  up: [0, 0], down: [0, 0],
};

export class InputManager {
  private readonly events = new AbortController();
  private readonly keys = new Set<string>();
  private readonly pointers = new Map<number, MoveDirection>();
  private latch: MoveDirection | undefined;
  private runToggle = false;
  private jumpPending = false;
  private flightControls = false;
  setFlightControls(enabled: boolean): void { this.stop(); this.flightControls = enabled; }
  constructor(win: Window = window, doc: Document = document, private readonly onManual: () => void = () => {}, private readonly onStop: () => void = () => {}) {
    const signal = this.events.signal;
    win.addEventListener('keydown', event => {
      if (!(gameKeys.has(event.code) || this.flightControls && ['KeyE','KeyQ'].includes(event.code)) || event.isComposing || this.editing(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (event.repeat) return;
      this.onManual();
      if (event.code === 'Space' && !this.keys.has('Space')) this.jumpPending = true;
      this.keys.add(event.code);
    }, { signal });
    win.addEventListener('keyup', event => { this.keys.delete(event.code); }, { signal });
    win.addEventListener('blur', () => this.stop(), { signal });
    doc.addEventListener('focusin', event => {
      if (this.editing(event.target, 'input, textarea, select, [contenteditable]:not([contenteditable="false"])')) this.stop();
    }, { signal });
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) this.stop(); }, { signal });
  }
  private editing(target: EventTarget | null, selector = 'input, textarea, select, button, [contenteditable]:not([contenteditable="false"])'): boolean {
    return !!target && 'closest' in target && typeof target.closest === 'function'
      && !!target.closest(selector);
  }
  bindDirection(button: HTMLButtonElement, direction: MoveDirection): void {
    const signal = this.events.signal;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      this.onManual();
      this.latch = undefined;
      this.pointers.set(event.pointerId, direction);
      button.setPointerCapture(event.pointerId);
    }, { signal });
    const release = (event: PointerEvent): void => { this.pointers.delete(event.pointerId); };
    button.addEventListener('pointerup', release, { signal });
    button.addEventListener('pointercancel', release, { signal });
    button.addEventListener('lostpointercapture', release, { signal });
    button.addEventListener('click', event => {
      if (event.detail === 0) { this.onManual(); this.latch = this.latch === direction ? undefined : direction; }
    }, { signal });
  }
  sample(): MovementIntent {
    let x = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    let z = Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp'));
    const active = new Set(this.pointers.values());
    if (this.latch) active.add(this.latch);
    for (const direction of active) {
      x += directions[direction][0]; z += directions[direction][1];
    }
    const jump = this.jumpPending;
    this.jumpPending = false;
    const vertical = Number(this.keys.has('KeyE') || this.keys.has('Space') || active.has('up')) - Number(this.keys.has('KeyQ') || active.has('down'));
    return { x: Math.sign(x), z: Math.sign(z), run: this.running, jump, ...(this.flightControls ? { vertical } : {}) };
  }
  get running(): boolean { return this.runToggle || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
  setRun(enabled: boolean): void { this.onManual(); this.runToggle = enabled; }
  jump(): void { this.onManual(); this.jumpPending = true; }
  stop(): void {
    this.onManual();
    this.onStop();
    this.keys.clear(); this.pointers.clear(); this.latch = undefined;
    this.runToggle = false; this.jumpPending = false;
  }
  dispose(): void { this.stop(); this.events.abort(); }
}
