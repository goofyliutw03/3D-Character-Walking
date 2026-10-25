import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from 'three';
import { FollowCamera } from '../src/camera/FollowCamera.ts';

test('5.1, 5.3: immediate framing follows position and heading; smooth update converges', () => {
  const follow = new FollowCamera();
  const camera = new PerspectiveCamera();
  const target = new Vector3();
  const state = { x: 2, y: 0.32, z: 5, heading: 0, speed: 1.8, grounded: true, action: 'walk' };
  follow.update(camera, target, state, 1.8, 1 / 60, true);
  assert.equal(target.x, 2);
  assert.equal(target.z, 5);
  assert.ok(camera.position.z < 5);
  const startX = camera.position.x;
  follow.update(camera, target, { ...state, x: 12 }, 1.8, 1 / 60, false);
  assert.ok(camera.position.x > startX && camera.position.x < 12);
  follow.update(camera, target, { ...state, x: 12, heading: Math.PI / 2 }, 1.8, 1 / 60, true);
  assert.equal(target.x, 12);
  assert.ok(camera.position.x < 12);
  assert.ok(Math.abs(camera.position.z - 5) < 1e-8);
});

test('5.1: obstruction shortens follow distance before camera enters scenery', () => {
  const wall = new Mesh(new BoxGeometry(4, 8, 1), new MeshBasicMaterial());
  wall.position.set(0, 3, -3);
  wall.updateMatrixWorld(true);
  const camera = new PerspectiveCamera();
  const follow = new FollowCamera([wall]);
  const target = new Vector3();
  follow.update(camera, target, { x: 0, y: 0, z: 0, heading: 0, speed: 0, grounded: true, action: 'idle' }, 1.8, 1 / 60, true);
  assert.ok(camera.position.z > -2.5);
  assert.ok(camera.position.z < 0);
  wall.geometry.dispose(); wall.material.dispose();
});
