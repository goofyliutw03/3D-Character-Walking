import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { CameraController } from '../src/camera/CameraController.ts';
import { FollowCamera } from '../src/camera/FollowCamera.ts';
import { FirstPersonCamera } from '../src/camera/FirstPersonCamera.ts';
import { CityScene } from '../src/scene/CityScene.ts';

const pose = (x, z, heading, height = 1.8) => ({ x, y: Math.abs(x) >= 4.5 ? 0.32 : 0.075, z, heading, height, eyeHeight: height * 0.88, eyeForward: 0.17, speed: 0, grounded: true, action: 'idle' });
function setup(aspect = 1.5) {
  const city = new CityScene(); city.scene.updateMatrixWorld(true);
  const camera = new PerspectiveCamera(43, aspect, 0.1, 200);
  const controls = { target: new Vector3(), enabled: true, enableDamping: true, update() {} };
  const obstruction = new FollowCamera([...city.scene.children]);
  const rig = new CameraController(camera, controls, obstruction, new FirstPersonCamera());
  return { city, camera, controls, rig, obstruction };
}
function visibleBody(camera, subject) {
  camera.updateMatrixWorld(true);
  for (const y of [0, subject.height]) {
    const projected = new Vector3(subject.x, subject.y + y, subject.z).project(camera);
    assert.ok(Math.abs(projected.y) < 0.95, `body endpoint clipped at ${projected.y}`);
    assert.ok(projected.z > -1 && projected.z < 1);
  }
}
test('Front near a real city wall or tree preserves body framing without crossing scenery', () => {
  for (const aspect of [1.5, 390 / 500]) for (const height of [1.8, 1.65, 1.15]) {
    const { city, camera, controls, rig, obstruction } = setup(aspect);
    try {
      for (const subject of [pose(8.02, -7, Math.PI / 2, height), pose(6.1, 1, Math.PI / 2, height), pose(-8.02, -7, -Math.PI / 2, height)]) {
        rig.select('front', subject, true);
        visibleBody(camera, subject);
        const offset = camera.position.clone().sub(controls.target);
        assert.ok(offset.x * Math.sin(subject.heading) + offset.z * Math.cos(subject.heading) > 0, 'stay in the front hemisphere');
        const safe = camera.position.clone(); obstruction.constrain(camera, controls.target);
        assert.ok(camera.position.distanceTo(safe) < 1e-8, 'frame remains constrained');
        for (const height of [0, subject.height]) {
          obstruction.constrain(camera, new Vector3(subject.x, subject.y + height, subject.z));
          assert.ok(camera.position.distanceTo(safe) < 1e-8, 'head and feet sightlines remain clear');
        }
        rig.setFollowing(false, subject, true);
        rig.update({ ...subject, z: subject.z + 1 }, 1 / 60, false);
        assert.ok(camera.position.distanceTo(safe) < 1e-8);
      }
    } finally { city.dispose(); }
  }
});
test('Front keeps the original unobstructed heading and settles after a blocked transition', () => {
  const { city, camera, controls, rig } = setup();
  try {
    const open = pose(0, 5, Math.PI);
    rig.select('front', open, true);
    assert.ok(Math.abs(camera.position.x) < 1e-8);
    assert.ok(Math.abs(camera.position.z - (open.z - 6)) < 1e-8);
    const blocked = pose(8.02, -7, Math.PI / 2);
    rig.select('front', blocked, false);
    for (let i = 0; i < 180; i++) rig.update(blocked, 1 / 60, false);
    assert.equal(rig.transitioning, false);
    visibleBody(camera, blocked);
    const settled = camera.position.clone();
    for (let i = 0; i < 60; i++) rig.update(blocked, 1 / 60, false);
    assert.ok(camera.position.distanceTo(settled) < 1e-8, 'stationary fallback does not oscillate');
    rig.select('first-person', blocked, true); assert.equal(rig.characterVisible, false);
    rig.select('front', blocked, true); assert.equal(rig.characterVisible, true); visibleBody(camera, blocked);
  } finally { city.dispose(); }
});
