export interface ProfileBlock<T> { name: string; createdAt: number; settings: T }
export interface ProfileData<T> { version: 1; temp: ProfileBlock<T> | null; profiles: ProfileBlock<T>[]; next: Record<string, number> }
const clone = <T>(value: T): T => structuredClone(value);
export function parseProfiles<T>(text: string, valid: (value: unknown) => value is T): ProfileData<T> {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object') throw Error('Invalid profile JSON');
  const data = value as ProfileData<unknown>;
  const block = (b: ProfileBlock<unknown>): boolean => !!b && typeof b.name === 'string' && b.name.length <= 100 && Number.isSafeInteger(b.createdAt) && b.createdAt >= 0 && valid(b.settings);
  if (data.version !== 1 || !Array.isArray(data.profiles) || data.profiles.length > 10 ||
      !data.profiles.every(b => block(b) && /^(city|cave|terrain)\d{2}$/.test(b.name)) ||
      new Set(data.profiles.map(b => b.name)).size !== data.profiles.length ||
      (data.temp !== null && (!block(data.temp) || data.temp.name !== 'temp')) ||
      !data.next || typeof data.next !== 'object' || Array.isArray(data.next) ||
      Object.entries(data.next).some(([key, n]) => !['city', 'cave', 'terrain'].includes(key) || !Number.isInteger(n) || n < 0 || n > 99)) throw Error('Unsupported or damaged profile JSON');
  return clone(data) as ProfileData<T>;
}

/** Pure history rules. Storage success is deliberately owned by the caller. */
export class ProfileHistory<T> {
  data: ProfileData<T>;
  selected = 'temp';
  private baseline: string | undefined;
  constructor(data?: ProfileData<T>) { this.data = clone(data ?? { version: 1, temp: null, profiles: [], next: {} }); }
  private time(now = Date.now()): number { return Math.max(now, ...this.data.profiles.map(p => p.createdAt + 1), (this.data.temp?.createdAt ?? -1) + 1); }
  change(settings: T): void {
    if (this.baseline === JSON.stringify(settings)) return;
    this.data.temp = { name: 'temp', createdAt: this.time(), settings: clone(settings) };
    this.selected = 'temp'; this.baseline = undefined;
  }
  select(name: string, current: T): T {
    // Capture the destination before writing temp, including a selection of temp itself.
    const target = name === 'temp' ? this.data.temp : this.data.profiles.find(p => p.name === name);
    if (!target) throw Error('Profile no longer exists');
    const settings = clone(target.settings);
    if (this.selected === 'temp' || this.baseline !== JSON.stringify(current)) this.change(current);
    this.selected = name; this.baseline = name === 'temp' ? undefined : JSON.stringify(settings);
    return settings;
  }
  save(scene: 'city' | 'cave' | 'terrain', settings: T, now = Date.now()): string {
    const sequence = this.data.next[scene] ?? 0;
    const name = scene + String(sequence).padStart(2, '0');
    this.data.next[scene] = (sequence + 1) % 100;
    this.data.profiles = this.data.profiles.filter(p => p.name !== name);
    this.data.profiles.push({ name, createdAt: this.time(now), settings: clone(settings) });
    this.data.profiles.sort((a, b) => a.createdAt - b.createdAt);
    this.data.profiles = this.data.profiles.slice(-10);
    this.selected = name; this.baseline = JSON.stringify(settings);
    return name;
  }
  reset(settings: T): void { this.baseline = undefined; this.selected = 'temp'; this.change(settings); }
  loaded(name: string, settings: T): void { this.selected=name; this.baseline=name==='temp'?undefined:JSON.stringify(settings); }
}
