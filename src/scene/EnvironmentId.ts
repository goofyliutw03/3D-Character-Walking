const environmentIds = ['city', 'cave', 'terrain', 'flight', 'room', 'swim', 'pool'] as const;
export type EnvironmentId = typeof environmentIds[number];
export function isEnvironmentId(value: unknown): value is EnvironmentId {
  return environmentIds.some(id => id === value);
}
