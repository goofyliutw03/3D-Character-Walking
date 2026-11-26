import test from 'node:test';
import assert from 'node:assert/strict';
import { CameraInputManager } from '../src/input/CameraInputManager.ts';

function fixture(t, initialMode = 'running-orbit') {
  const win = new EventTarget(), doc = new EventTarget(), canvas = new EventTarget();
  const saved = { window: globalThis.window, PointerEvent: globalThis.PointerEvent };
  globalThis.window = win;
  globalThis.PointerEvent = class extends Event {
    constructor(type, values) { super(type, values); Object.assign(this, { pointerId: values.pointerId, pointerType: values.pointerType }); }
  };
  canvas.ownerDocument = doc;
  canvas.focus = () => { doc.activeElement = canvas; };
  canvas.setPointerCapture = () => {};
  let mode = initialMode;
  const moves = [], wheels = [];
  const input = new CameraInputManager(canvas, {
    mode: () => mode, clearGesture: () => input.reset(), wheelEnabled: () => true,
    reverseEnabled: () => false, move: (...values) => moves.push(values), wheel: value => wheels.push(value),
    reverse() {}, reset() {}, suspend() {}, toggle() {},
  });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    input.dispose(); Object.assign(globalThis, saved);
  };
  t.after(close);
  const send = (type, id, x, y = 100) => canvas.dispatchEvent(Object.assign(new Event(type, { cancelable: true }),
    { pointerType: 'touch', pointerId: id, clientX: x, clientY: y, button: 0 }));
  return { canvas, doc, input, moves, wheels, send, close, setMode(value) { mode = value; input.reset(); } };
}
const settle = () => new Promise(resolve => setTimeout(resolve, 55));

test('touch steers with one finger, orbits with two, resets after lifting and suppresses three fingers', async t => {
  const f = fixture(t);
  f.send('pointerdown', 1, 100);
  f.send('pointermove', 1, 110);
  assert.equal(f.moves[0][0], 10);
  assert.equal(f.moves[0][2], false);
  f.send('pointerdown', 2, 200);
  f.send('pointermove', 1, 130);
  f.send('pointermove', 2, 220);
  assert.equal(f.moves[1][0], 20);
  assert.equal(f.moves[1][2], true);
  assert.equal(f.wheels.length, 0);
  f.send('pointerup', 2, 220);
  f.send('pointermove', 1, 133);
  assert.equal(f.moves[2][0], 3);
  f.send('pointerdown', 2, 220);
  f.send('pointerdown', 3, 260);
  f.send('pointermove', 1, 170);
  f.send('pointerup', 3, 260);
  f.send('pointermove', 1, 175);
  await settle();
  assert.equal(f.moves.length, 3);
  assert.equal(f.wheels.length, 0);
});

test('stationary pinch owns multi-touch without swallowing a single ground tap, including a fixed finger', async t => {
  const f = fixture(t, 'standard');
  assert.equal(f.send('pointerdown', 1, 100), true);
  assert.equal(f.send('pointerup', 1, 100), true);
  f.send('pointerdown', 1, 100);
  assert.equal(f.send('pointerdown', 2, 200), false);
  f.send('pointermove', 2, 230);
  await settle();
  assert.deepEqual(f.wheels, [-180]);
  assert.equal(f.moves.length, 0);
  assert.equal(f.send('pointerup', 2, 230), false);
  assert.equal(f.send('pointerup', 1, 100), false);
});

test('mode reset, cancellation, visibility, blur and disposal clear pending pinch and stale fingers', async t => {
  for (const reset of ['mode', 'cancel', 'visibility', 'blur', 'dispose']) {
    const f = fixture(t);
    f.send('pointerdown', 1, 100);
    f.send('pointerdown', 2, 200);
    f.send('pointermove', 2, 240);
    if (reset === 'mode') f.setMode('inspection');
    if (reset === 'cancel') f.send('pointercancel', 2, 240);
    if (reset === 'visibility') { f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange')); }
    if (reset === 'blur') f.canvas.dispatchEvent(new Event('blur'));
    if (reset === 'dispose') f.input.dispose();
    await settle();
    f.send('pointermove', 1, 150);
    assert.equal(f.wheels.length, 0, reset);
    assert.equal(f.moves.length, 0, reset);
    f.close();
  }
});
