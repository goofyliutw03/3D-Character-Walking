// Optional integration check using an already installed Playwright and browser.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href : 'playwright');
const url = process.env.VIEWER_URL ?? 'http://127.0.0.1:5176/';
const channel = process.env.BROWSER_CHANNEL ?? 'chrome';
if (!['chrome', 'msedge'].includes(channel)) throw new Error('BROWSER_CHANNEL must be chrome or msedge.');
const browser = await chromium.launch({ channel, headless: true });
const output = resolve(process.argv[2] ?? '.local/viewer-smoke.json');
const checks = [];
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    const match = window.matchMedia.bind(window);
    window.__reducedCalls = 0;
    window.matchMedia = query => {
      const result = match(query);
      if (query === '(prefers-reduced-motion: reduce)') {
        window.__reducedCalls++;
        window.__reducedList = result;
      }
      return result;
    };
  });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('#asset-status')?.textContent.includes('Ready'));
  const before = await page.evaluate(() => window.__reducedCalls);
  await page.waitForTimeout(500);
  const extraQueries = await page.evaluate(start => window.__reducedCalls - start, before);
  assert.equal(extraQueries, 0, 'steady frames must reuse the existing reduced-motion MediaQueryList');
  checks.push('steady-frame query reuse');
  if (process.env.RED_ONLY === '1') { console.log(JSON.stringify({ checks })); process.exitCode = 0; }
  else {
    for (const reducedMotion of ['reduce', 'no-preference', 'reduce']) {
      await page.emulateMedia({ reducedMotion });
      await page.waitForFunction(expected => window.__reducedList.matches === expected, reducedMotion === 'reduce');
    }
    assert.equal(await page.evaluate(() => window.__reducedCalls), before);
    checks.push('same MediaQueryList reflects live preference changes');
    await page.evaluate(() => {
      for (const control of document.querySelectorAll('#character, #lighting, #follow, #obstruction-mode, [data-camera]')) {
        for (let parent = control.parentElement; parent; parent = parent.parentElement) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
        }
      }
    });
    for (const variant of ['woman', 'child', 'man']) {
      await page.selectOption('#character', variant);
      await page.waitForFunction(expected => document.querySelector('#asset-status').textContent.includes(`Rigged ${expected}`)
        && document.querySelector('#asset-status').textContent.includes('Ready'), variant);
    }
    checks.push('all three rigged assets');
    for (const camera of ['front', 'first-person', 'fisheye', 'overview']) {
      await page.locator(`[data-camera="${camera}"]`).click();
      await page.waitForFunction(value => document.querySelector(`[data-camera="${value}"]`).getAttribute('aria-pressed') === 'true', camera);
    }
    await page.locator('#follow').uncheck();
    await page.waitForFunction(() => document.querySelector('#camera-hint').textContent.includes('Tracking paused'));
    await page.locator('#follow').check();
    for (const mode of ['transparent', 'wireframe', 'xray', 'zoom']) {
      await page.selectOption('#obstruction-mode', mode);
      assert.equal(await page.locator('#obstruction-mode').inputValue(), mode);
    }
    checks.push('camera / follow / obstruction state transitions');
    await page.locator('canvas').focus();
    await page.keyboard.down('w');
    await page.waitForFunction(() => document.querySelector('#character-status').textContent.includes('Walk'));
    await page.keyboard.up('w');
    await page.waitForFunction(() => document.querySelector('#character-status').textContent.includes('Idle'));
    checks.push('keyboard movement / stop state');
    await page.selectOption('#lighting', 'night');
    await page.selectOption('#obstruction-mode', 'xray');
    await page.locator('[data-camera="fisheye"]').click();
    for (const [width, height] of [[390, 844], [844, 390], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(300);
      const size = await page.locator('canvas').evaluate(canvas => ({ width: canvas.width, height: canvas.height,
        cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight }));
      assert.ok(size.width > 0 && size.height > 0);
      assert.ok(Math.abs(size.width / size.height - size.cssWidth / size.cssHeight) < .02);
    }
    checks.push('night / fisheye + xray / portrait-landscape resize');
    await page.locator('canvas').evaluate(canvas => {
      const gl = canvas.getContext('webgl2');
      window.__contextExtension = gl.getExtension('WEBGL_lose_context');
      if (!window.__contextExtension) throw new Error('WEBGL_lose_context unavailable');
      window.__contextExtension.loseContext();
    });
    await page.waitForFunction(() => document.querySelector('#renderer-status').textContent.includes('lost'));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__contextExtension.restoreContext());
    await page.waitForFunction(() => document.querySelector('#renderer-status').textContent.includes('restored'));
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('#scene-error').isVisible(), false);
    checks.push('native WebGL context loss / restore');
    await mkdir(dirname(output), { recursive: true });
    await page.screenshot({ path: output.replace(/\.json$/, '') + '.png' });
    assert.deepEqual(errors, []);
    await writeFile(output, JSON.stringify({ date: new Date().toISOString(), url, channel, headless: true, checks, errors }, null, 2));
    console.log(JSON.stringify({ output, checks, errors }));
  }
} finally { await browser.close(); }
