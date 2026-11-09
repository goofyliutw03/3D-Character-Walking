export type SpaceKind = 'open' | 'semi-open' | 'semi-enclosed' | 'transition' | 'enclosed' | 'underwater';

/** Space classification selects defaults; each environment can override its capabilities. */
export interface SceneControlPolicy {
  space: SpaceKind;
  framing: 'outdoor' | 'indoor';
  constrainCamera: boolean;
  groundNavigation: boolean;
  autoRun: boolean;
}

export function sceneControlPolicy(space: SpaceKind, overrides: Partial<Omit<SceneControlPolicy, 'space'>> = {}): SceneControlPolicy {
  const interior = space === 'semi-enclosed' || space === 'enclosed';
  return {
    space, framing: interior ? 'indoor' : 'outdoor',
    constrainCamera: interior, groundNavigation: space !== 'underwater',
    autoRun: space !== 'underwater', ...overrides,
  };
}
