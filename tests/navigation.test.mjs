import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DestinationNavigation, isWalkable, segmentClear } from '../src/navigation/DestinationNavigation.ts';
import { CharacterController } from '../src/character/CharacterController.ts';
import { CityScene } from '../src/scene/CityScene.ts';

const world = obstacles => ({ bounds: { minX: -8, maxX: 8, minZ: -12, maxZ: 12 }, obstacles, groundHeight: () => 0 });
const box = { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
const simulate = (nav, controller, frames = 1500) => {
  let state = controller.update(0, { x: 0, z: 0, run: false, jump: false });
  const visited = [];
  for (let i = 0; i < frames && nav.status === 'running'; i++) {
    state = controller.update(1 / 60, nav.sample(state, 1 / 60));
    visited.push(state);
  }
  return { state, visited };
};

test('mobile 3.1–3.3: actual controller runs around a blocking rectangle and stops within tolerance', () => {
  const w = world([box]);
  const nav = new DestinationNavigation(w);
  const controller = new CharacterController(w);
  assert.equal(segmentClear({ x: 0, z: 5 }, { x: 0, z: -5 }, w), false);
  assert.equal(nav.select({ x: 0, z: 5 }, { x: 0, z: -5 }), true);
  const { state, visited } = simulate(nav, controller);
  assert.equal(nav.status, 'arrived');
  assert.ok(Math.hypot(state.x, state.z + 5) <= 0.08);
  assert.ok(visited.every(p => isWalkable(p, w)));
  assert.ok(visited.some(p => Math.abs(p.x) > 1.28));
  assert.ok(visited.some(p => p.action === 'run' && p.speed > 3.9));
  assert.deepEqual(nav.sample(state, 1 / 60), { x: 0, z: 0, run: false, jump: false });
});

test('mobile 3.3–3.5: invalid, disconnected, replacement, arrival, stuck and cancel are bounded', () => {
  const w = world([box]);
  const nav = new DestinationNavigation(w);
  for (const point of [{ x: 0, z: 0 }, { x: 100, z: 0 }, { x: NaN, z: 2 }]) {
    assert.equal(nav.select({ x: 0, z: 5 }, point), false);
    assert.equal(nav.status, 'blocked');
    assert.equal(nav.target, undefined);
  }
  const divided = new DestinationNavigation(world([{ minX: -8, maxX: 8, minZ: -1, maxZ: 1 }]));
  assert.equal(divided.select({ x: 0, z: 5 }, { x: 0, z: -5 }), false);
  nav.select({ x: 0, z: 5 }, { x: 0, z: 9 });
  nav.select({ x: 0, z: 5 }, { x: 3, z: 5 });
  assert.deepEqual(nav.target, { x: 3, z: 5 });
  for (let i = 0; i < 120; i++) nav.sample({ x: 0, z: 5 }, 1 / 60);
  assert.equal(nav.status, 'blocked');
  nav.select({ x: 0, z: 5 }, { x: 0.05, z: 5 });
  nav.sample({ x: 0, z: 5 }, 1 / 60);
  assert.equal(nav.status, 'arrived');
  nav.cancel();
  assert.equal(nav.status, 'idle');
});

test('mobile 3.2: real city detours around tree and bench, near obstacle boundary can leave safely', () => {
  const city = new CityScene();
  const w = city.walkableWorld;
  try {
    for (const target of [{ x: 6.4, z: -15 }, { x: -6.4, z: 16 }, { x: 0, z: -22 }]) {
      const controller = new CharacterController(w);
      const nav = new DestinationNavigation(w);
      assert.equal(nav.select({ x: 0, z: 5 }, target), true);
      const { state, visited } = simulate(nav, controller);
      assert.equal(nav.status, 'arrived');
      assert.ok(Math.hypot(state.x - target.x, state.z - target.z) <= 0.08);
      assert.ok(visited.every(p => isWalkable(p, w)));
    }
    const nav = new DestinationNavigation(world([box]));
    assert.equal(nav.select({ x: 1.28, z: 0 }, { x: 4, z: 0 }), true);
  } finally { city.dispose(); }
});
