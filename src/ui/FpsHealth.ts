export type FpsHealth = 'normal' | 'warning' | 'critical';

export interface FpsBoundary {
  fps: number;
  previousFps: number;
  from: FpsHealth;
  to: FpsHealth;
}

export function fpsHealth(fps: number): FpsHealth {
  return fps < 15 ? 'critical' : fps < 30 ? 'warning' : 'normal';
}

export function fpsBoundary(previousFps: number | undefined, fps: number): FpsBoundary | undefined {
  if (previousFps === undefined) return undefined;
  const from = fpsHealth(previousFps), to = fpsHealth(fps);
  if (from !== to) return { fps, previousFps, from, to };
}
