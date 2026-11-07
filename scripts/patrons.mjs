// Patrons book guard: serves dist/, opens the Patrons book on the home shelf at phone and desktop sizes with reduced
// motion on, and fails if a page element spills out of its spread, a control is under 44px, the page scrolls sideways,
// or the book throws. Two states are checked: a fresh desk (a request waits) and a desk already served today.
// Screenshots go to OUT (default screenshots/patrons) so reviewers can compare before and after.
// Usage: npm run build && node scripts/patrons.mjs [--shots] [--room=history]
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const SHOTS = 'shots' in args;
const OUT = args.out || 'screenshots/patrons';
const ROOM = args.room || 'history';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'};
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
if (!chromium) { console.log('patrons: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('patrons: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

// Same offline rules as smoke.mjs: fonts and the embedding model are third parties, the lexical judge is deterministic.
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const T = 15000;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* A save that has played before: the room is set and the desk is either fresh or already served today. */
function saveFor(state) {
  const day = today();
  const patrons = state === 'served'
    ? {served: {archivist: 2, clerk: 1}, last: Object.fromEntries(['archivist', 'clerk', 'apothecary', 'bookbinder', 'varnisher', 'trainer'].map(id => [id, day])), used: [], ledger: [
        {day, p: 'archivist', w: 'lucid', k: 'word', s: 88, t: 5, a: 'clear'},
        {day: '2026-11-05', p: 'clerk', w: 'tally', k: 'define', s: 61, t: 3, a: 'a count'}]}
    : {served: {archivist: 2}, last: {}, used: [], ledger: []};
  // the first-visit lines are marked seen so no tooltip sits over the page in a capture
  const seen = {'home.daily': 1, 'home.unlimited': 1, 'home.doors': 1, 'home.ledger': 1, slip: 1, candle: 1, hint: 1};
  return {room: ROOM, patrons, seen, rooms: {}, shelf: [], daily: {}, streak: {last: '', n: 0}, sound: false};
}

const checkBook = page => page.evaluate(() => {
  const out = {spill: [], small: [], overflowX: document.documentElement.scrollWidth > innerWidth + 1, found: false};
  const sp = document.querySelector('.bk-spread');
  if (!sp) return out;
  out.found = true;
  const box = sp.getBoundingClientRect();
  for (const el of sp.querySelectorAll('.pt-desk, .pt-req, .pt-ask, .pt-say, .pt-reward, .pt-links, .pt-link, .pt-send, .pt-ans, .pt-svg, .pg-body, .pg-title, .pg-label, .pg-list li, .pt-tally')) {
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    if (r.right > box.right + 1 || r.left < box.left - 1 || r.bottom > box.bottom + 1) out.spill.push(`${el.className || el.tagName} ${Math.round(r.right)}>${Math.round(box.right)}`);
  }
  for (const el of sp.querySelectorAll('.pt-send, .pt-link, .pt-ans')) {
    const r = el.getBoundingClientRect();
    if (r.width && r.height < 43.5) out.small.push(`${el.className} ${Math.round(r.height)}px`);
  }
  return out;
});

async function openBook(page, shot) {
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForSelector('#bPat', {timeout: T, state: 'attached'});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.click('#bPat', {timeout: T});
  await page.waitForSelector('.bk-spread .pt-desk, .bk-spread .pt-req', {timeout: T});
  await page.waitForTimeout(900); // the book settles
  if (shot) await page.screenshot({path: shot, scale: 'device'});
}

/* Answers: a wrong word gets the patron's refusal and no Shelf book; the right word (or the definition, when the
   patron asks for one) enters the Shelf, the desk is served for the day and the page shows the reward. */
async function answerFlow(page, tag) {
  await openBook(page, null);
  const req = await page.evaluate(() => {
    const r = globalThis.__deepstackPatron && globalThis.__deepstackPatron.request();
    return r ? {kind: r.kind, word: r.word.w, def: r.word.def} : null;
  });
  if (!req) { problems.push(`${tag}: no request on the desk`); return; }
  const type = text => page.evaluate(t => { const a = document.querySelector('#ptAns'); a.value = t; a.dispatchEvent(new Event('input')); document.querySelector('#ptSend').click(); }, text);
  await type('zqxv');
  await page.waitForFunction(() => /./.test((document.querySelector('#ptSay') || {}).textContent || ''), null, {timeout: T});
  const miss = await page.textContent('#ptSay');
  if (await page.$('.pt-reward')) problems.push(`${tag}: a wrong word was served`);
  if (!miss.trim()) problems.push(`${tag}: no refusal line for a wrong word`);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('deepstack.v1') || '{}').shelf?.length || 0);
  await type(req.kind === 'word' ? req.word : req.def);
  await page.waitForSelector('.pt-reward', {timeout: T}).catch(() => {});
  await page.waitForTimeout(300);
  const served = await page.$('.pt-reward') !== null;
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('deepstack.v1') || '{}').shelf?.length || 0);
  if (req.kind === 'word' && !served) problems.push(`${tag}: the right word was not served`);
  if (served && after !== before + 1) problems.push(`${tag}: served, but the Shelf went ${before} -> ${after}`);
  if (!served && after !== before) problems.push(`${tag}: a shelf book was written without a commendation`);
  if (served) {
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('deepstack.v1') || '{}').patrons);
    if (!saved || !Object.values(saved.served || {}).some(n => n >= 1)) problems.push(`${tag}: no commendation saved`);
    if (await page.$('#ptSend') !== null) problems.push(`${tag}: a served desk still offers a slip`);
  }
  if (SHOTS) await page.screenshot({path: `${OUT}/answer-${tag}-${served ? 'served' : 'refused'}.png`, scale: 'device'});
  // the ledger spread: turn the page with the arrow key and check it the same way
  for (let i = 0; i < 3 && !(await page.locator('.pt-roll').first().isVisible().catch(() => false)); i++) {
    await page.evaluate(() => document.activeElement && document.activeElement.blur()); // keys turn the book only when the slip is not focused
    await page.keyboard.press('ArrowRight'); // one turn on desktop, two on a phone (one page at a time)
    await page.waitForTimeout(900);
  }
  const led = await checkBook(page);
  for (const x of led.spill) problems.push(`${tag}: ledger spills out of its page: ${x}`);
  for (const x of led.small) problems.push(`${tag}: ledger control under 44px: ${x}`);
  if (led.overflowX) problems.push(`${tag}: the ledger page scrolls sideways`);
  if (!(await page.locator('.pt-roll').first().isVisible().catch(() => false))) problems.push(`${tag}: the ledger page did not open`);
  if (SHOTS) await page.screenshot({path: `${OUT}/ledger-${tag}.png`, scale: 'device'});
}

