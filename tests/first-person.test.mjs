import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { Character } from '../src/character/Character.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';

test('5.4–5.5: First-person view uses actual eye anchor, level facing and 70-degree FOV', () => {
  const firstPerson = new FirstPersonCamera();
  const camera = new PerspectiveCamera(43, 1.5, 0.1, 200);
  const target = new Vector3();
  const actor = new Character();
  const state = { x: 2, y: 0.32, z: 5, heading: Math.PI / 2, speed: 0, grounded: true, action: 'idle' };
  firstPerson.update(camera, target, state, actor.eyeHeight, actor.eyeForward);
  assert.ok(Math.abs(camera.position.y - (0.32 + 1.58)) < 1e-10);
  assert.ok(Math.abs(camera.position.x - 2.17) < 1e-10);
  assert.equal(camera.fov, 70);
  assert.equal(camera.near, 0.04);
  const direction = camera.getWorldDirection(new Vector3());
  assert.ok(direction.x > 0.9999);
  assert.ok(Math.abs(direction.y) < 1e-10);
  assert.ok(Math.abs(direction.z) < 1e-10);
  actor.dispose();
});

test('5.4: variant changes and airborne displacement update eye-level view immediately with fixed FOV', () => {
  const firstPerson = new FirstPersonCamera();
  const camera = new PerspectiveCamera();
  const target = new Vector3();
  const actor = new Character();
  const state = { x: 0, y: 0, z: 5, heading: Math.PI, speed: 0, grounded: true, action: 'idle' };
  const heights = [];
  for (const variant of ['man', 'woman', 'child']) {
    actor.setVariant(variant);
    firstPerson.update(camera, target, state, actor.eyeHeight, actor.eyeForward);
    heights.push(camera.position.y);
    assert.ok(camera.getWorldDirection(new Vector3()).z < -0.9999);
    firstPerson.update(camera, target, { ...state, x: 3, y: 1 }, actor.eyeHeight, actor.eyeForward);
    assert.equal(camera.position.x, 3);
    assert.ok(Math.abs(camera.position.y - heights.at(-1) - 1) < 1e-10);
  }
  assert.ok(heights[0] > heights[1] && heights[1] > heights[2]);
  assert.ok(Math.abs(heights[2] - 1.15 * 1.58 / 1.8) < 1e-10);
  actor.dispose();
});

test('5.6: exit restores external-view projection', () => {
  const firstPerson = new FirstPersonCamera();
  const camera = new PerspectiveCamera(43, 1.5, 0.1, 200);
  firstPerson.update(camera, new Vector3(), { x: 0, y: 0, z: 0, heading: 0 }, 1.58, 0.17);
  firstPerson.restoreProjection(camera);
  assert.equal(camera.fov, 43);
  assert.equal(camera.near, 0.1);
  assert.equal(camera.aspect, 1.5);
});
