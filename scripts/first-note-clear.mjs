// First-time note guard: a first-visit home note (a gold halo and a small panel) must not sit over a card the player opens.
// Seeds a finished Daily so the Results card opens from its "Today's result" book, takes a home note on the first visit,
// then opens a result card by tapping its book. It checks the note was up on home (so the test is not vacuous), and that
// no note is on screen once the card is open, at a phone and a laptop size. Run after `npm run build`; set CHROMIUM_PATH
// if Playwright's own Chromium is missing. Skips (exit 0) without a browser, like the other guards.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.otf': 'font/otf', '.jpg': 'image/jpeg', '.png': 'image/png'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const data = await readFile(join(root, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); }
catch { console.log('first-note-clear: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('first-note-clear: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const SIZES = [[375, 667], [1280, 800]];
const failures = [];

// A shelf of 12 words and a finished Daily for today, so the home room shows "Today's result" and the Results card opens.
const SEED = () => {
  const day = new Date().toISOString().slice(0, 10);
  const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf'];
  const books = words.map((w, i) => ({w, pos: 'noun', def: 'a sample definition for ' + w, score: 40 + i * 7, tier: i % 6, answer: 'an answer for ' + w, skipped: false, ft: 100 + i * 10, verdict: 'A fair try.'}));
  const shelf = [];
  for (let i = 0; i < 12; i++) shelf.push({w: 'word' + i, tier: i % 7, score: 50 + i, t: 1700000000000 + i * 864e5, ft: i * 30, fl: i % 5});
  return {shelf, streak: {last: day, n: 1}, bestDepth: 300, daily: {[day]: {day, books, avg: 61, best: 3, depth: 120, practice: false}}};
};

for (const [w, h] of SIZES) {
  const tag = `${w}x${h}`;
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(seed => { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify(seed)); }, SEED());
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  await page.goto(url);
  await page.waitForSelector('#home', {timeout: 15000});
  // the first-visit note is lit once the home has settled; wait for it rather than sample a moment too early (slow runners)
  await page.waitForSelector('.fcall', {state: 'attached', timeout: 6000}).catch(() => {});
  await page.waitForTimeout(300);
  const onHome = await page.evaluate(() => document.querySelectorAll('.fcall').length);
  if (onHome < 1) failures.push(`${tag}: no first-visit home note was up, so the check would prove nothing`);

  await page.evaluate(() => document.querySelector('#bRes')?.click());
  await page.waitForSelector('#final', {state: 'attached', timeout: 8000}).catch(() => {});
  await page.waitForTimeout(700);
  const opened = await page.evaluate(() => { const b = document.querySelector('.rbook'); if (!b) return false; b.click(); return true; });
  if (!opened) failures.push(`${tag}: no Results book to open`);
  await page.waitForSelector('#cardlayer:not([hidden]) .wrote', {state: 'attached', timeout: 8000}).catch(() => {});
  await page.waitForTimeout(900);

  const left = await page.evaluate(() => {
    const notes = [...document.querySelectorAll('.fcall, .fhalo')];
    const w = document.querySelector('#cardlayer .wrote');
    const r = w && w.getBoundingClientRect();
    const over = r && notes.filter(n => { const b = n.getBoundingClientRect(); return b.right > r.left && b.left < r.right && b.bottom > r.top && b.top < r.bottom; }).length;
    return {notes: notes.length, over: over || 0, card: !!w};
  });
  if (!left.card) failures.push(`${tag}: the result card did not open`);
  if (left.notes) failures.push(`${tag}: ${left.notes} first-time note(s) still on screen over the card`);
  if (errs.length) failures.push(`${tag}: page errors: ${errs.join(' | ')}`);
  console.log(`${tag} checked (home note up: ${onHome}, notes on the card: ${left.notes})`);
  await ctx.close();
}
await browser.close();
server.close();
if (failures.length) { failures.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('first-note-clear: ok');
