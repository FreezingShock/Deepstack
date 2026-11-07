// Input-to-feedback latency guard. Serves a built dist/ and, in headless Chromium with the CPU throttled 4x (a mid phone),
// measures how long three things take from the input to the next painted frame (Event Timing, the same number a user feels):
//   roomSwitch  ] key on the home screen walks to the next topic room (the colours glide, the fire stays)
//   bookOpen    press Settings in the top bar (a book opens from the button)
//   submit      Enter in the answer slip of a run (the slip locks and says it is being read)
// and checks one ordering rule that a budget cannot see on a fast machine:
//   roomOrder   the room's save, word lists and home rebuild run AFTER the first frame of the glide has painted. The
//               check schedules a timer from the first animation frame after the key; the first save of the switch must
//               come after that timer. A continuation that resolves in the frame's own callbacks fails it.
// Budgets are generous on purpose (CI runners are noisy): they catch a return to the slow path, not a few percent.
// Runs at the default motion setting (the feel users get). Usage: npm run build && node scripts/latency-budget.mjs
//   [--dist dist] [--cpu 4] [--runs 3] [--json out.json] [--no-fail]
// Set CHROMIUM_PATH if Playwright's browser is missing. Skips (exit 0) without a browser.
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const dist = resolve(arg('dist', 'dist')), cpu = +arg('cpu', 4), runs = +arg('runs', 3), jsonOut = arg('json', '');
const noFail = process.argv.includes('--no-fail');
// Milliseconds from input to next paint, median of `runs`, at `cpu`x throttling. Measured on the code this PR fixed:
// before it, desktop room switch ~570-750 ms; after it ~430-520 ms. Budgets sit above the fixed numbers and catch a return to the slow path.
const BUDGET = {
  idleFillsPerSec: 6000,
  desktop: {roomSwitch: 650, bookOpen: 600, submit: 500},
  phone: {roomSwitch: 600, bookOpen: 300, submit: 250},
};
const VIEWPORTS = {desktop: {viewport: {width: 1280, height: 800}}, phone: {viewport: {width: 390, height: 800}, isMobile: true, hasTouch: true}};

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
try { ({chromium} = await import('playwright')); } catch { console.log('latency-budget: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('latency-budget: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const R = {cpu, runs, rooms: {}};

// A seeded save with every topic room started, so the ] key walks to a room that has its own Daily and streak.
const today = new Date().toISOString().slice(0, 10);
const ROOM_IDS = ['history', 'math', 'science', 'english', 'art', 'body'];
const seed = {shelf: [], sound: false, streak: {last: today, n: 2}, room: 'hall',
  rooms: Object.fromEntries(ROOM_IDS.map(id => [id, {daily: {}, rating: undefined, streak: {last: today, n: 3}}]))};

// Page hooks, installed before the app runs: Event Timing entries, long tasks, and the save/timer order for the room walk.
const HOOKS = () => {
  window.__ev = []; window.__order = []; window.__seq = 0; window.__armed = false; window.__fills = 0;
  const fillRect = CanvasRenderingContext2D.prototype.fillRect; // counts canvas fills: the idle world's cost in kind
  CanvasRenderingContext2D.prototype.fillRect = function (...a) { window.__fills++; return fillRect.apply(this, a); };
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__ev.push([e.name, e.duration]); }).observe({type: 'event', durationThreshold: 16, buffered: true});
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    if (window.__armed && k === 'deepstack.v1' && !window.__order.includes('save')) window.__order.push('save', ++window.__seq);
    return setItem.call(this, k, v);
  };
};
const SEEDKEY = 'latency-budget-seeded';

async function session(vpName, fn) {
  const ctx = await browser.newContext({...VIEWPORTS[vpName], serviceWorkers: 'block'});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => problems.push(`${vpName}: pageerror ${e.message}`));
  await page.addInitScript(([s, k]) => { try { if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); localStorage.setItem('deepstack.v1', JSON.stringify(s)); } } catch {} }, [seed, SEEDKEY]);
  await page.addInitScript(HOOKS);
  const cdp = await ctx.newCDPSession(page);
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#home').waitFor({state: 'visible', timeout: 60000});
  await page.waitForFunction(() => document.querySelector('#home .rm-ring') && document.querySelector('.hearth'), null, {timeout: 60000});
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: cpu});
  await page.waitForTimeout(2500); // boot, intro and the first paints finish before anything is timed
  try { return await fn(page); } finally { await ctx.close().catch(() => {}); }
}

const clearEv = page => page.evaluate(() => { window.__ev.length = 0; });
const firstDur = (page, name) => page.evaluate(n => { const e = window.__ev.find(x => x[0] === n); return e ? Math.round(e[1]) : null; }, name);
const median = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };

