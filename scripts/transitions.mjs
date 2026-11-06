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
const T = 15000; // upper bounds only: waits return the moment the state is true, so a generous cap costs nothing when healthy

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
// Timing rule for this whole file: never decide anything from how long a wall-clock wait took. CI runs several browsers
// at once, so a 30 ms pause can stretch past a 420 ms rest period. Wait on app state (World.atticReady, row label,
// classes) or on the page's own animation clocks instead, and do the time-critical bursts inside one page task.
const atticReady = () => page.evaluate(() => window.__deepstack?.World?.atticReady === true);
const waitAway = (want, msg) => page.waitForFunction(w => document.querySelector('#home')?.classList.contains('attic-away') === w, want, {timeout: T}).then(() => true, () => { fail(msg); return false; });
const waitRow = (n, msg) => page.waitForFunction(n => +((/row (\d+) of/.exec(document.querySelector('.attic-depth')?.textContent || '') || [])[1] || 0) === n, n, {timeout: T}).then(() => true, () => { fail(msg); return false; });

// 1. Climb in. While the climb is under way, row moves are refused; once it lands, one notch moves one row.
if (!(await page.locator('.attic-cue-home').count())) fail('attic entrance missing from home');
else {
  await page.keyboard.press('ArrowUp');
  if (await waitAway(true, 'ArrowUp on home did not climb into the attic') && await homeAway()) {
    // Burst of ArrowUps in a single page task, straight after the climb began: the attic cannot have landed in between.
    // (If a machine stalled so long that it had already landed, there is nothing to check, so that run does not judge.)
    const mid = await page.evaluate(() => {
      const ready = () => window.__deepstack?.World?.atticReady === true, wasReady = ready();
      for (let i = 0; i < 3; i++) document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true, cancelable: true}));
      return {wasReady, nowReady: ready(), row: +((/row (\d+) of/.exec(document.querySelector('.attic-depth')?.textContent || '') || [])[1] || 0)};
    });
    if (!mid.wasReady && !mid.nowReady && mid.row > 1) fail(`row changed mid-climb (row ${mid.row})`);
    const rows = +((/of (\d+)/.exec(await rowText()) || [])[1] || 0);
    if (rows < 2) fail('seeded attic has fewer than 2 rows; cannot check row moves');
    else {
      await page.waitForFunction(() => window.__deepstack?.World?.atticReady === true, null, {timeout: T}).catch(() => fail('attic never finished climbing in'));
      // Presses that landed mid-climb were swallowed, so we are on row 1; now exactly one press must go exactly one row.
      if (await atticReady()) {
        if (await rowNo() !== 1) fail(`row moved during the climb (row ${await rowNo()})`);
        await page.keyboard.press('ArrowUp');
        await waitRow(2, `ArrowUp after landing did not go one row further in (row ${await rowNo()})`);
        // Two wheel notches in one burst must move at most one row (the rest period). Wait for the glide to settle first
        // (the row label alone cannot say), then fire both events in one page task so no stall can separate them.
        await page.waitForFunction(() => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 > 700 ? r(true) : requestAnimationFrame(f); f(); }));
        const before = await rowNo();
        await page.evaluate(() => { for (let i = 0; i < 2; i++) window.dispatchEvent(new WheelEvent('wheel', {deltaY: -300, bubbles: true, cancelable: true})); });
        await page.waitForFunction(() => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 > 900 ? r(true) : requestAnimationFrame(f); f(); }));
        if (await rowNo() > before + 1) fail('two quick wheel notches moved more than one row each (rest period broken)');
      }
      // 2. scroll down returns through the rows and then home. Each notch is followed by waiting for the row label or
      // the room to change, never for a fixed time; a notch that lands inside the rest period is simply repeated.
      for (let i = 0; i < 12 && await homeAway(); i++) {
        const r0 = await rowNo();
        await wheel(200);
        await page.waitForFunction(r => !document.querySelector('#home')?.classList.contains('attic-away') || +((/row (\d+) of/.exec(document.querySelector('.attic-depth')?.textContent || '') || [])[1] || 0) !== r, r0, {timeout: 1500}).catch(() => {});
        await page.waitForTimeout(450);
      }
      await page.waitForFunction(() => !document.querySelector('#home')?.classList.contains('attic-away'), null, {timeout: T}).catch(() => fail('scrolling down never returned home'));
      if (await page.locator('.attic-down').isVisible()) fail('"Down the ladder" still showing after returning home');
    }
  }
}
// ...and Escape from the attic goes home too (re-enter until it takes: the hatch ignores presses while still settling)
for (let i = 0; i < 8 && !await homeAway(); i++) { await page.keyboard.press('ArrowUp'); await page.waitForFunction(() => document.querySelector('#home')?.classList.contains('attic-away'), null, {timeout: 1500}).catch(() => {}); }
if (!await homeAway()) fail('could not re-enter the attic');
else {
  await page.waitForFunction(() => window.__deepstack?.World?.atticReady === true, null, {timeout: T}).catch(() => {});
  await page.keyboard.press('Escape');
  await waitAway(false, 'Escape did not leave the attic');
}
// let the descent finish: the home's own title/plaque are fully back before the books are tested
await page.waitForFunction(() => !window.__deepstack?.World?.atticOpen && ['.hz-title', '.hz-plaque'].every(s => { const e = document.querySelector(s); return !e || +getComputedStyle(e).opacity > 0.99; }), null, {timeout: T}).catch(() => {});

