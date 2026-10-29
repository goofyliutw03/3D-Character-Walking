import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TapGesture } from '../src/input/TapGesture.ts';
const event = (type, props = {}) => {
  const { at, ...rest } = props;
  const e = Object.assign(new Event(type), rest);
  if (at !== undefined) Object.defineProperty(e, 'timeStamp', { value: at });
  return e;
};
const setup = () => {
  const win = new EventTarget(), doc = Object.assign(new EventTarget(), { hidden: false });
  const canvas = Object.assign(new EventTarget(), { ownerDocument: doc, getBoundingClientRect: () => ({ left: 10, top: 10, right: 310, bottom: 210 }) });
  const taps = [];
  const gesture = new TapGesture(canvas, p => taps.push(p), win);
  const send = (type, props = {}) => canvas.dispatchEvent(event(type, { pointerId: 1, button: 0, clientX: 100, clientY: 100, ...props }));
  return { win, doc, gesture, taps, send };
};
test('mobile 2.2: only single primary short taps commit, not drag-back, long, outside or cancel', () => {
  const { gesture, taps, send } = setup();
  send('pointerdown'); send('pointerup');
  assert.deepEqual(taps, [{ x: 100, y: 100 }]);
  for (const middle of [() => { send('pointermove', { clientX: 130 }); send('pointermove'); }, () => send('pointercancel'), () => send('lostpointercapture')]) {
    send('pointerdown'); middle(); send('pointerup');
  }
  send('pointerdown'); send('pointerup', { clientX: 350 });
  send('pointerdown', { button: 2 }); send('pointerup', { button: 2 });
  send('pointerdown', { at: 100 }); send('pointerup', { at: 500 });
  send('pointerdown', { clientX: 12 }); send('pointermove', { clientX: 9 }); send('pointerup', { clientX: 12 });
  send('pointerdown'); send('pointerleave'); send('pointerup');
  assert.equal(taps.length, 1);
  gesture.dispose(); send('pointerdown'); send('pointerup');
  assert.equal(taps.length, 1);
});
test('mobile 2.2,4.4: multi-touch never becomes tap, resize/blur/hidden cancel, later fresh tap works', () => {
  const { gesture, taps, send, win, doc } = setup();
  send('pointerdown'); send('pointerdown', { pointerId: 2 });
  send('pointerup', { pointerId: 2 }); send('pointerup');
  assert.equal(taps.length, 0);
  for (const type of ['blur', 'resize']) { send('pointerdown'); win.dispatchEvent(event(type)); send('pointerup'); }
  send('pointerdown'); doc.hidden = true; doc.dispatchEvent(event('visibilitychange')); send('pointerup'); doc.hidden = false;
  assert.equal(taps.length, 0);
  send('pointerdown'); send('pointerup'); assert.equal(taps.length, 1);
  gesture.dispose();
});
