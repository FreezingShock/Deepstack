// Guard and screenshots for the margin note on the result card (src/ui/wordNotes.js). Run after `npm run build`.
//   node scripts/word-notes-check.mjs [--dist dist] [--shots screenshots/word-notes] [--label after]
// For every topic room at 375px and 1280px, reduced motion on: play one word, wait for the result card, turn to the margin
// note and check that (1) the ribbon tab exists and the note loads (or says there is none), (2) the card fits the viewport
// with no horizontal overflow and no scrollbar on the page, and (3) the margin note's text stays inside its sheet.
// Skips (exit 0) without a browser or without built data, like the other guards.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {extname, join, normalize, resolve} from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const dist = resolve(arg('dist', 'dist')), shotsDir = resolve(arg('shots', 'screenshots/word-notes')), label = arg('label', 'after');
const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [{w: 375, h: 700}, {w: 1280, h: 800}];
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const ANSWER = 'a place where books and records are kept';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};

if (!existsSync(join(dist, 'index.html'))) { console.log('word-notes-check: no build in ' + dist + ', skipping'); process.exit(0); }
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(dist, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end('nf'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); } catch { console.log('word-notes-check: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('word-notes-check: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

await mkdir(shotsDir, {recursive: true});
const problems = [], report = [];
const T = 15000;
const shelf = Array.from({length: 6}, (_, i) => ({w: 'word' + i, word: 'word' + i, s: 60 + i, t: Date.now() - i * 1e6}));

for (const view of VIEWS) for (const room of ROOMS) {
  const tag = `${view.w}px ${room}`;
  let step = '';
  const ctx = await browser.newContext({viewport: {width: view.w, height: view.h}, reducedMotion: 'reduce', serviceWorkers: 'block', deviceScaleFactor: view.w < 800 ? 2 : 1});
  await ctx.addInitScript(s => {
    try { localStorage.setItem('deepstack.v1', JSON.stringify(s.save)); localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: 'reduce'})); } catch {}
  }, {save: {shelf, bestDepth: 900, bestFloor: 0, room: room === 'hall' ? undefined : room, streak: {last: '', n: 3}, daily: {}}});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  try {
    step = 'open the home screen';
    await page.goto(url, {waitUntil: 'load'});
    step = 'find Descend';
    await page.locator('#bPlay').first().waitFor({state: 'visible', timeout: T});
    await page.waitForTimeout(800); // the Descend plaque settles after it first shows
    step = 'start the run';
    // Descend is sometimes ignored while the room's intro still runs, so press again until the answer box opens.
    // force: the Descend plaque can keep a looping motion that Playwright's stability check never accepts.
    for (let press = 0; press < 3; press++) {
      await page.locator('#bPlay').first().click({force: true});
      if (await page.locator('textarea, input[type=text]').first().waitFor({state: 'visible', timeout: 3000}).then(() => true, () => false)) break;
    }
    step = 'reach the answer box';
    await page.locator('textarea, input[type=text]').first().waitFor({state: 'visible', timeout: T});
    await page.click('textarea, input[type=text]');
    await page.keyboard.type(ANSWER);
    await page.keyboard.press('Enter');
    step = 'reach the result card';
    await page.locator('#cardlayer.on #bk').waitFor({state: 'visible', timeout: T});
    await page.waitForTimeout(1500); // the reveal is instant under reduced motion; the verdict and meters settle
    await page.screenshot({path: join(shotsDir, `${label}-${view.w}-${room}-card.png`)});
    const tab = page.locator('#cardlayer .mn-tab');
    if (!(await tab.count())) { problems.push(`${tag}: no margin note tab on the result card`); await ctx.close(); continue; }
    await tab.click();
    // The note is fetched on first open; wait for it to leave the "Turning" line (or to say there is none).
    await page.waitForFunction(() => { const p = document.querySelector('#cardlayer .mn-page'); return p && !/Turning to the margin/.test(p.textContent); }, null, {timeout: T}).catch(() => problems.push(`${tag}: margin note stuck on "Turning"`));
    await page.waitForTimeout(500); // the sheet unfolds over .32 s
    const m = await page.evaluate(() => {
      const bk = document.querySelector('#cardlayer #bk'), mn = document.querySelector('#cardlayer .mn');
      const page = document.querySelector('#cardlayer .mn-page'), body = document.querySelector('#cardlayer .mn-body');
      const r = el => el.getBoundingClientRect();
      const b = r(bk), pg = r(page);
      const inside = [...page.querySelectorAll('p,li,small,em')].every(el => { const q = r(el); return q.left >= pg.left - 1 && q.right <= pg.right + 1; });
      const pageOverflow = [...page.querySelectorAll('p,li,small')].some(el => el.scrollWidth > el.clientWidth + 1);
      return {
        open: mn.classList.contains('open'), text: page.textContent.trim().slice(0, 240),
        rows: page.querySelectorAll('.mn-row').length, none: /No note on this one/.test(page.textContent),
        fitsViewport: b.bottom <= innerHeight + 1 && b.left >= -1 && b.right <= innerWidth + 1,
        docOverflowX: document.documentElement.scrollWidth > innerWidth + 1,
        bodyH: r(body).height, inside, pageOverflow,
        bodyScrollable: document.scrollingElement.scrollHeight > innerHeight + 1,
      };
    });
    await page.screenshot({path: join(shotsDir, `${label}-${view.w}-${room}-note.png`)});
    report.push({tag, ...m});
    if (!m.open) problems.push(`${tag}: the tab did not open the sheet`);
    if (!m.rows && !m.none) problems.push(`${tag}: the sheet shows neither a note nor "no note"`);
    if (!m.fitsViewport) problems.push(`${tag}: the result card runs off the viewport`);
    if (m.docOverflowX) problems.push(`${tag}: horizontal page overflow`);
    if (m.bodyScrollable) problems.push(`${tag}: the page scrolls vertically with the note open`);
    if (!m.inside) problems.push(`${tag}: note text sticks out of its sheet`);
    if (m.pageOverflow) problems.push(`${tag}: a note line is clipped`);
    // The note stays open on the next judged card once its verdict shows (the player has seen the meaning by then).
    await page.click('#cardlayer #go');
    await page.locator('textarea, input[type=text]').first().waitFor({state: 'visible', timeout: T});
    await page.click('textarea, input[type=text]');
    await page.keyboard.type(ANSWER);
    await page.keyboard.press('Enter');
    await page.locator('#cardlayer.on #bk').waitFor({state: 'visible', timeout: T});
    const kept = await page.waitForFunction(() => document.querySelector('#cardlayer #vd')?.classList.contains('on') && document.querySelector('#cardlayer .mn')?.classList.contains('open') && document.querySelector('#cardlayer .book')?.classList.contains('mn-on'), null, {timeout: T}).then(() => true, () => false);
    if (!kept) problems.push(`${tag}: the margin note did not stay open on the next card`);
  } catch (e) {
    problems.push(`${tag}: could not ${step}: ${e.message.split('\n').slice(0,12).join(' / ')}`);
  }
  await ctx.close();
}
browser.close(); server.close();
console.log(JSON.stringify(report, null, 1));
if (problems.length) { console.error(`word-notes-check: FAILED (${problems.length})\n - ` + problems.join('\n - ')); process.exit(1); }
console.log(`word-notes-check: ok (${ROOMS.length} rooms x ${VIEWS.map(v => v.w).join('/')}px, reduced motion)`);
