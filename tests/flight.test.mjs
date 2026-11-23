import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FlightWorldQuery } from '../src/world/FlightWorldQuery.ts';
import { defaultCapsule as body } from '../src/world/WorldQuery.ts';
import { FlightController } from '../src/character/FlightController.ts';
import { createFlight } from '../src/scene/FlightScene.ts';
import { ProfileHistory, parseProfiles } from '../src/settings/PanelProfiles.ts';
const p=(x=0,y=0,z=0)=>({x,y,z});
const data=()=>({bounds:{minX:-40,maxX:40,minY:0,maxY:40,minZ:-40,maxZ:40},
  solids:[{id:'tower',minX:4,maxX:5,minY:0,maxY:18,minZ:-2,maxZ:2}],
  surfaces:[{id:'floor',minX:-40,maxX:40,minZ:-40,maxZ:40,height:0}],
  forbidden:[{id:'restricted',minX:-12,maxX:-8,minY:4,maxY:12,minZ:-2,maxZ:2}]});
const value=r=>{assert.equal(r.ok,true,JSON.stringify(r));return r.value;};
const neutral={x:0,z:0,run:false,jump:false};
const world=(q=new FlightWorldQuery(data()))=>({query:q,bounds:data().bounds,obstacles:[],groundHeight:()=>0});
test('flight profiles: version 1 accepts flight names and old city names',()=>{
  const h=new ProfileHistory();h.save('city',{scene:'city'},1);h.save('flight',{scene:'flight'},2);
  const restored=parseProfiles(JSON.stringify(h.data),s=>typeof s?.scene==='string');
  assert.equal(restored.version,1);assert.deepEqual(restored.profiles.map(p=>p.name),['city00','flight00']);
});
test('flight scene: shared visible boxes, safe spawn, explicit capabilities, decorative sky/clouds and disposal',()=>{
  const e=createFlight(),q=e.walkableWorld.query,c=new FlightController(e.walkableWorld);
  assert.equal(e.id,'flight');assert.equal(e.controls.autoRun,false);assert.equal(e.controls.groundNavigation,false);
  assert.equal(value(q.overlap(c.snapshot,body)),false);
  const boxes=e.environment.children.filter(o=>o.userData.solidBox);
  assert.ok(boxes.length>=3);
  for(const mesh of boxes){const b=mesh.userData.solidBox;
    assert.equal(mesh.position.y,(b.minY+b.maxY)/2);
    assert.equal(value(q.overlap(p((b.minX+b.maxX)/2,b.minY+.1,(b.minZ+b.maxZ)/2),body)),true);
  }
  assert.ok(e.environment.children.some(o=>o.name==='Procedural sky'&&o.userData.cameraObstruction===false));
  assert.ok(e.environment.children.some(o=>o.name==='Visual cloud · no collision'));
  let releases=0;e.environment.children.find(o=>o.name==='Procedural sky').geometry.addEventListener('dispose',()=>releases++);
  e.dispose();e.dispose();assert.equal(releases,1);assert.equal(e.scene.children.length,0);
});
test('flight strategy: acceleration, normalized 3D boost, drag, fixed-step cap, invalid input and stop',()=>{
  const c=new FlightController(world());
  assert.equal(c.mode,'flight');
  assert.equal(c.relocate(p(0,20,10),false),true);
  for(let i=0;i<90;i++)c.update(1/60,{...neutral,x:1,vertical:1,run:true});
  assert.ok(c.snapshot.speed<=24+1e-8); assert.ok(c.snapshot.x>10&&c.snapshot.y>25);
  const v=c.snapshot.speed;
  c.update(1/60,neutral); assert.ok(c.snapshot.speed<v);
  const before=c.snapshot;
  c.update(.1,{...neutral,x:NaN}); assert.deepEqual(c.snapshot,before);
  assert.equal(c.relocate(p(NaN),false),false); assert.deepEqual(c.snapshot,before);
  c.stop();assert.equal(c.snapshot.speed,0);
  c.update(5,{...neutral,z:1});assert.ok(c.droppedTime>4.9);assert.ok(c.snapshot.z-before.z<1);
  c.stop();c.update(Number.MAX_VALUE,neutral);
  assert.ok(Number.isFinite(c.droppedTime));assert.ok(Number.isFinite(c.snapshot.x));
  c.update(1/60,{...neutral,vertical:1});assert.ok(c.snapshot.speed>0);
});
test('flight strategy: swept obstacles, upper/lower boundaries and all capsule sizes',()=>{
  for(const height of [1.8,1.68,1.15]){
    const c=new FlightController(world(),{radius:.28,height});
    assert.ok(c.relocate(p(0,6,0),false));
    for(let i=0;i<120;i++)c.update(.2,{...neutral,x:1,run:true});
    assert.ok(c.snapshot.x<=3.72+1e-8); assert.ok(value(world().query.overlap(c.snapshot,c.shape))===false);
    c.relocate(p(0,20,10),false);
    for(let i=0;i<120;i++)c.update(.1,{...neutral,vertical:1,run:true});
    assert.ok(c.snapshot.y+height<=40+1e-8); assert.equal(c.velocity.y,0);
    for(let i=0;i<180;i++)c.update(.1,{...neutral,vertical:-1,run:true});
    assert.ok(c.snapshot.y>=0);assert.equal(c.velocity.y,0);
  }
});
test('flight strategy: explicit legal landing/takeoff, clearance and atomic failures',()=>{
  const c=new FlightController(world());
  c.relocate(p(0,3,5),false);const old=c.snapshot;
  assert.equal(c.land(),false);assert.deepEqual(c.snapshot,old);
  c.relocate(p(0,1,5),false);
  c.update(1/30,{...neutral,z:1});
  const heading=c.snapshot.heading;
  assert.notEqual(heading,Math.PI);
  assert.equal(c.land(),true);
  assert.equal(c.snapshot.heading,heading);
  assert.equal(c.mode,'ground');assert.equal(c.snapshot.y,0);assert.equal(c.snapshot.grounded,true);
  c.update(1/60,{...neutral,z:1}); assert.equal(c.snapshot.action,'walk');
  assert.equal(c.takeOff(),true);assert.equal(c.mode,'flight');
  assert.equal(c.setCapsule({radius:1,height:NaN}),false);assert.equal(c.shape.height,1.8);
  assert.equal(c.relocate(p(-10,6,0),false),false);
  c.update(1/60,{...neutral,vertical:1});assert.ok(c.snapshot.y>0);
  c.relocate(p(0,30,5),false);assert.equal(c.setCapsule({radius:.28,height:1.15}),true,'high altitude variant remains legal');
});
test('flight strategy: timestep grouping, full speed cap, wall slide and query failure rollback',()=>{
  const a=new FlightController(world()),b=new FlightController(world());
  a.relocate(p(0,15,10),false);b.relocate(p(0,15,10),false);
  for(let i=0;i<30;i++)a.update(1/30,{...neutral,z:1,run:true});
  for(let i=0;i<60;i++)b.update(1/60,{...neutral,z:1,run:true});
  assert.ok(Math.abs(a.snapshot.z-b.snapshot.z)<1e-8);assert.ok(Math.abs(a.snapshot.speed-18)<1e-8);
  a.relocate(p(0,6,0),false);
  for(let i=0;i<80;i++)a.update(1/60,{...neutral,x:1,z:.1,run:true});
  assert.ok(a.snapshot.x<=3.72+1e-8);assert.ok(a.snapshot.z>.5);assert.ok(Math.abs(a.velocity.x)<1e-8);
  const q=world().query,c=new FlightController(world(q));c.relocate(p(0,15,10),false);
  c.update(1/60,{...neutral,z:1});const before=c.snapshot,velocity=c.velocity;
  q.sweep=()=>({ok:false,error:'unavailable'});c.update(.1,{...neutral,z:1});
  assert.deepEqual(c.snapshot,before);assert.deepEqual(c.velocity,velocity);
});
test('flight landing rejects steep surfaces and obstructed descent; retains transform',()=>{
  const q=new FlightWorldQuery(data()),c=new FlightController(world(q));
  c.relocate(p(0,1,5),false);const before=c.snapshot;
  const original=q.surfaceSample.bind(q);
  q.surfaceSample=()=>({ok:true,value:{height:0,surfaceId:'steep',normal:p(.9,.4,0)}});
  assert.equal(c.land(),false);assert.deepEqual(c.snapshot,before);
  q.surfaceSample=original;q.sweep=()=>({ok:true,value:{fraction:.5,normal:p(0,1,0),id:'roof',layer:'solid'}});
  assert.equal(c.land(),false);assert.deepEqual(c.snapshot,before);
});
test('flight query: continuous finite solids, forbidden volumes, complete capsule bounds and warning',()=>{
  const q=new FlightWorldQuery(data());
  assert.deepEqual(q.capabilities.motion,['ground','flight']);
  assert.equal(value(q.sweep(p(0,6,0),p(100,0,0),body)).id,'tower');
  assert.equal(value(q.sweep(p(0,20,0),p(100,0,0),body)).layer,'boundary');
  assert.equal(value(q.sweep(p(0,6,0),p(-100,0,0),body)).id,'restricted');
  assert.equal(value(q.sweep(p(0,20,0),p(-100,0,0),body)).layer,'boundary');
  const top=value(q.sweep(p(0,20,0),p(0,100,0),body));
  assert.ok(Math.abs(top.fraction-.182)<1e-8);
  assert.equal(value(q.sweep(p(0,20,0),p(0,-100,0),body)).fraction,.2);
  assert.equal(value(q.overlap(p(-10,6,0),body)),true);
  assert.equal(value(q.regionSample(p(39.73,0,0),body)).allowed,false);
  assert.equal(q.warning(p(37,10,0),body)?.id,'flight-range');
  assert.equal(q.warning(p(-6,6,0),body)?.id,'restricted');
  assert.equal(q.warning(p(0,10,10),body),null);
  assert.equal(q.sweep(p(NaN),p(1),body).ok,false);
  assert.equal(new FlightWorldQuery({...data(),forbidden:[{...data().forbidden[0],maxY:NaN}]}).overlap(p(),body).ok,false);
});
