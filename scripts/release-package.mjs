import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const versionPattern = /^\d{12}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function checkName(name) {
  if (name.split('/').some(part => !part || /[<>:"\\|?*\u0000-\u001f]|[. ]$/.test(part)
      || /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(part)
      || /^(\.git|node_modules|src|\.env.*)$/i.test(part))
      || /\.(map|ts|pem|key|pfx)$/i.test(name)) {
    throw new Error(`Invalid dist path: ${JSON.stringify(name)}`);
  }
}

export async function fileHash(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export async function inventory(root) {
  const entries = [];
  async function walk(directory, prefix) {
    if (!(await lstat(directory)).isDirectory()) throw new Error(`Expected directory: ${directory}`);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const name = prefix + entry.name;
      checkName(name);
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file, name + '/');
      else if (entry.isFile()) entries.push([name, await fileHash(file)]);
      else throw new Error(`Expected regular file: ${name}`);
    }
  }
  await walk(root, '');
  entries.sort(([a], [b]) => compare(a, b));
  checkInventory(entries);
  return entries;
}

function checkInventory(entries) {
  if (!Array.isArray(entries)) throw new Error('Invalid inventory');
  const seen = new Map();
  let previous = '';
  for (const [name, hash] of entries) {
    if (typeof name !== 'string' || name <= previous || !hashPattern.test(hash)) throw new Error('Invalid inventory entry');
    checkName(name);
    const parts = name.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join('/');
      const key = prefix.toLowerCase();
      const existing = seen.get(key);
      if (existing && (i === parts.length || existing.file || existing.prefix !== prefix)) {
        throw new Error(`Colliding dist paths: ${name}`);
      }
      seen.set(key, { prefix, file: i === parts.length });
    }
    previous = name;
  }
}

export function delta(base, target) {
  const before = new Map(base);
  const after = new Map(target);
  return {
    changed: target.filter(([name, hash]) => before.get(name) !== hash),
    removed: base.map(([name]) => name).filter(name => !after.has(name)),
  };
}

export function nextVersion(version) {
  const next = String(Number(version ?? 0) + 1).padStart(12, '0');
  if (!versionPattern.test(next)) throw new Error('Release version limit reached');
  return next;
}

export async function publishedVersions(queue) {
  const entries = await readdir(queue, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return entries.filter(entry => versionPattern.test(entry.name)).map(entry => entry.name).sort(compare);
}

export async function readManifest(queue, version) {
  if (!versionPattern.test(version)) throw new Error('Invalid package version');
  const directory = path.join(queue, version);
  if (!(await lstat(directory)).isDirectory()) throw new Error('Invalid package directory');
  const file = path.join(directory, 'manifest.json');
  if (!(await lstat(file)).isFile()) throw new Error('Invalid package manifest');
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  const { schema, baseVersion, targetVersion, releaseDate, files, changed, removed } = manifest;
  if (schema !== 1 || targetVersion !== version || (baseVersion !== null && !versionPattern.test(baseVersion))
      || nextVersion(baseVersion) !== version || !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)
      || !Array.isArray(removed)) throw new Error(`Invalid manifest: ${version}`);
  checkInventory(files);
  checkInventory(changed);
  if (!new Map(files).has('index.html')) throw new Error('Package is missing index.html');
  return manifest;
}

export async function copyDistFile(source, destination, name, hash) {
  const from = path.join(source, name);
  const to = path.join(destination, name);
  if (!(await lstat(from)).isFile()) throw new Error(`Expected regular file: ${name}`);
  await mkdir(path.dirname(to), { recursive: true });
  await copyFile(from, to);
  if (await fileHash(to) !== hash) throw new Error(`SHA-256 mismatch: ${name}`);
}

export async function publishPackage(source, queue, synchronizedRelease) {
  await mkdir(queue, { recursive: true });
  if (!(await lstat(queue)).isDirectory()) throw new Error('Expected Update directory');
  const baseVersion = (await publishedVersions(queue)).at(-1) ?? null;
  const base = baseVersion ? (await readManifest(queue, baseVersion)).files : [];
  const targetVersion = nextVersion(baseVersion);
  const files = await inventory(source);
  if (!new Map(files).has('index.html')) throw new Error('dist is missing index.html');
  if (synchronizedRelease) {
    for (const [name, hash] of files) {
      if (await fileHash(path.join(synchronizedRelease, name)) !== hash) {
        throw new Error(`Synchronized Release differs from dist: ${name}`);
      }
    }
  }
  const { changed, removed } = delta(base, files);
  if (!changed.length && !removed.length) return null;
  const releaseDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date());
  const manifest = { schema: 1, baseVersion, targetVersion, releaseDate, files, changed, removed };
  const staging = await mkdtemp(path.join(queue, '.pending-'));
  try {
    const payload = path.join(staging, 'payload');
    await mkdir(payload);
    for (const [name, hash] of changed) await copyDistFile(source, payload, name, hash);
    await writeFile(path.join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    await rename(staging, path.join(queue, targetVersion));
    return manifest;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [source, release] = process.argv.slice(2);
  const queue = path.join(path.dirname(release), 'Update');
  const manifest = await publishPackage(source, queue, release);
  console.log(manifest ? `Update ${manifest.targetVersion}: ${manifest.changed.length} changed, ${manifest.removed.length} removed`
    : 'Update: dist unchanged');
}
