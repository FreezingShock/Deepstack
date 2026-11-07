// First-visit timing probe for a slow phone. Serves dist/ (gzip for text, as a CDN would), throttles the network
// (Slow 4G: RTT and bandwidth set by --rtt/--kbps) and the CPU (--cpu, default 4x), then loads the app like a player
// who has never been here: home usable, first word on screen, judge model ready, and the bytes each step waited for.
// With --repeat the same browser context loads the page again once the first visit has finished (service worker
// and model cache in place), so the repeat numbers show what a returning player waits for.
// Usage: npm run build && node scripts/first-load.mjs [--json out.json] [--rtt 150] [--kbps 1600] [--cpu 4]
//          [--timeout 900] [--viewport 390x844] [--dpr 2] [--no-repeat] [--until-word] [--dist dist]
// Set CHROMIUM_PATH if Playwright's browser is missing. Skips (exit 0) without a browser.
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {gzipSync} from 'node:zlib';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const dist = resolve(arg('dist', 'dist')), rtt = +arg('rtt', 150), kbps = +arg('kbps', 1600), cpu = +arg('cpu', 4);
const timeoutMs = +arg('timeout', 900) * 1000, jsonOut = arg('json', ''), [vw, vh] = arg('viewport', '390x844').split('x').map(Number), dpr = +arg('dpr', 2);
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.onnx': 'application/octet-stream', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'};
const GZIP = /\.(html|js|mjs|css|json|svg|wasm|webmanifest)$/;

// Compressed copies are cached, so the server costs nothing per request; the gzip size is what a player's phone downloads.
const cache = new Map();
async function body(p, gz) {
  const key = p + (gz ? ':gz' : '');
  if (!cache.has(key)) { const raw = await readFile(join(dist, p)); cache.set(key, gz ? gzipSync(raw, {level: 9}) : raw); }
  return cache.get(key);
}
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    const gz = GZIP.test(p) && /gzip/.test(req.headers['accept-encoding'] || '');
    if (process.env.FL_DEBUG) console.error('  served', new Date().toISOString().slice(11, 19), p, gz ? 'gz' : 'raw');
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream', ...(gz ? {'content-encoding': 'gzip', vary: 'accept-encoding'} : {})}).end(await body(p, gz));
  } catch { res.writeHead(404).end('nf'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); } catch { console.log('first-load: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('first-load: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const STAGE = ['home', 'word', 'model', 'judge'];

// One visit: returns when each stage was reached (ms since navigation start) and the bytes that had arrived by then.
async function visit(ctx, label) {
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: rtt, downloadThroughput: kbps * 1024 / 8, uploadThroughput: 750 * 1024 / 8});
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: cpu});
  await page.addInitScript(() => {
    window.__lt = 0; // main-thread time in long tasks (>50 ms)
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt += e.duration; }).observe({type: 'longtask', buffered: true}); } catch {}
  });
  const reqs = [];
  page.on('requestfinished', r => reqs.push({r, at: Date.now() - t0}));
  let t0 = Date.now();
  const at = {}, bytesAt = {};
  const mark = async (name) => {
    at[name] = Date.now() - t0;
    bytesAt[name] = await bytesSoFar();
  };
  const bytesSoFar = async () => {
    let n = 0;
    for (const {r, at: t} of reqs) { if (t > Date.now() - t0) continue; const s = await r.sizes().catch(() => ({responseBodySize: 0})); n += s.responseBodySize || 0; }
    return n;
  };
  t0 = Date.now();
  await page.goto(url, {waitUntil: 'commit'});
  await page.locator('#bPlay').waitFor({state: 'visible', timeout: timeoutMs});
  await mark('home');
  if (process.env.FL_DEBUG) console.error(label, 'home', at.home);
  const longBeforeHome = await page.evaluate(() => window.__lt);
  await page.locator('#bPlay').tap();
  await page.locator('#stage .word').waitFor({state: 'visible', timeout: timeoutMs});
  await mark('word');
  if (flag('until-word')) { // home and first word only: the judge and repeat numbers are not needed (quick A/B of load order)
    const longAll = await page.evaluate(() => window.__lt);
    await page.close();
    return {label, at, bytesAt, transfer: bytesAt.word, modelState: 'skipped', engine: '-', judgeMs: 0, longBeforeHomeMs: Math.round(longBeforeHome), longTotalMs: Math.round(longAll), requests: []};
  }
  // judge: the model is ready once the judge reports it; a real answer must come back scored by the embedding engine
  let modelState = 'loading';
  for (let waited = 0; ; waited += 5000) { // poll the judge's own status; its progress shows in the debug log
    const st = await page.evaluate(() => window.__deepstack?.modelStatus?.() || {});
    if (process.env.FL_DEBUG && waited % 15000 === 0) console.error(label, 'model', Date.now() - t0, st.state, st.loaded, st.total);
    modelState = st.state || 'unknown';
    if (st.state === 'ready' || st.state === 'error') break;
    if (waited > timeoutMs) break; // a visit that never gets the model still reports everything before this point
    await new Promise(r => setTimeout(r, 5000));
  }
  await mark('model');
  if (process.env.FL_DEBUG) console.error(label, 'model', at.model, modelState);
  const judged = modelState !== 'ready' ? {engine: 'not ready', ms: 0} : await page.evaluate(async () => {
    const d = window.__deepstack; const ws = (await (await fetch('/data/words.json')).json()).words.slice(10, 12);
    const t = performance.now();
    const r = await d.judge(ws[0].def.slice(0, 100), {...ws[0], concepts: ws[0].concepts || [], hint: null, curated: false});
    return {engine: r.engine, ms: Math.round(performance.now() - t)};
  });
  await mark('judge');
  const longAll = await page.evaluate(() => window.__lt);
  const transfer = await bytesSoFar();
  const list = (await Promise.all(reqs.map(async ({r, at}) => {
    const s = await r.sizes().catch(() => ({responseBodySize: 0}));
    return {url: r.url().replace(/^https?:\/\/[^/]+/, '').replace(/\?v=[0-9a-f]+/, ''), bytes: s.responseBodySize || 0, doneAt: at};
  }))).sort((a, b) => a.doneAt - b.doneAt);
  await page.close();
  return {label, at, bytesAt, transfer, modelState, engine: judged.engine, judgeMs: judged.ms, longBeforeHomeMs: Math.round(longBeforeHome), longTotalMs: Math.round(longAll), requests: list};
}

