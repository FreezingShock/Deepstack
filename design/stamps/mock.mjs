// Mockup sheet for achievement stamps (design only, not a test). Run after `npm run build`:
//   node design/stamps/mock.mjs            -> writes PNGs to MOCK_OUT (default /mnt/project-files/screenshots/room-stamps)
// It opens the real built app with a seeded save, then injects each option into the real screen:
//   Placement A  the Almanac's Rooms book (the Side by side page is swapped for a stamp page for the mock)
//   Placement B  the room's title line on the home room, under its name
//   Placement C  the Librarian's Card (desktop only; phones use the Room Ledger)
// Looks: X wax seal, Y bookplate, Z gilt medallion. A toast preview is shown for each look on desktop.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = join(process.cwd(), 'dist');
const OUT = process.env.MOCK_OUT || '/mnt/project-files/screenshots/room-stamps';
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
catch { ({chromium} = (await import('node:module')).createRequire(import.meta.url)('playwright')); }
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
await mkdir(OUT, {recursive: true});

// Topic rooms with their fire colours (src/core/rooms.js), and a plausible mid-way collection.
const ROOMS = [
  {id: 'history', short: 'Chronicle', rgb: '235,60,60', glyph: 'H'},
  {id: 'math', short: 'Counting House', rgb: '70,140,255', glyph: 'M'},
  {id: 'science', short: 'Observatory', rgb: '90,215,110', glyph: 'S'},
  {id: 'english', short: 'Scriptorium', rgb: '60,210,200', glyph: 'E'},
  {id: 'art', short: 'Gallery', rgb: '175,110,255', glyph: 'A'},
  {id: 'body', short: 'Anatomy Theatre', rgb: '240,80,150', glyph: 'B'}
];
const KINDS = [
  {key: 'first', name: 'First word', glyph: '✦', hint: 'Meet a word in this room.'},
  {key: 'quarter', name: 'A quarter shelved', glyph: '¼', hint: 'Meet a quarter of the room.'},
  {key: 'half', name: 'Half the room', glyph: '½', hint: 'Meet half of the room.'},
  {key: 'mastered', name: 'Room mastered', glyph: '★', hint: 'Meet every word of the room.'},
  {key: 'week', name: 'A week of Dailies', glyph: '7', hint: 'Seven Dailies in a row here.'},
  {key: 'perfect', name: 'Perfect Daily', glyph: '✓', hint: 'Every word at 78 or better, none skipped.'}
];
// Earned so far (day). Matches the shape S.stamps will have: {'<room>.<key>': 'YYYY-MM-DD'}.
const EARNED = {
  'history.first': '2026-11-02', 'history.quarter': '2026-11-03', 'history.half': '2026-11-05', 'history.week': '2026-11-06',
  'math.first': '2026-10-30', 'math.quarter': '2026-11-01', 'science.first': '2026-11-04', 'english.first': '2026-11-06', 'art.first': '2026-11-05'
};
const TOTAL = ROOMS.length * KINDS.length + 4;
const SEED_DAY = '2026-11-06';

