import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3, Group } from 'three';
import { RiggedCharacter } from '../src/character/RiggedCharacter.ts';
import { assetCatalog } from '../src/character/assetCatalog.ts';
import { swimWaterlineHeight } from '../src/character/SwimController.ts';

const load = async name => {
  const b = readFileSync(new URL(`../public/assets/characters/${name}.glb`, import.meta.url));
  return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
};
const motion = { x: 2, y: 0.075, z: 5, heading: 0.5, speed: 0, grounded: true, action: 'idle' };

test('real GLB waterlines and cached climb poses blend from each swim stroke to standing', async () => {
  for (const [variant, definition] of Object.entries(assetCatalog)) {
    const model = new RiggedCharacter(await load(variant), definition);
    try {
      const bone = name => model.root.getObjectByName(name);
      const joints = ['WristL', 'WristR', 'FootL', 'FootR'].map(bone);
      const height = name => bone(name).getWorldPosition(new Vector3()).y;
      assert.ok(Math.abs((height('Chest') + height('Neck')) / 2 - swimWaterlineHeight[variant]) < 1e-6);
      const positions = () => joints.map(joint => model.root.worldToLocal(joint.getWorldPosition(new Vector3())));
      const standing = positions();
      let cachedReach;
      for (const pose of ['dive', 'jellyfish']) {
        const appearance = { pose, outfit: 'swimwear' };
        const swim = { ...motion, action: 'jump', grounded: false, speed: 1.6 };
        model.update(swim, .05, appearance, true);
        const source = positions();
        model.update(swim, 0, appearance, false, false, 0);
        assert.ok(positions().every((point, i) => point.distanceTo(source[i]) < 1e-7));
        let previous = source;
        for (let index = 1; index <= 100; index++) {
          model.update(swim, .012, appearance, false, false, index / 100);
          const frame = positions();
          assert.ok(frame.every((point, i) => point.distanceTo(previous[i]) < .12));
          if (index === 24) {
            if (cachedReach) assert.ok(frame.every((point, i) => point.distanceTo(cachedReach[i]) < 1e-7));
            else cachedReach = frame;
            assert.ok(frame[0].z > .23 && frame[1].z > .23);
          }
          if (index === 54) assert.ok(frame[2].y - frame[3].y > .23 * definition.height);
          previous = frame;
        }
        assert.ok(previous.every((point, i) => point.distanceTo(standing[i]) < 1e-7));
        model.update(motion, 0, appearance);
        assert.ok(positions().every((point, i) => point.distanceTo(standing[i]) < 1e-7));
      }
    } finally {
      model.dispose();
    }
  }
});
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

test('three aquatic poses and both outfits fit all shipped rigs and restore land animation', async () => {
  for (const variant of ['man', 'woman', 'child']) {
    const gltf = await load(variant);
    const model = new RiggedCharacter(gltf, assetCatalog[variant]);
    try {
      const original = new Map();
      gltf.scene.traverse(mesh => { if (mesh.isMesh) original.set(mesh, mesh.material); });
      const frame = { ...motion, y: -2, speed: 2, grounded: false, action: 'jump' };
      for (const outfit of ['swimwear', 'scuba']) {
        const signatures = new Set();
        for (const pose of ['breaststroke', 'dive', 'jellyfish']) {
          const appear = { pose, outfit };
          model.update(frame, .05, appear, true);
          const wrist = model.root.getObjectByName('WristL');
          const foot = model.root.getObjectByName('FootL');
          const initialWrist = wrist.getWorldPosition(new Vector3());
          const initialFoot = foot.getWorldPosition(new Vector3());
          for (let i = 0; i < 7; i++) model.update(frame, .05, appear, true);
          const endWrist = wrist.getWorldPosition(new Vector3());
          const endFoot = foot.getWorldPosition(new Vector3());
          const signature = [...endWrist.toArray(), ...endFoot.toArray()];
          assert.ok(signature.every(Number.isFinite));
          signatures.add(signature.map(value => value.toFixed(3)).join(','));
          if (pose === 'breaststroke') assert.ok(endWrist.distanceTo(initialWrist) > .08);
          if (pose === 'dive') assert.ok(endFoot.distanceTo(initialFoot) > .015);
          assert.deepEqual(model.root.position.toArray(), [frame.x, frame.y, frame.z]);
          assert.ok(model.eyeHeight < assetCatalog[variant].eyeHeight);
          assert.equal(!!model.root.getObjectByName('Air cylinder'), outfit === 'scuba');
          assert.equal(!!model.root.getObjectByName('Swim cap'), outfit === 'swimwear');
          const lens = model.root.getObjectByName(outfit === 'scuba' ? 'Dive mask lens' : 'Swim goggles lens');
          const head = model.root.getObjectByName('Head');
          assert.ok(lens.getWorldPosition(new Vector3()).distanceTo(head.getWorldPosition(new Vector3())) < .25);
          assert.ok([...original].some(([mesh, material]) => mesh.material !== material));
        }
        assert.equal(signatures.size, 3);
      }
      model.update({ ...motion, action: 'walk' }, .05);
      assert.equal(model.action, 'walk');
      assert.equal(model.eyeForward, assetCatalog[variant].eyeForward);
      assert.equal(model.root.getObjectByName('Air cylinder'), undefined);
      assert.equal(model.root.getObjectByName('Swim cap'), undefined);
      for (const [mesh, material] of original) assert.equal(mesh.material, material);
    } finally {
      model.dispose();
    }
  }
});
