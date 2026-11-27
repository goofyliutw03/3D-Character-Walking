import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3, Group } from 'three';
import { RiggedCharacter } from '../src/character/RiggedCharacter.ts';
import { assetCatalog } from '../src/character/assetCatalog.ts';
import { swimOutfits, swimPoses } from '../src/character/SwimAppearance.ts';
import { characterCapsules } from '../src/character/motion.ts';
import { SwimController, swimWaterlineHeight } from '../src/character/SwimController.ts';
import { createSwim } from '../src/scene/SwimScene.ts';

const load = async name => {
  const b = readFileSync(new URL(`../public/assets/characters/${name}.glb`, import.meta.url));
  return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
};
const motion = { x: 2, y: 0.075, z: 5, heading: 0.5, speed: 0, grounded: true, action: 'idle' };

test('posed body and attached gear clear pool walls, deck, and solid obstacles', async t => {
  const pool = createSwim();
  t.after(() => pool.dispose());
  const solids = ['column', 'intake', 'swim-exit'].map(name =>
    new Box3().setFromObject(pool.environment.getObjectByName(name)).expandByScalar(-.001));
  const scenarios = [
    { x: 8.72, y: -3, z: -4, heading: Math.PI / 2 },
    { x: -8.72, y: -3, z: -5.72, heading: -Math.PI * .75 },
    { x: -3.22, y: -3, z: 0, heading: -Math.PI / 2 },
    { x: 2.12, y: -3, z: -1, heading: Math.PI / 2 },
    { x: 0, y: -2, z: 3.52, heading: 0 },
    { x: 0, y: -5, z: 0, heading: 0 },
  ];
  let corrections = 0;
  const check = (rig, state, capsule, holdDepth = false) => {
    const body = rig.sampleBodyBounds();
    assert.ok(!body.isEmpty());
    const fit = pool.swim.fitBody(body, state, capsule, holdDepth);
    if (fit) {
      corrections++;
      if (holdDepth) assert.equal(fit.y, state.y);
      if (capsule) assert.deepEqual(pool.walkableWorld.query.overlap(fit, capsule), { ok: true, value: false });
      body.translate(new Vector3(fit.x - state.x, fit.y - state.y, fit.z - state.z));
    }
    assert.ok(body.min.x >= -9.001 && body.max.x <= 9.001);
    assert.ok(body.min.z >= -6.001 && body.max.z <= 6.001);
    assert.ok(body.min.y >= -5.001 && body.max.y <= 4.001);
    assert.ok(solids.every(solid => !body.intersectsBox(solid)));
  };
  for (const [variant, definition] of Object.entries(assetCatalog)) {
    const rig = new RiggedCharacter(await load(variant), definition);
    t.after(() => rig.dispose());
    const capsule = characterCapsules[variant];
    for (const outfit of swimOutfits) for (const pose of swimPoses) {
      for (const location of scenarios) for (const speed of [0, 1.7]) {
        const state = { ...motion, ...location, speed, grounded: false, action: 'jump' };
        for (let frame = 0; frame < 8; frame++) {
          rig.update(state, .05, { outfit, pose }, true);
          check(rig, state, capsule, location.y === -3);
        }
      }
    }
    for (const outfit of swimOutfits) {
      const appearance = { outfit, pose: 'breaststroke' };
      for (const action of ['idle', 'walk', 'run', 'jump']) {
        for (const [x, y, z] of [[0, .22, 5.72], [8.72, -5, 0]]) {
          const state = { ...motion, x, y, z, action, speed: action === 'idle' ? 0 : 1.8 };
          rig.update(state, .05, appearance);
          check(rig, state);
        }
      }
      const { exit, water } = pool.swim;
      const actor = new SwimController(pool.walkableWorld, capsule, pool.spawn, water, exit);
      assert.ok(actor.relocate({ x: 0, y: water.level - swimWaterlineHeight[variant], z: 3.5 }, false));
      rig.update(actor.snapshot, .05, appearance, true);
      assert.ok(actor.leaveWater());
      for (let frame = 0; frame < 30 && actor.mode === 'climb'; frame++) {
        const state = actor.update(.05, { x: 0, z: 0, jump: false, run: false });
        rig.update(state, .05, appearance, false, false, actor.climbProgress);
        check(rig, state);
      }
      assert.equal(actor.mode, 'ground');
    }
  }
  assert.ok(corrections > 0);
});
test('both fins stay attached to their own foot through swimming, climbing and land clips', async () => {
  for (const [variant, definition] of Object.entries(assetCatalog)) {
    const character = new RiggedCharacter(await load(variant), definition);
    const appearance = { outfit: 'scuba', pose: 'breaststroke' };
    character.update(motion, .05, appearance);
    const fins = character.root.getObjectsByProperty('name', 'Fin blade');
    const pockets = character.root.getObjectsByProperty('name', 'Fin foot pocket');
    assert.equal(fins.length, 2);
    assert.equal(pockets.length, 2);
    const pieces = [...fins, ...pockets].map(mesh => {
      const mount = mesh.parent;
      const foot = mount.parent;
      assert.match(foot.name, /^Foot[LR]$/);
      return { mount, foot, position: mount.position.clone(), rotation: mount.quaternion.clone() };
    });
    const sample = (state, swimming, climb) => {
      character.update(state, .05, appearance, swimming, false, climb);
      for (const { mount, foot, position, rotation } of pieces) {
        assert.equal(mount.parent, foot);
        assert.ok(mount.position.equals(position) && mount.quaternion.equals(rotation));
        assert.ok(mount.getWorldPosition(new Vector3()).toArray().every(Number.isFinite));
      }
    };
    for (const pose of swimPoses) {
      appearance.pose = pose;
      for (let frame = 0; frame < 80; frame++) sample({ ...motion, speed: 1.7 }, true);
    }
    for (let frame = 0; frame < 40; frame++) sample(motion, true);
    for (let frame = 0; frame <= 40; frame++) sample(motion, false, frame / 40);
    for (const action of ['idle', 'walk', 'run', 'jump']) {
      for (let frame = 0; frame < 30; frame++) sample({ ...motion, action }, false);
    }
    character.dispose();
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
