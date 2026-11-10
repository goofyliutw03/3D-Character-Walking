import { validHeadlamp } from '../scene/HeadlampSettings.ts';
import { validSolar } from '../scene/SolarPosition.ts';
import type { ViewerSettings } from './ViewerSettings';
import { SceneObjectIndex } from '../inspector/SceneObjectIndex.ts';
const range = (v: number, min: number, max: number): boolean => Number.isFinite(v) && v >= min && v <= max;
const color = (v: string): boolean => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const bool = (...values: unknown[]): boolean => values.every(v => typeof v === 'boolean');
export function validViewerSettings(value: unknown): value is ViewerSettings {
  if (!value || typeof value !== 'object') return false;
  const s = value as ViewerSettings;
  try {
    if (!['city','cave','terrain'].includes(s.environment) || !['man','woman','child'].includes(s.variant) ||
      !['overview','street','overhead','first-person','third-person','front','character-overhead','low-angle','fisheye'].includes(s.camera) ||
      !['zoom','transparent','wireframe','xray'].includes(s.obstruction) ||
      !bool(s.following,s.groundPenetration,s.waterLens,s.shadows) || !range(s.walkSpeed,.5,4) ||
      !['thirdHorizontal','thirdVertical','firstHorizontal','firstVertical'].every(k => range(s.sensitivity[k as keyof typeof s.sensitivity],.1,5)) ||
      !['none','happy','sad','angry','surprised'].includes(s.expression.emotion) || typeof s.expression.speech !== 'string' || Array.from(s.expression.speech).length > 160) return false;
    const t=s.traffic, p=s.particles, w=s.water;
    if (!bool(t.enabled,t.paused,t.lod) || !Number.isInteger(t.npcCount) || !range(t.npcCount,0,24) || !Number.isInteger(t.vehicleCount) || !range(t.vehicleCount,0,8) ||
      !color(p.color) || !color(p.lightColor) || !bool(p.lightEnabled) || !range(p.speed,.5,30) || !range(p.size,.03,.5) || !range(p.lifetime,.1,10) || !Number.isInteger(p.maxCount) || !range(p.maxCount,1,128) || !range(p.lightIntensity,0,200) || !range(p.lightRadius,.1,30) || !range(p.lightDecay,0,4) ||
      !bool(w.enabled,w.paused) || !['low','standard'].includes(w.quality) || !range(w.waveStrength,0,2) || !range(w.flowSpeed,0,3) ||
      !bool(s.lampDetection.enabled) || !range(s.lampDetection.radius,1,30) || !Array.isArray(s.lamps) || s.lamps.length>6 || !s.lamps.every(n=>Number.isInteger(n)&&range(n,1,6))) return false;
    if (!s.scenes || typeof s.scenes !== 'object' || !s.scenes[s.environment] || Object.entries(s.scenes).some(([id,scene]) => {
      if (!['city','cave','terrain'].includes(id) || !scene || !['day','evening','night'].includes(scene.time) || !validSolar(scene.solar) || !Array.isArray(scene.lights)) return true;
      if (id === 'terrain') return scene.headlamp !== null || scene.lights.length !== 0 || !scene.terrain ||
        !['standard','low'].includes(scene.terrain.quality) || typeof scene.terrain.wind !== 'boolean';
      if (id === 'city') return scene.lights.length !== 0 || scene.headlamp !== null;
      return !scene.headlamp || !validHeadlamp(scene.headlamp) || scene.lights.length !== 32 || new Set(scene.lights.map(l=>l.id)).size!==32 || scene.lights.some(l =>
        !/^(sun|ambient|torch-(?:[1-9]|10)|crystal-(?:[1-9]|1[0-9]|20))$/.test(l.id) ||
        !bool(l.settings.enabled,l.settings.effects) || !color(l.settings.color) || !range(l.settings.intensity,0,['sun','ambient'].includes(l.id)?2:3));
    })) return false;
    const i = s.inspector;
    if (typeof i.pattern !== 'string' || typeof i.ranges !== 'string' || new SceneObjectIndex().configure(i.pattern,i.ranges)) return false;
    return bool(i.enabled) && typeof i.pattern==='string' && i.pattern.length<=160 && typeof i.ranges==='string' && i.ranges.length<=512 && Array.isArray(i.uncheckedPaths) && i.uncheckedPaths.length<=20000 && i.uncheckedPaths.every(path=>typeof path==='string'&&path.length<=4000) && !!i.expandedPaths && typeof i.expandedPaths==='object' && Object.entries(i.expandedPaths).every(([k,v])=>k.length<=4000&&typeof v==='boolean');
  } catch { return false; }
}
