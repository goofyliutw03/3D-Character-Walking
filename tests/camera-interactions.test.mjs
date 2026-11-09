import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, PerspectiveCamera, Vector3 } from 'three';
import { CameraController } from '../src/camera/CameraController.ts';
import { CameraModeManager } from '../src/camera/CameraModeManager.ts';
import { CameraObstruction } from '../src/camera/CameraObstruction.ts';
import { FollowCamera } from '../src/camera/FollowCamera.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';
import { AutoRunControls } from '../src/input/AutoRunControls.ts';
import { CameraInputManager } from '../src/input/CameraInputManager.ts';
import { sceneControlPolicy } from '../src/scene/SceneControlPolicy.ts';

const views = ['overview', 'street', 'overhead', 'third-person', 'fisheye', 'front', 'character-overhead', 'low-angle', 'first-person'];
const spaces = ['open', 'semi-open', 'semi-enclosed', 'transition', 'enclosed', 'underwater'];
function fixture(immediate = false) {
  const camera = new PerspectiveCamera();
  const rendered = new PerspectiveCamera();
  const orbit = { target: new Vector3(), enabled: true, enableDamping: true, update() {} };
  const rig = new CameraController(camera, orbit, new FollowCamera(), new FirstPersonCamera());
  const run = new AutoRunControls();
  const subject = { x: 0, y: 0, z: 0, height: 1.8, eyeHeight: 1.6, eyeForward: .17, heading: 0 };
  const modes = new CameraModeManager(rig, run, () => subject, () => immediate, rendered, () => {});
  return { camera, rendered, orbit, rig, run, subject, modes };
}

test('all directed view pairs stay finite across running states, follow, interruption and obstruction modes', () => {
  let cases = 0;
  for (const source of views) for (const destination of views)
    for (const state of ['off', 'running', 'paused']) for (const follow of [false, true])
      for (const immediate of [false, true]) for (const obstructionMode of ['zoom', 'transparent', 'wireframe', 'xray']) {
        const { camera, rendered, orbit, rig, run, subject, modes } = fixture(immediate);
        const obstruction = new CameraObstruction(new Group());
        obstruction.setMode(obstructionMode);
        run.setEnabled(state !== 'off', 0);
        if (state === 'paused') run.suspend();
        modes.select(source);
        rig.setFollowing(follow, subject, immediate);
        rig.update(subject, .05, immediate);
        rendered.copy(camera);
        modes.select(destination);
        for (let frame = 0; frame < 20; frame++) {
          Object.assign(rig.controlOffsets, { active: run.enabled, eye: run.inspecting, yaw: run.yaw, pitch: run.pitch, zoom: run.zoom });
          rig.update(subject, .05, immediate);
          obstruction.update(camera, rendered, orbit.target, subject, .05, immediate, rig.characterVisible,
            new Box3(new Vector3(-11, .2, -16), new Vector3(11, 4.75, 16)));
          assert.ok([...rendered.position.toArray(), ...rendered.quaternion.toArray()].every(Number.isFinite));
        }
        assert.equal(rig.view, destination);
        assert.equal(rig.transitioning, false);
        assert.equal(rig.characterVisible, destination !== 'first-person');
        assert.equal(run.running, state === 'running');
        obstruction.dispose();
        cases++;
      }
  assert.equal(cases, 3888);
});

test('all space policies clear inspection on replacement and allow explicit capability overrides', () => {
  for (const space of spaces) {
    const { run, modes } = fixture();
    modes.select('fisheye');
    run.setEnabled(true, 0);
    modes.wheel(-10000);
    modes.select(modes.wheel(-1));
    assert.equal(run.inspecting, true);
    modes.configureScene(sceneControlPolicy(space));
    assert.equal(run.active, false);
    assert.equal(run.inspecting, false);
    assert.equal(run.zoom, 1);
    assert.equal(modes.inputMode, 'standard');
    assert.equal(modes.groundTapEnabled, space !== 'underwater');
    assert.equal(modes.autoRunEnabled, space !== 'underwater');
    assert.equal(modes.wheelEnabled, false);
    modes.select('third-person');
    modes.configureScene(sceneControlPolicy(space, { autoRun: true, groundNavigation: true, framing: 'indoor', constrainCamera: true }));
    run.setEnabled(true, 0);
    assert.equal(modes.inputMode, 'running-orbit');
    modes.beginDestination();
    assert.equal(modes.groundTapEnabled, true);
  }
});

test('input focus, Ctrl, repeat, wheel modifiers and lifecycle consume each action once', t => {
  const originalWindow = globalThis.window;
  const win = new EventTarget();
  globalThis.window = win;
  const canvas = new EventTarget();
  const doc = new EventTarget();
  canvas.ownerDocument = doc;
  canvas.focus = () => { doc.activeElement = canvas; };
  canvas.focus();
  const counts = { move: 0, wheel: 0, reset: 0, suspend: 0, reverse: 0 };
  const input = new CameraInputManager(canvas, {
    mode: () => 'running-orbit', clearGesture: () => input.reset(),
    wheelEnabled: () => true, reverseEnabled: () => true,
    move: () => counts.move++, wheel: () => counts.wheel++, reset: () => counts.reset++,
    reverse: () => counts.reverse++, suspend: () => counts.suspend++, toggle() {},
  });
  t.after(() => { input.dispose(); globalThis.window = originalWindow; });
  const send = (target, type, values = {}) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), values));
  const pointer = x => send(canvas, 'pointermove', { pointerType: 'mouse', clientX: x, clientY: 0, ctrlKey: false });
  pointer(0); pointer(1);
  assert.equal(counts.move, 1);
  doc.activeElement = {};
  pointer(50); pointer(100);
  assert.equal(counts.move, 1);
  canvas.focus();
  pointer(200); pointer(201);
  assert.equal(counts.move, 2);
  for (const code of ['ControlLeft', 'ControlRight']) {
    send(win, 'keydown', { code });
    pointer(400); pointer(401);
    send(win, 'keyup', { code });
  }
  assert.equal(counts.move, 4);
  for (const repeat of [false, true]) assert.equal(send(canvas, 'keydown', { code: 'F1', repeat }), false);
  assert.equal(counts.reset, 1);
  assert.equal(send(canvas, 'wheel', { deltaY: 100, ctrlKey: true }), true);
  assert.equal(send(canvas, 'wheel', { deltaY: 100, deltaMode: 0 }), false);
  assert.equal(counts.wheel, 1);
  send(canvas, 'pointerdown', { pointerType: 'mouse', button: 1 });
  assert.equal(counts.reverse, 1);
  const canvasBlur = Object.defineProperty(new Event('blur'), 'target', { value: canvas });
  send(canvas, 'blur');
  win.dispatchEvent(canvasBlur);
  assert.equal(counts.suspend, 0);
  send(win, 'blur');
  doc.hidden = true;
  send(doc, 'visibilitychange');
  assert.equal(counts.suspend, 2);
  input.dispose();
  send(canvas, 'wheel', { deltaY: 100 });
  assert.equal(counts.wheel, 1);
});
