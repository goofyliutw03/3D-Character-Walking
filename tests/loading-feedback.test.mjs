import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeLoading, presentLoading } from '../src/ui/LoadingFeedback.ts';

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
