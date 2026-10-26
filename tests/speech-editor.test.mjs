import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SpeechEditor } from '../src/ui/SpeechEditor.ts';
import { ExpressionManager } from '../src/expression/ExpressionManager.ts';

test('expressions 2.1,2.4,5.2: composition draft waits, commits normalize, ordinary input is quiet, abort cleans up', () => {
  const input = Object.assign(new EventTarget(), { value: '' });
  const state = new ExpressionManager();
  const events = new AbortController();
  const announcements = [];
  new SpeechEditor(input, (text, announce) => {
    state.setSpeech(text); input.value = state.snapshot.speech;
    if (announce) announcements.push(state.snapshot.speech);
  }, events.signal);
  input.dispatchEvent(new Event('compositionstart'));
  input.value = '中'.repeat(161);
  input.dispatchEvent(Object.assign(new Event('input'), { isComposing: true }));
  input.dispatchEvent(new Event('blur'));
  assert.equal(state.snapshot.speech, '');
  assert.equal(input.value.length, 161);
  assert.equal(announcements.length, 0);
  input.dispatchEvent(new Event('compositionend'));
  assert.equal(state.snapshot.speech.length, 160);
  assert.equal(input.value.length, 160);
  assert.equal(announcements.length, 1);
  input.value = 'w asd <b>你好</b>';
  input.dispatchEvent(new Event('input'));
  assert.equal(state.snapshot.speech, input.value);
  assert.equal(announcements.length, 1);
  input.dispatchEvent(new Event('blur'));
  assert.equal(announcements.at(-1), input.value);
  events.abort();
  input.value = 'after disposal'; input.dispatchEvent(new Event('input'));
  assert.notEqual(state.snapshot.speech, input.value);
});
