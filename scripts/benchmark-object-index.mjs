// CPU-only microbenchmark; timings are evidence, never a CI pass threshold.
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { CityScene } from '../src/scene/CityScene.ts';
import { SceneObjectIndex } from '../src/inspector/SceneObjectIndex.ts';

const city = new CityScene();
try {
  const candidates = [['current', SceneObjectIndex]];
  if (process.argv[2]) {
    const original = await import(pathToFileURL(resolve(process.argv[2])).href);
    candidates.unshift(['baseline', original.SceneObjectIndex]);
  }
  const samples = candidates.map(([name, Index]) => {
    const index = new Index(); index.sync(city.scene);
    for (let i = 0; i < 200; i++) index.sync(city.scene);
    return { name, index, millisecondsPerSync: [] };
  });
  for (let round = 0; round < 9; round++) {
    // Reverse alternate rounds to reduce ordering bias.
    for (const sample of round % 2 ? [...samples].reverse() : samples) {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) sample.index.sync(city.scene);
      sample.millisecondsPerSync.push((performance.now() - start) / 1000);
    }
  }
  console.log(JSON.stringify({
    node: process.version, platform: process.platform, architecture: process.arch,
    warmup: 200, iterationsPerRound: 1000, rounds: 9,
    samples: samples.map(({ name, index, millisecondsPerSync }) => ({
      name, nodes: index.rows.length, millisecondsPerSync,
      median: [...millisecondsPerSync].sort((a, b) => a - b)[4],
    })),
  }, null, 2));
  for (const { index } of samples) index.dispose();
} finally { city.dispose(); }
