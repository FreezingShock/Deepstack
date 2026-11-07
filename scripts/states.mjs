// CI guard for the empty, error and loading states. Serves dist/ and forces each state the way a real player would meet it:
//   - word list, topic room lists and a lazy book's pages fail to download (page.route), with a visible pending mark while a book waits
//   - storage refuses writes (full) or reads (blocked), and a save that will not parse (addInitScript)
//   - the judge fails to load (CI blocks the model host, so this is the real fallback path; the top bar offers Try again)
//   - a new save's Almanac shows its written empty page
// Every problem plaque is checked at 375px and 1280px, with OS reduced motion on, in every topic room: visible, inside the
// viewport, the title and copy present, no horizontal page scroll, and Try again clears it once the network is back.
// Screenshots of the Reading Room and the Observatory land in screenshots/states/ as <tag>-<scenario>-<room>-<width>.png.
// Usage: node scripts/states.mjs [--tag after] [--capture-only]   (--capture-only skips assertions, for "before" shots)
// Skips (exit 0) if no Chromium is available, like smoke.mjs.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const args = process.argv.slice(2);
const TAG = args.includes('--tag') ? args[args.indexOf('--tag') + 1] : 'after';
const CAPTURE_ONLY = args.includes('--capture-only');
const SHOT_DIR = join(process.cwd(), 'screenshots', 'states');
const SHOT_ROOMS = new Set(['hall', 'science']);

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.otf': 'font/otf'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(root, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); }
catch { try { ({chromium} = (await import('node:module')).createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('states: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('states: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const VIEWPORTS = [{w: 375, h: 667}, {w: 1280, h: 800}];
const ROOMS = process.env.STATES_ROOMS ? process.env.STATES_ROOMS.split(',') : ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const T = 12000;
const problems = [];
const fail = msg => { problems.push(msg); console.log('  FAIL', msg); };
const expect = (ok, msg) => { if (!ok) fail(msg); };

// A failed download is an expected console line here, not a bug; anything else from the page is.
const EXPECTED = /Failed to load resource|Using built-in word bank|Topic room lists unavailable|Judge worker|Embedding judge unavailable|Judge worker unavailable|judge worker|Judge relations|Judge senses/;

async function newPage({w, h}, {room = 'hall', init = null, setup = null} = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => fail(`pageerror: ${e.message}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (EXPECTED.test(m.text())) return;
    if (BLOCKED.test(m.location()?.url || '')) return;
    fail(`console.error: ${m.text()}`);
  });
  await page.addInitScript(roomId => {
    try { if (roomId !== 'hall' && localStorage.getItem('deepstack.v1') === null) localStorage.setItem('deepstack.v1', JSON.stringify({room: roomId})); } catch { /* storage is what some scenarios test */ }
  }, room);
  if (init) await page.addInitScript(init);
  await setup?.(page);
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForSelector('#bStats', {state: 'attached', timeout: T});
  return {ctx, page};
}

/** The plaque is on screen, in the viewport and not cut off, with the expected title; returns its box. */
async function checkPlaque(page, title, vw, tag) {
  const plaque = page.locator('#statenotice.on');
  try { await plaque.waitFor({state: 'visible', timeout: 6000}); } catch { fail(`${tag}: no plaque "${title}" appeared`); return null; }
  const text = await plaque.textContent();
  expect(text.includes(title), `${tag}: plaque title "${title}" not in "${text.slice(0, 80)}"`);
  const box = await plaque.boundingBox();
  expect(box && box.x >= -0.5 && box.x + box.width <= vw.w + 0.5 && box.y >= 0, `${tag}: plaque outside the viewport ${JSON.stringify(box)}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow <= 1, `${tag}: horizontal page scroll of ${overflow}px`);
  return box;
}

async function shot(page, scenario, room, vw) {
  if (!SHOT_ROOMS.has(room)) return;
  await mkdir(SHOT_DIR, {recursive: true});
  await page.mouse.move(0, 0); // no hover tip in the picture
  await page.waitForTimeout(350); // let the drop settle before the picture
  await page.screenshot({path: join(SHOT_DIR, `${TAG}-${scenario}-${room}-${vw.w}.png`)});
}

/** One scenario: set the failure up, check the plaque, press Try again while it still fails (it must stay), then once the
 *  network or storage is back (it must clear). Problems that cannot clear in a test (storage stays full) pass clears: false. */
async function plaqueScenario(name, vw, room, {init = null, setup = null, title, retryWorks = null, retry = true, clears = true}) {
  const tag = `${name} ${room} ${vw.w}px`;
  const {ctx, page} = await newPage(vw, {room, init, setup});
  try {
    const box = await checkPlaque(page, title, vw, tag);
    if (!box && CAPTURE_ONLY) await shot(page, name, room, vw); // a before picture shows the page as the player sees it
    if (box) {
      await shot(page, name, room, vw);
      if (retry) {
        const go = page.locator('#statenotice.on .sn-go[data-sn="retry"]');
        expect(await go.count() === 1, `${tag}: no Try again button`);
        await go.click();
        await page.waitForTimeout(400);
        expect(await page.locator('#statenotice.on').count() === 1, `${tag}: plaque closed while the problem persists`);
        if (clears) {
          await retryWorks?.(page);
          await page.locator('#statenotice.on .sn-go[data-sn="retry"]').click();
          await page.locator('#statenotice.on').waitFor({state: 'hidden', timeout: 8000}).catch(() => fail(`${tag}: plaque did not clear after Try again worked`));
        }
      } else {
        await page.locator('#statenotice.on .sn-go').click();
        await page.locator('#statenotice.on').waitFor({state: 'hidden', timeout: 4000}).catch(() => fail(`${tag}: plaque did not close`));
      }
    }
  } catch (e) {
    fail(`${tag}: ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

// --- scenarios -------------------------------------------------------------------------------------------------------
const failDownload = (glob, status = 500) => ({
  setup: async page => { await page.route(glob, r => r.fulfill({status, body: 'unavailable'})); },
  retryWorks: async page => { await page.unroute(glob); },
});

async function judgeScenario(vw, room) {
  const tag = `judge ${room} ${vw.w}px`;
  const forceModelFailure = async page => {
    await page.route(/\/(models|ort)\//, r => r.abort());
    await page.route(/huggingface\.co|\.hf\.co/, r => r.abort());
  };
  const {ctx, page} = await newPage(vw, {room, setup: forceModelFailure});
  try {
    const btn = page.locator('#jstat .judge-retry');
    await btn.waitFor({state: 'visible', timeout: 12000});
    const box = await btn.boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= vw.w + 0.5, `${tag}: Try again outside the viewport ${JSON.stringify(box)}`);
    const phone = vw.w <= 560;
    const note = await page.locator('#jstat .judge-note').textContent();
    expect(/Quick judge in use/.test(note), `${tag}: failure line missing, got "${note}"`);
    expect(await page.locator('#jstat .judge-note').isVisible() === !phone, `${tag}: failure line ${phone ? 'should hide on phones' : 'should show'}`);
    await shot(page, 'judge', room, vw);
    await btn.click();
    expect(await page.locator('#jstat .judge-retry').count() <= 1, `${tag}: Try again duplicated`);
  } catch (e) {
    fail(`${tag}: ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

async function booksScenario(vw) {
  const tag = `books hall ${vw.w}px`;
  const {ctx, page} = await newPage(vw, {room: 'hall'});
  try {
    const glob = /bookMenusLoad-[^/]*\.js/;
    await page.route(glob, r => { setTimeout(() => r.abort(), 1400); }); // a slow, failing download of the book's code
    await page.waitForFunction(() => typeof document.getElementById('bStats')?.onclick === 'function', null, {timeout: T}); // bookify has wired the spines
    await page.locator('#bStats').click();
    // while its pages are fetched the spine waits visibly (a pending mark; reduced motion keeps it still)
    await page.waitForFunction(() => document.querySelector('#bStats')?.classList.contains('fetching'), null, {timeout: 4000})
      .catch(() => fail(`${tag}: no pending mark while the pages were fetched`));
    await checkPlaque(page, 'That book is still on the cart', vw, tag);
    await shot(page, 'books', 'hall', vw);
    await page.unroute(glob);
    await page.locator('#statenotice.on .sn-go[data-sn="retry"]').click();
    await page.locator('#statenotice.on').waitFor({state: 'hidden', timeout: 8000}).catch(() => fail(`${tag}: plaque did not clear after Try again worked`));
    expect(await page.locator('#bStats.fetching').count() === 0, `${tag}: pending mark left behind`);
  } catch (e) {
    fail(`${tag}: ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

async function almanacEmptyScenario(vw) {
  const tag = `almanac-empty hall ${vw.w}px`;
  const {ctx, page} = await newPage(vw, {room: 'hall'});
  try {
    await page.locator('#bStats').click();
    await page.locator('.alm .ep-empty').first().waitFor({state: 'visible', timeout: 15000});
    const text = await page.locator('.alm .ep-empty').first().innerText();
    expect(/Finish your first Daily/.test(text), `${tag}: written empty line missing, got "${text}"`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow <= 1, `${tag}: horizontal page scroll of ${overflow}px`);
    await shot(page, 'almanac-empty', 'hall', vw);
  } catch (e) {
    fail(`${tag}: ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

const STORAGE_WRITE_INIT = () => {
  Storage.prototype.setItem = function () { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); };
};
const STORAGE_READ_INIT = () => {
  Storage.prototype.getItem = function () { throw new DOMException('Access is denied.', 'SecurityError'); };
};
const CORRUPT_SAVE_INIT = () => {
  try { localStorage.setItem('deepstack.v1', '{"shelf":['); } catch { /* blocked: the read scenario covers it */ }
};

const SCENARIOS = [
  (vw, room) => plaqueScenario('words', vw, room, {title: 'The word cabinet is locked', ...failDownload('**/data/words.json*')}),
  (vw, room) => room === 'hall' ? null : plaqueScenario('rooms', vw, room, {title: 'The topic shelves are out of reach', ...failDownload('**/data/rooms.json*')}),
  (vw, room) => plaqueScenario('storage-write', vw, room, {init: STORAGE_WRITE_INIT, title: 'This browser will not keep your shelf', clears: false}),
  (vw, room) => plaqueScenario('storage-read', vw, room, {init: STORAGE_READ_INIT, title: 'This browser keeps its drawers shut', retry: false}),
  (vw, room) => plaqueScenario('save-unreadable', vw, room, {init: CORRUPT_SAVE_INIT, title: 'A page of the ledger is smudged', retry: false}),
];

for (const vw of VIEWPORTS) {
  console.log(`states at ${vw.w}px`);
  for (const room of ROOMS) {
    for (const run of SCENARIOS) await run(vw, room);
    await judgeScenario(vw, room);
  }
  await booksScenario(vw);
  await almanacEmptyScenario(vw);
}

// Stored storage-dependent checks: the unreadable copy is kept, not read back.
{
  const {ctx, page} = await newPage(VIEWPORTS[1], {room: 'hall', init: CORRUPT_SAVE_INIT});
  try {
    await page.locator('#statenotice.on').waitFor({state: 'visible', timeout: 10000});
    const copy = await page.evaluate(() => localStorage.getItem('deepstack.v1.unreadable'));
    expect(copy === '{"shelf":[', `unreadable copy missing or altered: ${copy}`);
    await page.locator('#statenotice.on .sn-go').click();
    await page.locator('#statenotice.on').waitFor({state: 'hidden', timeout: 4000}).catch(() => fail('save-unreadable: Understood did not close the plaque'));
  } catch (e) { fail(`save-unreadable copy: ${e.message.split('\n')[0]}`); }
  finally { await ctx.close(); }
}

await browser.close();
server.close();
if (problems.length) {
  console.log(`states: ${problems.length} problem(s)`);
  if (!CAPTURE_ONLY) process.exit(1);
  console.log('states: capture-only run, not failing');
} else {
  console.log('states: every state checked at 375px and 1280px, every topic room');
}
