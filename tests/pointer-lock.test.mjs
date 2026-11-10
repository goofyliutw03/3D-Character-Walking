import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AutoRunControls } from '../src/input/AutoRunControls.ts';
test('four sensitivity axes and continuous locked steering preserve limits',()=>{
 const a=new AutoRunControls();
 assert.equal(a.configureSensitivity({thirdHorizontal:2,thirdVertical:.5,firstHorizontal:3,firstVertical:4}),true);
 a.move(100,20,1000,false,1,'third-person',true);
 assert.ok(Math.abs(a.heading+Math.PI*.4)<1e-9);
 assert.ok(Math.abs(a.pitch+Math.PI*.02)<1e-9);
 a.move(1000,0,1000,false,2,'third-person',true);
 assert.ok(a.heading < -Math.PI*4);
 a.reset(); a.move(10,10,1000,true,3,'first-person',true);
 assert.ok(Math.abs(a.yaw+Math.PI*.06)<1e-9);
 assert.ok(Math.abs(a.pitch+Math.PI*.08)<1e-9);
 assert.equal(a.configureSensitivity({firstVertical:0}),false);
 assert.equal(a.configureSensitivity({firstVertical:NaN}),false);
});
import { CameraInputManager } from '../src/input/CameraInputManager.ts';
test('pointer lock uses relative motion and handles Escape, hidden, late acquisition and rejection',async t=>{
 const old=globalThis.window, win=new EventTarget(),doc=new EventTarget(),canvas=new EventTarget();globalThis.window=win;
 canvas.ownerDocument=doc;canvas.focus=()=>doc.activeElement=canvas;
 let acquire;canvas.requestPointerLock=()=>{acquire=()=>{doc.pointerLockElement=canvas;doc.dispatchEvent(new Event('pointerlockchange'));};return Promise.resolve();};
 doc.exitPointerLock=()=>{doc.pointerLockElement=null;doc.dispatchEvent(new Event('pointerlockchange'));};
 let pauses=0;const moves=[];let eligible=true;
 const input=new CameraInputManager(canvas,{mode:()=> 'running-orbit',lockEnabled:()=>eligible,clearGesture(){},wheelEnabled:()=>true,reverseEnabled:()=>true,move:(...v)=>moves.push(v),wheel(){},reverse(){},reset(){},suspend(){pauses++;},toggle(){}});
 t.after(()=>{input.dispose();globalThis.window=old;});
 input.requestLock();acquire();assert.equal(input.locked,true);
 doc.dispatchEvent(Object.assign(new Event('mousemove'),{movementX:75,movementY:-5,ctrlKey:true}));assert.deepEqual(moves[0].slice(0,3),[75,-5,true]);
 doc.pointerLockElement=null;doc.dispatchEvent(new Event('pointerlockchange'));assert.equal(pauses,1);
 input.requestLock();input.releaseLock();acquire();assert.equal(input.locked,false);
 input.requestLock();acquire();doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(input.locked,false);assert.equal(pauses,2);
 doc.hidden=false;canvas.requestPointerLock=()=>Promise.reject(Error('denied'));input.requestLock();await Promise.resolve();await Promise.resolve();assert.match(input.lockStatus,/denied/);
 eligible=false;input.requestLock();assert.equal(input.locked,false);
});
test('unlocked gestures retain 180 degree limit and first-person inspection keeps angle bounds',()=>{
 const a=new AutoRunControls();a.configureSensitivity({thirdHorizontal:5,firstHorizontal:5,firstVertical:5});
 a.move(10000,0,1000,false,1);assert.ok(Math.abs(a.heading+Math.PI)<1e-9);
 a.zoom=.25;a.wheel(-1,'third-person');a.move(10000,10000,1000,false,2,'first-person',true);
 assert.ok(Math.abs(a.yaw+80*Math.PI/180)<1e-9);assert.ok(Math.abs(a.pitch+70*Math.PI/180)<1e-9);
});
test('coarse pointer never requests lock; pending acquisition after dispose is released',async t=>{
 const old=globalThis.window,win=new EventTarget(),doc=new EventTarget(),canvas=new EventTarget();globalThis.window=win;win.matchMedia=()=>({matches:true});canvas.ownerDocument=doc;canvas.focus=()=>doc.activeElement=canvas;
 let requests=0;canvas.requestPointerLock=()=>{requests++;};doc.exitPointerLock=()=>{doc.pointerLockElement=null;doc.dispatchEvent(new Event('pointerlockchange'));};
 const input=new CameraInputManager(canvas,{mode:()=> 'running-orbit',lockEnabled:()=>true,clearGesture(){},wheelEnabled:()=>true,reverseEnabled:()=>true,move(){},wheel(){},reverse(){},reset(){},suspend(){},toggle(){}});
 t.after(()=>{globalThis.window=old;});input.requestLock();assert.equal(requests,0);win.matchMedia=()=>({matches:false});input.requestLock();assert.equal(requests,1);input.dispose();doc.pointerLockElement=canvas;doc.dispatchEvent(new Event('pointerlockchange'));assert.equal(doc.pointerLockElement,null);
});
