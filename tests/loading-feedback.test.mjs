import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeLoading, describeDownload, presentLoading } from '../src/ui/LoadingFeedback.ts';

test('initialization 1.3,1.4: only valid byte totals produce a download percentage', () => {
  const state = download => ({ phase: 'loading', message: 'Downloading character…', download });
  assert.equal(describeDownload(state({ loaded: 25, total: 100 })), 25);
  assert.equal(describeDownload(state({ loaded: 100, total: 100 })), 100);
  assert.equal(describeDownload(state({ loaded: 0, total: 100 })), 0);
  for (const download of [undefined, { loaded: 25 }, { loaded: 25, total: 0 }, { loaded: -1, total: 100 }, { loaded: NaN, total: 100 }, { loaded: 1, total: Infinity }, { loaded: 101, total: 100 }]) {
    assert.equal(describeDownload(state(download)), null);
  }
  assert.equal(describeDownload({ phase: 'ready', message: 'Ready' }), null);
});

test('expressions 4.1–4.3,5.2: loading, actual ready and literal errors have accessible semantics', () => {
  assert.deepEqual(describeLoading({ phase: 'loading', message: 'Loading character…' }), { text: 'Loading character…', busy: true, error: false });
  assert.deepEqual(describeLoading({ phase: 'ready', message: 'Procedural prototype ready.' }), { text: 'Procedural prototype ready.', busy: false, error: false });
  const state = { phase: 'error', message: '<b>Failed</b>', recovery: 'Try reloading.' };
  assert.deepEqual(describeLoading(state), { text: '<b>Failed</b> Try reloading.', busy: false, error: true });
  const attributes = {};
  const element = { textContent: '', setAttribute: (k,v) => { attributes[k] = v; } };
  presentLoading(element, state);
  assert.equal(element.textContent, '<b>Failed</b> Try reloading.');
  assert.equal(attributes.role, 'alert');
  assert.equal(attributes['aria-busy'], 'false');
  presentLoading(element, { phase: 'loading', message: 'Loading…' });
  assert.equal(attributes.role, 'status');
  assert.equal(attributes['aria-busy'], 'true');
});
