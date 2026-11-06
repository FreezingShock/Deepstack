// Ember Log guard: the Librarian's Card Streak row (desktop) and the top-bar streak chip (phones, where the card is
// hidden) must both open the Ember Log, in every room, with and without reduced motion, and the chip must never overlap
// the bar's buttons at 320 / 375 px. The book's streak must be the room's own streak. Drives the built app in headless
// Chromium; skips (exit 0) without a browser. Run after `npm run build`.
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
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(root, p)));
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); }
catch { try { ({chromium} = (await import('node:module')).createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('ember-log: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('ember-log: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = m => { if (problems.length < 30) problems.push(m); };
const today = new Date().toISOString().slice(0, 10);
const STREAK = {hall: 2, history: 7, math: 3, science: 5, english: 4, art: 11, body: 9};
const seedFor = room => {
  const rooms = Object.fromEntries(ROOMS.filter(r => r.id !== HALL).map(r => [r.id, {daily: {}, rating: undefined, streak: {last: today, n: STREAK[r.id]}}]));
  return {shelf: [], sound: false, bestFloor: 1, streak: {last: today, n: STREAK.hall}, rooms, room};
};

async function run(label, {width, height, reduce, room, via}) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: reduce ? 'reduce' : 'no-preference'});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: page error ${e.message}`));
  await page.route('**/*', r => BLOCKED.test(r.request().url()) ? r.abort() : r.continue());
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), seedFor(room));
  await page.goto(url);
  try {
    const sel = via === 'row' ? '.lg-row#bStreak' : '.bg-streak';
    await page.waitForSelector(sel, {state: 'visible', timeout: 15000});
    await page.waitForTimeout(1500);
    if (via === 'chip') { // the chip must clear the bar's buttons
      const bad = await page.evaluate(() => {
        const c = document.querySelector('.bg-streak').getBoundingClientRect();
        return [...document.querySelectorAll('#barNav button, #mark')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect())
          .some(r => r.left < c.right - 1 && r.right > c.left + 1 && r.top < c.bottom - 1 && r.bottom > c.top + 1);
      });
      if (bad) fail(`${label}: streak chip overlaps the top bar buttons`);
    }
    await page.click(sel, {timeout: 5000});
    await page.waitForSelector('.bk-spread .emb', {timeout: 8000});
    await page.waitForTimeout(reduce ? 200 : 1500);
    const t = await page.evaluate(() => (document.querySelector('.bk-spread .emb') || {}).textContent || '');
    const n = STREAK[room];
    if (!new RegExp(`${n} days? burning`).test(t)) fail(`${label}: Ember Log should say ${n} days burning, got "${t.slice(0, 60)}"`);
  } catch (e) { fail(`${label}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
}

for (const r of ROOMS) {
  await run(`desktop ${r.id}`, {width: 1280, height: 800, reduce: false, room: r.id, via: 'row'});
  await run(`phone ${r.id}`, {width: 375, height: 740, reduce: false, room: r.id, via: 'chip'});
}
await run('desktop reduced motion', {width: 1280, height: 800, reduce: true, room: 'art', via: 'row'});
await run('phone 375 reduced motion', {width: 375, height: 740, reduce: true, room: 'body', via: 'chip'});
await run('phone 320', {width: 320, height: 640, reduce: false, room: 'math', via: 'chip'});

await browser.close(); server.close();
if (problems.length) { console.error('ember-log: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log('ember-log: ok');
