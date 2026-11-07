// Almanac progress guard: the progress spread (words met per room, closeness over time, hardest words, longest chain)
// must fit its pages with no clipped or wrapped-off labels, no sideways scroll and no overflowing text, at 375 px and
// desktop, with reduced motion on, in every topic room and the Reading Room. Drives the built app in headless Chromium
// with a seeded save, turns to the progress spread and measures it. Skips (exit 0) without a browser. Run after `npm run build`.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {ROOMS, HALL} from '../src/core/rooms.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(root, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); }
catch { try { ({chromium} = (await import('node:module')).createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('almanac-progress: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('almanac-progress: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = m => { if (problems.length < 40) problems.push(m); };
const TIER_NAMES = ['Pamphlet', 'Paperback', 'Hardbound', 'Folio', 'Codex', 'Grimoire', 'Apocrypha'];
const WORDS = ['ephemeral', 'sesquipedalian', 'lucid', 'tempest', 'alacrity', 'obstinate', 'serendipity', 'pragmatic', 'mellifluous', 'taciturn', 'ubiquitous', 'vestige', 'laconic', 'ardent', 'cadence', 'erudite', 'fastidious', 'gregarious', 'halcyon', 'insidious'];

/** Three weeks of Daily books in every room, with chains, so every list and the chart are full. Deterministic. */
function seedFor(room) {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const end = Date.UTC(2026, 10, 6, 12);
  const tierFor = s => Math.min(6, Math.floor(s / 16));
  const rooms = {}, hall = {};
  for (const r of ROOMS) {
    const daily = {};
    for (let d = 20; d >= 0; d--) {
      if (d > 0 && rnd() < 0.3) continue;
      const day = new Date(end - d * 864e5).toISOString().slice(0, 10), books = [];
      let chain = 0;
      for (let i = 0; i < 7; i++) {
        const score = Math.max(0, Math.min(100, Math.round(25 + rnd() * 70)));
        chain = tierFor(score) >= 3 ? chain + 1 : 0;
        const b = {w: WORDS[Math.floor(rnd() * WORDS.length)] + (i % 3 ? '' : 'ly'), score, tier: tierFor(score), answer: 'x', t: end - d * 864e5 + i * 6e4, mode: 'daily', ft: 40};
        if (r.id !== HALL) b.room = r.id;
        if (chain >= 2) b.combo = {n: chain, mult: 1.25, ft: 8};
        books.push(b);
      }
      daily[day] = {depth: 300, avg: 50, best: 3, books};
    }
    if (r.id === HALL) Object.assign(hall, daily); else rooms[r.id] = {daily, streak: {last: '', n: 2}};
  }
  const shelf = [];
  for (let i = 0; i < 30; i++) shelf.push({w: WORDS[i % WORDS.length] + 'x', score: Math.round(20 + rnd() * 75), tier: 2, answer: 'x', room: ROOMS[1 + (i % (ROOMS.length - 1))].id, t: end - (i % 19) * 864e5, mode: 'unlimited', ft: 30});
  return {shelf, daily: hall, streak: {last: '2026-11-06', n: 4}, bestFloor: 3, bestDepth: 300, sound: false, room, rooms};
}

async function run(label, {width, height, room}) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce', timezoneId: 'UTC'});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: page error ${e.message}`));
  await page.route('**/*', r => (BLOCKED.test(r.request().url()) ? r.abort() : r.continue()));
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), seedFor(room));
  try {
    await page.goto(url);
    await page.waitForSelector('#bStats', {state: 'visible', timeout: 15000});
    await page.waitForTimeout(800);
    await page.click('#bStats', {timeout: 5000});
    await page.waitForSelector('.bk-spread.menu .alm', {state: 'attached', timeout: 10000});
    await page.waitForTimeout(400);
    // The progress spread comes after the four Almanac spreads and the rooms and curios spreads, so turn with the arrow key until it shows.
    let shown = false;
    for (let turn = 0; turn < 12 && !shown; turn++) {
      shown = await page.evaluate(() => [...document.querySelectorAll('.alm.pg')].some(a => a.offsetParent && a.getBoundingClientRect().width > 0));
      if (!shown) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(350); }
    }
    if (!shown) { fail(`${label}: the progress pages never came into view`); await ctx.close(); return; }
    await page.waitForTimeout(300);
    /* Every spread is checked, not just the first one that shows: the Closeness page has to fit its frame too.
       A page's content must fit inside its own scroll box (no internal scroll) and inside the page frame. */
    const check = () => page.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
      for (const a of document.querySelectorAll('.alm.pg')) {
        if (!a.getBoundingClientRect().width) continue;
        const p = a.parentElement.getBoundingClientRect(), r = a.getBoundingClientRect();
        const name = a.querySelector('h1').textContent;
        if (a.scrollHeight > a.clientHeight + 2 || r.bottom > p.bottom + 1) out.push(`${name} runs ${Math.round(Math.max(a.scrollHeight - a.clientHeight, r.bottom - p.bottom))}px past its page`);
        const box = a.parentElement;
        if (box.scrollHeight > box.clientHeight + 2) out.push(`${name} scrolls inside its page (${box.scrollHeight - box.clientHeight}px more than the page holds)`);
        for (const d of a.querySelectorAll('*')) {
          if (!d.getBoundingClientRect().width || d.closest('.nm, .pg-chart')) continue;
          const db = d.getBoundingClientRect();
          if (db.bottom > box.getBoundingClientRect().bottom + 1) { out.push(`${name}: "${(d.textContent || d.className).trim().slice(0, 28)}" sits ${Math.round(db.bottom - box.getBoundingClientRect().bottom)}px below its page`); break; }
        }
        if (a.scrollWidth > a.clientWidth + 1) out.push(`${name} is wider than its page`);
      }
      for (const n of document.querySelectorAll('.alm.pg .pg-n, .alm.pg .pg-w, .alm.pg .pg-tier, .alm.pg .pg-hard b')) {
        if (!n.getBoundingClientRect().width) continue;
        if (n.scrollWidth > n.clientWidth + 1) out.push(`clipped label "${n.textContent.trim().slice(0, 30)}"`);
      }
      return out;
    });
    /* what the progress pages must hold, checked once (the pages are all in the book) */
    for (const [sel, msg] of [['.alm.pg .pg-bars li', 'no room bars drawn'], ['.alm.pg .pg-chart', 'no closeness chart drawn'], ['.alm.pg .pg-hard li', 'no hardest words listed']]) {
      if (!(await page.evaluate(q => !!document.querySelector(q), sel))) fail(`${label}: ${msg}`);
    }
    const seen = new Set();
    for (let turn = 0; turn < 14; turn++) {
      for (const m of await check()) if (!seen.has(m)) { seen.add(m); fail(`${label}: ${m}`); }
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(350);
    }
  } catch (e) { fail(`${label}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
}

for (const r of [{id: HALL}, ...ROOMS.filter(x => x.id !== HALL)]) {
  await run(`desktop ${r.id}`, {width: 1280, height: 800, room: r.id});
  await run(`phone ${r.id}`, {width: 375, height: 740, room: r.id});
}

await browser.close(); server.close();
if (problems.length) { console.error('almanac-progress: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log('almanac-progress: ok (every room, desktop and 375 px, reduced motion)');
