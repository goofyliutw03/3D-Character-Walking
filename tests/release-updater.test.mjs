import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { publishPackage, publishedVersions } from '../scripts/release-package.mjs';
import { createOwnedService, createUpdater } from '../scripts/release-updater.mjs';

test('dist updates switch an owned HTTP service and preserve it on rejected updates', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tray-update-'));
  const release = path.join(root, 'Release');
  const queue = path.join(root, 'Update');
  const state = path.join(root, 'state');
  const dist = path.join(root, 'dist');
  const reservation = net.createServer().listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const { port } = reservation.address();
  await new Promise(resolve => reservation.close(resolve));
  const service = createOwnedService(port);
  const notices = [];
  const reports = [];
  const report = async identity => { reports.push({ ...identity, instance: service.instance() }); };
  let rejectStart = false;
  let stops = 0;
  const updater = createUpdater({
    release, queue, state, report,
    service: {
      async stop() { stops++; await service.stop(); },
      async start(...args) {
        if (rejectStart) { rejectStart = false; throw new Error('injected Node startup failure'); }
        await service.start(...args);
      },
    },
    notify: async notice => { notices.push(notice); },
  });
  const fetchFile = name => fetch(`http://127.0.0.1:${port}/${name}`);
  const page = async () => (await fetchFile('')).text();
  const assertReported = async (version, releaseDate) => {
    const response = await fetchFile('');
    const indexHash = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
    assert.ok(response.headers.get('x-release-instance'));
    assert.deepEqual(reports.at(-1), { version, releaseDate, indexHash, instance: response.headers.get('x-release-instance') });
  };
  const readPointer = async () => JSON.parse(await readFile(path.join(state, 'active.json'), 'utf8'));
  try {
    await mkdir(release);
    await mkdir(dist);
    await writeFile(path.join(release, 'index.html'), 'legacy Release');
    await writeFile(path.join(dist, 'index.html'), 'first dist');
    await writeFile(path.join(dist, 'keep.js'), 'keep');
    await writeFile(path.join(dist, 'remove.js'), 'remove');
    await updater.initialize();
    assert.equal(await page(), 'legacy Release');
    await assertReported(null, undefined);

    await mkdir(path.join(queue, '.pending-partial'), { recursive: true });
    assert.deepEqual(await publishedVersions(queue), []);
    assert.equal(await updater.check(), false);
    const first = await publishPackage(dist, queue);
    assert.equal(first.baseVersion, null);
    assert.equal(await updater.check(), true);
    assert.equal(await page(), 'first dist');
    await assertReported(first.targetVersion, first.releaseDate);
    const firstInstance = reports.at(-1).instance;
    assert.equal(await publishPackage(dist, queue), null);
    const installed = await readPointer();

    await writeFile(path.join(dist, 'index.html'), 'second dist');
    await writeFile(path.join(dist, 'new.js'), 'new');
    await rm(path.join(dist, 'remove.js'));
    const second = await publishPackage(dist, queue);
    const pkg = path.join(queue, second.targetVersion);
    assert.equal(second.baseVersion, first.targetVersion);
    assert.deepEqual(second.removed, ['remove.js']);
    assert.deepEqual(await readdir(path.join(pkg, 'payload')), ['index.html', 'new.js']);

    const manifestPath = path.join(pkg, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ ...second, baseVersion: null }));
    assert.equal(await updater.check(), false);
    assert.equal(await page(), 'first dist');
    assert.equal(stops, 1);
    await writeFile(manifestPath, JSON.stringify(second));

    const changedIndex = path.join(pkg, 'payload', 'index.html');
    await writeFile(changedIndex, 'corrupt');
    assert.equal(await updater.check(), false);
    assert.equal(await page(), 'first dist');
    assert.equal(stops, 1);
    await writeFile(changedIndex, 'second dist');

    rejectStart = true;
    assert.equal(await updater.check(), false);
    assert.deepEqual(await readPointer(), installed);
    assert.equal(await page(), 'first dist');
    assert.equal(notices.length, 1);
    await assertReported(first.targetVersion, first.releaseDate);
    assert.notEqual(reports.at(-1).instance, firstInstance);

    assert.equal(await updater.check(), true);
    assert.equal(await page(), 'second dist');
    await assertReported(second.targetVersion, second.releaseDate);
    assert.equal(await (await fetchFile('keep.js')).text(), 'keep');
    assert.equal(await (await fetchFile('new.js')).text(), 'new');
    assert.equal((await fetchFile('remove.js')).status, 404);
    assert.equal(await readFile(path.join(release, 'index.html'), 'utf8'), 'legacy Release');
    assert.deepEqual(notices, [first, second].map(({ targetVersion, releaseDate }) => ({ version: targetVersion, releaseDate })));
    assert.deepEqual((await readdir(state)).filter(name => name.startsWith('version-')), [(await readPointer()).directory]);

    await service.stop();
    assert.equal(service.instance(), undefined);
    await assert.rejects(fetchFile(''));
    await createUpdater({ release, queue, state, service, report }).initialize();
    assert.equal(await page(), 'second dist');
    await assertReported(second.targetVersion, second.releaseDate);
    const events = (await readFile(path.join(state, 'update.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    for (const event of ['add-file', 'replace-file', 'remove-file', 'healthy', 'cleanup', 'rollback-complete']) {
      assert.ok(events.some(entry => entry.event === event && entry.time), event);
    }
    for (const error of [/Invalid manifest/, /payload SHA-256/, /injected Node startup failure/]) {
      assert.ok(events.some(entry => entry.event === 'update-failed' && error.test(entry.error)));
    }
  } finally {
    await service.stop();
    await rm(root, { recursive: true, force: true });
  }
});
