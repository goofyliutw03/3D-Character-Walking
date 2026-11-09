import test from 'node:test';
import assert from 'node:assert/strict';
import { Points, SpotLight, Vector3 } from 'three';
import { createCave } from '../src/scene/CaveScene.ts';
import { Headlamp } from '../src/scene/Headlamp.ts';

test('headlamp follows the player and applies beam settings atomically', () => {
  const lamp = new Headlamp();
  try {
    const light = lamp.group.children.find(child => child instanceof SpotLight);
    lamp.update({ x: 2, y: 1, z: 3, heading: Math.PI / 2, height: 2 }, .05, false);
    const origin = lamp.group.getWorldPosition(new Vector3());
    const direction = light.target.getWorldPosition(new Vector3()).sub(origin);
    assert.deepEqual(origin.toArray(), [2.25, 2.8, 3]);
    assert.ok(direction.distanceTo(new Vector3(1, 0, 0)) < 1e-8);
    assert.equal(lamp.configure({ distance: 14, fov: 60, color: '#88ccff', intensity: 120, softness: .25 }), true);
    assert.equal(light.distance, 14);
    assert.ok(Math.abs(light.angle - Math.PI / 6) < 1e-8);
    assert.equal(light.color.getHexString(), '88ccff');
    assert.equal(light.intensity, 120);
    assert.equal(light.penumbra, .25);
    assert.equal(lamp.configure({ distance: 6, density: 97 }), false);
    assert.equal(light.distance, 14);
  } finally {
    lamp.dispose();
  }
});

test('cave headlamp bounds dust, respects reduced motion, and releases scene resources', () => {
  const cave = createCave();
  const lamp = cave.headlamp;
  const dust = lamp.group.children.find(child => child instanceof Points);
  const pose = { x: 0, y: 0, z: 0, heading: 0, height: 2 };
  const disposed = [];
  dust.geometry.addEventListener('dispose', () => disposed.push('geometry'));
  dust.material.addEventListener('dispose', () => disposed.push('material'));
  try {
    assert.equal(lamp.group.parent, cave.scene);
    assert.equal(lamp.group.userData.cameraObstruction, false);
    assert.equal(lamp.getSettings().enabled, true);
    lamp.configure({ density: 96, speed: 2 });
    assert.equal(dust.geometry.drawRange.count, 96);
    assert.equal(dust.geometry.getAttribute('position').count, 96);
    lamp.update(pose, .05, false);
    assert.equal(dust.material.uniforms.clock.value, .1);
    lamp.update(pose, .05, true);
    assert.equal(dust.material.uniforms.clock.value, .1);
    assert.equal(dust.visible, false);
    assert.equal(lamp.group.visible, true);
    lamp.update(pose, .05, false);
    assert.equal(dust.visible, true);
    lamp.configure({ dust: false });
    assert.equal(dust.visible, false);
    lamp.configure({ enabled: false });
    assert.equal(lamp.group.visible, false);
  } finally {
    cave.dispose();
  }
  assert.equal(lamp.group.parent, null);
  assert.deepEqual(disposed, ['geometry', 'material']);
});