const CSS = `
.mk-row{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center}
.mk-set{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.stp{--s:40px;position:relative;display:inline-grid;place-items:center;width:var(--s);height:var(--s);border-radius:50%;
  font-family:'AnthropicSerif','Georgia',serif;color:#2a1f14;flex:none;box-sizing:border-box}
.stp i{font-style:normal;font-size:calc(var(--s)*.42);line-height:1;font-weight:600}
.stp b,.stp small{display:none}
.stp.off{background:transparent;border:1.5px dashed rgba(90,70,40,.35);color:rgba(90,70,40,.35)}
.stp.off i{opacity:.45}
.mk-x .stp.on{background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.38),transparent 42%),
  radial-gradient(circle,rgb(var(--c)) 0 58%,rgba(var(--c),.78) 60% 100%);box-shadow:inset 0 0 0 2px rgba(255,240,210,.55),inset 0 -3px 5px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.35);color:#fff6e4}
.mk-x .stp.on i{text-shadow:0 1px 0 rgba(0,0,0,.35)}
.mk-x .stp.off{width:var(--s);height:var(--s)}
.mk-y .stp{width:auto;min-width:var(--s);height:auto;border-radius:3px;padding:4px 6px 4px;display:grid;justify-items:center;gap:1px;
  background:#f4e9cf;border:1px solid rgba(var(--c),.9);box-shadow:inset 0 0 0 2px #f4e9cf,inset 0 0 0 3px rgba(var(--c),.55);text-align:center;max-width:var(--ww,92px)}
.mk-y .stp i{display:none}
.mk-y .stp b{display:block;font-size:calc(var(--s)*.2);line-height:1.1;font-weight:600;color:#3a2a1a;text-transform:uppercase;letter-spacing:.04em}
.mk-y .stp small{display:block;font-size:calc(var(--s)*.18);font-style:italic;color:rgba(58,42,26,.7)}
.mk-y .stp.off{background:transparent;border:1px dashed rgba(90,70,40,.4);box-shadow:none}
.mk-y .stp.off b,.mk-y .stp.off small{color:rgba(90,70,40,.5)}
.mk-z .stp.on{background:conic-gradient(from 200deg,#8a6420,#e9c879,#a57a2e,#f3dc98,#8a6420,#e9c879,#8a6420);padding:4px;box-shadow:0 2px 4px rgba(0,0,0,.35)}
.mk-z .stp.on::after{content:"";position:absolute;inset:4px;border-radius:50%;background:radial-gradient(circle at 36% 30%,rgba(255,255,255,.3),transparent 45%),rgb(var(--c))}
.mk-z .stp.on i{position:relative;z-index:1;color:#fff8e6;text-shadow:0 1px 1px rgba(0,0,0,.4)}
.mk-z .stp.on{color:#fff8e6}
.mk-z .stp.off{border:1.5px solid rgba(190,150,80,.4);color:rgba(190,150,80,.5)}
.mk-z .stp.off i{opacity:.7}
.mk-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 32px);display:flex;gap:10px;align-items:center;padding:9px 14px 9px 10px;border-radius:6px;
  background:rgba(28,20,12,.94);color:#f1e3c4;font:14px/1.3 'AnthropicSerif','Georgia',serif;box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:99;border:1px solid rgba(201,160,74,.45)}
.mk-toast>div b{font-weight:600;display:block}.mk-toast>div small{opacity:.7;font-style:italic;display:block}
.mk-toast .stp{--s:34px}
.mk-toast .stp .i,.mk-toast .stp i{font-size:14px}
.mk-stamp-page h1{margin-bottom:2px}
.mk-stamp-page .sr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 10px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(90,70,40,.18)}
.mk-stamp-page .sr .nm{font-size:13px;display:flex;gap:6px;align-items:center}
.mk-stamp-page .sr .nm i.dot{width:9px;height:9px;border-radius:50%;background:rgb(var(--c));display:inline-block}
.mk-stamp-page .sr .mk-set{grid-column:1/-1}
`;

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const pretty = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'});
/** One seal. earned: boolean. `look` only changes CSS, the markup is the same for all three looks. */
const seal = (room, kind, day, size) => {
  const id = `${room.id}.${kind.key}`, on = !!day;
  return `<span class="stp ${on ? 'on' : 'off'}" style="--c:${room.rgb};--s:${size}px;--ww:${Math.max(size * 2.3, 60)}px" title="${esc(kind.name)}: ${esc(kind.hint)}${on ? ' Earned ' + pretty(day) : ''}"><i>${on ? esc(kind.glyph) : '·'}</i><b>${esc(kind.name)}</b><small>${on ? pretty(day) : 'not yet'}</small></span>`;
};
const libSeal = (kind, earned, size) => `<span class="stp ${earned ? 'on' : 'off'}" style="--c:201,164,88;--s:${size}px;--ww:${Math.max(size * 2.3, 60)}px"><i>${earned ? esc(kind.glyph) : '·'}</i><b>${esc(kind.name)}</b><small>${earned ? 'earned' : 'not yet'}</small></span>`;
const count = Object.keys(EARNED).length;

/** Placement A: the Rooms page becomes a Stamps page: one row per room, its six seals, then the library's four. */
function pageA(size) {
  const rows = ROOMS.map(r => `<div class="sr" style="--c:${r.rgb}"><span class="nm"><i class="dot"></i>${esc(r.short)}</span><span>${KINDS.filter(k => EARNED[`${r.id}.${k.key}`]).length}/6</span><div class="mk-set">${KINDS.map(k => seal(r, k, EARNED[`${r.id}.${k.key}`], size)).join('')}</div></div>`).join('');
  return `<div class="alm rs mk-stamp-page"><h1>Stamps</h1><div class="kicker">${count} of ${TOTAL} earned</div>
   <p class="note">Earned once and kept. Each room has six. Four more are for the whole library.</p>
   ${rows}
   <div class="sr" style="--c:201,164,88"><span class="nm"><i class="dot"></i>The library</span><span>0/4</span><div class="mk-set">${[{key: 'doors', name: 'Every door opened', glyph: '⌂', hint: ''}, {key: 'shelves', name: 'Full shelves', glyph: '❀', hint: ''}, {key: 'week', name: 'Any-room week', glyph: '7', hint: ''}, {key: 'hundred', name: 'A hundred words', glyph: '100', hint: ''}].map(k => libSeal(k, false, size)).join('')}</div></div></div>`;
}
/** Placement B: a row under the room's name on the home room (the room's own six). */
const pageB = size => ROOMS[1] && `<div class="mk-row mk-set" style="margin-top:6px">${KINDS.map(k => seal(ROOMS[1], k, EARNED[`math.${k.key}`], size)).join('')}</div>`;
/** Placement C: a Librarian's Card row for the count, with the last few earned seals under it. */
const pageC = size => `<div class="lg-row" style="display:flex;justify-content:space-between;gap:10px"><span>Stamps</span><b>${count} of ${TOTAL}</b></div>
   <div class="mk-row mk-set" style="padding:6px 0 2px">${['history.week', 'history.half', 'math.quarter', 'english.first'].map(k => { const [rid, key] = k.split('.'); const r = ROOMS.find(x => x.id === rid), kind = KINDS.find(x => x.key === key); return seal(r, kind, EARNED[k], size); }).join('')}</div>`;
