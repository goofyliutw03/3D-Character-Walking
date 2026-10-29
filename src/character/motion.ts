export type CharacterAction = 'idle' | 'walk' | 'run' | 'jump';
export type CharacterVariant = 'man' | 'woman' | 'child';
export const characterRadius = 0.28;
export interface MovementIntent { x: number; z: number; run: boolean; jump: boolean }
export interface MotionSnapshot {
  x: number; y: number; z: number; heading: number;
  speed: number; grounded: boolean; action: CharacterAction;
}
export interface WalkableBounds { minX: number; maxX: number; minZ: number; maxZ: number }
export interface WalkableWorld {
  readonly bounds: WalkableBounds;
  readonly obstacles: readonly WalkableBounds[];
  groundHeight(x: number, z: number): number;
}
