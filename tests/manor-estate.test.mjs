import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CharacterController } from '../src/character/CharacterController.ts';
import { DestinationNavigation, segmentClear } from '../src/navigation/DestinationNavigation.ts';
import { GroundPicker } from '../src/navigation/GroundPicker.ts';
import { manorWalkableWorld } from '../src/scene/ManorScene.ts';
import { defaultCapsule } from '../src/world/WorldQuery.ts';
import { CameraController } from '../src/camera/CameraController.ts';
import { CameraObstruction } from '../src/camera/CameraObstruction.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';
import { FollowCamera } from '../src/camera/FollowCamera.ts';

const bytes = await readFile(new URL('../public/assets/environments/manor.glb', import.meta.url));
const { scene } = await new GLTFLoader().parseAsync(Uint8Array.from(bytes).buffer, '');
const world = manorWalkableWorld(scene);
const point = (x, y, z) => ({ x, y, z });

test('the real second-floor headboard blocks a running jump from behind', () => {
  const character = new CharacterController(world);
  assert.ok(character.relocate(point(-6, 3.6, -5.8)));
  let furthestZ = character.snapshot.z;
  let highestY = character.snapshot.y;
  for (let frame = 0; frame < 60; frame++) {
    const snapshot = character.update(1 / 60, { x: 0, z: 1, run: true, jump: frame === 0 });
    furthestZ = Math.max(furthestZ, snapshot.z);
    highestY = Math.max(highestY, snapshot.y);
  }
  assert.ok(highestY > 4.4, 'the character jumped');
  const contact = -4.8 - .13 / 2 - defaultCapsule.radius;
  assert.ok(Math.abs(furthestZ - contact) < .002, JSON.stringify({ furthestZ, contact }));
});

test('manor GLB supports both directions on each staircase', () => {
  for (let level = 0; level < 5; level++) {
    const direction = level % 2 === 0 ? 1 : -1;
    const x = level % 2 === 0 ? 3.5 : 5.2;
    const from = point(x, (level-1)*3.6, -direction*4.55);
    const to = point(x, level*3.6, direction*4.55);
    assert.ok(segmentClear(from, to, world), 'ascent ' + level);
    assert.ok(segmentClear(to, from, world), 'descent ' + level);
  }
});

test('manor stair camera climbs and descends continuously while feet follow the treads', () => {
  for (const view of ['first-person', 'third-person']) {
    for (const direction of [-1, 1]) {
      const character = new CharacterController(world);
      assert.ok(character.relocate(point(3.5, direction > 0 ? 10.8 : 14.4, -direction * 4.55)));
      const camera = new PerspectiveCamera();
      const rendered = new PerspectiveCamera();
      const obstruction = new CameraObstruction(scene);
      const orbit = { target: new Vector3(), enabled: false, enableDamping: true, update() {} };
      const controller = new CameraController(camera, orbit, new FollowCamera(), new FirstPersonCamera());
      const updateSubject = (feet) => ({
        ...feet, heading: direction > 0 ? 0 : Math.PI, y: world.cameraGroundHeight(feet),
        height: 1.8, eyeHeight: 1.65, eyeForward: .1,
      });
      controller.select(view, updateSubject(character.snapshot), true);
      obstruction.update(camera, rendered, orbit.target, updateSubject(character.snapshot), 0, true, controller.characterVisible);
      let previous = character.snapshot, cameraY = camera.position.y;
      let renderedY = rendered.position.y, previousDelta = 0, verticalVelocityVariation = 0;
      let maximumStep = 0, maximumCameraStep = 0;
      for (let frame = 0; frame < 138; frame++) {
        const feet = character.update(1/60, { x: 0, z: direction, run: true, jump: false });
        const subject = updateSubject(feet);
        controller.update(subject, 1/60, false);
        obstruction.update(camera, rendered, orbit.target, subject, 1/60, false, controller.characterVisible);
        const verticalDelta = rendered.position.y - renderedY;
        if (Math.abs(feet.z) < 3.45) verticalVelocityVariation += Math.abs(verticalDelta - previousDelta);
        renderedY = rendered.position.y;
        previousDelta = verticalDelta;
        maximumStep = Math.max(maximumStep, Math.abs(feet.y - previous.y));
        maximumCameraStep = Math.max(maximumCameraStep, Math.abs(camera.position.y - cameraY));
        previous = feet;
        cameraY = camera.position.y;
      }
      obstruction.dispose();
      assert.ok(maximumStep > .17, 'feet still climb physical steps');
      assert.ok(maximumCameraStep < .04, JSON.stringify({ view, direction, maximumCameraStep }));
      assert.ok(verticalVelocityVariation < (direction > 0 ? .8 : .2), JSON.stringify({ view, direction, verticalVelocityVariation }));
      assert.ok(Math.abs(character.snapshot.y - (direction > 0 ? 14.4 : 10.8)) < 1e-5);
    }
  }
});

