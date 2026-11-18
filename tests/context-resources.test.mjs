import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, DirectionalLight, WebGLRenderTarget, DepthTexture, BoxGeometry, Mesh, MeshStandardMaterial, Texture } from 'three';
import { resetShadowResources, releaseSceneGpuResources } from '../src/engine/ContextResources.ts';

test('context recovery invalidates active and retained inactive scene shadow targets once',()=>{
  const active=new Scene(),retained=new Scene(),a=new DirectionalLight(),b=new DirectionalLight();let depthDisposals=0;
  active.add(a);retained.add(b);let disposed=0;
  for(const light of [a,b]){light.shadow.map=new WebGLRenderTarget(16,16);light.shadow.map.depthTexture=new DepthTexture(16,16);light.shadow.map.depthTexture.addEventListener('dispose',()=>depthDisposals++);light.shadow.map.addEventListener('dispose',()=>disposed++);}
  resetShadowResources([active,retained,active]);
  assert.equal(disposed,2);assert.equal(a.shadow.map,null);assert.equal(b.shadow.map,null);
  assert.equal(depthDisposals,2);
  assert.equal(a.shadow.needsUpdate,true);assert.equal(b.shadow.needsUpdate,true);
  resetShadowResources([active,retained]);assert.equal(disposed,2);
});
test('context loss releases shared GPU geometry/material/texture listeners while retaining CPU scene data',()=>{
  const scene=new Scene(),g=new BoxGeometry(),texture=new Texture(),m=new MeshStandardMaterial({map:texture});
  scene.add(new Mesh(g,m),new Mesh(g,m));const count={geometry:0,material:0,texture:0};
  g.addEventListener('dispose',()=>count.geometry++);m.addEventListener('dispose',()=>count.material++);texture.addEventListener('dispose',()=>count.texture++);
  const positions=g.getAttribute('position');releaseSceneGpuResources([scene,scene]);
  assert.deepEqual(count,{geometry:1,material:1,texture:1});assert.equal(scene.children.length,2);
  assert.equal(g.getAttribute('position'),positions);assert.equal(m.map,texture);
});
