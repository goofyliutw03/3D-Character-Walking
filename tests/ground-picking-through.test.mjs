import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Vector3 } from 'three';
import { GroundPicker, declareGroundBox } from '../src/navigation/GroundPicker.ts';
import { projectAnchor } from '../src/camera/AnchorProjection.ts';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RiggedCharacter } from '../src/character/RiggedCharacter.ts';
import { Character } from '../src/character/Character.ts';
import { TargetActor } from '../src/character/TargetActor.ts';
import { assetCatalog } from '../src/character/assetCatalog.ts';
import { CityScene } from '../src/scene/CityScene.ts';
import { createCave } from '../src/scene/CaveScene.ts';
import { SceneSwitch } from '../src/scene/SceneSwitch.ts';
import { TrafficSimulation } from '../src/simulation/TrafficSimulation.ts';
import { TrafficView } from '../src/simulation/TrafficView.ts';

const world = { bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 }, obstacles: [], groundHeight: () => 0 };
const box = (w = 10, h = 1, d = 10, y = -.5) => {
  const mesh = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial());
  mesh.position.y = y; return mesh;
};
const cameraAt = (x = 0, y = 10, z = 5, target = new Vector3()) => {
  const camera = new PerspectiveCamera(70, 1, .1, 100);
  camera.position.set(x, y, z); camera.lookAt(target); camera.updateMatrixWorld(); return camera;
};
const pick = (picker, camera, target = new Vector3(), fish = false, blockers = [], w = world) =>
  picker.pick(projectAnchor(target, camera, 500, 500, fish), camera, 500, 500, fish, w, blockers);

test('ground picking 1: walls and ceilings are ignored; explicit visible blockers intercept only before ground', () => {
  const floor = box(); declareGroundBox(floor);
  const roof = box(20, 1, 20, 5), wall = box(20, 10, 1, 0); wall.position.z = 2;
  const picker = new GroundPicker([roof, wall, floor]);
  const camera = cameraAt();
  for (const fish of [false, true]) {
    assert.ok(pick(picker, camera, new Vector3(), fish));
    assert.equal(pick(picker, camera, new Vector3(), fish, [roof]), null);
    const behind = box(10, 1, 10, -2);
    assert.ok(pick(picker, camera, new Vector3(), fish, [behind]));
    const parent = new Group(); parent.add(roof); parent.visible = false;
    assert.ok(pick(picker, camera, new Vector3(), fish, [roof]));
    parent.visible = true;
  }
  roof.userData.groundPickBlocker = true;
  assert.equal(pick(new GroundPicker([floor, roof]), camera), null);
});

test('ground picking 2: finite planes, nearest valid layer, slopes and auto/raycast equivalence', () => {
  const low = box(12, 1, 12), high = box(4, 1, 4, 1.5);
  declareGroundBox(low); declareGroundBox(high);
  const slope = new Mesh(new PlaneGeometry(10, 10), new MeshBasicMaterial());
  slope.rotation.x = -Math.PI / 2 + .15; slope.position.set(9, 1, 0); slope.userData.walkable = true;
  const roots = [low, high, slope];
  const auto = new GroundPicker(roots), reference = new GroundPicker(roots, 'raycast');
  const nearest = pick(auto, cameraAt());
  assert.ok(nearest && Math.abs(nearest.z - 1) < 1e-6, 'upper surface is nearest along the original ray');
  for (const target of [new Vector3(0, 2, 0), new Vector3(4, 0, 0), new Vector3(9, 1, 0), new Vector3(17, 0, 0)]) {
    const camera = cameraAt(target.x, 10, 5, target);
    for (const fish of [false, true]) {
      const a = pick(auto, camera, target, fish), b = pick(reference, camera, target, fish);
      if (!a || !b) assert.equal(a, b);
      else assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 1e-6);
    }
  }
  let casts = 0; const original = high.raycast;
  high.raycast = function(...args) { casts++; return original.apply(this, args); };
  assert.ok(pick(auto, cameraAt())); assert.equal(casts, 0);
  assert.ok(pick(reference, cameraAt())); assert.ok(casts > 0);
  const blockedWorld = { ...world, obstacles: [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }] };
  assert.equal(pick(auto, cameraAt(), new Vector3(), false, [], blockedWorld), null);
  slope.rotation.x = -.5;
  assert.equal(pick(new GroundPicker([slope]), cameraAt(9, 10, 5, new Vector3(9, 1, 0)), new Vector3(9, 1, 0)), null);
});