test('manor navigation drives the character through doors, basement, four floors and roof', () => {
  const character = new CharacterController(world, defaultCapsule, point(0, 0, 18));
  const navigation = new DestinationNavigation(world);
  const itinerary = [point(-5, -3.6, -2.5), point(-4.2, 3.6, -3.6), point(6.8, 7.2, 0),
    point(0, 10.8, -3), point(-4.1, 14.4, 0), point(-5.9, 0, -10.4), point(5.9, 0, 10.4)];
  for (const target of itinerary) {
    assert.equal(navigation.select(character.snapshot, target), true, JSON.stringify(target));
    for (let frame = 0; frame < 2400 && navigation.status === 'running'; frame++) {
      character.update(1/30, navigation.sample(character.snapshot, 1/30));
    }
    assert.equal(navigation.status, 'arrived', JSON.stringify({ target, actual: character.snapshot }));
  }
});

test('manor fixed Street camera keeps its overhead pose during a courtyard-to-roof run', () => {
  const character = new CharacterController(world, defaultCapsule, point(-5.9, 0, -10.4));
  const navigation = new DestinationNavigation(world);
  assert.ok(navigation.select(character.snapshot, point(-4.1, 14.4, 0)));
  const desired = new PerspectiveCamera();
  const rendered = new PerspectiveCamera();
  const target = new Vector3(0, 0, 0);
  desired.position.set(0, 35, .01);
  desired.lookAt(target);
  const obstruction = new CameraObstruction(scene);
  let encounteredObstruction = false;
  for (let frame = 0; frame < 2400 && navigation.status === 'running'; frame++) {
    const feet = character.update(1/30, navigation.sample(character.snapshot, 1/30));
    const subject = { ...feet, y: world.cameraGroundHeight(feet), height: 1.8 };
    if (!encounteredObstruction) {
      obstruction.update(desired, rendered, target, subject, 0, true);
      encounteredObstruction = !rendered.position.equals(desired.position);
    }
    obstruction.update(desired, rendered, target, subject, 1/30, false, true, undefined, false);
    assert.ok(rendered.position.equals(desired.position));
    assert.ok(rendered.quaternion.equals(desired.quaternion));
  }
  assert.ok(encounteredObstruction, 'regular auto zoom changes the pose along this route');
  assert.equal(navigation.status, 'arrived');
  obstruction.dispose();
});

test('manor on different floors validates only matching stair landings', () => {
  const layered = manorWalkableWorld(scene);
  const sweep = layered.query.groundSegment.bind(layered.query);
  let crossLayerChecks = 0;
  const same = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z;
  layered.query.groundSegment = (from, to, capsule) => {
    if (from.y !== to.y) {
      crossLayerChecks++;
      assert.ok(layered.navigationPortals.some(({ lower, upper }) =>
        same(from, lower) && same(to, upper) || same(from, upper) && same(to, lower)));
    }
    return sweep(from, to, capsule);
  };
  const nav = new DestinationNavigation(layered);
  const roof = point(-4.1, 14.4, 0), garden = point(-5.9, 0, -10.4);
  assert.ok(nav.select(roof, garden));
  assert.equal(crossLayerChecks, 4);
  assert.ok(nav.select(roof, garden));
  assert.equal(crossLayerChecks, 4, 'static links are reused on subsequent clicks');
});

