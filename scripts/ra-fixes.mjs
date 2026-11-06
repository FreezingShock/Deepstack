// Guard for audit fixes RA2, RA5 and RA7, run after `npm run build`, reduced motion on, in every room:
//  RA2: the attic hatch never covers the wordmark, streak gauges or a rail button, and Mute stays visible and tappable (320 to 1280px wide).
//  RA5: every Room Ledger row says how much you have met ("N of M met"), none is a bare "0/3 sets", and its swatch fills to match.
//  RA7: the Today card names the room you are in (not "No. 7 of 7") and takes that room's colour.
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
if (!chromium) { console.log('ra-fixes: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('ra-fixes: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const ROOMS = {hall: 'Reading Room', history: 'Chronicle', math: 'Counting House', science: 'Observatory', english: 'Scriptorium', art: 'Gallery', body: 'Anatomy Theatre'};
const RAIL_WIDTHS = [320, 360, 375, 414, 560, 700, 1280];
const shelf = Array.from({length: 8}, (_, i) => ({w: 'word' + i, word: 'word' + i, s: 60 + i, t: Date.now() - i * 1e6}));
const problems = [];
const T = 15000;

async function open(w, h, room) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  await ctx.addInitScript(s => {
    try { localStorage.setItem('deepstack.v1', JSON.stringify(s.save)); localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: 'reduce'})); } catch {}
  }, {save: {shelf, bestDepth: 900, bestFloor: 3, room: room === 'hall' ? undefined : room, streak: {last: '', n: 3}, daily: {}}});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T});
  await page.waitForTimeout(600);
  return {ctx, page};
}

for (const room of Object.keys(ROOMS)) {
  // RA2: rail
  for (const w of RAIL_WIDTHS) {
    const tag = `${w}px ${room}`, {ctx, page} = await open(w, 700, room);
    try {
      const m = await page.evaluate(() => {
        const box = e => { const b = e.getBoundingClientRect(); return {l: b.left, r: b.right, t: b.top, b: b.bottom}; };
        const vis = e => e && e.getClientRects().length > 0;
        const hatch = document.querySelector('.attic-cue-home .ach-hatch');
        const others = ['#mark', '#barGauges', '#barNav button'].flatMap(s => [...document.querySelectorAll(s)]).filter(vis).map(e => ({id: e.id || e.className || e.tagName, ...box(e)}));
        const snd = document.querySelector('#bSound'), sb = snd && box(snd);
        const hit = sb && document.elementFromPoint((sb.l + sb.r) / 2, (sb.t + sb.b) / 2);
        return {hatch: vis(hatch) ? box(hatch) : null, others, sound: sb, tap: !!(hit && snd.contains(hit)), sw: document.documentElement.scrollWidth};
      });
      if (!m.hatch) problems.push(`${tag}: attic hatch not shown`);
      else for (const o of m.others) if (m.hatch.l < o.r && m.hatch.r > o.l && m.hatch.t < o.b && m.hatch.b > o.t) problems.push(`${tag}: attic hatch sits on "${o.id}"`);
      if (!m.sound || m.sound.l < 0 || m.sound.r > w + 0.5) problems.push(`${tag}: Mute is missing or off the rail`);
      else if (!m.tap) problems.push(`${tag}: Mute cannot be tapped (something covers it)`);
      if (m.sw > w) problems.push(`${tag}: page scrolls sideways`);
    } catch (e) { problems.push(`${tag}: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
  // RA5 + RA7 at phone and desktop
  for (const [w, h] of [[375, 700], [1280, 800]]) {
    const tag = `${w}px ${room}`, {ctx, page} = await open(w, h, room);
    try {
      // RA7: the Today card
      await page.locator(w >= 1000 ? '.cc-drawer[data-d="today"]' : '.cc-tab').first().click();
      if (w < 1000) for (let i = 0; i < 8 && (await page.evaluate(() => document.querySelector('.cat-card').dataset.open)) !== 'today'; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250); }
      await page.waitForTimeout(700);
      const t = await page.evaluate(() => {
        const no = document.querySelector('#cc-today .cc-front .cc-no'), big = document.querySelector('#cc-today .cb-big'), kick = document.querySelector('#cc-today .cb-room');
        return {no: no && no.textContent, big: big && getComputedStyle(big).color, kick: kick && kick.textContent, open: document.querySelector('.cat-card').dataset.open};
      });
      if (t.open !== 'today') problems.push(`${tag}: could not open the Today card`);
      else {
        if (!t.no || /^No\. \d+ of \d+$/.test(t.no)) problems.push(`${tag}: Today card still reads "${t.no}"`);
        else if (t.no !== ROOMS[room]) problems.push(`${tag}: Today card names "${t.no}", expected "${ROOMS[room]}"`);
        if (!t.kick || !t.kick.includes(ROOMS[room])) problems.push(`${tag}: Today card does not name the room on its face ("${t.kick}")`);
        if (t.big === 'rgb(158, 46, 34)' || !t.big) problems.push(`${tag}: Today card is not in the room's colour (${t.big})`);
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(500);
      // RA5: the Room Ledger
      await page.evaluate(() => document.getElementById('bRooms').click());
      await page.waitForSelector('.rl-toc li', {timeout: T});
      await page.waitForFunction(() => [...document.querySelectorAll('.rl-toc li:not([data-room="hall"]) b')].every(b => /\d+ of \d+ met/.test(b.textContent)), null, {timeout: T}).catch(() => {});
      const rows = await page.evaluate(() => [...document.querySelectorAll('.rl-toc li')].map(li => { const b = li.querySelector('b'), d = li.querySelector('.rl-dot'); const r = b.getBoundingClientRect(), pg = li.closest('.pg-in, .page, .bk-spread').getBoundingClientRect(); return {room: li.dataset.room, txt: b.textContent, f: d.style.getPropertyValue('--f'), bg: getComputedStyle(d).backgroundImage, clip: r.right > pg.right + 1 || b.scrollWidth > b.clientWidth + 1}; }));
      if (rows.length !== 7) problems.push(`${tag}: Room Ledger lists ${rows.length} rooms, expected 7`);
      for (const r of rows) {
        const ok = r.room === 'hall' ? /^\d+ words? met$/.test(r.txt) : /^\d+ of \d+ met$/.test(r.txt);
        if (!ok) problems.push(`${tag}: Room Ledger row "${r.room}" says "${r.txt}" instead of a met count`);
        if (!/conic-gradient/.test(r.bg)) problems.push(`${tag}: Room Ledger row "${r.room}" has no filling swatch`);
        if (r.clip) problems.push(`${tag}: Room Ledger row "${r.room}" count is clipped`);
        const m = /^(\d+) of (\d+) met$/.exec(r.txt);
        if (m && Math.abs(+r.f - Math.min(1, m[1] / m[2])) > 0.01) problems.push(`${tag}: Room Ledger row "${r.room}" swatch fill ${r.f} does not match "${r.txt}"`);
      }
    } catch (e) { problems.push(`${tag}: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
}
await browser.close(); server.close();
if (problems.length) { console.error('ra-fixes FAILED:\n' + problems.map(p => ' - ' + p).join('\n')); process.exit(1); }
console.log(`ra-fixes: ok (${Object.keys(ROOMS).length} rooms, rail at ${RAIL_WIDTHS.join('/')}px, today card and ledger at 375 and 1280)`);
