import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WaterFeature } from '../src/water/WaterFeature.ts';
import { WaterBenchmark, summarizeFrames } from '../src/water/WaterBenchmark.ts';

test('Water 2.1–2.3: pause/off freeze all animation and resume without a time jump', () => {
  const water = new WaterFeature();
  water.update(.05); assert.equal(water.elapsed, .05);
  water.configure({paused:true}); water.update(100); assert.equal(water.elapsed,.05);
  water.configure({paused:false,enabled:false}); water.update(100); assert.equal(water.elapsed,.05);
  water.configure({enabled:true}); water.update(.05); assert.equal(water.elapsed,.1);
  water.update(NaN); water.update(-1); assert.equal(water.elapsed,.1);
  water.update(50); assert.equal(water.elapsed,.2);
  water.dispose();
});

test('Water 2.3–2.4: invalid configuration is atomic and snapshots are isolated', () => {
  const water = new WaterFeature(), defaults=water.settings;
  for (const patch of [{flowSpeed:NaN},{waveStrength:Infinity},{waveStrength:-1},{flowSpeed:4},{quality:'ultra'},{paused:1}]) {
    assert.equal(water.configure({...patch,enabled:false}),false);
    assert.deepEqual(water.settings,defaults);
  }
  const copy=water.settings; copy.flowSpeed=500; assert.deepEqual(water.settings,defaults);
  assert.equal(water.configure({flowSpeed:0,waveStrength:0,quality:'low'}),true);
  water.dispose();
});

test('Water 2.4: quality replacement and repeated disposal release each owned resource once', () => {
  const water=new WaterFeature(); let geometries=0,materials=0;
  const old=water.root.children[0].geometry;
  old.addEventListener('dispose',()=>geometries++);
  water.configure({quality:'low'}); assert.equal(geometries,1);
  assert.notEqual(water.root.children[0].geometry,old);
  water.root.traverse(o=>{if(o.isMesh){o.geometry.addEventListener('dispose',()=>geometries++);o.material.addEventListener('dispose',()=>materials++);}});
  water.dispose(); water.dispose();
  assert.equal(geometries,3); assert.equal(materials,2);
  const time=water.elapsed; water.update(.1); assert.equal(water.elapsed,time);
  assert.equal(water.configure({enabled:true}),false); assert.equal(water.root.children.length,0);
});

test('Water 3.1: statistics retain slow frames and use time-weighted FPS',()=>{
  const frames=[10,10,10,10,160], original=[...frames];
  assert.deepEqual(summarizeFrames(frames),{fps:25,medianMs:10,p95Ms:160});
  assert.deepEqual(frames,original);
  assert.throws(()=>summarizeFrames([])); assert.throws(()=>summarizeFrames([NaN]));
});

test('Water 3.1–3.2: six warmed segments, stable extrema and explicit cancellation',()=>{
  const b=new WaterBenchmark(10,30), stats={calls:2,triangles:20,geometries:2,textures:0,programs:2};
  b.start(0);let now=0;
  for(let segment=0;segment<6;segment++){
    assert.equal(b.enabled,segment%2===1);
    now+=10;b.sample(now,stats);assert.equal(b.results.length,segment);
    now+=10;b.sample(now,stats);now+=10;b.sample(now,{...stats,calls:3});now+=10;b.sample(now,stats);
    assert.equal(b.results.length,segment+1);
    assert.equal(b.results.at(-1).resources.min.calls,2);assert.equal(b.results.at(-1).resources.max.calls,3);
  }
  assert.equal(b.running,false);assert.equal(b.results.length,6);assert.equal(b.results[5].round,3);
  b.start(now);assert.equal(b.results.length,0);b.cancel('hidden');b.sample(now+1000,stats);
  assert.equal(b.running,false);assert.match(b.status,/hidden/);assert.equal(b.results.length,0);
});
