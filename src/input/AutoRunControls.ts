type ExternalView = 'third-person' | 'fisheye';
export interface LookSensitivity { thirdHorizontal: number; thirdVertical: number; firstHorizontal: number; firstVertical: number }
const radians = Math.PI / 180;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/** Movement ownership and desired camera offsets, independent of rendered collision zoom. */
export class AutoRunControls {
  private sensitivity: LookSensitivity = { thirdHorizontal: 1, thirdVertical: 1, firstHorizontal: 1, firstVertical: 1 };
  get lookSensitivity(): LookSensitivity { return { ...this.sensitivity }; }
  configureSensitivity(patch: Partial<LookSensitivity>): boolean {
    const next = { ...this.sensitivity, ...patch };
    if (!Object.values(next).every(value => Number.isFinite(value) && value >= .1 && value <= 5)) return false;
    this.sensitivity = next; this.resetGestures(); return true;
  }
  enabled = false;
  paused = false;
  heading = 0;
  yaw = 0;
  pitch = 0;
  zoom = 1;
  private entry: { view: ExternalView; resume: boolean } | undefined;
  private exitScroll = 0;
  private gesture: { time: number; ctrl: boolean; pixels: number } | undefined;
  get running(): boolean { return this.enabled && !this.paused && !this.entry; }
  get inspecting(): boolean { return this.entry !== undefined; }
  get active(): boolean { return this.enabled || this.inspecting; }
  resetGestures(): void { this.gesture = undefined; this.exitScroll = 0; }
  clear(): void {
    this.entry = undefined;
    this.stop();
    this.resetGestures();
    this.reset();
  }
  setEnabled(enabled: boolean, heading: number): void {
    this.enabled = enabled;
    this.paused = false;
    this.heading = heading;
    if (this.entry) this.entry.resume = enabled;
    this.gesture = undefined;
  }
  stop(): void {
    this.enabled = false;
    this.paused = false;
    if (this.entry) this.entry.resume = false;
    this.gesture = undefined;
  }
  suspend(): void {
    this.paused = true;
    if (this.entry) this.entry.resume = false;
    this.gesture = undefined;
  }
  resetLook(): void { this.yaw = 0; this.pitch = 0; this.gesture = undefined; }
  reset(): void { this.resetLook(); this.zoom = 1; }
  reverse(): void { this.heading += Math.PI; this.reset(); }
  move(dx: number, dy: number, width: number, ctrl: boolean, time: number, view = 'third-person', locked = false): void {
    if (![dx, dy, width, time].every(Number.isFinite) || width <= 0) return;
    const sensitivity = Math.PI / Math.max(1, width / 2);
    const horizontal = sensitivity * (view === 'first-person' ? this.sensitivity.firstHorizontal : this.sensitivity.thirdHorizontal);
    const vertical = sensitivity * (view === 'first-person' ? this.sensitivity.firstVertical : this.sensitivity.thirdVertical);
    if (this.inspecting || ctrl) this.yaw -= dx * horizontal;
    else if (locked) this.heading -= dx * horizontal;
    else {
      if (!this.gesture || time - this.gesture.time > 200 || this.gesture.ctrl !== ctrl) {
        this.gesture = { time, ctrl, pixels: 0 };
      }
      const limit = width / 2 / (view === 'first-person' ? this.sensitivity.firstHorizontal : this.sensitivity.thirdHorizontal);
      const next = clamp(this.gesture.pixels + dx, -limit, limit);
      // +Z is heading zero, therefore right turn decreases heading.
      this.heading -= (next - this.gesture.pixels) * horizontal;
      this.gesture.pixels = next;
    }
    if (this.gesture && this.gesture.ctrl !== ctrl) this.gesture = undefined;
    this.gesture ??= { time, ctrl, pixels: 0 };
    this.gesture.time = time;
    this.pitch = clamp(this.pitch - dy * vertical, -70 * radians, 60 * radians);
    if (this.inspecting) this.yaw = clamp(this.yaw, -80 * radians, 80 * radians);
  }
  wheel(delta: number, view: string): 'enter' | ExternalView | undefined {
    if (!Number.isFinite(delta) || delta === 0) return;
    if (this.entry && view === 'first-person') {
      this.exitScroll = delta > 0 ? this.exitScroll + delta : 0;
      if (this.exitScroll < 120) return;
      const entry = this.entry;
      this.entry = undefined;
      if (this.enabled) this.paused = !entry.resume;
      this.reset();
      return entry.view;
    }
    if (view !== 'third-person' && view !== 'fisheye') return;
    if (delta < 0 && this.zoom <= .25) {
      this.entry = { view, resume: this.running };
      this.exitScroll = 0;
      this.reset();
      return 'enter';
    }
    this.zoom = clamp(this.zoom * Math.exp(delta * .0015), .25, 4);
  }
  select(view: string): void {
    if (this.entry && view !== 'first-person') {
      if (this.enabled) this.paused = !this.entry.resume;
      this.entry = undefined;
    }
    if (view !== 'first-person' || !this.entry) this.reset();
  }
}
