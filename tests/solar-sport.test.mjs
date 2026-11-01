import test from 'node:test';
import assert from 'node:assert/strict';
import { solarPosition, dialHour, cameraHeading } from '../src/scene/SolarPosition.ts';
import { CityScene } from '../src/scene/CityScene.ts';
test('Solar 1/3: east sunrise, west sunset, midnight wrap and cardinal dial',()=>{
 assert.ok(solarPosition(6,'spring',25).x>.9);
 assert.ok(solarPosition(18,'spring',25).x<-.9);
 assert.equal(dialHour(0,-1),0);assert.equal(dialHour(1,0),6);
 assert.equal(dialHour(0,1),12);assert.equal(dialHour(-1,0),18);
 assert.ok(dialHour(-.001,-1)>23.9);
 assert.ok(solarPosition(12,'summer',25).elevation>solarPosition(12,'winter',25).elevation);
 assert.ok(solarPosition(5.5,'summer',25).elevation>0);
 assert.ok(solarPosition(5.5,'winter',25).elevation<0);
 for(const lat of [-90,0,25,90])for(const season of ['spring','summer','autumn','winter'])for(let h=0;h<24;h++){
  const p=solarPosition(h,season,lat);assert.ok(Number.isFinite(p.elevation));assert.ok(Math.abs(Math.hypot(p.x,p.y,p.z)-1)<1e-10);
 }
});
test('Solar 2: actual view heading and vertical fallback',()=>{
 assert.equal(cameraHeading(0,-1,45),0);assert.equal(cameraHeading(1,0,45),90);
 assert.equal(cameraHeading(0,1,45),180);assert.equal(cameraHeading(-1,0,45),270);
 assert.equal(cameraHeading(0,0,45),45);
});
test('Solar 4: atomic settings, night lamps, presets, snapshots and disposal',()=>{
 const city=new CityScene();const before=city.getSolarSettings();
 for(const patch of [{hour:NaN},{hour:24},{hour:-1},{latitude:91},{season:'bad'},{enabled:1},{hour:6,latitude:Infinity}]){
  assert.equal(city.configureSolar(patch),false);assert.deepEqual(city.getSolarSettings(),before);
 }
 assert.equal(city.configureSolar({enabled:true,hour:0}),true);assert.equal(city.timeOfDay,'night');
 const lamps=[];city.scene.traverse(o=>{if(o.isPointLight)lamps.push(o)});
 assert.ok(lamps.every(l=>l.intensity>0));const sun=city.scene.children.find(o=>o.isDirectionalLight);assert.equal(sun.intensity,0);
 city.configureSolar({hour:12});assert.equal(city.timeOfDay,'day');assert.ok(sun.intensity>0);assert.ok(lamps.every(l=>l.intensity===0));
 const snap=city.getSolarSettings();snap.hour=0;assert.equal(city.getSolarSettings().hour,12);
 city.setTimeOfDay('evening');assert.equal(city.getSolarSettings().enabled,false);assert.equal(city.timeOfDay,'evening');
 city.configureSolar({enabled:true,hour:0});city.configureSolar({enabled:false});assert.equal(city.timeOfDay,'evening');
 city.dispose();assert.equal(city.configureSolar({enabled:true}),false);
});


import { SolarControls, solarControlsContent } from '../src/ui/SolarControls.ts';
test('Solar 1/2/4: real control handlers capture/cancel, keyboard wrap, atomic input and dispose',()=>{
 class Element extends EventTarget {
  value=''; checked=false; disabled=false; style={}; attrs={}; validity={valid:true}; captures=new Set();
  setAttribute(k,v){this.attrs[k]=v} getBoundingClientRect(){return {left:0,top:0,width:200,height:200}}
  focus(){} setPointerCapture(id){this.captures.add(id)} hasPointerCapture(id){return this.captures.has(id)} releasePointerCapture(id){this.captures.delete(id)}
 }
 const ids=['solar-dial','solar-enabled','solar-fields','solar-time','solar-season','solar-latitude','solar-hand','solar-compass-card','solar-heading','solar-elevation'];
 const nodes=Object.fromEntries(ids.map(id=>['#'+id,new Element()]));const output=new Element();nodes['#solar-dial'].parentElement={querySelector:()=>output};
 const host={querySelector:id=>nodes[id]};let state={enabled:false,hour:12,season:'spring',latitude:25},report=null,calls=0;
 const app={getSolarSettings:()=>({...state}),configureSolar:patch=>{const next={...state,...patch};if(!Number.isFinite(next.hour)||!Number.isFinite(next.latitude)||Math.abs(next.latitude)>90)return false;state=next;calls++;return true},setSolarReport:callback=>{report=callback}};
 const controls=new SolarControls(host,app,()=>{});
 const fire=(id,type,props={})=>{const event=new Event(type,{cancelable:true});for(const [k,v]of Object.entries(props))Object.defineProperty(event,k,{value:v});nodes['#'+id].dispatchEvent(event)};
 assert.equal(nodes['#solar-fields'].disabled,true);
 nodes['#solar-enabled'].checked=true;fire('solar-enabled','change');assert.equal(nodes['#solar-fields'].disabled,false);
 fire('solar-dial','keydown',{key:'Home'});fire('solar-dial','keydown',{key:'ArrowLeft'});assert.equal(state.hour,23.8);
 fire('solar-dial','keydown',{key:'ArrowRight'});assert.equal(state.hour,0);
 fire('solar-dial','pointerdown',{pointerId:1,isPrimary:true,button:0,clientX:200,clientY:100});assert.equal(state.hour,6);assert.ok(nodes['#solar-dial'].hasPointerCapture(1));
 fire('solar-dial','pointermove',{pointerId:2,clientX:100,clientY:200});assert.equal(state.hour,6);
 fire('solar-dial','pointercancel',{pointerId:1});assert.equal(nodes['#solar-dial'].captures.size,0);
 fire('solar-dial','pointermove',{pointerId:1,clientX:100,clientY:200});assert.equal(state.hour,6);
 fire('solar-dial','pointerdown',{pointerId:3,isPrimary:true,button:0,clientX:100,clientY:200});assert.equal(state.hour,12);
 fire('solar-dial','lostpointercapture',{pointerId:3});assert.equal(nodes['#solar-dial'].captures.size,0);
 nodes['#solar-latitude'].value='-25';nodes['#solar-latitude'].valueAsNumber=-25;fire('solar-latitude','input');assert.equal(state.latitude,-25);
 nodes['#solar-latitude'].value='';fire('solar-latitude','change');assert.equal(state.latitude,-25);
 report(90,30);assert.equal(nodes['#solar-compass-card'].style.transform,'rotate(-90deg)');
 const count=calls;controls.dispose();assert.equal(report,null);fire('solar-dial','keydown',{key:'Home'});assert.equal(calls,count);
 assert.equal((solarControlsContent.match(/<line /g)||[]).length,120);assert.equal((solarControlsContent.match(/<text /g)||[]).length,24);
});
