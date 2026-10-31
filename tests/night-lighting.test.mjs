import test from 'node:test';
import assert from 'node:assert/strict';
import {PointLight} from 'three';
import {CityScene} from '../src/scene/CityScene.ts';
test('Night 1.1–1.3: round trips restore day/evening and isolate lamp emissive',()=>{
 const city=new CityScene(),lights=[];city.scene.traverse(o=>{if(o instanceof PointLight)lights.push(o);});
 assert.equal(lights.length,6);assert.equal(city.timeOfDay,'day');
 const day=city.scene.background.getHexString();
 const lamp=city.environment.getObjectByName('Street lamp lens');const other=city.environment.children.find(o=>o.isMesh);
 assert.ok(lamp);assert.notEqual(lamp.material,other.material);
 assert.equal(city.setTimeOfDay('night'),true);assert.equal(city.timeOfDay,'night');
 assert.notEqual(city.scene.background.getHexString(),day);assert.equal(city.scene.background.getHexString(),city.scene.fog.color.getHexString());
 assert.ok(lights.every(l=>l.intensity>0&&l.distance===12&&!l.castShadow));assert.ok(lamp.material.emissiveIntensity>0);
 const night=city.scene.background.getHexString();assert.equal(city.setTimeOfDay('invalid'),false);assert.equal(city.scene.background.getHexString(),night);
 city.setEvening(true);const evening=city.scene.background.getHexString();assert.ok(lights.every(l=>l.intensity===0));assert.equal(lamp.material.emissiveIntensity,0);
 city.setTimeOfDay('night');city.setTimeOfDay('evening');assert.equal(city.scene.background.getHexString(),evening);
 city.setEvening(false);assert.equal(city.scene.background.getHexString(),day);assert.equal(city.timeOfDay,'day');
 let released=0;for(const l of lights)l.addEventListener('dispose',()=>released++);city.dispose();assert.equal(released,6);
});
