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
