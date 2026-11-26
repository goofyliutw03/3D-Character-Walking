import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PathTour, parseWaypoints } from '../src/navigation/PathTour.ts';
import { CharacterController } from '../src/character/CharacterController.ts';
import { isWalkable } from '../src/navigation/DestinationNavigation.ts';
const world = { bounds: {minX:-8,maxX:8,minZ:-12,maxZ:12}, obstacles:[{minX:-1,maxX:1,minZ:-1,maxZ:1}], groundHeight:()=>0 };
const route = [{x:0,z:-5},{x:4,z:5}];
const idle = {x:0,z:0,run:false,jump:false};
function fixture(speed=4, loop=false) {
 const controller = new CharacterController(world), tour = new PathTour(world);
 let state = controller.update(0,idle);
 assert.equal(tour.start(state,route,loop,speed),true);
 return {controller,tour,get state(){return state},tick(dt=1/60){state=controller.update(dt,tour.sample(state,dt));return state;}};
}
test('tour: real collision controller detours through all points at low/walk/run speeds',()=>{
 for(const speed of [.5,1.8,4]) {
  const f=fixture(speed); const visited=[];
  for(let i=0;i<12000&&f.tour.snapshot.status==='running';i++) visited.push(f.tick(1/30));
  assert.equal(f.tour.snapshot.status,'completed');
  assert.ok(Math.hypot(f.state.x-4,f.state.z-5)<=.08);
  assert.ok(visited.every(p=>isWalkable(p,world)));
  assert.ok(visited.some(p=>Math.abs(p.speed-speed)<.01));
  assert.ok(visited.every(p=>p.speed<=speed+.001));
 }
});
test('tour: pause stays still, resume replans and cancel releases ownership',()=>{
 const f=fixture(); for(let i=0;i<30;i++)f.tick();
 f.tour.pause();const before={...f.state};
 for(let i=0;i<200;i++)f.tick();
 assert.equal(f.state.x,before.x);assert.equal(f.state.z,before.z);
 assert.equal(f.tour.resume(f.state),true);
 for(let i=0;i<2000&&f.tour.snapshot.status==='running';i++)f.tick();
 assert.equal(f.tour.snapshot.status,'completed');
 f.tour.cancel();assert.equal(f.tour.snapshot.status,'idle');assert.equal(f.tour.target,undefined);
});
test('tour: loop revisits first waypoint and degenerate loop remains bounded',()=>{
 const f=fixture(4,true);let second=false,looped=false;
 for(let i=0;i<2000;i++){f.tick();if(f.tour.snapshot.index===1)second=true;if(second&&f.tour.snapshot.index===0){looped=true;break;}}
 assert.ok(looped);assert.equal(f.tour.snapshot.status,'running');
 assert.equal(f.tour.start(f.state,[{x:f.state.x,z:f.state.z}],true,4),true);
 for(let i=0;i<100;i++)f.tick();assert.equal(f.tour.snapshot.status,'running');
});
test('tour: invalid routes/speeds reject atomically, stalled route stops',()=>{
 const f=fixture();
 for(const r of [[],[{x:NaN,z:2}],[{x:0,z:0}],Array(33).fill({x:4,z:5})]){
  assert.equal(f.tour.start(f.state,r,false,4),false);assert.equal(f.tour.snapshot.status,'blocked');
 }
 for(const speed of [0,5,NaN])assert.equal(f.tour.start(f.state,route,false,speed),false);
 assert.equal(f.tour.start(f.state,route,false,4),true);
 for(let i=0;i<120;i++)f.tour.sample(f.state,1/60);
 assert.equal(f.tour.snapshot.status,'blocked');
 assert.equal(f.tour.resume(f.state),false);
 assert.deepEqual(parseWaypoints('0, -5\n4, 5'),route);
 for(const text of ['', '1,2,3','Infinity,2','1,','1 2'])assert.equal(parseWaypoints(text),undefined);
});

test('tour: shipped demo route completes through the real city without entering fixtures',async()=>{
 const {CityScene}=await import('../src/scene/CityScene.ts');
 const {tourControlsContent}=await import('../src/ui/TourControls.ts');
 const route=parseWaypoints(tourControlsContent.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)[1]);
 const city=new CityScene();
 try{
  const controller=new CharacterController(city.walkableWorld),tour=new PathTour(city.walkableWorld);
  let state=controller.update(0,idle);
  assert.equal(tour.start(state,route,false,4),true);
  const reached=new Set();
  for(let i=0;i<12000&&tour.snapshot.status==='running';i++){
   reached.add(tour.snapshot.index);state=controller.update(1/60,tour.sample(state,1/60));
   assert.ok(isWalkable(state,city.walkableWorld));
  }
  assert.equal(tour.snapshot.status,'completed');assert.equal(reached.size,route.length);
 }finally{city.dispose();}
});
