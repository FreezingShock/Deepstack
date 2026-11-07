// Room playtest: every topic room (seven in all) at a phone and a desktop width, OS reduced motion on. In each room it
// walks home, one Daily word and its result card, the Unlimited book and one Unlimited word and its result card, the Rooms
// book, and on desktop one door to the next room. At each screen it fails on sideways scroll, a vertical scroll on home,
// a pane that traps its content, clipped or overflowing text (not on the result cards, whose own wording is checked by
// the answer flow), a card catalogue or Librarian's Card cut by its own frame, any console or page error, or a screen that
// cannot be reached.
//   node scripts/room-playtest.mjs              run after `npm run build`
//   node scripts/room-playtest.mjs --selftest   plant a sideways overflow and prove the check fires (needs a build)
//   PLAYTEST_OUT=dir node scripts/room-playtest.mjs   also save a screenshot per screen and a JSON report into dir
//   ONLY=phone-math,desk-hall node scripts/room-playtest.mjs   run a subset (keys are <view>-<room>)
// Skips (exit 0) when no Chromium is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';
import {findClipped} from './lib/textFit.mjs';

const SELFTEST = process.argv.includes('--selftest');
const OUT = process.env.PLAYTEST_OUT || '';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  let p;
  try {
    p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(root, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { if (!res.headersSent) res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); }
catch { console.log('room-playtest: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('room-playtest: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [{tag: 'phone', w: 375, h: 667, mobile: true}, {tag: 'desk', w: 1280, h: 800, mobile: false}];
const T = 10000;
const problems = [];
const report = {};

// A save with a little shelf and a streak, set to one room, so the room's own screens are the ones shown.
const WORDS = new Map(JSON.parse(await readFile(join(root, 'data/words.json'), 'utf8')).words.map(w => [w.w, w.def]));
const answerFor = (word, fallback) => (WORDS.get(word) || fallback).slice(0, 280);
const seed = room => JSON.stringify({
  shelf: Array.from({length: 14}, (_, i) => ({w: 'word' + i, tier: i % 7, score: 50 + i, t: 1700000000000 + i * 864e5, ft: i * 30, fl: i % 5})),
  streak: {last: '', n: 3}, bestDepth: 300, room,
});

// The layout checks. Clipped text is skipped on result cards: the answer flow owns those.
async function layoutProblems(page) {
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const bars = [...document.querySelectorAll('*')].filter(e => {
      if (e.tagName === 'TEXTAREA') return false; // a typed answer scrolls by design
      const cs = getComputedStyle(e);
      return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2 && e.getClientRects().length && e.clientHeight > 20;
    }).map(e => `${e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName} (scrolls by ${e.scrollHeight - e.clientHeight}px)`);
    return {sw: de.scrollWidth > de.clientWidth + 1, sh: de.scrollHeight - de.clientHeight, bars: [...new Set(bars)].slice(0, 8)};
  });
  return {sideways: r.sw, vertical: r.sh > 2 ? r.sh : 0, panes: r.bars, clipped: await page.evaluate(findClipped).catch(e => [{el: 'evaluate', text: '', why: e.message}])};
}

// Activates a control. First it checks that the control itself is the topmost element at its centre (a real overlap bug
// fails here). Then it fires the control's click, as keyboard and assistive activation do: Playwright's pointer click never
// reached the Descend handler on the phone (the press landed, nothing started), so pointer geometry is checked, not replayed.
async function press(page, sel, step, msg = 'could not press') {
  const hit = await page.evaluate(q => {
    const b = document.querySelector(q); if (!b || !b.getClientRects().length) return 'missing';
    const r = b.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return t && (b === t || b.contains(t)) ? 'ok' : 'covered';
  }, sel);
  if (hit !== 'ok') { problems.push(`${step}: ${sel} is ${hit}`); return false; }
  return page.locator(sel).evaluate(el => el.click()).then(() => true, e => { problems.push(`${step}: ${msg} (${e.message.split('\n')[0]})`); return false; });
}

async function screen(page, key, name, check, opts = {}) {
  if (OUT) await page.screenshot({path: `${OUT}/${key}-${name}.png`});
  const r = await layoutProblems(page);
  const tag = `${key} ${name}`;
  if (r.sideways) problems.push(`${tag}: page scrolls sideways`);
  if (check === 'home' && r.vertical) problems.push(`${tag}: home scrolls vertically by ${r.vertical}px`);
  if (check === 'home') {
    // The card catalogue and Librarian's Card must fit their own frames: a frame whose content is wider than its box is cut.
    const frames = await page.evaluate(() => [...document.querySelectorAll('.cc-cab, aside.ledger')]
      .filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1)
      .map(e => `${e.tagName.toLowerCase()}${e.className ? '.' + String(e.className).split(' ')[0] : ''} content ${e.scrollWidth}px in a ${e.clientWidth}px frame`));
    for (const f of frames) problems.push(`${tag}: its edge is cut: ${f}`);
  }
  if (r.panes.length) problems.push(`${tag}: a pane traps its content: ${r.panes.join(' ')}`);
  if (!opts.resultCard && r.clipped.length) {
    const first = r.clipped.slice(0, 3).map(c => `${c.el} "${(c.text || '').slice(0, 40)}" (${c.why})`).join('; ');
    problems.push(`${tag}: ${r.clipped.length} clipped or overflowing text: ${first}`);
  }
}

