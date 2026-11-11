import http from 'node:http';
import { realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
export async function createReleaseServer(directory) {
  const root = await realpath(directory);
  await stat(path.join(root, 'index.html'));
  return http.createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
      const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = await realpath(path.resolve(root, '.' + (name === '/' ? '/index.html' : name)));
      const relative = path.relative(root, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403).end(); return; }
      const info = await stat(file);
      if (!info.isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      if (req.method === 'HEAD') res.end();
      else createReadStream(file).on('error', () => res.destroy()).pipe(res);
    } catch { res.writeHead(404).end(); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await createReleaseServer(process.argv[2]);
  server.on('error', error => { console.error(error.message); process.exit(1); });
  server.listen(Number(process.argv[3] ?? 4175), '127.0.0.1');
  // Parent pipe closes on normal Exit and on a tray host crash: no orphan service.
  process.stdin.resume();
  process.stdin.on('end', () => server.close(() => process.exit(0)));
}
