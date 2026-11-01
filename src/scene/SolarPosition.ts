export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export interface SolarSettings { enabled: boolean; hour: number; season: Season; latitude: number }
const radians = Math.PI / 180;
const declinations: Record<Season, number> = { spring: 0, summer: 23.44, autumn: 0, winter: -23.44 };
export function validSolar(settings: SolarSettings): boolean {
  return typeof settings.enabled === 'boolean' && Number.isFinite(settings.hour) && settings.hour >= 0 && settings.hour < 24 &&
    Number.isFinite(settings.latitude) && Math.abs(settings.latitude) <= 90 && Object.hasOwn(declinations, settings.season);
}
/** Representative equinox/solstice in apparent solar time; north=-Z, east=+X. */
export function solarPosition(hour: number, season: Season, latitude: number): { x: number; y: number; z: number; elevation: number } {
  const h = (hour - 12) * 15 * radians, d = declinations[season] * radians, p = latitude * radians;
  const x = -Math.cos(d) * Math.sin(h);
  const y = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(h);
  const north = Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(h);
  return { x, y, z: -north, elevation: Math.asin(Math.max(-1, Math.min(1, y))) / radians };
}
export function dialHour(x: number, y: number): number { return ((Math.atan2(x, -y) / (2 * Math.PI) * 24) + 24) % 24; }
export function cameraHeading(x: number, z: number, previous: number): number {
  return Math.hypot(x, z) < .001 ? previous : (Math.atan2(x, -z) / radians + 360) % 360;
}
