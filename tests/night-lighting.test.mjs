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
 assert.ok(lights.every(l=>l.intensity>0&&l.distance===12));assert.ok(lamp.material.emissiveIntensity>0);assert.equal(lights.filter(l=>l.castShadow).length,1);
 const night=city.scene.background.getHexString();assert.equal(city.setTimeOfDay('invalid'),false);assert.equal(city.scene.background.getHexString(),night);
 city.setEvening(true);const evening=city.scene.background.getHexString();assert.ok(lights.every(l=>l.intensity===0));assert.equal(lamp.material.emissiveIntensity,0);
 city.setTimeOfDay('night');city.setTimeOfDay('evening');assert.equal(city.scene.background.getHexString(),evening);
 city.setEvening(false);assert.equal(city.scene.background.getHexString(),day);assert.equal(city.timeOfDay,'day');
 let released=0;for(const l of lights)l.addEventListener('dispose',()=>released++);city.dispose();assert.equal(released,6);
});

test('Night 6: manual selection, atomic rejection, snapshots and six independent lifetimes',()=>{
 const city=new CityScene(),lights=[];city.scene.traverse(o=>{if(o instanceof PointLight)lights.push(o);});
 const active=()=>lights.flatMap((l,i)=>l.castShadow?[i+1]:[]);
 assert.deepEqual(active(),[]);city.setTimeOfDay('night');assert.deepEqual(active(),[2]);
 assert.equal(new Set(lights.map(l=>l.shadow)).size,6);
 const snapshot=city.getLampShadowOptions();snapshot[1].selected=false;snapshot[0].id=99;snapshot.length=0;
 assert.equal(city.getLampShadowOptions()[1].selected,true);
 const ids=[1,3,6];assert.equal(city.setLampShadowSelection(ids),true);ids.push(2);assert.deepEqual(active(),[1,3,6]);
 for(const bad of [null,{},'1',[0],[7],[1.1],[NaN],[Infinity],['2'],[1,undefined],Array(2)]){
  assert.equal(city.setLampShadowSelection(bad),false);assert.deepEqual(active(),[1,3,6]);
 }
 let released=0,lightsDisposed=0;
 for(const light of lights){light.shadow.map={dispose(){released++;}};light.addEventListener('dispose',()=>lightsDisposed++);}
 for(let round=0;round<4;round++)for(const selection of [[],[1],[2,4,6],[1,2,3,4,5,6]]){
  city.setLampShadowSelection(selection);assert.deepEqual(active(),selection);
  city.setShadows(false);assert.deepEqual(active(),[]);city.setTimeOfDay('day');city.setTimeOfDay('night');assert.deepEqual(active(),[]);
  city.setShadows(true);assert.deepEqual(active(),selection);
  for(const time of ['day','evening']){city.setTimeOfDay(time);assert.deepEqual(active(),[]);city.setTimeOfDay('night');assert.deepEqual(active(),selection);}
 }
 city.setLampShadowSelection([2,2]);assert.deepEqual(active(),[2]);
 assert.equal(released,0);city.dispose();city.dispose();assert.equal(released,6);assert.equal(lightsDisposed,6);
 assert.deepEqual(active(),[]);assert.equal(city.setLampShadowSelection([1]),false);
});


test('Night 7: exact 3D radius, multiple candidates, atomic API and retained state',()=>{
 const city=new CityScene(),lights=[];city.scene.traverse(o=>{if(o instanceof PointLight)lights.push(o);});
 const active=()=>lights.flatMap((l,i)=>l.castShadow?[i+1]:[]);
 assert.deepEqual(city.getLampShadowDetection(),{enabled:false,radius:10});
 city.setTimeOfDay('night');city.setLampShadowSelection([2,5]);
 const p={x:0,y:4.25,z:3};city.updateLampShadowPosition(p);
 city.setLampShadowDetection(true,4.4);assert.deepEqual(active(),[2,5]);
 city.setLampShadowDetection(true,4.4-1e-8);assert.deepEqual(active(),[]);
 city.setLampShadowDetection(true,4.4);city.updateLampShadowPosition({...p,y:4.2501});assert.deepEqual(active(),[]);
 city.updateLampShadowPosition(p);p.y=999;assert.deepEqual(active(),[2,5]);
 const snap=city.getLampShadowDetection();snap.radius=1;snap.enabled=false;
 for(const args of [[1,10],[null,10],['true',10],[true,NaN],[true,Infinity],[false,0],[false,31],[true,'10']]){
  assert.equal(city.setLampShadowDetection(...args),false);assert.deepEqual(city.getLampShadowDetection(),{enabled:true,radius:4.4});assert.deepEqual(active(),[2,5]);
 }
 for(const bad of [null,[],{},'xyz',{x:0,y:NaN,z:3},{x:Infinity,y:4.25,z:3},{x:0,y:4.25,z:'3'}]){
  assert.equal(city.updateLampShadowPosition(bad),false);assert.deepEqual(active(),[2,5]);
 }
 // World transform participates in distance, including a transformed fixture parent.
 lights[1].parent.position.y=1;city.updateLampShadowPosition({x:0,y:4.25,z:3});assert.deepEqual(active(),[5]);
 lights[1].parent.position.y=0;city.updateLampShadowPosition({x:0,y:4.25,z:3});
 for(const time of ['day','evening']){city.setTimeOfDay(time);assert.deepEqual(active(),[]);city.setTimeOfDay('night');assert.deepEqual(active(),[2,5]);}
 city.setShadows(false);assert.deepEqual(active(),[]);city.setShadows(true);assert.deepEqual(active(),[2,5]);
 city.setLampShadowSelection([]);assert.deepEqual(active(),[]);city.setLampShadowSelection([1,2,5]);assert.deepEqual(active(),[2,5]);
 city.setLampShadowDetection(false,1);assert.deepEqual(active(),[1,2,5]);
 city.setLampShadowDetection(true,30);assert.deepEqual(active(),[1,2,5]);
 city.dispose();assert.equal(city.setLampShadowDetection(false,10),false);assert.equal(city.updateLampShadowPosition({x:0,y:0,z:0}),false);
});