test('manor navigation connects a destination and an origin midway up a staircase', () => {
  const character = new CharacterController(world);
  assert.ok(character.relocate(point(4.5, 10.8, -4.55)));
  const navigation = new DestinationNavigation(world);
  for (const destination of [point(3.5, 12.78, .17), point(0, 14.4, 4.7), point(-5.9, 0, -10.4)]) {
    assert.ok(navigation.select(character.snapshot, destination), JSON.stringify(destination));
    for (let frame = 0; frame < 2400 && navigation.status === 'running'; frame++) {
      character.update(1/30, navigation.sample(character.snapshot, 1/30));
    }
    assert.equal(navigation.status, 'arrived', JSON.stringify({ destination, actual: character.snapshot }));
  }
});

test('manor sweep blocks pool walls and stairs guards, and ceilings prevent layer shortcuts', () => {
  assert.equal(segmentClear(point(5.9, 0, 10.4), point(5.9, 0, 13), world), false);
  assert.equal(segmentClear(point(-5.9, 0, -10.4), point(-5.9, 0, -13), world), false);
  assert.equal(segmentClear(point(-1.4, 0, -7.94), point(-3.7, 0, -7.94), world), false);
  const guard = world.query.sweep(point(3.5, 14.4, -4.5), point(0, 0, 2), defaultCapsule);
  assert.match(guard.value?.id ?? '', /Stair_landing_guard/);
  const slab = world.query.sweep(point(1, 0, 0), point(0, 4, 0), defaultCapsule);
  assert.match(slab.value?.id ?? '', /West_gallery/);
});

test('manor rejects pool destinations and running jumps from both gardens', () => {
  const picker = new GroundPicker([scene]);
  const camera = new PerspectiveCamera(65, 1, .01, 40);
  for (const direction of [-1, 1]) {
    const x = direction * 5.9, z = direction * 13;
    const character = new CharacterController(world, defaultCapsule, { x, z: direction * 10.4 });
    for (let frame = 0; frame < 30; frame++) {
      character.update(1/30, { x: 0, z: direction, run: true, jump: frame === 0 });
    }
    assert.ok(Math.abs(character.snapshot.z) < 11.29, 'the character stays outside the pool');
    camera.position.set(x, 6, z);
    camera.lookAt(x, 0, z);
    camera.updateMatrixWorld(true);
    assert.equal(picker.pick({ x: 100, y: 100 }, camera, 200, 200, false, world, [], true), null);
  }
});

test('manor point-to-run reaches the west room and primary suite behind furniture', () => {
  const trips = [
    [point(0, 0, 0), point(-5.5, 0, 6)],
    [point(-5, 3.6, 0), point(-7.1, 3.6, -5.6)],
  ];
  for (const [start, end] of trips) {
    const character = new CharacterController(world);
    assert.equal(character.relocate(start), true);
    const navigation = new DestinationNavigation(world);
    assert.equal(navigation.select(character.snapshot, end), true);
    for (let frame = 0; frame < 600 && navigation.status === 'running'; frame++) {
      character.update(1/30, navigation.sample(character.snapshot, 1/30));
    }
    assert.equal(navigation.status, 'arrived', JSON.stringify(end));
  }
});

test('manor picks the visible floor under its runner at each height', () => {
  const picker = new GroundPicker([scene]);
  const camera = new PerspectiveCamera(65, 1, .01, 40);
  for (const y of [-3.6, 0, 3.6, 7.2, 10.8, 14.4]) {
    camera.position.set(-.5, y + 2, 4);
    camera.lookAt(-.5, y, 4);
    camera.updateMatrixWorld(true);
    const picked = picker.pick({ x: 100, y: 100 }, camera, 200, 200, false, world, [], false);
    assert.ok(picked && Math.abs(picked.y - y) < 1e-5, JSON.stringify({ picked, y }));
  }
});


