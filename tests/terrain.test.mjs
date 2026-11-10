import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PerspectiveCamera, Raycaster, Vector3 } from 'three';
import { HeightField } from '../src/scene/HeightField.ts';
import { createTerrain } from '../src/scene/TerrainScene.ts';
import { GroundPicker } from '../src/navigation/GroundPicker.ts';
import { projectAnchor } from '../src/camera/AnchorProjection.ts';
import { CharacterController } from '../src/character/CharacterController.ts';
import { isWalkable } from '../src/navigation/DestinationNavigation.ts';
import { SceneSwitch } from '../src/scene/SceneSwitch.ts';

test('terrain switch: stale resources release, failure retains world, repeated entry uses the same root',async()=>{
  const original=createTerrain(), scenes=new SceneSwitch(original), root=scenes.root;
  assert.equal(await scenes.select('cave',async()=>{throw Error('load');},()=>assert.fail()),false);
  assert.equal(scenes.active,original);
  let resolve;
  const stale=createTerrain();let disposals=0;
  stale.environment.children[0].geometry.addEventListener('dispose',()=>disposals++);
  const request=scenes.select('cave',()=>new Promise(done=>{resolve=done;}),()=>assert.fail());
  await scenes.select('terrain',()=>assert.fail(),()=>assert.fail());
  resolve(stale);assert.equal(await request,false);assert.equal(disposals,1);
  for(let i=0;i<3;i++) {
    const replacement=createTerrain();
    // A distinct ID requests a replacement through the production switch commit path.
    replacement.id='cave';
    assert.ok(await scenes.select('cave',async()=>replacement,()=>{}));
    assert.ok(await scenes.select('terrain',async()=>createTerrain(),()=>{}));
    assert.equal(scenes.root,root);assert.equal(root.children.length,1);
  }
  scenes.dispose();assert.equal(root.children.length,0);
});

test('terrain 2: quality, wind, collision, jumping and owned resources remain bounded', () => {
  const terrain=createTerrain();
  const grass=terrain.environment.getObjectByName('Wind grass');
  const world=terrain.walkableWorld;
  const height=world.groundHeight(3.5,2.1);
  const released=[];
  const resources=new Set();
  terrain.scene.traverse(o=>{
    if(o.geometry) resources.add(o.geometry);
    for(const m of [o.material,o.customDepthMaterial].flat().filter(Boolean)) {
      resources.add(m); if(m.displacementMap) resources.add(m.displacementMap);
    }
  });
  for(const r of resources) r.addEventListener('dispose',()=>released.push(r));
  assert.equal(terrain.terrain.configure({quality:'bad',wind:false}),false);
  assert.deepEqual(terrain.terrain.getSettings(),{quality:'standard',wind:true});
  terrain.update(.5,false);
  const time=grass.material.userData.windTime.value;
  terrain.update(.5,true);
  assert.equal(grass.material.userData.windTime.value,time);
  assert.equal(terrain.terrain.configure({quality:'low',wind:false}),true);
  assert.equal(grass.geometry.drawRange.count,96*12);
  terrain.update(.5,false); assert.equal(grass.material.userData.windTime.value,time);
  assert.equal(world.groundHeight(3.5,2.1),height);
  for(const o of world.obstacles) assert.equal(isWalkable({x:(o.minX+o.maxX)/2,z:(o.minZ+o.maxZ)/2},world),false);
  const c=new CharacterController(world);
  assert.equal(c.relocate({x:-8,y:0,z:-6},true),false);
  assert.equal(c.relocate({x:16,y:0,z:0},true),false);
  assert.ok(c.relocate({x:15.5,y:0,z:0},true));
  for(let i=0;i<20;i++)c.update(.05,{x:1,z:0,run:true,jump:false});
  assert.ok(c.snapshot.x<=15.72);
  assert.ok(c.relocate({x:0,y:0,z:5},true));
  c.update(.016,{x:0,z:0,run:false,jump:true});
  assert.equal(c.snapshot.grounded,false);
  for(let i=0;i<100;i++)c.update(.016,{x:0,z:0,run:false,jump:false});
  assert.equal(c.snapshot.grounded,true);
  assert.ok(Math.abs(c.snapshot.y-world.groundHeight(c.snapshot.x,c.snapshot.z))<.001);
  terrain.dispose(); terrain.dispose();
  assert.equal(released.length,resources.size);
  assert.equal(terrain.scene.children.length,0);
  const replacement=createTerrain(); replacement.dispose();
});

test('terrain 1: quantized triangles, raycasts and CPU ground agree throughout the grid', () => {
  const field = new HeightField();
  const terrain = createTerrain();
  const surface = terrain.environment.getObjectByName('Displaced terrain');
  try {
    const clone = surface.material.clone();
    assert.equal(clone.displacementMap, surface.material.displacementMap);
    assert.equal(clone.flatShading, true); clone.dispose();
    const rays = new Raycaster();
    for (let i = 0; i < 160; i++) {
      const x = -15.5 + ((i * 37.131) % 31), z = -15.5 + ((i * 17.271) % 31);
      rays.set(new Vector3(x, 8, z), new Vector3(0, -1, 0));
      surface.updateMatrixWorld(true);
      const hit = rays.intersectObject(surface)[0];
      assert.ok(hit); assert.ok(Math.abs(hit.point.y - field.heightAt(x,z)) < 1e-5);
      assert.ok(hit.face.normal.y >= .9);
    }
    for (const [x,z] of [[-16,-16],[16,16],[0,0],[16,-16],[-16,16]]) assert.ok(Number.isFinite(field.heightAt(x,z)));
    assert.ok(Number.isNaN(field.heightAt(17,0)));
    assert.ok(Number.isNaN(field.heightAt(NaN,0)));
    for (let i=0;i<field.samples.length;i++) assert.equal(field.vertexHeight(i), field.samples[i] * field.amplitude / 255);
    const camera = new PerspectiveCamera(70,1,.1,100);
    const picker = new GroundPicker(terrain.environment.children);
    for (const fish of [false,true]) {
      const x=1.37,z=3.21,y=field.heightAt(x,z);
      camera.position.set(x,10,z+4); camera.lookAt(x,y,z); camera.updateMatrixWorld(true);
      const p=projectAnchor(new Vector3(x,y,z),camera,500,500,fish);
      const hit=picker.pick(p,camera,500,500,fish,terrain.walkableWorld);
      assert.ok(hit); assert.ok(Math.hypot(hit.x-x,hit.z-z)<.001);
    }
    const character = new CharacterController(terrain.walkableWorld);
    assert.ok(character.relocate({x:1,z:3,y:0},true));
    for (let i=0;i<80;i++) {
      character.update(.016,{x:1,z:0,run:true,jump:false});
      const s=character.snapshot;
      assert.ok(Math.abs(s.y-field.heightAt(s.x,s.z))<.001);
    }
  } finally { terrain.dispose(); }
});
