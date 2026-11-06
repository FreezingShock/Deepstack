// Stress test: a full 300-book save through the shelf, attic and Sets. Prints timings and fails on layout
// breaks or a main-thread stall over the budget. Run after `npm run build`:
//   node scripts/stress300.mjs [--budget 150] [--viewport 1280x800] [--timing-report-only] [--json out.json]
// Timings come from software-rendered headless Chromium, so use them to compare before/after, not as absolutes.
// Skips (exit 0) when no browser is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {fullSave} from './lib/fullSave.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const REPORT_ONLY = process.argv.includes('--timing-report-only'); // CI shares its CPU with other browsers, so there timings are printed but only layout, counts and page errors fail
const BUDGET = +arg('budget', 150), [vw, vh] = arg('viewport', '1280x800').split('x').map(Number), jsonOut = arg('json', '');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try { let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(root, p))); }
  catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
let chromium;
try { ({chromium} = await import('playwright')); } catch { console.log('stress300: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('stress300: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const save = fullSave();
const ctx = await browser.newContext({viewport: {width: vw, height: vh}, serviceWorkers: 'block'});
const page = await ctx.newPage();
await page.route(u => !u.href.startsWith(url), r => r.abort());
const errors = [], failures = [], rows = [];
page.on('pageerror', e => errors.push(e.message));
await page.addInitScript(s => { localStorage.setItem('deepstack.v1', JSON.stringify(s));
  window.__long = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(e.duration))).observe({type: 'longtask', buffered: true}); } catch {} }, save);
await page.goto(url, {waitUntil: 'load'});
await page.locator('#bAll').waitFor({state: 'visible', timeout: 20000});
await page.waitForTimeout(6000); // let the idle-time warm-ups finish, as they would while someone reads the home screen

// Time an action: wall time until `settle` resolves, plus the longest main-thread task seen meanwhile.
async function step(name, fn, {budget = BUDGET} = {}) {
  await page.evaluate(() => { window.__long.length = 0; });
  const t = Date.now(); await fn(); const wall = Date.now() - t;
  await page.waitForTimeout(400);
  const longest = Math.round(Math.max(0, ...await page.evaluate(() => window.__long)));
  const ok = longest <= budget; rows.push({name, wall, longest, ok});
  if (!ok && !REPORT_ONLY) failures.push(`${name}: a ${longest} ms main-thread task (budget ${budget} ms)`);
}
const layout = async (name, sel) => {
  const bad = await page.evaluate(sel => {
    const out = [], vw = innerWidth;
    document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.left < -2 || r.right > vw + 2)) out.push(el.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); });
    return out.slice(0, 5);
  }, sel);
  if (bad.length) failures.push(`${name}: elements outside the viewport: ${bad.join('; ')}`);
};
const count = (sel) => page.locator(sel).count();

await step('open shelf', async () => { await page.click('#bAll'); await page.locator('.sbook').first().waitFor({state: 'attached', timeout: 10000}); });
const counted = await page.locator('[data-count]').first().textContent();
const dom = await page.evaluate(() => document.getElementsByTagName('*').length);
rows.push({name: `shelf says "${counted.trim()}", ${dom} DOM nodes`, wall: 0, longest: 0, ok: true});
if (!/^300 books/.test(counted.trim())) failures.push(`shelf header says "${counted.trim()}", expected 300 books`);
if (dom > 6000) failures.push(`shelf DOM has ${dom} nodes: the shelf is rendering far more than the open spread`);
await layout('shelf', '.sbook, .ssec');
for (const [name, sel] of [['sort', '.fchip[data-s]:nth-of-type(2)'], ['bay', '.fchip[data-g]:nth-of-type(2)'], ['rarity', '.fchip[data-t="3"]']])
  await step('shelf filter: ' + name, async () => { await page.locator(sel).first().click(); await page.waitForTimeout(150); });
await step('shelf search (6 keys)', async () => { await page.locator('#fq').click(); await page.keyboard.type('stra', {delay: 40}); await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace'); });
await step('shelf pull a book', async () => { const b = page.locator('.sbook:visible').first(); if (await b.count()) await b.click(); await page.waitForTimeout(600); });
await page.keyboard.press('Escape'); await page.waitForTimeout(500);
for (let k = 0; k < 4 && await page.locator('.bk-spread').count(); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); }

await step('open sets', async () => { await page.waitForSelector('#bSets', {state: 'visible'}); await page.click('#bSets'); await page.waitForTimeout(800); });
await layout('sets', '.bk-spread *');
await page.keyboard.press('Escape'); await page.waitForTimeout(1200);

await step('climb to attic', async () => { await page.mouse.move(vw / 2, vh / 2); for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -400); await page.waitForTimeout(150); } await page.waitForTimeout(2500); });
await step('scroll attic rows', async () => { for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, -500); await page.waitForTimeout(250); } });
await step('leave attic', async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(2000); });

await browser.close(); server.close();
if (errors.length) failures.push('page errors:\n' + errors.join('\n'));
console.log(`stress300: ${vw}x${vh}, ${save.shelf.length} books, budget ${BUDGET} ms\n${'step'.padEnd(34)} wall(ms) longest-task(ms)`);
for (const r of rows) console.log(`${r.name.padEnd(34)} ${String(r.wall).padStart(7)} ${String(r.longest).padStart(10)} ${r.ok ? '' : ' <-- over budget'}`);
if (jsonOut) await writeFile(jsonOut, JSON.stringify(rows, null, 2));
if (failures.length) { console.error('\nFAIL\n' + failures.join('\n')); process.exit(1); }
console.log('stress300: ok');
