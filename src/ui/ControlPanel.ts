const defaultWidth = 320;
// Keep this query aligned with the scene-first responsive layout in style.css.
const stackedQuery = '(max-width:850px), (pointer:coarse)';

export function panelBounds(available: number): { min: number; max: number } {
  return { min: 260, max: Math.max(260, Math.min(520, available - 360)) };
}

export function clampPanelWidth(width: number, available: number): number {
  const { min, max } = panelBounds(available);
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(width) ? width : defaultWidth)));
}

export class ControlPanel {
  private readonly root: HTMLElement;
  private readonly toggle: HTMLButtonElement;
  private readonly content: HTMLElement;
  private readonly handle: HTMLElement;
  private readonly media: MediaQueryList;
  private readonly observer: ResizeObserver;
  private readonly events = new AbortController();
  private preferredWidth = defaultWidth;
  private collapsed = false;
  private drag: { pointer: number; x: number; width: number } | undefined;

  constructor(root: HTMLElement) {
    this.root = root;
    this.toggle = root.querySelector<HTMLButtonElement>('#panel-toggle')!;
    this.content = root.querySelector<HTMLElement>('#control-panel-content')!;
    this.handle = root.querySelector<HTMLElement>('#panel-resize')!;
    const view = root.ownerDocument.defaultView!;
    this.media = view.matchMedia(stackedQuery);
    const { signal } = this.events;
    // Panel navigation must not also reach the viewer's global movement shortcuts.
    this.content.addEventListener('keydown', event => event.stopPropagation(), { signal });
    this.toggle.addEventListener('click', () => {
      this.finishDrag();
      this.collapsed = !this.collapsed;
      if (this.collapsed) this.restoreFocus();
      this.render();
    }, { signal });
    this.handle.addEventListener('pointerdown', event => {
      if (this.drag || this.collapsed || this.media.matches || !event.isPrimary || event.button !== 0) return;
      try { this.handle.setPointerCapture(event.pointerId); }
      catch { return; } // Detached or inactive pointers cannot start a drag.
      event.preventDefault();
      this.handle.focus();
      this.drag = { pointer: event.pointerId, x: event.clientX, width: this.effectiveWidth() };
      this.root.classList.toggle('panel-resizing', true);
    }, { signal });
    this.handle.addEventListener('pointermove', event => {
      if (this.drag?.pointer !== event.pointerId) return;
      this.preferredWidth = clampPanelWidth(this.drag.width + event.clientX - this.drag.x, this.availableWidth());
      this.render();
    }, { signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      this.handle.addEventListener(type, event => {
        if (this.drag?.pointer === event.pointerId) this.finishDrag();
      }, { signal });
    }
    this.handle.addEventListener('keydown', event => {
      event.stopPropagation();
      if (this.collapsed || this.media.matches) return;
      const { min, max } = panelBounds(this.availableWidth());
      const step = event.shiftKey ? 32 : 16;
      const widths: Record<string, number> = {
        ArrowLeft: this.effectiveWidth() - step, ArrowRight: this.effectiveWidth() + step,
        Home: min, End: max,
      };
      if (!Object.hasOwn(widths, event.key)) return;
      event.preventDefault();
      this.preferredWidth = clampPanelWidth(widths[event.key], this.availableWidth());
      this.render();
    }, { signal });
    this.media.addEventListener('change', () => {
      this.finishDrag();
      if (this.media.matches && root.ownerDocument.activeElement === this.handle) this.toggle.focus();
      this.render();
    }, { signal });
    view.addEventListener('resize', () => this.render(), { signal });
    view.addEventListener('blur', () => this.finishDrag(), { signal });
    this.observer = new ResizeObserver(() => this.render());
    this.observer.observe(root);
    root.querySelectorAll<HTMLDetailsElement>('.function-node').forEach(node => {
      node.addEventListener('toggle', () => {
        const body = node.querySelector<HTMLElement>('.function-node-content');
        if (!node.open && body?.contains(root.ownerDocument.activeElement)) node.querySelector('summary')?.focus();
      }, { signal });
    });
    this.render();
  }

  private availableWidth(): number { return this.root.getBoundingClientRect().width; }
  private effectiveWidth(): number { return clampPanelWidth(this.preferredWidth, this.availableWidth()); }

  private restoreFocus(): void {
    const active = this.root.ownerDocument.activeElement;
    if (this.content.contains(active) || active === this.handle) this.toggle.focus();
  }

  private render(): void {
    const width = this.effectiveWidth();
    const { min, max } = panelBounds(this.availableWidth());
    this.root.style.setProperty('--panel-width', `${this.collapsed ? 52 : width}px`);
    this.root.dataset.panelCollapsed = String(this.collapsed);
    this.content.hidden = this.collapsed;
    this.handle.hidden = this.collapsed || this.media.matches;
    this.toggle.setAttribute('aria-expanded', String(!this.collapsed));
    this.toggle.setAttribute('aria-label', this.collapsed ? 'Expand function panel' : 'Collapse function panel');
    this.handle.setAttribute('aria-valuemin', String(min));
    this.handle.setAttribute('aria-valuemax', String(max));
    this.handle.setAttribute('aria-valuenow', String(width));
    this.handle.setAttribute('aria-valuetext', `${width} pixels`);
  }

  private finishDrag(): void {
    const pointer = this.drag?.pointer;
    this.drag = undefined;
    this.root.classList.remove('panel-resizing');
    if (pointer !== undefined && this.handle.hasPointerCapture(pointer)) this.handle.releasePointerCapture(pointer);
  }

  dispose(): void {
    this.events.abort();
    this.finishDrag();
    this.observer.disconnect();
  }
}
