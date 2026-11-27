import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Vector3 } from 'three';
import { characterCapsules } from '../src/character/motion.ts';
import { SwimController, swimAutoDepth, swimWaterlineHeight } from '../src/character/SwimController.ts';
import { sampleSwimPose } from '../src/character/SwimAppearance.ts';
import { createSwim } from '../src/scene/SwimScene.ts';
import { InputManager } from '../src/input/InputManager.ts';
import { GroundWorldQuery } from '../src/world/GroundWorldQuery.ts';

const deck = { approachZ: 3.2, height: .22 };
const idle = { x: 0, z: 0, run: false, jump: false };

test('pool camera clears the floor, walls and solids without moving valid underwater or overview poses', t => {
  const { pool } = fixture(t);
  const clearance = .15;
  const adjust = xyz => {
    const position = new Vector3(...xyz);
    pool.swim.constrainCamera(position, clearance);
    const result = position.toArray();
    pool.swim.constrainCamera(position, clearance);
    assert.deepEqual(position.toArray(), result);
    return result;
  };
  assert.deepEqual(adjust([0, -5.5, 0]), [0, -5 + clearance, 0]);
  assert.deepEqual(adjust([9.1, -1, 0]), [9 - clearance, -1, 0]);
  assert.deepEqual(adjust([0, -.05, 4]), [0, -.05, 3.8 - clearance]);
  assert.deepEqual(adjust([9.1, -.05, 6.1]), [9.1, .24 + clearance, 6.1]);
  assert.deepEqual(adjust([0, -1, 0]), [0, -1, 0]);
  assert.deepEqual(adjust([13, 11, 14]), [13, 11, 14]);
});

test('pool water quality reduces surface triangles and instance budgets and restores standard geometry', t => {
  const { pool, water } = fixture(t);
  const surface = pool.environment.getObjectByName('Pool surface');
  const plants = pool.environment.getObjectByName('Aquatic plants');
  const bubbles = pool.environment.getObjectByName('Air bubbles');
  const standard = surface.geometry;
  assert.equal(standard.index.count / 3, 43_200);
  assert.deepEqual([plants.count, bubbles.count], [40, 28]);
  water.shader.configure({ quality: 'low' });
  pool.update(0, false);
  assert.equal(surface.geometry.index.count / 3, 6_912);
  assert.deepEqual([plants.count, bubbles.count], [12, 8]);
  pool.update(0, true);
  assert.equal(bubbles.count, 0);
  water.shader.configure({ quality: 'standard' });
  pool.update(0, false);
  assert.equal(surface.geometry, standard);
});
function fixture(t, shape = characterCapsules.man) {
  const pool = createSwim();
  t.after(() => pool.dispose());
  const { water, exit } = pool.swim;
  const actor = new SwimController(pool.walkableWorld, shape, pool.spawn, water, exit);
  return { pool, actor, water, exit };
}
function advance(actor, seconds, intent = {}, delta = 1 / 60) {
  for (let i = 0; i < Math.ceil(seconds / delta); i++) actor.update(delta, { ...idle, ...intent });
}

test('automatic swimming holds depth inside the dead zone and uses symmetric speed bands', t => {
  const { actor } = fixture(t);
  for (const sign of [-1, 1]) {
    for (const [degrees, expected] of [[0, 0], [10, 0], [10.01, .25], [20, .25], [20.01, .65]]) {
      assert.ok(actor.relocate({ x: 0, y: -3, z: 0 }, false));
      const depth = swimAutoDepth(sign * degrees * (Math.PI / 180));
      assert.equal(depth, expected ? sign * expected : 0);
      for (let frame = 0; frame < 60; frame++) actor.update(1 / 60, { ...idle, z: -1 }, undefined, undefined, depth);
      assert.ok(Math.abs(actor.snapshot.y - (-3 + sign * expected)) < 1e-8);
      const held = actor.snapshot.y;
      actor.update(1 / 60, { ...idle, z: -1 }, undefined, undefined, 0);
      assert.equal(actor.snapshot.y, held);
    }
  }
  assert.ok(actor.relocate({ x: 0, y: -5, z: 0 }, false));
  actor.update(1 / 60, { ...idle, z: -1 }, undefined, undefined, .25);
  assert.ok(actor.snapshot.y > -5);
});

