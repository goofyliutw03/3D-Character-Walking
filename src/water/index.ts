/** Public water API. Host owns rendering, lighting, timing and mesh attachment. */
export const WATER_API_VERSION = 1;
export { WaterShaderModule } from './WaterShaderModule.ts';
export type { WaterQuality, WaterSettings } from './WaterShaderModule.ts';
export { WaterFeature } from './WaterFeature.ts';
export { createSpraySource } from './SpraySource.ts';
export type { SpraySource } from './SpraySource.ts';
export { WetLensEffect } from './WetLensEffect.ts';
export type { LensSettings, LensSnapshot } from './WetLensState.ts';
