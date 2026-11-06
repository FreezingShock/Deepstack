// Memory and frame-time guard (deep perf pass). Serves dist/ and drives the built app in headless Chromium, measuring
// with Chrome's own counters (CDP Performance.getMetrics after a forced GC) how much the page keeps after:
//   1. boot and the judge warm-up (relations + senses must not be parsed into the page's heap: they live in a worker),
//   2. many room walks (two full laps of the side doors with [ / ]): heap, DOM nodes and listeners must stay flat,
//   3. a long Unlimited run (answer -> card -> next, many words): the same, per word,
// and how many long frames the main thread has during the judge warm-up and a room walk with the CPU throttled 4x.
// Fails (exit 1) when a budget is blown; prints the numbers either way. On failure (or with --trace dir) it saves a Chrome
// trace of the throttled room walk and the JSON so the regression can be read in chrome://tracing / Perfetto.
// Usage: npm run build && node scripts/perf-memory.mjs [--json out.json] [--trace dir] [--laps 2] [--words 12] [--no-fail]
// Set CHROMIUM_PATH if Playwright's browser is missing. Skips (exit 0) without a browser.
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {ROOMS} from '../src/core/rooms.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const dist = resolve(arg('dist', 'dist')), jsonOut = arg('json', ''), traceDir = arg('trace', process.env.PERF_TRACE_DIR || '');
const LAPS = +arg('laps', 2), WORDS = +arg('words', 12), noFail = process.argv.includes('--no-fail');
// Budgets: generous (CI is software-rendered and noisy). They catch a leak or a main-thread parse coming back, not a few percent.
const BUDGET = {
  heapAfterWarmMB: 13,        // home + judge warm: 18.7 MB while relations+senses were parsed on the page, ~8 MB with the lexicon worker
  warmWorstMs: 700,           // the longest main-thread task while the judge data loads (4x CPU); parsing 7 MB of JSON on the page was a multi-second freeze
  roomLapHeapMB: 1.5,         // heap kept per full lap of every room, after GC
  roomLapNodes: 60,           // DOM nodes kept per lap
  roomLapListeners: 30,       // event listeners kept per lap
  wordHeapKB: 350,            // heap kept per Unlimited word (the shelf really grows by one book's worth)
  wordNodes: 40,              // DOM nodes kept per word (a spine on the shelf canvas is not DOM)
  wordListeners: 8,           // listeners kept per word
  walkWorstMs: 700,           // the longest task in one room walk at 4x CPU (repainting the fireplace on every typed letter made it ~950 ms)
};

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.onnx': 'application/octet-stream'};
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(dist, p)));
  } catch { res.writeHead(404).end('nf'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); } catch { console.log('perf-memory: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('perf-memory: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [], R = {};
const over = (what, v, max) => { if (v > max) problems.push(`${what}: ${Math.round(v * 10) / 10} > budget ${max}`); };
const today = new Date().toISOString().slice(0, 10);
const seedRooms = Object.fromEntries(ROOMS.filter(r => r.id !== 'hall').map(r => [r.id, {daily: {}}]));

const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: 'block'});
const page = await ctx.newPage();
await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
await page.addInitScript(([rooms]) => {
  if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify({shelf: [], sound: false, rooms, room: 'hall', seenIntro: true}));
  window.__lt = []; // long tasks, for the throttled phases
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({type: 'longtask', buffered: true}); } catch {}
}, [seedRooms]);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Performance.enable');
const metrics = async () => {
  for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  return {heapMB: m.JSHeapUsedSize / 1048576, nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents};
};
const longSince = t => page.evaluate(t => window.__lt.filter(([s]) => s >= t).reduce((a, [, d]) => a + d, 0), t);
// the worst single main-thread task: a frozen frame the player sees. (Totals are dominated by software-rendered frames in CI.)
const worstSince = t => page.evaluate(t => Math.max(0, ...window.__lt.filter(([s]) => s >= t).map(([, d]) => d)), t);
const now = () => page.evaluate(() => performance.now());
const idleHome = () => page.waitForFunction(() => { const h = document.querySelector('#home'); return h && !h.hidden && !document.documentElement.classList.contains('rm-walking') && !document.querySelector('.rm-walk'); }, null, {timeout: 20000}).catch(() => {});