test('ground picking 8: transformed boxes agree with raycast and unrelated scenery is never queried', () => {
  for (const rotation of [.2, Math.PI / 2, Math.PI]) {
    const parent = new Group(), floor = box(); declareGroundBox(floor);
    parent.scale.set(1.4, .7, .8); parent.rotation.y = .4; parent.add(floor);
    floor.rotation.z = rotation;
    const scenery = box(20, 1, 20, 5);
    scenery.raycast = () => { throw Error('Unrelated environment raycast'); };
    const camera = cameraAt(), auto = new GroundPicker([parent, scenery]), ref = new GroundPicker([parent], 'raycast');
    const a = pick(auto, camera), b = pick(ref, camera);
    assert.ok(a && b); assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 1e-6);
  }
  const floor = new Mesh(new PlaneGeometry(10, 10, 40, 40), new MeshBasicMaterial());
  floor.rotation.x = -Math.PI / 2; floor.userData.walkable = true;
  const picker = new GroundPicker([floor]);
  assert.ok(floor.geometry.boundingBox, 'triangle complexity independently triggers bounds');
  assert.ok(pick(picker, cameraAt()));
});

test('ground picking 3: no surface, parallel ray, clipping, invalid viewport and hidden floor reject', () => {
  const floor = box(); declareGroundBox(floor);
  const picker = new GroundPicker([floor]), camera = cameraAt();
  assert.equal(pick(new GroundPicker([]), camera), null);
  camera.lookAt(0, 10, -10); camera.updateMatrixWorld();
  assert.equal(picker.pick({ x: 250, y: 250 }, camera, 500, 500, false, world), null);
  camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); camera.far = 2; camera.updateProjectionMatrix();
  assert.equal(picker.pick({ x: 250, y: 250 }, camera, 500, 500, false, world), null);
  camera.far = 100; camera.near = 20; camera.updateProjectionMatrix();
  assert.equal(picker.pick({ x: 250, y: 250 }, camera, 500, 500, false, world), null);
  camera.near = .1; camera.updateProjectionMatrix();
  assert.equal(picker.pick({ x: 0, y: 0 }, camera, 500, 500, true, world), null);
  assert.equal(picker.pick({ x: 250, y: 250 }, camera, 0, 500, false, world), null);
  floor.visible = false; assert.equal(pick(picker, camera), null);
});

test('ground picking 4: complex irregular candidates use conservative boxes without changing results', () => {
  for (const count of [15, 16, 30]) {
    const roots = Array.from({ length: count }, (_, i) => {
      const mesh = new Mesh(new PlaneGeometry(4, 4), new MeshBasicMaterial());
      mesh.rotation.x = -Math.PI / 2; mesh.position.x = i * 6; mesh.userData.walkable = true; return mesh;
    });
    const auto = new GroundPicker(roots), reference = new GroundPicker(roots, 'raycast');
    const camera = cameraAt();
    assert.deepEqual(pick(auto, camera), pick(reference, camera));
    assert.equal(roots.every(m => m.geometry.boundingBox !== null), count >= 16);
  }
});

const load = async variant => {
  const bytes = readFileSync(new URL(`../public/assets/characters/${variant}.glb`, import.meta.url));
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
};

test('ground picking 5.1–5.3: penetration toggles immediately, default is on and explicit blockers remain', () => {
  const floor = box(); declareGroundBox(floor);
  const roof = box(20, 1, 20, 5);
  const picker = new GroundPicker([floor, roof]), camera = cameraAt();
  const point = projectAnchor(new Vector3(), camera, 500, 500, false);
  for (const fish of [false, true]) {
    const p = projectAnchor(new Vector3(), camera, 500, 500, fish);
    assert.ok(picker.pick(p, camera, 500, 500, fish, world));
    assert.equal(picker.pick(p, camera, 500, 500, fish, world, [], false), null);
    assert.ok(picker.pick(p, camera, 500, 500, fish, world, [], true));
    const clear = new GroundPicker([floor]);
    for (const enabled of [false, true]) {
      assert.ok(clear.pick(p, camera, 500, 500, fish, world, [], enabled));
      assert.equal(clear.pick(p, camera, 500, 500, fish, world, [roof], enabled), null);
    }
  }
  assert.ok(picker.pick(point, camera, 500, 500, false, world));
});

