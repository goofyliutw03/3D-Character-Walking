import { describeDownload, describeLoading, type LoadingState } from './LoadingFeedback.ts';

export class LoadingPanel {
  private readonly progress: HTMLProgressElement;
  private readonly message: HTMLElement;
  private readonly amount: HTMLElement;
  private initialized = false;
  constructor(private readonly root: HTMLElement) {
    this.progress = root.querySelector<HTMLProgressElement>('progress')!;
    this.message = root.querySelector<HTMLElement>('[data-loading-message]')!;
    this.amount = root.querySelector<HTMLElement>('[data-loading-amount]')!;
  }
  update(state: LoadingState): void {
    if (state.phase === 'ready') this.initialized = true;
    this.root.hidden = state.phase === 'ready';
    this.root.dataset.state = state.phase;
    this.root.dataset.compact = String(this.initialized);
    const text = describeLoading(state).text;
    if (this.message.textContent !== text) this.message.textContent = text;
    const percentage = describeDownload(state);
    this.progress.hidden = state.phase !== 'loading';
    this.progress.setAttribute('aria-label', state.phase === 'loading' && state.stage === 'download' ? 'Character download progress' : 'Initialization progress');
    if (percentage === null) this.progress.removeAttribute('value');
    else this.progress.setAttribute('value', String(percentage));
    this.amount.textContent = state.phase === 'error' ? 'Please try again' : percentage === null ? 'Working…' : `Download · ${percentage}%`;
  }
}
