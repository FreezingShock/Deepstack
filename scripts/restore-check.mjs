// Restoration bench guard (CI): the home entry never covers a home button, the bench opens with the room's Daily page, a
// faded entry comes back in ink from its own definition, a smudged word comes back from a typed word, a left entry stays
// damaged, the Daily pins to the wall with its Daily mark, a page with every entry in ink earns the wax seal (toast), and
// nothing clips or scrolls sideways at 375 or 1280 with reduced motion on.
// Serves dist/ on its own port (run `npm run build` first). Skips (exit 0) when no Chromium is available.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
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
if (!chromium) { console.log('restore: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('restore: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

// Fonts and the embedding model come from third parties; failed-resource lines for them are expected.
const BLOCKED_HOSTS = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const BLOCKED = /ERR_TUNNEL|Failed to load resource|fonts\.g|huggingface|hf\.co|jsdelivr|WASM|wasm|no available backend|Judge|judge/;
const problems = [];
const fail = msg => { problems.push(msg); };
const T = 20000;
const VIEWS = [{name: '375', width: 375, height: 667, dpr: 2}, {name: '1280', width: 1280, height: 800, dpr: 1}];

async function open(view) {
  const ctx = await browser.newContext({viewport: {width: view.width, height: view.height}, deviceScaleFactor: view.dpr, reducedMotion: 'reduce', serviceWorkers: 'block'});
  const page = await ctx.newPage();
  await page.route(BLOCKED_HOSTS, r => (r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort()));
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !BLOCKED.test(m.text())) errs.push(m.text()); });
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForSelector('.rs-entry', {timeout: T});
  await page.waitForTimeout(600);
  return {ctx, page, errs};
}

const truth = page => page.evaluate(() => JSON.parse(localStorage.getItem('deepstack.v1')).restore.cur.hall.passages);