test('a swimmer stopped at the platform by the posed shell can still climb', t => {
  const { actor } = fixture(t);
  assert.ok(actor.relocate({ x: 0, y: -1.38, z: 3 }, false));
  assert.equal(actor.canLeaveWater(), false);
  actor.setBodyReach(.65);
  assert.equal(actor.canLeaveWater(), true);
  advance(actor, 1.4, { z: 1 });
  assert.equal(actor.mode, 'ground');
});

for (const [name, shape] of Object.entries(characterCapsules)) {
  test('dry entry, dive, surface and checked pool exit for ' + name, t => {
    const { actor } = fixture(t, shape);
    assert.equal(actor.mode, 'ground');
    assert.equal(actor.leaveWater(), false);
    advance(actor, 1.15, { z: -1 });
    assert.equal(actor.mode, 'swim');
    assert.equal(actor.submerged, true);
    assert.equal(actor.relocate({ x: 0, y: -1.5, z: 0 }, false), true);
    assert.equal(actor.leaveWater(), false);
    advance(actor, 2, { vertical: 1 });
    assert.equal(actor.submerged, false);
    assert.equal(actor.mode, 'swim');
    advance(actor, 1, { vertical: -1 });
    assert.equal(actor.submerged, true);
    assert.equal(actor.relocate({ x: 0, y: -2, z: deck.approachZ }, false), true);
    assert.equal(actor.leaveWater(), false);
    advance(actor, 1.5, { vertical: 1 });
    assert.equal(actor.leaveWater(), true);
    assert.equal(actor.mode, 'climb');
    advance(actor, 1.3);
    assert.equal(actor.mode, 'ground');
    assert.equal(actor.snapshot.y, deck.height);
  });
}

