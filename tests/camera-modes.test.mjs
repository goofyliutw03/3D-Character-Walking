import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CameraController } from '../src/camera/CameraController.ts';
import { FollowCamera } from '../src/camera/FollowCamera.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';

const subject = { x: 0, y: 0.075, z: 5, heading: 0, speed: 0, grounded: true, action: 'idle', height: 1.8, eyeHeight: 1.58, eyeForward: 0.17 };
const setup = () => {
  const camera = new PerspectiveCamera(43, 1.5, 0.1, 200);
  const controls = { target: new Vector3(), enabled: true, enableDamping: true, update() {} };
  const rig = new CameraController(camera, controls, new FollowCamera(), new FirstPersonCamera());
  rig.select('overview', subject, true);
  return { rig, camera, controls };
};
test('1.1–1.4: front, overhead and low frames follow heading and character height', () => {
  const { rig, camera, controls } = setup();
  rig.select('front', subject, true);
  assert.ok(camera.position.z > subject.z);
  assert.ok(camera.getWorldDirection(new Vector3()).z < 0);
  rig.select('front', { ...subject, heading: Math.PI / 2 }, true);
  assert.ok(camera.position.x > subject.x);
  rig.select('character-overhead', subject, true);
  assert.ok(camera.position.y > subject.y + 10);
  assert.ok(camera.getWorldDirection(new Vector3()).y < -0.99);
  rig.select('low-angle', subject, true);
  assert.ok(camera.position.y < controls.target.y);
  assert.ok(camera.getWorldDirection(new Vector3()).y > 0);
  rig.update({ ...subject, y: 1, height: 1.15 }, 1 / 60, true);
  assert.ok(Math.abs(camera.position.y - 1.35) < 1e-8);
});
test('2.1–2.2: follow can freeze and resume without changing selected view', () => {
  const { rig, camera, controls } = setup();
  rig.select('front', subject, true);
  rig.setFollowing(false, subject, true);
  const frozen = camera.position.clone();
  rig.update({ ...subject, x: 10 }, 1 / 60, false);
  assert.equal(rig.view, 'front');
  assert.equal(rig.following, false);
  assert.equal(controls.enabled, true);
  assert.deepEqual(camera.position.toArray(), frozen.toArray());
  rig.setFollowing(true, { ...subject, x: 10 }, true);
  assert.equal(rig.view, 'front');
  assert.equal(controls.enabled, false);
  assert.equal(camera.position.x, 10);
});
test('2.3: front-to-back transition keeps camera outside the character center', () => {
  const { rig, camera, controls } = setup();
  rig.select('front', subject, true);
  rig.select('third-person', subject, false);
  for (let i = 0; i < 60; i++) {
    rig.update(subject, 1 / 60, false);
    assert.ok(camera.position.distanceTo(controls.target) > 3);
  }
  assert.equal(rig.transitioning, false);
  assert.ok(camera.position.z < subject.z);
});
test('2.1, 2.3: static view follow preserves orbit composition and reduced motion snaps', () => {
  const { rig, camera, controls } = setup();
  rig.setFollowing(true, subject, true);
  const initial = camera.position.clone();
  rig.update({ ...subject, x: 2, z: 8 }, 1 / 60, false);
  assert.equal(rig.view, 'overview');
  assert.equal(camera.position.x, initial.x + 2);
  assert.equal(camera.position.z, initial.z + 3);
  assert.equal(controls.enabled, true);
  rig.select('low-angle', subject, false);
  rig.update(subject, 1 / 60, true);
  assert.equal(rig.transitioning, false);
  assert.ok(Math.abs(camera.position.y - 0.425) < 1e-8);
});
test('2.4, 3.3, 4.1: lens changes, first-person visibility and fixed eye anchor remain correct', () => {
  const { rig, camera } = setup();
  rig.select('first-person', subject, false);
  assert.equal(camera.fov, 70);
  assert.equal(rig.characterVisible, false);
  rig.setFollowing(false, subject, true);
  assert.equal(rig.following, true);
  rig.update({ ...subject, y: 1 }, 1 / 60, false);
  assert.ok(Math.abs(camera.position.y - 2.58) < 1e-8);
  rig.select('fisheye', subject, true);
  assert.equal(rig.fisheye, true);
  assert.equal(rig.characterVisible, true);
  assert.equal(camera.fov, 160);
  rig.select('third-person', subject, true);
  assert.equal(camera.fov, 43);
  assert.equal(camera.near, 0.1);
  assert.equal(rig.fisheye, false);
});

test('2.1: real OrbitControls must not lift a frozen low-angle camera', () => {
  const camera = new PerspectiveCamera(43, 1.5, 0.1, 200);
  const controls = new OrbitControls(camera);
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  const rig = new CameraController(camera, controls, new FollowCamera(), new FirstPersonCamera());
  rig.select('low-angle', subject, true);
  const before = camera.position.clone();
  rig.setFollowing(false, subject, true);
  rig.update(subject, 1 / 60, false);
  assert.ok(before.distanceTo(camera.position) < 1e-8);
});
