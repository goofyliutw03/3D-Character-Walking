import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Group, Vector3 } from 'three';
import { WaterFeature, createSpraySource } from '../src/water/index.ts';
import { CityScene } from '../src/scene/CityScene.ts';

test('spray 1.1–1.3: bounded buffers, quality, clock, enabled and flow',()=>{
  const water=new WaterFeature(), points=water.root.getObjectByName('Waterfall droplets');
  assert.ok(points?.isPoints); assert.equal(points.userData.cameraObstruction,false);
  const positions=points.geometry.attributes.position.array, material=points.material;
  assert.equal(points.geometry.drawRange.count,384);
  water.update(.1); assert.equal(material.uniforms.uTime.value,.1);
  water.configure({paused:true});water.update(.1);assert.equal(material.uniforms.uTime.value,.1);
  for(let i=0;i<100;i++) {water.configure({quality:i%2?'standard':'low'});water.update(.1);}
  assert.equal(points.geometry.attributes.position.array,positions);
  water.configure({quality:'low',paused:false});assert.equal(points.geometry.drawRange.count,128);
  water.configure({enabled:false});assert.equal(points.visible,false);
  water.configure({enabled:true,flowSpeed:0});assert.equal(points.visible,false);
  water.configure({flowSpeed:1});assert.equal(points.visible,true);
  let released=0; points.geometry.addEventListener('dispose',()=>released++);material.addEventListener('dispose',()=>released++);
  water.dispose();water.dispose();assert.equal(released,2);
});

test('source integration 3.1: city exposes the transformed source through its public interface',()=>{
  const city=new CityScene(),source=createSpraySource();
  assert.equal(city.getWaterSpraySource(source),true);
  const world=source.center.clone().applyMatrix4(source.matrixWorld);
  assert.ok(world.distanceTo(new Vector3(0,1.1,-25.45))<1e-9);
  city.dispose();assert.equal(city.getWaterSpraySource(source),false);
});

test('source 2.1: world source follows translation, rotation and scale without leaking mutable root',()=>{
  const host=new Group(),water=new WaterFeature(),source=createSpraySource();
  host.position.set(5,0,-20);host.rotation.y=Math.PI/2;host.scale.setScalar(2);host.add(water.root);
  assert.equal(water.getSpraySource(source),true);
  const actual=source.center.clone().applyMatrix4(source.matrixWorld);
  const expected=new Vector3(0,1.1,-.85).applyMatrix4(water.root.matrixWorld);
  assert.ok(actual.distanceTo(expected)<1e-9);
  source.matrixWorld.elements[12]=999; assert.equal(host.position.x,5);
  water.dispose();assert.equal(water.getSpraySource(source),false);
});
