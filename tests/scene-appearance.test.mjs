import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three';
import { SceneAppearance } from '../src/scene/SceneAppearance.ts';
import { CityScene } from '../src/scene/CityScene.ts';

test('appearance: blockers use isolated materials and restore arrays and shared resources', () => {
  const environment = new Group(), building = new Group(); environment.add(building);
  const texture = new Texture();
  const shared = new MeshStandardMaterial({ opacity: 0.8, transparent: true, map: texture });
  const other = new MeshStandardMaterial();
  const body = new Mesh(new BoxGeometry(), shared), window = new Mesh(body.geometry, [shared, other]);
  const neighbor = new Mesh(body.geometry, shared); building.add(body, window); environment.add(neighbor);
  const originalArray = window.material;
  let originalDisposes = 0, textureDisposes = 0, cloneDisposes = 0;
  shared.addEventListener('dispose', () => originalDisposes++); texture.addEventListener('dispose', () => textureDisposes++);
  const appearance = new SceneAppearance(environment);
  appearance.apply('transparent', new Set([building]));
  assert.notEqual(body.material, shared); assert.equal(neighbor.material, shared);
  assert.equal(body.material.opacity, 0.25); assert.equal(body.material.transparent, true); assert.equal(body.material.depthWrite, false);
  assert.equal(window.material.length, 2); assert.equal(window.material[1].opacity, 0.25);
  for (const clone of [body.material, ...window.material]) clone.addEventListener('dispose', () => cloneDisposes++);
  const first = body.material; appearance.apply('transparent', new Set([building])); assert.equal(body.material, first);
  appearance.apply('normal');
  assert.equal(body.material, shared); assert.equal(window.material, originalArray); assert.equal(shared.opacity, 0.8);
  assert.equal(shared.depthWrite, true); assert.equal(cloneDisposes, 3);
  appearance.dispose(); appearance.dispose(); assert.equal(cloneDisposes, 3);
  assert.equal(originalDisposes, 0); assert.equal(textureDisposes, 0);
  body.geometry.dispose(); shared.dispose(); other.dispose(); texture.dispose();
});

test('appearance: wireframe covers scenery, excludes protagonist, and mode cycles release clones', () => {
  const city = new CityScene(), protagonist = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  city.scene.add(protagonist);
  const meshes = []; city.environment.traverse(object => { if (object.isMesh) meshes.push(object); });
  assert.ok(meshes.length > 100);
  const originals = meshes.map(mesh => mesh.material);
  const appearance = new SceneAppearance(city.environment);
  let clones = 0, released = 0;
  for (let cycle = 0; cycle < 3; cycle++) {
    appearance.apply('wireframe');
    for (const mesh of meshes) {
      assert.equal(mesh.material.wireframe, true); clones++;
      mesh.material.addEventListener('dispose', () => released++);
    }
    assert.equal(protagonist.material.wireframe, false);
    const root = city.environment.children.find(object => object.isGroup);
    assert.ok(root);
    appearance.apply('transparent', new Set([root]));
    assert.equal(released, clones);
    root.traverse(object => { if (object.isMesh) assert.equal(object.material.opacity, 0.25); });
    appearance.apply('normal');
    meshes.forEach((mesh, index) => assert.equal(mesh.material, originals[index]));
  }
  appearance.apply('wireframe'); appearance.dispose(); appearance.dispose();
  meshes.forEach((mesh, index) => assert.equal(mesh.material, originals[index]));
  city.dispose(); protagonist.geometry.dispose(); protagonist.material.dispose();
});

test('appearance: removed objects are restored before their resources are disposed', () => {
  const environment = new Group(), mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial()); environment.add(mesh);
  const original = mesh.material, appearance = new SceneAppearance(environment);
  appearance.apply('wireframe'); let released = 0; mesh.material.addEventListener('dispose', () => released++);
  environment.remove(mesh); appearance.apply('wireframe');
  assert.equal(mesh.material, original); assert.equal(released, 1);
  appearance.dispose(); assert.equal(released, 1); mesh.geometry.dispose(); original.dispose();
});
