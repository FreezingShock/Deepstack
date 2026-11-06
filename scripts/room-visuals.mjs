// Guard for the small room visuals (TA7), run after `npm run build`, reduced motion on, at 375 and 1280, in every room:
//  1. the Librarian's Card floor name is never clipped (checked for every floor, the Catacombs included),
//  2. at phone width the attic ladder's own frame is gone (no second offset frame over the rail); on desktop it stays,
//  3. every side-door plate (shown from 1000px wide; phones use the Room Ledger) carries a visible fire swatch (the Reading Room's too).
// Skips (exit 0) when no Chromium is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

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
if (!chromium) { console.log('room-visuals: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('room-visuals: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const FLOOR_IDX = [0, 1, 2, 3, 4, 5]; // every floor (2 = The Catacombs, 3 = The Sunken Vault, the longest names)
const VIEWS = [{w: 375, h: 700}, {w: 800, h: 600}, {w: 1000, h: 700}, {w: 1280, h: 800}, {w: 1920, h: 1080}]; // 1000 is the door threshold; doors must show from 1280
const shelf = Array.from({length: 6}, (_, i) => ({w: 'word' + i, word: 'word' + i, s: 60 + i, t: Date.now() - i * 1e6}));
const problems = [];
const T = 15000;

async function open(view, room, bestFloor) {
  const ctx = await browser.newContext({viewport: {width: view.w, height: view.h}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  await ctx.addInitScript(s => {
    try { localStorage.setItem('deepstack.v1', JSON.stringify(s.save)); localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: 'reduce'})); } catch {}
  }, {save: {shelf, bestDepth: 900, bestFloor, room: room === 'hall' ? undefined : room, streak: {last: '', n: 3}, daily: {}}});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T});
  await page.waitForTimeout(500);
  return {ctx, page};
}

const seenFloors = new Set();
for (const view of VIEWS) for (const room of ROOMS) {
  const tag = `${view.w}px ${room}`;
  for (const depth of room === 'hall' ? FLOOR_IDX : [3]) {
    const {ctx, page} = await open(view, room, depth);
    try {
      const f = await page.evaluate(() => {
        const dd = document.querySelector('.lg-row.lg-floor dd');
        if (!dd || !dd.offsetParent) return null;
        const rg = document.createRange(); rg.selectNodeContents(dd); const t = rg.getBoundingClientRect(), pg = dd.closest('.lg-page').getBoundingClientRect();
        const ell = getComputedStyle(dd).textOverflow === 'ellipsis' && getComputedStyle(dd).overflow !== 'visible' && dd.scrollWidth > dd.clientWidth;
        return {t: dd.textContent, clipX: t.left < pg.left - 1 || t.right > pg.right + 1, clipY: t.top < pg.top - 1 || t.bottom > pg.bottom + 1, ell};
      });
      if (f) { seenFloors.add(f.t); if (f.clipX || f.clipY || f.ell) problems.push(`${tag} floor ${depth}: Card floor name "${f.t}" is clipped`); }
      const doors = await page.evaluate(() => [...document.querySelectorAll('#rm-doors:not([hidden]) .rm-door')].map(d => { const s = d.querySelector('.rm-plate .rm-sw'); const r = s && s.getBoundingClientRect(); return {room: d.dataset.room, ok: !!r && r.width >= 5 && r.height >= 5 && getComputedStyle(s).backgroundImage !== 'none', one: (() => { const b = d.querySelector('.rm-plate b'); return b.getBoundingClientRect().height < parseFloat(getComputedStyle(b).fontSize) * 2; })()}; }));
      if (view.w >= 1280 && doors.length < 2) problems.push(`${tag}: expected two visible side doors, found ${doors.length}`);
      for (const d of doors) if (!d.one) problems.push(`${tag}: door plate name for "${d.room}" wraps to two lines`);
      for (const d of doors) if (!d.ok) problems.push(`${tag}: door plate for "${d.room}" has no visible fire swatch`);
      if (depth === 3) {
        const frame = await page.evaluate(() => { const e = document.querySelector('.attic-down .adl-frame'); return e ? getComputedStyle(e).display : 'missing'; });
        if (frame === 'missing') problems.push(`${tag}: attic ladder frame element not found`);
        else if (view.w <= 560 && frame !== 'none') problems.push(`${tag}: duplicate attic frame still shows at phone width`);
        else if (view.w > 560 && frame === 'none') problems.push(`${tag}: attic frame should show on desktop`);
      }
    } catch (e) { problems.push(`${tag} floor ${depth}: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
}
if (![...seenFloors].some(t => /Catacombs/.test(t))) problems.push('the Catacombs floor never appeared on the Card, so the truncation case was not exercised');

await browser.close(); server.close();
if (problems.length) { console.error(`room-visuals: FAILED (${problems.length})\n - ` + [...new Set(problems)].join('\n - ')); process.exit(1); }
console.log(`room-visuals: ok (${ROOMS.length} rooms x 375/1280, reduced motion; floors seen: ${[...seenFloors].join(', ')})`);
