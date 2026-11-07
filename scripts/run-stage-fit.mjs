// Run-stage fit: a live combo and a deep floor's rule can stack taller than the window; the run stage must still
// fit with no scrollbar (#stage never scrolls), the combo must sit on the word-count row, and the answer slip keeps
// at least 56 px. Plays one good answer so a combo is live, then adds the floor rule the way showWord does, at phone
// and desktop sizes with reduced motion. Run after `npm run build`. CHROMIUM_PATH selects a Chromium binary.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.woff2': 'font/woff2'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try { let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(await readFile(join(root, p)));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch { console.log('run-stage-fit: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('run-stage-fit: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const entries = JSON.parse(await readFile(join(root, 'data/room-words.json'), 'utf8')).rooms.history;
const DEF = new Map(entries.map(e => [e[0], e[2]]));
const SIZES = [[375, 667, 2, true], [390, 844, 3, true], [1280, 800, 1, false], [1280, 720, 1, false], [1024, 768, 1, false], [1920, 1080, 1, false]];
const RULE = 'The lamps are lit. Ten extra seconds on every word.';
const failures = [];
const T = 15000;

for (const [w, h, dsf, mobile] of SIZES) {
  const label = `${w}x${h}`;
  const ctx = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: dsf, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  page.on('pageerror', e => failures.push(`${label} pageerror: ${e.message}`));
  await page.route(u => !u.href.startsWith(url) && !/fonts\.googleapis/.test(u.href), r => r.abort());
  await page.route(/fonts\.googleapis/, r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
  await page.addInitScript(() => { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify({shelf: [], streak: {last: '', n: 0}, bestDepth: 0, room: 'history'})); });
  try {
    await page.goto(url, {waitUntil: 'load'});
    await page.locator('#bUnl').waitFor({state: 'visible', timeout: T});
    await page.waitForTimeout(600);
    await page.locator('#bUnl').click();
    await page.locator('[role=dialog].intro button.bs-primary:not([data-act])').first().click({timeout: T});
    for (let i = 0; i < 2; i++) { // word one answered well, so word two starts with a live combo
      const word = await page.locator('#stage .word').first().getAttribute('aria-label', {timeout: T});
      await page.locator('#ans').click({timeout: T});
      await page.keyboard.type(DEF.get(word) || 'a thing that does this');
      await page.keyboard.press('Enter');
      await page.locator('#cardlayer:not([hidden]) #go').waitFor({state: 'visible', timeout: T});
      await page.waitForTimeout(300);
      await page.locator('#go').click();
      await page.waitForTimeout(1200);
    }
    // the floor rule, as showWord writes it on a deep floor (Unlimited runs only)
    await page.evaluate(rule => { const d = document.createElement('div'); d.className = 'floorrule'; d.textContent = rule; document.querySelector('#stage .wlabel').after(d); }, RULE);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const st = document.querySelector('#stage');
      const combo = st.querySelector('.combo.live'), wl = st.querySelector('.wlabel'), ta = st.querySelector('.slip textarea');
      const btn = st.querySelector('#ans') && st.querySelector('.row #hint');
      const slipH = ta ? ta.offsetHeight : 0;
      return {
        over: st.scrollHeight - st.clientHeight, overflowY: getComputedStyle(st).overflowY,
        comboOnWordRow: !!combo && !!wl && wl.contains(combo),
        comboTop: combo ? Math.round(combo.getBoundingClientRect().top) : null, wlTop: wl ? Math.round(wl.getBoundingClientRect().top) : null,
        slipH, buttonVisible: !!btn && btn.getBoundingClientRect().bottom <= st.getBoundingClientRect().bottom + 1
      };
    });
    if (r.over > 0) failures.push(`${label}: run stage scrolls by ${r.over}px with a combo and a floor rule`);
    if (r.overflowY !== 'auto' && r.overflowY !== 'visible' && r.overflowY !== 'hidden') failures.push(`${label}: unexpected overflow ${r.overflowY}`);
    if (!r.comboOnWordRow) failures.push(`${label}: combo is not on the word-count row`);
    if (r.comboOnWordRow && Math.abs(r.comboTop - r.wlTop) > 12) failures.push(`${label}: combo drops off the word-count row (${r.comboTop} vs ${r.wlTop})`);
    if (r.slipH < 56) failures.push(`${label}: answer slip shrank to ${r.slipH}px`);
    if (!r.buttonVisible) failures.push(`${label}: the Hint and Skip buttons fall outside the stage`);
    console.log(`run-stage-fit ${label}: overflow ${r.over}px, slip ${r.slipH}px, combo on word row ${r.comboOnWordRow}`);
  } catch (e) {
    failures.push(`${label}: ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
}
await browser.close();
server.close();
if (failures.length) { console.error('run-stage-fit: FAILED\n  ' + failures.join('\n  ')); process.exit(1); }
console.log('run-stage-fit: ok');
