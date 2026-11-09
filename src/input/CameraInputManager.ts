import type { CameraInputMode } from '../camera/CameraModeManager';

interface Actions {
  mode(): CameraInputMode;
  clearGesture(): void;
  wheelEnabled(): boolean;
  reverseEnabled(): boolean;
  move(dx: number, dy: number, ctrl: boolean, time: number): void;
  wheel(delta: number): void;
  reverse(): void;
  reset(): void;
  suspend(): void;
  toggle(): void;
}

export class CameraInputManager {
  private previous: { x: number; y: number; ctrl: boolean } | undefined;
  private resetTouch = (): void => {};
  private localReset = false;
  reset(): void { this.previous = undefined; if (!this.localReset) this.resetTouch(); }
  private readonly events = new AbortController();
  constructor(canvas: HTMLElement, actions: Actions) {
    const options = { capture: true, signal: this.events.signal };
    const focused = (): boolean => canvas.ownerDocument.activeElement === canvas && !canvas.ownerDocument.hidden;
    const fingers = new Map<number, { x: number; y: number }>();
    let blocked = false;
    let intent: 'orbit' | 'zoom' | undefined;
    let pair: Array<{ x: number; y: number }> = [];
    const moved = new Set<number>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clearGesture = (): void => {
      this.localReset = true;
      try { actions.clearGesture(); } finally { this.localReset = false; }
    };
    let owned = false;
    let cancelling = false;
    const clearTouch = (): void => {
      if (cancelling) return;
      if (timer !== undefined) clearTimeout(timer);
      const captured = [...fingers.keys()];
      timer = undefined; fingers.clear(); moved.clear(); pair = []; blocked = false; owned = false; intent = undefined;
      for (const id of captured) {
        if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
      }
    };
    this.resetTouch = clearTouch;
    canvas.addEventListener('blur', clearTouch, options);
    canvas.ownerDocument.addEventListener('visibilitychange', () => { if (canvas.ownerDocument.hidden) clearTouch(); }, options);
    const flushPair = (time: number): void => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      if (fingers.size !== 2 || pair.length !== 2 || blocked) return;
      const after = [...fingers.values()];
      const distance = (points: typeof pair): number => Math.hypot(points[1]!.x - points[0]!.x, points[1]!.y - points[0]!.y);
      const zoom = distance(after) - distance(pair);
      const dx = (after[0]!.x + after[1]!.x - pair[0]!.x - pair[1]!.x) / 2;
      const dy = (after[0]!.y + after[1]!.y - pair[0]!.y - pair[1]!.y) / 2;
      if (!intent && Math.max(Math.abs(zoom), Math.hypot(dx, dy)) <= 2) return;
      intent ??= Math.abs(zoom) > Math.hypot(dx, dy) * 1.4 ? 'zoom' : 'orbit';
      pair = after; moved.clear();
      if (intent === 'zoom' && actions.wheelEnabled()) actions.wheel(-zoom * 6);
      else if (intent === 'orbit') actions.move(dx, dy, true, time);
    };
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || (actions.mode() === 'standard' && !actions.wheelEnabled())) return;
      if (!owned && fingers.size === 1) {
        // Retire the single-finger Orbit/Tap sequence before taking multi-touch ownership.
        cancelling = true;
        for (const id of fingers.keys()) canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId: id, pointerType: 'touch', bubbles: true }));
        cancelling = false;
        owned = true;
      }
      if (actions.mode() !== 'standard') owned = true;
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!owned) return;
      event.preventDefault(); event.stopImmediatePropagation();
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      intent = undefined;
      pair = [...fingers.values()];
      moved.clear();
      blocked = fingers.size > 2;
      clearGesture();
    }, options);
    canvas.addEventListener('pointermove', event => {
      const old = fingers.get(event.pointerId);
      if (!old) return;
      if (!owned) { fingers.set(event.pointerId, { x: event.clientX, y: event.clientY }); return; }
      event.preventDefault(); event.stopImmediatePropagation();
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (blocked) return;
      if (fingers.size === 1) {
        if (actions.mode() !== 'standard') actions.move(event.clientX - old.x, event.clientY - old.y, false, event.timeStamp);
      } else {
        moved.add(event.pointerId);
        if (moved.size >= 2) flushPair(event.timeStamp);
        else if (timer === undefined) timer = setTimeout(() => flushPair(event.timeStamp), 32);
      }
    }, options);
    const release = (event: PointerEvent): void => {
      if (cancelling) return;
      if (!fingers.has(event.pointerId)) return;
      if (owned) { event.preventDefault(); event.stopImmediatePropagation(); }
      fingers.delete(event.pointerId);
      intent = undefined;
      pair = [...fingers.values()];
      moved.clear();
      clearGesture();
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      if (!fingers.size) { blocked = false; owned = false; }
    };
    canvas.addEventListener('pointerup', release, options);
    canvas.addEventListener('pointercancel', clearTouch, options);
    canvas.addEventListener('lostpointercapture', release, options);
    window.addEventListener('blur', clearTouch, options);
    canvas.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      if (!focused() || actions.mode() === 'standard') { this.previous = undefined; return; }
      event.stopImmediatePropagation();
      const current = { x: event.clientX, y: event.clientY, ctrl: event.ctrlKey };
      if (this.previous && this.previous.ctrl === current.ctrl) {
        actions.move(current.x - this.previous.x, current.y - this.previous.y, current.ctrl, event.timeStamp);
      }
      this.previous = current;
    }, options);
    canvas.addEventListener('pointerleave', () => actions.clearGesture(), options);
    canvas.addEventListener('pointercancel', () => actions.clearGesture(), options);
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || (actions.mode() === 'standard' && !(event.button === 1 && actions.reverseEnabled()))) return;
      canvas.focus({ preventScroll: true });
      event.preventDefault();
      event.stopImmediatePropagation();
      clearGesture();
      if (event.button === 1) actions.reverse();
    }, options);
    canvas.addEventListener('wheel', event => {
      if (!actions.wheelEnabled()) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      canvas.focus({ preventScroll: true });
      event.preventDefault();
      event.stopImmediatePropagation();
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
      actions.wheel(Math.max(-240, Math.min(240, event.deltaY * scale)));
    }, { ...options, passive: false });
    canvas.addEventListener('keydown', event => {
      if (canvas.ownerDocument.activeElement !== canvas) return;
      if (event.code === 'KeyY' && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey && !event.isComposing) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) actions.toggle();
        return;
      }
      if (event.code !== 'F1' || event.isComposing || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey || actions.mode() === 'standard') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) actions.reset();
    }, options);
    // Read Ctrl from each pointer event after resetting the old gesture baseline.
    for (const type of ['keydown', 'keyup'] as const) window.addEventListener(type, event => {
      if (event.code === 'ControlLeft' || event.code === 'ControlRight') actions.clearGesture();
    }, options);
    canvas.addEventListener('blur', () => actions.clearGesture(), options);
    window.addEventListener('blur', event => {
      if (event.target !== window) return;
      this.previous = undefined;
      actions.suspend();
    }, options);
    canvas.ownerDocument.addEventListener('visibilitychange', () => {
      if (canvas.ownerDocument.hidden) { this.previous = undefined; actions.suspend(); }
    }, options);
  }
  dispose(): void { this.reset(); this.events.abort(); }
}
