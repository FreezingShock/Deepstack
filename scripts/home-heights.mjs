// Home layout check at five room heights (560..1000) and two phones: no scrolling, zones in order
// and not overlapping, the book stacks standing on the ledge. Run after `npm run build`.
// Screenshots go to home-heights/ (set CHROMIUM_PATH if Playwright's own Chromium is missing).
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
try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch { console.log('home-heights: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('home-heights: no browser, skipping'); server.close(); process.exit(0); }
await mkdir('home-heights', {recursive: true});
const failures = [];
for (const [w, h] of [[1280, 560], [1280, 667], [1280, 800], [1280, 900], [1280, 1000], [375, 667], [414, 896]]) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  await page.goto(url);
  await page.waitForSelector('.home .descend, .home #bRes', {timeout: 15000});
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return {top: b.top, bottom: b.bottom}; };
    const c = document.querySelector('#home'), box = c.getBoundingClientRect(), cs = getComputedStyle(c);
    return {room: c.dataset.room, over: c.scrollHeight - c.clientHeight, title: r('.hz-title'), plaque: r('.hz-plaque'), stacks: r('.hsecs'), floor: box.bottom - parseFloat(cs.paddingBottom)};
  });
  const tag = `${w}x${h} (${m.room})`;
  if (m.over > 1) failures.push(`${tag}: home scrolls by ${m.over}px`);
  if (m.title.bottom > m.plaque.top + 1 || m.plaque.bottom > m.stacks.top + 1) failures.push(`${tag}: zones overlap`);
  if (Math.abs(m.stacks.bottom - m.floor) > 6) failures.push(`${tag}: stacks end ${Math.round(m.stacks.bottom)} but the ledge is at ${Math.round(m.floor)}`);
  await page.screenshot({path: `home-heights/${w}x${h}.png`});
  console.log(tag, JSON.stringify(m));
  await ctx.close();
}
await browser.close(); server.close();
if (failures.length) { failures.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('home-heights: ok');
