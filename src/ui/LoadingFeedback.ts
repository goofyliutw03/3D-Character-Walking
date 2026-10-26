export type LoadingStage = 'engine' | 'scene' | 'loader' | 'download' | 'prepare';
export interface DownloadProgress { loaded: number; total?: number }
export type LoadingState =
  | { phase: 'loading'; message: string; stage?: LoadingStage; download?: DownloadProgress }
  | { phase: 'ready'; message: string }
  | { phase: 'error'; message: string; recovery: string };

export function describeDownload(state: LoadingState): number | null {
  if (state.phase !== 'loading' || !state.download) return null;
  const { loaded, total } = state.download;
  if (!Number.isFinite(loaded) || loaded < 0 || total === undefined || !Number.isFinite(total) || total <= 0 || loaded > total) return null;
  return Math.floor(loaded / total * 100);
}

export function describeLoading(state: LoadingState): { text: string; busy: boolean; error: boolean } {
  return {
    text: state.phase === 'error' ? `${state.message} ${state.recovery}` : state.message,
    busy: state.phase === 'loading',
    error: state.phase === 'error',
  };
}
export function presentLoading(element: HTMLElement, state: LoadingState): void {
  const view = describeLoading(state);
  element.setAttribute('role', view.error ? 'alert' : 'status');
  element.setAttribute('aria-live', view.error ? 'assertive' : 'polite');
  element.setAttribute('aria-atomic', 'true');
  element.setAttribute('aria-busy', String(view.busy));
  if (element.textContent !== view.text) element.textContent = view.text;
}
