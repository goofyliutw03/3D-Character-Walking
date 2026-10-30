import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Vector3 } from 'three';
import { ParticleInteraction } from '../src/interaction/ParticleInteraction.ts';
const origin=new Vector3(0,1,0),aim=new Vector3(0,1,6);
test('Particle 2.1–2.2: swept hit once, snapshot aim and settings',()=>{
  const p=new ParticleInteraction(); p.configure({...p.settings,speed:30});
  p.fire(origin,aim); aim.z=100;
  p.update(.25,new Vector3(0,1,6),.4);
  assert.equal(p.snapshot.hits,1); assert.equal(p.snapshot.active,1);
  p.update(.3,new Vector3(0,1,6),.4);
  assert.equal(p.snapshot.hits,1); assert.equal(p.snapshot.active,0);
  p.dispose(); aim.z=6;
});
test('Particle 2.1,2.3: no homing, lifetime and expiry do not hit beyond remaining flight',()=>{
  const p=new ParticleInteraction();p.configure({...p.settings,speed:10,lifetime:.1});
  p.fire(origin,new Vector3(0,1,10));p.update(1,new Vector3(0,1,5),.3);
  assert.equal(p.snapshot.hits,0);assert.equal(p.snapshot.expired,1);
  p.fire(origin,new Vector3(0,1,6)); p.update(.1,new Vector3(2,1,1),.3);
  assert.equal(p.snapshot.expired,2);p.dispose();
});
test('Particle 2.4,3.1,3.4: bounded, atomic validation, shrink, clear and idempotent disposal',()=>{
  const p=new ParticleInteraction(); const defaults=p.settings;
  for(const patch of [{speed:NaN},{size:0},{lifetime:Infinity},{maxCount:1.5},{color:'red'}]){
    assert.equal(p.configure({...defaults,...patch}),false);assert.deepEqual(p.settings,defaults);
  }
  assert.equal(p.configure({...defaults,maxCount:3}),true);
  for(let i=0;i<3;i++) assert.equal(p.fire(origin,aim),true);
  assert.equal(p.fire(origin,aim),false);assert.equal(p.snapshot.active,3);
  p.configure({...defaults,maxCount:1});assert.equal(p.snapshot.active,1);
  p.clear();assert.equal(p.root.children.length,0);assert.equal(p.snapshot.active,0);
  let disposed=0;p.geometry.addEventListener('dispose',()=>disposed++);
  p.dispose();p.dispose();assert.equal(disposed,1);assert.equal(p.fire(origin,aim),false);
});
test('Particle 2.1,3.1: configuration changes cannot redirect or accelerate in-flight shots',()=>{
  const p=new ParticleInteraction();p.configure({...p.settings,speed:1,lifetime:10});
  const destination=new Vector3(0,1,6);p.fire(origin,destination);destination.x=10;
  p.configure({...p.settings,speed:30,lifetime:.1,color:'#ff0000'});
  p.update(.5,new Vector3(0,1,6),.3);
  assert.equal(p.snapshot.hits,0);assert.equal(p.snapshot.expired,0);
  assert.ok(Math.abs(p.root.children[0].position.z-.5)<1e-8);
  assert.equal(p.root.children[0].children[0].material.color.getHexString(),'66ddff');p.dispose();
});
test('Particle 2.4,3.4: repeated full-capacity hit cycles release all materials and retain one geometry',()=>{
  const p=new ParticleInteraction();p.configure({...p.settings,maxCount:128,speed:30});
  let released=0;
  for(let cycle=0;cycle<4;cycle++){
    for(let i=0;i<128;i++) {p.fire(origin,aim);p.root.children.at(-1).children[0].material.addEventListener('dispose',()=>released++);}
    assert.equal(p.snapshot.active,128);assert.equal(p.fire(origin,aim),false);
    p.update(.3,aim,.4);p.update(.3,aim,.4);
    assert.equal(p.snapshot.active,0);assert.equal(p.root.children.length,0);
  }
  assert.equal(p.snapshot.hits,512);assert.equal(released,512);p.dispose();
});
