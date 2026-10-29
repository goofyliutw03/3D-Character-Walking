import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { CityScene } from '../src/scene/CityScene.ts';
import { projectAnchor } from '../src/camera/AnchorProjection.ts';
import { pickGround } from '../src/navigation/GroundPicker.ts';

test('mobile 2.3: real city road/sidewalk/paint are accepted; trees, grass, bounds and occlusion rejected', () => {
  const city = new CityScene();
  const camera = new PerspectiveCamera(70, 1, 0.1, 100);
  const pick = (x, z, y, fish = false) => {
    camera.position.set(x, 12, z + 4); camera.lookAt(x, y, z); camera.updateMatrixWorld();
    const p = projectAnchor(new Vector3(x, y, z), camera, 500, 500, fish);
    return pickGround(p, camera, 500, 500, fish, city.scene.children, city.walkableWorld);
  };
  try {
    for (const fish of [false, true]) {
      for (const [x, z, y] of [[1, 5, 0.05], [6.4, 6, 0.3], [0, 5, 0.07], [0, 0, 0.075]]) {
        const p = pick(x, z, y, fish);
        assert.ok(p, `${x},${z}`); assert.ok(Math.hypot(p.x - x, p.z - z) < 0.03);
      }
      assert.equal(pick(7.2, 1, 0.3, fish), null);
      assert.equal(pick(6.4, -10, 0.3, fish), null);
      assert.equal(pick(15, 0, 0, fish), null);
      assert.equal(pick(8.2, 5, 0.3, fish), null);
    }
    camera.position.set(7.2, 2, 5); camera.lookAt(7.2, 0.3, -3); camera.updateMatrixWorld();
    const p = projectAnchor(new Vector3(7.2, 0.3, -3), camera, 500, 500, false);
    assert.equal(pickGround(p, camera, 500, 500, false, city.scene.children, city.walkableWorld), null);
  } finally { city.dispose(); }
});
