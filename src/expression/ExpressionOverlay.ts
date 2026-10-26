import type { ExpressionState } from './ExpressionManager';
import type { ScreenPoint } from '../camera/AnchorProjection';

export class ExpressionOverlay {
  private readonly root: HTMLDivElement;
  private readonly bubble: HTMLDivElement;
  private readonly icon: HTMLSpanElement;
  private readonly speech: HTMLSpanElement;
  private hasContent = false;
  private disposed = false;
  constructor(private readonly container: HTMLElement) {
    const doc = container.ownerDocument;
    this.root = doc.createElement('div');
    this.root.className = 'expression-anchor';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.hidden = true;
    this.bubble = doc.createElement('div');
    this.bubble.className = 'expression-bubble';
    this.icon = doc.createElement('span');
    this.icon.className = 'expression-icon';
    this.speech = doc.createElement('span');
    this.speech.className = 'expression-speech';
    this.bubble.append(this.icon, this.speech);
    this.root.append(this.bubble);
    container.append(this.root);
  }
  setContent(state: Readonly<ExpressionState>, icon: string): void {
    this.icon.textContent = icon;
    this.icon.hidden = !icon;
    this.speech.textContent = state.speech;
    this.speech.hidden = !state.speech.trim();
    this.hasContent = !!icon || !!state.speech.trim();
  }
  place(point: ScreenPoint | null): void {
    this.root.hidden = this.disposed || !point || !this.hasContent;
    if (this.root.hidden || !point) return;
    const width = this.container.clientWidth, height = this.container.clientHeight;
    this.root.style.left = `${point.x}px`;
    this.root.style.top = `${point.y}px`;
    this.bubble.style.maxWidth = `${Math.max(0, Math.min(240, width - 16))}px`;
    this.bubble.style.maxHeight = `${Math.max(0, height - 16)}px`;
    const bw = this.bubble.offsetWidth, bh = this.bubble.offsetHeight;
    const x = Math.max(8, Math.min(point.x - bw / 2, width - bw - 8));
    const desiredY = point.y - bh - 12 >= 8 ? point.y - bh - 12 : point.y + 12;
    const y = Math.max(8, Math.min(desiredY, height - bh - 8));
    this.bubble.style.left = `${x - point.x}px`;
    this.bubble.style.top = `${y - point.y}px`;
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.root.remove();
  }
}
