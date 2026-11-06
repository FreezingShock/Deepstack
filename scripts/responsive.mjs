// Responsive check: the home room and every menu book at many window sizes, from a 320 px phone to a wide monitor.
// For each size it asserts: the page never scrolls sideways, the home room does not scroll or overlap itself, the
// attic tag never sits on the title, and each menu book stays inside the window. Screenshots go to responsive-shots/
// (or the folder in SHOTS). Run after `npm run build`; set CHROMIUM_PATH if Playwright's own Chromium is missing.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try { let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(root, p)));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch { console.log('responsive: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch { console.log('responsive: no browser, skipping'); server.close(); process.exit(0); }
const OUT = process.env.SHOTS || 'responsive-shots';
await mkdir(OUT, {recursive: true});
const SIZES = process.argv.slice(2).filter(a => /^\d+x\d+$/.test(a)).map(a => a.split('x').map(Number));
if (!SIZES.length) SIZES.push([320, 568], [360, 640], [375, 667], [414, 896], [568, 320], [667, 375], [800, 600], [900, 420], [965, 780], [1024, 768], [1280, 500], [1280, 720], [1920, 1080]);
const BOOKS = process.env.BOOKS === '0' ? [] : ['bDaily', 'bUnl', 'bAll', 'bSets', 'bStats'];
const failures = [];
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { if (!localStorage.getItem('deepstack.v1')) { const sh = []; for (let i = 0; i < 36; i++) sh.push({w: 'word' + i, tier: i % 7, score: 50 + i, t: 1700000000000 + i * 864e5, ft: i * 30, fl: i % 5}); localStorage.setItem('deepstack.v1', JSON.stringify({shelf: sh, streak: {last: '', n: 3}, bestDepth: 300})); } });
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  await page.goto(url);
  await page.waitForSelector('.home .descend, .home #bRes', {timeout: 15000});
  await page.waitForTimeout(900);
  const tag = `${w}x${h}`, bad = m => failures.push(`${tag}: ${m}`);
  const m = await page.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom}; };
    const home = document.querySelector('#home');
    return {sw: document.documentElement.scrollWidth, over: home.scrollHeight - home.clientHeight, home: box('#home'), title: box('.hz-title .title'), cue: box('.ach-tag'), descend: box('.descend'), stacks: box('.hsecs'), hb: [...document.querySelectorAll('.hbook')].map(e => { const b = e.getBoundingClientRect(); return {l: b.left, r: b.right, w: b.width}; })};
  });
  if (m.sw > w) bad(`page scrolls sideways (${m.sw}px)`);
  if (m.over > 2) bad(`home room scrolls by ${m.over}px`);
  if (m.cue && m.title && m.cue.b > m.title.t + 2 && m.cue.r > m.title.l && m.cue.l < m.title.r) bad('attic tag overlaps the title');
  if (m.descend && m.descend.r > w + 1) bad('Descend runs off the window');
  if (m.stacks && m.home && m.stacks.b > m.home.b + 2) bad('book stacks hang below the room');
  for (const b of m.hb) if (b.w < 40 || b.l < -1 || b.r > w + 1) bad('a menu spine is clipped or collapsed');
  await page.screenshot({path: `${OUT}/home-${tag}.png`});
  for (const id of BOOKS) {
    const ok = await page.evaluate(i => { const e = document.getElementById(i); if (!e) return false; e.click(); return true; }, id);
    if (!ok) continue;
    await page.waitForTimeout(1100);
    const b = await page.evaluate(() => { const e = document.querySelector('.bk-spread'); if (!e) return null; const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom, sw: document.documentElement.scrollWidth, cut: [...document.querySelectorAll('.bk-spread .pg-in')].some(p => { const pb = p.getBoundingClientRect().bottom; return getComputedStyle(p).overflowY === 'hidden' && [...p.children].some(k => getComputedStyle(k).position !== 'absolute' && k.getBoundingClientRect().height > 0 && k.getBoundingClientRect().bottom > pb + 2); })}; });
    if (!b) bad(`${id} did not open`);
    else {
      if (b.l < -1 || b.r > w + 1 || b.b > h + 1) bad(`${id} spills outside the window`);
      if (b.sw > w) bad(`${id} makes the page scroll sideways`);
      if (b.cut) bad(`${id}: a page's writing runs past the page and is cut off`);
    }
    await page.screenshot({path: `${OUT}/${id}-${tag}.png`});
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  }
  if (errs.length) bad('page errors: ' + errs.join(' | '));
  console.log(tag, 'checked');
  await ctx.close();
}
await browser.close(); server.close();
if (failures.length) { failures.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('responsive: ok');
