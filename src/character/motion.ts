import { defaultCapsule, type WorldQuery } from '../world/WorldQuery.ts';

export type CharacterAction = 'idle' | 'walk' | 'run' | 'jump';
export type CharacterVariant = 'man' | 'woman' | 'child';
export const characterCapsules = Object.freeze({
  man: Object.freeze({ radius: .28, height: 1.8 }),
  woman: Object.freeze({ radius: .28, height: 1.68 }),
  child: Object.freeze({ radius: .28, height: 1.15 }),
});
export const characterRadius = defaultCapsule.radius;
export interface MovementIntent { x: number; z: number; run: boolean; jump: boolean }
export interface MotionSnapshot {
  x: number; y: number; z: number; heading: number;
  speed: number; grounded: boolean; action: CharacterAction;
}
export interface WalkableBounds { minX: number; maxX: number; minZ: number; maxZ: number }
export interface WalkableWorld {
  readonly query?: WorldQuery;
  readonly bounds: WalkableBounds;
  readonly obstacles: readonly WalkableBounds[];
  groundHeight(x: number, z: number): number;
}
