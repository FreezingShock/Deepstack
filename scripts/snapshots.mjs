// Seeded screenshot snapshots of key screens, compared with a tolerant diff, plus a few
// behaviour checks that need the real app (home free of the last run's leftovers).
//   node scripts/snapshots.mjs            compare with test/snapshots/*.png (run after `npm run build`)
//   node scripts/snapshots.mjs --update   rewrite the baselines (review the images before committing!)
// Skips (exit 0) when no Chromium is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.
// Stability: the clock is faked and paused, Math.random is seeded, the date is fixed, and every
// request outside the local server (web fonts etc.) is aborted so each machine renders the same
// fallback fonts. Text may still antialias a little differently across machines, so the diff
// only counts pixels that changed a lot and allows a small fraction of them.
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {extname, join, normalize} from 'node:path';

const UPDATE = process.argv.includes('--update');
const SNAP_DIR = join(process.cwd(), 'test', 'snapshots');
const OUT_DIR = join(process.cwd(), 'snapshot-diffs');
const VIEW = {width: 960, height: 640};
const PIXEL_DELTA = 48;       // a pixel "changed" when any channel moves more than this (of 255)
const MAX_CHANGED = 0.10;     // fail when more than 10% of pixels changed: catches broken or missing screens, tolerates small visual tweaks
const WORD_ANSWER = 'a place where dead people are buried';

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
if (!chromium) { console.log('snapshots: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('snapshots: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const failures = [], errors = [];
const fail = m => { failures.push(m); console.error('FAIL ' + m); };

// Fraction of pixels that differ by more than PIXEL_DELTA, computed in a blank page (no PNG library needed).
const cmpPage = await browser.newPage();
await cmpPage.setContent('<canvas id=a></canvas><canvas id=b></canvas>');
async function changedFraction(bufA, bufB) {
  return cmpPage.evaluate(async ([a, b, delta]) => {
    const load = s => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return 1;
    const px = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const da = px(ia), db = px(ib); let n = 0;
    for (let i = 0; i < da.length; i += 4) if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > delta) n++;
    return n / (da.length / 4);
  }, [bufA.toString('base64'), bufB.toString('base64'), PIXEL_DELTA]);
}

const ctx = await browser.newContext({viewport: VIEW, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block'});
const page = await ctx.newPage();
await page.route(u => !u.href.startsWith(url), r => r.abort());
page.on('pageerror', e => errors.push(e.message));
await page.addInitScript(() => { let a = 12345; Math.random = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; });
await page.clock.install({time: new Date('2026-11-04T12:00:00Z')});
await page.goto(url, {waitUntil: 'load'});
await page.clock.pauseAt(new Date('2026-11-04T12:00:05Z'));
const settle = ms => page.clock.runFor(ms);

const shots = {};
async function snap(name) { shots[name] = await page.screenshot(); }

await settle(3000); await snap('home');
await page.click('#bStats'); await settle(2500); await snap('book-open');
await page.keyboard.press('Escape'); await settle(2000);
await page.click('#bPlay'); await settle(6000); await snap('gameplay');
const word = await page.evaluate(() => { const r = window.__deepstack.run; return r && r.words && r.words[0] && r.words[0].w; });
await page.click('textarea, input[type=text]'); await page.keyboard.type(WORD_ANSWER); await page.keyboard.press('Enter');
await settle(8000); await snap('result-card');

// Behaviour: leave the run and check the home screen is clean (pins #32: no leftover niche, word or answer).
await page.keyboard.press('Enter'); await settle(2500);  // dismiss the card
await page.click('#mark'); await settle(7000);
const home = await page.evaluate(() => ({
  // text a player could actually see: skip hidden elements and the screen-reader-only live region
  text: (() => { const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { const el = n.parentElement; if (el && !el.closest('.sr-only') && el.checkVisibility({checkOpacity: true, checkVisibilityCSS: true})) out.push(n.textContent); }
    return out.join(' '); })(),
  stageHidden: document.querySelector('#stage') ? document.querySelector('#stage').hidden : null,
  cardOn: !!document.querySelector('#cardlayer.on'),
  descend: !!document.querySelector('#bPlay'),
}));
if (!home.descend) fail('home: Descend button missing after leaving a run');
if (home.cardOn) fail('home: a result card is still open after leaving a run');
if (word && home.text.toLowerCase().includes(word.toLowerCase())) fail(`home: last run's word "${word}" is still on screen`);
if (home.text.includes(WORD_ANSWER)) fail('home: last run\'s answer is still on screen');
if (/WORD \d OF \d/i.test(home.text)) fail('home: run HUD ("WORD n OF 7") is still on screen');
await snap('home-after-run');

if (errors.length) fail('page errors:\n' + errors.join('\n'));
await mkdir(SNAP_DIR, {recursive: true});
const names = ['home', 'book-open', 'gameplay', 'result-card', 'home-after-run'];
if (UPDATE) {
  for (const n of names) await writeFile(join(SNAP_DIR, n + '.png'), shots[n]);
  console.log('snapshots: baselines written to test/snapshots/ for ' + names.join(', '));
} else {
  for (const n of names) {
    const file = join(SNAP_DIR, n + '.png');
    if (!existsSync(file)) { fail(`${n}: no baseline (run: node scripts/snapshots.mjs --update)`); continue; }
    const frac = await changedFraction(await readFile(file), shots[n]);
    const ok = frac <= MAX_CHANGED;
    console.log(`snapshots: ${n} ${(frac * 100).toFixed(2)}% changed ${ok ? 'ok' : 'FAIL'}`);
    if (!ok) { await mkdir(OUT_DIR, {recursive: true}); await writeFile(join(OUT_DIR, n + '.actual.png'), shots[n]); fail(`${n} differs from baseline by ${(frac * 100).toFixed(1)}% (max ${MAX_CHANGED * 100}%); see snapshot-diffs/`); }
  }
}
await browser.close(); server.close();
if (failures.length) { console.error(`snapshots: ${failures.length} failure(s)`); process.exit(1); }
console.log('snapshots: ok');