try {
  await page.goto(url);
  await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: 60000});
  await page.waitForTimeout(1200); // boot work (the word pool) is done; what follows is the judge data loading
  // 1. judge warm-up with 4x CPU: the 7 MB of relations + senses must not land on this thread
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  const t0 = await now();
  const warm = await page.evaluate(async () => {
    const d = window.__deepstack, t = performance.now();
    if (d.lexReady) await d.lexReady();
    else { // before the lexicon worker: wait for the page to fetch both files, then for its parse
      for (let i = 0; i < 400 && performance.getEntriesByType('resource').filter(e => /(relations|senses)\.json/.test(e.name)).length < 2; i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => setTimeout(r, 4000));
    }
    return Math.round(performance.now() - t);
  });
  await page.waitForTimeout(1500);
  R.warmLongTaskMs = Math.round(await longSince(t0)); R.warmWorstMs = Math.round(await worstSince(t0)); R.warmWaitMs = warm;
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
  await page.waitForTimeout(500);
  R.afterWarm = await metrics();
  over('heap after boot + judge warm-up (MB)', R.afterWarm.heapMB, BUDGET.heapAfterWarmMB);
  over('longest main-thread task while the judge data loads at 4x CPU (ms)', R.warmWorstMs, BUDGET.warmWorstMs);

  // 2. room walks: one lap visits every room. Lap 1 warms caches; laps 2..N must keep nothing.
  const n = ROOMS.length;
  const lap = async () => { for (let i = 0; i < n; i++) { await page.keyboard.press(']'); await page.waitForTimeout(150); await idleHome(); await page.waitForTimeout(250); } };
  await page.locator('#home').click({position: {x: 5, y: 400}}).catch(() => {});
  await lap();
  const lap1 = await metrics();
  // one throttled walk, traced: the busiest moment on home
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  if (traceDir) await browser.startTracing(page, {path: join(traceDir, 'room-walk-trace.json'), screenshots: false});
  const tw = await now();
  await page.keyboard.press(']'); await page.waitForTimeout(150); await idleHome(); await page.waitForTimeout(300);
  R.walkLongTaskMs = Math.round(await longSince(tw)); R.walkWorstMs = Math.round(await worstSince(tw));
  if (traceDir) await browser.stopTracing();
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
  for (let i = 1; i < n; i++) { await page.keyboard.press(']'); await page.waitForTimeout(150); await idleHome(); await page.waitForTimeout(250); } // finish that lap
  for (let l = 1; l < LAPS; l++) await lap();
  const lapN = await metrics(), laps = LAPS; // laps after lap 1 = LAPS (the traced lap + LAPS-1)
  R.roomLap = {heapMB: (lapN.heapMB - lap1.heapMB) / laps, nodes: (lapN.nodes - lap1.nodes) / laps, listeners: (lapN.listeners - lap1.listeners) / laps, end: lapN};
  over('heap kept per lap of the rooms (MB)', R.roomLap.heapMB, BUDGET.roomLapHeapMB);
  over('DOM nodes kept per lap of the rooms', R.roomLap.nodes, BUDGET.roomLapNodes);
  over('listeners kept per lap of the rooms', R.roomLap.listeners, BUDGET.roomLapListeners);
  over('longest task in one room walk at 4x CPU (ms)', R.walkWorstMs, BUDGET.walkWorstMs);

  // 3. a long Unlimited run: answer, skip the descent, close the card, next word
  await page.evaluate(() => window.__deepstack.startUnlimited());
  const playOne = async () => {
    // a run is a handful of words; when it ends (final page), the next one starts, as a player pressing Again would
    const w = page.locator('#stage .word');
    await w.waitFor({state: 'visible', timeout: 6000}).catch(() => {});
    if (!(await w.isVisible())) { await page.evaluate(() => window.__deepstack.startUnlimited()); await w.waitFor({state: 'visible', timeout: 20000}); }
    await page.locator('#ans').click(); await page.keyboard.type('a small quiet thing you would find there');
    await page.keyboard.press('Enter');
    const card = page.locator('#cardlayer:not([hidden])');
    for (let i = 0; i < 60 && !(await card.count()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(150); }
    await page.locator('#vd.on').waitFor({state: 'attached', timeout: 15000}).catch(() => {});
    await page.locator('#go').click();
    await page.waitForFunction(() => document.querySelector('#cardlayer')?.hidden !== false || !document.querySelector('#cardlayer .book'), null, {timeout: 10000}).catch(() => {});
  };
  for (let i = 0; i < 3; i++) await playOne();
  const w3 = await metrics();
  for (let i = 3; i < WORDS; i++) await playOne();
  const wN = await metrics(), k = WORDS - 3;
  R.word = {heapKB: (wN.heapMB - w3.heapMB) * 1024 / k, nodes: (wN.nodes - w3.nodes) / k, listeners: (wN.listeners - w3.listeners) / k, end: wN};
  over('heap kept per Unlimited word (KB)', R.word.heapKB, BUDGET.wordHeapKB);
  over('DOM nodes kept per Unlimited word', R.word.nodes, BUDGET.wordNodes);
  over('listeners kept per Unlimited word', R.word.listeners, BUDGET.wordListeners);
} catch (e) { problems.push('run: ' + String(e.message).split('\n')[0]); }

// On failure, take the trace now if it was not asked for, so CI can upload it.
if (problems.length && !traceDir && process.env.CI) {
  try {
    const dir = resolve('perf-traces'); await mkdir(dir, {recursive: true});
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
    await page.evaluate(() => window.__deepstack.showHome()); await idleHome();
    await browser.startTracing(page, {path: join(dir, 'room-walk-trace.json')});
    await page.keyboard.press(']'); await page.waitForTimeout(150); await idleHome(); await page.waitForTimeout(300);
    await browser.stopTracing();
    await writeFile(join(dir, 'perf-memory.json'), JSON.stringify({R, problems}, null, 2));
  } catch {}
}
await browser.close(); server.close();

const f = (x, d = 1) => x == null ? '-' : (Math.round(x * 10 ** d) / 10 ** d).toString();
console.log(`perf-memory:
  after boot + judge warm: heap ${f(R.afterWarm?.heapMB)} MB, ${R.afterWarm?.nodes} nodes, ${R.afterWarm?.listeners} listeners; judge data ready in ${R.warmWaitMs} ms, long tasks ${R.warmLongTaskMs} ms, worst ${R.warmWorstMs} ms (4x CPU)
  per lap of ${ROOMS.length} rooms: heap ${f(R.roomLap?.heapMB, 2)} MB, nodes ${f(R.roomLap?.nodes)}, listeners ${f(R.roomLap?.listeners)}; one walk at 4x CPU: long tasks ${R.walkLongTaskMs} ms, worst ${R.walkWorstMs} ms
  per Unlimited word: heap ${f(R.word?.heapKB)} KB, nodes ${f(R.word?.nodes)}, listeners ${f(R.word?.listeners)} (end heap ${f(R.word?.end?.heapMB)} MB)`);
if (jsonOut) await writeFile(jsonOut, JSON.stringify(R, null, 2));
if (problems.length) { console.log('\nperf-memory FAILED:\n - ' + problems.join('\n - ')); if (!noFail) process.exit(1); }
else console.log('perf-memory: within budget');
