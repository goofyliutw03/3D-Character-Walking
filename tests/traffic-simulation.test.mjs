import test from 'node:test';
import assert from 'node:assert/strict';
import { SurfaceNavMesh } from '../src/navigation/SurfaceNavMesh.ts';
import { TrafficSimulation } from '../src/simulation/TrafficSimulation.ts';
import { CityScene } from '../src/scene/CityScene.ts';
import { TrafficView } from '../src/simulation/TrafficView.ts';
import { PerspectiveCamera } from 'three';

test('Traffic 2–5: bounded settings, deterministic reset, snapshots and pause', () => {
  const city=new CityScene(),sim=new TrafficSimulation(city.walkableWorld);
  assert.equal(sim.snapshot.settings.enabled,false);
  for(const patch of [{npcCount:25},{vehicleCount:-1},{npcCount:NaN},{paused:1},{lod:undefined},{wat:1},null]) assert.equal(sim.configure(patch),false);
  assert.equal(sim.configure({enabled:true,npcCount:24,vehicleCount:8}),true);
  const initial=sim.snapshot;
  assert.equal(initial.npcs.length,24);assert.equal(initial.vehicles.length,8);
  sim.update(100,[]); assert.ok(sim.snapshot.time<=.05);
  sim.configure({paused:true});const paused=sim.snapshot;sim.update(1,[]);assert.deepEqual(sim.snapshot,paused);
  sim.configure({paused:false});sim.reset();assert.deepEqual(sim.snapshot,initial);
  const snapshot=sim.snapshot;snapshot.npcs[0].x=100;snapshot.settings.npcCount=0;
  assert.notEqual(sim.snapshot.npcs[0].x,100);assert.equal(sim.snapshot.settings.npcCount,24);
  sim.configure({enabled:false});const disabled=sim.snapshot;sim.update(.05,[]);assert.deepEqual(sim.snapshot,disabled);
  sim.configure({npcCount:0,vehicleCount:0});assert.equal(sim.snapshot.npcs.length,0);assert.equal(sim.snapshot.vehicles.length,0);
  city.dispose();
});

test('Traffic 2.3,3.2,3.3: multiple signal cycles, crossing clearance, headway and walkable paths', () => {
  const city=new CityScene(),sim=new TrafficSimulation(city.walkableWorld);
  sim.configure({enabled:true,npcCount:12,vehicleCount:8});
  const phases=new Set(),moved=new Set(),crossed=new Set();
  let previous=sim.snapshot;
  for(let frame=0;frame<12000;frame++) {
    sim.update(.05,[{x:0,z:-1}]);const s=sim.snapshot;phases.add(s.phase);
    for(const n of s.npcs) {
      assert.ok(sim.navMesh.contains(n));
      if(n.speed>0)moved.add(n.id);
      if(n.crossing)crossed.add(n.id);
      const old=previous.npcs.find(p=>p.id===n.id);
      if(n.crossing&&!old.crossing)assert.equal(s.phase,'pedestrians');
      assert.ok(Math.hypot(n.x,n.z+1)>=.69);
    }
    if(s.phase==='vehicles')assert.ok(!s.npcs.some(n=>n.crossing));
    if(s.phase==='pedestrians')assert.ok(!s.vehicles.some(c=>Math.abs(c.z)<5.6));
    for(const car of s.vehicles) for(const other of s.vehicles) if(car.id!==other.id && car.lane===other.lane) assert.ok(Math.abs(car.z-other.z)>=4.49);
    previous=s;
  }
  assert.equal(phases.size,5);assert.equal(moved.size,12);assert.ok(crossed.size>=6);
  city.dispose();
});