test('swim input combines aliases and simultaneous on-screen directions once per axis', () => {
  const win = new EventTarget(), doc = new EventTarget();
  const controls = new InputManager(win, doc);
  controls.setFlightControls(true);
  const buttons = new Map();
  for (const direction of ['left', 'right', 'forward', 'backward', 'ascend', 'descend']) {
    const button = Object.assign(new EventTarget(), { setPointerCapture() {} });
    controls.bindDirection(button, direction);
    buttons.set(direction, button);
  }
  const emit = (target, type, props) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), props));
  const key = (code, type = 'keydown') => emit(win, type, { code });
  const pointer = (direction, pointerId) => emit(buttons.get(direction), 'pointerdown', { button: 0, pointerId });
  for (const [axis, positive, negative] of [
    ['x', ['KeyD', 'ArrowRight', 'right'], ['KeyA', 'ArrowLeft', 'left']],
    ['z', ['KeyS', 'ArrowDown', 'backward'], ['KeyW', 'ArrowUp', 'forward']],
    ['vertical', ['KeyE', 'Space', 'ascend'], ['KeyQ', 'descend']],
  ]) {
    const sources = [...positive, ...negative];
    for (let mask = 0; mask < 1 << sources.length; mask++) {
      controls.stop();
      sources.forEach((source, index) => {
        if (mask & 1 << index) {
          if (buttons.has(source)) pointer(source, index);
          else key(source);
        }
      });
      const positiveMask = (1 << positive.length) - 1;
      assert.equal(controls.sample()[axis], Number(!!(mask & positiveMask)) - Number(!!(mask >> positive.length)),
        JSON.stringify({ axis, mask }));
    }
  }
  controls.stop();
  key('KeyS'); key('KeyE'); key('ShiftLeft'); pointer('right', 1);
  assert.deepEqual(controls.sample(), { x: 1, z: 1, vertical: 1, run: true, jump: false });
  emit(buttons.get('right'), 'pointercancel', { pointerId: 1 });
  assert.equal(controls.sample().x, 0);
  controls.stop();
  key('Space'); key('Space', 'keyup');
  assert.equal(controls.sample().vertical, 1);
  assert.equal(controls.sample().vertical, 0);
  emit(buttons.get('descend'), 'click', { detail: 0 });
  assert.equal(controls.sample().vertical, -1);
  emit(win, 'blur', {});
  assert.deepEqual(controls.sample(), { ...idle, vertical: 0 });
  controls.dispose();
});
test('low-frame boost cannot cross pool floor, intake or walls', t => {
  const { pool, actor } = fixture(t);
  const query = pool.walkableWorld.query;
  assert.equal(actor.relocate({ x: 0, y: -4.6, z: -1 }, false), true);
  advance(actor, 10, { x: 1, vertical: -1, run: true }, .25);
  assert.ok(actor.droppedTime > 6);
  assert.ok(actor.snapshot.x <= 2.4 - actor.shape.radius + 1e-7);
  assert.ok(actor.snapshot.y >= -5 - 1e-7);
  assert.equal(query.overlap(actor.snapshot, actor.shape).value, false);
  assert.equal(actor.relocate({ x: 5, y: -2, z: 0 }, false), true);
  advance(actor, 10, { x: 1, run: true }, .25);
  assert.ok(Math.abs(actor.snapshot.x - (9 - actor.shape.radius)) < 1e-7);
});
test('independent hysteresis, fixed clock pause, atomic invalid water settings and placements', t => {
  const { actor, pool, water } = fixture(t);
  const y = water.surfaceAt(0, 0);
  assert.equal(pool.swim.updateCamera({ x: 0, y, z: 0 }), false);
  assert.equal(pool.swim.updateCamera({ x: 0, y: y - .11, z: 0 }), true);
  assert.ok(pool.scene.fog);
  assert.equal(pool.swim.updateCamera({ x: 0, y: y + .05, z: 0 }), true);
  assert.equal(actor.submerged, false);
  assert.equal(pool.swim.updateCamera({ x: 0, y: y + .11, z: 0 }), false);
  assert.equal(pool.scene.fog, null);

  assert.equal(water.shader.configure({ paused: true, flowSpeed: 3 }), true);
  const state = water.shader.settings;
  const height = water.surfaceAt(1, 2);
  assert.equal(water.shader.configure({ enabled: false, flowSpeed: Infinity }), false);
  assert.deepEqual(water.shader.settings, state);
  pool.update(1, false);
  assert.equal(water.surfaceAt(1, 2), height);
  assert.equal(water.current, 0);
  assert.equal(water.shader.configure({ enabled: false }), true);
  assert.equal(water.surfaceAt(1, 2), 0);
  assert.equal(pool.environment.getObjectByName('Air bubbles').count, 28);
  pool.update(1, false);
  assert.equal(pool.environment.getObjectByName('Air bubbles').count, 0);
  const previous = actor.snapshot;
  assert.equal(actor.relocate({ x: 3, y: -4, z: -1 }, false), false);
  assert.equal(actor.relocate({ x: 0, y: NaN, z: 0 }, false), false);
  assert.equal(actor.setCapsule({ radius: .4, height: 8 }), false);
  assert.deepEqual(actor.update(NaN, idle), previous);
  assert.equal(actor.relocate({ x: 0, y: -.2, z: 0 }, false), true);
  assert.equal(actor.mode, 'swim');
  assert.equal(actor.submerged, false);
});

test('a swimmer at rest holds position and treads with animated limbs in flowing water', t => {
  const { actor, water } = fixture(t);
  assert.equal(water.shader.configure({ flowSpeed: 3 }), true);
  assert.ok(water.current > 0);
  assert.ok(actor.relocate({ x: 0, y: -2, z: 0 }, false));
  advance(actor, .3, { x: 1, vertical: -1 });
  const { x, y, z } = actor.snapshot;
  advance(actor, 3);
  assert.deepEqual([actor.snapshot.x, actor.snapshot.y, actor.snapshot.z, actor.snapshot.speed], [x, y, z, 0]);
  const pose = sampleSwimPose('tread', .25, 1, 0);
  assert.equal(pose.pitch, 0);
  assert.notDeepEqual(pose.shin, sampleSwimPose('tread', .75, 1, 0).shin);
});

test('auto-exit requires surface-level movement into the sole platform entrance', t => {
  const { actor, pool } = fixture(t);
  assert.equal(pool.controls.autoRun, true);
  assert.equal(pool.controls.groundNavigation, false);
  assert.ok(actor.relocate({ x: 0, y: -2, z: deck.approachZ }, false));
  advance(actor, .4, { z: 1 });
  assert.equal(actor.mode, 'swim');
  assert.ok(actor.relocate({ x: 0, y: -.2, z: deck.approachZ }, false));
  advance(actor, .2, { z: -1 });
  assert.equal(actor.mode, 'swim');
  assert.ok(actor.relocate({ x: 0, y: -.2, z: deck.approachZ }, false));
  advance(actor, 2, { z: 1 });
  assert.equal(actor.mode, 'ground');
  assert.equal(actor.snapshot.y, deck.height);
});

