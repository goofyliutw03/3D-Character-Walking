import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProfileHistory, parseProfiles } from '../src/settings/PanelProfiles.ts';
test('temp survives clean selection, changes autosave and eleven blocks bounded',()=>{
 const h=new ProfileHistory(); h.change({v:1}); h.save('city',{v:1},1); h.change({v:2});
 h.select('city00',{v:2}); h.select('city00',{v:1}); assert.deepEqual(h.data.temp.settings,{v:2});
 h.change({v:3}); assert.deepEqual(h.data.temp.settings,{v:3});
 for(let i=0;i<101;i++)h.save('city',{v:i},i+2);
 assert.equal(h.data.profiles.length,10); assert.equal(h.data.profiles.at(-1).name,'city01');
 assert.equal(h.data.profiles[0].settings.v,91);
 assert.ok(parseProfiles(JSON.stringify(h.data),s=>typeof s?.v==='number'));
 assert.throws(()=>parseProfiles('{',()=>true));
 assert.throws(()=>parseProfiles('{"version":2}',()=>true));
});
import { ProfileStorage } from '../src/settings/ProfileStorage.ts';
test('storage fallback, refusal and serialized writes',async()=>{
 const order=[]; let active=0;
 const storage=new ProfileStorage([async()=>{throw Error('insecure')},async()=>({name:'IDB',read:async()=>null,write:async text=>{assert.equal(active++,0);await new Promise(r=>setTimeout(r,3));order.push(text);active--;if(text==='bad')throw Error('quota');}})]);
 assert.equal(await storage.read(),null);assert.equal(storage.mode,'IDB');
 const writes=['one','bad','three'].map(t=>storage.write(t));
 const outcomes=await Promise.allSettled(writes);
 assert.deepEqual(order,['one','bad','three']);assert.equal(outcomes[1].status,'rejected');assert.equal(outcomes[2].status,'fulfilled');
 const denied=new ProfileStorage([async()=>{throw Error('denied')}]);
 await assert.rejects(denied.read());await assert.rejects(denied.write('{}'));
});
import { validViewerSettings } from '../src/settings/validateViewerSettings.ts';
const citySettings=()=>({environment:'city',scenes:{city:{time:'day',solar:{enabled:false,hour:12,season:'spring',latitude:25},lights:[],headlamp:null}},variant:'man',camera:'overview',following:false,obstruction:'zoom',groundPenetration:true,sensitivity:{thirdHorizontal:1,thirdVertical:1,firstHorizontal:1,firstVertical:1},walkSpeed:1.8,expression:{emotion:'none',speech:''},traffic:{enabled:false,paused:false,npcCount:6,vehicleCount:4,lod:true},particles:{color:'#66ddff',speed:8,size:.14,lifetime:3,maxCount:32,lightEnabled:true,lightColor:'#66ddff',lightIntensity:20,lightRadius:5,lightDecay:2},water:{enabled:true,paused:false,waveStrength:1,flowSpeed:1,quality:'standard'},waterLens:true,shadows:true,lamps:[2],lampDetection:{enabled:false,radius:10},inspector:{enabled:false,pattern:'',ranges:'',uncheckedPaths:[],expandedPaths:{}}});
test('runtime contract rejects corrupt or out of range settings before applying',()=>{
 assert.equal(validViewerSettings(citySettings()),true);
 for(const mutate of [s=>s.walkSpeed=NaN,s=>s.sensitivity.firstVertical=0,s=>s.traffic.npcCount=25,s=>s.particles.lightIntensity=201,s=>s.water.quality='ultra',s=>s.scenes.city.solar.hour=24,s=>s.lampDetection.radius=-1,s=>s.expression.speech='x'.repeat(161),s=>delete s.scenes.city,s=>s.following=1]){
  const s=citySettings();mutate(s);assert.equal(validViewerSettings(s),false);
 }
 const s=citySettings(); s.scenes.city.solar.latitude=-90;assert.equal(validViewerSettings(s),true);
});

test('terrain profiles roundtrip with bounded settings while original city profiles remain valid',()=>{
 const s=citySettings(); s.environment='terrain';
 s.scenes.terrain={...structuredClone(s.scenes.city),terrain:{quality:'low',wind:false}};
 assert.equal(validViewerSettings(s),true);
 const h=new ProfileHistory(); assert.equal(h.save('terrain',s,1),'terrain00');
 assert.ok(parseProfiles(JSON.stringify(h.data),validViewerSettings));
 assert.ok(validViewerSettings(citySettings()));
 for(const patch of [{quality:'ultra'},{wind:1}]) {
  const bad=structuredClone(s);Object.assign(bad.scenes.terrain.terrain,patch);
  assert.equal(validViewerSettings(bad),false);
 }
});
test('OPFS refusal writes fallback and newer fallback wins on reload',async()=>{
 let primary=null,secondary=null;const factories=[async()=>({name:'OPFS test',read:async()=>primary,write:async()=>{throw Error('denied')}}),async()=>({name:'IndexedDB test',read:async()=>secondary,write:async t=>{secondary=t;}})];
 const store=new ProfileStorage(factories);await store.read();await store.write('{"temp":{"createdAt":2},"profiles":[]}');assert.match(store.mode,/IndexedDB/);
 primary='{"temp":{"createdAt":1},"profiles":[]}';const reloaded=new ProfileStorage(factories);assert.equal(await reloaded.read(),secondary);
 primary='{broken';const damaged=new ProfileStorage(factories);assert.equal(await damaged.read(),'{broken');
});
