export const mouseSensitivity = { min: 0.5, max: 2, step: 0.1, defaultValue: 1.5 } as const;

export function validMouseSensitivity(value: number): boolean {
  return Number.isFinite(value) && value >= mouseSensitivity.min && value <= mouseSensitivity.max;
}
