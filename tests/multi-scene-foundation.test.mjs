import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, PointLight, Scene } from 'three';
import { SceneSwitch } from '../src/scene/SceneSwitch.ts';
import { createCave } from '../src/scene/CaveScene.ts';
import { CharacterController } from '../src/character/CharacterController.ts';

function environment(id) {
  const scene = new Scene();
  const environment = new Group();
  scene.add(environment);
  let disposals = 0;
  return {
    id, scene, environment, cityFeatures: id === 'city',
    spawn: { x: 0, z: 5 },
    get disposals() { return disposals; },
    dispose() { disposals++; },
  };
}

test('scene switch retains the active root on failure, supersession and cancellation', async () => {
  const city = environment('city');
  const scenes = new SceneSwitch(city);
  const root = scenes.root;
  const actor = new Group();
  root.add(actor);
  const unexpectedBind = () => assert.fail('Stale or failed scene rebound the viewer');
  assert.equal(await scenes.select('cave', async () => { throw Error('Load failed'); }, unexpectedBind), false);
  assert.equal(scenes.active, city);

  for (const cancel of [() => scenes.select('city', unexpectedBind, unexpectedBind), () => scenes.cancel()]) {
    const cave = environment('cave');
    let resolve;
    const pending = scenes.select('cave', () => new Promise(done => { resolve = done; }), unexpectedBind);
    await cancel();
    resolve(cave);
    assert.equal(await pending, false);
    assert.equal(cave.disposals, 1);
    assert.equal(city.scene.parent, root);
  }

  const cave = environment('cave');
  const binds = [];
  assert.equal(await scenes.select('cave', async () => cave, next => binds.push(next)), true);
  assert.deepEqual(binds, [cave]);
  assert.equal(city.disposals, 1);
  assert.equal(actor.parent, root);
  assert.equal(cave.scene.parent, root);
  scenes.dispose();
  assert.equal(cave.disposals, 1);
});

test('cave walking and jump share the visible column footprint', () => {
  const cave = createCave();
  const movement = new CharacterController(cave.walkableWorld);
  const columns = cave.environment.children.filter(object => object.name === 'Rock column');
  assert.equal(columns.length, cave.walkableWorld.obstacles.length);
  const column = columns[1];
  assert.equal(movement.relocate({ x: column.position.x, z: column.position.z, y: 0 }), false);
  assert.equal(movement.relocate({ x: 0, z: column.position.z, y: 0 }), true);
  for (let step = 0; step < 30; step++) movement.update(.05, { x: 1, z: 0, jump: true, run: true });
  assert.ok(Math.abs(movement.snapshot.x - 1.72) < 1e-8);
  cave.dispose();
});

test('cave solar controls extinguish the shaft at night and at blocked angles', () => {
  const cave = createCave();
  try {
    const beam = cave.environment.getObjectByName('Sun shaft');
    assert.equal(cave.solar.getSettings().enabled, true);
    assert.equal(beam.visible, true);
    const noon = beam.matrix.clone();
    cave.solar.configure({ hour: 11 });
    assert.equal(beam.visible, true);
    assert.equal(beam.matrix.equals(noon), false);
    cave.solar.configure({ hour: 6.1 });
    assert.equal(beam.visible, false);
    cave.solar.configure({ hour: 0 });
    assert.equal(beam.visible, false);
    cave.solar.setTime('day');
    assert.equal(beam.visible, true);
  } finally {
    cave.dispose();
  }
});

test('cave fixtures redraw their lit sites on load and meet the per-kind minimum', t => {
  const random = t.mock.method(Math, 'random', () => .51);
  const first = createCave();
  random.mock.mockImplementation(() => .9);
  const second = createCave();
  try {
    for (const [name, total, minimum] of [['Torch', 10, 5], ['Crystal cluster', 20, 13]]) {
      const litSites = cave => cave.environment.getObjectByName('Cave fixtures').children
        .filter(site => site.name === name && site.children.some(child => child instanceof PointLight && child.visible))
        .map(site => site.position.toArray());
      assert.equal(first.environment.getObjectByName('Cave fixtures').children.filter(site => site.name === name).length, total);
      assert.equal(litSites(first).length, minimum);
      assert.equal(litSites(second).length, minimum);
      assert.notDeepEqual(litSites(first), litSites(second));
    }
  } finally {
    first.dispose();
    second.dispose();
  }
});
