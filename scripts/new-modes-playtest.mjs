// Playtest walk for the newer modes (Patrons, Daily weekly leaves, Unlimited, Shelf To review, Restoration bench) in
// every topic room, at phone (375) and desktop (1280). It walks the ring from the Reading Room, and in each room opens
// each book, takes a screenshot and audits the page: sideways scroll, text clipped by its box, elements that spill out
// of the open book, stray scrollbars, page errors and console errors.
// Usage: npm run build && node scripts/new-modes-playtest.mjs [--check] [--motion=reduce|no-preference] [--out=DIR] [--only=375]
// --check exits 1 on errors, sideways scroll, clipped text, spills, a phone Daily cover that does not fit, or a missing control.
// Scroll areas (a desktop Daily cover, the shelf bays, the bench stage) are reported as cover-scrolls and stray-scrollbar, not failures.
// Writes a JSON report to OUT/report-<motion>.json and prints a summary. Skips (exit 0) when no Chromium is available.
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const MOTION = args.motion || 'reduce';
const OUT = args.out || 'screenshots/new-modes-playtest/before';
const ONLY = args.only;
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2'};
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
if (!chromium) { console.log('new-modes-playtest: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('new-modes-playtest: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const OPTIONAL = /\/(models|ort)\//;
const T = 15000;
const RING = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [
  {name: '375', viewport: {width: 375, height: 667}, scale: 2, mobile: true},
  {name: '1280', viewport: {width: 1280, height: 800}, scale: 1, mobile: false},
].filter(v => !ONLY || v.name === ONLY);
// Missed words so the Shelf's To review tab has something to show (same shape as scripts/review-shelf.mjs).
const day = i => Date.parse('2026-11-0' + (1 + (i % 6)) + 'T12:00:00Z');
const row = (w, answer, score, tier, t) => ({w, pos: 'verb', def: `What ${w} means.`, answer, score, tier, t, fb: {m: ['a missed idea']}, verdict: 'Wide of the mark.', no: 1});
const SEED = JSON.stringify({shelf: [
  row('abandon', 'leave it', 22, 1, day(1)), row('lucid', '', 0, 0, day(2)), row('candid', 'honest', 41, 2, day(3)),
  row('tenacious', 'holding on', 9, 0, day(4)), row('obfuscate', 'make hard', 14, 1, day(5)), row('ubiquitous', 'everywhere', 12, 0, day(0)),
  row('laconic', 'brief', 36, 2, day(1)), row('ephemeral', 'short', 58, 3, day(2)),
], daily: {}, streak: {last: '', n: 0}, bestDepth: 0, bestFloor: 0, sound: false});

const findings = [];
// Daily cover: at phone size the four sections must fit the left page with no scroll; the desktop page scrolls for now.
const coverFit = () => {
  const pg = document.querySelector('.bk-spread .dly-cover')?.closest('.pg-in');
  return pg ? {clientH: pg.clientHeight, scrollH: pg.scrollHeight} : null;
};
const add = (view, room, stage, kind, detail) => findings.push({view, room, stage, kind, detail});

// Runs in the page: returns what is wrong with the visible layout. Scope limits the spill check to one element.
const AUDIT = (scopeSel) => {
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const label = el => (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || el.tagName;
  const out = {sideways: 0, clipped: [], spill: [], strayScroll: []};
  const de = document.documentElement;
  out.sideways = Math.max(0, de.scrollWidth - innerWidth);
  const scope = document.querySelector(scopeSel) || document.body;
  // inside a box that scrolls (either way) its overflow is reached by scrolling, so it is not a spill
  const inScrollX = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX)) return true; } return false; };
  for (const el of scope.querySelectorAll('*')) {
    if (el.closest('canvas') || el.tagName === 'CANVAS' || el.tagName === 'svg' || el instanceof SVGElement) continue;
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText && /(hidden|clip)/.test(cs.overflow) && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)) out.clipped.push(`${label(el)} ${el.scrollHeight}>${el.clientHeight}`);
    if (hasText && el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'visible' && !/(auto|scroll)/.test(cs.overflowX)) out.clipped.push(`${label(el)} wide ${el.scrollWidth}>${el.clientWidth}`);
    if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) out.strayScroll.push(`${label(el)} ${el.scrollHeight}>${el.clientHeight}`);
    if (r.width > 1 && (r.right > innerWidth + 1 || r.left < -1) && !inScrollX(el) && !el.closest('[aria-hidden=true]')) out.spill.push(`${label(el)} x ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  const book = document.querySelector('.bk-spread');
  if (book) {
    const b = book.getBoundingClientRect();
    for (const el of book.querySelectorAll('*:not(.bs-board):not(.bs-blk)')) {
      if (!vis(el) || el.closest('canvas, .bs-board, .bs-blk')) continue;
      const r = el.getBoundingClientRect();
      if (el instanceof SVGElement || el.closest('.inked')) continue; // hand-drawn underlines run past their words on purpose
      if (r.width > 1 && (r.right > b.right + 1 || r.bottom > b.bottom + 1) && !inScrollX(el)) out.spill.push(`in-spread ${label(el)} ${Math.round(r.right)}>${Math.round(b.right)}`);
    }
  }
  return {sideways: out.sideways, clipped: out.clipped.slice(0, 6), spill: out.spill.slice(0, 6), strayScroll: out.strayScroll.slice(0, 6), clippedN: out.clipped.length, spillN: out.spill.length, strayN: out.strayScroll.length};
};

async function run(view) {
  const ctx = await browser.newContext({viewport: view.viewport, deviceScaleFactor: view.scale, isMobile: view.mobile, hasTouch: view.mobile, reducedMotion: MOTION === 'reduce' ? 'reduce' : 'no-preference'});
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('np-seeded')) { localStorage.clear(); localStorage.setItem('deepstack.v1', s); sessionStorage.setItem('np-seeded', '1'); } }, SEED);
  const page = await ctx.newPage();
  let room = 'hall';
  const err = m => add(view.name, room, 'console', 'error', m);
  await page.route(BLOCKED, r => (r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort()));
  page.on('pageerror', e => err('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error' || BLOCKED.test(m.location()?.url || '')) return;
    if (/Failed to load resource/.test(m.text()) && (!m.location()?.url?.startsWith(url) || OPTIONAL.test(m.location().url))) return;
    err('console.error: ' + m.text());
  });
  const shot = async name => { await mkdir(`${OUT}/${view.name}`, {recursive: true}); await page.screenshot({path: `${OUT}/${view.name}/${room}-${name}.png`}); };
  const audit = async (stage, scope = '.bk-spread') => {
    const a = await page.evaluate(AUDIT, scope).catch(e => ({error: String(e)}));
    if (a.error) return add(view.name, room, stage, 'audit-error', a.error);
    if (a.sideways > 1) add(view.name, room, stage, 'sideways-scroll', a.sideways + 'px');
    if (a.clippedN) add(view.name, room, stage, 'clipped', a.clipped);
    if (a.spillN) add(view.name, room, stage, 'spill', a.spill);
    if (a.strayN) add(view.name, room, stage, 'stray-scrollbar', a.strayScroll);
  };
  const close = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(900); };
  const openBook = async (id, stage) => {
    const el = page.locator(id).first();
    if (!(await el.isVisible().catch(() => false))) return add(view.name, room, stage, 'missing', `${id} not visible`);
    await el.click({timeout: T}).catch(() => add(view.name, room, stage, 'not-clickable', id));
    await page.waitForTimeout(1200);
    return true;
  };

  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bDaily').first().waitFor({state: 'visible', timeout: T}).catch(() => { add(view.name, room, 'home', 'fatal', 'home never rendered'); });
  await page.mouse.move(2, 2);
  await page.waitForTimeout(3200);

  for (const id of RING) {
    room = id;
    if (id !== 'hall') {
      if (!view.mobile) {
        await page.locator('#rm-doors .rm-next').first().click({timeout: T}).catch(() => add(view.name, room, 'walk', 'missing', 'side door'));
      } else {
        await page.locator('#bRooms').first().click({timeout: T}).catch(() => add(view.name, room, 'walk', 'missing', '#bRooms'));
        await page.waitForTimeout(900);
        await page.locator(`.rl-toc li[data-room="${id}"]`).first().click({timeout: T}).catch(() => add(view.name, room, 'walk', 'missing', 'toc ' + id));
        await page.waitForTimeout(900);
        await page.locator(`.rl-enter [data-room="${id}"]`).first().click({timeout: T}).catch(() => add(view.name, room, 'walk', 'missing', 'enter ' + id));
      }
      await page.waitForTimeout(3200);
    }
    await page.mouse.move(2, 2);
    await shot('home');
    await audit('home', '#home');

    // Daily book: the cover, then the weekly leaves
    if (await openBook('#bDaily', 'daily')) {
      await audit('daily-cover', '.bk-spread');
      const fit = await page.evaluate(coverFit);
      if (fit && view.mobile && fit.scrollH > fit.clientH + 2) add(view.name, room, 'daily-cover', 'cover-overflow', fit);
      if (fit && !view.mobile && fit.scrollH > fit.clientH + 2) add(view.name, room, 'daily-cover', 'cover-scrolls', fit);
      await shot('daily-cover');
      const go = page.locator('.wk-cover .dly-go').first();
      if (await go.isVisible().catch(() => false)) {
        await go.click({timeout: T}).catch(() => add(view.name, room, 'daily', 'not-clickable', 'weekly leaves'));
        await page.waitForTimeout(1000);
        await audit('weekly-leaves');
        await shot('weekly-leaves');
      } else add(view.name, room, 'daily', 'missing', 'weekly cover entry');
      await close();
    }
    // Unlimited book (no run started)
    if (await openBook('#bUnl', 'unlimited')) { await audit('unlimited'); await shot('unlimited'); await close(); }
    // Patrons desk (Patrons is a Shelf-stand book on the home)
    if (await openBook('#bPat', 'patrons')) { await audit('patrons'); await shot('patrons'); await close(); }
    // Shelf, its To review tab, and one missed word page
    if (await openBook('#bAll', 'shelf')) {
      await audit('shelf'); await shot('shelf');
      const rv = page.locator('.sv-tab[data-view="review"]').first();
      if (await rv.isVisible().catch(() => false)) {
        await rv.click({timeout: T}).catch(() => {});
        await page.waitForTimeout(700);
        await audit('review-tab', '.bk-spread'); await shot('review-tab');
        const jump = page.locator('.rv-jump').first();
        if (await jump.isVisible().catch(() => false)) {
          await jump.click({timeout: T}).catch(() => {});
          await page.waitForTimeout(900);
          await audit('review-page'); await shot('review-page');
        }
      } else add(view.name, room, 'shelf', 'missing', 'review tab');
      await close();
    }
    // Restoration bench from the home entry
    const entry = page.locator('.rs-entry').first();
    if (await entry.isVisible().catch(() => false)) {
      await entry.click({timeout: T}).catch(() => add(view.name, room, 'bench', 'not-clickable', 'entry'));
      await page.waitForTimeout(1000);
      await audit('bench', '.rs-bench.on'); await shot('bench');
      await close();
    } else add(view.name, room, 'bench', 'missing', '.rs-entry');
    // Rooms book on phones, contents and the home shelf after the walk
    await page.mouse.move(2, 2);
    await page.waitForTimeout(400);
  }
  await ctx.close();
}

for (const view of VIEWS) await run(view);
await browser.close();
server.close();

await mkdir(OUT, {recursive: true});
await writeFile(`${OUT}/report-${MOTION}.json`, JSON.stringify(findings, null, 2));
const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
console.log(`new-modes-playtest (${MOTION}): ${findings.length} findings`, byKind);
for (const f of findings) console.log(`[${f.view}] ${f.room} ${f.stage} ${f.kind}: ${JSON.stringify(f.detail)}`);
const FAIL = new Set(['error', 'audit-error', 'fatal', 'sideways-scroll', 'clipped', 'spill', 'cover-overflow', 'pageerror', 'missing', 'not-clickable']);
const bad = findings.filter(f => FAIL.has(f.kind));
if (args.check !== undefined && bad.length) { console.error(`new-modes-playtest: ${bad.length} failing finding(s)`); process.exitCode = 1; }