const VIEWS = [
  {name: '375', viewport: {width: 375, height: 667}, dsf: 2},
  {name: '1280', viewport: {width: 1280, height: 800}, dsf: 1},
];
const STATES = ['fresh', 'served', 'answer'];

try {
  await mkdir(OUT, {recursive: true});
  for (const view of VIEWS) for (const state of STATES) {
    const ctx = await browser.newContext({viewport: view.viewport, deviceScaleFactor: view.dsf, reducedMotion: 'reduce'});
    await ctx.route(BLOCKED, route => route.abort());
    await ctx.addInitScript(s => { try { localStorage.setItem('deepstack.v1', JSON.stringify(s)); } catch {} }, saveFor(state));
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    const tag = `${view.name}-${ROOM}-${state}`;
    try {
      if (state === 'answer') { await answerFlow(page, tag); await ctx.close(); continue; }
      await openBook(page, SHOTS ? `${OUT}/${state === 'fresh' ? 'desk' : 'served'}-${tag}.png` : null);
      const r = await checkBook(page);
      if (!r.found) problems.push(`${tag}: the Patrons book did not open`);
      if (r.overflowX) problems.push(`${tag}: the page scrolls sideways`);
      for (const s of r.spill) problems.push(`${tag}: spills out of its page: ${s}`);
      for (const s of r.small) problems.push(`${tag}: control under 44px: ${s}`);
      if (state === 'fresh' && await page.$('#ptSend') === null) problems.push(`${tag}: no answer slip on a fresh desk`);
      if (state === 'served' && await page.$('#ptSend') !== null) problems.push(`${tag}: a served desk still offers a slip`);
    } catch (e) {
      problems.push(`${tag}: ${e.message.split('\n')[0]}`);
    }
    for (const e of errs) problems.push(`${tag}: ${e}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error('patrons: ' + problems.length + ' problem(s)');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`patrons: ok (${VIEWS.length} sizes, ${STATES.length} states, room ${ROOM}${SHOTS ? ', screenshots in ' + OUT : ''})`);