// 3. Each home book opens, then closes without leaving the home locked, hidden or faded. The close is sampled every
// 40 ms and logged; the hard check is that the home itself is never display:none/hidden during it and always settles
// back to fully shown (title and plaque included). The room fades in under the flying book (W1, #272), so by about
// 200 ms into the close (sample 5) the title/plaque must be at least faintly there, and by the last sample (~480 ms)
// mostly there. Before W1 they sat at 0 until ~360 ms, a lone book on bare brick; that now fails.
const MIN_AT_200MS = 0.05, MIN_AT_END = 0.5;
const bare = a => a.length ? Math.min(...a).toFixed(2) : 'n/a';
for (const [id, name] of [['bDaily', 'Daily'], ['bUnl', 'Unlimited'], ['bAll', 'Shelf'], ['bSets', 'Sets'], ['bStats', 'Stats']]) {
  const btn = page.locator('#' + id);
  if (!(await btn.count())) { fail(`${name}: book missing from home`); continue; }
  const dlg = page.locator('[role=dialog].intro').first();
  // wait for the home to be idle (no book still landing, attic fully down), then click; retry the click if a loaded
  // machine swallowed it, since a click is only an input and the check is about what the book does afterwards
  await page.waitForFunction(() => { const h = document.querySelector('#home'); return h && !h.classList.contains('book-opening') && !h.classList.contains('book-landed') && !window.__deepstack?.World?.atticOpen; }, null, {timeout: T}).catch(() => {});
  let opened = false;
  for (let i = 0; i < 4 && !opened; i++) {
    await btn.click({timeout: T}).catch(() => {});
    opened = await dlg.waitFor({state: 'visible', timeout: 3000}).then(() => true, () => false);
  }
  if (!opened) { fail(`${name}: never opened`); continue; }
  if (await page.locator('#home.book-opening').count() === 0) fail(`${name}: home not marked book-opening while open`);
  // Sample inside the page on every frame, from before the Escape until the flying book is gone, and judge each frame by
  // the page's own animation clock (the title fade's CSSTransition currentTime), not by how late a Playwright round trip
  // came back. Under load frames get sparse but the timeline still advances, so the same rules hold on a slow machine.
  const sampling = page.evaluate(async id => {
    const spine = document.getElementById(id).getBoundingClientRect(), c = [spine.left + spine.width / 2, spine.top + spine.height / 2];
    const out = {seen: false, early: 1, dist: 1e9, frames: []};
    const t0 = performance.now(); let seenAt = 0;
    // a 330 ms flight can fall between two frames on a stalled machine; the observer cannot miss it
    const mo = new MutationObserver(() => { if (document.querySelector('.bk-spread.flyback')) { out.seen = true; seenAt ||= performance.now(); } });
    mo.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['class']});
    while (performance.now() - t0 < 6000) {
      await new Promise(r => requestAnimationFrame(r));
      const home = document.querySelector('#home'), cs = home && getComputedStyle(home);
      const sp = document.querySelector('.bk-spread.flyback');
      if (!sp && out.seen) break;
      if (out.seen && !seenAt) seenAt = performance.now();
      let flyT = -1;
      if (sp) {
        out.seen = true; seenAt ||= performance.now();
        const fly = sp.getAnimations().find(a => a.transitionProperty === 'transform');
        flyT = fly ? +fly.currentTime : performance.now() - seenAt;
        // AT8: while the book is flying (until the last 150 ms of its flight) it must not have faded
        if (flyT < 150) out.early = Math.min(out.early, +getComputedStyle(sp).opacity);
        const bar = sp.querySelector('.bs-board.r').getBoundingClientRect();
        out.dist = Math.hypot(bar.left + bar.width / 2 - c[0], bar.top + bar.height / 2 - c[1]);
      }
      const vis = Math.min(...['.hz-title', '.hz-plaque'].map(s => { const e = document.querySelector(s); return e ? +getComputedStyle(e).opacity : 1; }));
      const fade = ['.hz-title', '.hz-plaque'].map(s => document.querySelector(s)).filter(Boolean).flatMap(e => e.getAnimations()).find(a => a.transitionProperty === 'opacity');
      // frames before the fade exists and before the book flies carry no clock: they judge nothing
      if (!fade && flyT < 0) continue;
      out.frames.push({t: fade ? +fade.currentTime : flyT, vis, shown: !!home && !home.hidden && cs.display !== 'none' && cs.visibility !== 'hidden'});
    }
    mo.disconnect();
    return out;
  }, id);
  await page.keyboard.press('Escape');
  const flight = await sampling;
  console.log(`transitions: ${name} fly-home early opacity ${flight.early.toFixed(2)}, end distance ${flight.dist.toFixed(1)}px`);
  if (!flight.seen) fail(`${name}: no fly-home phase seen`);
  else if (flight.early < 0.95) fail(`${name}: book faded (${flight.early.toFixed(2)}) instead of sliding home`);
  const frames = flight.frames;
  if (frames.some(f => !f.shown)) fail(`${name}: home hidden during close`);
  // W1: the room is already fading in under the flying book. Judged on the fade's own clock: at least faintly there
  // 200 ms in, mostly there by 400 ms. Frames that never reached that point (the book landed first) judge nothing.
  if (frames.some(f => f.t >= 200 && f.vis < MIN_AT_200MS)) fail(`${name}: home still bare 200 ms into the close (bare brick under the flying book)`);
  if (frames.some(f => f.t >= 400 && f.vis < MIN_AT_END)) fail(`${name}: home only ${Math.min(...frames.filter(f => f.t >= 400).map(f => f.vis)).toFixed(2)} visible 400 ms into the close`);
  await dlg.waitFor({state: 'detached', timeout: T}).catch(() => fail(`${name}: did not close`));
  await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => fail(`${name}: home stayed locked after closing`));
  await page.waitForFunction(() => ['.hz-title', '.hz-plaque'].every(s => { const e = document.querySelector(s); return !e || +getComputedStyle(e).opacity > 0.99; }), null, {timeout: T})
    .catch(() => fail(`${name}: home title/plaque never came back after closing`));
  if (!(await page.locator('#bPlay, #bRes').first().isVisible())) fail(`${name}: Descend button missing after closing`);
  console.log(`transitions: ${name} close, ${frames.length} frames, lowest title/plaque opacity ${bare(frames.map(f => f.vis))}`);
}

