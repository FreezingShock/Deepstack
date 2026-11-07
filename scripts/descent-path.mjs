// Descent path guard. For every topic room, an Unlimited run reaches a landing: each answer is that room's own
// definition of the word (public/data/room-words.json), which the judge scores against. A definition that repeats the
// headword is never typed (the scorer gives those 0 by design). The model files are held back 7 s, so each answer waits for the full judge the way Daily's
// does. Once the landing is up, the same page is checked at 375 px and 1280 px, with reduced motion and with motion on:
// the landing must fit the width, show three doors, and every door (and relic) must be the topmost thing at its centre
// (a hit test, so a decorative shelf over a door fails here). Then the curio shop opens, two relics show, one is taken.
// The room under test is set through the save (S.room and S.rooms[id].rating). One browser, one room at a time.
// Drives dist/ in headless Chromium. Skips (exit 0) without a browser. Run after `npm run build`.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {stem, match} from '../src/scorer/lexical.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = process.env.DIST || join(process.cwd(), 'dist');
const OUT = process.env.OUT || '';
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
if (!chromium) { console.log('descent-path: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('descent-path: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const senses = JSON.parse(await readFile(join(root, 'data', 'senses.json'), 'utf8')).words;
// Each room's own definition of a word (public/data/room-words.json): the sense the room asks for, and the one the judge scores against.
const roomWords = JSON.parse(await readFile(join(root, 'data', 'room-words.json'), 'utf8')).rooms;
// The scorer removes the headword and its forms from an answer (src/scorer/lexical.js analyze). A sense made only of
// those removals scores 0, so the guard never types one.
const repeatsHeadword = (sense, w) => {
  const ws = stem(w);
  return sense.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).some(t => match(stem(t), ws) >= .9 || (t.length >= 5 && w.startsWith(t.slice(0, 5)) && t.length <= w.length + 3));
};
// The answer to type: the room's own definition of the word, else the word's first sense that does not repeat it.
// The Reading Room has no room entries, so its words use the pool's own definition (public/data/words.json).
const poolDef = new Map(JSON.parse(await readFile(join(root, 'data', 'words.json'), 'utf8')).words.map(e => [e.w, e.def]));
const answerFor = (id, w) => {
  const own = (roomWords[id] || []).find(e => e[0] === w)?.[2];
  const e = senses[w];
  const cands = [own, poolDef.get(w), ...(e?.alt || []).map(a => a[1]), ...(e?.syn || []).map(s => s[1])];
  return cands.find(s => s && !repeatsHeadword(s, w)) || null;
};
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const MODEL_HOLD_MS = process.env.MODEL_HOLD_MS !== undefined ? Number(process.env.MODEL_HOLD_MS) : 7000;
const ROOMS = process.env.ROOMS ? process.env.ROOMS.split(',') : ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [
  {name: '375', width: 375, height: 740, motion: 'reduce'},
  {name: '1280', width: 1280, height: 800, motion: 'reduce'},
  {name: '375-motion', width: 375, height: 740, motion: 'no-preference'},
  {name: '1280-motion', width: 1280, height: 800, motion: 'no-preference'}
];
const RATING = {L: 70, placed: true, n: 20, runs: 3, seen: [], hist: []};
const STREAK = {last: '2026-11-06', n: 2};
const ATTEMPTS = 14;
const seedFor = room => {
  const s = {shelf: [], daily: {}, rooms: {}, rating: RATING, streak: STREAK, bestFloor: 3, bestDepth: 300, sound: false, room};
  if (room !== 'hall') s.rooms[room] = {daily: {}, rating: RATING, streak: STREAK};
  return s;
};
const problems = [];
const report = [];

// The hit test: the door's centre must belong to the door (or be inside it), else something is drawn over it.
const hitCheck = (page, sel) => page.evaluate(sel => {
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    // centre and four corners inset by 6 px: an edge overlap (a shelf over a card's bottom) fails too
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 6, r.top + 6], [r.right - 6, r.top + 6], [r.left + 6, r.bottom - 6], [r.right - 6, r.bottom - 6]];
    let by = '';
    for (const [x, y] of pts) {
      const top = document.elementFromPoint(x, y);
      if (!top || !(el === top || el.contains(top))) { by = (top?.className?.toString?.() || top?.tagName || 'nothing').slice(0, 60); break; }
    }
    out.push({name: el.getAttribute('data-path') || el.getAttribute('data-relic'), ok: !by, by});
  }
  return out;
}, sel);

