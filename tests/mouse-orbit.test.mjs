import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CameraController } from '../src/camera/CameraController.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';
import { MouseOrbitGesture } from '../src/input/MouseOrbitGesture.ts';
import { TapGesture } from '../src/input/TapGesture.ts';
const subject = { x: 10, y: 0, z: 5, heading: 0, height: 1.8, eyeHeight: 1.6, eyeForward: 0.17 };
const setup = () => {
  const camera = new PerspectiveCamera(43, 1, 0.1, 200);
  const controls = new OrbitControls(camera);
  const rig = new CameraController(camera, controls, { constrain() {} }, new FirstPersonCamera());
  rig.select('overview', subject, true);
  return { camera, controls, rig };
};
test('character orbit: smooth translation preserves live orbit offset and finishes after release', () => {
  const { camera, controls, rig } = setup();
  const initial = controls.target.clone(), offset = camera.position.clone().sub(controls.target);
  rig.beginCharacterOrbit(); rig.update(subject, 1 / 60, false);
  assert.ok(controls.target.distanceTo(initial) > 0);
  assert.ok(controls.target.distanceTo(new Vector3(10, 1.17, 5)) > 1);
  assert.ok(camera.position.clone().sub(controls.target).distanceTo(offset) < 1e-8);
  // Simulate a live manual orbit change during centering, without freezing its start frame.
  camera.position.sub(controls.target).applyAxisAngle(new Vector3(0, 1, 0), 0.2).add(controls.target);
  const rotated = camera.position.clone().sub(controls.target);
  rig.endCharacterOrbit(false);
  for (let i = 0; i < 60; i++) rig.update(subject, 1 / 60, false);
  assert.ok(controls.target.distanceTo(new Vector3(10, 1.17, 5)) < 1e-8);
  assert.ok(camera.position.clone().sub(controls.target).distanceTo(rotated) < 1e-8);
  const frozen = controls.target.clone(); rig.update({ ...subject, x: 20 }, 0.05, false);
  assert.ok(controls.target.distanceTo(frozen) < 1e-8);
});
test('character orbit: held center tracks subject, cancel freezes, reduced motion and mode gates work', () => {
  const { rig, controls } = setup();
  rig.beginCharacterOrbit(); rig.update(subject, 0.01, true);
  rig.update({ ...subject, x: 12, height: 1.2 }, 0.05, true);
  assert.ok(controls.target.distanceTo(new Vector3(12, 0.78, 5)) < 1e-8);
  rig.endCharacterOrbit(true); rig.update(subject, 0.05, false);
  assert.equal(controls.target.x, 12);
  for (const mode of ['first-person', 'front', 'fisheye']) {
    rig.select(mode, subject, true); rig.beginCharacterOrbit();
    assert.equal(rig.following, true);
    rig.update(subject, 0.05, true);
    assert.equal(rig.view, mode);
  }
  rig.setFollowing(false, subject, true); rig.beginCharacterOrbit();
  rig.update({ ...subject, x: 22 }, 0.01, true);
  assert.equal(controls.target.x, 22); assert.equal(rig.fisheye, true);
  rig.select('street', subject, true); const fixed = controls.target.clone();
  rig.update(subject, 0.05, false); assert.deepEqual(controls.target, fixed);
});
test('mouse gesture: short click preserved, drag/hold trigger once, cancellation and dispose clear state', () => {
  const win = new EventTarget(), doc = Object.assign(new EventTarget(), { hidden: false });
  const canvas = Object.assign(new EventTarget(), { ownerDocument: doc });
  const calls = [];
  const gesture = new MouseOrbitGesture(canvas, () => calls.push('begin'), cancel => calls.push(cancel), win);
  const send = (type, props = {}, target = canvas) => target.dispatchEvent(Object.assign(new Event(type), { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, clientX: 0, clientY: 0, ...props }));
  send('pointerdown'); gesture.update(0.1); send('pointerup', {}, win); assert.deepEqual(calls, []);
  send('pointerdown'); send('pointermove', { clientX: 9 }); gesture.update(1);
  send('pointerup', {}, win); assert.deepEqual(calls, ['begin', false]);
  for (const type of ['blur', 'resize']) { send('pointerdown'); gesture.update(0.36); send(type, {}, win); }
  send('pointerdown'); gesture.update(0.36); send('pointercancel');
  send('pointerdown', { ctrlKey: true }); gesture.update(1);
  assert.deepEqual(calls, ['begin', false, 'begin', true, 'begin', true, 'begin', true]);
  gesture.dispose(); send('pointerdown'); gesture.update(1); assert.equal(calls.length, 8);
});

