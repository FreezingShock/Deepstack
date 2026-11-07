// Book readability guard: every book a reader opens from the home room (Daily, Shelf, Rooms, Almanac, Ember Log,
// Settings, Credits) at a phone, a laptop and a short laptop window. For each open book it asserts:
//   type   every line of writing is at least 12px (the smallest label a reader must read),
//   touch  every button, link, switch, slider and day cell is at least 44px across (a ::before hit area counts),
//   reach  no writing is cut off: text past a page's foot needs the page's "more" cue (.has-more), and a
//          hidden-overflow edge never clips text,
//   frame  the book never scrolls itself (no stray scrollbar on the spread) or runs off the window sideways.
// Run after `npm run build`; set CHROMIUM_PATH if Playwright's own Chromium is missing. Skips (exit 0) without a
// browser, like the other guards. Set SHOTS=dir to keep a screenshot of each book.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
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
catch { console.log('book-readability: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('book-readability: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const SHOTS = process.env.SHOTS || '';
if (SHOTS) await mkdir(SHOTS, {recursive: true});
const SIZES = [[375, 667], [1280, 800], [1280, 500]];
const BOOKS = [['bDaily', '#bDaily'], ['bAll', '#bAll'], ['bRooms', '#bRooms'], ['bUnl', '#bUnl'], ['bStats', '#bStats'], ['bStreak', '#bStreak'], ['bSettings', '#bSettings'], ['bCredits', '#bCredits']];
const MIN_FONT = 12, MIN_TAP = 44;
const failures = [];

// The page-side measurement: runs in the browser with the book open. Returns the problems it found.
const measure = ({MIN_FONT, MIN_TAP}) => {
  const live = [...document.querySelectorAll('.bk-spread')].filter(e => !e.classList.contains('out') && !e.classList.contains('closing'));
  const scope = live[live.length - 1] || document.querySelector('#topPanel .tpbox');
  if (!scope) return {missing: true};
  const out = {fonts: [], taps: [], clipped: [], scrolls: [], sideways: []};
  const shown = e => { const cs = getComputedStyle(e); return e.getClientRects().length && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const label = e => (e.textContent || e.getAttribute('aria-label') || e.id || e.className || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 36);
  const sr = scope.getBoundingClientRect();
  const within = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > -2 && r.left < innerWidth + 2 && r.bottom > -2 && r.top < innerHeight + 2; };

  // 1. the book itself must not scroll: a stray bar on the whole spread
  if (/auto|scroll/.test(getComputedStyle(scope).overflowY) && scope.scrollHeight > scope.clientHeight + 2) out.scrolls.push(`spread ${scope.scrollHeight}>${scope.clientHeight}`);
  if (sr.left < -1 || sr.right > innerWidth + 1 || sr.bottom > innerHeight + 1 || sr.top < -1) out.sideways.push(`spread at ${Math.round(sr.left)},${Math.round(sr.top)} ${Math.round(sr.width)}x${Math.round(sr.height)}`);
  if (document.documentElement.scrollWidth > innerWidth + 1) out.sideways.push('page');

  for (const e of scope.querySelectorAll('*')) {
    if (e.closest('.sr-only') || !shown(e) || !within(e)) continue;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();

    // 2. type: writing a reader has to read
    if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !e.closest('svg')) {
      const fs = parseFloat(cs.fontSize);
      if (fs < MIN_FONT - 0.05) out.fonts.push(`${fs}px "${label(e)}" <${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} in .${String(e.parentElement && e.parentElement.className).split(' ')[0]}>`);
    }

    // 3. touch: controls, measured with an invisible ::before hit area if the control has one
    if (e.matches('button, a[href], input:not([type=hidden]), select, textarea, [role=button]') && !e.matches('.bs-corner, .sr-only *') && !e.disabled) {
      const pb = getComputedStyle(e, '::before');
      const pw = pb.content !== 'none' && pb.content !== 'normal' ? parseFloat(pb.width) || 0 : 0;
      const ph = pb.content !== 'none' && pb.content !== 'normal' ? parseFloat(pb.height) || 0 : 0;
      const w = Math.max(r.width, pw), h = Math.max(r.height, ph);
      if (w < MIN_TAP - 0.5 || h < MIN_TAP - 0.5) out.taps.push(`${Math.round(w)}x${Math.round(h)} "${label(e)}"`);
    }

    // 4. reach: writing must be visible, or its page must be showing the "more" cue
    if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) {
      let a = e.parentElement;
      while (a && a !== document.body) {
        const ac = getComputedStyle(a);
        const ar = a.getBoundingClientRect();
        const cutV = /hidden|clip/.test(ac.overflowY) && (r.bottom > ar.bottom + 2 || r.top < ar.top - 2);
        const cutH = /hidden|clip/.test(ac.overflowX) && (r.right > ar.right + 2 || r.left < ar.left - 2);
        if (cutV || cutH) { out.clipped.push(`"${label(e)}" cut by .${String(a.className).split(' ')[0]}`); break; }
        if (/auto|scroll/.test(ac.overflowY) && r.bottom > ar.bottom + 2 && !a.classList.contains('has-more')) { out.clipped.push(`"${label(e)}" below .${String(a.className).split(' ')[0]} with no more cue`); break; }
        if (a === scope) break;
        a = a.parentElement;
      }
    }
  }
  return out;
};

for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('deepstack.v1')) {
      const shelf = [];
      for (let i = 0; i < 36; i++) shelf.push({w: 'word' + i, tier: i % 7, score: 50 + i, t: 1700000000000 + i * 864e5, ft: i * 30, fl: i % 5});
      localStorage.setItem('deepstack.v1', JSON.stringify({shelf, streak: {last: '', n: 3}, bestDepth: 300}));
    }
  });
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  await page.goto(url);
  await page.waitForSelector('#home', {timeout: 15000});
  await page.waitForTimeout(900);
  for (const [name, sel] of BOOKS) {
    const tag = `${w}x${h} ${name}`;
    const opened = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
    if (!opened) { failures.push(`${tag}: button missing`); continue; }
    /* wait until the book has finished opening (its swing and fly-in), not just until it exists */
    await page.waitForFunction(() => {
      const live = [...document.querySelectorAll('.bk-spread')].filter(e => !e.classList.contains('out') && !e.classList.contains('closing'));
      const b = live[live.length - 1];
      return (b && b.classList.contains('open')) || !!document.querySelector('#topPanel .tpbox:not([hidden])');
    }, null, {timeout: 4000}).catch(() => {});
    await page.waitForTimeout(900);
    const m = await page.evaluate(measure, {MIN_FONT, MIN_TAP});
    if (m.missing) failures.push(`${tag}: the book did not open`);
    else {
      for (const k of ['fonts', 'taps', 'clipped', 'scrolls', 'sideways']) {
        if (m[k].length) failures.push(`${tag}: ${k}: ${m[k].slice(0, 4).join(' | ')}${m[k].length > 4 ? ` (+${m[k].length - 4} more)` : ''}`);
      }
    }
    if (SHOTS) await page.screenshot({path: join(SHOTS, `${name}-${w}x${h}.png`)});
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1100);
    await page.evaluate(() => document.querySelectorAll('#topPanel:not([hidden])').forEach(x => { x.hidden = true; }));
  }
  if (errs.length) failures.push(`${w}x${h}: page errors: ${errs.join(' | ')}`);
  console.log(`${w}x${h} checked`);
  await ctx.close();
}
await browser.close();
server.close();
if (failures.length) { failures.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('book-readability: ok');
