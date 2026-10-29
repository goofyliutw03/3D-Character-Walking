import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InputManager } from '../src/input/InputManager.ts';

const event = (type, props = {}) => Object.assign(new Event(type, { cancelable: true }), props);
const setup = () => {
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { hidden: false });
  return { win, doc, input: new InputManager(win, doc) };
};
class Button extends EventTarget {
  setPointerCapture() {}
}
test('mobile 4.1–4.2: manual and lifecycle notifications cancel a navigation consumer', () => {
  const win = new EventTarget(), doc = Object.assign(new EventTarget(), { hidden: false });
  let active = true;
  const input = new InputManager(win, doc, () => { active = false; });
  const button = new Button(); input.bindDirection(button, 'right');
  for (const action of [
    () => win.dispatchEvent(event('keydown', { code: 'KeyW', repeat: false })),
    () => button.dispatchEvent(event('pointerdown', { pointerId: 7, button: 0 })),
    () => button.dispatchEvent(event('click', { detail: 0 })),
    () => input.jump(), () => input.stop(), () => input.setRun(true),
    () => win.dispatchEvent(event('blur')),
    () => { doc.hidden = true; doc.dispatchEvent(event('visibilitychange')); },
  ]) { active = true; action(); assert.equal(active, false); }
  input.dispose();
});
test('expressions 2.4: entering an editor clears held keys, latched movement, run and jump', () => {
  const { win, doc, input } = setup();
  const up = new Button();
  input.bindDirection(up, 'forward');
  up.dispatchEvent(event('click', { detail: 0 }));
  input.setRun(true);
  win.dispatchEvent(event('keydown', { code: 'KeyD', repeat: false }));
  input.jump();
  const focus = event('focusin');
  Object.defineProperty(focus, 'target', { value: { closest: () => ({}) } });
  doc.dispatchEvent(focus);
  assert.deepEqual(input.sample(), { x: 0, z: 0, run: false, jump: false });
  const composing = event('keydown', { code: 'Space', isComposing: true });
  win.dispatchEvent(composing);
  assert.equal(composing.defaultPrevented, false);
  assert.equal(input.sample().jump, false);
  input.setRun(true);
  const buttonFocus = event('focusin');
  Object.defineProperty(buttonFocus, 'target', { value: { closest: selector => selector.includes('button') ? {} : null } });
  doc.dispatchEvent(buttonFocus);
  assert.equal(input.running, true);
  input.dispose();
});
test('4.3: keyboard movement, running, blur and hidden reset', () => {
  const { win, doc, input } = setup();
  win.dispatchEvent(event('keydown', { code: 'KeyW', repeat: false }));
  win.dispatchEvent(event('keydown', { code: 'ShiftLeft', repeat: false }));
  assert.deepEqual(input.sample(), { x: 0, z: -1, run: true, jump: false });
  win.dispatchEvent(new Event('blur'));
  assert.equal(input.sample().z, 0);
  input.setRun(true);
  win.dispatchEvent(event('keydown', { code: 'KeyD', repeat: false }));
  doc.hidden = true;
  doc.dispatchEvent(new Event('visibilitychange'));
  assert.deepEqual(input.sample(), { x: 0, z: 0, run: false, jump: false });
  input.dispose();
});
test('2.5, 4.4: one jump pulse, repeat ignored and editable keys left alone', () => {
  const { win, input } = setup();
  win.dispatchEvent(event('keydown', { code: 'Space', repeat: false }));
  assert.equal(input.sample().jump, true);
  win.dispatchEvent(event('keydown', { code: 'Space', repeat: true }));
  assert.equal(input.sample().jump, false);
  const editing = event('keydown', { code: 'KeyW', repeat: false });
  Object.defineProperty(editing, 'target', { value: { closest: () => ({}) } });
  win.dispatchEvent(editing);
  assert.equal(input.sample().z, 0);
  assert.equal(editing.defaultPrevented, false);
  input.dispose();
});
test('4.1–4.2: pointer IDs cancel separately and keyboard activation can Stop', () => {
  const { win, input } = setup();
  const up = new Button();
  const right = new Button();
  input.bindDirection(up, 'forward');
  input.bindDirection(right, 'right');
  up.dispatchEvent(event('pointerdown', { pointerId: 1, button: 0 }));
  right.dispatchEvent(event('pointerdown', { pointerId: 2, button: 0 }));
  assert.equal(input.sample().x, 1);
  assert.equal(input.sample().z, -1);
  up.dispatchEvent(event('pointercancel', { pointerId: 1 }));
  assert.equal(input.sample().z, 0);
  assert.equal(input.sample().x, 1);
  right.dispatchEvent(event('lostpointercapture', { pointerId: 2 }));
  assert.equal(input.sample().x, 0);
  up.dispatchEvent(event('click', { detail: 0 }));
  assert.equal(input.sample().z, -1);
  input.stop();
  assert.equal(input.sample().z, 0);
  input.dispose();
  win.dispatchEvent(event('keydown', { code: 'KeyW', repeat: false }));
  assert.equal(input.sample().z, 0);
});
