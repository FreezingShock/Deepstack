// Nemesis guard: the wanted poster on the Almanac's Closeness leaf must fit its page with no clipped or overflowing text and no
// sideways scroll, at 375 px and desktop, with reduced motion on, in every topic room and the Reading Room. It also plays the
// duel once: Rematch on the poster starts a one-word run, an answer is judged, and the save records the swing.
// Drives the built app (dist/, or DIST=<folder>) in headless Chromium with a seeded save. Writes screenshots to OUT when set.
// Skips (exit 0) without a browser. Run after `npm run build`.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {ROOMS, HALL} from '../src/core/rooms.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = process.env.DIST || join(process.cwd(), 'dist');
const OUT = process.env.OUT || '';
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
if (!chromium) { console.log('nemesis-check: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('nemesis-check: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = m => { if (problems.length < 40) problems.push(m); };
const WORDS = ['ephemeral', 'sesquipedalian', 'lucid', 'tempest', 'alacrity', 'obstinate', 'serendipity', 'pragmatic', 'mellifluous', 'taciturn', 'ubiquitous', 'vestige', 'laconic', 'ardent', 'cadence', 'erudite', 'fastidious', 'gregarious', 'halcyon', 'insidious'];

/** Two weeks of Daily books in the room, ephemeral missed hardest, so the poster has a Nemesis and the list is full. Deterministic. */
function seedFor(room) {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const end = Date.UTC(2026, 10, 6, 12), books = [];
  for (let d = 14; d >= 0; d--) {
    for (let i = 0; i < 7; i++) {
      const w = WORDS[(d * 7 + i) % WORDS.length];
      const score = w === 'ephemeral' ? 12 : Math.max(0, Math.min(100, Math.round(30 + rnd() * 60)));
      books.push({w, pos: 'adjective', def: 'lasting for a very short time', score, tier: Math.min(6, Math.floor(score / 16)), answer: 'x', t: end - d * 864e5 + i * 6e4, mode: 'daily', ft: 40, room: room === HALL ? undefined : room});
    }
  }
  const day = {depth: 300, avg: 50, best: 3, books};
  return {shelf: [], daily: room === HALL ? {'2026-11-06': day} : {}, rooms: room === HALL ? {} : {[room]: {daily: {'2026-11-06': day}}}, streak: {last: '2026-11-06', n: 2}, bestFloor: 3, bestDepth: 300, sound: false, room};
}

async function open(label, {width, height, room, seed = seedFor(room), duel = false}) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce', timezoneId: 'UTC', deviceScaleFactor: OUT ? 2 : 1});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: page error ${e.message}`));
  await page.route('**/*', r => (BLOCKED.test(r.request().url()) ? r.abort() : r.continue()));
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), seed);
  await page.goto(url);
  await page.waitForSelector('#bStats', {state: 'visible', timeout: 15000});
  await page.waitForTimeout(800);
  await page.click('#bStats', {timeout: 5000});
  await page.waitForSelector('.bk-spread.menu .alm', {state: 'attached', timeout: 10000});
  await page.waitForTimeout(400);
  for (let turn = 0; turn < 12; turn++) {
    const shown = await page.evaluate(() => [...document.querySelectorAll('.nm')].some(a => a.getBoundingClientRect().width > 0));
    if (shown) break;
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(350);
  }
  await page.waitForTimeout(300);
  return {ctx, page};
}

async function fitCheck(label, {width, height, room}) {
  const {ctx, page} = await open(label, {width, height, room});
  try {
    const report = await page.evaluate(() => {
      const out = [];
      const poster = document.querySelector('.bk-spread.menu .nm');
      if (!poster) return ['no Nemesis poster on the Closeness leaf'];
      if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
      const page = poster.closest('.alm.pg');
      if (page && (page.scrollWidth > page.clientWidth + 1)) out.push('the Closeness leaf is wider than its page');
      if (poster.scrollWidth > poster.clientWidth + 1) out.push('the poster is wider than itself');
      /* text overflow measured on the text itself (a pen-ink underline hangs past its button on purpose, so buttons are not checked by box) */
      for (const n of poster.querySelectorAll('.nm-w, .nm-top span, .nm-def, .nm-meta, .nm-note, .nm-seal, .nm-go')) {
        if (!n.getBoundingClientRect().width) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        const tw = rg.getBoundingClientRect(), box = n.getBoundingClientRect();
        if (tw.width && (tw.right > box.right + 1 || tw.left < box.left - 1)) out.push(`clipped "${n.textContent.trim().slice(0, 30)}"`);
      }
      const p = page ? page.parentElement.getBoundingClientRect() : null, r = poster.getBoundingClientRect();
      if (p && (r.right > p.right + 1 || r.left < p.left - 1)) out.push('the poster runs past the page edge');
      return out;
    });
    for (const m of report) fail(`${label}: ${m}`);
    if (OUT) {
      await mkdir(OUT, {recursive: true});
      /* clip to the leaf's box (an element screenshot waits on stability, which a phone page with a tilted poster can miss) */
      const box = await page.locator('.alm.pg:has(.nm)').first().boundingBox({timeout: 5000});
      if (box) await page.screenshot({path: join(OUT, `${process.env.PHASE || 'shot'}-${label}.png`), clip: box, timeout: 10000});
      else fail(`${label}: no box for the Closeness leaf`);
    }
  } catch (e) { fail(`${label}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
}

async function duelFlow() {
  const label = 'duel desktop hall';
  const {ctx, page} = await open(label, {width: 1280, height: 800, room: HALL});
  try {
    await page.click('.nm-go', {timeout: 5000});
    await page.waitForSelector('#ans', {state: 'visible', timeout: 15000});
    const label1 = await page.textContent('.wlabel');
    if (!/Nemesis/.test(label1)) fail(`${label}: the duel run is not labelled Nemesis (${label1})`);
    if (OUT) { await mkdir(OUT, {recursive: true}); await page.screenshot({path: join(OUT, 'duel-desktop-1280.png')}); }
    await page.fill('#ans', 'lasting only a very short while');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#go', {state: 'visible', timeout: 30000}); // the result card: its button turns to the descent's end
    if (OUT) await page.screenshot({path: join(OUT, 'duel-card-1280.png')});
    await page.click('#go');
    await page.waitForSelector('#final .sheet.fin', {state: 'visible', timeout: 30000});
    await page.waitForTimeout(1500);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('deepstack.v1')).nemesis);
    const weeks = Object.values((saved && saved.weeks) || {});
    if (!weeks.length || !weeks[0].duel) fail(`${label}: the swing was not recorded in the save`);
    const shareLine = await page.evaluate(() => document.querySelector('#final')?.textContent || '');
    if (!/Nemesis/.test(shareLine)) fail(`${label}: the result sheet does not say Nemesis`);
    if (OUT) { await page.screenshot({path: join(OUT, 'duel-result-1280.png')}); }
  } catch (e) { fail(`${label}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
}

for (const r of [{id: HALL}, ...ROOMS.filter(x => x.id !== HALL)]) {
  await fitCheck(`desktop-${r.id}`, {width: 1280, height: 800, room: r.id});
  await fitCheck(`phone-${r.id}`, {width: 375, height: 740, room: r.id});
}
await duelFlow();

await browser.close(); server.close();
if (problems.length) { console.error('nemesis-check: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log('nemesis-check: ok (every room, desktop and 375 px, reduced motion; duel recorded)');
