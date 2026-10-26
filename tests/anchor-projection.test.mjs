import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { projectAnchor } from '../src/camera/AnchorProjection.ts';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
test('expressions 3.1–3.3: perspective center, camera updates and clipping', () => {
  const camera = new PerspectiveCamera(60, 2, 0.1, 100);
  assert.deepEqual(projectAnchor(new Vector3(0, 0, -5), camera, 800, 400, false), { x: 400, y: 200 });
  for (const point of [new Vector3(0, 0, 5), new Vector3(0, 0, -0.05), new Vector3(0, 0, -101), new Vector3(100, 0, -5)]) {
    assert.equal(projectAnchor(point, camera, 800, 400, false), null);
  }
  camera.position.set(3, 2, 4);
  camera.lookAt(3, 2, -1);
  const p = projectAnchor(new Vector3(3, 2, -1), camera, 800, 400, false);
  close(p.x, 400); close(p.y, 200);
  assert.equal(projectAnchor(new Vector3(), camera, 0, 400, false), null);
  assert.equal(projectAnchor(new Vector3(NaN, 0, 0), camera, 800, 400, false), null);
});

test('expressions 3.2: fisheye off-axis inverse matches shader at portrait and landscape sizes', () => {
  const camera = new PerspectiveCamera(160, 2, 0.1, 100);
  const halfFov = 80 * Math.PI / 180;
  for (const [width, height] of [[800, 400], [400, 800], [500, 500]]) {
    assert.deepEqual(projectAnchor(new Vector3(0, 0, -5), camera, width, height, true), { x: width / 2, y: height / 2 });
    for (const theta of [0.2, 0.7, 1.2]) {
      const phi = 0.6;
      const v = new Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), -Math.cos(theta)).multiplyScalar(5);
      const p = projectAnchor(v, camera, width, height, true);
      const radius = Math.min(width, height) / 2;
      const x = (p.x - width / 2) / radius, y = (height / 2 - p.y) / radius;
      const r = Math.hypot(x, y);
      close(r, theta / halfFov);
      const shaderSourceRadius = Math.tan(r * halfFov) / Math.tan(halfFov);
      close(x / r * shaderSourceRadius, v.x / -v.z / Math.tan(halfFov));
      close(y / r * shaderSourceRadius, v.y / -v.z / Math.tan(halfFov));
    }
  }
  assert.equal(projectAnchor(new Vector3(10, 0, -1), camera, 800, 400, true), null);
  assert.equal(projectAnchor(new Vector3(0, 0, 1), camera, 800, 400, true), null);
});
