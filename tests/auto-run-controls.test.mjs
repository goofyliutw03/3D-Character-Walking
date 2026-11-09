import test from 'node:test';
import assert from 'node:assert/strict';
import { AutoRunControls } from '../src/input/AutoRunControls.ts';
import { PerspectiveCamera, Vector3 } from 'three';
import { Headlamp } from '../src/scene/Headlamp.ts';
import { CameraController } from '../src/camera/CameraController.ts';
import { FollowCamera } from '../src/camera/FollowCamera.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';
import { CameraInputManager } from '../src/input/CameraInputManager.ts';

test('auto run reverses and caps continuous steering, Ctrl separates orbit from heading', () => {
  const controls = new AutoRunControls();
  controls.setEnabled(true, Math.PI);
  controls.move(0, 0, 1000, false, 0);
  controls.move(250, 0, 1000, false, 30);
  assert.equal(controls.heading, Math.PI / 2);
  controls.move(1000, 0, 1000, false, 60);
  assert.equal(controls.heading, 0);
  controls.move(1000, 0, 1000, false, 90);
  assert.equal(controls.heading, 0);
  controls.move(100, 10, 1000, true, 100);
  assert.equal(controls.heading, 0);
  assert.ok(controls.yaw < 0);
  controls.reverse();
  assert.equal(controls.heading, Math.PI);
  assert.equal(controls.yaw, 0);
  assert.equal(controls.running, true);
  controls.move(100, 0, 1000, false, 500);
  controls.move(100, 0, 1000, false, 520);
  assert.ok(controls.heading < Math.PI);
});

function enter(controls, view) {
  for (let i = 0; i < 10; i++) {
    if (controls.wheel(-240, view) === 'enter') {
      controls.select('first-person');
      return;
    }
  }
  assert.fail('Did not enter first person');
}

test('wheel has separate entry and exit gates, restores source view and running permission', () => {
  for (const view of ['third-person', 'fisheye']) {
    for (const running of [false, true]) {
      const controls = new AutoRunControls();
      controls.setEnabled(running, 1);
      controls.wheel(-10000, view);
      assert.equal(controls.inspecting, false);
      assert.equal(controls.wheel(-1, view), 'enter');
      assert.equal(controls.running, false);
      controls.move(10000, -10000, 1000, false, 0);
      assert.ok(Math.abs(controls.yaw) <= 80 * Math.PI / 180);
      assert.equal(controls.pitch, 60 * Math.PI / 180);
      assert.equal(controls.wheel(60, 'first-person'), undefined);
      assert.equal(controls.wheel(60, 'first-person'), view);
      assert.equal(controls.running, running);
      assert.equal(controls.yaw, 0);
      assert.equal(controls.zoom, 1);
    }
  }
});

test('Stop, disable and loss of focus cannot resurrect an inspection run', () => {
  for (const action of ['stop', 'suspend', 'disable']) {
    const controls = new AutoRunControls();
    controls.setEnabled(true, 0);
    enter(controls, 'fisheye');
    if (action === 'disable') controls.setEnabled(false, 0);
    else controls[action]();
    assert.equal(controls.wheel(120, 'first-person'), 'fisheye');
    assert.equal(controls.running, false);
  }
});

test('headlamp matches final camera forward in first person and restores character pose', () => {
  const lamp = new Headlamp();
  const camera = new PerspectiveCamera();
  const pose = { x: 1, y: 0, z: 2, heading: 1, height: 1.8 };
  camera.position.set(1, 1.7, 2);
  camera.lookAt(5, 3, -4);
  lamp.update(pose, 0, false, camera);
  lamp.group.updateMatrixWorld(true);
  const lampDirection = new Vector3(0, 0, 1).applyQuaternion(lamp.group.quaternion);
  assert.ok(lampDirection.distanceTo(camera.getWorldDirection(new Vector3())) < 1e-8);
  lamp.update(pose, 0, false);
  assert.equal(lamp.group.rotation.y, pose.heading);
  assert.equal(lamp.group.rotation.x, 0);
  lamp.dispose();
});

test('camera applies external offsets and first-person look inside the existing transition', () => {
  const camera = new PerspectiveCamera();
  const orbit = { target: new Vector3(), enabled: true, enableDamping: true, update() {} };
  const rig = new CameraController(camera, orbit, new FollowCamera(), new FirstPersonCamera());
  const subject = { x: 0, y: 0, z: 0, height: 1.8, eyeHeight: 1.6, eyeForward: .17, heading: 0 };
  rig.select('third-person', subject, true);
  const initialRadius = camera.position.distanceTo(orbit.target);
  rig.controlOffsets = { active: true, eye: false, yaw: Math.PI / 2, pitch: 0, zoom: .5 };
  rig.update(subject, .05, true);
  assert.ok(camera.position.x < 0);
  assert.ok(Math.abs(camera.position.distanceTo(orbit.target) - initialRadius / 2) < 1e-8);
  rig.controlOffsets.eye = true;
  rig.controlOffsets.yaw = .5;
  rig.controlOffsets.pitch = .3;
  rig.select('first-person', subject, false);
  for (let i = 0; i < 20; i++) rig.update(subject, .05, false);
  const direction = camera.getWorldDirection(new Vector3());
  assert.ok(Math.abs(direction.y - Math.sin(.3)) < 1e-8);
  assert.ok(Math.abs(Math.atan2(direction.x, direction.z) - .5) < 1e-8);
});

