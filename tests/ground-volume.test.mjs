import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capsuleBoxOverlap, sweepCapsuleBox } from '../src/world/CapsuleBox.ts';
import { GroundWorldQuery } from '../src/world/GroundWorldQuery.ts';
import { HeightField } from '../src/scene/HeightField.ts';
import { defaultCapsule as body } from '../src/world/WorldQuery.ts';
const p = (x=0,y=0,z=0) => ({x,y,z});
const box = {id:'rock',minX:-1,maxX:1,minY:0,maxY:2,minZ:-1,maxZ:1};
const value = r => { assert.equal(r.ok,true,JSON.stringify(r)); return r.value; };
const data = (solids=[]) => ({ bounds:{minX:-10,maxX:10,minY:0,maxY:10,minZ:-15,maxZ:15}, solids,
  surfaces:[{id:'floor',minX:-10,maxX:10,minZ:-15,maxZ:15,height:0}] });

test('capsule box: finite Y, rounded corners, exact contact and continuous sweep',()=>{
  assert.equal(capsuleBoxOverlap(p(0,2,0),body,box),false);
  assert.equal(capsuleBoxOverlap(p(0,1.99,0),body,box),true);
  assert.equal(capsuleBoxOverlap(p(1.24,0,1.24),body,box),false,'round corner is not expanded square');
  const hit=sweepCapsuleBox(p(-5,0,0),p(100,0,0),body,box);
  assert.ok(Math.abs(hit.fraction-.0372)<1e-8); assert.deepEqual(hit.normal,p(-1,0,0));
  assert.equal(sweepCapsuleBox(p(-1.28,0,0),p(-2,0,0),body,box),null);
  assert.equal(sweepCapsuleBox(p(-1.28,0,0),p(0,0,2),body,box),null);
  assert.equal(sweepCapsuleBox(p(-1.28,0,0),p(1,0,0),body,box).fraction,0);
  assert.equal(sweepCapsuleBox(p(-5,2,0),p(10,0,0),body,box),null);
  const roof={...box,minY:3,maxY:4};
  assert.ok(Math.abs(sweepCapsuleBox(p(),p(0,5,0),body,roof).fraction-.24)<1e-8);
});

test('ground query: volume boundaries, ceilings, multilayer identity, invalid data',()=>{
  const d=data([{...box,minY:2.5,maxY:2.8}]);
  d.surfaces.push({id:'gallery',minX:-1,maxX:1,minZ:-1,maxZ:1,height:2.8});
  const q=new GroundWorldQuery(d);
  assert.equal(q.capabilities.geometry,'ground-volume');
  assert.equal(value(q.surfaceSample(p())).surfaceId,'floor');
  assert.equal(value(q.surfaceSample(p(0,2.8))).surfaceId,'gallery');
  assert.equal(value(q.overlap(p(0,1),body)),true);
  assert.equal(value(q.overlap(p(0,0),body)),false);
  assert.equal(value(q.regionSample(p(9.72,0),body)).allowed,true);
  assert.equal(value(q.regionSample(p(9.73,0),body)).allowed,false);
  assert.equal(value(q.sweep(p(0,0,5),p(100,0,0),body)).layer,'boundary');
  assert.equal(value(q.raycast(p(0,8,0),p(0,-9,0))).id,'rock');
  assert.equal(q.overlap(p(NaN),body).ok,false);
  assert.equal(q.sweep(p(0,0,5),p(Infinity),body).ok,false);
  d.solids[0].maxY=NaN; assert.equal(q.overlap(p(),body).ok,false);
});

test('heightfield normal and finite ray share quantized triangles',()=>{
  const f=new HeightField();
  for(let i=0;i<180;i++){
    const x=Math.sin(i*3.7)*15.7,z=Math.cos(i*2.4)*15.7;
    const s=f.surfaceAt(x,z),h=f.heightAt(x,z);
    assert.equal(s.height,h); assert.ok(s.normal.y>.9);
    const hit=f.raycast(p(x,5,z),p(0,-10,0));
    assert.ok(Math.abs(5-10*hit.fraction-h)<1e-7);
  }
  assert.equal(f.raycast(p(20,5,0),p(0,-10,0)),null);
});
export {p,box,value,data,body};