test('ground picking 5: actual fallback, three animated GLBs and Target intercept their visible geometry', async () => {
  const floor = box(40, 1, 40); declareGroundBox(floor);
  const picker = new GroundPicker([floor]);
  const camera = cameraAt(0, 10, 0);
  const motion = { x: 0, y: 0, z: 0, heading: 0, speed: 0, grounded: true, action: 'idle' };
  const fallback = new Character(); fallback.update(motion, 0);
  assert.equal(pick(picker, camera, new Vector3(), false, [fallback.root]), null);
  fallback.root.visible = false;
  assert.ok(pick(picker, camera, new Vector3(), false, [fallback.root]));
  fallback.dispose();
  for (const variant of ['man', 'woman', 'child']) {
    const rig = new RiggedCharacter(await load(variant), assetCatalog[variant]);
    for (const action of ['idle', 'run', 'jump']) {
      rig.update({ ...motion, action, y: action === 'jump' ? 1 : 0 }, .1);
      assert.equal(pick(picker, camera, new Vector3(), false, [rig.root]), null, `${variant}/${action}`);
    }
    rig.root.visible = false;
    assert.ok(pick(picker, camera, new Vector3(), false, [rig.root]));
    rig.dispose();
  }
  const target = new TargetActor(world, () => {}, () => load('woman'));
  try {
    await target.ready;
    const ground = new Vector3(0, 0, -1), eye = cameraAt(0, 10, -1, ground);
    assert.equal(pick(picker, eye, ground, false, [target.root]), null);
    target.root.visible = false;
    assert.ok(pick(picker, eye, ground, false, [target.root]));
  } finally { target.dispose(); }
});

test('ground picking 6: NPC roots follow both LODs, disabled ancestors and rebuilding', () => {
  const city = new CityScene(), sim = new TrafficSimulation(city.walkableWorld), view = new TrafficView();
  const floor = box(100, 1, 100); declareGroundBox(floor);
  const picker = new GroundPicker([floor]);
  try {
    sim.configure({ enabled: true, npcCount: 2, vehicleCount: 1 });
    const npc = sim.snapshot.npcs[0], target = new Vector3(npc.x, 0, npc.z);
    const largeWorld = { ...world, bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 } };
    for (const height of [10, 35]) {
      const camera = cameraAt(npc.x, height, npc.z, target);
      view.update(sim.snapshot, camera, 0);
      assert.equal(view.npcPickBlockers.length, 2);
      assert.equal(pick(picker, camera, target, false, view.npcPickBlockers, largeWorld), null);
      view.root.visible = false;
      assert.ok(pick(picker, camera, target, false, view.npcPickBlockers, largeWorld));
    }
    sim.configure({ npcCount: 0 }); view.update(sim.snapshot, cameraAt(), 0);
    assert.equal(view.npcPickBlockers.length, 0);
  } finally { view.dispose(); sim.dispose(); city.dispose(); }
});

test('ground picking 7: actual city and cave switch replace candidates and retain equal strategy results', async () => {
  const city = new CityScene();
  const initial = { id: 'city', scene: city.scene, environment: city.environment,
    walkableWorld: city.walkableWorld, dispose() {}, spawn: { x: 0, z: 5 }, cityFeatures: true };
  const scenes = new SceneSwitch(initial);
  let picker = new GroundPicker(city.environment.children);
  const check = (target, camera) => {
    const a = pick(picker, camera, target, false, [], scenes.active.walkableWorld);
    const b = pick(new GroundPicker(scenes.active.environment.children, 'raycast'), camera, target, false, [], scenes.active.walkableWorld);
    assert.ok(a); assert.ok(b); assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 1e-6);
  };
  try {
    check(new Vector3(1, .05, 5), cameraAt(1, 12, 9, new Vector3(1, .05, 5)));
    await scenes.select('cave', async () => createCave(), next => { picker = new GroundPicker(next.environment.children); });
    // Camera is outside the closed ceiling: only the floor is a candidate.
    check(new Vector3(0, 0, 5), cameraAt(0, 12, 9, new Vector3(0, 0, 5)));
    await scenes.select('city', async () => initial, next => { picker = new GroundPicker(next.environment.children); });
    check(new Vector3(1, .05, 5), cameraAt(1, 12, 9, new Vector3(1, .05, 5)));
  } finally { scenes.dispose(); city.dispose(); }
});
