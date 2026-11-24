export interface JsonBackend { readonly name: string; read(): Promise<string | null>; write(text: string): Promise<void> }
export class ProfileStorage {
  private backend: JsonBackend | undefined;
  private queue: Promise<unknown> = Promise.resolve();
  mode = 'Memory only';
  note = '';
  constructor(private readonly backends: (() => Promise<JsonBackend>)[] = [opfsBackend, indexedDbBackend]) {}
  async read(): Promise<string | null> {
    const errors: string[] = [];
    let selected: { backend: JsonBackend; text: string | null; time: number } | undefined;
    const timestamp = (text: string | null): number => {
      if (text === null) return -1;
      try {
        const data = JSON.parse(text) as { temp?: { createdAt: number }; profiles?: { createdAt: number }[] };
        return Math.max(0, data.temp?.createdAt ?? 0, ...(data.profiles ?? []).map(p=>p.createdAt));
      } catch { return Infinity; } // Surface damaged data instead of silently hiding it.
    };
    for (const open of this.backends) {
      try {
        const backend = await open();
        const text = await backend.read();
        const time = timestamp(text);
        if (!selected || time > selected.time) selected = { backend, text, time };
      } catch (error) { errors.push(error instanceof Error ? error.message : 'Storage unavailable'); }
    }
    this.note = errors.join('; ');
    if (selected) { this.backend=selected.backend; this.mode=selected.backend.name; return selected.text; }
    throw Error('Local storage unavailable: ' + this.note);
  }
  write(text: string): Promise<void> {
    const operation = this.queue.catch(() => {}).then(async () => {
      if (!this.backend) await this.read();
      if (!this.backend) throw Error('Memory only · storage unavailable');
      try { await this.backend.write(text); }
      catch (error) {
        if (!this.backend.name.startsWith('OPFS')) throw error;
        const fallback = await this.backends[1]?.();
        if (!fallback) throw error;
        await fallback.write(text);
        this.note='OPFS write failed; using fallback'; this.backend=fallback; this.mode=fallback.name;
      }
    });
    this.queue = operation;
    return operation;
  }
}

async function opfsBackend(): Promise<JsonBackend> {
  if (!globalThis.isSecureContext || !navigator.storage?.getDirectory) throw Error('OPFS unavailable in this context');
  const root = await navigator.storage.getDirectory();
  return {
    name: 'OPFS · panel-profiles.json',
    async read() {
      try { const text = await (await (await root.getFileHandle('panel-profiles.json')).getFile()).text(); return text || null; }
      catch (error) { if (error instanceof DOMException && error.name === 'NotFoundError') return null; throw error; }
    },
    async write(text) {
      const file = await root.getFileHandle('panel-profiles.json', { create: true });
      const stream = await file.createWritable();
      try { await stream.write(text); await stream.close(); }
      catch (error) { await stream.abort().catch(() => {}); throw error; }
    },
  };
}

async function indexedDbBackend(): Promise<JsonBackend> {
  if (!globalThis.indexedDB) throw Error('IndexedDB unavailable');
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open('walk-studio-panel-profiles', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('json');
    open.onsuccess = () => { open.result.onversionchange = () => open.result.close(); resolve(open.result); };
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(Error('IndexedDB blocked by another page'));
  });
  return {
    name: 'IndexedDB · panel-profiles.json',
    read: () => new Promise((resolve, reject) => {
      const tx = db.transaction('json', 'readonly');
      const request = tx.objectStore('json').get('panel-profiles.json');
      tx.oncomplete = () => resolve(typeof request.result === 'string' ? request.result : null);
      tx.onerror = tx.onabort = () => reject(tx.error ?? Error('IndexedDB read failed'));
    }),
    write: text => new Promise((resolve, reject) => {
      const tx = db.transaction('json', 'readwrite');
      tx.objectStore('json').put(text, 'panel-profiles.json');
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error ?? Error('IndexedDB write failed'));
    }),
  };
}