test('spiral reverses depth, stops at both bounds, and hands off to colliding bottom running', t => {
  const { actor, water } = fixture(t);
  assert.ok(actor.relocate({ x: 0, y: -2, z: 0 }, false));
  const spiral = direction => actor.update(1 / 60, idle, undefined, direction);
  const heading = actor.snapshot.heading;
  for (let i = 0; i < 35; i++) spiral(-1);
  assert.ok(actor.snapshot.y < -2 && actor.snapshot.heading < heading);
  const depth = actor.snapshot.y;
  spiral(1);
  assert.ok(actor.snapshot.y > depth);
  for (let i = 0; i < 300; i++) spiral(1);
  assert.equal(actor.snapshot.y, water.level - swimWaterlineHeight.man);
  assert.equal(actor.snapshot.speed, 0);
  for (let i = 0; i < 300; i++) spiral(-1);
  assert.equal(actor.mode, 'bottom');
  assert.equal(actor.snapshot.y, water.bottom);
  assert.equal(actor.snapshot.action, 'idle');
  assert.ok(actor.relocate({ x: 1, y: water.bottom, z: -1 }, false));
  advance(actor, .2, { x: 1, run: true });
  assert.equal(actor.snapshot.action, 'run');
  assert.ok(Math.abs(actor.snapshot.x - 1.8) < 1e-7);
  advance(actor, 1, { x: 1, run: true });
  assert.ok(actor.snapshot.x <= 2.4 - actor.shape.radius + 1e-7);
  advance(actor, .2, { vertical: 1 });
  assert.equal(actor.mode, 'swim');
  assert.equal(actor.snapshot.grounded, false);
});

for (const [name, shape] of Object.entries(characterCapsules)) {
  test('water location and idle chest alignment in both directions: ' + name, t => {
    const { actor, water } = fixture(t, shape);
    const bandEdge = water.level - .4 - shape.height;
    const chestAligned = water.level - swimWaterlineHeight[name];
    const place = y => assert.ok(actor.relocate({ x: 0, y, z: 0 }, false));
    assert.equal(actor.waterLocation, '00');
    place(water.bottom);
    assert.equal(actor.waterLocation, '03');
    place(bandEdge - .001);
    assert.equal(actor.waterLocation, '02');
    advance(actor, 1);
    assert.equal(actor.snapshot.y, bandEdge - .001);
    place(bandEdge);
    assert.equal(actor.waterLocation, '01');
    for (const offset of [-.12, .12]) {
      const start = chestAligned + offset;
      place(start);
      advance(actor, .1, { x: 1 });
      assert.equal(actor.snapshot.y, start);
      const x = actor.snapshot.x;
      advance(actor, 1 / 60);
      assert.ok(Math.abs(actor.snapshot.y - chestAligned) < Math.abs(offset));
      assert.ok(Math.abs(actor.snapshot.y - start) < .01);
      assert.equal(actor.snapshot.speed, 0);
      advance(actor, 1);
      assert.ok(Math.abs(actor.snapshot.y - chestAligned) < 1e-8);
      assert.equal(actor.snapshot.x, x);
    }
  });

  test('O holds the neck–chest waterline while the torso stays submerged: ' + name, t => {
    const { pool, water, actor } = fixture(t, shape);
    assert.ok(actor.relocate({ x: 0, y: -2, z: 0 }, false));
    for (let i = 0; i < 150; i++) {
      pool.update(1 / 60, false);
      actor.update(1 / 60, idle, undefined, 1);
    }
    const reached = actor.snapshot;
    assert.ok(Math.abs(reached.y + swimWaterlineHeight[name] - water.level) < 1e-8);
    assert.equal(actor.submerged, true);
    assert.equal(reached.speed, 0);
    advance(actor, 2);
    assert.deepEqual(actor.snapshot, reached);
    advance(actor, 1, { vertical: 1 });
    const raised = actor.snapshot;
    assert.ok(raised.y > reached.y);
    assert.equal(actor.canSwimVertically(1), false);
    actor.update(1 / 60, idle, undefined, 1);
    assert.equal(actor.snapshot.y, raised.y);
  });
}