import { CharacterController } from '../src/character/CharacterController.ts';
const idle={x:0,z:0,run:false,jump:false};
const asWorld=d=>({bounds:d.bounds,obstacles:[],groundHeight:()=>0,query:new GroundWorldQuery(d)});
test('controller: low roof jump sweeps upward, then lands without freezing',()=>{
  const w=asWorld(data([{id:'roof',minX:-5,maxX:5,minY:2.1,maxY:3,minZ:-10,maxZ:10}]));
  const c=new CharacterController(w); let highest=0;
  for(let i=0;i<120;i++){
    const s=c.update(.05,{...idle,jump:i===0}); highest=Math.max(highest,s.y);
    assert.ok(s.y+body.height<=2.1+1e-7);
  }
  assert.ok(highest>.25 && highest<=.300001); assert.equal(c.snapshot.grounded,true); assert.equal(c.snapshot.y,0);
});
test('controller: capsule resize and invalid placement are atomic',()=>{
  const c=new CharacterController(asWorld(data([{id:'roof',minX:-5,maxX:5,minY:1.4,maxY:3,minZ:-10,maxZ:10}])),{radius:.28,height:1.15});
  const before=c.snapshot;
  assert.equal(c.setCapsule(body),false); assert.deepEqual(c.snapshot,before);
  assert.equal(c.setCapsule({radius:NaN,height:1.15}),false);
  assert.equal(c.relocate(p(0,1,5),false),false); assert.deepEqual(c.snapshot,before);
});
test('controller: legal stairs climb, head-blocked step fails, ledge falls instead of snapping',()=>{
  const stair={id:'stair',minX:1,maxX:3,minY:0,maxY:.2,minZ:3,maxZ:7};
  const d=data([stair]); d.surfaces.push({...stair,id:'stair-top',height:.2});
  const c=new CharacterController(asWorld(d));
  for(let i=0;i<90;i++) c.update(1/60,{...idle,x:1});
  assert.ok(c.snapshot.x>1.5); assert.ok(Math.abs(c.snapshot.y-.2)<1e-6);
  const blocked=data([stair,{id:'roof',minX:-5,maxX:5,minY:1.9,maxY:3,minZ:3,maxZ:7}]);
  blocked.surfaces=d.surfaces; const b=new CharacterController(asWorld(blocked));
  for(let i=0;i<90;i++) b.update(1/60,{...idle,x:1});
  assert.ok(b.snapshot.x<1);
  const ledge={...stair,minX:1,maxX:3,maxY:3}; const l=data([ledge]);l.surfaces.push({...ledge,id:'ledge',height:3});
  const fall=new CharacterController(asWorld(l)); assert.equal(fall.relocate(p(1.5,3,5)),true);
  let falling=false;
  for(let i=0;i<160;i++) {const s=fall.update(1/60,{...idle,x:1});if(s.x>3.3 && s.y>0 && !s.grounded)falling=true;}
  assert.equal(falling,true); assert.equal(fall.snapshot.y,0);
});
test('controller: steep terrain blocked, gentle terrain follows exact quantized height',()=>{
  const d=data();d.terrain={surfaceAt:(x,z)=>({height:x>1?1:0,normal:x>1?p(-.9,.4,0):p(0,1,0)}),raycast:()=>null};
  const c=new CharacterController(asWorld(d));for(let i=0;i<100;i++)c.update(.05,{...idle,x:1});assert.ok(c.snapshot.x<=1);
  const f=new HeightField();const t=data();t.bounds={...f.bounds,minY:-2,maxY:10};t.terrain=f;
  const walk=new CharacterController(asWorld(t));
  for(let i=0;i<160;i++) {const s=walk.update(.05,{...idle,x:.7,z:-.7,run:true});assert.ok(Math.abs(s.y-f.heightAt(s.x,s.z))<1e-6);}
});


