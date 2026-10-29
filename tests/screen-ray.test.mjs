import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { screenRay } from '../src/camera/ScreenRay.ts';
import { projectAnchor } from '../src/camera/AnchorProjection.ts';

test('mobile 2.1,2.4: screen rays invert actual perspective and equidistant projection', () => {
  const camera = new PerspectiveCamera(65, 1, 0.1, 100);
  camera.position.set(3, 8, 12); camera.lookAt(-1, 0, -4);
  for (const [width, height] of [[390, 600], [844, 200], [500, 500]]) {
    camera.aspect = width / height; camera.updateProjectionMatrix();
    for (const fisheye of [false, true]) {
      for (const local of [new Vector3(0, 0, -5), new Vector3(1, -1, -6), new Vector3(-2, 1, -6)]) {
        camera.updateMatrixWorld();
        const world = local.clone().applyMatrix4(camera.matrixWorld);
        const p = projectAnchor(world, camera, width, height, fisheye);
        assert.ok(p);
        const ray = screenRay(p, camera, width, height, fisheye);
        assert.ok(ray.distanceToPoint(world) < 1e-6);
        assert.ok(ray.origin.distanceTo(camera.position) < 1e-6);
      }
    }
  }
  for (const [p, w, h, fish] of [[{ x: 0, y: 0 }, 844, 200, true], [{ x: -1, y: 20 }, 400, 600, false], [{ x: NaN, y: 0 }, 400, 600, false], [{ x: 1, y: 1 }, 0, 10, true]]) {
    assert.equal(screenRay(p, camera, w, h, fish), null);
  }
});
