// Guard: the home's Descend button must not jump while the page settles. The fireplace fit (src/ui/hearth.js) once read boxes
// mid-transition and flipped the room between its compact and normal layouts several times a second under Reduce Motion
// (the button moved about 55px each time). This serves dist/, samples the button's top edge for ~3 s on a phone and a desktop,
// with reduced motion on and off, and fails if it lands in more than one place after the first 0.6 s.
//   npm run build && node scripts/home-steady.mjs
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';

const root = process.env.DIST || new URL('../dist/', import.meta.url).pathname;
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json'};
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(root, p)));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
const {chromium} = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
// a returning player with a shelf, so the home shows the full room (the fit is the thing under test)
const SAVE = JSON.stringify({shelf: Array.from({length: 14}, (_, i) => ({w: 'word' + i, tier: i % 7, score: 50 + i, t: 1700000000000 + i * 864e5, ft: i * 30, fl: i % 5})), streak: {last: '', n: 3}, bestDepth: 300, room: 'hall'});
const VIEWS = [{name: 'phone', width: 375, height: 667, mobile: true}, {name: 'desktop', width: 1280, height: 800, mobile: false}];
let failed = 0;
try {
  for (const v of VIEWS) for (const reducedMotion of ['reduce', 'no-preference']) {
    const ctx = await browser.newContext({viewport: {width: v.width, height: v.height}, isMobile: v.mobile, hasTouch: v.mobile, reducedMotion});
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.route(u => !u.href.startsWith(url), r => r.abort());
    await page.addInitScript(sv => { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', sv); }, SAVE);
    await page.goto(url, {waitUntil: 'load'});
    await page.locator('#bPlay').waitFor({state: 'visible', timeout: 15000});
    const samples = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 3000) {
      samples.push({t: Date.now() - t0, y: await page.evaluate(() => { const b = document.querySelector('#bPlay'); return b ? Math.round(b.getBoundingClientRect().top) : -1; })});
      await page.waitForTimeout(100);
    }
    const settled = [...new Set(samples.filter(s => s.t >= 600).map(s => s.y))];
    const label = `${v.name} ${reducedMotion === 'reduce' ? 'reduced motion' : 'motion on'}`;
    if (settled.length > 1) { failed++; console.error(`FAIL ${label}: Descend button sat in ${settled.length} places after settling: ${settled.join(', ')} px`); }
    else console.log(`ok   ${label}: Descend steady at ${settled[0]} px`);
    if (errs.length) { failed++; console.error(`FAIL ${label}: page errors: ${errs.slice(0, 3).join(' | ')}`); }
    await ctx.close();
  }
} finally {
  await browser.close(); server.close();
}
if (failed) { console.error(`${failed} check(s) failed`); process.exit(1); }
