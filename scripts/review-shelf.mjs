// Browser guard for the To review view of the Shelf book (src/ui/reviewWire.js, reviewPages.js).
// Seeds a save with missed words, then checks: the tab counts them, contents open the word pages, every word page fits its
// page at phone and desktop widths with the re-try form open, a re-try is answered (or says the librarian is still arriving,
// when the offline judge is not ready), and the re-try adds no book to the shelf. Serves dist/ on its own port.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

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
if (!chromium) { console.log('review-shelf: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('review-shelf: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const OPTIONAL = /\/(models|ort)\//;
const problems = [];
const fail = msg => problems.push(msg);
const T = 15000;

// Seven words still to win back (one at 46 or better, so not one of them), plus one won word and one skipped word.
const day = i => Date.parse('2026-11-0' + (1 + (i % 6)) + 'T12:00:00Z');
const row = (w, answer, score, tier, t) => ({w, pos: 'verb', def: `What ${w} means.`, answer, score, tier, t, fb: {m: ['a missed idea']}, verdict: 'Wide of the mark.', no: 1});
const SEED = {shelf: [
  row('abandon', 'leave it', 22, 1, day(1)), row('lucid', '', 0, 0, day(2)), row('candid', 'honest', 41, 2, day(3)),
  row('tenacious', 'holding on', 9, 0, day(4)), row('obfuscate', 'make hard', 14, 1, day(5)), row('ubiquitous', 'everywhere', 12, 0, day(0)),
  row('laconic', 'brief', 36, 2, day(1)), row('ephemeral', 'short', 58, 3, day(2)), row('ephemeral', 'fleeting', 61, 4, day(3)),
], daily: {}, streak: {last: '', n: 0}, bestDepth: 0, bestFloor: 0, sound: false};
const EXPECT_WORDS = 7;

async function newPage(width, height, seed = SEED) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('rv-seeded')) { localStorage.clear(); localStorage.setItem('deepstack.v1', s); sessionStorage.setItem('rv-seeded', '1'); } }, JSON.stringify(seed));
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => fail(`pageerror: ${e.message}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (BLOCKED.test(m.location()?.url || '')) return;
    if (/Failed to load resource/.test(m.text()) && (!m.location()?.url?.startsWith(url) || OPTIONAL.test(m.location().url))) return;
    fail(`console.error: ${m.text()}`);
  });
  return page;
}

// Every painted page must hold its content: no clipped text and no form running past the foot of the page.
const fits = page => page.evaluate(() => {
  const bad = [];
  for (const pg of document.querySelectorAll('.bs-page .pg-in')) {
    const r = pg.getBoundingClientRect();
    if (!r.width || !r.height) continue; // not on screen
    if (pg.scrollHeight > pg.clientHeight + 2) bad.push(`page overflows by ${pg.scrollHeight - pg.clientHeight}px`);
    for (const el of pg.querySelectorAll('.rv-form:not([hidden]) .rv-go,.rv-form:not([hidden]) .rv-close,.rv-form:not([hidden]) textarea')) {
      if (el.getBoundingClientRect().bottom > r.bottom + 1) bad.push(`${el.className || el.tagName} runs past the page`);
    }
  }
  return bad;
});

// Turn the page with the arrow key (the book's own handler); focus leaves the re-try box first so the key is not typed.
async function turn(page) {
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(700);
}

async function guard(width, height) {
  const tag = `${width}x${height}`;
  const page = await newPage(width, height);
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForSelector('#home:not([hidden]) #bAll', {timeout: T});
  await page.click('#bAll');
  await page.waitForTimeout(2200); // the book flies open and its cover swings back: the pages are readable after that
  await page.waitForSelector('.sv-tab[data-view="review"]', {timeout: T});
  const count = await page.textContent('.sv-tab[data-view="review"] small');
  if (+count !== EXPECT_WORDS) fail(`${tag}: To review shows ${count}, expected ${EXPECT_WORDS}`);
  await page.click('.sv-tab[data-view="review"]');
  await page.waitForSelector('.rv-jump', {state: 'attached', timeout: T});
  const jumps = await page.locator('.rv-jump').count();
  if (jumps !== EXPECT_WORDS) fail(`${tag}: ${jumps} contents rows, expected ${EXPECT_WORDS}`);
  // phone: one page at a time, so turn once to reach the contents
  if (width < 700) await turn(page); // one page at a time on phones: the contents are on the next page
  await page.click('.rv-jump >> nth=0');
  await page.waitForSelector('.rv-entry', {timeout: T});
  const before = await page.evaluate(() => window.__deepstack.S.shelf.length);
  // walk the book page by page: open the re-try on every word that is on screen and check its fit; stop when the
  // pages stop turning. Every word must come up once.
  const seen = new Set();
  const pageMark = () => page.evaluate(() => [...document.querySelectorAll('.bs-page .pg-foot span')].map(x => x.textContent).join(','));
  let mark = '', steps = 0;
  for (;;) {
    const keys = await page.$$eval('.rv-entry', els => els.filter(e => e.getBoundingClientRect().width > 0).map(e => e.dataset.key));
    for (const k of keys) seen.add(k);
    const open = page.locator('.rv-entry:visible .rv-try');
    for (let i = 0; i < await open.count(); i++) await open.nth(i).click();
    await page.waitForTimeout(150);
    for (const b of await fits(page)) fail(`${tag} page ${steps + 1}: ${b}`);
    const next = await pageMark();
    if (next === mark || steps++ > 30) break;
    mark = next;
    await turn(page);
  }
  if (seen.size !== EXPECT_WORDS) fail(`${tag}: the book showed ${seen.size} word pages, expected ${EXPECT_WORDS}`);
  // answer the word on screen (its form is open) from memory: a judged result, or the "still arriving" line
  if (process.env.RV_DEBUG) console.log(tag, 'visible entries', await page.$$eval('.rv-entry', els => els.map(e => [e.dataset.key, e.querySelectorAll('.rv-go').length, e.querySelector('.rv-form').outerHTML.slice(0,300), getComputedStyle(e.querySelector('.rv-go')).display])));
  const last = page.locator('.rv-entry:visible').last();
  await last.locator('.rv-in').fill('to let something go');
  await last.locator('.rv-go').click();
  await page.waitForFunction(() => { const o = [...document.querySelectorAll('.rv-entry .rv-result')].find(x => x.offsetParent && x.textContent.trim()); return !!o && !/Reading/.test(o.textContent); }, null, {timeout: 60000}).catch(() => fail(`${tag}: no answer shown for the re-try`));
  const out = await last.locator('.rv-result').textContent().catch(() => '');
  if (!/\/100|still arriving|word list is still/.test(out)) fail(`${tag}: re-try said "${out}"`);
  const after = await page.evaluate(() => ({shelf: window.__deepstack.S.shelf.length, review: window.__deepstack.S.review || null}));
  if (after.shelf !== before) fail(`${tag}: a re-try changed the shelf (${before} -> ${after.shelf})`);
  if (/\/100/.test(out) && !Object.values(after.review || {}).some(r => r.tries === 1)) fail(`${tag}: judged re-try not recorded`);
  await page.context().close();
}

/* RV3 and RV4: the Shelf spine counts the words to review, and with two rooms the review view shows room chips that
   narrow the contents. Two of the seven words are from the Observatory, so the room chips appear. */
async function filters() {
  const seed = structuredClone(SEED);
  seed.shelf[0].room = 'science'; seed.shelf[1].room = 'science'; // abandon and lucid; the rest are in the Reading Room
  const page = await newPage(1280, 800, seed);
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForSelector('#home:not([hidden]) #bAll', {timeout: T});
  const spine = await page.textContent('#bAll .hb-rv', {timeout: T});
  if (+spine !== EXPECT_WORDS) fail(`filters: the Shelf spine tag shows ${spine}, expected ${EXPECT_WORDS}`);
  await page.click('#bAll');
  await page.waitForTimeout(2200);
  await page.click('.sv-tab[data-view="review"]');
  await page.waitForSelector('.rv-filter[data-k="room"][data-v="science"]', {timeout: T});
  const sci = await page.textContent('.rv-filter[data-k="room"][data-v="science"] small');
  if (+sci !== 2) fail(`filters: the Observatory chip shows ${sci}, expected 2`);
  await page.click('.rv-filter[data-k="room"][data-v="science"]');
  await page.waitForFunction(() => [...document.querySelectorAll('.kicker')].some(k => k.textContent.includes('2 of 7 words to win back')), null, {timeout: T}).catch(() => fail('filters: the Observatory filter did not narrow the overview to 2 of 7'));
  await page.waitForFunction(() => document.querySelectorAll('.rv-jump').length === 2, null, {timeout: T}).catch(() => fail('filters: the contents after the Observatory filter did not show 2 rows'));
  await page.click('.rv-filter[data-k="room"][data-v=""]');
  await page.waitForFunction(() => [...document.querySelectorAll('.kicker')].some(k => k.textContent.includes('7 words to win back')), null, {timeout: T}).catch(() => fail('filters: All did not restore the 7 words'));
  await page.context().close();
}

/* RV2: the result card's "Words to win back" link. Seeds today's finished Daily, opens it from the home ("Today's
   result"), and checks the link shows its count only when the run has misses still to win back, and that it opens the
   Shelf on To review. The day key is built in the page, the same local yyyy-mm-dd the game uses. */
const run = (books) => ({mode: 'daily', books, avg: 40, best: 2, depth: 120, floor: 0});
const runBooks = [
  {...row('abandon', 'leave it', 22, 1, day(1)), ft: 40, combo: null},  // still to win back
  {...row('obfuscate', 'make hard', 14, 1, day(5)), ft: 30, combo: null}, // still to win back
  {...row('ephemeral', 'short', 58, 3, day(2)), ft: 50, combo: null},  // won back in the seed (best 61), so not counted
];
const cleanBooks = [{...row('ephemeral', 'short', 58, 3, day(2)), ft: 50, combo: null}];
async function resultLink(width, height, books, expect) {
  const tag = `result ${width}x${height} (${expect === null ? 'clean' : 'misses'})`;
  const seed = structuredClone(SEED);
  seed.todayRun = run(books);
  const ctx = await browser.newContext({viewport: {width, height}, deviceScaleFactor: 1, reducedMotion: 'reduce'});
  await ctx.addInitScript(({s}) => {
    if (sessionStorage.getItem('rv-seeded')) return;
    const o = JSON.parse(s), d = new Date(), p = n => String(n).padStart(2, '0');
    if (o.todayRun) { o.daily = {[`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`]: o.todayRun}; delete o.todayRun; }
    localStorage.clear(); localStorage.setItem('deepstack.v1', JSON.stringify(o)); sessionStorage.setItem('rv-seeded', '1');
  }, {s: JSON.stringify(seed)});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${tag} pageerror: ${e.message}`));
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForSelector('#home:not([hidden]) #bRes', {timeout: T});
  await page.click('#bRes');
  await page.waitForSelector('#up', {timeout: T});
  const link = page.locator('#rvw');
  if (expect === null) {
    if (await link.count()) fail(`${tag}: a clean run shows the link`);
    await ctx.close();
    return;
  }
  await link.waitFor({state: 'visible', timeout: T}).catch(() => fail(`${tag}: no visible "Words to win back" link`));
  const label = (await link.textContent().catch(() => '')).trim();
  if (label !== `Words to win back (${expect})`) fail(`${tag}: link reads "${label}", expected "Words to win back (${expect})"`);
  await link.click();
  await page.waitForSelector('.sv-tab[data-view="review"][aria-pressed="true"]', {timeout: T}).catch(() => fail(`${tag}: the link did not open the Shelf on To review`));
  const n = await page.locator('.rv-filter, .rv-jump, .rv-entry').count();
  if (n === 0) fail(`${tag}: the To review view shows no words`);
  await ctx.close();
}

try {
  await guard(1280, 800);
  await guard(375, 812);
  await filters();
  await resultLink(1280, 800, runBooks, 2);
  await resultLink(375, 812, runBooks, 2);
  await resultLink(1280, 800, cleanBooks, null);
  await resultLink(375, 812, cleanBooks, null);
} catch (e) {
  if (e.message !== 'stop') fail(`review-shelf: ${e.message.split('\n').slice(0,12).join(' | ')}`);
}
await browser.close();
server.close();
if (problems.length) { console.error('review-shelf: FAILED\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('review-shelf: ok (tab count, contents, every word page fits, re-try records, shelf untouched, room filter, spine count, result-card link)');
