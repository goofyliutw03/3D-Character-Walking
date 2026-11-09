import { defineConfig } from 'vite';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const debugDirectory = process.env.WALK_VIEWER_DEBUG_DIR;
const require = createRequire(import.meta.url);
const needleDist = join(dirname(require.resolve('@needle-tools/engine/package.json')), 'dist');

export default defineConfig({
  resolve: {
    alias: [{ find: /^@needle-tools\/engine$/, replacement: join(needleDist, 'needle-engine.min.js') }],
  },
  cacheDir: debugDirectory && join(debugDirectory, 'cache'),
  build: {
    outDir: debugDirectory && join(debugDirectory, 'dist'),
    rolldownOptions: { input: ['index.html', 'water.html'] },
  },
});
