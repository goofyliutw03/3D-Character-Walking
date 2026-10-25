// Compare CPU/GPU embedding requests with synthetic input. Leaves the GPU model warm.
import { mkdir, writeFile } from 'node:fs/promises';

const endpoint = 'http://127.0.0.1:11434';
const model = 'nomic-embed-text';
const passage = 'SceneRenderer initializes a Three.js city scene with a perspective camera, street geometry, lighting, shadows, and resize handling. CharacterController owns movement state and grounded jumping. CameraController follows a character transform. ';
const results = [];
let expectedDigest;
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function embed(numGpu, count) {
  const start = performance.now();
  const response = await fetch(`${endpoint}/api/embed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: Array.from({ length: count }, (_, i) => `search_document: Sample ${i}. ${passage.repeat(3)}`),
      truncate: false, keep_alive: '5m', options: { num_gpu: numGpu, num_ctx: 2048 } }),
    signal: AbortSignal.timeout(180000),
  });
  if (!response.ok) throw new Error(`Embedding failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const elapsedMs = performance.now() - start;
  if (data.embeddings?.length !== count || data.embeddings.some(vector => vector.length !== 768 || vector.some(value => !Number.isFinite(value)))) {
    throw new Error('Embedding shape or values are invalid.');
  }
  return { elapsedMs, tokens: data.prompt_eval_count, vector: data.embeddings[0] };
}

try {
  for (const count of [1, 8]) {
    let cpuVector;
    for (const [backend, numGpu] of [['cpu', 0], ['gpu', 99]]) {
      const warmup = await embed(numGpu, count);
      const ps = await (await fetch(`${endpoint}/api/ps`)).json();
      const loaded = ps.models.find(item => item.name.startsWith('nomic-embed-text'));
      if (!loaded) throw new Error('Model is absent from Ollama process status.');
      expectedDigest ??= loaded.digest;
      if (loaded.digest !== expectedDigest) throw new Error('Model changed during benchmark.');
      if (backend === 'gpu' && !(loaded.size_vram > 0)) throw new Error('GPU run fell back to CPU.');
      if (backend === 'cpu' && loaded.size_vram > 0) throw new Error('CPU baseline still uses GPU.');
      if (backend === 'cpu') cpuVector = warmup.vector;
      const samples = [];
      for (let run = 0; run < 3; run++) samples.push(await embed(numGpu, count));
      const elapsedMs = median(samples.map(sample => sample.elapsedMs));
      const norm = vector => Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
      const cosine = backend === 'gpu' ? warmup.vector.reduce((sum, value, i) => sum + value * cpuVector[i], 0) / (norm(warmup.vector) * norm(cpuVector)) : undefined;
      const result = { backend, batchSize: count, medianMs: Math.round(elapsedMs * 100) / 100,
        documentsPerSecond: Math.round(count * 1000 / elapsedMs * 100) / 100,
        samplesMs: samples.map(sample => Math.round(sample.elapsedMs * 100) / 100),
        tokensPerRequest: samples[0].tokens, sizeVram: loaded.size_vram, cpuGpuCosine: cosine };
      results.push(result);
      console.log(JSON.stringify(result));
    }
  }
} finally {
  // Restore automatic full GPU offload for subsequent RAG calls, including on failure.
  await embed(99, 1);
}
const report = { timestamp: new Date().toISOString(), model, digest: expectedDigest,
  note: 'Synthetic warm requests; 1 warm-up and 3 measured samples per case. Excludes loading. Does not measure full RAG latency.', results };
await mkdir(new URL('../../.local/rag/', import.meta.url), { recursive: true });
await writeFile(new URL('../../.local/rag/gpu-benchmark.json', import.meta.url), JSON.stringify(report, null, 2));
