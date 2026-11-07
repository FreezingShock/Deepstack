// Reduced-motion page-fit guard: with the OS (or in-game Calm) reduced motion on, every menu book and panel is opened
// at phone and desktop width in every topic room, and the page fitter's result is checked:
//   - a zoom the fitter set on a page element must be the zoom that is in effect (a stale layout read once made the
//     Daily book fall back to 100% and hide its calendar page under html.rm: the 0.01 ms transitions the rule gave
//     every element also animated zoom, so the fitter measured the old size);
//   - a page that is fitted (overflow hidden) must not hide any of its in-flow content below its bottom edge;
//   - the same page, room and width must fit the same way with the motion setting on or off (the fit must not
//     depend on html.rm). A fitter that gave up under reduced motion left the Daily calendar at full size, scrollable.
// Writes nothing to disk unless SHOTS is set to a folder (then it saves one screenshot per book and view there).
//   node scripts/rm-page-fit.mjs        run after `npm run build`
// Skips (exit 0) when no Chromium is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(root, p)); // read before writing headers so a missing file reaches the 404 below
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); }
catch { try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('rm-page-fit: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('rm-page-fit: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const T = 15000;
const SHOTS = process.env.SHOTS || '';
const VIEWS = [{name: '375', width: 375, height: 700}, {name: '1280', width: 1280, height: 800}];
// Every topic room (the same seven the room audit uses), so each room's fire, names and Daily are on the home room behind the books.
const ROOM_IDS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
// Each menu book or panel: the button that opens it, and how to close it again.
const BOOKS = [['bDaily', 'Daily'], ['bUnl', 'Unlimited'], ['bAll', 'Shelf'], ['bRooms', 'Rooms'], ['bStats', 'Almanac'], ['bSettings', 'Settings'], ['bKeys', 'Keys'], ['bCredits', 'Credits']];
const problems = [];
const fail = msg => problems.push(msg);

// Runs in the page: every visible fitted page, its zoom and its content bottom. Returns {pages, problems}.
const inspect = (book) => {
  const out = {pages: 0, problems: [], sig: []};
  const pages = [...document.querySelectorAll('.bk-spread .pg-in, .tpbox, .khbox')].filter(p => p.getClientRects().length);
  out.pages = pages.length;
  pages.forEach((pg, i) => {
    const label = `${book} page ${i + 1} (${pg.className})`;
    const cs = getComputedStyle(pg);
    const kids = [...pg.children].filter(k => getComputedStyle(k).display !== 'none');
    out.sig.push({overflow: cs.overflowY, zoom: kids.map(k => Math.round(parseFloat(getComputedStyle(k).zoom) * 100) / 100)});
    for (const k of kids) {
      const want = parseFloat(k.style.zoom);
      if (k.style.zoom && !Number.isNaN(want) && want < 1) {
        const got = parseFloat(getComputedStyle(k).zoom);
        if (Math.abs(got - want) > 0.01) out.problems.push(`${label}: fitter set zoom ${want} on <${k.tagName.toLowerCase()} class="${k.className.baseVal ?? k.className}"> but ${got} is in effect`);
      }
    }
    if (cs.overflowY === 'hidden') {
      const flow = kids.filter(k => getComputedStyle(k).position !== 'absolute');
      const padB = parseFloat(cs.paddingBottom) || 0;
      const edge = pg.getBoundingClientRect().top + pg.clientTop + pg.clientHeight - padB;
      const bottom = Math.max(0, ...flow.map(k => k.getBoundingClientRect().bottom));
      if (bottom - edge > 2) out.problems.push(`${label}: fitted page hides ${Math.round(bottom - edge)}px of its content below the edge`);
    }
  });
  return out;
};

for (const view of VIEWS) for (const room of ROOM_IDS) {
  const tag = `${view.name}px room ${room}`;
  const ctx = await browser.newContext({viewport: {width: view.width, height: view.height}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  // Calm (in-game Motion) plus the OS flag: html.rm is set from either, and the bug only shows when it is set.
  await ctx.addInitScript(r => {
    try {
      localStorage.setItem('deepstack.settings.v1', JSON.stringify({text: 'normal', motion: 'reduce'}));
      if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify({room: r}));
    } catch {}
  }, room);
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => fail(`${tag}: pageerror ${e.message}`));
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bDaily').waitFor({state: 'visible', timeout: T}).catch(() => fail(`${tag}: home never showed the Daily book`));
  if (!(await page.evaluate(() => document.documentElement.classList.contains('rm')))) fail(`${tag}: html.rm is not set, so this guard is not testing reduced motion`);
  for (const [id, name] of BOOKS) {
    const what = `${tag} ${name}`;
    try {
      const btn = page.locator(`#${id}`);
      // Some buttons live in the phone rail or the keys panel only on some widths: a button that is not on screen here is not a book to check.
      if (!(await btn.isVisible())) { if (view.width >= 1280) fail(`${what}: button is not on screen at desktop width`); continue; }
      await btn.click({timeout: T});
      await page.waitForTimeout(1100); // the book opens, then the fitter runs (120 ms debounce) once it settles
      const got = await page.evaluate(inspect, name);
      if (got.pages === 0) fail(`${what}: no visible pages to check`);
      for (const p of got.problems) fail(`${what}: ${p}`);
      // The same book with motion on: the fitter must reach the same answer, or reduced motion changed the layout.
      await page.evaluate(() => { document.documentElement.classList.remove('rm'); dispatchEvent(new Event('resize')); });
      await page.waitForTimeout(700);
      const full = await page.evaluate(inspect, name);
      await page.evaluate(() => { document.documentElement.classList.add('rm'); dispatchEvent(new Event('resize')); });
      await page.waitForTimeout(700);
      if (JSON.stringify(got.sig) !== JSON.stringify(full.sig)) {
        const rmFit = JSON.stringify(got.sig), fullFit = JSON.stringify(full.sig);
        fail(`${what}: reduced motion fits the page differently (motion on: ${fullFit.slice(0, 160)} | reduced: ${rmFit.slice(0, 160)})`);
      }
      if (SHOTS && room === 'hall') {
        await mkdir(SHOTS, {recursive: true});
        await page.screenshot({path: join(SHOTS, `${view.name}-${id}.png`)});
      }
    } catch (e) {
      fail(`${what}: could not open and check (${e.message.split('\n')[0]})`);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  }
  await ctx.close();
}

await browser.close(); server.close();
if (problems.length) { console.error(`rm-page-fit: FAILED (${problems.length})\n - ` + [...new Set(problems)].join('\n - ')); process.exit(1); }
console.log(`rm-page-fit: ok (${BOOKS.length} books and panels at 375 and 1280 in all ${ROOM_IDS.length} topic rooms, reduced motion on: every fitter zoom takes effect and no fitted page hides content)`);
