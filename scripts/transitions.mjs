// Transition guard: the attic climb and the home book open/close have been rebuilt more than once, and unit tests
// cannot see a regression in how they feel. This drives the built app in headless Chromium and checks, with a seeded
// save, that (1) rows cannot change until the attic is fully in, (2) scrolling down brings you home, and (3) opening
// and closing each home book never leaves the room half-gone or the home locked. Skips (exit 0) without a browser.
// Tests only; it reads the DOM and never changes behaviour. Run after `npm run build`.
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
if (!chromium) { console.log('transitions: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('transitions: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = m => problems.push(m);
const T = 8000;

// 60 floorless books: enough for several attic rows, all of them "earlier finds" that live in the attic.
const seed = {shelf: Array.from({length: 60}, (_, i) => ({w: 'word' + i, pos: 'noun', def: 'a thing number ' + i, answer: 'x', score: 60, tier: i % 5, mode: 'unlimited', t: 1.7e12 + i * 1e6, rows: 3, ft: 30})), sound: false};

const ctx = await browser.newContext({viewport: {width: 1280, height: 800}});
const page = await ctx.newPage();
await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
page.on('pageerror', e => fail('pageerror: ' + e.message));
await page.addInitScript(s => { try { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify(s)); } catch {} }, seed);
await page.goto(url, {waitUntil: 'load'});
await page.locator('#home').waitFor({state: 'visible', timeout: T}).catch(() => fail('home never rendered'));

const homeAway = () => page.evaluate(() => document.querySelector('#home')?.classList.contains('attic-away') || false);
const rowText = () => page.evaluate(() => document.querySelector('.attic-depth')?.textContent || '');
const rowNo = async () => +((/row (\d+) of/.exec(await rowText()) || [])[1] || 0);
const wheel = async dy => { await page.mouse.move(640, 400); await page.mouse.wheel(0, dy); };

// 1. Climb in. While the climb is under way, row moves are refused; once it lands, one notch moves one row.
if (!(await page.locator('.attic-cue-home').count())) fail('attic entrance missing from home');
else {
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => document.querySelector('#home')?.classList.contains('attic-away'), null, {timeout: T}).catch(() => fail('ArrowUp on home did not climb into the attic'));
  if (await homeAway()) {
    for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(30); }
    if (await rowNo() > 1) fail(`row changed mid-climb (row ${await rowNo()})`);
    // The climb length depends on machine load (CI runs three browsers at once), so poll for the landing: keep nudging
    // one row further in until it takes. Early presses are swallowed by the lock, which is the behaviour under test.
    const rows = +((/of (\d+)/.exec(await rowText()) || [])[1] || 0);
    if (rows < 2) fail('seeded attic has fewer than 2 rows; cannot check row moves');
    else {
      for (let i = 0; i < 20 && await rowNo() < 2; i++) { await page.waitForTimeout(400); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(250); }
      if (await rowNo() !== 2) fail(`ArrowUp after landing did not go one row further in (row ${await rowNo()})`);
      await wheel(-300); await page.waitForTimeout(80); await wheel(-300);
      await page.waitForTimeout(150);
      if (await rowNo() > 3) fail('two quick wheel notches moved more than one row each (rest period broken)');
      await page.waitForTimeout(900);
      // 2. scroll down returns through the rows and then home
      for (let i = 0; i < 14 && await homeAway(); i++) { await wheel(200); await page.waitForTimeout(700); }
      await page.waitForFunction(() => !document.querySelector('#home')?.classList.contains('attic-away'), null, {timeout: T}).catch(() => fail('scrolling down never returned home'));
      if (await page.locator('.attic-down').isVisible()) fail('"Down the ladder" still showing after returning home');
    }
  }
}
// ...and Escape from the attic goes home too
await page.waitForTimeout(1200);
await page.keyboard.press('ArrowUp');
await page.waitForFunction(() => document.querySelector('#home')?.classList.contains('attic-away'), null, {timeout: T}).catch(() => fail('could not re-enter the attic'));
await page.keyboard.press('Escape');
await page.waitForFunction(() => !document.querySelector('#home')?.classList.contains('attic-away'), null, {timeout: T}).catch(() => fail('Escape did not leave the attic'));
await page.waitForTimeout(1000);

