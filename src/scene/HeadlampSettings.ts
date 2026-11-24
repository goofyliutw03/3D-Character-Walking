export const headlampRanges = {
  distance: { label: 'Range', min: 2, max: 18, step: .5, unit: ' m' },
  fov: { label: 'Beam FOV', min: 12, max: 85, step: 1, unit: '°' },
  intensity: { label: 'Intensity', min: 0, max: 240, step: 5, unit: ' cd' },
  softness: { label: 'Edge softness', min: 0, max: 1, step: .05, unit: '' },
  density: { label: 'Dust count', min: 0, max: 96, step: 1, unit: '' },
  speed: { label: 'Dust drift speed', min: .25, max: 2, step: .05, unit: '×' },
} as const;

export type HeadlampSetting = keyof typeof headlampRanges;
export type HeadlampSettings = Record<HeadlampSetting, number> & {
  enabled: boolean;
  dust: boolean;
  color: string;
};

export const headlampKeys = Object.keys(headlampRanges) as HeadlampSetting[];
export const defaultHeadlamp: Readonly<HeadlampSettings> = {
  enabled: true, dust: true, color: '#fff0cf',
  distance: 10, fov: 48, intensity: 85, softness: .55, density: 36, speed: .7,
};

export function validHeadlamp(settings: HeadlampSettings): boolean {
  return typeof settings.enabled === 'boolean' && typeof settings.dust === 'boolean'
    && typeof settings.color === 'string' && /^#[0-9a-f]{6}$/i.test(settings.color)
    && Number.isInteger(settings.density)
    && headlampKeys.every(key => {
      const { min, max } = headlampRanges[key];
      return Number.isFinite(settings[key]) && settings[key] >= min && settings[key] <= max;
    });
}
