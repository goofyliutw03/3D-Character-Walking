import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from 'three';
import { WetLensState } from '../src/water/WetLensState.ts';
import { WetLensEffect } from '../src/water/WetLensEffect.ts';
import { createSpraySource, SprayExposure } from '../src/water/SpraySource.ts';

const options={enabled:true,paused:false,quality:'standard',reducedMotion:false};
function advance(state,seconds,exposure=1,patch={}) {for(let i=0;i<Math.ceil(seconds/.05);i++)state.update(.05,exposure,{...options,...patch});}

test('lens 2.2–2.4: smooth wetting, bounded reentry and complete draining with falling residual drops',()=>{
  const state=new WetLensState();advance(state,1);
  const wet=state.snapshot;assert.ok(wet.mist>.5&&wet.mist<1);assert.ok(wet.drops.length>0&&wet.drops.length<=24);
  const first=wet.drops[0];state.update(.05,0,options);
  const next=state.snapshot.drops.find(d=>d.id===first.id);assert.ok(next.y<first.y);
  assert.equal(state.snapshot.emitted,wet.emitted);
  for(let i=0;i<400;i++)advance(state,.1,i%2);
  assert.ok(state.snapshot.drops.length<=24);
  advance(state,4.05,0);assert.equal(state.snapshot.drops.length,0);
  advance(state,4,0);assert.equal(state.snapshot.mist,0);
  assert.equal(state.configure({nearDistance:4,farDistance:3}),false);
  assert.equal(state.configure({exitSeconds:NaN}),false);
  assert.equal(state.configure({nearDistance:.5,farDistance:4,exitSeconds:2}),true);
});

test('lens 3.1–3.4: pause, disabled, reduced motion, invalid time and quality cannot resurrect drops',()=>{
  const state=new WetLensState();advance(state,12);
  const before=state.snapshot;advance(state,1,0,{paused:true});assert.deepEqual(state.snapshot,before);
  state.update(NaN,1,options);state.update(-1,1,options);assert.deepEqual(state.snapshot,before);
  state.update(.05,1,{...options,quality:'low'});assert.ok(state.snapshot.drops.length<=10);
  advance(state,1,1,{reducedMotion:true});assert.equal(state.snapshot.drops.length,0);assert.ok(state.snapshot.mist>0);
  state.update(0,1,{...options,enabled:false});assert.equal(state.snapshot.mist,0);
  assert.equal(state.snapshot.drops.length,0);state.update(0,0,options);assert.equal(state.snapshot.drops.length,0);
  state.dispose();advance(state,1);assert.equal(state.snapshot.mist,0);
});

test('source 2.1/2.4: actual camera, distance, backside, translated source and physical occlusion',()=>{
  const exposure=new SprayExposure(),source=createSpraySource(),camera=new PerspectiveCamera(),env=new Group();
  camera.position.set(0,1.1,1);assert.ok(exposure.sample(camera,source,env,1,3)>0);
  camera.position.set(0,1.1,6);assert.equal(exposure.sample(camera,source,env,1,3),0);
  camera.position.set(0,1.1,-2);assert.equal(exposure.sample(camera,source,env,1,3),0);
  camera.position.set(0,1.1,1);
  const wall=new Mesh(new BoxGeometry(2,3,.1),new MeshBasicMaterial({transparent:true,opacity:.25}));wall.position.set(0,1,0);env.add(wall);
  assert.equal(exposure.sample(camera,source,env,1,3),0);
  wall.userData.cameraObstruction=false;assert.ok(exposure.sample(camera,source,env,1,3)>0);
  wall.userData.cameraObstruction=true;env.visible=false;assert.ok(exposure.sample(camera,source,env,1,3)>0);
  env.visible=true;env.remove(wall);source.matrixWorld.makeTranslation(0,0,-20);camera.position.z=-19;
  assert.ok(exposure.sample(camera,source,env,1,3)>0);
  const parent=new Group();parent.position.z=-20;parent.add(camera);camera.position.z=1;
  assert.ok(exposure.sample(camera,source,env,1,3)>0);
  wall.geometry.dispose();wall.material.dispose();
});

test('lens render 3.3/3.4: no dry draw, final target and autoClear restored even on failure',()=>{
  const effect=new WetLensEffect(),camera=new PerspectiveCamera(),source=createSpraySource(),env=new Group();camera.position.set(0,1.1,1);
  let calls=0;const target={name:'final'},renderer={autoClear:true,getRenderTarget:()=>target,setRenderTarget:t=>assert.equal(t,target),getDrawingBufferSize:v=>v.set(800,600),render:()=>{calls++;}};
  effect.render(renderer,false);assert.equal(calls,0);
  for(let i=0;i<30;i++)effect.update(.05,camera,source,env,{enabled:true,paused:false,quality:'standard',flowSpeed:1},false);
  effect.render(renderer,true);assert.equal(calls,1);assert.equal(renderer.autoClear,true);
  renderer.render=()=>{throw Error('GPU failure');};assert.throws(()=>effect.render(renderer,false),/GPU failure/);assert.equal(renderer.autoClear,true);
  effect.enabled=false;effect.render(renderer,false);assert.equal(effect.snapshot.mist,0);
  effect.dispose();effect.dispose();
});