// 3. Each home book opens, then closes without leaving the home locked, hidden or faded. The close is sampled every
// 40 ms and logged; the hard check is that the home itself is never display:none/hidden during it and always settles
// back to fully shown (title and plaque included). The room fades in under the flying book (W1, #272), so by about
// 200 ms into the close (sample 5) the title/plaque must be at least faintly there, and by the last sample (~480 ms)
// mostly there. Before W1 they sat at 0 until ~360 ms, a lone book on bare brick; that now fails.
const MIN_AT_200MS = 0.05, MIN_AT_END = 0.5;
const homeState = () => page.evaluate(() => {
  const home = document.querySelector('#home'), cs = home && getComputedStyle(home);
  const t = ['.hz-title', '.hz-plaque'].map(s => { const e = document.querySelector(s); return e ? +getComputedStyle(e).opacity : 1; });
  return {shown: !!home && !home.hidden && cs.display !== 'none' && cs.visibility !== 'hidden', vis: Math.min(...t), at: performance.now()};
});
for (const [id, name] of [['bDaily', 'Daily'], ['bUnl', 'Unlimited'], ['bAll', 'Shelf'], ['bSets', 'Sets'], ['bStats', 'Stats']]) {
  const btn = page.locator('#' + id);
  if (!(await btn.count())) { fail(`${name}: book missing from home`); continue; }
  await btn.click({timeout: T}).catch(() => fail(`${name}: could not click book`));
  const dlg = page.locator('[role=dialog].intro').first();
  if (!await dlg.waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) { fail(`${name}: never opened`); continue; }
  if (await page.locator('#home.book-opening').count() === 0) fail(`${name}: home not marked book-opening while open`);
  const t0 = await page.evaluate(() => performance.now());
  await page.keyboard.press('Escape');
  const samples = [];
  for (let i = 0; i < 12; i++) { const s = await homeState(); samples.push(s); if (!s.shown) fail(`${name}: home hidden during close (frame ${i})`); await page.waitForTimeout(40); }
  // judge by elapsed time, not sample index (a loaded runner takes ~50-100 ms per sample); 260 ms still catches the old bug, which stayed bare until ~360 ms
  if (samples.filter(s => s.at - t0 >= 260).some(s => s.vis < MIN_AT_200MS)) fail(`${name}: home still bare 200 ms into the close (bare brick under the flying book)`);
  if (samples[samples.length - 1].vis < MIN_AT_END) fail(`${name}: home only ${samples[samples.length - 1].vis.toFixed(2)} visible at the end of the close`);
  await dlg.waitFor({state: 'detached', timeout: T}).catch(() => fail(`${name}: did not close`));
  await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => fail(`${name}: home stayed locked after closing`));
  await page.waitForFunction(() => ['.hz-title', '.hz-plaque'].every(s => { const e = document.querySelector(s); return !e || +getComputedStyle(e).opacity > 0.99; }), null, {timeout: 3000})
    .catch(() => fail(`${name}: home title/plaque never came back after closing`));
  if (!(await page.locator('#bPlay, #bRes').first().isVisible())) fail(`${name}: Descend button missing after closing`);
  console.log(`transitions: ${name} close, opacity@ms: ${samples.map(s => s.vis.toFixed(2) + '@' + Math.round(s.at - t0)).join(' ')}`);
}

await browser.close(); server.close();
if (problems.length) { console.error('transitions: FAILED\n - ' + [...new Set(problems)].join('\n - ')); process.exit(1); }
console.log('transitions: ok');
