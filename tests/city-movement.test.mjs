import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CityScene } from '../src/scene/CityScene.ts';
import { CharacterController } from '../src/character/CharacterController.ts';

test('3.1, 3.3: actual city publishes all street fixtures and safe surfaces', () => {
  const city = new CityScene();
  try {
    assert.ok(city.walkableWorld.obstacles.length >= 21);
    assert.equal(city.walkableWorld.groundHeight(0, 5), 0.075);
    assert.equal(city.walkableWorld.groundHeight(6, 5), 0.32);
    const controller = new CharacterController(city.walkableWorld);
    let state;
    for (let i = 0; i < 175; i++) state = controller.update(1 / 60, { x: 1, z: 0, run: false, jump: false });
    assert.ok(state.x > 5 && state.x < 5.5);
    assert.equal(state.y, 0.32);
    for (let i = 0; i < 120; i++) state = controller.update(1 / 60, { x: 0, z: -1, run: false, jump: false });
    assert.ok(state.z > 3 && state.z < 4);
    assert.equal(state.action, 'idle');
  } finally { city.dispose(); }
});
