import type { Object3D } from 'three';

export interface ObjectRow {
  readonly object: Object3D;
  readonly id: number;
  readonly parentId: number | null;
  readonly name: string;
  readonly path: string;
  readonly checked: boolean;
  readonly matched: boolean;
}
interface Identity { id: number; checked: boolean }

/** Read-only scene discovery; all mutable state belongs to the inspector. */
export class SceneObjectIndex {
  private identities = new WeakMap<Object3D, Identity>();
  private nextId = 1;
  private active: ObjectRow[] = [];
  private pattern: RegExp | null = null;
  private ranges: readonly (readonly [number, number])[] = [];
  private signature = '';
  get rows(): readonly ObjectRow[] { return this.active; }
  get treeRows(): readonly ObjectRow[] {
    const included = new Set<number>();
    const byId = new Map(this.active.map(row => [row.id, row]));
    for (const row of this.active) {
      if (!row.matched) continue;
      let current: ObjectRow | undefined = row;
      while (current && !included.has(current.id)) {
        included.add(current.id);
        current = current.parentId === null ? undefined : byId.get(current.parentId);
      }
    }
    return this.active.filter(row => included.has(row.id));
  }
  configure(pattern: string, rangeText: string): string | null {
    if (pattern.length > 160) return 'Pattern must be at most 160 characters.';
    if (rangeText.length > 512) return 'Number ranges must be at most 512 characters.';
    let regex: RegExp | null;
    try { regex = pattern.trim() ? new RegExp(pattern) : null; }
    catch { return 'Invalid regular expression. Check brackets and escapes.'; }
    const ranges: [number, number][] = [];
    if (rangeText.trim()) {
      for (const token of rangeText.split(',')) {
        const match = /^\s*([0-9]+)\s*(?:-\s*([0-9]+)\s*)?$/.exec(token);
        if (!match) return 'Use positive numbers or ranges, e.g. 10-30,45,70-80.';
        const start = Number(match[1]), end = Number(match[2] ?? match[1]);
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start)
          return 'Ranges need safe positive integers with start ≤ end.';
        ranges.push([start, end]);
      }
    }
    this.pattern = regex; this.ranges = ranges;
    this.active = this.active.map(row => ({ ...row, matched: this.matches(row) }));
    return null;
  }
  private matches(row: Pick<ObjectRow, 'id' | 'name' | 'path'>): boolean {
    return (!this.pattern || this.pattern.test(row.name) || this.pattern.test(row.path))
      && (!this.ranges.length || this.ranges.some(([start, end]) => row.id >= start && row.id <= end));
  }
  setChecked(id: number, checked: boolean): void {
    const row = this.active.find(row => row.id === id);
    if (!row) return;
    this.identities.get(row.object)!.checked = checked;
    this.active = this.active.map(row => row.id === id ? { ...row, checked } : row);
  }
  sync(root: Object3D): boolean {
    const rows: ObjectRow[] = [];
    const visit = (object: Object3D, parentId: number | null, parentPath: string): void => {
      let identity = this.identities.get(object);
      if (!identity) { identity = { id: this.nextId++, checked: true }; this.identities.set(object, identity); }
      const name = object.name.trim() || object.type;
      const path = parentPath ? `${parentPath}/${name}` : name;
      const row = { object, ...identity, name, path, parentId, matched: false };
      row.matched = this.matches(row); rows.push(row);
      for (const child of object.children) visit(child, identity.id, path);
    };
    visit(root, null, '');
    const signature = JSON.stringify(rows.map(({ id, parentId, name, path, checked, matched }) => [id, parentId, name, path, checked, matched]));
    const changed = signature !== this.signature;
    this.signature = signature; this.active = rows;
    return changed;
  }
  dispose(): void { this.active = []; this.identities = new WeakMap(); this.signature = ''; }
}
