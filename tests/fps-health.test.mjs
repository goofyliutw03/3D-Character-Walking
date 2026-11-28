import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fpsBoundary, fpsHealth } from '../src/ui/FpsHealth.ts';

test('FPS state uses strict thresholds at 30 and 15', () => {
  assert.deepEqual([60, 30, 29, 15, 14, 0].map(fpsHealth),
    ['normal', 'normal', 'warning', 'warning', 'critical', 'critical']);
});

test('FPS recording triggers once per severity change, including skipped bands and recovery', () => {
  assert.equal(fpsBoundary(undefined, 12), undefined);
  assert.equal(fpsBoundary(29, 15), undefined);
  assert.deepEqual(fpsBoundary(30, 29), { fps: 29, previousFps: 30, from: 'normal', to: 'warning' });
  assert.deepEqual(fpsBoundary(15, 14), { fps: 14, previousFps: 15, from: 'warning', to: 'critical' });
  assert.deepEqual(fpsBoundary(47, 11), { fps: 11, previousFps: 47, from: 'normal', to: 'critical' });
  assert.deepEqual(fpsBoundary(11, 35), { fps: 35, previousFps: 11, from: 'critical', to: 'normal' });
});
