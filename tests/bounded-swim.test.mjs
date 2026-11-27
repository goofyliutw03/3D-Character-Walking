import assert from 'node:assert/strict';
import { test } from 'node:test';
import { characterCapsules } from '../src/character/motion.ts';
import { PoolSwimController as SwimController } from '../src/character/PoolSwimController.ts';
import { createPool } from '../src/scene/PoolScene.ts';
import { SceneSwitch } from '../src/scene/SceneSwitch.ts';
import { pool } from '../src/world/PoolWorldQuery.ts';

const still = { x: 0, z: 0, run: false, jump: false };
test('pool scene spawn preserves elevated deck during viewer relocation', () => {
  const scene = createPool();
  try {
    for (const shape of Object.values(characterCapsules)) {
      const controller = new SwimController(scene.walkableWorld, shape);
      assert.equal(controller.relocate({ ...scene.spawn, y: scene.spawn.y ?? 0 }), true);
      assert.equal(controller.snapshot.y, pool.deck);
    }
  } finally { scene.dispose(); }
});
const sample = (swimmer, steps, input = {}, delta = 1 / 60) => {
  for (let i = 0; i < steps; i++) swimmer.update(delta, { ...still, ...input });
  return swimmer.snapshot;
};
const enter = (scene, capsule) => {
  const swimmer = new SwimController(scene.walkableWorld, capsule);
  for (let i = 0; i < 180 && swimmer.mode === 'ground'; i++) sample(swimmer, 1, { z: -1, run: true });
  assert.equal(swimmer.mode, 'swim');
  return swimmer;
};

test('pool surface, camera and shader use the same geometry and scene time', () => {
  const scene = createPool();
  const query = scene.walkableWorld.query;
  const center = { x: 0, y: -.25, z: 0 };
  const surface = scene.environment.getObjectByName('Pool water surface');
  scene.update(.04, false);
  const water = query.waterAt(center);
  assert.equal(water.depth, .25);
  assert.equal(water.height, surface.position.y);
  assert.equal(water.time, surface.material.uniforms.clock.value);
  scene.update(.05, true);
  assert.equal(query.time, water.time);
  scene.updateCamera(center);
  assert.equal(scene.scene.fog.far, 12);
  scene.updateCamera({ ...center, z: 7 });
  assert.equal(scene.scene.fog.far, 75);
  scene.updateCamera({ ...center, y: pool.water });
  assert.equal(scene.scene.fog.far, 75);
  scene.dispose();
});

for (const [variant, capsule] of Object.entries(characterCapsules)) {
  test(`pool ${variant}: boost, low frame rate, no tunneling, buoyancy and marked exit`, () => {
    const scene = createPool();
    const query = scene.walkableWorld.query;
    for (const d of [{ x: 100, y: 0, z: 0 }, { x: 0, y: -100, z: 0 }, { x: 0, y: 1, z: 100 }]) {
      const contact = query.sweep({ x: 0, y: -2, z: 0 }, d, capsule);
      assert.ok(contact.ok && contact.value && contact.value.fraction < 1);
    }
    const swimmer = enter(scene, capsule);
    assert.equal(swimmer.relocate({ x: 0, y: pool.deck, z: 7 }, false), false);
    assert.equal(swimmer.relocate({ x: NaN, y: -1, z: 0 }, false), false);
    assert.equal(swimmer.relocate({ x: 0, y: -2, z: 0 }, false), true);
    const maxSpeed = sample(swimmer, 18, { x: 1, run: true }, .16);
    assert.ok(maxSpeed.speed > 5.5 && maxSpeed.speed <= 6 + 1e-9);
    const atWall = sample(swimmer, 250, { x: 1, vertical: -1, run: true }, .16);
    assert.ok(query.clear(atWall, capsule));
    assert.ok(atWall.x <= pool.maxX - capsule.radius + 1e-6);
    assert.ok(atWall.y >= pool.bottom - 1e-6);
    assert.equal(swimmer.climbOut(), false);
    assert.equal(swimmer.relocate({ x: 0, y: -3, z: 0 }, false), true);
    assert.ok(sample(swimmer, 480).y > -1.5);
    assert.equal(swimmer.relocate({ x: 0, y: -2.5, z: 5.5 }, false), true);
    assert.equal(swimmer.climbOut(), false);
    assert.equal(swimmer.relocate({ x: 1, y: -.35, z: 5.5 }, false), true);
    assert.equal(swimmer.climbOut(), false);
    assert.equal(swimmer.relocate({ x: 0, y: -.35, z: 5.5 }, false), true);
    assert.equal(swimmer.climbOut(), true);
    assert.equal(swimmer.mode, 'ground');
    assert.equal(swimmer.snapshot.y, pool.deck);
    scene.dispose();
  });
}

test('pool exit rejects a capsule with insufficient headroom along the climb', () => {
  const scene = createPool();
  const query = scene.walkableWorld.query;
  const start = { x: 0, y: -1, z: 5.5 };
  const tall = { radius: .28, height: 8 };
  assert.equal(query.clear(start, tall), true);
  assert.equal(query.exit(start, tall), null);
  assert.ok(query.exit(start, characterCapsules.man));
  scene.dispose();
});

test('pool failed scene bind restores active water, fog and simulation state', async () => {
  const scene = createPool();
  const scenes = new SceneSwitch(scene);
  const swimmer = enter(scene, characterCapsules.child);
  const snapshot = swimmer.snapshot;
  scene.updateCamera({ x: 0, y: -.25, z: 0 });
  scene.update(.05, false);
  const fog = scene.scene.fog;
  const next = createPool();
  const binds = [];
  const changed = await scenes.select('city', async () => ({ ...next, id: 'city' }), binding => {
    binds.push(binding.id);
    if (binding.id === 'city') throw Error('injected bind failure');
  });
  assert.equal(changed, false);
  assert.deepEqual(binds, ['city', 'pool']);
  assert.equal(scenes.active, scene);
  assert.equal(scenes.root.fog, fog);
  assert.equal(scenes.active.walkableWorld.query.time, .05);
  assert.deepEqual(swimmer.snapshot, snapshot);
  assert.equal(next.scene.children.length, 0);
  scenes.dispose();
});
