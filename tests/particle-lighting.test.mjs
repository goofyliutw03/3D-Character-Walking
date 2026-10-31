import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,PointLight} from 'three';
import {ParticleInteraction} from '../src/interaction/ParticleInteraction.ts';
const origin=new Vector3(0,1,0),aim=new Vector3(0,1,6);
const lamps=p=>{const out=[];for(const g of p.root.children)g.traverse(o=>{if(o instanceof PointLight)out.push(o);});return out;};
test('Lighting 3.1/3.2/3.5: flight snapshot, independent color, burst fade without moving light',()=>{
 const p=new ParticleInteraction();const s={...p.settings,speed:10,lightColor:'#ff0000',lightIntensity:40};
 assert.equal(p.configure(s),true);p.fire(origin,aim);const light=lamps(p)[0];assert.ok(light);assert.equal(light.color.getHexString(),'ff0000');
 p.configure({...s,lightEnabled:false,lightIntensity:2});p.update(.2,aim,.3);
 assert.equal(light.intensity,40);assert.equal(light.getWorldPosition(new Vector3()).z,2);
 p.update(.4,aim,.3);assert.equal(p.snapshot.hits,1);assert.equal(light.parent,p.root.children[0]);
 p.update(.125,aim,.3);assert.equal(light.intensity,20);assert.deepEqual(light.position.toArray(),[0,0,0]);
 assert.ok(p.root.children[0].children.filter(o=>o.isMesh).every(o=>o.position.length()>0));
 p.update(.125,aim,.3);assert.equal(p.snapshot.active,0);assert.equal(light.intensity,0);assert.equal(light.parent,p.lightRoot);p.dispose();
});
test('Lighting 3.3/3.4/4.1: 128 effects bounded to eight reusable lights, refill and reset',()=>{
 const p=new ParticleInteraction();p.configure({...p.settings,maxCount:128,speed:1,lifetime:10});
 for(let i=0;i<128;i++)assert.equal(p.fire(new Vector3(0,1,i===0?5:0),aim),true);
 assert.equal(lamps(p).length,8);const initial=new Set(lamps(p));assert.ok(lamps(p).every(l=>!l.castShadow));
 p.update(0,new Vector3(0,1,5),.01);p.update(.25,new Vector3(0,1,5),.01);
 assert.equal(p.snapshot.active,127);assert.equal(lamps(p).length,8);assert.ok(lamps(p).every(l=>initial.has(l)));
 p.configure({...p.settings,maxCount:1});assert.equal(p.snapshot.active,1);assert.ok(lamps(p).length<=1);
 p.clear();assert.equal(lamps(p).length,0);assert.equal(p.lightRoot.children.length,8);
 for(let cycle=0;cycle<4;cycle++){
  p.configure({...p.settings,maxCount:128,speed:30,lifetime:3});for(let i=0;i<128;i++)p.fire(origin,aim);
  assert.equal(lamps(p).length,8);p.update(1,aim,.3);p.update(.25,aim,.3);assert.equal(p.snapshot.active,0);
 }
 p.configure({...p.settings,lifetime:.1});p.fire(origin,aim);p.update(1,new Vector3(100,1,0),.3);assert.equal(lamps(p).length,0);
 let disposed=0;for(const l of p.lightRoot.children)l.addEventListener('dispose',()=>disposed++);p.dispose();p.dispose();assert.equal(disposed,8);
});
test('Lighting 2.2/3.5: invalid settings atomically rejected and disabled shots consume no lights',()=>{
 const p=new ParticleInteraction(),s=p.settings;
 for(const patch of [{lightEnabled:0},{lightColor:'red'},{lightIntensity:NaN},{lightIntensity:-1},{lightRadius:0},{lightRadius:31},{lightDecay:Infinity},{lightDecay:5}]){
  assert.equal(p.configure({...s,...patch}),false);assert.deepEqual(p.settings,s);
 }
 p.configure({...s,lightEnabled:false});p.fire(origin,aim);assert.equal(lamps(p).length,0);p.dispose();
});
