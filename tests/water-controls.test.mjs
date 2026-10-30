import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

test('water controls 2.1: accessible controls stay inside Scene display with correct initial ranges',()=>{
  const source=readFileSync(new URL('../src/ui/controlPanelContent.ts',import.meta.url),'utf8');
  const scene=source.slice(source.indexOf("id: 'scene'"));
  assert.match(scene,/id: 'water-feature'/);
  for(const id of ['water-enabled','water-paused','water-quality','water-wave','water-flow']) {
    assert.match(scene,new RegExp(`for="${id}"`)); assert.match(scene,new RegExp(`id="${id}"`));
    assert.equal((source.match(new RegExp(`id="${id}"`,'g'))??[]).length,1);
  }
  assert.match(scene,/id="water-wave"[^>]*min="0"[^>]*max="2"/);
  assert.match(scene,/id="water-flow"[^>]*min="0"[^>]*max="3"/);
});