test('NavMesh 1.1–1.2: convex decomposition, portals, obstacle clearance and disconnected surfaces', () => {
  const surface = {minX:-5,maxX:5,minZ:-4,maxZ:4};
  const mesh = new SurfaceNavMesh([surface], [{minX:-1,maxX:1,minZ:-2,maxZ:2}], .3);
  const path = mesh.findPath({x:-4,z:0},{x:4,z:0});
  assert.ok(path && path.length > 2);
  for(let i=1;i<path.length;i++) for(let t=0;t<=1;t+=.02) {
    const p={x:path[i-1].x*(1-t)+path[i].x*t,z:path[i-1].z*(1-t)+path[i].z*t};
    assert.ok(mesh.contains(p));
    assert.ok(!(p.x>-1.3+1e-7 && p.x<1.3-1e-7 && p.z>-2.3+1e-7 && p.z<2.3-1e-7));
  }
  assert.equal(mesh.findPath({x:0,z:0},{x:4,z:0}),null);
  assert.equal(mesh.findPath({x:NaN,z:0},{x:4,z:0}),null);
  const split=new SurfaceNavMesh([{minX:0,maxX:1,minZ:0,maxZ:1},{minX:1,maxX:2,minZ:1,maxZ:2}],[],0);
  assert.equal(split.findPath({x:.5,z:.5},{x:1.5,z:1.5}),null);
});

test('Traffic 3.3: vehicle yields to actor and resumes, invalid dt, disposal',()=>{
  const city=new CityScene(),sim=new TrafficSimulation(city.walkableWorld);sim.configure({enabled:true,npcCount:0,vehicleCount:2});
  const car=sim.snapshot.vehicles[0],blocker={x:car.x,z:car.z+car.lane*3};
  for(let i=0;i<60;i++)sim.update(.05,[blocker]);
  const stopped=sim.snapshot.vehicles[0];assert.ok(Math.abs(stopped.z-blocker.z)>=2.29);assert.equal(stopped.speed,0);
  sim.update(.05,[]);assert.ok(sim.snapshot.vehicles[0].speed>0);
  const before=sim.snapshot;for(const dt of [NaN,Infinity,-1,0])sim.update(dt,[]);assert.deepEqual(sim.snapshot,before);
  sim.dispose();sim.dispose();assert.equal(sim.configure({enabled:true}),false);assert.equal(sim.snapshot.npcs.length,0);city.dispose();
});

test('Traffic 5.1,4.3: actual LOD geometry/draw reduction, hysteresis, shadow and unique disposal',()=>{
  const city=new CityScene(),sim=new TrafficSimulation(city.walkableWorld),view=new TrafficView(),camera=new PerspectiveCamera();
  sim.configure({enabled:true,npcCount:3,vehicleCount:2});
  camera.position.set(0,4,0);camera.updateMatrixWorld();view.update(sim.snapshot,camera,0);
  const npc=view.root.getObjectByName('NPC 3 · child');
  const visibleStats=root=>{let meshes=0,triangles=0;root.traverseVisible(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});return {meshes,triangles};};
  camera.position.copy(npc.position).add({x:0,y:2,z:0});camera.updateMatrixWorld();view.update(sim.snapshot,camera,.05);
  const near=visibleStats(npc);assert.ok(near.meshes>10);
  camera.position.z=npc.position.z+30;camera.updateMatrixWorld();view.update(sim.snapshot,camera,.05);
  const far=visibleStats(npc);assert.equal(far.meshes,1);assert.ok(far.triangles<near.triangles);
  camera.position.z=npc.position.z+23;camera.updateMatrixWorld();view.update(sim.snapshot,camera,.05);assert.equal(visibleStats(npc).meshes,1);
  camera.position.z=npc.position.z+18;camera.updateMatrixWorld();view.update(sim.snapshot,camera,.05);assert.ok(visibleStats(npc).meshes>1);
  sim.configure({lod:false});camera.position.z=100;camera.updateMatrixWorld();view.update(sim.snapshot,camera,0);assert.ok(visibleStats(npc).meshes>1);
  view.setShadows(false);view.root.traverse(o=>{if(o.isMesh)assert.equal(o.castShadow,false);});
  const resources=new Set();view.root.traverse(o=>{if(o.isMesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m);}});
  const counts=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));
  view.dispose();view.dispose();assert.ok([...counts.values()].every(n=>n===1));assert.equal(view.root.children.length,0);city.dispose();
});
