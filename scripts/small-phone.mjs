// Small-phone tap targets: at 320x568 (iPhone SE, first gen) every visible control on the main screens must have a
// hit area of at least 44 by 44 px. The hit area is the element's box or its ::before/::after box, whichever is larger,
// so a control can grow its target with a transparent pseudo-element and keep its look. ALLOW lists the controls that
// are still open, each with the reason; shrink the list as they are fixed, never grow it to get green.
// Run after `npm run build`; set CHROMIUM_PATH if Playwright's own Chromium is missing.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(root, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch { console.log('small-phone: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch { console.log('small-phone: no browser, skipping'); server.close(); process.exit(0); }

const MIN = 44;
// Open items, each with its reason. Remove an entry in the PR that fixes it.
const ALLOW = [
  ['#home .hbook', 'home spines are 24px tall; a 44px target needs a layout decision (nate)'],
  ['#home .cc-tab', 'card catalogue tab overlaps the tagline and the first room dot; placement decision (PR 2)'],
  ['#tracker li button', 'depth rail plaques are hidden on phones; the rail itself is the target (tracker)'],
  ['.skiplink', 'off-screen until focused'],
  ['#sSound, #sVol, #sMus, #sFx', 'settings switch and sliders at 320 (PR 2: settings controls)'],
  ['#sMotion button', 'settings motion chips at 320 (PR 2: settings controls)'],
];
const OUT = process.env.SHOTS || '';
if (OUT) await mkdir(OUT, {recursive: true});

const SEED = () => { if (!localStorage.getItem('deepstack.v1')) { const sh = []; for (let i = 0; i < 36; i++) sh.push({w: 'word' + i, tier: i % 7, score: 50 + i, t: 1700000000000 + i * 864e5, ft: i * 30, fl: i % 5}); localStorage.setItem('deepstack.v1', JSON.stringify({shelf: sh, streak: {last: '', n: 3}, bestDepth: 300})); } };
const failures = [];
const VIEWS = [
  ['home', async () => {}],
  ['daily', async p => { await p.evaluate(() => document.getElementById('bDaily').click()); }],
  ['unlimited', async p => { await p.evaluate(() => document.getElementById('bUnl').click()); }],
  ['rooms', async p => { await p.evaluate(() => document.getElementById('bRooms').click()); }],
  ['stats', async p => { await p.evaluate(() => document.getElementById('bStats').click()); }],
  ['settings', async p => { await p.evaluate(() => document.getElementById('bSettings').click()); }],
  ['run', async p => { await p.evaluate(() => document.getElementById('bPlay').click()); }],
];
for (const [w, h] of [[320, 568]]) {
  for (const [name, open] of VIEWS) {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce', deviceScaleFactor: 1, isMobile: true, hasTouch: true});
    await ctx.addInitScript(SEED);
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.route(u => !u.href.startsWith(url), r => r.abort());
    await page.goto(url);
    await page.waitForSelector('#home .descend', {timeout: 15000});
    await page.waitForTimeout(600);
    await open(page);
    await page.waitForTimeout(1500);
    const bad = await page.evaluate(({MIN, ALLOW}) => {
      const shown = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
      const hit = (e, pseudo) => { const cs = getComputedStyle(e, pseudo); if (cs.content === 'none' || cs.content === 'normal') return null; return {w: parseFloat(cs.width) || 0, h: parseFloat(cs.height) || 0}; };
      const out = [];
      for (const e of document.querySelectorAll('button, a[href], input, select, textarea, [role=button]')) {
        if (!shown(e) || e.closest('[inert],[aria-hidden=true]:not(.rail)') && !e.closest('.bk-spread')) { /* decorative or hidden */ }
        if (!shown(e)) continue;
        if (ALLOW.some(([s]) => e.matches(s))) continue;
        const r = e.getBoundingClientRect();
        let w = r.width, h = r.height;
        for (const ps of ['::before', '::after']) { const p = hit(e, ps); if (p) { w = Math.max(w, p.w); h = Math.max(h, p.h); } }
        if (w < MIN - 0.5 || h < MIN - 0.5) out.push(`${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${String(e.className).split(' ')[0]} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 28)}" ${Math.round(w)}x${Math.round(h)}`);
      }
      return [...new Set(out)];
    }, {MIN, ALLOW});
    if (OUT) await page.screenshot({path: `${OUT}/${name}-${w}x${h}.png`});
    for (const b of bad) failures.push(`${name} ${w}x${h}: ${b} is under ${MIN}px`);
    if (errs.length) failures.push(`${name} ${w}x${h}: page errors ${errs.slice(0, 2).join('; ')}`);
    await ctx.close();
  }
}
await browser.close(); server.close();
if (failures.length) { console.log('small-phone FAILED:\n  ' + failures.join('\n  ')); process.exit(1); }
console.log(`small-phone: every control on ${VIEWS.length} screens at 320x568 has a 44px target (${ALLOW.length} open items listed)`);
