// Performance budget guard. Serves a built dist/ and measures, in headless Chromium with the CPU throttled like a mid phone:
//   1. static weight: JS/CSS the home screen needs (gzip) and how many data files the first paint waits for;
//   2. a REPEAT visit while the network is slow for /data/ (every data file takes DATA_DELAY ms): how long entering a topic
//      room and starting a run takes. The service worker must answer unchanged data from its cache, so the delay must not show;
//   3. judge latency (submit -> score) for fresh words in every room, once the model is ready.
// Fails (exit 1) if a budget is blown; prints the numbers either way. Usage: npm run build && node scripts/perf-budget.mjs
//   [--dist dist] [--cpu 4] [--delay 3000] [--rooms hall,history,...] [--json out.json] [--no-fail]
// Set CHROMIUM_PATH if Playwright's browser is missing. Skips (exit 0) without a browser.
import {createServer} from 'node:http';
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {gzipSync} from 'node:zlib';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const dist = resolve(arg('dist', 'dist')), cpu = +arg('cpu', 4), delay = +arg('delay', 3000), jsonOut = arg('json', '');
const ROOMS = arg('rooms', 'hall,history,math,science,english,art,body').split(',');
const noFail = process.argv.includes('--no-fail');
// Budgets. Generous on purpose (CI runners are noisy and software-rendered): they catch a regression in kind, not a few percent.
const BUDGET = {
  entryGzipKB: 260,          // index js + css the first paint needs
  dataReadyMs: 4500,         // repeat visit, slow data network, 4x CPU: the lists a run needs are in the page this soon after navigation start (was 4-11 s)
  roomEnterMs: 10500,        // the same visit: reload in a room, tap Descend -> first word on screen (includes ~6.5 s of boot, intro and animation at 4x CPU)
  judgeWarmMs: 3500,         // a fresh word's score once the model is ready (4x CPU)
  judgeColdMs: 3000,         // the first score after the model is ready
};

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'};
const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    let p = normalize(decodeURIComponent(u.pathname)); if (p.endsWith('/')) p += 'index.html';
    if (p.startsWith('/data/') && delay) await new Promise(r => setTimeout(r, delay));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(dist, p)));
  } catch { res.writeHead(404).end('nf'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); } catch { console.log('perf-budget: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('perf-budget: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [], R = {cpu, delay, rooms: {}};
const over = (what, v, max) => { if (v > max) problems.push(`${what}: ${Math.round(v)} > budget ${max}`); };

// 1. static weight
{
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  const files = [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.(?:js|css))"/g)].map(m => m[1]);
  let bytes = 0; for (const f of files) bytes += gzipSync(await readFile(join(dist, f))).length;
  R.entryGzipKB = Math.round(bytes / 1024); R.entryFiles = files.length;
  over('entry gzip KB', R.entryGzipKB, BUDGET.entryGzipKB);
}

for (const room of ROOMS) {
  const ctx = await browser.newContext({viewport: {width: 390, height: 800}, isMobile: true, hasTouch: true, serviceWorkers: 'allow'});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  await page.addInitScript(r => { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify({shelf: [], sound: false, room: r, rooms: {}})); }, room);
  const out = R.rooms[room] = {};
  try {
    // visit 1: load, let the service worker install and the data cache fill (the delay only slows this visit)
    await page.goto(url);
    await page.locator('#bPlay').waitFor({state: 'visible', timeout: 60000});
    await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => false), null, {timeout: 20000}).catch(() => {});
    await page.waitForFunction(async () => { // words, rooms and room-words are precached by the worker once it activates
      const c = await caches.open('ds-data-v1'); const names = (await c.keys()).map(r => new URL(r.url).pathname);
      return ['/data/words.json', '/data/rooms.json', '/data/room-words.json'].every(n => names.includes(n));
    }, null, {timeout: 90000, polling: 500}).catch(() => {});
    await page.reload(); await page.waitForTimeout(500); // the worker now controls the page
    // visit 2 (repeat): slow data network, throttled CPU
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', {rate: cpu});
    const t0 = Date.now();
    await page.reload();
    await page.locator('#bPlay').waitFor({state: 'visible', timeout: 60000});
    await page.locator('#bPlay').tap();
    await page.locator('#stage .word').waitFor({state: 'visible', timeout: 60000});
    // what the start of a run needs: the word list, plus the room lists when the save is in a topic room (the Reading Room prefetches those later, on a timer)
    out.dataReadyMs = await page.evaluate(room => Math.round(Math.max(0, ...performance.getEntriesByType('resource').filter(e => new RegExp(room === 'hall' ? '/data/words\\.json' : '/data/(words|rooms|room-words)\\.json').test(e.name)).map(e => e.responseEnd))), room);
    over(`${room} word/room lists in the page (repeat visit, ${delay}ms data latency)`, out.dataReadyMs, BUDGET.dataReadyMs);
    out.roomEnterMs = Date.now() - t0; over(`${room} enter room + first word (repeat visit, ${delay}ms data latency)`, out.roomEnterMs, BUDGET.roomEnterMs);
    // judge latency on fresh words of this room, once the model answers with the embedding engine
    const j = await page.evaluate(async room => {
      const d = window.__deepstack, base = location.origin + '/data/';
      let ws;
      if (room === 'hall') ws = (await (await fetch(base + 'words.json')).json()).words;
      else ws = (await (await fetch(base + 'room-words.json')).json()).rooms[room].map(([w, pos, def]) => ({w, pos, def}));
      ws = ws.slice(10, 15).map(w => ({...w, concepts: w.concepts || [], hint: null, curated: false}));
      const t = performance.now();
      for (let i = 0; i < 600; i++) { const r = await d.judge(ws[0].def.slice(0, 100), ws[0]); if (r.engine === 'embedding') break; await new Promise(r => setTimeout(r, 100)); }
      const cold = Math.round(performance.now() - t), warm = [];
      for (const w of ws.slice(1)) { const s = performance.now(); await d.judge(w.def.slice(0, 100), w); warm.push(Math.round(performance.now() - s)); }
      return {cold, warm};
    }, room);
    out.judgeColdMs = j.cold; out.judgeWarmMs = Math.max(...j.warm);
    over(`${room} first score once the model is up`, j.cold, BUDGET.judgeColdMs);
    over(`${room} later score`, out.judgeWarmMs, BUDGET.judgeWarmMs);
  } catch (e) { problems.push(`${room}: ${String(e.message).split('\n')[0]}`); }
  await ctx.close();
}
await browser.close(); server.close();

console.log(`perf-budget: ${cpu}x CPU, ${delay} ms data latency on a repeat visit, entry ${R.entryGzipKB} KB gzip (${R.entryFiles} files)\nroom      data ready  enter+word   first score   later score (ms)`);
for (const [k, v] of Object.entries(R.rooms)) console.log(`${k.padEnd(9)} ${String(v.dataReadyMs ?? '-').padStart(10)} ${String(v.roomEnterMs ?? '-').padStart(9)} ${String(v.judgeColdMs ?? '-').padStart(13)} ${String(v.judgeWarmMs ?? '-').padStart(13)}`);
if (jsonOut) await writeFile(jsonOut, JSON.stringify(R, null, 2));
if (problems.length) { console.log('\nperf-budget FAILED:\n - ' + problems.join('\n - ')); if (!noFail) process.exit(1); }
else console.log('perf-budget: within budget');
