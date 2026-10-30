import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera, Scene, Color, Vector3 } from 'three';
import { CharacterXrayPass } from '../src/engine/CharacterXrayPass.ts';
import { CameraObstruction } from '../src/camera/CameraObstruction.ts';

test('xray: environment filter excludes water, transparency, hidden ancestors and non-environment actors per material', () => {
  const scene = new Scene(), environment = new Group(), subject = new Group(); scene.add(environment, subject);
  const opaque = new MeshBasicMaterial(), glass = new MeshBasicMaterial({transparent:true}), faded = new MeshBasicMaterial({opacity:.9});
  const hashed = new MeshBasicMaterial({alphaHash:true}), refractive = new MeshPhysicalMaterial({transmission:.8});
  const mixed = new Mesh(new BoxGeometry(), [opaque,glass,faded,hashed,refractive]); environment.add(mixed);
  const water = new Mesh(new BoxGeometry(),opaque); water.userData.cameraObstruction=false; environment.add(water);
  const hidden = new Group(); hidden.visible=false; const hiddenMesh=new Mesh(water.geometry,opaque); hidden.add(hiddenMesh); environment.add(hidden);
  const excluded=new Group();excluded.userData.cameraObstruction=false;const child=new Mesh(water.geometry,opaque);excluded.add(child);environment.add(excluded);
  const actor=new Mesh(water.geometry,opaque);subject.add(actor);
  const pass=new CharacterXrayPass();
  const seen=[];
  const renderer=fakeRenderer((s)=>{seen.push({mixed:[...mixed.material],water:water.material.visible,hidden:hiddenMesh.material.visible,child:child.material.visible,actor:actor.material.visible});});
  pass.render(renderer,scene,new PerspectiveCamera(),subject,environment);
  assert.equal(seen.length,4); // base, environment depth, subject depth, composite
  assert.equal(seen[1].mixed[0].visible,true);assert.equal(seen[1].mixed[1].visible,false);assert.equal(seen[1].mixed[2].visible,false);
  assert.equal(seen[1].mixed[3].visible,false);assert.equal(seen[1].mixed[4].visible,false);
  assert.equal(seen[1].water,false);assert.equal(seen[1].child,false);assert.equal(seen[1].actor,false);
  assert.equal(seen[2].actor,true);assert.equal(seen[2].mixed[0].visible,false);
  assert.equal(mixed.material[0],opaque);assert.equal(mixed.material[1],glass);assert.equal(water.material,opaque);
  pass.dispose();pass.dispose();opaque.dispose();glass.dispose();faded.dispose();hashed.dispose();refractive.dispose();mixed.geometry.dispose();water.geometry.dispose();
});

test('xray: render failure restores scene, materials, renderer state and destination', () => {
  const scene=new Scene(), environment=new Group(), subject=new Group();scene.add(environment,subject);
  const material=new MeshBasicMaterial(), mesh=new Mesh(new BoxGeometry(),material);environment.add(mesh);
  const background=new Color('blue');scene.background=background;
  let renders=0;const renderer=fakeRenderer(()=>{if(++renders===2)throw new Error('GPU failure');});
  const destination={width:300,height:200};renderer.setRenderTarget(destination);
  const pass=new CharacterXrayPass();
  assert.throws(()=>pass.render(renderer,scene,new PerspectiveCamera(),subject,environment),/GPU failure/);
  assert.equal(mesh.material,material);assert.equal(scene.background,background);assert.equal(renderer.getRenderTarget(),destination);
  assert.equal(renderer.autoClear,false);assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(renderer.getClearAlpha(),.7);
  assert.equal(renderer.getClearColor(new Color()).getHex(),0x123456);
  let disposed=0;material.addEventListener('dispose',()=>disposed++);pass.dispose();pass.dispose();assert.equal(disposed,0);
  mesh.geometry.dispose();material.dispose();
});

function fakeRenderer(render) {
  let target=null, color=new Color(0x123456), alpha=.7;
  return {autoClear:false,shadowMap:{autoUpdate:true},getRenderTarget:()=>target,setRenderTarget:t=>{target=t;},
    getDrawingBufferSize:v=>v.set(640,480),getClearColor:v=>v.copy(color),getClearAlpha:()=>alpha,
    setClearColor:(c,a)=>{color.set(c);if(a!==undefined)alpha=a;},render};
}

test('xray: mode transition restores original transparent flags before mask filtering and preserves projection', () => {
  const environment=new Group(),wall=new Mesh(new BoxGeometry(8,8,.2),new MeshBasicMaterial());wall.position.set(0,1,2);environment.add(wall);
  const obstruction=new CameraObstruction(environment),desired=new PerspectiveCamera(43,1.6,.1,200),rendered=new PerspectiveCamera();
  desired.position.set(0,1,5);desired.lookAt(0,1,0);const subject={x:0,y:0,z:0,height:1.8};
  const original=wall.material;obstruction.setMode('transparent');obstruction.update(desired,rendered,new Vector3(0,1,0),subject,0,true);
  assert.notEqual(wall.material,original);assert.equal(wall.material.transparent,true);
  obstruction.setMode('xray');obstruction.update(desired,rendered,new Vector3(0,1,0),subject,0,true);
  assert.equal(wall.material,original);assert.equal(wall.material.transparent,false);assert.equal(rendered.position.distanceTo(desired.position),0);
  assert.equal(rendered.fov,desired.fov);assert.equal(rendered.aspect,desired.aspect);
  obstruction.update(desired,rendered,new Vector3(),subject,0,true,false);assert.equal(rendered.position.distanceTo(desired.position),0);
  obstruction.dispose();wall.geometry.dispose();original.dispose();
});

test('xray: cache prunes replaced actors and dispose releases only owned resources once', () => {
  const scene=new Scene(),environment=new Group(),subject=new Group();scene.add(environment,subject);
  const original=new MeshBasicMaterial(),mesh=new Mesh(new BoxGeometry(),original);subject.add(mesh);
  const pass=new CharacterXrayPass(),depths=new Set();let depthDisposes=0,originalDisposes=0;
  original.addEventListener('dispose',()=>originalDisposes++);
  const renderer=fakeRenderer(()=>{if(mesh.material!==original&&mesh.material.visible&&!depths.has(mesh.material)){depths.add(mesh.material);mesh.material.addEventListener('dispose',()=>depthDisposes++);}});
  for(let i=0;i<10;i++)pass.render(renderer,scene,new PerspectiveCamera(),subject,environment);
  assert.equal(depths.size,1);assert.equal(depthDisposes,0);
  subject.remove(mesh);pass.render(renderer,scene,new PerspectiveCamera(),subject,environment);assert.equal(depthDisposes,1);
  pass.dispose();pass.dispose();assert.equal(depthDisposes,1);assert.equal(originalDisposes,0);mesh.geometry.dispose();original.dispose();
});
