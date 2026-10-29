import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from 'three';
import { CameraObstruction } from '../src/camera/CameraObstruction.ts';
import { CameraController } from '../src/camera/CameraController.ts';
import { FollowCamera } from '../src/camera/FollowCamera.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { pickGround } from '../src/navigation/GroundPicker.ts';
import { CityScene } from '../src/scene/CityScene.ts';

const subject = { x: 0, y: 0, z: 0, heading: 0, height: 1.8, eyeHeight: 1.6, eyeForward: 0.17 };
function setup() {
  const environment = new Group();
  const wall = new Mesh(new BoxGeometry(8, 8, 1), new MeshStandardMaterial());
  wall.position.set(0, 3, -3); environment.add(wall); environment.updateMatrixWorld(true);
  const desired = new PerspectiveCamera(43, 1.5, 0.1, 200), rendered = desired.clone();
  desired.position.set(0, 3, -8); const target = new Vector3(0, 1.17, 0); desired.lookAt(target);
  const effect = new CameraObstruction(environment);
  const tick = (immediate = false, external = true, pose = subject) => effect.update(desired, rendered, target, pose, 1 / 60, immediate, external);
  const dispose = () => { effect.dispose(); wall.geometry.dispose(); wall.material.dispose(); };
  return { environment, wall, desired, rendered, target, effect, tick, dispose };
}

test('obstruction 2.1–2.3: zoom approaches and returns smoothly after prolonged obstruction without corrupting desired', () => {
  const { environment, wall, desired, rendered, target, tick, dispose } = setup();
  try {
    const original = desired.position.clone(), focus = target.clone(), fullDistance = desired.position.distanceTo(focus);
    tick(); let previous = rendered.position.distanceTo(focus);
    assert.ok(previous < fullDistance && previous > 3);
    for (let frame = 0; frame < 180; frame++) {
      tick(); const distance = rendered.position.distanceTo(focus); assert.ok(distance <= previous + 1e-9); previous = distance;
    }
    assert.ok(rendered.position.z > -2.5); assert.deepEqual(desired.position, original);
    wall.position.x = 20; environment.updateMatrixWorld(true);
    tick(); assert.ok(rendered.position.distanceTo(focus) > previous); assert.ok(rendered.position.distanceTo(focus) < fullDistance);
    for (let frame = 0; frame < 180; frame++) tick();
    assert.ok(rendered.position.distanceTo(original) < 1e-8);
    desired.position.set(4, 4, -10); desired.lookAt(target); tick(true);
    assert.deepEqual(rendered.position, desired.position);
  } finally { dispose(); }
});

test('obstruction 3.1–3.2: all layered blockers fade as groups, clear on exit, ignore hidden ancestors', () => {
  const { environment, wall, desired, rendered, effect, tick, dispose } = setup();
  const building = new Group(), secondWall = new Mesh(wall.geometry, wall.material), neighbor = new Mesh(wall.geometry, wall.material);
  secondWall.position.set(0, 3, -5); neighbor.position.set(20, 3, -3); building.add(secondWall); environment.add(building, neighbor);
  const original = wall.material;
  try {
    effect.setMode('transparent'); environment.updateMatrixWorld(true); tick(true);
    assert.equal(wall.material.opacity, 0.25); assert.equal(secondWall.material.opacity, 0.25);
    assert.equal(neighbor.material, original); assert.deepEqual(rendered.position, desired.position);
    building.visible = false; tick(); assert.equal(secondWall.material, original);
    wall.visible = false; tick(); assert.equal(wall.material, original);
    wall.visible = true; building.visible = true; tick(); assert.equal(wall.material.opacity, 0.25);
    effect.setMode('zoom'); assert.equal(wall.material, original); assert.equal(secondWall.material, original);
  } finally { dispose(); }
});

test('obstruction 4.1–4.3: first-person bypass, wireframe, projection and reduced motion restore completely', () => {
  const { wall, desired, rendered, effect, tick, dispose } = setup();
  const original = wall.material;
  try {
    tick(true); assert.ok(rendered.position.z > -2.5);
    effect.setMode('transparent'); tick(true); assert.equal(wall.material.opacity, 0.25);
    desired.fov = 70; desired.near = 0.04; desired.aspect = 0.6; desired.updateProjectionMatrix();
    tick(false, false); assert.equal(wall.material, original); assert.deepEqual(rendered.position, desired.position);
    assert.equal(rendered.fov, 70); assert.equal(rendered.near, 0.04); assert.equal(rendered.aspect, 0.6);
    assert.deepEqual(rendered.projectionMatrix, desired.projectionMatrix);
    effect.setMode('wireframe'); tick(false, false); assert.equal(wall.material.wireframe, true);
    assert.deepEqual(rendered.position, desired.position);
    effect.setMode('zoom'); tick(true); assert.equal(wall.material, original); assert.ok(rendered.position.z > -2.5);
    effect.dispose(); effect.dispose(); assert.equal(wall.material, original);
  } finally { dispose(); }
});

