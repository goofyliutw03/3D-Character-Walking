import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Group, Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { SceneObjectIndex } from '../src/inspector/SceneObjectIndex.ts';
import { projectObjectLabel } from '../src/inspector/SceneObjectInspector.ts';

test('inspector stable IDs follow object lifetime, hierarchy and removals without mutating scene', () => {
  const root = new Scene(), group = new Group(), mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  group.name='街道'; mesh.name='Tree'; root.add(group); group.add(mesh);
  const index=new SceneObjectIndex(); assert.equal(index.sync(root),true);
  const [r,g,m]=index.rows;
  assert.equal(r.name,'Scene'); assert.equal(m.path,'Scene/街道/Tree'); assert.equal(m.parentId,g.id);
  assert.equal(new Set(index.rows.map(r=>r.id)).size,3); assert.ok(r.id>0);
  assert.equal(index.sync(root),false);
  index.setChecked(m.id,false); index.configure('Tree','');
  assert.equal(mesh.visible,true); assert.equal(mesh.material.transparent,false);
  root.add(mesh); index.sync(root); assert.equal(index.rows.at(-1).id,m.id); assert.equal(index.rows.at(-1).checked,false);
  mesh.removeFromParent(); index.sync(root); assert.equal(index.rows.some(r=>r.id===m.id),false);
  const fresh=new Group(); root.add(fresh); index.sync(root); assert.ok(index.rows.at(-1).id>m.id);
  root.add(mesh); index.sync(root); assert.equal(index.rows.at(-1).id,m.id);
  mesh.geometry.dispose();mesh.material.dispose();index.dispose();assert.equal(index.rows.length,0);
});

test('inspector regex and range intersect, retain ancestors and keep checkbox independent',()=>{
  const root=new Scene(), parent=new Group(), a=new Group(), b=new Group();
  parent.name='Park';a.name='Oak';b.name='Pine'; root.add(parent);parent.add(a,b);
  const index=new SceneObjectIndex();index.sync(root);
  const id=index.rows.find(r=>r.object===a).id;
  assert.equal(index.configure('Park/Oak$',`${id}-${id}, 900-999`),null);
  assert.deepEqual(index.treeRows.map(r=>r.name),['Scene','Park','Oak']);
  assert.equal(index.treeRows[0].matched,false);assert.equal(index.treeRows[2].matched,true);
  index.setChecked(id,false);assert.equal(index.rows.find(r=>r.id===id).checked,false);
  index.configure('pine','');assert.equal(index.treeRows.length,0);
  index.configure('Pine',`${id}`);assert.equal(index.treeRows.length,0);
  index.configure('','');assert.equal(index.treeRows.length,4);assert.equal(index.rows.find(r=>r.id===id).checked,false);
});

test('inspector rejects malformed filters atomically and handles safe integer range boundaries',()=>{
  const root=new Scene(), index=new SceneObjectIndex();index.sync(root);
  const id=index.rows[0].id;assert.equal(index.configure('Scene',String(id)),null);
  for(const range of ['0','-1','3-2','1.5','1,,2','1-2-3','1,','9007199254740992','a']){
    assert.ok(index.configure('absent',range)); assert.equal(index.treeRows.length,1,range);
  }
  assert.ok(index.configure('[',''));assert.equal(index.treeRows.length,1);
  assert.ok(index.configure('x'.repeat(161),''));assert.equal(index.treeRows.length,1);
  assert.equal(index.configure('',`1-${Number.MAX_SAFE_INTEGER}`),null);assert.equal(index.treeRows.length,1);
  assert.equal(index.configure('','  '),null);assert.equal(index.treeRows.length,1);
});

test('inspector labels use world origins, actual camera and fisheye, respect all hidden ancestors',()=>{
  const root=new Scene(), group=new Group(), object=new Group(), camera=new PerspectiveCamera(60,2,.1,100);
  root.add(group);group.add(object);group.position.set(1,0,-5);root.updateMatrixWorld(true);
  const normal=projectObjectLabel(object,camera,800,400,false);
  const fish=projectObjectLabel(object,camera,800,400,true);
  assert.ok(normal.x>400);assert.ok(fish.x>400);assert.notEqual(normal.x,fish.x);
  group.visible=false;assert.equal(projectObjectLabel(object,camera,800,400,false),null);
  group.visible=true;object.visible=false;assert.equal(projectObjectLabel(object,camera,800,400,true),null);
  object.visible=true;group.position.z=5;root.updateMatrixWorld(true);
  assert.equal(projectObjectLabel(object,camera,800,400,true),null);
  group.position.set(100,0,-5);root.updateMatrixWorld(true);
  assert.equal(projectObjectLabel(object,camera,800,400,false),null);
  assert.equal(projectObjectLabel(object,camera,800,400,true),null);
});
