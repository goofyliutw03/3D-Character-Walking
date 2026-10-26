import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CharacterAssets } from '../src/character/CharacterAssets.ts';
import { assetCatalog } from '../src/character/assetCatalog.ts';

const setup = () => {
  const pending=[], states=[], swaps=[], released=[], disposed=[];
  const assets=new CharacterAssets({
    load: url => new Promise((resolve,reject)=>pending.push({url,resolve,reject})),
    create: (data, definition) => {if(data.invalid)throw Error('Missing Jump');return {definition,dispose:()=>disposed.push(data.id)};},
    release: data=>released.push(data.id), onState: state=>states.push(state), onSwap: model=>swaps.push(model),
  });
  return {assets,pending,states,swaps,released,disposed};
};
test('rigged 2.1,2.3: latest request wins; stale model releases and never publishes ready', async()=>{
  const s=setup();
  const a=s.assets.select(assetCatalog.man), b=s.assets.select(assetCatalog.woman);
  s.pending[1].resolve({id:'woman'});await b;
  assert.equal(s.assets.current.definition,assetCatalog.woman);
  s.pending[0].resolve({id:'man'});await a;
  assert.deepEqual(s.released,['man']);
  assert.equal(s.states.filter(x=>x.phase==='ready').length,1);
  s.assets.dispose();s.assets.dispose();
  assert.deepEqual(s.disposed,['woman']);
});
test('rigged 2.2–2.4: reject/retry, invalid models and pending dispose are bounded',async()=>{
  const s=setup();
  const first=s.assets.select(assetCatalog.child);
  s.pending[0].reject(Error('404'));await first;
  assert.equal(s.states.at(-1).phase,'error');
  assert.match(s.states.at(-1).recovery,/Retry/);
  const retry=s.assets.retry();s.pending[1].resolve({id:'child'});await retry;
  assert.equal(s.states.at(-1).phase,'ready');
  const third=s.assets.select(assetCatalog.man);
  assert.deepEqual(s.disposed,['child']);
  s.pending[2].resolve({id:'invalid',invalid:true});await third;
  assert.equal(s.states.at(-1).phase,'error');assert.deepEqual(s.released,['invalid']);
  const last=s.assets.select(assetCatalog.woman);s.assets.dispose();
  s.pending[3].resolve({id:'late'});await last;
  assert.deepEqual(s.released,['invalid','late']);assert.equal(s.assets.current,null);
  const count=s.pending.length;await s.assets.retry();assert.equal(s.pending.length,count);
});