test('climbing preserves the contacted face tangent on the front and side and stays collision-free', t => {
  const { actor, pool } = fixture(t);
  for (const [start, tangent, horizontal, expected] of [
    [{ x: -1.45, z: 3.3 }, 'x', 'z', 4.14],
    [{ x: 1.45, z: 3.3 }, 'x', 'z', 4.14],
    [{ x: 2.63, z: 4.8 }, 'z', 'x', 1.86],
  ]) {
    assert.ok(actor.relocate({ ...start, y: -swimWaterlineHeight.man }, false));
    assert.equal(actor.submerged, true);
    assert.ok(actor.leaveWater());
    assert.equal(actor.climbProgress, 0);
    let lastProgress = 0;
    for (let i = 0; i < 32 && actor.mode === 'climb'; i++) {
      actor.update(.18, idle);
      assert.deepEqual(pool.walkableWorld.query.overlap(actor.snapshot, actor.shape), { ok: true, value: false });
      assert.ok(actor.climbProgress === undefined || actor.climbProgress > lastProgress);
      lastProgress = actor.climbProgress;
    }
    assert.equal(actor.mode, 'ground');
    assert.ok(Math.abs(actor.snapshot[horizontal] - expected) < .02);
    assert.ok(Math.abs(actor.snapshot[tangent] - start[tangent]) < 1e-8);
  }
});

test('exit rejects ceiling, unsupported corner and decorative solids and can be cancelled mid-climb', t => {
  const { actor, pool, water, exit } = fixture(t);
  const origin = { x: 0, y: -swimWaterlineHeight.man, z: 3.4 };
  assert.ok(actor.relocate(origin, false));
  const before = actor.snapshot;
  assert.ok(actor.leaveWater());
  advance(actor, .56);
  assert.ok(actor.snapshot.y > before.y);
  actor.stop();
  assert.equal(actor.mode, 'swim');
  assert.deepEqual(actor.snapshot, before);
  assert.ok(actor.relocate({ ...origin, x: 2.17 }, false));
  assert.equal(actor.leaveWater(), false);
  assert.ok(actor.relocate({ ...origin, x: -4.1, z: -1.49 }, false));
  assert.equal(actor.leaveWater(), false);

  const platform = { id: exit.surfaceId, minX: -2.2, maxX: 2.2, minY: -5, maxY: .22, minZ: 3.8, maxZ: 6.45 };
  const bounds = { ...pool.walkableWorld.bounds, minY: -5, maxY: 4 };
  const ceiling = { id: 'ceiling', minX: -.9, maxX: .9, minY: 1.1, maxY: 1.3, minZ: 2.7, maxZ: 4.4 };
  const query = new GroundWorldQuery({
    bounds, solids: [platform, ceiling],
    surfaces: [{ ...bounds, id: 'pool-bottom', height: -5 }, { ...platform, height: .22 }],
  });
  const obstructed = new SwimController({ ...pool.walkableWorld, query }, actor.shape, pool.spawn, water, exit);
  assert.ok(obstructed.relocate(origin, false));
  assert.equal(obstructed.leaveWater(), false);
});

for (const [name, shape] of Object.entries(characterCapsules)) {
  test('surface climb stays available after hitting the wall while submerged: ' + name, t => {
    const { actor } = fixture(t, shape);
    assert.ok(actor.relocate({ x: 0, y: -2, z: deck.approachZ }, false));
    advance(actor, 1, { z: 1, run: true });
    assert.ok(actor.snapshot.z > deck.approachZ + .2);
    assert.equal(actor.canLeaveWater(), false);
    assert.equal(actor.leaveWater(), false);
    advance(actor, 3, { vertical: 1 });
    assert.equal(actor.canLeaveWater(), true);
    advance(actor, .2, { z: 1, vertical: -1 });
    assert.equal(actor.mode, 'swim');
    advance(actor, 2, { z: 1, vertical: 1 });
    assert.equal(actor.mode, 'ground');
  });
}
