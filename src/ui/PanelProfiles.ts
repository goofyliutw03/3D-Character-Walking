import type { ViewerApp } from '../engine/ViewerApp';
import type { ViewerSettings } from '../settings/ViewerSettings';
import { validViewerSettings } from '../settings/validateViewerSettings';
import { ProfileHistory, parseProfiles } from '../settings/PanelProfiles';
import { ProfileStorage } from '../settings/ProfileStorage';
import type { ControlPanel } from './ControlPanel';

interface PanelSettings {
  runtime: ViewerSettings;
  fields: Record<string, string | boolean>;
  layout: { width: number; collapsed: boolean; open: Record<string, boolean> };
}
export const profileControlsContent = `<div class="profile-toolbar">
  <button id="panel-reset" type="button">Panel.Reset</button>
  <label class="sr-only" for="panel-profile">Panel profile</label><select id="panel-profile"><option value="temp">temp</option></select>
  <button id="panel-save" type="button">Save</button></div>
  <p id="profile-status" class="hint" role="status">Loading local profiles…</p>
  <p class="hint profile-help">Settings stay in this browser for this site address and port. Browser manages the file location; clearing site data removes profiles.</p>`;

export class PanelProfiles {
  private history = new ProfileHistory<PanelSettings>();
  private readonly storage = new ProfileStorage();
  private readonly events = new AbortController();
  private readonly select: HTMLSelectElement;
  private readonly status: HTMLElement;
  private readonly buttons: HTMLButtonElement[];
  private readonly defaults: PanelSettings;
  private busy = true;
  private protectedRead = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private queue: Promise<void> = Promise.resolve();
  private last = '';
  constructor(private readonly root: HTMLElement, private readonly viewer: ViewerApp,
    private readonly panel: ControlPanel, private readonly sync: () => Promise<void>,
    private readonly settled: () => Promise<void> = () => Promise.resolve()) {
    this.select = root.querySelector<HTMLSelectElement>('#panel-profile')!;
    this.status = root.querySelector<HTMLElement>('#profile-status')!;
    this.buttons = ['panel-save','panel-reset'].map(id=>root.querySelector<HTMLButtonElement>('#'+id)!);
    this.defaults = this.capture();
    this.disable(true);
  }
  private fields(): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] {
    return [...this.root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[id],select[id],textarea[id]')]
      .filter(el => el.id !== 'auto-run' && el.id !== 'panel-profile');
  }
  private details(): HTMLDetailsElement[] { return [...this.root.querySelectorAll<HTMLDetailsElement>('details[id]')]; }
  private key(el: HTMLDetailsElement): string { return el.id || 'object:' + el.dataset.profileKey; }
  private capture(): PanelSettings {
    const fields: PanelSettings['fields'] = {};
    for (const el of this.fields()) fields[el.id] = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
    return { runtime: this.viewer.getPanelSettings(), fields,
      layout: { ...this.panel.getSettings(), open: Object.fromEntries(this.details().map(el=>[this.key(el),el.open])) } };
  }
  private valid = (value: unknown): value is PanelSettings => {
    if (!value || typeof value !== 'object') return false;
    const s = value as PanelSettings;
    return validViewerSettings(s.runtime) && !!s.fields && typeof s.fields==='object' && !Array.isArray(s.fields) &&
      Object.entries(s.fields).length<=200 && Object.entries(s.fields).every(([key,v]) => key.length<100 && (typeof v==='boolean'||typeof v==='string'&&v.length<=20000)) &&
      !!s.layout && Number.isFinite(s.layout.width) && s.layout.width>=260 && s.layout.width<=520 && typeof s.layout.collapsed==='boolean' &&
      !!s.layout.open && typeof s.layout.open==='object' && Object.keys(s.layout.open).length<=20000 && Object.values(s.layout.open).every(v=>typeof v==='boolean');
  };
  private disable(value: boolean): void { this.select.disabled=value; this.buttons.forEach(b=>b.disabled=value); }
  private report(message: string): void { this.status.textContent = `${this.storage.mode} · ${message}`; }
  private render(): void {
    this.select.replaceChildren();
    for (const name of ['temp', ...this.history.data.profiles.slice().reverse().map(p=>p.name)]) {
      const option=document.createElement('option'); option.value=option.textContent=name; this.select.append(option);
    }
    this.select.value=this.history.selected;
  }
  private async persist(explicit = false): Promise<void> {
    if (this.protectedRead && !explicit) { this.report('Not saved · damaged file kept; Save or Panel.Reset to replace'); return; }
    await this.storage.write(JSON.stringify(this.history.data, null, 2));
    this.protectedRead=false; this.report('Saved');
  }
  private async apply(settings: PanelSettings, reset = false): Promise<void> {
    await this.viewer.applyPanelSettings(settings.runtime, reset);
    await this.sync();
    for (const el of this.fields()) {
      const value=settings.fields[el.id];
      if (typeof value==='boolean' && el instanceof HTMLInputElement && el.type==='checkbox') el.checked=value;
      else if (typeof value==='string') el.value=value;
    }
    for (const el of this.details()) if (typeof settings.layout.open[this.key(el)]==='boolean') el.open=settings.layout.open[this.key(el)]!;
    this.panel.applySettings(settings.layout);
    this.last=JSON.stringify(this.capture());
  }
  private enqueue(operation: () => Promise<void>, exclusive = true): void {
    this.queue=this.queue.then(async()=>{
      if (this.events.signal.aborted) return;
      if (exclusive) { this.busy=true; this.disable(true); this.root.inert=true; }
      try { await operation(); }
      catch(error) { this.report('Not saved / applied · '+(error instanceof Error?error.message:'Unknown error')); }
      finally {
        if (exclusive) { this.root.inert=false; this.busy=false; this.disable(false); }
        this.render();
      }
    });
  }
  changed(): void {
    if (this.busy || this.events.signal.aborted) return;
    if (this.timer!==undefined) clearTimeout(this.timer);
    this.timer=setTimeout(()=>{
      this.timer=undefined;
      if (this.busy || this.events.signal.aborted) return;
      this.enqueue(async()=>{
        await this.settled();
        const settings=this.capture(), serialized=JSON.stringify(settings);
        if (serialized===this.last) return;
        this.last=serialized; this.history.change(settings); this.render(); await this.persist();
      },false);
    },120);
  }
  async initialize(): Promise<void> {
    try {
      const text=await this.storage.read();
      if (text!==null) {
        try { this.history=new ProfileHistory(parseProfiles(text,this.valid)); }
        catch(error) { this.protectedRead=true; throw error; }
      }
      const initial=this.history.data.temp ?? this.history.data.profiles.at(-1);
      if(initial) {
        await this.apply(initial.settings);
        this.history.loaded(initial.name,this.capture());
      }
      this.report('Ready');
    } catch(error) { this.report('Not restored · '+(error instanceof Error?error.message:'Storage error')); }
    this.last=JSON.stringify(this.capture()); this.busy=false; this.disable(false); this.render();
    const options={signal:this.events.signal};
    const save = this.buttons[0]!, reset=this.buttons[1]!;
    save.addEventListener('click',()=>this.enqueue(async()=>{
      await this.settled();
      const settings=this.capture();
      if (JSON.stringify(settings)!==this.last) this.history.change(settings);
      this.history.save(settings.runtime.environment,settings);
      this.last=JSON.stringify(settings); await this.persist(true);
    }),options);
    reset.addEventListener('click',()=>this.enqueue(async()=>{
      await this.apply(this.defaults,true); this.history.reset(this.capture()); await this.persist(true);
    }),options);
    this.select.addEventListener('change',()=>{
      const name=this.select.value;
      this.enqueue(async()=>{
        await this.settled();
        const settings=this.history.select(name,this.capture());
        let failure: unknown;
        try { await this.persist(); } catch(error) { failure=error; }
        await this.apply(settings);
        if (failure) throw failure;
      });
    },options);
    for (const type of ['input','change','click','keyup','pointerup','compositionend'] as const) {
      document.addEventListener(type,event=>{
        if (event.target instanceof Element && event.target.closest('.profile-toolbar')) return;
        if (event instanceof InputEvent && event.isComposing) return;
        this.changed();
      },options);
    }
    this.root.addEventListener('toggle',()=>this.changed(),{...options,capture:true});
  }
  dispose(): void { if(this.timer!==undefined)clearTimeout(this.timer); this.events.abort(); }
}