test('touch orbit: thresholds, second finger, release order and capture loss preserve gesture boundaries', () => {
  const win = new EventTarget(), doc = Object.assign(new EventTarget(), { hidden: false });
  const canvas = Object.assign(new EventTarget(), { ownerDocument: doc });
  const calls = [];
  const gesture = new MouseOrbitGesture(canvas, () => calls.push('begin'), cancelled => calls.push(cancelled), win);
  const send = (type, id = 1, props = {}, target = canvas) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), {
    pointerId: id, pointerType: 'touch', button: 0, buttons: 1, clientX: 0, clientY: 0, ...props,
  }));
  send('pointerdown'); gesture.update(.35); send('pointermove', 1, { clientX: 8 });
  assert.deepEqual(calls, []);
  send('pointerup', 1, {}, win); send('lostpointercapture'); gesture.update(1);
  assert.deepEqual(calls, []);
  send('pointerdown'); gesture.update(.351); send('pointermove', 1, { clientX: 9 });
  send('pointerup', 1, {}, win); send('lostpointercapture');
  assert.deepEqual(calls, ['begin', false]);
  for (const firstReleased of [1, 2]) {
    send('pointerdown'); send('pointermove', 1, { clientX: 9 }); send('pointerdown', 2);
    assert.deepEqual(calls.slice(-2), ['begin', true]);
    const length = calls.length;
    send('pointerup', firstReleased, {}, win); send('lostpointercapture', firstReleased);
    gesture.update(1); send('pointermove', 3 - firstReleased, { clientX: 30 });
    assert.equal(calls.length, length);
    send('pointerup', 3 - firstReleased, {}, win);
  }
  // Two fingers before activation also suppress hold until both have released.
  send('pointerdown'); send('pointerdown', 2); send('pointerup', 2, {}, win);
  const length = calls.length; gesture.update(1); assert.equal(calls.length, length);
  send('pointerup', 1, {}, win);
  // Unrelated capture loss does not terminate the active pointer.
  send('pointerdown'); gesture.update(.36); send('lostpointercapture', 99);
  assert.equal(calls.at(-1), 'begin'); send('lostpointercapture');
  assert.equal(calls.at(-1), true);
  send('pointerdown'); gesture.update(.36); doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(calls.at(-1), true);
  send('pointerdown'); gesture.update(.36); gesture.cancel();
  assert.equal(calls.at(-1), true);
  assert.equal(send('contextmenu'), false);
  gesture.dispose(); assert.equal(send('contextmenu'), true);
  send('pointerdown'); gesture.update(1); assert.equal(calls.at(-1), true);
});

test('touch orbit + tap: second finger released quickly after active drag never becomes Run', () => {
  const win = new EventTarget(), doc = Object.assign(new EventTarget(), { hidden: false });
  const canvas = Object.assign(new EventTarget(), { ownerDocument: doc, getBoundingClientRect: () => ({ left: 0, top: 0, right: 400, bottom: 600 }) });
  let taps = 0, tap;
  const orbit = new MouseOrbitGesture(canvas, () => tap.cancelCandidate(), () => {}, win);
  tap = new TapGesture(canvas, () => taps++, win);
  const send = (type, id, x = 100) => {
    const props = { pointerId: id, pointerType: 'touch', button: 0, buttons: 1, clientX: x, clientY: 100 };
    canvas.dispatchEvent(Object.assign(new Event(type), props));
    if (type === 'pointerup') win.dispatchEvent(Object.assign(new Event(type), props));
  };
  send('pointerdown', 1); send('pointermove', 1, 120);
  send('pointerdown', 2); send('pointerup', 2); send('pointerup', 1, 120);
  assert.equal(taps, 0);
  send('pointerdown', 3); send('pointerup', 3); assert.equal(taps, 1);
  orbit.dispose(); tap.dispose();
});
