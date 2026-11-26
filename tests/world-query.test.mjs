import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LegacyWorldQuery } from '../src/world/LegacyWorldQuery.ts';
import { RangePolicy } from '../src/world/RangePolicy.ts';
import { defaultCapsule } from '../src/world/WorldQuery.ts';
import { CharacterController } from '../src/character/CharacterController.ts';
import { DestinationNavigation, isWalkable, segmentClear } from '../src/navigation/DestinationNavigation.ts';
import { PathTour } from '../src/navigation/PathTour.ts';
import { CityScene } from '../src/scene/CityScene.ts';

const body = defaultCapsule;
const point = (x, z, y = 0) => ({ x, y, z });
const world = () => ({ bounds: { minX: -8, maxX: 8, minZ: -12, maxZ: 12 },
  obstacles: [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }], groundHeight: () => 0 });
const value = result => { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; };

test('world query: capability, surface, region and overlap have explicit semantics', () => {
  const query = new LegacyWorldQuery(world());
  assert.equal(query.capabilities.geometry, 'planar-extrusion');
  assert.deepEqual(value(query.surfaceSample(point(0, 5))), { height: 0, surfaceId: 'legacy-ground' });
  assert.equal(value(query.overlap(point(0, 0), body)), true);
  assert.equal(value(query.overlap(point(0, 5), body)), false);
  assert.equal(value(query.regionSample(point(0, 0), body)).reason, 'solid');
  assert.equal(value(query.regionSample(point(8, 5), body)).reason, 'boundary');
});

test('range policy: missing allow, invalid data and dimensions fail closed', () => {
  assert.equal(new RangePolicy({ obstacles: [] }).sample(point(0, 0), body).ok, false);
  for (const bad of [{ radius: 0, height: 1 }, { radius: .5, height: .2 }, { radius: NaN, height: 2 }]) {
    assert.equal(new LegacyWorldQuery(world()).overlap(point(0, 5), bad).ok, false);
  }
  for (const bad of [point(NaN, 5), point(0, Infinity), point(0, 5, NaN)]) {
    assert.equal(new LegacyWorldQuery(world()).overlap(bad, body).ok, false);
  }
  const w = world(); w.bounds.maxX = NaN;
  assert.equal(new LegacyWorldQuery(w).sweep(point(0, 5), point(1, 0), body).ok, false);
  const broken = world(); broken.obstacles[0].minX = 2;
  assert.equal(new LegacyWorldQuery(broken).overlap(point(0, 5), body).ok, false);
});

test('world query: continuous sweep catches high speed, tangent and inward/outward contact', () => {
  const query = new LegacyWorldQuery(world());
  const hit = value(query.sweep(point(-5, 0), point(20, 0), body));
  assert.equal(hit.layer, 'solid');
  assert.ok(Math.abs(hit.fraction - (5 - 1.28) / 20) < 1e-8);
  assert.deepEqual(hit.normal, point(-1, 0));
  assert.equal(value(query.sweep(point(-1.28, 0), point(-2, 0), body)), null);
  assert.equal(value(query.sweep(point(-1.28, 0), point(0, 2), body)), null);
  assert.equal(value(query.sweep(point(-1.28, 0), point(1, 0), body)).fraction, 0);
  assert.equal(value(query.sweep(point(-1.28 + 1e-10, 0), point(-2, 0), body)), null);
  assert.equal(value(query.sweep(point(-5, -1.28 + 1e-10), point(10, 0), body)), null);
  const edge = value(query.sweep(point(0, 5), point(100, 0), body));
  assert.equal(edge.layer, 'boundary');
  assert.ok(Math.abs(edge.fraction - .0772) < 1e-10);
});

test('world query: many swept segments never end inside forbidden footprints', () => {
  const w = world(); const query = new LegacyWorldQuery(w);
  let seed = 123;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let i = 0; i < 1500; i++) {
    const start = point((random() * 2 - 1) * 7.72, (random() * 2 - 1) * 11.72);
    if (value(query.overlap(start, body))) continue;
    const delta = point((random() * 2 - 1) * 100, (random() * 2 - 1) * 100);
    const hit = value(query.sweep(start, delta, body));
    const t = hit?.fraction ?? 1;
    assert.equal(value(query.overlap(point(start.x + delta.x * t, start.z + delta.z * t), body)), false);
  }
});

test('range policy: contact tolerance and multiple capsule sizes share one rule', () => {
  const policy = new RangePolicy(world());
  for (const shape of [body, { radius: .1, height: 1.15 }, { radius: .6, height: 1.8 }]) {
    assert.equal(value(policy.sample(point(8 - shape.radius, 5), shape)).allowed, true);
    assert.equal(value(policy.sample(point(8 - shape.radius + 1e-6, 5), shape)).allowed, false);
    assert.equal(value(policy.sample(point(1 + shape.radius, 0), shape)).allowed, true);
    assert.equal(value(policy.sample(point(1 + shape.radius - 1e-6, 0), shape)).allowed, false);
  }
  assert.equal(value(policy.sample(point(0, 5), { radius: 9, height: 18 })).allowed, false);
});

