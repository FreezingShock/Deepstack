// Desktop home frames: the card catalogue (left wall) and the Librarian's Card (right wall) must show their full edges.
// At each desktop width the two units must have scrollWidth == clientWidth (nothing spills out of the frame), sit inside
// the home niche (so the niche's overflow never clips them), and keep clear of the Descend plaque. Run after `npm run build`.
// Set FRAMES_OUT to a folder to save a screenshot per width (set CHROMIUM_PATH if Playwright's own Chromium is missing).
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.otf': 'font/otf'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try { let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(root, p)));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch { console.log('home-frames: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch { console.log('home-frames: no browser, skipping'); server.close(); process.exit(0); }
const outDir = process.env.FRAMES_OUT;
if (outDir) await mkdir(outDir, {recursive: true});
const failures = [];
for (const [w, h] of [[1000, 800], [1280, 800], [1440, 900], [1640, 900], [1920, 1080]]) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  await page.goto(url);
  await page.waitForSelector('.home .descend, .home #bRes', {timeout: 15000});
  await page.waitForTimeout(1000);
  const m = await page.evaluate(() => {
    const box = e => { const b = e.getBoundingClientRect(); return {l: b.left, r: b.right}; };
    const home = document.querySelector('#home'), desc = document.querySelector('.home .descend');
    const out = {room: home.dataset.room, home: box(home), descend: desc ? box(desc) : null, units: {}};
    for (const [k, s] of [['cabinet', '.home .cc-cab'], ['ledger', '.home .ledger']]) {
      const e = document.querySelector(s);
      if (!e || !e.getClientRects().length) { out.units[k] = null; continue; }
      out.units[k] = {sw: e.scrollWidth, cw: e.clientWidth, ...box(e)};
    }
    return out;
  });
  const tag = `${w}x${h} (${m.room})`;
  const {cabinet: c, ledger: g} = m.units;
  if (!c || !g) failures.push(`${tag}: the cabinet or the ledger is not shown`);
  else for (const [k, u] of [['card catalogue', c], ["Librarian's Card", g]]) {
    if (u.sw !== u.cw) failures.push(`${tag}: ${k} content is ${u.sw}px in a ${u.cw}px frame`);
    if (u.l < m.home.l + 1 || u.r > m.home.r - 1) failures.push(`${tag}: ${k} runs past the niche (${Math.round(u.l)}..${Math.round(u.r)} in ${Math.round(m.home.l)}..${Math.round(m.home.r)})`);
  }
  if (c && m.descend && c.r > m.descend.l - 4) failures.push(`${tag}: card catalogue touches Descend`);
  if (g && m.descend && g.l < m.descend.r + 4) failures.push(`${tag}: Librarian's Card touches Descend`);
  if (outDir) await page.screenshot({path: join(outDir, `home-${w}x${h}.png`)});
  console.log(tag, JSON.stringify(m.units));
  await ctx.close();
}
await browser.close(); server.close();
if (failures.length) { failures.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('home-frames: ok');
