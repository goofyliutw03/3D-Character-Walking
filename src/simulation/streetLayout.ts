import type { WalkableBounds } from '../character/motion';

/** Agent-center surfaces, inset .3m from outer edges. Crosswalk joins both sidewalks. */
export const pedestrianSurfaces: readonly WalkableBounds[] = Object.freeze([
  Object.freeze({minX:-8,maxX:-4.8,minZ:-26.2,maxZ:26.2}),
  Object.freeze({minX:4.8,maxX:8,minZ:-26.2,maxZ:26.2}),
  Object.freeze({minX:-4.8,maxX:4.8,minZ:-1.25,maxZ:1.25}),
]);
export const trafficLayout = Object.freeze({ sidewalk:4.8, laneX:2.2, stopZ:4, endZ:25, carLength:3.2, headway:4.5 });
