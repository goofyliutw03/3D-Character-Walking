import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LoadingPanel } from '../src/ui/LoadingPanel.ts';
import { presentLoading } from '../src/ui/LoadingFeedback.ts';

const node = () => ({ hidden: false, textContent: '', attributes: {}, dataset: {},
  setAttribute(k, v) { this.attributes[k] = v; }, removeAttribute(k) { delete this.attributes[k]; } });
test('initialization panel: unknown/known, error/retry and ready/compact follow actual state', () => {
  const elements = Object.fromEntries(['progress', '[data-loading-message]', '[data-loading-amount]'].map(k => [k, node()]));
  const root = Object.assign(node(), { querySelector: key => elements[key] });
  const panel = new LoadingPanel(root);
  const loading = { phase: 'loading', stage: 'download', message: 'Downloading character…' };
  panel.update(loading);
  assert.equal(root.hidden, false);
  assert.equal(elements.progress.attributes.value, undefined);
  assert.equal(elements['[data-loading-amount]'].textContent, 'Working…');
  panel.update({ ...loading, download: { loaded: 25, total: 100 } });
  assert.equal(elements.progress.attributes.value, '25');
  assert.equal(elements['[data-loading-amount]'].textContent, 'Download · 25%');
  panel.update({ ...loading, download: { loaded: 25 } });
  assert.equal(elements.progress.attributes.value, undefined);
  panel.update({ phase: 'error', message: '<b>Failed</b>', recovery: 'Retry' });
  assert.equal(root.dataset.state, 'error');
  assert.equal(elements.progress.hidden, true);
  assert.equal(elements['[data-loading-message]'].textContent, '<b>Failed</b> Retry');
  panel.update(loading);
  assert.equal(elements.progress.hidden, false);
  assert.equal(root.dataset.state, 'loading');
  panel.update({ phase: 'ready', message: 'Ready' });
  assert.equal(root.hidden, true);
  panel.update(loading);
  assert.equal(root.dataset.compact, 'true');
  assert.equal(root.hidden, false);
});

test('initialization 3.2: byte events do not repeatedly rewrite live status text', () => {
  let writes = 0, text = '';
  const status = { setAttribute() {}, get textContent() { return text; }, set textContent(value) { text = value; writes++; } };
  for (const loaded of [0, 20, 50, 100]) {
    presentLoading(status, { phase: 'loading', stage: 'download', message: 'Downloading character…', download: { loaded, total: 100 } });
  }
  assert.equal(writes, 1);
});
