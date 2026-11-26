import test from 'node:test';
import assert from 'node:assert/strict';
import { createCave } from '../src/scene/CaveScene.ts';
import { environmentLight } from '../src/scene/EnvironmentLights.ts';

test('light configuration is atomic and snapshots cannot mutate source state', () => {
  const light = environmentLight('a', 'A', 'torch', 3,
    { enabled: true, intensity: 1, color: '#ffffff', effects: true }, () => {});
  const before = light.getSettings();
  for (const patch of [{ intensity: NaN }, { intensity: 4 }, { color: 'red' }, { enabled: 1 }, { effects: null }]) {
    assert.equal(light.configure(patch), false);
    assert.deepEqual(light.getSettings(), before);
  }
  light.getSettings().enabled = false;
  assert.equal(light.getSettings().enabled, true);
});

test('all cave sources can be enabled and animated without overriding manual controls', () => {
  const cave = createCave();
  try {
    assert.equal(cave.lights.length, 32);
    for (const [kind, count, minimum] of [['torch', 10, 5], ['crystal', 20, 13]]) {
      const sources = cave.lights.filter(light => light.kind === kind);
      assert.equal(sources.length, count);
      assert.ok(sources.filter(light => light.getSettings().enabled).length >= minimum);
      for (const source of sources) {
        source.configure({ enabled: true, intensity: 2, color: '#00ff00', effects: false });
      }
    }
    cave.update(.05, false);
    const fixtures = cave.environment.getObjectByName('Cave fixtures');
    for (const fixture of fixtures.children) {
      const light = fixture.children.find(child => child.isPointLight);
      const core = fixture.children.find(child => child.isMesh && child.userData.cameraObstruction === false);
      const particles = fixture.children.find(child => child.isPoints);
      assert.equal(light.visible, true);
      assert.equal(light.intensity, fixture.name === 'Torch' ? 48 : 30);
      assert.equal(light.color.getHexString(), '00ff00');
      assert.equal(core.visible, true);
      assert.equal(particles.visible, false);
    }
    const source = cave.lights.find(light => light.id === 'torch-1');
    source.configure({ effects: true, enabled: false });
    cave.update(.05, false);
    assert.equal(fixtures.children[0].children.find(child => child.isPoints).visible, false);
    source.configure({ enabled: true });
    cave.update(.05, false);
    assert.equal(fixtures.children[0].children.find(child => child.isPoints).visible, true);
    cave.update(.05, true);
    assert.equal(fixtures.children[0].children.find(child => child.isPoints).visible, false);
    const sun = cave.lights.find(light => light.id === 'sun');
    sun.configure({ enabled: false, color: '#ff0000', intensity: 2 });
    cave.solar.configure({ hour: 11 });
    assert.equal(cave.environment.getObjectByName('Sun shaft').visible, false);
    assert.equal(sun.getSettings().enabled, false);
    sun.configure({ enabled: true, effects: false });
    assert.equal(cave.environment.getObjectByName('Sun shaft').visible, false);
    sun.configure({ effects: true });
    assert.equal(cave.environment.getObjectByName('Sun shaft').visible, true);
    sun.configure({ intensity: 0 });
    assert.equal(cave.environment.getObjectByName('Sun shaft').visible, false);
  } finally { cave.dispose(); }
});