const ctx = await browser.newContext({viewport: {width: vw, height: vh}, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, serviceWorkers: 'allow'});
const runs = [];
runs.push(await visit(ctx, 'first visit'));
if (!flag('no-repeat') && !flag('until-word')) {
  // let the service worker finish its install and precache the data before the returning visit
  await new Promise(r => setTimeout(r, 2000));
  runs.push(await visit(ctx, 'repeat visit'));
}
await browser.close(); server.close();

const fmtKB = b => (b / 1024 / 1024).toFixed(2) + ' MB';
const pad = (s, n) => String(s).padStart(n);
console.log(`first-load: ${vw}x${vh}@${dpr}x, ${rtt} ms RTT, ${kbps} kbps down, CPU ${cpu}x`);
console.log('visit          home     first word   model ready   first judged answer   bytes at home   bytes at word   bytes total');
for (const v of runs) {
  console.log(`${v.label.padEnd(14)} ${pad(v.at.home, 6)} ms ${pad(v.at.word, 9)} ms ${pad(v.at.model, 9)} ms ${v.modelState === 'ready' ? 'ready' : v.modelState.padStart(5)}  ${pad(v.engine + (v.judgeMs ? ' ' + v.judgeMs : ''), 18)} ${v.judgeMs ? 'ms' : '  '} ${pad(fmtKB(v.bytesAt.home), 15)} ${pad(fmtKB(v.bytesAt.word), 15)} ${pad(fmtKB(v.transfer), 12)}`);
  console.log(`  main-thread long tasks before home: ${v.longBeforeHomeMs} ms, whole visit: ${v.longTotalMs} ms`);
  const big = v.requests.filter(q => q.bytes > 20000).map(q => `  ${String(Math.round(q.doneAt / 100) / 10).padStart(6)} s  ${fmtKB(q.bytes).padStart(9)}  ${q.url}`);
  console.log(big.join('\n'));
}
if (jsonOut) await writeFile(jsonOut, JSON.stringify({rtt, kbps, cpu, viewport: [vw, vh], dpr, runs}, null, 2));