test('Y is canvas-focused, unmodified and ignores repeat; F5 passes through', t => {
  const win = new EventTarget();
  const canvas = new EventTarget();
  canvas.ownerDocument = new EventTarget();
  canvas.ownerDocument.activeElement = canvas;
  const originalWindow = globalThis.window;
  globalThis.window = win;
  let toggles = 0;
  const gesture = new CameraInputManager(canvas, {
    mode: () => 'standard', clearGesture() {}, wheelEnabled: () => false, reverseEnabled: () => false,
    move() {}, wheel() {}, reverse() {}, reset() {}, suspend() {}, toggle() { toggles++; },
  });
  t.after(() => { gesture.dispose(); globalThis.window = originalWindow; });
  const press = options => canvas.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { code: 'KeyY', ...options }));
  assert.equal(press({ code: 'F5' }), true);
  assert.equal(toggles, 0);
  assert.equal(press({}), false);
  assert.equal(toggles, 1);
  assert.equal(press({ repeat: true }), false);
  assert.equal(toggles, 1);
  for (const modifier of ['ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'isComposing']) {
    assert.equal(press({ [modifier]: true }), true);
    assert.equal(toggles, 1);
  }
  canvas.ownerDocument.activeElement = {};
  assert.equal(press({}), true);
  assert.equal(toggles, 1);
});


test('camera mode transitions clear partial wheel exits and preserve running permission', async () => {
  const { CameraModeManager } = await import('../src/camera/CameraModeManager.ts');
  const camera = new PerspectiveCamera();
  const orbit = { target: new Vector3(), enabled: true, enableDamping: true, update() {} };
  const rig = new CameraController(camera, orbit, new FollowCamera(), new FirstPersonCamera());
  const run = new AutoRunControls();
  const subject = { x: 0, y: 0, z: 0, height: 1.8, eyeHeight: 1.6, eyeForward: .17, heading: 0 };
  let clears = 0;
  const modes = new CameraModeManager(rig, run, () => subject, () => true, camera, () => clears++);
  for (const view of ['overview', 'street', 'overhead', 'front', 'character-overhead', 'low-angle', 'first-person']) {
    run.setEnabled(true, 0);
    modes.select(view);
    assert.equal(modes.inputMode, 'standard');
    assert.equal(modes.wheelEnabled, false);
    assert.equal(run.running, true);
    assert.equal(modes.groundTapEnabled, true);
  }
  for (const view of ['third-person', 'fisheye']) {
    modes.select(view);
    assert.equal(modes.inputMode, 'running-orbit');
    assert.equal(modes.followingLocked, true);
    assert.equal(modes.groundTapEnabled, false);
    modes.wheel(-10000);
    modes.select(modes.wheel(-1));
    assert.equal(modes.inputMode, 'inspection');
    assert.equal(modes.groundTapEnabled, false);
    assert.equal(run.running, false);
    assert.equal(modes.wheel(60), undefined);
    modes.resetGestures();
    assert.equal(modes.wheel(60), undefined);
    modes.select(modes.wheel(60));
    assert.equal(rig.view, view);
    assert.equal(run.running, true);
  }
  assert.ok(clears > 0);
  modes.select('front');
  assert.equal(run.running, true);
  assert.equal(modes.groundTapEnabled, true);
  modes.beginDestination();
  assert.equal(run.active, false);
  assert.equal(run.running, false);
});

test('input reset drops stale pointer displacement and resynchronizes Ctrl', t => {
  const win = new EventTarget();
  const canvas = new EventTarget();
  canvas.ownerDocument = new EventTarget();
  canvas.ownerDocument.activeElement = canvas;
  const originalWindow = globalThis.window;
  globalThis.window = win;
  const moves = [];
  const input = new CameraInputManager(canvas, {
    mode: () => 'running-orbit', clearGesture: () => input.reset(),
    wheelEnabled: () => true, reverseEnabled: () => true,
    move: (...args) => moves.push(args), wheel() {}, reverse() {}, reset() {}, suspend() {}, toggle() {},
  });
  t.after(() => { input.dispose(); globalThis.window = originalWindow; });
  const pointer = (x, ctrl = false) => canvas.dispatchEvent(Object.assign(new Event('pointermove'), {
    pointerType: 'mouse', clientX: x, clientY: 0, ctrlKey: ctrl,
  }));
  pointer(10); pointer(20);
  assert.equal(moves.length, 1);
  input.reset(); pointer(1000); pointer(1001);
  assert.equal(moves[1][0], 1);
  win.dispatchEvent(Object.assign(new Event('keydown'), { code: 'ControlLeft' }));
  pointer(2000, true); pointer(2001, true);
  assert.equal(moves[2][0], 1);
  assert.equal(moves[2][2], true);
  input.dispose(); pointer(3000);
  assert.equal(moves.length, 3);
});