test('capsule box: deterministic swept contacts never tunnel or end overlapped',()=>{
  let seed=731;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(let i=0;i<1200;i++){
    const start=p(random()*12-6,random()*7-2,random()*12-6),delta=p(random()*40-20,random()*20-10,random()*40-20);
    const c={radius:.1+random()*.7,height:2}; if(capsuleBoxOverlap(start,c,box))continue;
    const hit=sweepCapsuleBox(start,delta,c,box),t=hit?.fraction??1;
    const at=f=>p(start.x+delta.x*f,start.y+delta.y*f,start.z+delta.z*f);
    assert.equal(capsuleBoxOverlap(at(t),c,box),false,JSON.stringify({start,delta,c,hit}));
    for(let j=1;j<30;j++)if(j/30<t-1e-6)assert.equal(capsuleBoxOverlap(at(j/30),c,box),false,'missed earlier solid');
  }
});
test('controller: diagonal wall contact slides and three sizes stop at finite roof',()=>{
  for(const height of [1.8,1.68,1.15]){
    const wall={id:'wall',minX:1,maxX:2,minY:0,maxY:4,minZ:-12,maxZ:12};
    const c=new CharacterController(asWorld(data([wall])),{radius:.28,height});
    for(let i=0;i<100;i++)c.update(.2,{...idle,x:1,z:-1,run:true});
    assert.ok(c.snapshot.x<=.720001);assert.ok(c.snapshot.z<0);assert.equal(c.snapshot.grounded,true);
  }
});

import { DestinationNavigation, isWalkable, segmentClear } from '../src/navigation/DestinationNavigation.ts';
import { GroundPicker, declareGroundBox } from '../src/navigation/GroundPicker.ts';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Group } from 'three';
test('navigation: picked upper surface keeps Y, lower layer cannot falsely arrive upstairs',()=>{
  const platform={id:'upper',minX:-3,maxX:3,minY:2.5,maxY:2.8,minZ:-3,maxZ:3};
  const d=data([platform]);d.surfaces.push({...platform,id:'upper-floor',height:2.8});const w=asWorld(d);
  assert.equal(isWalkable(p(0,2.8,0),w),true);assert.equal(isWalkable(p(0,2.4,0),w),false);
  assert.equal(segmentClear(p(0,0,5),p(0,2.8,0),w),false);
  assert.equal(segmentClear(p(-1,2.8,0),p(1,2.8,0),w),true);
  const nav=new DestinationNavigation(w);assert.equal(nav.select(p(0,0,0),p(0,2.8,0)),false);
  const mesh=new Mesh(new BoxGeometry(6,.3,6),new MeshBasicMaterial());mesh.position.y=2.65;declareGroundBox(mesh);
  const root=new Group();root.add(mesh);root.updateMatrixWorld(true);
  const camera=new PerspectiveCamera(60,1,.1,50);camera.position.set(0,8,5);camera.lookAt(0,2.8,0);camera.updateMatrixWorld(true);
  const picked=new GroundPicker([root]).pick({x:200,y:200},camera,400,400,false,w);
  assert.ok(Math.abs(picked.y-2.8)<1e-5);mesh.geometry.dispose();mesh.material.dispose();
});

import { createCave } from '../src/scene/CaveScene.ts';
import { createTerrain } from '../src/scene/TerrainScene.ts';
import { characterCapsules } from '../src/character/motion.ts';
import { assetCatalog } from '../src/character/assetCatalog.ts';
test('production scenes: finite cave roof/opening, gallery, stairs and lower layer share geometry',()=>{
  const cave=createCave();const w=cave.walkableWorld,q=w.query;
  try{
    assert.equal(q?.capabilities.geometry,'ground-volume');
    assert.equal(value(q.surfaceSample(p(8,0,-7))).height,0);
    assert.equal(value(q.surfaceSample(p(8,2.8,-7))).height,2.8);
    assert.equal(value(q.overlap(p(8,0,-7),body)),false);
    assert.equal(value(q.overlap(p(8,2.8,-7),body)),false);
    assert.equal(value(q.sweep(p(0,0,5),p(0,8,0),body)).layer,'solid');
    assert.equal(value(q.sweep(p(0,0,0),p(0,4,0),body)),null,'skylight is truly open');
    assert.equal(value(q.overlap(p(0,3.3,5),body)),true);
    const c=new CharacterController(w);assert.equal(c.relocate(p(8,0,1)),true);
    for(let i=0;i<400 && c.snapshot.z>-7.5;i++)c.update(1/60,{...idle,z:-1});
    assert.ok(c.snapshot.y>2.79,JSON.stringify(c.snapshot));assert.ok(c.snapshot.z<-6);
    const nav=new DestinationNavigation(w);assert.equal(nav.select(p(8,0,1),p(8,2.8,-7)),true,'existing stair connection is navigable');
    const walker=new CharacterController(w);walker.relocate(p(8,0,1));
    for(let i=0;i<600 && nav.status==='running';i++)walker.update(1/60,nav.sample(walker.snapshot,1/60));
    assert.equal(nav.status,'arrived');assert.ok(Math.abs(walker.snapshot.y-2.8)<1e-5);
  }finally{cave.dispose();}
});
test('production terrain query: same surface, quality unchanged, three declared body sizes match assets',()=>{
  const terrain=createTerrain(),q=terrain.walkableWorld.query;
  try{
    assert.equal(q?.capabilities.geometry,'ground-volume');
    for(const variant of ['man','woman','child'])assert.equal(characterCapsules[variant].height,assetCatalog[variant].height);
    const before=value(q.surfaceSample(p(3,0,4)));terrain.terrain.configure({quality:'low'});
    assert.deepEqual(value(q.surfaceSample(p(3,0,4))),before);
    const hit=value(q.raycast(p(3,8,4),p(0,-10,0)));assert.ok(Math.abs(8-10*hit.fraction-before.height)<1e-6);
  }finally{terrain.dispose();}
});