async function room(id) {
  const t0 = Date.now();
  const tag = `[${id}]`;
  const bad = [];
  const ctx = await browser.newContext({viewport: {width: VIEWS[0].width, height: VIEWS[0].height}, reducedMotion: VIEWS[0].motion, timezoneId: 'UTC', deviceScaleFactor: 2});
  const page = await ctx.newPage();
  page.on('pageerror', e => bad.push(`page error ${e.message.split('\n')[0]}`));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (BLOCKED.test(u)) return r.abort();
    if (/\/models\//.test(u) && MODEL_HOLD_MS) { await new Promise(res => setTimeout(res, MODEL_HOLD_MS)); }
    return r.continue();
  });
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), seedFor(id));

  let reached = false, attempt = 0, misses = 0;
  for (attempt = 1; attempt <= ATTEMPTS && !reached; attempt++) {
    await page.goto(url);
    await page.waitForSelector('#bUnl', {state: 'visible', timeout: 30000}).catch(() => {});
    await page.waitForTimeout(500);
    await page.click('#bUnl').catch(() => {});
    await page.waitForTimeout(1200);
    await page.locator('.bk-spread .bs-start.bs-primary:has-text("Descend")').first().click({timeout: 8000}).catch(() => {});
    await page.waitForSelector('#ans', {state: 'visible', timeout: 15000}).catch(() => {});
    for (let w = 0; w < 2; w++) {
      if (!await page.locator('#ans').isVisible().catch(() => false)) { misses++; break; } // the run closed on an answer
      const word = await page.evaluate(() => document.querySelector('.word')?.getAttribute('aria-label') || '');
      const sense = answerFor(id, word);
      if (!sense) break; // no usable dictionary sense: restart with a fresh run
      await page.fill('#ans', sense);
      await page.keyboard.press('Enter');
      await page.waitForSelector('#go, .dl', {timeout: 60000}).catch(() => {});
      if (await page.locator('.dl').first().isVisible().catch(() => false)) break;
      if (await page.locator('#go').isVisible().catch(() => false)) { await page.click('#go'); await page.waitForTimeout(900); }
      if (await page.locator('.dl').first().isVisible().catch(() => false)) break;
    }
    if (await page.locator('.dl').first().isVisible().catch(() => false)) reached = true;
  }
  if (!reached) {
    bad.push(`no landing in ${ATTEMPTS} attempts (${misses} closed answers)`);
  } else {
    await page.waitForTimeout(900);
    for (const v of VIEWS) {
      await page.setViewportSize({width: v.width, height: v.height});
      await page.emulateMedia({reducedMotion: v.motion});
      await page.waitForTimeout(900);
      if (OUT) { await mkdir(OUT, {recursive: true}); await page.screenshot({path: join(OUT, `landing-${id}-${v.name}.png`)}); }
      const fit = await page.evaluate(() => {
        const dl = document.querySelector('.dl');
        const r = dl.getBoundingClientRect();
        const doors = [...dl.querySelectorAll('[data-path]')].map(b => b.getBoundingClientRect());
        return {sideways: document.documentElement.scrollWidth > innerWidth, inside: r.left >= -1 && r.right <= innerWidth + 1,
          offPage: doors.filter(d => d.left < -1 || d.right > innerWidth + 1).length, doors: doors.length};
      });
      if (fit.sideways) bad.push(`${v.name}: the landing scrolls sideways`);
      if (!fit.inside) bad.push(`${v.name}: the landing sits past the screen edge`);
      if (fit.offPage) bad.push(`${v.name}: ${fit.offPage} door(s) run past the screen edge`);
      if (fit.doors < 3) bad.push(`${v.name}: the landing shows ${fit.doors} doors, not three`);
      for (const h of await hitCheck(page, '.dl [data-path]')) if (!h.ok) bad.push(`${v.name}: door "${h.name}" is covered by ${h.by}`);
    }
    // The curio shop, at the widest motion-on view: open it, hit-test the two relics, take one.
    await page.locator('[data-path="curio"]').first().click({timeout: 5000}).catch(() => bad.push('the curio door cannot be clicked'));
    await page.waitForTimeout(700);
    const relics = await page.locator('[data-relic]').count();
    if (relics !== 2) bad.push(`the curio shop shows ${relics} relic(s), not two`);
    else {
      for (const h of await hitCheck(page, '[data-relic]')) if (!h.ok) bad.push(`relic "${h.name}" is covered by ${h.by}`);
      await page.locator('[data-relic]').first().click({timeout: 5000}).catch(() => bad.push('a relic cannot be taken'));
      await page.waitForTimeout(900);
      if (await page.locator('.dl').first().isVisible().catch(() => false)) bad.push('the landing is still open after a relic is taken');
    }
  }
  await ctx.close();
  report.push(`${tag} ${reached ? 'landing' : 'no landing'} (attempt ${attempt - 1}, ${misses} closed answers, ${((Date.now() - t0) / 1000).toFixed(0)} s) ${bad.length ? 'FAIL' : 'ok'}`);
  return bad.map(b => `${tag} ${b}`);
}

for (const id of ROOMS) problems.push(...await room(id));
await browser.close(); server.close();
console.log(report.join('\n'));
if (problems.length) { console.error('descent-path: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log(`descent-path: ok (${ROOMS.length} rooms: each reaches a landing with correct answers that fits and has clear doors at 375 and 1280 px, reduced and motion on; the curio shop takes a relic)`);
