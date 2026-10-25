import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { realpathSync } from 'node:fs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const server = fileURLToPath(new URL('./node_modules/socraticode/dist/index.js', import.meta.url));
const requireServer = createRequire(realpathSync(server));
const { Client } = await import(pathToFileURL(requireServer.resolve('@modelcontextprotocol/sdk/client/index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(requireServer.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href);
const env = {
  ...process.env,
  QDRANT_MODE: 'external', QDRANT_URL: 'http://127.0.0.1:16333',
  OLLAMA_MODE: 'external', OLLAMA_URL: 'http://127.0.0.1:11434',
  EMBEDDING_PROVIDER: 'ollama', EMBEDDING_MODEL: 'nomic-embed-text', EMBEDDING_DIMENSIONS: '768',
  EMBEDDING_BATCH_SIZE: '8', OLLAMA_MAX_CONNECTIONS: '1',
  SOCRATICODE_AUTO_RESUME: 'off', SOCRATICODE_WATCHER: 'off',
};
const client = new Client({ name: 'walk-viewer-rag-check', version: '1.0.0' });
const transport = new StdioClientTransport({ command: process.execPath, args: [server], cwd: root, env, stderr: 'inherit' });
try {
  await client.connect(transport);
  const action = process.argv[2] ?? 'status';
  if (action === 'tools') {
    console.log(JSON.stringify(await client.listTools(), null, 2));
  } else {
    const names = { health: 'codebase_health', status: 'codebase_status', index: 'codebase_index', update: 'codebase_update', search: 'codebase_search' };
    if (!names[action]) throw new Error('Use tools, health, status, index, update, or search <query>.');
    const args = action === 'health' ? {} : { projectPath: path.resolve(root) };
    if (action === 'search') {
      args.query = process.argv.slice(3).join(' ');
      args.limit = 3;
      if (!args.query) throw new Error('Supply a search query.');
    }
    const result = await client.callTool({ name: names[action], arguments: args }, undefined, { timeout: 600000 });
    console.log(JSON.stringify(result, null, 2));
    if (result.isError) process.exitCode = 1;
    if (action === 'health' && /\[MISSING\]|\[FAIL\]/.test(JSON.stringify(result))) process.exitCode = 1;
    if (action === 'index' && !result.isError) {
      // Keep the server alive until its background indexing finishes.
      for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const status = await client.callTool({ name: 'codebase_status', arguments: args });
        const message = JSON.stringify(status);
        console.log(message);
        if (status.isError || /Last operation:.*FAILED|INDEX IS INCOMPLETE/i.test(message)) {
          process.exitCode = 1;
          break;
        }
        if (!/in progress|Status: indexing/i.test(message)) break;
        if (attempt === 299) throw new Error('Indexing has not completed within ten minutes. Check status before searching.');
      }
    }
  }
} finally {
  await client.close();
}
