import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Group } from 'three';
import { WATER_API_VERSION, WaterShaderModule, WaterFeature } from '../src/water/index.ts';
import { SceneAppearance } from '../src/scene/SceneAppearance.ts';

test('water API 3.1–3.3: material-only instances are independent, atomic and disposable', () => {
  assert.equal(WATER_API_VERSION, 1);
  const a = new WaterShaderModule(), b = new WaterShaderModule();
  assert.equal(a.root, undefined);
  a.configure({flowSpeed:2}); a.update(.05);
  assert.equal(a.elapsed,.05); assert.equal(b.elapsed,0); assert.equal(b.settings.flowSpeed,1);
  const before=a.settings;
  assert.equal(a.configure({enabled:false,flowSpeed:NaN}),false); assert.deepEqual(a.settings,before);
  a.configure({paused:true}); a.update(2); assert.equal(a.elapsed,.05);
  a.configure({paused:false,enabled:false}); a.update(2); assert.equal(a.elapsed,.05);
  a.configure({enabled:true}); a.update(-1); a.update(Infinity); assert.equal(a.elapsed,.05);
  a.update(2); assert.ok(Math.abs(a.elapsed-.15)<1e-9);
  let disposed=0;
  for(const m of [a.surfaceMaterial,a.fallMaterial]) m.addEventListener('dispose',()=>disposed++);
  a.dispose(); a.dispose(); assert.equal(disposed,2); assert.equal(a.configure({paused:false}),false);
  a.update(.1); assert.ok(Math.abs(a.elapsed-.15)<1e-9); b.dispose();
});

test('water API 2.3/3.2: appearance copies share animation but own opacity and restore safely', () => {
  const water = new WaterFeature(), environment = new Group(); environment.add(water.root);
  const meshes=water.root.children.filter(m=>m.isMesh);
  const appearance=new SceneAppearance(environment), originals=meshes.map(m=>m.material);
  for (const mode of ['transparent','wireframe','transparent']) {
    appearance.apply(mode,new Set([water.root]));
    water.configure({flowSpeed:2,waveStrength:.5}); water.update(.05);
    meshes.forEach((mesh,i)=>{
      const clone=mesh.material; assert.notEqual(clone,originals[i]);
      assert.equal(clone.uniforms.uTime,originals[i].uniforms.uTime);
      assert.equal(clone.uniforms.uTime.value,water.elapsed);
      assert.equal(clone.uniforms.uWave.value,.5);
      clone.onBeforeRender(); originals[i].onBeforeRender();
      assert.equal(clone.uniforms.uOpacity.value,mode==='transparent'?.25:1);
      assert.equal(originals[i].uniforms.uOpacity.value,1);
      assert.equal(clone.wireframe,mode==='wireframe');
    });
  }
  appearance.dispose(); meshes.forEach((m,i)=>assert.equal(m.material,originals[i]));
  water.dispose();
});
