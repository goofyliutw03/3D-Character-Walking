import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TargetActor } from '../src/character/TargetActor.ts';

const world = { groundHeight: () => 0.075, bounds: { minX:-10,maxX:10,minZ:-10,maxZ:10 }, obstacles:[] };
const load = async () => {
  const b = readFileSync(new URL('../public/assets/characters/woman.glb', import.meta.url));
  return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
};
test('Target 1.1–1.4,3.4: independent real rig, idle, reset and disposal', async () => {
  const states=[];
  const target = new TargetActor(world,s=>states.push(s),load);
  const other = new TargetActor(world,()=>{},load);
  await Promise.all([target.ready,other.ready]);
  assert.equal(states.at(-1).phase,'ready');
  assert.notEqual(target.model.mixer,other.model.mixer);
  let firstMesh,secondMesh;
  target.model.root.traverse(o=>{if(o.isSkinnedMesh)firstMesh=o;});
  other.model.root.traverse(o=>{if(o.isSkinnedMesh)secondMesh=o;});
  assert.notEqual(firstMesh.skeleton,secondMesh.skeleton);
  assert.notEqual(firstMesh.geometry,secondMesh.geometry);
  target.update(.05); assert.equal(target.model.action,'idle');
  assert.deepEqual(target.root.position.toArray(),[0,0,0]);
  assert.deepEqual(target.model.root.position.toArray(),[0,.075,-1]);
  assert.ok(Math.abs(target.anchor.y-(.075+1.68*.6))<1e-6);
  target.reset(); target.dispose(); target.dispose();
  other.update(.05); assert.equal(other.model.action,'idle');
  assert.equal(target.root.children.length,0); other.dispose();
});
test('Target 1.4,3.4: failed load retries and late result is released', async () => {
  let fail=true;
  const states=[];
  const target=new TargetActor(world,s=>states.push(s),async()=>{if(fail)throw Error('fixture');return load();});
  await target.ready; assert.equal(states.at(-1).phase,'error');
  fail=false; await target.retry(); assert.equal(states.at(-1).phase,'ready'); target.dispose();
  let resolve; const pending=new Promise(r=>resolve=r);
  const late=new TargetActor(world,()=>{},()=>pending); late.dispose();
  const data=await load(); let disposed=0;
  data.scene.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>disposed++);});
  resolve(data); await late.ready; assert.ok(disposed>0); assert.equal(late.model,null);
});
