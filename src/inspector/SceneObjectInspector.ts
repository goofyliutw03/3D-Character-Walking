import { Vector3, type Object3D, type PerspectiveCamera } from 'three';
import { projectAnchor, type ScreenPoint } from '../camera/AnchorProjection.ts';
import { SceneObjectIndex } from './SceneObjectIndex.ts';

const origin = new Vector3();
export function projectObjectLabel(object: Object3D, camera: PerspectiveCamera, width: number, height: number, fisheye: boolean): ScreenPoint | null {
  for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
    if (!ancestor.visible) return null;
  }
  object.getWorldPosition(origin);
  return projectAnchor(origin, camera, width, height, fisheye);
}
interface TreeNode {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  checkbox: HTMLInputElement;
  text: HTMLSpanElement;
  children: HTMLDivElement;
  expectedOpen: boolean;
}

export class SceneObjectInspector {
  private readonly index = new SceneObjectIndex();
  private readonly layer: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly tree: HTMLDivElement;
  private readonly status: HTMLParagraphElement;
  private readonly error: HTMLParagraphElement;
  private readonly master: HTMLInputElement;
  private readonly pattern: HTMLInputElement;
  private readonly range: HTMLInputElement;
  private readonly events = new AbortController();
  private readonly nodes = new Map<number, TreeNode>();
  private readonly expanded = new Map<number, boolean>();
  private readonly filteredExpanded = new Map<number, boolean>();
  private readonly labels = new Map<number, HTMLSpanElement>();
  private filtered = false;
  private disposed = false;
  constructor(private readonly container: HTMLElement, private readonly scene: Object3D) {
    const doc = container.ownerDocument;
    this.layer = doc.createElement('div'); this.layer.className = 'object-label-layer';
    this.layer.setAttribute('aria-hidden', 'true'); container.append(this.layer);
    this.panel = doc.createElement('div'); this.panel.className = 'object-inspector';
    const masterLabel = doc.createElement('label'); masterLabel.className = 'toggle-row';
    this.master = doc.createElement('input'); this.master.type = 'checkbox'; this.master.id = 'object-labels-enabled';
    masterLabel.append('Show object numbers', this.master);
    const hint = doc.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Checkboxes control number labels only. IDs last for this page. Labels mark object origins and may overlap.';
    const field = (id: string, title: string, placeholder: string, maxLength: number): HTMLInputElement => {
      const label = doc.createElement('label'); label.className = 'select-label'; label.htmlFor = id; label.textContent = title;
      const input = doc.createElement('input'); input.id = id; input.type = 'text'; input.placeholder = placeholder; input.maxLength = maxLength;
      input.setAttribute('aria-describedby', 'object-filter-help object-filter-error'); this.panel.append(label, input); return input;
    };
    this.panel.append(masterLabel, hint);
    this.pattern = field('object-pattern', 'Name / path regex', 'Tree|Mesh (case-sensitive)', 160);
    this.range = field('object-ranges', 'Number ranges', '10-30,45,70-80', 512);
    const help = doc.createElement('p'); help.id = 'object-filter-help'; help.className = 'hint';
    help.textContent = 'Both filters must match. Use a bare JavaScript pattern, without / delimiters. Empty fields match all. Each checkbox affects only its own label.';
    const actions = doc.createElement('div'); actions.className = 'object-filter-actions';
    const apply = doc.createElement('button'); apply.type = 'button'; apply.textContent = 'Apply filters'; apply.id = 'object-filter-apply';
    const clear = doc.createElement('button'); clear.type = 'button'; clear.textContent = 'Clear filters'; clear.id = 'object-filter-clear';
    actions.append(apply, clear);
    this.error = doc.createElement('p'); this.error.id = 'object-filter-error'; this.error.className = 'hint object-filter-error';
    this.error.setAttribute('role', 'status');
    this.status = doc.createElement('p'); this.status.className = 'hint'; this.status.id = 'object-count';
    this.status.setAttribute('role', 'status');
    this.tree = doc.createElement('div'); this.tree.className = 'object-tree'; this.tree.setAttribute('aria-label', 'Scene objects');
    this.panel.append(help, actions, this.error, this.status, this.tree);
    const signal = this.events.signal;
    apply.addEventListener('click', () => this.applyFilters(), { signal });
    clear.addEventListener('click', () => { this.pattern.value = ''; this.range.value = ''; this.applyFilters(); }, { signal });
    for (const input of [this.pattern, this.range]) input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); this.applyFilters(); }
    }, { signal });
    this.master.addEventListener('change', () => { if (!this.master.checked) this.hide(); }, { signal });
    this.tree.addEventListener('click', event => {
      if ((event.target as HTMLElement).matches('input')) event.stopPropagation();
    }, { signal });
    this.tree.addEventListener('change', event => {
      const checkbox = event.target as HTMLInputElement;
      if (!checkbox.dataset.objectCheckbox) return;
      this.index.setChecked(Number(checkbox.dataset.objectCheckbox), checkbox.checked); this.hide();
    }, { signal });
    this.tree.addEventListener('toggle', event => {
      const details = event.target as HTMLDetailsElement;
      const id = Number(details.dataset.objectId), node = this.nodes.get(id);
      if (node?.details === details && node.expectedOpen !== details.open) {
        (this.filtered ? this.filteredExpanded : this.expanded).set(id, details.open); node.expectedOpen = details.open;
      }
    }, { signal, capture: true });
    this.sync();
  }
  mount(host: HTMLElement): void { if (!this.disposed) host.append(this.panel); }
  private applyFilters(): void {
    const error = this.index.configure(this.pattern.value, this.range.value);
    this.error.textContent = error ? `${error} Previous filters remain active.` : '';
    for (const input of [this.pattern, this.range]) input.setAttribute('aria-invalid', String(!!error));
    if (error) return;
    this.filtered = !!(this.pattern.value.trim() || this.range.value.trim());
    this.filteredExpanded.clear();
    this.renderTree(); this.hide();
  }
  sync(): void {
    if (!this.disposed && this.index.sync(this.scene)) this.renderTree();
  }
  private renderTree(): void {
    const rows = this.index.treeRows, retained = new Set(rows.map(row => row.id));
    const active = new Set(this.index.rows.map(row => row.id));
    for (const [id, node] of this.nodes) {
      if (!retained.has(id)) { node.details.remove(); this.nodes.delete(id); }
    }
    for (const id of this.expanded.keys()) if (!active.has(id)) this.expanded.delete(id);
    for (const id of this.filteredExpanded.keys()) if (!active.has(id)) this.filteredExpanded.delete(id);
    for (const row of rows) {
      let node = this.nodes.get(row.id);
      if (!node) {
        const doc = this.panel.ownerDocument;
        const details = doc.createElement('details'); details.className = 'object-node'; details.dataset.objectId = String(row.id);
        const summary = doc.createElement('summary');
        const checkbox = doc.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.objectCheckbox = String(row.id);
        const text = doc.createElement('span'); const children = doc.createElement('div'); children.className = 'object-children';
        summary.append(checkbox, text); details.append(summary, children);
        node = { details, summary, checkbox, text, children, expectedOpen: false }; this.nodes.set(row.id, node);
      }
      node.checkbox.checked = row.checked;
      node.checkbox.setAttribute('aria-label', `Number label ${row.id}: ${row.name}`);
      node.text.textContent = `#${row.id} ${row.name}${row.matched ? '' : ' · ancestor only'}`;
      node.summary.title = `${row.object.type} · ${row.path}`;
      node.details.dataset.matched = String(row.matched);
      node.expectedOpen = this.filtered ? (this.filteredExpanded.get(row.id) ?? true) : (this.expanded.get(row.id) ?? row.parentId === null);
      if (node.details.open !== node.expectedOpen) node.details.open = node.expectedOpen;
    }
    // Reorder only when needed, so active keyboard focus survives routine synchronization.
    const positions = new Map<HTMLElement, number>();
    for (const row of rows) {
      const node = this.nodes.get(row.id)!;
      const parent = row.parentId === null ? this.tree : this.nodes.get(row.parentId)!.children;
      const position = positions.get(parent) ?? 0;
      const before = parent.children[position] ?? null;
      if (before !== node.details) parent.insertBefore(node.details, before);
      positions.set(parent, position + 1);
    }
    const matched = this.index.rows.filter(row => row.matched).length;
    this.status.textContent = `${matched} / ${this.index.rows.length} objects match.${matched ? '' : ' No matching objects.'}`;
  }
  update(camera: PerspectiveCamera, fisheye: boolean): void {
    if (this.disposed || !this.master.checked) { this.hide(); return; }
    const retained = new Set<number>();
    for (const row of this.index.rows) {
      if (!row.matched || !row.checked) continue;
      const point = projectObjectLabel(row.object, camera, this.container.clientWidth, this.container.clientHeight, fisheye);
      if (!point) continue;
      retained.add(row.id);
      let label = this.labels.get(row.id);
      if (!label) {
        label = this.container.ownerDocument.createElement('span'); label.className = 'object-number-label';
        label.textContent = String(row.id); label.dataset.objectLabel = String(row.id); this.layer.append(label); this.labels.set(row.id, label);
      }
      label.hidden = false; label.style.transform = `translate(${point.x}px, ${point.y}px)`;
    }
    for (const [id, label] of this.labels) if (!retained.has(id)) { label.remove(); this.labels.delete(id); }
  }
  hide(): void { for (const label of this.labels.values()) label.hidden = true; }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.events.abort(); this.panel.remove(); this.layer.remove();
    this.nodes.clear(); this.expanded.clear(); this.filteredExpanded.clear(); this.labels.clear(); this.index.dispose();
  }
}
