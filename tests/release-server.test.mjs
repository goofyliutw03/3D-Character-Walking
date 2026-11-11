import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createReleaseServer } from '../scripts/release-server.mjs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('Release server serves entry/assets, HEAD, missing paths and rejects mutations', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'release-server-'));
  await writeFile(path.join(root, 'index.html'), '<h1>Release</h1>');
  await writeFile(path.join(root, 'app.js'), 'export {};');
  const server = await createReleaseServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(await (await fetch(url)).text(), '<h1>Release</h1>');
    assert.equal((await fetch(url + '/app.js')).headers.get('content-type'), 'text/javascript');
    assert.equal(await (await fetch(url, { method: 'HEAD' })).text(), '');
    assert.equal((await fetch(url + '/missing')).status, 404);
    assert.equal((await fetch(url + '/%')).status, 404);
    assert.equal((await fetch(url + '/..%5csecret')).status, 404);
    assert.equal((await fetch(url, { method: 'POST' })).status, 405);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});

test('owned server rejects an occupied port and exits when parent stdin closes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'release-lifecycle-'));
  await writeFile(path.join(root, 'index.html'), 'owned');
  const blocker = await createReleaseServer(root);
  await new Promise(resolve => blocker.listen(0, '127.0.0.1', resolve));
  const port = blocker.address().port;
  const start = () => spawn(process.execPath, ['scripts/release-server.mjs', root, String(port)], { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
  let child;
  try {
    child = start();
    let errors = '';
    child.stderr.on('data', data => errors += data);
    assert.equal((await once(child, 'exit'))[0], 1);
    assert.match(errors, /EADDRINUSE/);
    assert.equal(await (await fetch(`http://127.0.0.1:${port}`)).text(), 'owned');
    await new Promise(resolve => blocker.close(resolve));
    child = start();
    // Wait for this child's server; a bounded retry allows process startup.
    let ready = false;
    for (let i = 0; i < 50; i++) {
      try { await fetch(`http://127.0.0.1:${port}`); ready = true; break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    assert.equal(ready, true);
    const exited = once(child, 'exit');
    child.stdin.end();
    const timeout = setTimeout(() => child.kill(), 5000);
    try { assert.equal((await exited)[0], 0); } finally { clearTimeout(timeout); }
  } finally {
    if (child && child.exitCode === null) child.kill();
    if (blocker.listening) await new Promise(resolve => blocker.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
