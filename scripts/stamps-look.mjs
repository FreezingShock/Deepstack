// Stamps guard (TA5): the Almanac's Stamps page at 375 and 1280, reduced motion on, after `npm run build`.
//  1. the page opens from the Stats book (its Rooms pages are followed by two Stamps leaves) and shows every seal,
//  2. the earned seals are lit and the rest are dashed, with the count in the page's kicker,
//  3. no seal, row or name is cut off by its page, and the page never scrolls sideways,
//  4. the toast slip (the real markup from stampToastInner) fits a phone-width screen with its text whole, open and in view.
// Writes before/after PNGs to STAMPS_SHOTS (default: screenshots/stamps-look under the project files folder) when set.
// Skips (exit 0) when no Chromium is available, like the other guards. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {CATALOG} from '../src/core/stamps.js';
import {stampToastInner} from '../src/ui/stampToast.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(root, p)); // read first, so a missing file is a clean 404 and not a second writeHead
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); }
catch { try { ({chromium} = (await import('node:module')).createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('stamps-look: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('stamps-look: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = m => { if (problems.length < 30) problems.push(m); };
const EARNED = {'history.first': '2026-11-02', 'history.quarter': '2026-11-03', 'history.week': '2026-11-06', 'math.first': '2026-10-30', 'science.first': '2026-11-04', 'library.doors': '2026-11-06'};
const TOTAL = CATALOG.length; // every stamp in the catalogue (src/core/stamps.js)
const SHOTS = process.env.STAMPS_SHOTS || '';
if (SHOTS) await mkdir(SHOTS, {recursive: true});

async function run(label, {width, height}) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: page error ${e.message}`));
  await page.route('**/*', r => BLOCKED.test(r.request().url()) ? r.abort() : r.continue());
  const save = {shelf: [], sound: false, bestFloor: 1, streak: {last: '', n: 0}, room: 'history', stamps: EARNED, met: {}, rooms: {}};
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), save);
  await page.goto(url);
  try {
    await page.waitForSelector('#bStats', {state: 'attached', timeout: 15000});
    await page.waitForTimeout(800);
    await page.evaluate(() => document.getElementById('bStats').click());
    await page.waitForSelector('.bk-spread', {state: 'visible', timeout: 8000});
    // turn pages until the first Stamps leaf is showing (the Rooms pages come first in the book)
    for (let i = 0; i < 14; i++) {
      const shown = await page.evaluate(() => { const p = document.querySelector('.stp-page'); return !!p && p.offsetParent !== null; });
      if (shown) break;
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
    }
    await page.waitForSelector('.stp-page', {state: 'visible', timeout: 8000});
    const r = await page.evaluate(() => {
      const pages = [...document.querySelectorAll('.stp-page')].filter(p => p.offsetParent !== null);
      const seals = [...document.querySelectorAll('.stp-page .stp-seal')];
      const bad = [];
      for (const p of pages) {
        const pr = p.getBoundingClientRect();
        for (const el of p.querySelectorAll('.stp-row, .stp-seal, .stp-name, .stp-n, .kicker, .note')) {
          const b = el.getBoundingClientRect();
          if (b.width && (b.left < pr.left - 1 || b.right > pr.right + 1)) bad.push(el.className || el.tagName);
        }
      }
      return {
        visiblePages: pages.length,
        seals: seals.length,
        lit: seals.filter(s => s.classList.contains('on')).length,
        dashed: seals.filter(s => s.classList.contains('off')).length,
        kicker: (document.querySelector('.stp-page .kicker') || {}).textContent || '',
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bad: bad.slice(0, 5),
      };
    });
    if (r.seals !== TOTAL) fail(`${label}: expected ${TOTAL} seals on the Stamps leaves, got ${r.seals}`);
    if (r.lit !== Object.keys(EARNED).length) fail(`${label}: expected ${Object.keys(EARNED).length} lit seals, got ${r.lit}`);
    if (r.dashed !== TOTAL - Object.keys(EARNED).length) fail(`${label}: dashed seals ${r.dashed} do not match the rest`);
    if (!new RegExp(`6 of ${TOTAL} earned`).test(r.kicker)) fail(`${label}: kicker should read "6 of ${TOTAL} earned", got "${r.kicker}"`);
    if (r.sideways > 0) fail(`${label}: the page scrolls sideways by ${r.sideways}px`);
    if (r.bad.length) fail(`${label}: cut off or outside its page: ${r.bad.join(', ')}`);
    if (SHOTS) await page.screenshot({path: join(SHOTS, `stamps-${width}.png`)});

    // the toast: the slip the app builds (src/ui/stampToast.js), open on home with the same stylesheet and the real markup
    await page.goto(url);
    await page.waitForSelector('#bStats', {state: 'attached', timeout: 15000});
    await page.waitForTimeout(600);
    await page.evaluate(html => {
      const d = document.createElement('div');
      d.id = 'stamptoast'; d.setAttribute('role', 'status');
      d.innerHTML = html;
      document.body.appendChild(d);
      d.classList.add('on', 'open');
    }, stampToastInner([
      {id: 'science.perfect', room: 'science', name: 'Perfect Daily', hint: 'Every word at 78 or better, none skipped.', of: {n: 4, total: 6}},
      {id: 'library.doors', room: null, name: 'Every door opened', hint: 'Open all 6 topic rooms.', of: {n: 8, total: 13}},
    ]));
    await page.waitForTimeout(500);
    const t = await page.evaluate(() => {
      const el = document.getElementById('stamptoast'), b = el.getBoundingClientRect();
      const txt = [...el.querySelectorAll('.stp-name, .stp-where, .stp-hint, .stp-count, .stp-head span, .stp-foot span')].every(x => x.scrollWidth <= x.clientWidth + 1);
      const op = parseFloat(getComputedStyle(el).opacity);
      return {inside: b.left >= 0 && b.right <= innerWidth + 0.5, whole: txt, shown: op > 0.9, sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth};
    });
    if (!t.inside) fail(`${label}: the toast runs off the screen`);
    if (!t.whole) fail(`${label}: the toast text is clipped`);
    if (!t.shown) fail(`${label}: the toast did not show (opacity is not 1)`);
    if (t.sideways > 0) fail(`${label}: the toast makes the page scroll sideways`);
    if (SHOTS) await page.screenshot({path: join(SHOTS, `toast-${width}.png`)});
  } catch (e) { fail(`${label}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
}

await run('desktop 1280', {width: 1280, height: 800});
await run('phone 375', {width: 375, height: 740});
await run('phone 320', {width: 320, height: 640});

await browser.close(); server.close();
if (problems.length) { console.error('stamps-look: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log('stamps-look: ok');