for (const view of VIEWS) {
  const tag = view.name;
  const {ctx, page, errs} = await open(view);
  // 1. the entry sits clear of every home button
  const overlap = await page.evaluate(() => {
    const e = document.querySelector('.rs-entry').getBoundingClientRect(), hit = [];
    document.querySelectorAll('#home button, #home [role=button], #home a').forEach(b => {
      const r = b.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(b).visibility === 'hidden') return;
      if (r.left < e.right && r.right > e.left && r.top < e.bottom && r.bottom > e.top) hit.push(b.id || b.className || b.tagName);
    });
    return hit;
  });
  if (overlap.length) fail(`${tag}: the bench entry covers ${overlap.slice(0, 3).join(', ')}`);
  await page.click('.rs-entry');
  await page.waitForSelector('.rs-bench.on', {timeout: 5000}).catch(() => fail(`${tag}: the bench did not open`));
  await page.waitForSelector('.rs-p', {timeout: T}).catch(() => fail(`${tag}: no page printed`));
  const ps = await truth(page);
  const f = ps.findIndex(p => p.kind === 'faded'), s = ps.findIndex(p => p.kind === 'smudged');
  // 1b. the first page of the day is the room's Daily
  if (!(await page.textContent('.rs-no')).includes('Daily')) fail(`${tag}: the first page is not named Daily`);
  // 2. a faded entry comes back from its own definition
  await page.fill(`.rs-p[data-i="${f}"] textarea`, ps[f].def);
  await page.click(`.rs-p[data-i="${f}"] button[type=submit]`);
  await page.waitForFunction(i => document.querySelector(`.rs-p[data-i="${i}"]`)?.classList.contains('restored'), f, {timeout: T}).catch(() => fail(`${tag}: faded entry did not come back in ink`));
  // 3. a smudged word, wrong first and then right
  await page.fill(`.rs-p[data-i="${s}"] input`, 'nope');
  await page.click(`.rs-p[data-i="${s}"] button[type=submit]`);
  await page.waitForTimeout(300);
  if (!(await page.textContent(`.rs-p[data-i="${s}"] .rs-msg`)).includes('not the word')) fail(`${tag}: a wrong word was not refused`);
  await page.fill(`.rs-p[data-i="${s}"] input`, ps[s].w);
  await page.click(`.rs-p[data-i="${s}"] button[type=submit]`);
  await page.waitForFunction(i => document.querySelector(`.rs-p[data-i="${i}"]`)?.classList.contains('restored'), s, {timeout: T}).catch(() => fail(`${tag}: smudged word did not come back`));
  // 4. the last entry is left damaged: the page completes and pins to the wall
  const rest = [0, 1, 2].find(i => i !== f && i !== s);
  await page.click(`.rs-p[data-i="${rest}"] button[data-act=leave]`);
  await page.waitForSelector('.rs-sheet.done', {timeout: T}).catch(() => fail(`${tag}: page did not complete`));
  if (!(await page.textContent('.rs-foot')).includes('pinned to the wall')) fail(`${tag}: no pinned note`);
  await page.waitForTimeout(400);
  // 5. the wall shows the frame, marked Daily; nothing clips or scrolls sideways
  await page.click('[data-act=wall]');
  await page.waitForSelector('.rs-frame', {timeout: 5000}).catch(() => fail(`${tag}: the wall has no frame`));
  if (!(await page.$('.rs-frame.daily .rs-tag'))) fail(`${tag}: the Daily frame has no Daily mark`);
  const geo = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('.rs-bench .rs-head,.rs-bench .rs-def,.rs-bench .rs-word,.rs-bench .rs-msg,.rs-bench .rs-label,.rs-bench .rs-btn,.rs-bench .rs-title h2,.rs-bench .rs-lost,.rs-bench .rs-line,.rs-bench figcaption').forEach(el => {
      if (el.clientWidth && el.scrollWidth > el.clientWidth + 1) bad.push(el.className || el.tagName);
    });
    return {bad: bad.slice(0, 4), sideways: document.documentElement.scrollWidth > innerWidth};
  });
  if (geo.bad.length) fail(`${tag}: clipped text in ${geo.bad.join(', ')}`);
  if (geo.sideways) fail(`${tag}: sideways scroll`);
  // 6. the next page is a normal one; restoring every entry seals it: the wax seal toast shows and the page joins the wall
  await page.click('[data-act=bench]');
  await page.click('[data-act=next]');
  await page.waitForSelector('.rs-p', {timeout: T});
  if ((await page.textContent('.rs-no')).includes('Daily')) fail(`${tag}: a second page the same day is named Daily`);
  const ps2 = await truth(page);
  for (let i = 0; i < ps2.length; i++) {
    if (ps2[i].kind === 'faded') await page.fill(`.rs-p[data-i="${i}"] textarea`, ps2[i].def);
    else await page.fill(`.rs-p[data-i="${i}"] input`, ps2[i].w);
    await page.click(`.rs-p[data-i="${i}"] button[type=submit]`);
    await page.waitForFunction(i => document.querySelector(`.rs-p[data-i="${i}"]`)?.classList.contains('restored'), i, {timeout: T}).catch(() => fail(`${tag}: entry ${i} of the second page did not come back`));
  }
  await page.waitForFunction(() => /Wax seal/.test(document.getElementById('stamptoast')?.textContent || '') && document.getElementById('stamptoast').classList.contains('on'), null, {timeout: 5000}).catch(() => fail(`${tag}: no wax seal toast for a full page`));
  // the toast drops over the open bench (a toast ignores pointer events, so compare stacking order instead)
  const stacked = await page.evaluate(() => +getComputedStyle(document.getElementById('stamptoast')).zIndex > +getComputedStyle(document.querySelector('.rs-bench')).zIndex);
  if (!stacked) fail(`${tag}: the wax seal toast is under the open bench`);
  // 7. closing puts the count back on the entry: two pages on the wall
  await page.click('[data-act=close]');
  await page.waitForFunction(() => document.querySelector('.rs-entry')?.textContent.includes('2 on the wall'), null, {timeout: 5000}).catch(() => fail(`${tag}: the entry does not show the wall count`));
  if (errs.length) fail(`${tag}: page errors: ${errs.slice(0, 3).join('; ')}`);
  await ctx.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.log('restore: FAILED');
  for (const p of problems) console.log(' - ' + p);
  process.exit(1);
}
console.log('restore: ok');