// 4. Settings and Credits open as books from the top bar. They once picked up the generic `.panel` class (overflow:auto,
// padding, a dark background), which gave stray scrollbars and a book stuck at its cover with a dark slab beside it.
// Check the open book is fixed-position, never scrolls, fits the viewport, and that the settings controls are in it.
for (const [id, name] of [['bSettings', 'Settings'], ['bCredits', 'Credits'], ['bKeys', 'Shortcuts']]) {
  const btn = page.locator('#' + id);
  if (!(await btn.count())) { fail(`${name}: top bar button missing`); continue; }
  await page.waitForTimeout(600);
  await btn.click({timeout: T}).catch(() => fail(`${name}: could not click button`));
  const dlg = page.locator('[role=dialog].intro').first();
  if (!await dlg.waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) { fail(`${name}: never opened`); continue; }
  await page.waitForTimeout(300);
  // nothing behind the opening book may show through (#210): the home is marked and every shelf book has faded out
  const behind = await page.evaluate(() => ({marked: !!document.querySelector('#home.book-opening'), maxOp: Math.max(0, ...[...document.querySelectorAll('#home .hbook')].map(e => +getComputedStyle(e).opacity))}));
  if (!behind.marked) fail(`${name}: home not marked book-opening while the book opens (room shows through)`);
  if (behind.maxOp > 0.05) fail(`${name}: a shelf book still shows behind the opening book (opacity ${behind.maxOp.toFixed(2)})`);
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog].intro'), cs = getComputedStyle(d), r = d.getBoundingClientRect();
    return {pos: cs.position, ov: cs.overflowX + '/' + cs.overflowY, scrolls: d.scrollHeight > d.clientHeight + 1 || d.scrollWidth > d.clientWidth + 1, fits: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, ctl: !!d.querySelector('.bs-page.l [role=switch], .bs-page.l dt')};
  });
  if (m.pos !== 'fixed') fail(`${name}: book is position:${m.pos}, not fixed`);
  if (/auto|scroll/.test(m.ov)) fail(`${name}: book container scrolls (${m.ov})`);
  if (!m.fits) fail(`${name}: book does not fit the viewport`);
  if (!m.ctl) fail(`${name}: no content on the left page`);
  await page.keyboard.press('Escape');
  await dlg.waitFor({state: 'detached', timeout: T}).catch(() => fail(`${name}: did not close`));
  await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => fail(`${name}: home stayed locked after closing`));
}

await browser.close(); server.close();
if (problems.length) { console.error('transitions: FAILED\n - ' + [...new Set(problems)].join('\n - ')); process.exit(1); }
console.log('transitions: ok');
