import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ExpressionManager, emotions } from '../src/expression/ExpressionManager.ts';

test('expressions 1.1–1.3: default, all emotions, invalid values and isolated snapshot', () => {
  const state = new ExpressionManager();
  assert.deepEqual(state.snapshot, { emotion: 'none', speech: '' });
  assert.deepEqual(Object.keys(emotions), ['none', 'happy', 'sad', 'angry', 'surprised']);
  for (const emotion of Object.keys(emotions)) {
    state.setEmotion(emotion);
    assert.equal(state.snapshot.emotion, emotion);
  }
  state.setEmotion('unknown');
  assert.equal(state.snapshot.emotion, 'surprised');
  const snapshot = state.snapshot;
  snapshot.emotion = 'none';
  assert.equal(state.snapshot.emotion, 'surprised');
});

test('expressions 2.1–2.3: Unicode limit preserves literal, multiline text and emotion', () => {
  const state = new ExpressionManager();
  state.setEmotion('happy');
  state.setSpeech('🙂'.repeat(159) + '好尾');
  assert.equal(Array.from(state.snapshot.speech).length, 160);
  assert.equal(state.snapshot.speech.endsWith('好'), true);
  const text = '<img src=x onerror=alert(1)>\nHello & goodbye';
  state.setSpeech(text);
  assert.equal(state.snapshot.speech, text);
  state.setSpeech('  \n ');
  assert.equal(state.snapshot.speech, '  \n ');
  state.setSpeech('');
  assert.deepEqual(state.snapshot, { emotion: 'happy', speech: '' });
});
