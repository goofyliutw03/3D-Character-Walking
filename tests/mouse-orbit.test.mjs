import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CameraController } from '../src/camera/CameraController.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';
import { MouseOrbitGesture } from '../src/input/MouseOrbitGesture.ts';
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
test('mouse gesture: short click and touch preserved, drag/hold trigger once, cancellation and dispose clear state', () => {
  const win = new EventTarget(), doc = Object.assign(new EventTarget(), { hidden: false });
  const canvas = Object.assign(new EventTarget(), { ownerDocument: doc });
  const calls = [];
  const gesture = new MouseOrbitGesture(canvas, () => calls.push('begin'), cancel => calls.push(cancel), win);
  const send = (type, props = {}, target = canvas) => target.dispatchEvent(Object.assign(new Event(type), { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, clientX: 0, clientY: 0, ...props }));
  send('pointerdown'); gesture.update(0.1); send('pointerup', {}, win); assert.deepEqual(calls, []);
  send('pointerdown', { pointerType: 'touch' }); gesture.update(1); assert.deepEqual(calls, []);
  send('pointerdown'); send('pointermove', { clientX: 9 }); gesture.update(1);
  send('pointerup', {}, win); assert.deepEqual(calls, ['begin', false]);
  for (const type of ['blur', 'resize']) { send('pointerdown'); gesture.update(0.36); send(type, {}, win); }
  send('pointerdown'); gesture.update(0.36); send('pointercancel');
  send('pointerdown', { ctrlKey: true }); gesture.update(1);
  assert.deepEqual(calls, ['begin', false, 'begin', true, 'begin', true, 'begin', true]);
  gesture.dispose(); send('pointerdown'); gesture.update(1); assert.equal(calls.length, 8);
});