test('production cave: low passage admits child, rejects larger variants and invalid editor remains atomic',()=>{
  const cave=createCave();try{
    const c=new CharacterController(cave.walkableWorld,characterCapsules.child);
    assert.equal(c.relocate(p(-8,0,-8)),true);const before=c.snapshot;
    assert.equal(c.setCapsule(characterCapsules.man),false);assert.equal(c.setCapsule(characterCapsules.woman),false);
    assert.deepEqual(c.snapshot,before);assert.equal(c.relocate(p(0,4,5),false),false);assert.deepEqual(c.snapshot,before);
    assert.equal(c.relocate(p(0,7,0),false),false);
    assert.equal(c.relocate(p(0,0,5)),true);assert.equal(c.setCapsule(body),true);
  }finally{cave.dispose();}
});


test('ground query: terrain rejects underground body and swept feet cannot tunnel through its surface',()=>{
  const field=new HeightField(),d=data();d.bounds={...field.bounds,minY:-2,maxY:14};d.terrain=field;const q=new GroundWorldQuery(d);
  const h=field.heightAt(0,5);assert.equal(value(q.overlap(p(0,h-.01,5),body)),true);
  const hit=value(q.sweep(p(0,5,5),p(0,-10,0),body));assert.equal(hit.id,'terrain-ground');assert.ok(Math.abs(5-10*hit.fraction-h)<1e-7);
});

test('controller: .25m step limit cannot be bypassed by repeated capsule corner slides',()=>{
  for(const height of [.25,.26,.4]){
    const rock={id:'step-limit',minX:1,maxX:4,minY:0,maxY:height,minZ:3,maxZ:7};
    const d=data([rock]);d.surfaces.push({...rock,id:'step-limit-top',height});const c=new CharacterController(asWorld(d));
    for(let i=0;i<110;i++)c.update(1/60,{...idle,x:1});
    if(height<=.25){assert.ok(c.snapshot.x>2);assert.ok(Math.abs(c.snapshot.y-height)<1e-6);}
    else{assert.ok(c.snapshot.x<1,JSON.stringify({height,state:c.snapshot}));assert.ok(c.snapshot.y<1e-6);}
  }
});


test('controller: 45 degree ground slope accepted and 46 degree slope rejected',()=>{
  for(const degrees of [45,46]){
    const angle=degrees*Math.PI/180,d=data();d.bounds.minY=-20;d.bounds.maxY=30;
    d.terrain={surfaceAt:x=>({height:x*Math.tan(angle),normal:p(-Math.sin(angle),Math.cos(angle),0)}),raycast:()=>null};
    const c=new CharacterController(asWorld(d));for(let i=0;i<30;i++)c.update(1/60,{...idle,x:1});
    assert.equal(c.snapshot.x>.5,degrees===45);assert.ok(Math.abs(c.snapshot.y-c.snapshot.x*Math.tan(angle))<1e-6);
  }
});
