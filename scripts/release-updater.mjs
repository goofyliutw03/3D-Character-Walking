import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { appendFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { copyDistFile, delta, inventory, nextVersion, publishedVersions, readManifest } from './release-package.mjs';

const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const serverScript = fileURLToPath(new URL('./release-server.mjs', import.meta.url));

async function atomicJson(file, value) {
  const temp = file + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temp, JSON.stringify(value));
    await rename(temp, file);
  } finally {
    await rm(temp, { force: true });
  }
}

export function createOwnedService(port) {
  let child;
  let exited;
  return {
    async start(directory, indexHash) {
      const token = randomUUID();
      child = spawn(process.execPath, [serverScript, directory, String(port), token], {
        stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true,
      });
      let errors = '';
      child.stdin.on('error', () => {});
      child.stderr.setEncoding('utf8').on('data', data => { errors += data; });
      let ended = false;
      exited = new Promise(resolve => {
        const finish = () => { ended = true; resolve(); };
        child.once('error', error => { errors += error.message; finish(); });
        child.once('close', finish);
      });
      const deadline = Date.now() + 5000;
      while (!ended && Date.now() < deadline) {
        try {
          const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(500) });
          const hash = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
          if (!ended && response.ok && response.headers.get('x-release-instance') === token && hash === indexHash) return;
        } catch { /* Retry until the owned server responds or exits. */ }
        await delay(100);
      }
      throw new Error(errors.trim() || 'Owned Node failed the HTTP index health check');
    },
    async stop() {
      if (!child) return;
      child.stdin.end();
      const timer = setTimeout(() => child.kill(), 2000);
      try {
        await exited;
      } finally {
        clearTimeout(timer);
        child = undefined;
      }
    },
    running() {
      return !!child && child.exitCode === null && child.signalCode === null && child.pid !== undefined;
    },
  };
}

export function createUpdater({ release, queue, state, service, notify = async () => {} }) {
  const pointer = path.join(state, 'active.json');
  const versionPath = version => path.join(state, version.directory);
  let active;

  async function log(event, details = {}) {
    await appendFile(path.join(state, 'update.jsonl'), JSON.stringify({
      time: new Date().toISOString(), event, ...details,
    }) + '\n');
  }

  async function start(version) {
    await log('start', { version: version.version });
    await service.start(versionPath(version), new Map(version.files).get('index.html'));
    await log('healthy', { version: version.version });
  }

  async function cleanup(version) {
    if (!version) return;
    const details = { version: version.version, directory: version.directory };
    try {
      await rm(versionPath(version), { recursive: true, force: true });
      await log('cleanup', details);
    } catch (error) {
      await log('cleanup-failed', { ...details, error: error.message });
    }
  }

  return {
    async initialize() {
      await mkdir(state, { recursive: true });
      const saved = await readFile(pointer, 'utf8').catch(error => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (saved !== null) {
        active = JSON.parse(saved);
        if (!/^version-[a-z0-9]{6}$/i.test(active.directory)
            || (active.version !== null && !/^\d{12}$/.test(active.version))
            || !equal(await inventory(versionPath(active)), active.files)) {
          throw new Error('Stored Release version failed validation');
        }
      } else {
        const files = await inventory(release);
        if (!new Map(files).has('index.html')) throw new Error('Publish Release first.');
        const directory = await mkdtemp(path.join(state, 'version-'));
        active = { version: null, directory: path.basename(directory), files };
        try {
          for (const [name, hash] of files) await copyDistFile(release, directory, name, hash);
          await log('bootstrap', { directory: active.directory });
          await atomicJson(pointer, active);
        } catch (error) {
          await cleanup(active);
          throw error;
        }
      }
      await start(active);
    },

    async check() {
      const target = nextVersion(active.version);
      const details = { baseVersion: active.version, targetVersion: target };
      let candidate;
      let switching = false;
      try {
        const versions = await publishedVersions(queue);
        if (!versions.some(version => version >= target)) return false;
        await log('validate', details);
        const manifest = await readManifest(queue, target);
        if (manifest.baseVersion !== active.version) throw new Error('Package base version mismatch');
        if (!equal(await inventory(versionPath(active)), active.files)) throw new Error('Installed base SHA-256 mismatch');
        const base = active.version ? active.files : [];
        const { changed, removed } = delta(base, manifest.files);
        if (!equal(changed, manifest.changed) || !equal(removed, manifest.removed)) {
          throw new Error('Package delta does not match installed base');
        }
        const payload = path.join(queue, target, 'payload');
        if (!equal(await inventory(payload), changed)) throw new Error('Package payload SHA-256 or file list mismatch');
        const directory = await mkdtemp(path.join(state, 'version-'));
        candidate = { version: target, directory: path.basename(directory), files: manifest.files };
        const changedFiles = new Map(changed);
        const before = new Map(base);
        for (const [name, hash] of manifest.files) {
          const modified = changedFiles.has(name);
          await copyDistFile(modified ? payload : versionPath(active), directory, name, hash);
          if (modified) await log(before.has(name) ? 'replace-file' : 'add-file', { ...details, name, hash });
        }
        for (const name of removed) await log('remove-file', { ...details, name });
        await log('prepared', details);
        switching = true;
        await log('stop', { version: active.version });
        await service.stop();
        await log('stopped', { version: active.version });
        await log('switch', details);
        await start(candidate);
        await atomicJson(pointer, candidate);
        const previous = active;
        active = candidate;
        try {
          await log('committed', { ...details, releaseDate: manifest.releaseDate });
          await cleanup(previous);
        } finally {
          await notify({ version: target, releaseDate: manifest.releaseDate });
        }
        return true;
      } catch (error) {
        if (candidate && active === candidate) {
          await log('post-commit-error', { ...details, error: error.message });
          return true;
        }
        const recoveryLog = (event, extra) => log(event, { ...details, ...extra }).catch(logError => {
          console.error(logError.message);
        });
        await recoveryLog('update-failed', { error: error.message });
        if (switching) {
          try {
            await recoveryLog('rollback-stop', { version: target });
            await service.stop();
            await recoveryLog('rollback', { version: active.version });
            await service.start(versionPath(active), new Map(active.files).get('index.html'));
            await recoveryLog('rollback-complete', { version: active.version });
          } catch (rollbackError) {
            await recoveryLog('rollback-failed', { error: rollbackError.message });
            throw rollbackError;
          }
        }
        await cleanup(candidate);
        return false;
      }
    },
  };
}

async function run(release, state, port, notification) {
  const service = createOwnedService(port);
  const updater = createUpdater({
    release, queue: path.join(path.dirname(release), 'Update'), state, service,
    notify: event => atomicJson(notification, event),
  });
  const shutdown = new AbortController();
  process.stdin.resume();
  process.stdin.once('end', () => shutdown.abort());
  try {
    await updater.initialize();
    while (!shutdown.signal.aborted) {
      if (!service.running()) throw new Error('Owned Release server stopped.');
      await updater.check();
      await delay(60000, undefined, { signal: shutdown.signal });
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      await appendFile(path.join(state, 'update.jsonl'), JSON.stringify({
        time: new Date().toISOString(), event: 'controller-error', error: error.message,
      }) + '\n');
      process.exitCode = 1;
    }
  } finally {
    await service.stop();
    process.stdin.pause();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [release, state, port, notification] = process.argv.slice(2);
  await run(path.resolve(release), state, Number(port), notification);
}
