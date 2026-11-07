// Overlap guard with motion ON: a menu book's bookmark ribbon and the stamp tab must not sit on top of visible text or
// ornaments (a seal, a rule, an icon). Reduced motion hides the ribbon, so only the motion-on run sees it. Checks the
// Almanac, Daily, Patrons and Unlimited books at 375 px and desktop, then a won Nemesis duel (the collapsed stamp tab).
// A box counts as covered only when the ribbon or tab is the topmost element at one of its sample points, so text hidden
// under the book's own layers is not flagged. Drives dist/ in headless Chromium with a seeded save. Skips (exit 0) without
// a browser. Run after `npm run build`.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {HALL} from '../src/core/rooms.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = process.env.DIST || join(process.cwd(), 'dist');
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
if (!chromium) { console.log('motion-overlap: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('motion-overlap: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const WORDS = ['ephemeral', 'sesquipedalian', 'lucid', 'tempest', 'alacrity', 'obstinate', 'serendipity', 'pragmatic', 'mellifluous', 'taciturn', 'ubiquitous', 'vestige', 'laconic', 'ardent', 'cadence', 'erudite', 'fastidious', 'gregarious', 'halcyon', 'insidious'];
const problems = [];
const fail = m => { if (problems.length < 60) problems.push(m); };

/** A fortnight of Daily books in the Hall, ephemeral missed hardest, so the Almanac has a Nemesis. Deterministic. */
function seed() {
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const end = Date.UTC(2026, 10, 6, 12), books = [];
  for (let d = 14; d >= 0; d--) for (let i = 0; i < 7; i++) {
    const w = WORDS[(d * 7 + i) % WORDS.length];
    const score = w === 'ephemeral' ? 12 : Math.max(0, Math.min(100, Math.round(30 + rnd() * 60)));
    books.push({w, pos: 'adjective', def: 'lasting for a very short time', score, tier: Math.min(6, Math.floor(score / 16)), answer: 'x', t: end - d * 864e5 + i * 6e4, mode: 'daily', ft: 40, room: HALL});
  }
  const day = {depth: 300, avg: 50, best: 3, books};
  return {shelf: [], daily: {'2026-11-06': day}, rooms: {}, streak: {last: '2026-11-06', n: 2}, bestFloor: 3, bestDepth: 300, sound: false};
}

/** In the page: the labels of text and ornaments that the element matching `sel` is topmost over, at a sample point. */
function coveredBy(sel) {
  const hidden = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return true; } return false; };
  const onScreen = r => r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  const topIsCover = (r) => {
    const xs = [r.left + 1, (r.left + r.right) / 2, r.right - 1], ys = [r.top + 1, (r.top + r.bottom) / 2, r.bottom - 1];
    for (const x of xs) for (const y of ys) { const e = document.elementFromPoint(x, y); if (e && e.closest && e.closest(sel)) return true; }
    return false;
  };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('#stamptoast, [aria-hidden="true"], script, style') || hidden(el)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) if (onScreen(r) && topIsCover(r)) { out.push('text "' + n.nodeValue.trim().slice(0, 24) + '"'); break; }
  }
  /* ornaments inside the book's pages: leaf elements and SVG */
  for (const el of document.querySelectorAll('.bk-spread .pg-in *, .bk-spread svg')) {
    if (el.closest('#stamptoast, [aria-hidden="true"]') || (el.children.length && el.tagName.toLowerCase() !== 'svg') || hidden(el)) continue;
    const r = el.getBoundingClientRect();
    if (onScreen(r) && topIsCover(r)) out.push(el.tagName.toLowerCase() + '.' + String(el.getAttribute('class') || '').split(' ')[0]);
  }
  return out;
}

/** Where the ribbon or the stamp tab is, or null when it is not showing. */
function coverRect(sel) {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  if (el.hidden || cs.display === 'none' || cs.visibility === 'hidden') return null;
  if (sel === '#stamptoast .stp-tab' && !document.querySelector('#stamptoast.on')) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 ? true : null;
}

async function openBook(page, which) {
  await page.click(which, {timeout: 5000});
  await page.waitForTimeout(1400); // the open finishes (Unlimited opens a run, not a menu book)
  /* the ribbon only shows past the first page, so turn until it does (a book with one page shows none) */
  for (let t = 0; t < 4; t++) {
    if (await page.evaluate(() => { const b = document.querySelector('.bk-spread .bs-ribbon'); return !!b && !b.hidden && getComputedStyle(b).display !== 'none'; })) break;
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600);
  }
  await page.waitForTimeout(400);
}

