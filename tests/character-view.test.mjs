import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Box3, Group } from 'three';
import { Character } from '../src/character/Character.ts';

test('1.1–1.3: one articulated prototype changes appearance without moving root', () => {
  const character = new Character();
  const parent = new Group();
  parent.add(character.root);
  character.root.position.set(2, 0.32, 7);
  character.root.rotation.y = 1;
  const adultHeight = new Box3().setFromObject(character.root).getSize(new Group().position).y;
  character.setVariant('woman');
  assert.ok(character.height < adultHeight);
  character.setVariant('child');
  assert.ok(character.height < 1.3);
  assert.deepEqual(character.root.position.toArray(), [2, 0.32, 7]);
  assert.equal(character.root.rotation.y, 1);
  assert.equal(parent.children.length, 1);
  const state = { x: 2, y: 0.32, z: 7, heading: 1, speed: 1.8, grounded: true, action: 'walk' };
  character.update(state, 0.1);
  const walkPose = character.root.getObjectByName('left-leg').rotation.x;
  character.update({ ...state, speed: 0, action: 'idle' }, 0.1);
  assert.notEqual(walkPose, 0);
  assert.equal(character.root.getObjectByName('left-leg').rotation.x, 0);
  character.update({ ...state, grounded: false, action: 'jump' }, 0.1);
  assert.notEqual(character.root.getObjectByName('left-leg').rotation.x, walkPose);
  character.dispose();
});

test('6.2: geometry/material resources dispose once and detach', () => {
  const character = new Character();
  new Group().add(character.root);
  const geometry = new Set();
  const materials = new Set();
  character.root.traverse(object => {
    if (object.isMesh) { geometry.add(object.geometry); materials.add(object.material); }
  });
  let disposed = 0;
  [...geometry, ...materials].forEach(resource => resource.addEventListener('dispose', () => disposed++));
  character.setShadows(false);
  character.root.traverse(object => { if (object.isMesh) assert.equal(object.castShadow, false); });
  character.dispose();
  character.dispose();
  assert.equal(disposed, geometry.size + materials.size);
  assert.equal(character.root.parent, null);
});
