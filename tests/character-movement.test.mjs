import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CharacterController } from '../src/character/CharacterController.ts';

const idle = { x: 0, z: 0, run: false, jump: false };
const world = (obstacles = [], groundHeight = () => 0) => ({
  bounds: { minX: -8.3, maxX: 8.3, minZ: -26.5, maxZ: 26.5 }, obstacles, groundHeight,
});
const advance = (controller, intent, frames = 60) => {
  let state;
  for (let i = 0; i < frames; i++) state = controller.update(1 / 60, { ...idle, ...intent });
  return state;
};

test('2.1–2.3: normalized movement, faster running and immediate horizontal stop', () => {
  const straight = new CharacterController(world());
  const diagonal = new CharacterController(world());
  const a = advance(straight, { x: 1 });
  const b = advance(diagonal, { x: 1, z: 1 });
  assert.ok(Math.abs(Math.hypot(b.x, b.z - 5) - a.x) < 1e-8);
  assert.ok(Math.abs(a.x - 1.8) < 1e-8);
  assert.equal(a.action, 'walk');
  const runner = advance(new CharacterController(world()), { x: 1, run: true });
  assert.ok(Math.abs(runner.x - 4) < 1e-8);
  assert.equal(runner.action, 'run');
  assert.equal(straight.update(1 / 60, idle).action, 'idle');
});

test('2.4–2.5: jump only from ground, held input never auto-bounces', () => {
  const controller = new CharacterController(world());
  const airborne = controller.update(1 / 60, { ...idle, jump: true });
  assert.equal(airborne.action, 'jump');
  assert.ok(airborne.y > 0);
  const landed = advance(controller, { jump: true }, 120);
  assert.equal(landed.grounded, true);
  assert.equal(landed.y, 0);
  controller.update(1 / 60, idle);
  assert.equal(controller.update(1 / 60, { ...idle, jump: true }).grounded, false);
});

test('2.3, 2.6: airborne Stop preserves gravity; long frame is capped', () => {
  const controller = new CharacterController(world());
  const state = controller.update(100, { ...idle, x: 1, run: true, jump: true });
  assert.ok(state.x <= 0.200001);
  const stopped = controller.update(1 / 60, idle);
  assert.equal(stopped.x, state.x);
  assert.equal(stopped.action, 'jump');
  assert.equal(advance(controller, {}, 120).grounded, true);
});

test('3.1–3.2: obstacle blocks, slides and derives Idle from actual displacement', () => {
  const controller = new CharacterController(world([{ minX: 1, maxX: 2, minZ: 0, maxZ: 20 }]));
  const blocked = advance(controller, { x: 1, run: true }, 120);
  assert.ok(blocked.x <= 0.7200001);
  assert.equal(blocked.action, 'idle');
  const slide = advance(controller, { x: 1, z: 1 }, 60);
  assert.ok(slide.x <= 0.7200001);
  assert.ok(slide.z > 5);
  const jumping = advance(controller, { x: 1, jump: true, run: true }, 20);
  assert.ok(jumping.x <= 0.7200001);
});

test('3.1, 3.3: bounds and sidewalk surface constrain feet', () => {
  const controller = new CharacterController(world([], x => Math.abs(x) >= 4.5 ? 0.32 : 0.075));
  const edge = advance(controller, { x: 1, run: true }, 300);
  assert.ok(edge.x <= 8.02 + 1e-8);
  assert.equal(edge.y, 0.32);
  assert.equal(edge.action, 'idle');
  const road = advance(controller, { x: -1, run: true }, 120);
  assert.equal(road.y, 0.075);
});

test('2.6, 3.2: small frame steps agree and snapshots do not mutate', () => {
  const a = new CharacterController(world());
  const b = new CharacterController(world());
  const before = a.update(0, idle);
  advance(a, { z: -1 }, 60);
  for (let i = 0; i < 120; i++) b.update(1 / 120, { ...idle, z: -1 });
  assert.ok(Math.abs(a.update(0, idle).z - b.update(0, idle).z) < 1e-8);
  assert.equal(before.z, 5);
});
