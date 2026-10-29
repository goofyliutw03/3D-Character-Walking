import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer, Box3, Vector3 } from 'three';

export async function loadAsset(name) {
  const bytes = readFileSync(new URL(`../public/assets/characters/${name}.glb`, import.meta.url));
  assert.ok(bytes.length < 2 * 1024 * 1024);
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

test('Child hands retain adult proportions throughout all four clips', async () => {
  const adult = await loadAsset('man'), child = await loadAsset('child');
  function radius(gltf, side) {
    const wrist = gltf.scene.getObjectByName(`Wrist${side}`).getWorldPosition(new Vector3());
    let maximum = 0, count = 0;
    gltf.scene.traverse(mesh => {
      if (!mesh.isSkinnedMesh) return;
      const { skinIndex, skinWeight } = mesh.geometry.attributes;
      for (let i = 0; i < skinIndex.count; i++) {
        let influence = 0;
        for (let k = 0; k < 4; k++) {
          const name = mesh.skeleton.bones[skinIndex.getComponent(i, k)].name;
          if (/^(Wrist|Index|Middle|Pinky|Ring|Thumb)/.test(name) && name.endsWith(side))
            influence += skinWeight.getComponent(i, k);
        }
        if (influence < 0.99) continue;
        const point = mesh.getVertexPosition(i, new Vector3()).applyMatrix4(mesh.matrixWorld);
        maximum = Math.max(maximum, point.distanceTo(wrist)); count++;
      }
    });
    assert.ok(count > 500, 'must inspect the actual skinned hand surface');
    return maximum;
  }
  const mixers = [adult, child].map(g => new AnimationMixer(g.scene));
  for (const name of ['Idle', 'Walk', 'Run', 'Jump']) {
    for (let sample = 0; sample <= 12; sample++) {
      for (const [i, g] of [adult, child].entries()) {
        mixers[i].stopAllAction();
        const clip = g.animations.find(a => a.name === name);
        mixers[i].clipAction(clip).reset().play();
        mixers[i].setTime(clip.duration * sample / 13);
        g.scene.updateMatrixWorld(true);
      }
      for (const side of ['L', 'R']) {
        const ratio = radius(child, side) / radius(adult, side);
        assert.ok(ratio > 0.67 && ratio < 0.79, `${name} sample ${sample} ${side}: hand scale ${ratio}`);
      }
    }
  }
  for (const [i, g] of [adult, child].entries()) { mixers[i].stopAllAction(); mixers[i].uncacheRoot(g.scene); }
});
test('rigged 1.1–1.3,3.2,5.1: local GLBs contain skinning, four real clips and child proportions differ', async () => {
  const heights = [], headRatios = [];
  for (const name of ['man', 'woman', 'child']) {
    const gltf = await loadAsset(name);
    assert.deepEqual(gltf.animations.map(a => a.name).sort(), ['Idle', 'Jump', 'Run', 'Walk']);
    let skins = 0;
    gltf.scene.traverse(o => { if (o.isSkinnedMesh) skins++; });
    assert.ok(skins > 0);
    const mixer = new AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations.find(a => a.name === 'Idle')).play();
    mixer.setTime(0); gltf.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(gltf.scene);
    heights.push(box.getSize(new Vector3()).y);
    const head = gltf.scene.getObjectByName('Head');
    assert.ok(head);
    const pos = head.getWorldPosition(new Vector3());
    headRatios.push((box.max.y - pos.y) / heights.at(-1));
    const jump = gltf.animations.find(a => a.name === 'Jump');
    assert.ok(jump.duration > 0.3);
    assert.ok(jump.tracks.some(t => t.name.includes('LowerLeg') && t.name.endsWith('quaternion') && new Set(t.values).size > 4));
    mixer.stopAllAction();
    mixer.clipAction(jump).play(); mixer.setTime(0.3); gltf.scene.updateMatrixWorld(true);
    const left = gltf.scene.getObjectByName('WristL').getWorldPosition(new Vector3());
    const right = gltf.scene.getObjectByName('WristR').getWorldPosition(new Vector3());
    assert.ok(left.x > right.x, `${name}: Jump hands must not cross through the torso`);
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
  }
  assert.ok(heights.every(Number.isFinite));
  assert.ok(headRatios[2] > headRatios[0] * 1.08, `child head ratio ${headRatios}`);
});
