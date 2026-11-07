// Room-by-room playtest, run after `npm run build`, reduced motion on, at 375x667 and 1280x800, in all seven topic rooms.
// In each room it walks: home, one Daily word and its result card, the Unlimited book and one Unlimited word and its
// result card, the Rooms book, and (desktop only) one door walk with `]`. Every screen is checked for:
//  - sideways scroll on the page,
//  - vertical scroll on home (the home screen has to fit the window),
//  - an inner pane that scrolls on its own,
//  - clipped or overflowing text (scripts/lib/textFit.mjs). The result card is left out of this check: the answer flow owns it,
//    and its book cover is a 3D transform whose text boxes do not match what is drawn,
//  - on home, the card catalogue and Librarian's Card fit their own frames (their edges are not cut),
//  - console or page errors, and any control this walk could not find or use.
// A screen that fails leaves a screenshot in playtest-shots/ (CI uploads that folder when the job fails).
// Skips (exit 0) when no Chromium is available, like the other browser checks. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {findClipped} from './lib/textFit.mjs';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json'};
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
if (!chromium) { console.log('room-playtest: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('room-playtest: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [
  {tag: '375', w: 375, h: 667, mobile: true},
  {tag: '1280', w: 1280, h: 800, mobile: false},
];
const SHOTS = join(process.cwd(), 'playtest-shots');
const T = 15000;
const words = JSON.parse(await readFile(join(root, 'data/words.json'), 'utf8')).words || [];
const defOf = new Map(words.map(w => [w.w, w.def]));
const problems = [];
const safe = s => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

// A fresh save with the room already set and today's Daily still open, so every walk has a word to answer.
const seed = room => ({
  shelf: Array.from({length: 6}, (_, i) => ({w: 'word' + i, word: 'word' + i, s: 60 + i, t: Date.now() - i * 1e6})),
  bestDepth: 900, bestFloor: 3, room: room === 'hall' ? undefined : room, streak: {last: '', n: 3}, daily: {},
});

async function walkRoom(view, room) {
  const key = `${view.tag}px ${room}`;
  const before = problems.length;
  const ctx = await browser.newContext({viewport: {width: view.w, height: view.h}, reducedMotion: 'reduce', serviceWorkers: 'block', isMobile: view.mobile, hasTouch: view.mobile});
  await ctx.addInitScript(s => {
    try {
      if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify(s.save));
      localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: 'reduce'}));
    } catch {}
  }, {save: seed(room)});
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('page error: ' + e.message.split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.|huggingface|hf\.co/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await page.route(u => !u.href.startsWith(url) && !/fonts\.(googleapis|gstatic)/.test(u.href), r => r.abort());
  await page.route(/fonts\.googleapis/, r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));

  // Every problem is tagged with the screen it happened on, and that screen is saved as a screenshot.
  let here = 'start';
  const fail = msg => problems.push(`${key} · ${here}: ${msg}`);
  const snapIfFailed = async (label, from) => {
    if (problems.length <= from) return;
    await mkdir(SHOTS, {recursive: true});
    await page.screenshot({path: join(SHOTS, `${safe(key)}-${safe(label)}.png`)}).catch(() => {});
  };
  const check = async (label, {home = false} = {}) => {
    here = label;
    const from = problems.length;
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const sw = de.scrollWidth > de.clientWidth + 1;
      const sh = de.scrollHeight - de.clientHeight;
      const bars = [...document.querySelectorAll('*')].filter(e => {
        const cs = getComputedStyle(e);
        return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2 && e.getClientRects().length && e.clientHeight > 20;
      }).map(e => (e.id ? '#' + e.id : typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName));
      return {sw, sh, bars: [...new Set(bars)].slice(0, 8)};
    });
    if (r.sw) fail('page scrolls sideways');
    if (home && r.sh > 2) fail(`home scrolls vertically by ${r.sh}px`);
    if (r.bars.length) fail(`scrollable panes: ${r.bars.join(' ')}`);
    if (home) {
      const frames = await page.evaluate(() => [...document.querySelectorAll('.cc-cab, aside.ledger')]
        .filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1)
        .map(e => `${e.tagName.toLowerCase()}${e.className ? '.' + String(e.className).split(' ')[0] : ''} content ${e.scrollWidth}px in a ${e.clientWidth}px frame`));
      for (const f of frames) fail(`its edge is cut: ${f}`);
    }
    // Hide the result card while the detector runs (findClipped skips hidden subtrees), then put it back.
    await page.evaluate(() => { const l = document.querySelector('#cardlayer'); if (l) l.dataset.pt = l.style.visibility, l.style.visibility = 'hidden'; });
    const clipped = await page.evaluate(findClipped).catch(e => [{el: 'evaluate', text: '', why: e.message}]);
    await page.evaluate(() => { const l = document.querySelector('#cardlayer'); if (l) { l.style.visibility = l.dataset.pt || ''; delete l.dataset.pt; } });
    if (clipped.length) fail(`${clipped.length} clipped text: ${clipped.slice(0, 3).map(c => `${c.el} "${c.text}" (${c.why})`).join('; ')}`);
    await snapIfFailed(label, from);
  };
  const press = async (label, locator, name) => {
    here = label;
    const ok = await locator.first().click({timeout: T}).then(() => true, () => false);
    if (!ok) fail(`could not click ${name}`);
    return ok;
  };

  // Answers the word on stage with its own definition and walks through the result card.
  const answerWord = async label => {
    here = label;
    const w = page.locator('#stage .word').first();
    if (!await w.waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) { fail('no word on the stage'); return; }
    await page.waitForTimeout(1200);
    const word = await w.getAttribute('aria-label').catch(() => null);
    await check(`${label} word`);
    await page.locator('#ans').click({timeout: T}).catch(() => fail('no answer box'));
    await page.keyboard.type((defOf.get(word) || 'a thing that is the opposite of what you would expect to find here').slice(0, 280));
    await page.keyboard.press('Enter');
    const card = page.locator('#cardlayer:not([hidden])');
    for (let i = 0; i < 40 && !(await card.count()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(250); }
    await page.locator('#vd.on').waitFor({state: 'attached', timeout: T}).catch(() => fail('verdict never revealed'));
    await page.waitForTimeout(1500);
    await check(`${label} result`);
    await page.locator('#go').click({timeout: 3000}).catch(() => fail('no continue button on the result card'));
    await page.waitForTimeout(800);
  };

  // Opens a book from home (the wordmark closes any open book first) and waits for its dialog.
  const openBook = async (label, sel) => {
    here = label;
    await page.locator('#mark').click({timeout: 3000}).catch(() => {});
    await page.waitForTimeout(900);
    await press(label, page.locator(sel), sel);
    const dlg = page.locator('[role=dialog].intro').first();
    await dlg.waitFor({state: 'visible', timeout: T}).catch(() => fail(`${label} did not open`));
    await page.waitForTimeout(1000);
  };

  try {
    await page.goto(url, {waitUntil: 'load'});
    here = 'home';
    if (!await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) {
      fail('home never rendered');
      return;
    }
    await page.waitForTimeout(1500);
    await check('home', {home: true});

    // Daily: descend, answer, read the result
    here = 'Daily';
    if (await page.locator('#bPlay').count()) {
      await press('Daily', page.locator('#bPlay'), '#bPlay');
      await answerWord('Daily');
    } else fail('no Descend button on a fresh save');

    // Unlimited: the book, its start button, one word and its result
    await openBook('Unlimited book', '#bUnl');
    await check('Unlimited book');
    here = 'Unlimited book';
    await page.locator('[role=dialog].intro button.bs-primary:not([data-act])').first().click({timeout: 5000}).catch(() => fail('start button missing'));
    await answerWord('Unlimited');

    // Rooms book
    await openBook('Rooms book', '#bRooms');
    await check('Rooms book');
    here = 'Rooms book';
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);

    // Desktop only: walk one door to the next room (phones use the Room Ledger instead)
    if (view.w >= 1000) {
      here = 'door walk';
      await page.keyboard.press(']');
      await page.waitForTimeout(1600);
      await check('door walk', {home: true});
    }

  } catch (e) {
    fail('walk crashed: ' + e.message.split('\n')[0]);
  } finally {
    here = 'errors';
    if (errs.length) fail([...new Set(errs)].slice(0, 5).join(' | '));
    await snapIfFailed('errors', before);
    await ctx.close();
  }
  console.log(`${key}: ${problems.length > before ? 'FAIL' : 'ok'}`);
}

for (const view of VIEWS) for (const room of ROOMS) await walkRoom(view, room);

await browser.close();
server.close();
if (problems.length) {
  console.error(`\nroom-playtest: ${problems.length} problem(s):`);
  for (const p of problems) console.error('  - ' + p);
  console.error(`Screenshots of the failing screens are in ${SHOTS}/`);
  process.exit(1);
}
console.log(`room-playtest: all ${ROOMS.length} rooms passed at ${VIEWS.map(v => v.w).join(' and ')} wide.`);
