import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
// The browser distribution keeps Needle's Three.js fork separate from the viewer renderer.
const needleDist = join(dirname(require.resolve('@needle-tools/engine/package.json')), 'dist');

export default defineConfig({
  resolve: {
    alias: [{ find: /^@needle-tools\/engine$/, replacement: join(needleDist, 'needle-engine.min.js') }],
  },
  build: { rolldownOptions: { input: ['index.html', 'water.html'] } },
});
