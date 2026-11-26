import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CharacterController } from '../src/character/CharacterController.ts';
const world={bounds:{minX:-8,maxX:8,minZ:-12,maxZ:12},obstacles:[{minX:-1,maxX:1,minZ:-1,maxZ:1}],groundHeight:x=>Math.abs(x)>4? .32:.075};
const idle={x:0,z:0,run:false,jump:false};
test('editor: rejects positions atomically including radius, bounds and invalid Y',()=>{
 const c=new CharacterController(world), before=c.update(0,idle);
 for(const p of [{x:NaN,y:0,z:5},{x:8,y:0,z:5},{x:1.1,y:0,z:0},{x:0,y:-1,z:5},{x:0,y:11,z:5}]){
  assert.equal(c.relocate(p,false),false);assert.deepEqual(c.snapshot,before);
 }
 assert.equal(c.relocate({x:6,y:3,z:5},true),true);assert.equal(c.snapshot.y,.32);assert.ok(c.snapshot.grounded);
});
test('editor: elevated placement falls and lands, jump and collision remain authoritative',()=>{
 const c=new CharacterController(world);
 assert.equal(c.relocate({x:0,y:3,z:5},false),true);assert.equal(c.snapshot.grounded,false);
 for(let i=0;i<100;i++)c.update(1/60,idle);
 assert.equal(c.snapshot.y,.075);assert.ok(c.snapshot.grounded);
 assert.equal(c.update(1/60,{...idle,jump:true}).action,'jump');
 assert.equal(c.relocate({x:0,y:0,z:2},true),true);
 for(let i=0;i<200;i++)c.update(1/60,{...idle,z:-1});
 assert.ok(c.snapshot.z>=1.28-1e-8);
});
test('editor: walk speed is bounded, Run and navigation override keep 4m/s',()=>{
 const c=new CharacterController(world); assert.equal(c.walkSpeed,1.8);
 for(const speed of [NaN,Infinity,0,4.1])assert.equal(c.setWalkSpeed(speed),false);
 assert.equal(c.setWalkSpeed(.5),true);
 assert.ok(Math.abs(c.update(.05,{...idle,x:1}).speed-.5)<1e-8);
 assert.ok(Math.abs(c.update(.05,{...idle,x:1,run:true}).speed-4)<1e-8);
 assert.ok(Math.abs(c.update(.05,{...idle,x:1},4).speed-4)<1e-8);
 assert.equal(c.setWalkSpeed(3),true);assert.equal(c.update(.05,{...idle,x:1}).action,'run');
});
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
test('city asset: actual eight Blender buildings have matching meter bounds and hashes',async()=>{
 const bytes=readFileSync('public/assets/city/buildings.glb');
 assert.ok(bytes.length<1024*1024);
 const manifest=JSON.parse(readFileSync('public/assets/city/asset-manifest.json','utf8'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 const jsonLength=bytes.readUInt32LE(12), json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
 assert.ok(!json.images?.length);assert.ok(json.buffers.every(b=>!b.uri));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 assert.equal(gltf.scene.children.length,8);gltf.scene.updateMatrixWorld(true);
 for(const [i,root] of gltf.scene.children.entries()){
  assert.match(root.name,/^Building_[0-7]$/);
  const index=Number(root.name.split('_')[1]);
  const bounds=new Box3().setFromObject(root),center=bounds.getCenter(new Vector3());
  assert.ok(Math.abs(center.x-(index<4?-12.1:12.1))<.01);
  assert.ok(Math.abs(center.z-[-20,-7,7,20][index%4])<.01);
  assert.ok(bounds.min.y>=.299&&bounds.max.y<12);
  assert.ok(bounds.min.x>8.29||bounds.max.x< -8.29);
 }
 assert.match(manifest.blender,/^5\.2/);
});
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
async function buildingsFixture(){
 const { CityBuildings }=await import('../src/scene/CityBuildings.ts');
 const bytes=readFileSync('public/assets/city/buildings.glb');
 const load=async()=> (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
 const environment=new Group(), fallbacks=Array.from({length:8},()=>new Group());
 fallbacks.forEach(f=>environment.add(f));
 return {CityBuildings,environment,fallbacks,load};
}
test('city loader: actual asset adopted once; failed retry retains fallback',async()=>{
 const f=await buildingsFixture(), reports=[];let calls=0;
 const a=new f.CityBuildings(f.environment,f.fallbacks,s=>reports.push(s.phase),async()=>{if(++calls===1)throw Error('missing');return f.load();});
 await a.load();assert.equal(a.state.phase,'error');assert.ok(f.fallbacks.every(n=>n.visible));
 await a.load();assert.equal(a.state.phase,'ready');assert.ok(f.fallbacks.every(n=>!n.visible));assert.equal(f.environment.children.length,16);
 await a.load();assert.equal(calls,2);a.dispose();assert.equal(f.environment.children.length,8);
 assert.deepEqual(reports,['loading','error','loading','ready']);
});
test('city loader: malformed asset rejected; dispose during pending releases late result',async()=>{
 const f=await buildingsFixture();
 const bad=new f.CityBuildings(f.environment,f.fallbacks,()=>{},async()=>new Group());
 await bad.load();assert.equal(bad.state.phase,'error');bad.dispose();
 let finish,calls=0,reports=0;
 const a=new f.CityBuildings(f.environment,f.fallbacks,()=>reports++,()=>{calls++;return new Promise(r=>finish=r);});
 const pending=a.load();await a.load();assert.equal(calls,1);a.dispose();
 const late=await f.load();let disposed=0;late.traverse(n=>{if(n.isMesh)n.geometry.addEventListener('dispose',()=>disposed++);});finish(late);await pending;
 assert.ok(disposed>0);assert.equal(reports,1);assert.equal(f.environment.children.length,8);assert.ok(f.fallbacks.every(n=>n.visible));
});
test('editor UI: live state updates do not overwrite unapplied XYZ drafts',async()=>{
 const {showEditorState}=await import('../src/ui/CharacterEditor.ts');
 const nodes=new Map([['#character-position',{textContent:''}],['#walk-speed-value',{textContent:''}],['#building-status',{textContent:''}],['#retry-buildings',{hidden:false}],['#position-x',{value:'7.3'}]]);
 const root={querySelector:s=>nodes.get(s)};
 showEditorState(root,{x:0,y:.32,z:5,speed:1.2},.5,{phase:'ready',message:'Ready'});
 assert.match(nodes.get('#character-position').textContent,/0\.00.*0\.32.*5\.00.*1\.20/);
 assert.equal(nodes.get('#position-x').value,'7.3');assert.equal(nodes.get('#retry-buildings').hidden,true);
 showEditorState(root,{x:1,y:.32,z:5,speed:0},.5,{phase:'error',message:'Fallback'});
 assert.equal(nodes.get('#retry-buildings').hidden,false);
});
