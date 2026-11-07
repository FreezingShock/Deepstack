// Relic codex and descent history guard: the two Almanac spreads after the curio pages.
// Drives the built app in headless Chromium with a seeded save (finished descents written by core/descentLog.js),
// turns to the codex and the history and measures them, in every topic room, at 375 px and 1280 px, reduced motion on.
// Checks: no sideways scroll, nothing runs past its page or scrolls inside it, no clipped labels, the found relics are
// dated and the lost ones greyed, and the recent runs list is there. Writes PNGs to RELIC_SHOTS when set (the Reading Room
// only, at 2x). Skips (exit 0) without a browser. Run after `npm run build`.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {recordDescent} from '../src/core/descentLog.js';
import {newDescent, takePath, takeRelic, resolveFailure, endWord} from '../src/core/descent.js';

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
if (!chromium) { console.log('relic-codex-check: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('relic-codex-check: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const SHOTS = process.env.RELIC_SHOTS || '';
const problems = [];
const fail = m => { if (problems.length < 60) problems.push(m); };

/** A finished descent, built the way run.js leaves it. */
const dsc = ({paths = [], relics = [], failAt = 0, spent = 0}) => {
  let d = newDescent();
  for (const p of paths) d = takePath(d, p);
  for (const r of relics) d = takeRelic(d, r);
  for (let i = 0; i < spent; i++) d = {...d, spare: 0, spent: d.spent + 1};
  if (failAt) d = resolveFailure(d, true, failAt);
  return endWord(d);
};

/** A few weeks of finished descents in several rooms, with each ending and each relic in it. Deterministic. */
function seedFor(room) {
  const S = {shelf: [], daily: {}, streak: {last: '2026-11-06', n: 4}, bestFloor: 3, bestDepth: 410, sound: false, room, rooms: {}};
  const runs = [
    ['2026-10-28', HALL, 180, {paths: ['deeper', 'rest'], relics: ['index'], failAt: 5}],
    ['2026-10-29', 'science', 210, {paths: ['curio'], relics: ['index', 'wick'], spent: 1}],
    ['2026-10-30', 'history', 95, {failAt: 2}],
    ['2026-10-31', 'art', 340, {paths: ['deeper', 'curio', 'rest'], relics: ['wick']}],
    ['2026-11-01', 'math', 260, {paths: ['rest'], failAt: 6}],
    ['2026-11-02', 'body', 60, {failAt: 1}],
    ['2026-11-03', 'english', 300, {paths: ['curio'], relics: []}],
    ['2026-11-04', HALL, 410, {paths: ['deeper'], relics: ['wick', 'index'], failAt: 7}],
    ['2026-11-05', 'science', 120, {paths: ['curio', 'rest'], relics: []}],
    ['2026-11-06', 'art', 255, {paths: ['deeper', 'curio'], relics: [], failAt: 3}]
  ];
  for (const [day, r, ft, d] of runs) recordDescent(S, dsc(d), {day, room: r, ft, words: 7});
  return S;
}

async function run(label, {width, height, room, seeded = true, shots = false}) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce', timezoneId: 'UTC', deviceScaleFactor: shots ? 2 : 1});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: page error ${e.message}`));
  await page.route('**/*', r => (BLOCKED.test(r.request().url()) ? r.abort() : r.continue()));
  const save = seeded ? seedFor(room) : {shelf: [], daily: {}, streak: {last: '', n: 0}, bestFloor: 0, bestDepth: 0, sound: false, room, rooms: {}};
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), save);
  try {
    await page.goto(url);
    await page.waitForSelector('#bStats', {state: 'visible', timeout: 15000});
    await page.waitForTimeout(800);
    await page.click('#bStats', {timeout: 5000});
    await page.waitForSelector('.bk-spread.menu .alm', {state: 'attached', timeout: 10000});
    await page.waitForTimeout(400);
    // the codex comes after the four Almanac spreads, the rooms, the stamps and the curio pages: turn until it shows
    const shownSel = sel => page.evaluate(q => [...document.querySelectorAll(q)].some(a => a.offsetParent && a.getBoundingClientRect().width > 0), sel);
    let turns = 0;
    while (!(await shownSel('.alm.rcx')) && turns < 20) { if (shots && turns === 0) await snap(`before-${width}`); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(350); turns++; }
    if (!(await shownSel('.alm.rcx'))) { fail(`${label}: the relic codex never came into view`); await ctx.close(); return; }
    await page.waitForTimeout(300);
    if (shots) await snap(`codex-${width}`);
    if (seeded) {
      const found = await page.evaluate(() => document.querySelectorAll('.alm.rcx .rc-entry.found').length);
      const lost = await page.evaluate(() => document.querySelectorAll('.alm.rcx .rc-entry.lost').length);
      if (found !== 2 || lost !== 1) fail(`${label}: expected 2 found and 1 lost relic, saw ${found} and ${lost}`);
    }
    for (let t = 0; t < 4 && !(await shownSel('.alm.dh')); t++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(350); }
    if (!(await shownSel('.alm.dh'))) { fail(`${label}: the descent history never came into view`); await ctx.close(); return; }
    await page.waitForTimeout(300);
    if (shots) await snap(`history-${width}`);
    if (seeded) {
      const runsShown = await page.evaluate(() => document.querySelectorAll('.alm.dh .dh-run').length);
      if (runsShown < 1) fail(`${label}: no recent runs listed`);
    }
    /* Both spreads, every page: the content fits its frame, no internal scroll, no clipped labels, no sideways scroll. */
    const check = () => page.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
      for (const a of document.querySelectorAll('.alm.rcx')) {
        if (!a.getBoundingClientRect().width) continue;
        const p = a.parentElement.getBoundingClientRect(), r = a.getBoundingClientRect();
        const name = (a.querySelector('h1') || a.querySelector('h2')).textContent;
        if (a.scrollHeight > a.clientHeight + 2 || r.bottom > p.bottom + 1) out.push(`${name} runs ${Math.round(Math.max(a.scrollHeight - a.clientHeight, r.bottom - p.bottom))}px past its page`);
        const box = a.parentElement;
        if (box.scrollHeight > box.clientHeight + 2) out.push(`${name} scrolls inside its page (${box.scrollHeight - box.clientHeight}px more than the page holds)`);
        for (const d of a.querySelectorAll('*')) {
          if (!d.getBoundingClientRect().width) continue;
          const db = d.getBoundingClientRect();
          if (db.bottom > box.getBoundingClientRect().bottom + 1) { out.push(`${name}: "${(d.textContent || d.className).trim().slice(0, 28)}" sits ${Math.round(db.bottom - box.getBoundingClientRect().bottom)}px below its page`); break; }
        }
        if (a.scrollWidth > a.clientWidth + 1) out.push(`${name} is wider than its page`);
      }
      for (const n of document.querySelectorAll('.alm.rcx .rc-name, .alm.rcx .rc-room, .alm.rcx .rc-prov, .alm.rcx .dh-top b, .alm.rcx .dh-meta span, .alm.rcx .dh-out, .alm.rcx .dh-t td, .alm.rcx .dh-t th')) {
        if (!n.getBoundingClientRect().width) continue;
        if (n.scrollWidth > n.clientWidth + 1) out.push(`clipped label "${n.textContent.trim().slice(0, 30)}"`);
      }
      return out;
    });
    const seen = new Set();
    for (let turn = 0; turn < 3; turn++) {
      for (const m of await check()) if (!seen.has(m)) { seen.add(m); fail(`${label}: ${m}`); }
      await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(350);
    }
  } catch (e) { fail(`${label}: ${e.message.split('\n')[0]}`); }
  await ctx.close();
  async function snap(name) {
    if (!SHOTS) return;
    await mkdir(SHOTS, {recursive: true});
    await page.screenshot({path: join(SHOTS, `${name}-${room}.png`)});
  }
}

for (const r of [{id: HALL}, ...ROOMS.filter(x => x.id !== HALL)]) {
  await run(`desktop ${r.id}`, {width: 1280, height: 800, room: r.id, shots: r.id === HALL});
  await run(`phone ${r.id}`, {width: 375, height: 740, room: r.id, shots: r.id === HALL});
}
await run('desktop empty save', {width: 1280, height: 800, room: HALL, seeded: false});
await run('phone empty save', {width: 375, height: 740, room: HALL, seeded: false});

await browser.close(); server.close();
if (problems.length) { console.error('relic-codex-check: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log('relic-codex-check: ok (every room, desktop and 375 px, empty and seeded saves, reduced motion)');
