import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MeshStandardMaterial } from 'three';
import { preparePointLightMaterial } from '../src/engine/PointLightShader.ts';

test('large point-light sets use a compact loop while shadow samplers keep static indices', () => {
  const material = new MeshStandardMaterial();
  preparePointLightMaterial(material);
  for (const [numPointLights, numPointLightShadows, compact] of [[30, 0, true], [30, 1, false], [14, 0, false]]) {
    const shader = { fragmentShader: '#include <lights_fragment_begin>', numPointLights, numPointLightShadows };
    material.onBeforeCompile(shader);
    if (!compact) {
      assert.equal(shader.fragmentShader, '#include <lights_fragment_begin>');
      continue;
    }
    const pointSection = shader.fragmentShader.split('SpotLight spotLight;')[0];
    assert.match(pointSection, /for \( int i = 0; i < NUM_POINT_LIGHTS; i \+\+ \)/);
    assert.match(pointSection, /RE_Direct\( directLight/);
    assert.doesNotMatch(pointSection, /unroll_loop|UNROLLED_LOOP_INDEX|getPointShadow\(/);
  }
  material.dispose();
});