test('world query: finite horizontal raycast, unsupported vertical and failed surface are distinct', () => {
  const w = world(); const query = new LegacyWorldQuery(w);
  const hit = value(query.raycast(point(-5, 0), point(10, 0)));
  assert.ok(Math.abs(hit.fraction - .4) < 1e-8);
  assert.equal(value(query.raycast(point(-5, 5), point(10, 0))), null);
  assert.deepEqual(query.raycast(point(-5, 0), point(10, 0, 1)), { ok: false, error: 'unsupported' });
  w.groundHeight = () => NaN;
  assert.deepEqual(query.surfaceSample(point(0, 5)), { ok: false, error: 'unavailable' });
  w.groundHeight = () => { throw new Error('not loaded'); };
  assert.deepEqual(query.surfaceSample(point(0, 5)), { ok: false, error: 'unavailable' });
});

test('world query: adapter observes current world proxies rather than stale copies', () => {
  const w = world(); const query = new LegacyWorldQuery(w);
  assert.equal(value(query.overlap(point(3, 5), body)), false);
  w.obstacles.push({ minX: 2, maxX: 4, minZ: 4, maxZ: 6 });
  assert.equal(value(query.overlap(point(3, 5), body)), true);
});

const idle = { x: 0, z: 0, run: false, jump: false };
test('integration: unavailable ground and nonfinite intent never poison the last state', () => {
  const w = world(); const controller = new CharacterController(w);
  const before = controller.snapshot;
  for (const intent of [{ ...idle, x: NaN }, { ...idle, z: Infinity }]) {
    assert.deepEqual(controller.update(1 / 60, intent), before);
  }
  assert.deepEqual(controller.update(1 / 60, { ...idle, x: 1 }, NaN), before);
  w.groundHeight = () => NaN;
  assert.equal(controller.relocate(point(2, 5)), false);
  assert.deepEqual(controller.update(1 / 60, { ...idle, x: 1, jump: true }), before);
  assert.equal(isWalkable({ x: 2, z: 5 }, w), false);
  assert.equal(segmentClear({ x: 0, z: 5 }, { x: 2, z: 5 }, w), false);
  w.groundHeight = () => { throw new Error('not loaded'); };
  assert.doesNotThrow(() => controller.update(1 / 60, idle));
  assert.deepEqual(controller.snapshot, before);
});

test('integration: manual, destination, tour and editing agree at city boundaries', () => {
  const city = new CityScene(); const w = city.walkableWorld;
  try {
    assert.ok(w.query, 'city owns an explicit shared adapter');
    const controller = new CharacterController(w);
    const nav = new DestinationNavigation(w); const tour = new PathTour(w);
    for (const p of [point(9, 5), point(0, -24.6)]) {
      assert.equal(isWalkable(p, w), false);
      assert.equal(controller.relocate(p), false);
      assert.equal(nav.select(controller.snapshot, p), false);
      assert.equal(tour.start(controller.snapshot, [p], false, 1.8), false);
    }
    for (let i = 0; i < 300; i++) controller.update(.05, { ...idle, x: 1, z: .1, run: true });
    assert.equal(isWalkable(controller.snapshot, w), true);
    assert.equal(value(w.query.regionSample(controller.snapshot, body)).allowed, true);
    assert.equal(controller.relocate(point(0, 5)), true);
    assert.equal(tour.start(controller.snapshot, [point(0, 8)], false, 1.8), true);
    for (let i = 0; i < 300 && tour.snapshot.status === 'running'; i++) {
      controller.update(1 / 60, tour.sample(controller.snapshot, 1 / 60));
    }
    assert.equal(tour.snapshot.status, 'completed');
  } finally { city.dispose(); }
});

test('integration: explicit query is authoritative for every consumer', () => {
  const w = world(); const actual = new LegacyWorldQuery(w);
  let deny = false; const calls = { sweep: 0, overlap: 0, region: 0, surface: 0 };
  const query = {
    capabilities: actual.capabilities,
    sweep(...args) { calls.sweep++; return actual.sweep(...args); },
    overlap(...args) { calls.overlap++; return deny ? { ok: true, value: true } : actual.overlap(...args); },
    regionSample(...args) { calls.region++; return actual.regionSample(...args); },
    surfaceSample(...args) { calls.surface++; return actual.surfaceSample(...args); },
    raycast(...args) { return actual.raycast(...args); },
  };
  w.query = query;
  const controller = new CharacterController(w);
  controller.update(1 / 60, { ...idle, x: 1 });
  assert.ok(calls.sweep > 0);
  deny = true;
  assert.equal(controller.relocate(point(2, 5)), false);
  assert.equal(isWalkable({ x: 2, z: 5 }, w), false);
  assert.equal(new DestinationNavigation(w).select(controller.snapshot, point(2, 5)), false);
  assert.equal(new PathTour(w).start(controller.snapshot, [point(2, 5)], false, 1.8), false);
  assert.ok(calls.overlap > 0 && calls.region > 0 && calls.surface > 0);
});
