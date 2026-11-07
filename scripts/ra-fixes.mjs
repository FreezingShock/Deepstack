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
        const fl = document.querySelector('.ach-flame'), gone = !vis(document.querySelector('#barGauges'));
        return {flame: fl && vis(fl) ? box(fl) : null, needFlame: gone, hatch: vis(hatch) ? box(hatch) : null, others, sound: sb, tap: !!(hit && snd.contains(hit)), sw: document.documentElement.scrollWidth};
      });
      if (!m.hatch) problems.push(`${tag}: attic hatch not shown`);
      else for (const o of m.others) if (m.hatch.l < o.r && m.hatch.r > o.l && m.hatch.t < o.b && m.hatch.b > o.t) problems.push(`${tag}: attic hatch sits on "${o.id}"`);
      if (m.needFlame && !m.flame) problems.push(`${tag}: streak plate is hidden but the flame tag is not shown (RA9)`);
      if (m.flame) { if (m.flame.r > w + 0.5) problems.push(`${tag}: flame tag runs off the screen`); for (const o of m.others) if (m.flame.l < o.r && m.flame.r > o.l && m.flame.t < o.b && m.flame.b > o.t) problems.push(`${tag}: flame tag sits on "${o.id}"`); }
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
        const no = document.querySelector('#cc-today .cc-front .cc-no'), big = document.querySelector('#cc-today .cb-big'), met = document.querySelector('#cc-today .cb-met'), kick = document.querySelector('#cc-today .cb-room');
        return {met: met && met.textContent, no: no && no.textContent, big: big && getComputedStyle(big).color, kick: kick && kick.textContent, open: document.querySelector('.cat-card').dataset.open};
      });
      if (t.open !== 'today') problems.push(`${tag}: could not open the Today card`);
      else {
        if (!t.no || /^No\. \d+ of \d+$/.test(t.no)) problems.push(`${tag}: Today card still reads "${t.no}"`);
        else if (t.no !== ROOMS[room]) problems.push(`${tag}: Today card names "${t.no}", expected "${ROOMS[room]}"`);
        if (!t.kick || !t.kick.includes(ROOMS[room])) problems.push(`${tag}: Today card does not name the room on its face ("${t.kick}")`);
        if (!t.met || !/(\d+ of \d+ met|\d+ words? met)/.test(t.met)) problems.push(`${tag}: Today card has no met line ("${t.met}") (RA8)`);
        if (t.big === 'rgb(158, 46, 34)' || !t.big) problems.push(`${tag}: Today card is not in the room's colour (${t.big})`);
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(500);
      // RA5: the Room Ledger
      await page.evaluate(() => document.getElementById('bRooms').click());
      await page.waitForSelector('.rl-toc li', {timeout: T});
      await page.waitForFunction(() => [...document.querySelectorAll('.rl-toc li:not([data-room="hall"]) b')].every(b => /\d+ of \d+ met/.test(b.textContent)), null, {timeout: T}).catch(() => {});
      const rows = await page.evaluate(() => [...document.querySelectorAll('.rl-toc li')].map(li => { const b = li.querySelector('b'), d = li.querySelector('.rl-dot'); const r = b.getBoundingClientRect(), pg = li.closest('.pg-in, .page, .bk-spread').getBoundingClientRect(); return {ring: getComputedStyle(d, '::after').display !== 'none', s: d.style.getPropertyValue('--s'), title: li.title, room: li.dataset.room, txt: b.textContent, f: d.style.getPropertyValue('--f'), bg: getComputedStyle(d).backgroundImage, clip: r.right > pg.right + 1 || b.scrollWidth > b.clientWidth + 1}; }));
      if (rows.length !== 7) problems.push(`${tag}: Room Ledger lists ${rows.length} rooms, expected 7`);
      for (const r of rows) {
        const ok = r.room === 'hall' ? /^\d+ words? met$/.test(r.txt) : /^\d+ of \d+ met$/.test(r.txt);
        if (!ok) problems.push(`${tag}: Room Ledger row "${r.room}" says "${r.txt}" instead of a met count`);
        if (!/conic-gradient/.test(r.bg)) problems.push(`${tag}: Room Ledger row "${r.room}" has no filling swatch`);
        if (r.room !== 'hall' && (!r.ring || r.s === '' || !/sets complete/.test(r.title))) problems.push(`${tag}: Room Ledger row "${r.room}" has no sets ring or tooltip (RA10)`);
        if (r.clip) problems.push(`${tag}: Room Ledger row "${r.room}" count is clipped`);
        const m = /^(\d+) of (\d+) met$/.exec(r.txt);
        if (m && Math.abs(+r.f - Math.min(1, m[1] / m[2])) > 0.01) problems.push(`${tag}: Room Ledger row "${r.room}" swatch fill ${r.f} does not match "${r.txt}"`);
      }
    } catch (e) { problems.push(`${tag}: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
}
// PN: phone layout nits (audit A-F), checked at 320 to 430 wide with reduced motion, in the Reading Room.
//  A: the streak flame tag keeps 12px clear of the attic hatch's cord tag.  E: it starts 6px or more below the rail's bottom edge, not tucked under it.
//  D: the candle's plate overhangs the answer slip by 20px at most, and the wax stays beside the card.
//  F: on tall phones (760px and up) the Descend block sits within 14px of the shelf spines.
//  B/C: the open Room filter has no blank band under its last row (at most 12px) and each colour dot is level with its label.
const PN_ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body', 'hall'];
const PN_BOOKS = PN_ROOMS.map((r, i) => ({fl: 'hall', wid: 'w' + i, w: 'word' + i, pos: 0, def: 'a thing', answer: 'a thing', score: 70 + i, tier: i % 4, mode: 'daily', room: r === 'hall' ? undefined : r, t: Date.now() - i * 1e6, no: i + 1, hints: 0, fb: null, verdict: 'ok', rows: [], ft: 100 + i}));
const PN_SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [430, 932]];
for (const [w, h] of PN_SIZES) {
  const tag = `${w}x${h} phone nits`;
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  await ctx.addInitScript(s => { try { localStorage.setItem('deepstack.v1', JSON.stringify(s.save)); localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: 'reduce'})); } catch {} }, {save: {shelf: PN_BOOKS, bestDepth: 900, bestFloor: 3, streak: {last: '', n: 3}, daily: {}}});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  try {
    await page.goto(url, {waitUntil: 'load'});
    await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T});
    await page.waitForTimeout(700);
    // A, E, F on the home screen
    const home = await page.evaluate(() => {
      const vis = e => e && e.getClientRects().length > 0;
      const R = e => { const b = e.getBoundingClientRect(); return {l: b.left, r: b.right, t: b.top, b: b.bottom}; };
      const q = s => [...document.querySelectorAll(s)].find(vis);
      const bar = q('#bar'), tagEl = q('.ach-tag'), flame = q('.ach-flame'), plaque = q('.hz-plaque'), stack = q('#bAll')?.parentElement;
      return {bar: bar && R(bar), tag: tagEl && R(tagEl), flame: flame && R(flame), plaque: plaque && R(plaque), stack: stack && R(stack), tall: innerHeight >= 760};
    });
    if (home.flame && home.tag && home.flame.l - home.tag.r < 12) problems.push(`${tag}: streak flame is ${(home.flame.l - home.tag.r).toFixed(1)}px from the attic hatch tag (needs 12, PN-A)`);
    if (home.flame && home.bar && home.flame.t < home.bar.b + 6) problems.push(`${tag}: streak flame starts ${(home.flame.t - home.bar.b).toFixed(1)}px below the rail, too close to its bottom edge to read clear (needs 6, PN-E)`);
    if (home.tall && home.plaque && home.stack && home.stack.t - home.plaque.b > 14) problems.push(`${tag}: ${(home.stack.t - home.plaque.b).toFixed(1)}px dead band between Descend and the shelf spines (PN-F)`);
    // D: the candle on a run
    await page.locator('#bPlay, #bUnl').first().click({timeout: T});
    const primary = page.locator('[role=dialog].intro button.bs-primary:not([data-act])').first();
    if (await primary.count()) await primary.click({timeout: T});
    await page.locator('#candle').waitFor({state: 'attached', timeout: T});
    await page.waitForTimeout(900);
    const run = await page.evaluate(() => {
      const vis = e => e && e.getClientRects().length > 0;
      const slip = [...document.querySelectorAll('.slip')].find(vis), plate = document.querySelector('#candle .plate');
      return slip && plate ? {slipR: slip.getBoundingClientRect().right, plateR: plate.getBoundingClientRect().right} : null;
    });
    if (run && run.plateR > run.slipR + 20) problems.push(`${tag}: candle plate overhangs the answer slip by ${(run.plateR - run.slipR).toFixed(1)}px (needs 20 or less, PN-D)`);
    // B and C: the Room filter on the shelf
    await page.goto(url, {waitUntil: 'load'});
    await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T});
    await page.waitForTimeout(700);
    await page.locator('#bAll').click({timeout: T});
    await page.locator('.chipgroup').first().waitFor({state: 'attached', timeout: T});
    const roomGroup = page.locator('.chipgroup:has(.chips[aria-label="Room"])');
    const fold = roomGroup.locator('.fold');
    if (await fold.count() && !(await roomGroup.first().evaluate(g => g.classList.contains('open')))) { await fold.first().click({timeout: T}); await page.waitForTimeout(500); }
    const shelf = await page.evaluate(() => {
      const vis = e => e && e.getClientRects().length > 0;
      const g = [...document.querySelectorAll('.chipgroup')].find(x => vis(x) && x.querySelector('.chips[aria-label="Room"]'));
      if (!g) return null;
      const chips = [...g.querySelectorAll('.fchip')].filter(vis);
      const box = g.querySelector('.chips').getBoundingClientRect();
      const lastB = Math.max(...chips.map(c => c.getBoundingClientRect().bottom));
      const dots = chips.filter(c => c.querySelector('.dot')).map(c => {
        const d = c.querySelector('.dot').getBoundingClientRect(), tn = [...c.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
        if (!tn) return null;
        const rg = document.createRange(); rg.selectNodeContents(tn); const tb = rg.getBoundingClientRect();
        return Math.abs((d.top + d.bottom) / 2 - (tb.top + tb.bottom) / 2);
      }).filter(x => x !== null);
      return {band: box.bottom - lastB, dotOff: dots.length ? Math.max(...dots) : 0};
    });
    if (!shelf) problems.push(`${tag}: the shelf Room filter did not open`);
    else {
      if (shelf.band > 12) problems.push(`${tag}: ${shelf.band.toFixed(1)}px blank band under the open Room filter (PN-B)`);
      if (shelf.dotOff > 3) problems.push(`${tag}: a Room colour dot is ${shelf.dotOff.toFixed(1)}px off its label's line (PN-C)`);
    }
  } catch (e) { problems.push(`${tag}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
}
await browser.close(); server.close();
if (problems.length) { console.error('ra-fixes FAILED:\n' + problems.map(p => ' - ' + p).join('\n')); process.exit(1); }
console.log(`ra-fixes: ok (${Object.keys(ROOMS).length} rooms, rail at ${RAIL_WIDTHS.join('/')}px, today card and ledger at 375 and 1280)`);
