export interface LightSettings {
  enabled: boolean;
  intensity: number;
  color: string;
  effects: boolean;
}
export interface EnvironmentLight {
  readonly id: string;
  readonly label: string;
  readonly kind: 'torch' | 'crystal' | 'sun' | 'ambient';
  readonly maxIntensity: number;
  getSettings(): LightSettings;
  configure(patch: Partial<LightSettings>): boolean;
}

/** A source owns its settings. Animation and solar updates only read them. */
export function environmentLight(
  id: string, label: string, kind: EnvironmentLight['kind'], maxIntensity: number,
  initial: LightSettings, apply: (settings: Readonly<LightSettings>) => void,
): EnvironmentLight {
  let settings = { ...initial };
  apply(settings);
  return {
    id, label, kind, maxIntensity,
    getSettings: () => ({ ...settings }),
    configure(patch) {
      const next = { ...settings, ...patch };
      if (typeof next.enabled !== 'boolean' || typeof next.effects !== 'boolean'
        || !Number.isFinite(next.intensity) || next.intensity < 0 || next.intensity > maxIntensity
        || typeof next.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(next.color)) return false;
      settings = next;
      apply(settings);
      return true;
    },
  };
}
