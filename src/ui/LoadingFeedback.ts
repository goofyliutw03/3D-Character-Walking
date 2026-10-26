export type LoadingState =
  | { phase: 'loading'; message: string }
  | { phase: 'ready'; message: string }
  | { phase: 'error'; message: string; recovery: string };

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
