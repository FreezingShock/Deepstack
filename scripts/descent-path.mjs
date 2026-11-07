// Descent path guard: an Unlimited run reaches a landing with correct answers, and the landing's doors work. Every
// answer must be the word's own dictionary sense (public/data/senses.json). The model files are held back 7 s, so the
// run is judged while the quick judge's lexical fallback is in use, which is the slow-network case. A word without a
// sense restarts the attempt (a run is not saved, so a reload is free). Checks the landing fits the phone width, then
// opens the curio shop and takes a relic. Drives dist/ in headless Chromium with a seeded save. Skips (exit 0) without
// a browser. Run after `npm run build`.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

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
const senseOf = w => { const e = senses[w]; return e && (e.alt?.[0]?.[1] || e.syn?.[0]?.[1]) || null; };
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const SEED = {shelf: [], daily: {}, rooms: {}, rating: {L: 70, placed: true, n: 20, runs: 3, seen: [], hist: []}, streak: {last: '2026-11-06', n: 2}, bestFloor: 3, bestDepth: 300, sound: false};
const ATTEMPTS = 14;
const problems = [];

const ctx = await browser.newContext({viewport: {width: 375, height: 740}, reducedMotion: 'reduce', timezoneId: 'UTC', deviceScaleFactor: 2});
const page = await ctx.newPage();
page.on('pageerror', e => problems.push(`page error ${e.message.split('\n')[0]}`));
await page.route('**/*', async r => {
  const u = r.request().url();
  if (BLOCKED.test(u)) return r.abort();
  if (/\/models\//.test(u)) { await new Promise(res => setTimeout(res, 7000)); }
  return r.continue();
});
await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), SEED);

let reached = false, attempt = 0;
for (attempt = 1; attempt <= ATTEMPTS && !reached; attempt++) {
  await page.goto(url);
  await page.waitForSelector('#bUnl', {state: 'visible', timeout: 15000});
  await page.waitForTimeout(500);
  await page.click('#bUnl');
  await page.waitForTimeout(1200);
  await page.locator('.bk-spread .bs-start.bs-primary:has-text("Descend")').first().click({timeout: 5000}).catch(() => {});
  await page.waitForSelector('#ans', {state: 'visible', timeout: 15000}).catch(() => {});
  for (let w = 0; w < 2; w++) {
    const word = await page.evaluate(() => document.querySelector('.word')?.getAttribute('aria-label') || '');
    const sense = senseOf(word);
    if (!sense) break; // no dictionary sense: restart with a fresh run
    await page.fill('#ans', sense);
    await page.keyboard.press('Enter');
    await page.waitForSelector('#go, .dl', {timeout: 30000}).catch(() => {});
    if (await page.locator('.dl').first().isVisible().catch(() => false)) break;
    if (await page.locator('#go').isVisible().catch(() => false)) { await page.click('#go'); await page.waitForTimeout(900); }
    if (await page.locator('.dl').first().isVisible().catch(() => false)) break;
  }
  if (await page.locator('.dl').first().isVisible().catch(() => false)) {
    reached = true;
    await page.waitForTimeout(900);
    if (OUT) { await mkdir(OUT, {recursive: true}); await page.screenshot({path: join(OUT, 'landing-375.png')}); }
    const fit = await page.evaluate(() => {
      const dl = document.querySelector('.dl');
      const r = dl.getBoundingClientRect();
      const sideways = document.documentElement.scrollWidth > innerWidth;
      const doors = [...dl.querySelectorAll('[data-path]')].map(b => b.getBoundingClientRect());
      const offPage = doors.filter(d => d.left < -1 || d.right > innerWidth + 1).length;
      return {sideways, offPage, doors: doors.length, inside: r.left >= -1 && r.right <= innerWidth + 1};
    });
    if (fit.sideways) problems.push('the landing scrolls sideways at 375 px');
    if (fit.offPage) problems.push(`${fit.offPage} landing door(s) run past the screen edge`);
    if (fit.doors < 3) problems.push(`the landing shows ${fit.doors} doors, not three`);
    /* the desktop landing: the doors stop above the shelf's books (canvas art behind the card, so no DOM hit test sees
       them). Their bottom edge stays in the top 70% of a 1280 x 800 screen; the books reach about 71% of it. */
    await page.setViewportSize({width: 1280, height: 800});
    await page.waitForTimeout(900);
    const deskBottom = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.dl [data-path]')].map(b => b.getBoundingClientRect().bottom)));
    if (OUT) { await mkdir(OUT, {recursive: true}); await page.screenshot({path: join(OUT, 'landing-1280.png')}); }
    if (deskBottom > 800 * 0.7) problems.push(`the desktop landing's doors run down into the shelf books (bottom at ${Math.round(deskBottom / 800 * 100)}% of 800 px)`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) problems.push('the desktop landing scrolls sideways at 1280 px');
    /* the curio shop: its two relics must appear, and one must be takeable */
    await page.locator('[data-path="curio"]').first().click({timeout: 3000}).catch(() => problems.push('the curio door cannot be clicked'));
    await page.waitForTimeout(700);
    const relics = await page.locator('[data-relic]').count();
    if (relics !== 2) problems.push(`the curio shop shows ${relics} relic(s), not two`);
    else {
      await page.locator('[data-relic]').first().click({timeout: 3000}).catch(() => problems.push('a relic cannot be taken'));
      await page.waitForTimeout(900);
      if (await page.locator('.dl').first().isVisible().catch(() => false)) problems.push('the landing is still open after a relic is taken');
    }
  }
}
await ctx.close();
await browser.close(); server.close();
if (!reached) problems.push(`no landing in ${ATTEMPTS} attempts with correct answers`);
if (problems.length) { console.error('descent-path: FAILED\n' + problems.join('\n')); process.exit(1); }
console.log(`descent-path: ok (landing reached on a slow model, fits 375 px, curio shop takes a relic; attempt ${attempt - 1})`);
