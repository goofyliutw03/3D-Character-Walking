import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderFunctionTree } from '../src/ui/FunctionTree.ts';
import { ControlPanel, panelBounds, clampPanelWidth } from '../src/ui/ControlPanel.ts';

test('panel 1.1,1.2,4.1: independent native disclosures preserve hierarchy and escape headings', () => {
  const html = renderFunctionTree([{ id: 'character', label: '<Character>', open: true,
    children: [{ id: 'choice', label: 'Choice', content: '<select id="character"></select>' }] },
    { id: 'camera', label: 'Camera', content: '<button data-camera="front">Front</button>' }]);
  assert.match(html, /<details[^>]*id="function-character"[^>]*open/);
  assert.match(html, /&lt;Character&gt;/);
  assert.match(html, /id="function-choice"/);
  assert.match(html, /<select id="character"><\/select>/);
  assert.doesNotMatch(html, /role="tree"|name=/);
  assert.equal((html.match(/<details/g) ?? []).length, 3);
  assert.throws(() => renderFunctionTree([{ id: 'same', label: 'A' }, { id: 'same', label: 'B' }]), /Duplicate/);
});

test('panel 3.2: limits reserve scene space and reject non-finite widths', () => {
  assert.deepEqual(panelBounds(900), { min: 260, max: 520 });
  assert.deepEqual(panelBounds(851), { min: 260, max: 491 });
  assert.equal(clampPanelWidth(-99, 900), 260);
  assert.equal(clampPanelWidth(999, 851), 491);
  assert.equal(clampPanelWidth(NaN, 1000), 320);
});

// EventTarget exercises the production listeners; real DOM layout/focus is checked in the browser.
function fixture() {
  class Element extends EventTarget {
    attrs = new Map(); hidden = false; style = { setProperty: (key, value) => this.attrs.set(key, value) };
    dataset = {}; width = 1000; capture = undefined;
    classList = { toggle: (key, value) => this.attrs.set(key, value), remove: key => this.attrs.delete(key) };
    setAttribute(key, value) { this.attrs.set(key, value); }
    getBoundingClientRect() { return { width: this.width }; }
    setPointerCapture(id) { this.capture = id; }
    hasPointerCapture(id) { return this.capture === id; }
    releasePointerCapture() { this.capture = undefined; }
    contains(el) { return el === this; }
    focus() { doc.activeElement = this; }
  }
  const media = Object.assign(new EventTarget(), { matches: false });
  const win = Object.assign(new EventTarget(), { matchMedia: () => media });
  const doc = { defaultView: win, activeElement: undefined };
  const root = new Element(), toggle = new Element(), content = new Element(), handle = new Element();
  root.ownerDocument = doc;
  const elements = { '#panel-toggle': toggle, '#control-panel-content': content, '#panel-resize': handle };
  root.querySelector = selector => elements[selector];
  root.querySelectorAll = () => [];
  let disconnected = false;
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class { observe() {} disconnect() { disconnected = true; } };
  const panel = new ControlPanel(root);
  globalThis.ResizeObserver = original;
  const pointer = (type, options = {}) => handle.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), {
    pointerId: 1, clientX: 320, button: 0, isPrimary: true, ...options,
  }));
  const key = (value, extra = {}) => handle.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: value, ...extra }));
  return { panel, root, toggle, content, handle, media, win, doc, pointer, key, disconnected: () => disconnected };
}

test('panel 2,3: pointer ownership, boundaries, cancellation, keyboard and collapse preserve width', () => {
  const f = fixture();
  const width = () => f.root.attrs.get('--panel-width');
  assert.equal(width(), '320px');
  f.pointer('pointerdown', { button: 2 }); f.pointer('pointermove', { clientX: 500 });
  assert.equal(width(), '320px');
  f.pointer('pointerdown'); f.pointer('pointermove', { pointerId: 2, clientX: 500 });
  assert.equal(width(), '320px');
  f.pointer('pointermove', { clientX: 900 }); assert.equal(width(), '520px');
  f.pointer('pointercancel'); f.pointer('pointermove', { clientX: 0 });
  assert.equal(width(), '520px'); assert.equal(f.handle.capture, undefined);
  f.key('Home'); assert.equal(width(), '260px');
  f.key('ArrowRight', { shiftKey: true }); assert.equal(width(), '292px');
  f.key('End'); assert.equal(width(), '520px');
  f.handle.focus(); f.toggle.dispatchEvent(new Event('click'));
  assert.equal(width(), '52px'); assert.equal(f.content.hidden, true);
  assert.equal(f.handle.hidden, true); assert.equal(f.doc.activeElement, f.toggle);
  f.toggle.dispatchEvent(new Event('click')); assert.equal(width(), '520px');
  f.root.width = 851; f.win.dispatchEvent(new Event('resize')); assert.equal(width(), '491px');
  f.root.width = 1000; f.win.dispatchEvent(new Event('resize')); assert.equal(width(), '520px');
  f.pointer('pointerdown'); f.pointer('lostpointercapture');
  assert.equal(f.root.attrs.has('panel-resizing'), false);
  let contentStopped = false;
  f.content.addEventListener('keydown', event => { contentStopped = event.cancelBubble; });
  f.content.dispatchEvent(new Event('keydown', { bubbles: true }));
  assert.equal(contentStopped, true, 'native summary keys must not reach global character shortcuts');
  f.pointer('pointerdown'); f.win.dispatchEvent(new Event('blur'));
  assert.equal(f.handle.capture, undefined);
  f.panel.dispose(); assert.equal(f.disconnected(), true);
  f.key('Home'); assert.equal(width(), '520px');
});

test('panel 3.3,4.2: responsive changes terminate drag and disposal releases capture', () => {
  const f = fixture();
  f.pointer('pointerdown'); f.media.matches = true; f.media.dispatchEvent(new Event('change'));
  assert.equal(f.handle.hidden, true); assert.equal(f.handle.capture, undefined);
  f.pointer('pointermove', { clientX: 500 }); assert.equal(f.root.attrs.get('--panel-width'), '320px');
  f.media.matches = false; f.media.dispatchEvent(new Event('change'));
  f.pointer('pointerdown'); f.panel.dispose(); f.panel.dispose();
  assert.equal(f.handle.capture, undefined); assert.equal(f.root.attrs.has('panel-resizing'), false);
});