const toastHTML = look => `<div class="mk-toast" role="status"><span class="stp on" style="--c:90,215,110;--s:34px;--ww:90px"><i>${esc(KINDS[5].glyph)}</i><b>${esc(KINDS[5].name)}</b><small>The Observatory</small></span><div><b>Stamp earned: Perfect Daily</b><small>The Observatory · ${esc(look)}</small></div></div>`;

async function openSave(width, height) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  const page = await ctx.newPage();
  await page.route('**/*', r => BLOCKED.test(r.request().url()) ? r.abort() : r.continue());
  const save = {shelf: [], sound: false, bestFloor: 1, streak: {last: SEED_DAY, n: 2}, room: 'history', stamps: EARNED, met: {}, rooms: {}};
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), save);
  await page.goto(url);
  await page.waitForSelector('#bStats', {state: 'visible', timeout: 15000});
  await page.waitForTimeout(1200);
  return {ctx, page};
}
const lookStyle = async (page, look) => page.evaluate(l => { document.body.classList.remove('mk-x', 'mk-y', 'mk-z'); document.body.classList.add('mk-' + l); }, look);
async function inject(page, css) { await page.evaluate(c => { const s = document.createElement('style'); s.id = 'mk-css'; s.textContent = c; document.head.appendChild(s); }, CSS); }

const LOOKS = [['x', 'wax'], ['y', 'bookplate'], ['z', 'gilt']];
const shots = [];
for (const [w, h, tag] of [[1280, 800, 'desktop'], [375, 740, 'phone']]) {
  const size = w > 800 ? 40 : 34;
  // Placement A: Almanac, Rooms book. Phones show the Rooms page first, desktop the right-hand page.
  for (const [look, name] of LOOKS) {
    const {ctx, page} = await openSave(w, h);
    await inject(page, CSS);
    await page.evaluate(() => document.getElementById('bStats').click());
    await page.waitForSelector('.bk-spread', {state: 'visible', timeout: 8000});
    for (let i = 0; i < 12 && !(await page.evaluate(() => { const p = document.querySelector('.alm.rs'); return !!p && p.offsetParent !== null; })); i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(450); }
    await page.waitForSelector('.alm.rs', {state: 'visible', timeout: 8000});
    await page.waitForTimeout(600);
    await page.evaluate(({html, idx}) => { const pages = [...document.querySelectorAll('.alm.rs')]; const el = pages[idx] || pages[0]; const d = document.createElement('div'); d.innerHTML = html; el.replaceWith(d.firstElementChild); }, {html: pageA(size), idx: w > 800 ? 1 : 0});
    await lookStyle(page, look);
    await page.waitForTimeout(300);
    const f = `A-${look}-${name}-${tag}-${w}.png`; await page.screenshot({path: join(OUT, f)}); shots.push(f);
    await ctx.close();
  }
  // Placement B: home room title line. Desktop and phone.
  for (const [look, name] of LOOKS) {
    const {ctx, page} = await openSave(w, h);
    await inject(page, CSS);
    await page.waitForSelector('.hz-title .tagline', {state: 'attached', timeout: 15000});
    await page.evaluate(({html}) => { const t = document.querySelector('.hz-title .tagline'); t.insertAdjacentHTML('afterend', html); const z = document.querySelector('.hz-title'); z.style.height = 'auto'; z.style.overflow = 'visible'; z.querySelector('.mk-row').style.justifyContent = 'center'; }, {html: pageB(size)});
    await lookStyle(page, look);
    await page.waitForTimeout(300);
    const f = `B-${look}-${name}-${tag}-${w}.png`; await page.screenshot({path: join(OUT, f)}); shots.push(f);
    await ctx.close();
  }
  // Placement C: Librarian's Card, desktop only (phones use the Room Ledger).
  if (w > 800) for (const [look, name] of LOOKS) {
    const {ctx, page} = await openSave(w, h);
    await inject(page, CSS);
    await page.waitForSelector('.lg-row#bStreak', {state: 'visible', timeout: 15000});
    await page.evaluate(({html}) => { const r = document.querySelector('.lg-row#bStreak'); r.insertAdjacentHTML('afterend', html); }, {html: pageC(34)});
    await lookStyle(page, look);
    await page.waitForTimeout(300);
    const f = `C-${look}-${name}-${tag}-${w}.png`; await page.screenshot({path: join(OUT, f)}); shots.push(f);
    await ctx.close();
  }
  // Toast: the same look, a small banner that fades after a few seconds.
  for (const [look, name] of LOOKS) {
    const {ctx, page} = await openSave(w, h);
    await inject(page, CSS);
    await page.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), toastHTML(name));
    await lookStyle(page, look);
    await page.waitForTimeout(300);
    const f = `toast-${look}-${name}-${tag}-${w}.png`; await page.screenshot({path: join(OUT, f)}); shots.push(f);
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(shots.join('\n'));
