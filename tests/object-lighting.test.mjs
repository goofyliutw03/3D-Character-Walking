import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Vector3,PointLight} from 'three';
import {ObjectLightPool} from '../src/lighting/ObjectLightPool.ts';
const settings={enabled:true,color:'#ff8800',intensity:20,radius:5,decay:2};
test('Lighting 2.1/2.2: local offset follows parent transforms and copies input',()=>{
 const pool=new ObjectLightPool(2),parent=new Group(),offset=new Vector3(1,2,3);
 const h=pool.attach(parent,settings,offset);assert.ok(h);offset.set(9,9,9);
 parent.position.set(3,4,5);parent.rotation.y=Math.PI/2;parent.scale.setScalar(2);parent.updateMatrixWorld(true);
 const light=parent.children.find(x=>x instanceof PointLight);
 assert.ok(light.getWorldPosition(new Vector3()).distanceTo(parent.localToWorld(new Vector3(1,2,3)))<1e-8);
 assert.equal(light.castShadow,false);assert.equal(light.intensity,20);
 for(const patch of [{intensity:NaN},{radius:0},{decay:Infinity},{color:'red'},{enabled:1},{intensity:201}]){
  assert.equal(pool.update(h,patch),false);assert.equal(light.intensity,20);assert.equal(light.distance,5);
 }
 assert.equal(pool.update(h,{enabled:false,color:'#00ff00',radius:8}),true);assert.equal(light.intensity,0);assert.equal(light.distance,8);
 pool.update(h,{enabled:true});assert.equal(light.intensity,20);pool.dispose();
});
test('Lighting 2.2/2.3/4.1: bounded leases, stale/cross-pool handles, reuse and disposal',()=>{
 const p=new ObjectLightPool(1),q=new ObjectLightPool(1),parent=new Group();
 assert.throws(()=>new ObjectLightPool(0),RangeError);
 assert.equal(p.attach(parent,{...settings,color:'bad'}),null);
 assert.equal(p.attach(parent,settings,new Vector3(NaN,0,0)),null);assert.equal(p.activeCount,0);
 const h=p.attach(parent,settings),light=parent.children[0];assert.ok(h);assert.equal(p.attach(parent,settings),null);
 assert.equal(q.update(h,{intensity:1}),false);assert.equal(q.remove(h),false);
 assert.equal(p.remove(h),true);assert.equal(p.remove(h),false);assert.equal(light.intensity,0);assert.equal(light.parent,p.root);
 const next=p.attach(parent,settings);assert.equal(parent.children[0],light);assert.equal(p.update(h,{intensity:1}),false);
 let disposed=0;light.addEventListener('dispose',()=>disposed++);p.dispose();p.dispose();
 assert.equal(disposed,1);assert.equal(parent.children.length,0);assert.equal(p.activeCount,0);assert.equal(p.update(next,{}),false);assert.equal(p.attach(parent,settings),null);q.dispose();
});
