import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3, Group } from 'three';
import { RiggedCharacter } from '../src/character/RiggedCharacter.ts';
import { assetCatalog } from '../src/character/assetCatalog.ts';

const load = async name => {
  const b = readFileSync(new URL(`../public/assets/characters/${name}.glb`, import.meta.url));
  return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
};
const motion = { x: 2, y: 0.075, z: 5, heading: 0.5, speed: 0, grounded: true, action: 'idle' };
test('rigged 3.1–3.4,4.1: real models normalize, animate and preserve controller position', async () => {
  for (const variant of ['man','woman','child']) {
    const character = new RiggedCharacter(await load(variant), assetCatalog[variant]);
    const box = new Box3().setFromObject(character.root);
    assert.ok(Math.abs(box.min.y) < 0.001);
    assert.ok(Math.abs(box.getSize(new Vector3()).y - assetCatalog[variant].height) < 0.001);
    const idleTime = character.mixer.time;
    character.update(motion, 0.04);
    assert.ok(character.mixer.time > idleTime);
    for (const action of ['walk', 'run', 'jump', 'idle','jump','run','walk']) {
      character.update({ ...motion, action, speed: 2 }, 0.05);
      for (let i=0;i<8;i++) character.update({ ...motion, action, speed: 2 }, 0.05);
      assert.equal(character.action, action);
      assert.deepEqual(character.root.position.toArray(), [2, 0.075, 5]);
      assert.equal(character.root.rotation.y, 0.5);
      assert.ok(character.mixer.stats.actions.inUse <= 2);
      assert.ok(new Box3().setFromObject(character.root).getSize(new Vector3()).toArray().every(Number.isFinite));
    }
    character.dispose();
  }
});
test('rigged 2.4: shared geometries/materials dispose once and detach', async () => {
  const gltf = await load('man');
  const geometries = new Set(), materials = new Set();
  gltf.scene.traverse(o => { if(o.isMesh){geometries.add(o.geometry); for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);} });
  let g=0,m=0;
  for(const x of geometries)x.addEventListener('dispose',()=>g++);
  for(const x of materials)x.addEventListener('dispose',()=>m++);
  const character = new RiggedCharacter(gltf, assetCatalog.man);
  character.setShadows(false);
  character.root.traverse(o=>{if(o.isMesh)assert.equal(o.castShadow,false);});
  character.dispose();character.dispose();
  assert.equal(g,geometries.size);assert.equal(m,materials.size);
  assert.equal(character.mixer.stats.actions.inUse,0);
});
test('rigged 2.2: missing required clips and unskinned assets are rejected', async () => {
  const gltf = await load('man');
  gltf.animations = gltf.animations.filter(a=>a.name!=='Jump');
  assert.throws(()=>new RiggedCharacter(gltf,assetCatalog.man),/Jump/);
  assert.throws(()=>new RiggedCharacter({...gltf,scene:new Group()},assetCatalog.man),/skinned/);
});