async function newPage(vp, dpr, motion = 'no-preference') {
  const ctx = await browser.newContext({viewport: vp, reducedMotion: motion, timezoneId: 'UTC', deviceScaleFactor: dpr});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`page error ${e.message.split('\n')[0]}`));
  await page.route('**/*', r => (BLOCKED.test(r.request().url()) ? r.abort() : r.continue()));
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), seed());
  await page.goto(url);
  await page.waitForSelector('#bStats', {state: 'visible', timeout: 15000});
  await page.waitForTimeout(800);
  return page;
}

const VIEWS = [{name: '375', vp: {width: 375, height: 740}, dpr: 2}, {name: 'desktop', vp: {width: 1280, height: 800}, dpr: 1}];
const BOOKS = [['almanac', '#bStats'], ['daily', '#bDaily'], ['patrons', '#bPat'], ['unlimited', '#bUnl']];

/* Reduced motion keeps the bookmark (static, no tug): back-to-contents must stay reachable. Motion on shows it too. */
const MUST_HAVE_RIBBON = ['almanac', 'daily'];
for (const motion of ['no-preference', 'reduce']) for (const view of VIEWS) {
  for (const [label, sel] of BOOKS) {
    const page = await newPage(view.vp, view.dpr, motion);
    try {
      await openBook(page, sel);
      const shown = await page.evaluate(coverRect, '.bk-spread .bs-ribbon');
      if (!shown && MUST_HAVE_RIBBON.includes(label)) fail(`${view.name} ${label} (motion ${motion}): no bookmark ribbon, so no back-to-contents control`);
      if (shown && motion === 'reduce') {
        const tween = await page.evaluate(() => getComputedStyle(document.querySelector('.bk-spread .bs-ribbon')).transitionDuration);
        if (tween.split(',').some(d => parseFloat(d) * (d.includes('ms') ? 1 : 1000) > 1)) fail(`${view.name} ${label}: the bookmark animates under reduced motion (${tween})`);
        const before = await page.evaluate(() => getComputedStyle(document.querySelector('.bk-spread .bs-ribbon')).transform);
        await page.hover('.bk-spread .bs-ribbon', {timeout: 3000}).catch(() => {});
        await page.waitForTimeout(300);
        const after = await page.evaluate(() => getComputedStyle(document.querySelector('.bk-spread .bs-ribbon')).transform);
        if (after !== before) fail(`${view.name} ${label}: the bookmark tugs on hover under reduced motion (${before} to ${after})`);
      }
      if (shown) {
        const hits = await page.evaluate(coveredBy, '.bk-spread .bs-ribbon');
        for (const h of hits.slice(0, 4)) fail(`${view.name} ${label}: the bookmark ribbon covers ${h}`);
        /* A one-page spread's header seal is painted into the page background (no DOM element to sample), and it sits
           within about 22 px of the page's outer edge. So on one-page spreads the ribbon must hang in that outer gutter. */
        const gap = await page.evaluate(() => {
          const sp = document.querySelector('.bk-spread.one');
          const rb = document.querySelector('.bk-spread .bs-ribbon');
          if (!sp || !rb || rb.hidden) return null;
          const s = sp.getBoundingClientRect(), r = rb.getBoundingClientRect();
          return Math.min(r.left - s.left, s.right - r.right);
        });
        if (gap !== null && gap > 6) fail(`${view.name} ${label}: the bookmark ribbon hangs ${Math.round(gap)} px in from the page edge on a one-page spread (it must sit in the gutter, within 6 px)`);
      }
    } catch (e) { fail(`${view.name} ${label}: ${e.message.split('\n')[0]}`); }
    await page.context().close();
  }
}

/* The Nemesis duel result: the collapsed stamp tab must not sit on any text or ornament. */
for (const view of VIEWS) {
  const page = await newPage(view.vp, view.dpr);
  try {
    await openBook(page, '#bStats');
    for (let t = 0; t < 12; t++) {
      if (await page.evaluate(() => [...document.querySelectorAll('.nm')].some(a => a.getBoundingClientRect().width > 0))) break;
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
    }
    await page.click('.nm-go', {timeout: 5000});
    await page.waitForSelector('#ans', {state: 'visible', timeout: 15000});
    await page.fill('#ans', 'lasting only a very short while');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#go', {state: 'visible', timeout: 30000});
    await page.waitForTimeout(1200);
    if (!(await page.evaluate(coverRect, '#stamptoast .stp-tab'))) fail(`${view.name} duel: the stamp tab did not show after the won duel`);
    else {
      const hits = await page.evaluate(coveredBy, '#stamptoast .stp-tab');
      for (const h of hits.slice(0, 4)) fail(`${view.name} duel: the stamp tab covers ${h}`);
    }
  } catch (e) { fail(`${view.name} duel: ${e.message.split('\n')[0]}`); }
  await page.context().close();
}

await browser.close(); server.close();
if (problems.length) { console.error('motion-overlap: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log('motion-overlap: ok (ribbon and stamp tab clear of text and ornaments, motion on, 375 and desktop)');
