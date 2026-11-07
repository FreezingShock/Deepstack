// Descent guard (roguelike Unlimited): the landings between words, after `npm run build`, reduced motion on.
// For every topic room, at 375x667 and 1280x800:
//  1. a run reaches the landing before word 3 and shows exactly three doors, all whole inside the screen,
//  2. the Curio door opens two relics; keeping one returns to the word with its carry chip showing,
//  3. the Rest alcove carries Spare breath, the next landing's Rest door is shut and the chip shows,
//  4. no sideways scroll, no clipped text, no console or page errors.
// Writes before/after PNGs to DESCENT_SHOTS when set (e.g. screenshots/descent). Skips (exit 0) without a browser.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
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
if (!chromium) { console.log('descent-guard: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('descent-guard: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [{w: 375, h: 667, name: 'phone'}, {w: 1280, h: 800, name: 'desk'}];
const SHOTS = process.env.DESCENT_SHOTS || '';
if (SHOTS) await mkdir(SHOTS, {recursive: true});
const problems = [];
let phase = '';
const fail = m => { if (problems.length < 60) problems.push(m); };

// Lays out what the player sees on a landing or a carried word: whole, on screen, no sideways scroll, no clipping.
const layout = page => page.evaluate(() => {
  const out = [], W = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > W + 1) out.push('sideways scroll (' + document.documentElement.scrollWidth + ' > ' + W + ')');
  const sel = '.dl-door, .dl-door *, .dl-title, .dl-lede, .dl-carry, .dl-kicker, .dc-chip';
  for (const el of document.querySelectorAll(sel)) {
    if (!el.getClientRects().length) continue;
    const r = el.getBoundingClientRect();
    if (r.left < -0.5 || r.right > W + 0.5) out.push('outside screen: ' + (el.className || el.tagName) + ' ' + el.textContent.trim().slice(0, 30));
    if (el.scrollWidth > el.clientWidth + 1) out.push('clipped text: ' + (el.className || el.tagName) + ' ' + el.textContent.trim().slice(0, 30));
  }
  return out;
});

async function answerWord(page) {
  await page.waitForSelector('#ans', {state: 'visible', timeout: 20000});
  const def = await page.evaluate(() => window.__deepstack.run.words[window.__deepstack.run.i].def);
  await page.fill('#ans', def);
  await page.keyboard.press('Enter');
  await page.waitForSelector('#go', {state: 'visible', timeout: 30000});
  await page.click('#go');
}

async function landing(page, label, shot) {
  try { await page.waitForSelector('.dl .dl-door', {state: 'visible', timeout: 30000}); }
  catch (e) {
    const st = await page.evaluate(() => JSON.stringify({i: window.__deepstack.run.i, ended: window.__deepstack.run.dsc && window.__deepstack.run.dsc.ended, results: window.__deepstack.run.results.map(r => [r.score, r.tier, r.skipped])})).catch(() => '?');
    throw new Error(`no landing (${st}): ${e.message.split('\n')[0]}`);
  }
  const n = await page.locator('.dl-door').count();
  if (n !== 3) fail(`${label}: expected 3 doors, found ${n}`);
  for (const p of await layout(page)) fail(`${label}: ${p}`);
  // the whole landing fits the stage without scrolling, and the last door is on screen
  const fit = await page.evaluate(() => {
    const st = document.querySelector('#stage'), last = [...document.querySelectorAll('.dl-door')].pop();
    const sr = st.getBoundingClientRect(), lr = last.getBoundingClientRect();
    return {scrolls: st.scrollHeight > st.clientHeight + 1, overflow: Math.round(lr.bottom - sr.bottom)};
  });
  if (fit.scrolls) fail(`${label}: the landing scrolls inside the stage`);
  if (fit.overflow > 0) fail(`${label}: last door runs ${fit.overflow}px past the stage`);
  if (shot) await page.screenshot({path: join(SHOTS, `${shot}.png`)});
}

async function play(room, view) {
  const label = `${room}/${view.name}`;
  const ctx = await browser.newContext({viewport: {width: view.w, height: view.h}, reducedMotion: 'reduce', serviceWorkers: 'block', deviceScaleFactor: 2});
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: page error ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/huggingface|hf\.co|Failed to load resource/.test(m.text())) fail(`${label}: console ${m.text().slice(0, 120)}`); });
  await page.route('**/*', r => BLOCKED.test(r.request().url()) ? r.abort() : r.continue());
  const save = {shelf: [], sound: false, bestFloor: 0, bestDepth: 0, streak: {last: '', n: 0}, daily: {}, seen: {'home.daily': 1, slip: 1, candle: 1, hint: 1}, room: room === 'hall' ? undefined : room, rating: {L: 5, placed: true, n: 40, runs: 3, seen: [], hist: []}, rooms: Object.fromEntries(ROOMS.slice(1).map(r => [r, {rating: {L: 5, placed: true, n: 40, runs: 3, seen: [], hist: []}}]))};
  await page.addInitScript(s => { try { localStorage.setItem('deepstack.v1', JSON.stringify(s)); } catch {} }, save);
  await page.goto(url);
  await page.waitForFunction(() => window.__deepstack && window.__deepstack.S, null, {timeout: 30000});
  await page.evaluate(() => window.__deepstack.startUnlimited());

  phase = `${room}/${view.name} words 1-2`;
  // words 1 and 2, then the first landing (before word 3): the Curio door
  await answerWord(page);
  await answerWord(page);
  phase = `${label} landing 1`;
  await landing(page, `${label} landing 1`, SHOTS && room === 'hall' ? `landing-${view.name}` : null);
  await page.click('[data-path="curio"]');
  await page.waitForSelector('[data-relic]', {state: 'visible', timeout: 5000});
  if ((await page.locator('[data-relic]').count()) !== 2) fail(`${label}: curio should offer two relics`);
  for (const p of await layout(page)) fail(`${label} curio: ${p}`);
  if (SHOTS && room === 'hall') await page.screenshot({path: join(SHOTS, `curio-${view.name}.png`)});
  await page.locator('[data-relic]').first().click();
  await page.waitForSelector('#ans', {state: 'visible', timeout: 20000});
  if (!(await page.locator('.dc-chip.relic').count())) fail(`${label}: relic chip missing on the word after the curio`);
  for (const p of await layout(page)) fail(`${label} word 3 chips: ${p}`);
  if (SHOTS && room === 'hall') await page.screenshot({path: join(SHOTS, `carry-word-${view.name}.png`)});

  phase = `${label} words 3-4`;
  // words 3 and 4, then the second landing (before word 5): the Rest alcove
  await answerWord(page);
  await answerWord(page);
  phase = `${label} landing 2`;
  await landing(page, `${label} landing 2`, null);
  await page.click('[data-path="rest"]');
  await page.waitForSelector('#ans', {state: 'visible', timeout: 20000});
  if (!(await page.locator('.dc-chip.spare').count())) fail(`${label}: Spare breath chip missing after the Rest alcove`);

  phase = `${label} words 5-6`;
  // words 5 and 6, then landing 3 (before word 7): Rest is shut while Spare breath is carried
  await answerWord(page);
  await answerWord(page);
  phase = `${label} landing 3`;
  await landing(page, `${label} landing 3`, null);
  const restOff = await page.locator('[data-path="rest"]').isDisabled();
  if (!restOff) fail(`${label}: Rest alcove should be shut while Spare breath is carried`);
  await ctx.close();
}

try {
  for (const room of ROOMS) for (const view of VIEWS) await play(room, view);
} catch (e) {
  fail(`descent-guard crashed${phase ? ' at ' + phase : ''}: ` + (e && e.message ? e.message.split('\n')[0] : e));
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(`descent-guard: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`descent-guard: landings whole, carry chips shown, no clipping, in ${ROOMS.length} rooms at ${VIEWS.map(v => v.w).join(' and ')}`);
