import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from 'three';
import { CityScene } from '../src/scene/CityScene.ts';
import { StreetWaterFeature, streetWaterBounds } from '../src/scene/StreetWaterFeature.ts';
import { CharacterController } from '../src/character/CharacterController.ts';
import { DestinationNavigation, isWalkable } from '../src/navigation/DestinationNavigation.ts';
import { pickGround } from '../src/navigation/GroundPicker.ts';
import { FollowCamera } from '../src/camera/FollowCamera.ts';

test('street water 1.1–1.3: replaces island, rejects pool taps and allows both side routes',()=>{
  const city=new CityScene(), world=city.walkableWorld;
  const root=city.environment.getObjectByName('Street water'); assert.ok(root);
  assert.deepEqual(root.position.toArray(),[0,0,-24.6]);
  assert.ok(world.obstacles.some(b=>JSON.stringify(b)===JSON.stringify(streetWaterBounds)));
  assert.equal(world.obstacles.some(b=>b.minX===-1.05&&b.maxX===1.05),false);
  assert.equal(isWalkable({x:0,z:-23},world),false);
  const nav=new DestinationNavigation(world);
  assert.equal(nav.select({x:0,z:5},{x:0,z:-24.6}),false);
  for(const x of [-3.3,3.3]) {
    const controller=new CharacterController(world); let state=controller.update(0,{x:0,z:0,run:false,jump:false});
    assert.equal(nav.select(state,{x,z:-25}),true);
    for(let i=0;i<1800&&nav.status==='running';i++) {
      state=controller.update(1/60,nav.sample(state,1/60)); assert.equal(isWalkable(state,world),true);
    }
    assert.equal(nav.status,'arrived');
  }
  const camera=new PerspectiveCamera(43,1,.1,100); camera.position.set(0,12,-24.6);
  camera.lookAt(0,0,-24.6); camera.updateMatrixWorld();
  assert.equal(pickGround({x:100,y:100},camera,200,200,false,[...city.environment.children],world),null);
  city.dispose();
});

test('street water 1.2: manual walk/run/jump cannot enter full pool footprint',()=>{
  const city=new CityScene();
  for(const run of [false,true]) for(const jump of [false,true]) {
    const c=new CharacterController(city.walkableWorld);let state;
    for(let i=0;i<1500;i++) state=c.update(1/60,{x:0,z:-1,run,jump:jump&&i%50===0});
    assert.ok(state.z>streetWaterBounds.maxZ); assert.equal(isWalkable(state,city.walkableWorld),true);
  }
  city.dispose();
});

test('street water 2.3: thin water hit never pushes camera, solid hit still constrains',()=>{
  const group=new Group(), geometry=new BoxGeometry(4,4,.2), material=new MeshBasicMaterial();
  const water=new Mesh(geometry,material); water.position.z=3; water.userData.cameraObstruction=false; group.add(water);
  const camera=new PerspectiveCamera();camera.position.set(0,0,6);const follow=new FollowCamera([group]);
  follow.constrain(camera,new Vector3()); assert.equal(camera.position.z,6);
  const solid=new Mesh(geometry,material);solid.position.z=4;group.add(solid);group.updateMatrixWorld(true);
  follow.constrain(camera,new Vector3());assert.ok(camera.position.z<4&&camera.position.z>3);
  geometry.dispose();material.dispose();
});

test('street water 3.2–3.3: repeated disposal releases owned solid and water resources once',()=>{
  const feature=new StreetWaterFeature(), geometries=new Set(),materials=new Set();
  feature.root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});
  let g=0,m=0;geometries.forEach(v=>v.addEventListener('dispose',()=>g++));materials.forEach(v=>v.addEventListener('dispose',()=>m++));
  feature.dispose();feature.dispose();assert.equal(g,geometries.size);assert.equal(m,materials.size);
  assert.equal(feature.root.children.length,0);
});