test('obstruction 3.1: transparent and wireframe retain original Front heading instead of avoidance angle', () => {
  const { environment, wall, desired, effect, tick, dispose } = setup();
  const controls = { target: new Vector3(), enabled: true, enableDamping: true, update() {} };
  const rig = new CameraController(desired, controls, new FollowCamera(environment.children), new FirstPersonCamera());
  const pose = { ...subject, heading: Math.PI };
  try {
    for (const mode of ['transparent', 'wireframe']) {
      effect.setMode(mode); rig.setObstructionAvoidance(false); rig.select('front', pose, true);
      assert.ok(Math.abs(desired.position.x) < 1e-8); assert.ok(Math.abs(desired.position.z + 6) < 1e-8);
      tick(true); assert.equal(wall.material[mode === 'wireframe' ? 'wireframe' : 'opacity'], mode === 'wireframe' ? true : 0.25);
    }
  } finally { dispose(); }
});

test('obstruction integration: real Orbit retains new rotation, zoom and pan while compressed, then returns to the updated pose', () => {
  const { environment, wall, desired, rendered, effect, dispose } = setup();
  const controls = new OrbitControls(desired);
  controls.target.set(0, 1.17, 0); controls.enableDamping = true;
  const rig = new CameraController(desired, controls, new FollowCamera(environment.children), new FirstPersonCamera());
  rig.select('third-person', subject, true); rig.setFollowing(false, subject, true);
  const tick = (pose = subject, immediate = false) => {
    rig.update(pose, 1 / 60, immediate);
    effect.update(desired, rendered, controls.target, pose, 1 / 60, immediate, rig.characterVisible);
  };
  try {
    for (let frame = 0; frame < 90; frame++) tick();
    const old = desired.position.clone();
    assert.ok(rendered.position.distanceTo(desired.position) > 1);
    // Model the changes OrbitControls' DOM handlers apply to its owned camera.
    desired.position.sub(controls.target).multiplyScalar(1.3).applyAxisAngle(new Vector3(0, 1, 0), 0.12).add(controls.target);
    desired.position.x += 0.3; controls.target.x += 0.3; controls.update();
    const updated = desired.position.clone(), updatedTarget = controls.target.clone(); tick();
    assert.ok(desired.position.distanceTo(updated) < 1e-8); assert.ok(desired.position.distanceTo(old) > 1);
    assert.deepEqual(controls.target, updatedTarget);
    wall.position.x = 20; environment.updateMatrixWorld(true);
    for (let frame = 0; frame < 180; frame++) tick();
    assert.ok(rendered.position.distanceTo(updated) < 1e-8);
    rig.beginCharacterOrbit(); tick({ ...subject, x: 2 }, true);
    assert.equal(controls.target.x, 2); assert.ok(rendered.position.distanceTo(desired.position) < 1e-8);
    effect.setMode('wireframe'); rig.select('fisheye', subject, true); tick(subject, true);
    assert.equal(effect.mode, 'wireframe'); assert.equal(rendered.fov, 160);
    rig.select('first-person', subject, true); tick(subject, true);
    assert.equal(rendered.near, 0.04); assert.equal(rendered.fov, 70); assert.equal(rig.characterVisible, false);
    effect.setMode('transparent'); rig.select('third-person', subject, true); tick(subject, true);
    assert.equal(rendered.near, 0.1); assert.equal(rendered.fov, 43); assert.equal(effect.mode, 'transparent');
  } finally { dispose(); }
});

test('obstruction integration: ground picking uses rendered pose in all modes with the real grouped city', () => {
  const city = new CityScene(), desired = new PerspectiveCamera(43, 1.5, 0.1, 200), rendered = desired.clone();
  const effect = new CameraObstruction(city.environment), pose = { ...subject, y: 0.075, z: 5 };
  desired.position.set(0, 15, 20); const target = new Vector3(0, 0.075, 0); desired.lookAt(target);
  try {
    for (const mode of ['zoom', 'transparent', 'wireframe']) {
      effect.setMode(mode); effect.update(desired, rendered, target, pose, 1 / 60, true);
      const picked = pickGround({ x: 450, y: 300 }, rendered, 900, 600, false, city.environment.children, city.walkableWorld);
      assert.ok(picked, mode); assert.ok(Math.abs(picked.x) < 0.1); assert.ok(Math.abs(picked.z) < 0.1);
    }
  } finally { effect.dispose(); city.dispose(); }
});
