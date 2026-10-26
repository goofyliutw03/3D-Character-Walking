import type { CharacterAction, CharacterVariant } from './motion';

export interface AssetDefinition {
  url: string; height: number; eyeHeight: number; eyeForward: number;
  label: string; derived: boolean; clips: Record<CharacterAction, string>;
}
const clips = { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump' };
export const assetCatalog: Record<CharacterVariant, AssetDefinition> = {
  man: { url: '/assets/characters/man.glb', height: 1.8, eyeHeight: 1.58, eyeForward: 0.17, label: 'Rigged man · project-authored Jump', derived: false, clips },
  woman: { url: '/assets/characters/woman.glb', height: 1.68, eyeHeight: 1.48, eyeForward: 0.16, label: 'Rigged woman · project-authored Jump', derived: false, clips },
  child: { url: '/assets/characters/child.glb', height: 1.15, eyeHeight: 0.99, eyeForward: 0.13, label: 'Rigged child · project-derived proportions + Jump', derived: true, clips },
};
