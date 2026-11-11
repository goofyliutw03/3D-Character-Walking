// Uses an existing Playwright installation; never installs browsers or changes user profiles.
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(resolve(modulePath)).href : 'playwright');
const baseURL = process.env.VIEWER_URL ?? 'http://127.0.0.1:5175/';
const channel = process.env.BROWSER_CHANNEL ?? 'chrome';
if (!['chrome', 'msedge'].includes(channel)) throw new Error('BROWSER_CHANNEL must be chrome or msedge.');
const seconds = Number(process.env.SAMPLE_SECONDS ?? 30);
if (!Number.isFinite(seconds) || seconds < 5 || seconds > 120) throw new Error('SAMPLE_SECONDS must be 5–120.');
const output = resolve(process.argv[2] ?? '.local/viewer-benchmark.json');
const browser = await chromium.launch({ channel, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`); });
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    window.__frameSamples = [];
    window.__collectFrames = false;
    const match = window.matchMedia.bind(window);
    window.__mediaQueries = 0;
    window.__mediaQueryMs = 0;
    window.matchMedia = query => {
      const start = performance.now();
      const result = match(query);
      if (window.__collectFrames && query === '(prefers-reduced-motion: reduce)') {
        window.__mediaQueries++;
        window.__mediaQueryMs += performance.now() - start;
      }
      return result;
    };
    window.requestAnimationFrame = callback => request(time => {
      const start = performance.now();
      callback(time);
      if (window.__collectFrames) window.__frameSamples.push({ time, cpu: performance.now() - start });
    });
  });
  await page.goto(baseURL);
  await page.waitForFunction(() => document.body.textContent.includes('Rigged man') && document.body.textContent.includes('Ready'));
  await page.evaluate(() => {
    for (const control of document.querySelectorAll('#lighting, #obstruction-mode, [data-camera]')) {
      for (let parent = control.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
    }
  });
  const environment = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return { userAgent: navigator.userAgent, dpr: devicePixelRatio,
      canvas: [canvas.width, canvas.height], css: [canvas.clientWidth, canvas.clientHeight],
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      context: gl.getContextAttributes() };
  });
  const results = [];
  for (const scenario of ['day', 'night-water', 'fisheye', 'xray']) {
    await page.selectOption('#lighting', scenario === 'night-water' ? 'night' : 'day');
    await page.selectOption('#obstruction-mode', scenario === 'xray' ? 'xray' : 'zoom');
    await page.locator(`[data-camera="${scenario === 'fisheye' ? 'fisheye' : 'overview'}"]`).click();
    for (let round = 1; round <= 3; round++) {
      await page.waitForTimeout(3000);
      await page.evaluate(() => {
        window.__frameSamples = [];
        window.__guideChanges = 0;
        window.__mediaQueries = 0;
        window.__mediaQueryMs = 0;
        window.__guideObserver = new MutationObserver(records => { window.__guideChanges += records.length; });
        window.__guideObserver.observe(document.querySelector('#interaction-guide'), { childList: true });
        window.__collectFrames = true;
      });
      await page.waitForTimeout(seconds * 1000);
      const result = await page.evaluate(() => {
        window.__collectFrames = false;
        window.__guideObserver.disconnect();
        const samples = window.__frameSamples;
        const intervals = samples.slice(1).map((sample, i) => sample.time - samples[i].time);
        const quantile = (values, percentile) => [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * percentile) - 1)] ?? null;
        const elapsed = samples.at(-1)?.time - samples[0]?.time;
        const metrics = document.querySelector('#scene-metrics');
        return { frames: samples.length, elapsed, fps: elapsed > 0 ? intervals.length * 1000 / elapsed : null,
          median: quantile(intervals, .5), p95: quantile(intervals, .95),
          cpuMedian: quantile(samples.map(sample => sample.cpu), .5), cpuP95: quantile(samples.map(sample => sample.cpu), .95),
          guideChanges: window.__guideChanges, mediaQueries: window.__mediaQueries, mediaQueryMs: window.__mediaQueryMs, metrics: metrics.textContent,
          geometries: metrics.dataset.geometries, textures: metrics.dataset.textures };
      });
      results.push({ scenario, round, ...result });
      if (result.frames < 2 || result.fps === null) errors.push(`No usable frame sample: ${scenario}, round ${round}`);
      console.log(JSON.stringify(results.at(-1)));
    }
  }
  const { dirname } = await import('node:path');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ date: new Date().toISOString(), baseURL, channel, headless: true, seconds, environment, results, errors }, null, 2));
  console.log(`Saved ${output}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
} finally { await browser.close(); }
