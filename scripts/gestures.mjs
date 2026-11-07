// Gesture and key guard (keys and phone gestures). Drives the built app in headless Chromium and checks that:
//  - Back (the browser's back button, which is what Android sends) closes an open book and the key sheet instead of
//    leaving the game, and that closing by the close button does not leave a stray history entry behind;
//  - the arrow keys walk the rooms from the home screen, but turn the pages while a book is open;
//  - a quick sideways swipe on the hearth walks to the neighbouring room, a vertical one does not;
//  - the key sheet names the room keys, Enter on a result and the phone gestures.
// Tests only: reads and drives the page, never changes behaviour. Run after `npm run build`. Skips (exit 0) without a browser.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {ROOMS, HALL, neighbours} from '../src/core/rooms.js';

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
if (!chromium) { console.log('gestures: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('gestures: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

// Third-party fonts and the model are blocked so CI stays offline-safe (same list as smoke.mjs).
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = m => { if (problems.length < 40) problems.push(m); };
const T = 15000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(viewport, mobile) {
  const ctx = await browser.newContext({viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce', deviceScaleFactor: 1});
  await ctx.route(BLOCKED, route => route.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => fail('uncaught: ' + e.message));
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForFunction(() => !!(window.__deepstack && window.__deepstack.S) && !document.querySelector('#home')?.hidden, null, {timeout: T});
  await sleep(400);
  return {ctx, page};
}

const roomNow = page => page.evaluate(() => window.__deepstack.S.room || 'hall');
async function waitRoom(page, want, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < T) { if ((await roomNow(page)) === want) return true; await sleep(100); }
  fail(`${label}: room is ${await roomNow(page)}, expected ${want}`);
  return false;
}
/* A key press can be dropped while the previous walk is still redrawing the home (the room changes before the walk is
   done), so press again until the room is where we expect. Pressing when already there would walk further, so never do that. */
async function walkKey(page, key, want, label) {
  for (let i = 0; i < 4; i++) {
    if ((await roomNow(page)) === want) break;
    await page.keyboard.press(key);
    await waitRoom(page, want, label);
  }
  await sleep(900); // let the walk finish redrawing before the next step
}
const bookOpen = page => page.evaluate(() => !!document.querySelector('.bk-spread'));
async function waitBook(page, want, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < T) { if ((await bookOpen(page)) === want) return true; await sleep(100); }
  fail(`${label}: book ${want ? 'did not open' : 'did not close'}`);
  return false;
}
/* a touch swipe from (x0,y0) to (x1,y1) on the element at that point, as the browser sends it: pointer events with pointerType touch */
const swipe = (page, x0, y0, x1, y1) => page.evaluate(([x0, y0, x1, y1]) => {
  const el = document.elementFromPoint(x0, y0) || document.body;
  const base = {pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, button: 0, buttons: 1};
  el.dispatchEvent(new PointerEvent('pointerdown', {...base, clientX: x0, clientY: y0}));
  el.dispatchEvent(new PointerEvent('pointerup', {...base, buttons: 0, clientX: x1, clientY: y1}));
}, [x0, y0, x1, y1]);

// ---- phone: Back closes a book, the key sheet and a stray entry; the hearth swipe walks rooms ----
{
  const {ctx, page} = await open({width: 375, height: 667}, true);
  const start = page.url();
  // a book: open the Daily, Back closes it and stays on the game
  await page.evaluate(() => document.querySelector('#bDaily').click());
  if (await waitBook(page, true, 'phone daily')) {
    await page.goBack();
    await waitBook(page, false, 'phone back closes the Daily book');
    if (!page.url().startsWith(start)) fail('phone: Back left the game');
    if (!(await page.$('#home'))) fail('phone: home gone after Back');
  }
  // the key sheet: opened from the top bar, Back closes it
  await page.evaluate(() => document.querySelector('#bKeys')?.click());
  await sleep(200);
  if (await page.evaluate(() => !document.querySelector('.keyhelp'))) fail('phone: key sheet did not open');
  await page.goBack();
  await sleep(200);
  if (await page.evaluate(() => !!document.querySelector('.keyhelp'))) fail('phone: Back did not close the key sheet');
  // closing by the close button must not leave a stray entry: the history is back on the game's own entry
  await page.evaluate(() => document.querySelector('#bKeys')?.click());
  await sleep(200);
  await page.evaluate(() => document.querySelector('#khClose')?.click());
  await sleep(200);
  if (await page.evaluate(() => !!(history.state && history.state.ds))) fail('phone: closing the key sheet by its button left a history entry');
  if (!(await page.$('#home'))) fail('phone: home gone after closing the key sheet');

  // the hearth swipe: a quick sideways drag over the fire (not on a button) walks to the next room
  const home = ROOMS.map(r => r.id);
  const next = neighbours(HALL).next.id, prev = neighbours(HALL).prev.id;
  const box = await page.evaluate(() => { const r = document.querySelector('#home .hz-title').getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.bottom + 60}; });
  for (let i = 0; i < 4 && (await roomNow(page)) !== next; i++) {   // a swipe can land while the last walk redraws: try again
    await swipe(page, box.x, box.y, box.x - 120, box.y + 4);          // left = next room
    await waitRoom(page, next, 'phone swipe left');
  }
  await sleep(900);
  // vertical drags are for the attic, never a room walk
  await swipe(page, box.x, box.y + 200, box.x + 4, box.y - 20);
  await sleep(600);
  if ((await roomNow(page)) !== next) fail('phone: a vertical swipe changed the room');
  for (let i = 0; i < 4 && (await roomNow(page)) !== HALL; i++) {
    await swipe(page, box.x, box.y, box.x + 120, box.y + 4);          // right = previous room
    await waitRoom(page, HALL, 'phone swipe right');
  }
  void home; void prev;
  await ctx.close();
}

// ---- desktop: arrow keys walk rooms from home, pages turn in a book, the key sheet lists the new keys ----
{
  const {ctx, page} = await open({width: 1280, height: 800}, false);
  const next = neighbours(HALL).next.id;
  await walkKey(page, 'ArrowRight', next, 'desktop ArrowRight');
  await walkKey(page, 'ArrowLeft', HALL, 'desktop ArrowLeft');
  await walkKey(page, ']', next, 'desktop ]');
  await walkKey(page, '[', HALL, 'desktop [');

  // with a book open the arrows turn its pages and leave the room alone
  await page.evaluate(() => document.querySelector('#bDaily').click());
  if (await waitBook(page, true, 'desktop daily')) {
    await sleep(600);
    await page.keyboard.press('ArrowRight');
    await sleep(900);
    if ((await roomNow(page)) !== HALL) fail('desktop: an arrow key inside an open book changed the room');
    await page.keyboard.press('Escape');
    await waitBook(page, false, 'desktop Esc closes the Daily book');
  }

  await page.keyboard.press('?');
  await sleep(200);
  const txt = await page.evaluate(() => document.querySelector('.keyhelp')?.textContent || '');
  for (const want of ['Previous or next room', 'Enter on a result', 'On a phone', 'Swipe sideways']) {
    if (!txt.includes(want)) fail(`key sheet is missing "${want}"`);
  }
  await page.keyboard.press('Escape');
  await sleep(200);
  if (await page.evaluate(() => !!document.querySelector('.keyhelp'))) fail('desktop: Esc did not close the key sheet');
  await ctx.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.log('gestures FAILED:');
  for (const p of problems) console.log(' - ' + p);
  process.exit(1);
}
console.log('gestures: back closes books and the key sheet, arrows walk rooms, phone swipes walk rooms, the sheet lists them');