// 1. the room walk: budget and ordering, from one session per run
for (const vpName of Object.keys(VIEWPORTS)) {
  const walk = {roomSwitch: [], order: []};
  for (let i = 0; i < runs; i++) {
    await session(vpName, async page => {
      await clearEv(page);
      await page.evaluate(() => { window.__armed = true; window.__order = []; window.__seq = 0;
        // timer from the first animation frame after the key: it must fire before the room's first save
        requestAnimationFrame(() => setTimeout(() => { window.__order.push('timer', ++window.__seq); }, 0)); });
      await page.keyboard.press(']');
      await page.waitForTimeout(1500);
      walk.roomSwitch.push(await firstDur(page, 'keydown'));
      const o = await page.evaluate(() => window.__order);
      walk.order.push(o);
    });
  }
  const rs = median(walk.roomSwitch);
  R.rooms[vpName] = {roomSwitch: rs, roomSwitchRuns: walk.roomSwitch};
  if (rs == null) problems.push(`${vpName}: room switch never produced an input event timing`);
  else if (rs > BUDGET[vpName].roomSwitch) problems.push(`${vpName} room switch keydown -> paint ${rs} ms > budget ${BUDGET[vpName].roomSwitch} ms (4x CPU, median of ${runs})`);
  if (vpName === 'desktop') {
    // The rule: the timer scheduled from the first frame must run before the first save of the switch.
    for (const o of walk.order) {
      const t = o.indexOf('timer'), s = o.indexOf('save');
      if (s < 0) { problems.push('desktop room walk never saved the room'); break; }
      if (t < 0 || s < t) { problems.push(`desktop room switch saves before the first frame has painted (order ${JSON.stringify(o)}): the glide's paint waits for the room's work`); break; }
    }
    R.roomOrder = walk.order.every(o => o.indexOf('timer') >= 0 && o.indexOf('timer') < o.indexOf('save')) ? 'ok' : 'fail';
  }
}

// 1b. the idle home world: canvas fills per second at 4x. Row 0's shelf is cached; drawn live it was ~2300 fills a frame (~18000 a second).
{
  const fillsPerSec = await session('desktop', async page => page.evaluate(() => new Promise(res => { window.__fills = 0; const t0 = performance.now(); setTimeout(() => res(Math.round(window.__fills / ((performance.now() - t0) / 1000))), 2000); })));
  R.idleFillsPerSec = fillsPerSec;
  if (fillsPerSec > BUDGET.idleFillsPerSec) problems.push(`idle home: ${fillsPerSec} canvas fills a second > budget ${BUDGET.idleFillsPerSec} (4x CPU)`);
}

// 2. settings book open, and 3. answer submit: one session per run each
for (const vpName of Object.keys(VIEWPORTS)) {
  const book = [], sub = [];
  for (let i = 0; i < runs; i++) {
    await session(vpName, async page => {
      await clearEv(page);
      await page.locator('#bSettings').click({force: true}).catch(() => {});
      await page.waitForTimeout(1500);
      book.push(await firstDur(page, 'pointerdown'));
    });
    await session(vpName, async page => {
      await page.locator('#bPlay').click({force: true}).catch(() => {});
      const ta = page.locator('#ans');
      await ta.waitFor({state: 'visible', timeout: 60000}).catch(() => {});
      await page.waitForTimeout(1500);
      if (!(await ta.count())) { sub.push(null); return; }
      await ta.fill('a small piece of furniture for sitting');
      await clearEv(page);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      sub.push(await firstDur(page, 'keydown'));
    });
  }
  const b = median(book), s = median(sub);
  R.rooms[vpName] = {...R.rooms[vpName], bookOpen: b, submit: s};
  if (b == null) problems.push(`${vpName}: settings book never produced an input event timing`);
  else if (b > BUDGET[vpName].bookOpen) problems.push(`${vpName} book open click -> paint ${b} ms > budget ${BUDGET[vpName].bookOpen} ms`);
  if (s == null) problems.push(`${vpName}: answer submit never reached (no run started)`);
  else if (s > BUDGET[vpName].submit) problems.push(`${vpName} answer submit Enter -> paint ${s} ms > budget ${BUDGET[vpName].submit} ms`);
}

await browser.close(); server.close();
console.log(`latency-budget: input to next paint at ${cpu}x CPU, median of ${runs} (ms)`);
console.log('view      room switch   book open   submit   room order');
for (const v of Object.keys(VIEWPORTS)) {
  const r = R.rooms[v] || {};
  console.log(`${v.padEnd(9)} ${String(r.roomSwitch ?? '-').padStart(11)} ${String(r.bookOpen ?? '-').padStart(11)} ${String(r.submit ?? '-').padStart(8)}   ${v === 'desktop' ? R.roomOrder : ''}`);
}
if (jsonOut) await writeFile(jsonOut, JSON.stringify({R, problems}, null, 2));
if (problems.length) { console.log('\nlatency-budget FAILED:\n - ' + problems.join('\n - ')); if (!noFail) process.exit(1); }
else console.log('latency-budget: within budget');