async function walkRoom(v, room) {
  const key = `${v.tag}-${room}`;
  const ctx = await browser.newContext({viewport: {width: v.w, height: v.h}, isMobile: v.mobile, hasTouch: v.mobile, reducedMotion: 'reduce'});
  await ctx.addInitScript(() => { try { localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: 'reduce'})); } catch {} });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.|huggingface|hf\.co/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.route(u => !u.href.startsWith(url) && !/fonts\.googleapis|fonts\.gstatic/.test(u.href), r => r.abort());
  await page.route(/fonts\.googleapis/, r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
  const s = seed(room);
  await page.addInitScript(sv => { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', sv); }, s);
  await page.goto(url, {waitUntil: 'load'});
  const ready = await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T}).then(() => true, () => false);
  if (!ready) problems.push(`${key} home: never rendered`);
  await page.waitForTimeout(1200);
  const bad = async (step, msg) => problems.push(`${key} ${step}: ${msg}`);

  // 1. Home in this room
  if (ready) await screen(page, key, '1-home', 'home');

  // 2. Daily: one word, answered with the real definition so a result card shows
  if (ready && await page.locator('#bPlay').count()) {
    await press(page, '#bPlay', `${key} daily`, 'Descend click failed');
    const w = page.locator('#stage .word').first();
    if (await w.waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) {
      await page.waitForTimeout(1200);
      const word = await w.getAttribute('aria-label').catch(() => null);
      await screen(page, key, '2-daily-word', 'word');
      await page.locator('#ans').click({timeout: T}).catch(() => bad('daily', 'no answer box'));
      await page.keyboard.type(answerFor(word, 'a thing that is the opposite of what you would expect to find here'));
      await page.keyboard.press('Enter');
      const card = page.locator('#cardlayer:not([hidden])');
      for (let i = 0; i < 40 && !(await card.count()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(250); }
      await page.locator('#vd.on').waitFor({state: 'attached', timeout: 2 * T}).catch(() => bad('daily result', 'verdict never revealed'));
      await page.waitForTimeout(1500);
      await screen(page, key, '3-daily-result', 'result', {resultCard: true});
      await press(page, '#go', `${key} daily result`, 'no continue button');
      await page.waitForTimeout(800);
    } else bad('daily', 'no word appeared after Descend');
  }

  // 3. Unlimited book, then one word and its result card
  await press(page, '#mark', `${key} unlimited`);
  await page.waitForTimeout(900);
  await press(page, '#bUnl', `${key} unlimited`, 'Unlimited book click failed');
  const intro = page.locator('[role=dialog].intro').first();
  if (await intro.waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) {
    await page.waitForTimeout(1000);
    await screen(page, key, '4-unlimited-book', 'book');
    await press(page, '[role=dialog].intro button.bs-primary:not([data-act])', `${key} unlimited`, 'primary button missing');
    const uw = page.locator('#stage .word').first();
    if (await uw.waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) {
      await page.waitForTimeout(1200);
      const uword = await uw.getAttribute('aria-label').catch(() => null);
      await screen(page, key, '5-unlimited-word', 'word');
      await page.locator('#ans').click({timeout: T}).catch(() => {});
      await page.keyboard.type(answerFor(uword, 'a thing that is the opposite of what you would expect'));
      await page.keyboard.press('Enter');
      const ucard = page.locator('#cardlayer:not([hidden])');
      for (let i = 0; i < 40 && !(await ucard.count()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(250); }
      await page.waitForTimeout(1800);
      await screen(page, key, '6-unlimited-result', 'result', {resultCard: true});
      await press(page, '#go', `${key} unlimited result`, 'no continue button');
      await page.waitForTimeout(800);
    } else bad('unlimited', 'no word appeared');
  } else bad('unlimited', 'Unlimited book did not open');

  // 4. Rooms book
  await press(page, '#mark', `${key} unlimited`);
  await page.waitForTimeout(900);
  await press(page, '#bRooms', `${key} rooms book`, 'click failed');
  if (await page.locator('[role=dialog].intro').first().waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) {
    await page.waitForTimeout(1000);
    await screen(page, key, '7-rooms-book', 'book');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  } else bad('rooms book', 'did not open');

  // 5. Desktop: walk one door to the next room
  if (v.tag === 'desk') {
    await page.keyboard.press(']');
    await page.waitForTimeout(150);
    await page.waitForTimeout(1600);
    await screen(page, key, '8-door-after', 'home');
  }

  const dedup = [...new Set(errs)].slice(0, 5);
  if (dedup.length) problems.push(`${key}: ${dedup.join(' || ')}`);
  report[key] = {problems: problems.filter(p => p.startsWith(key + ' ') || p.startsWith(key + ':'))};
  await ctx.close();
}

if (SELFTEST) {
  // Plant a 2000 px wide strip under the home and expect the sideways check to fire. Nothing else is asserted.
  const ctx = await browser.newContext({viewport: {width: 375, height: 667}, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  await page.goto(url);
  await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T}).catch(() => {});
  await page.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;top:0;left:0;width:2000px;height:4px'; document.body.appendChild(d); });
  const r = await layoutProblems(page);
  await ctx.close(); await browser.close(); server.close();
  if (!r.sideways) { console.error('room-playtest selftest FAILED: a 2000px strip did not register as sideways scroll'); process.exit(1); }
  console.log('room-playtest selftest: ok (planted sideways overflow was caught)');
  process.exit(0);
}

if (OUT) await mkdir(OUT, {recursive: true});
for (const v of VIEWS) for (const room of ROOMS) {
  const key = `${v.tag}-${room}`;
  if (ONLY && !ONLY.includes(key)) continue;
  try { await walkRoom(v, room); }
  catch (e) { problems.push(`${key}: could not finish the walk (${e.message.split('\n')[0]})`); }
}
await browser.close(); server.close();
if (OUT) await writeFile(join(OUT, 'playtest-report.json'), JSON.stringify(report, null, 2));
if (problems.length) {
  problems.forEach(p => console.error('FAIL ' + p));
  console.error(`room-playtest: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`room-playtest: ok (${ROOMS.length} rooms at ${VIEWS.map(v => v.w).join(' and ')} wide)`);
