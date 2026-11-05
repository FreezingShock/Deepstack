// Headless smoke test: serve dist/ and make sure the app boots without page errors.
// Skips (exit 0) if no Chromium is available so local runs without a browser still work.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(root, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = await import('playwright')); }
catch { try { ({chromium} = (await import('node:module')).createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('smoke: playwright not available, skipping'); server.close(); process.exit(0); }

let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('smoke: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

// Fonts and the embedding model come from third parties; keep CI offline-safe and fast. A blocked model makes the
// app use its lexical judge, which is deterministic. Failed-resource console lines for these hosts are expected.
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
// Optional same-origin assets: self-hosted model/runtime may legitimately be absent (fonts are committed, so a missing font fails).
const OPTIONAL = /\/(models|ort)\//;
const problems = [];
const fail = msg => { problems.push(msg); };
const T = 15000;

async function newPage() {
  const ctx = await browser.newContext({viewport: {width: 1280, height: 800}});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => fail(`pageerror: ${e.message}${e.stack ? ' @ ' + e.stack.split('\n')[1]?.trim() : ''}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (BLOCKED.test(m.location()?.url || '')) return;
    if (/Failed to load resource/.test(m.text()) && (!m.location()?.url?.startsWith(url) || OPTIONAL.test(m.location().url))) return;
    fail(`console.error: ${m.text()}`);
  });
  page.on('requestfailed', r => { if (r.url().startsWith(url) && !OPTIONAL.test(r.url())) fail(`request failed: ${r.url()}`); });
  return page;
}

// A real click must land on the element itself (not an overlay) and the element must not be dimmed or inert.
async function realClick(page, sel, what = sel) {
  const loc = page.locator(sel).first();
  try { await loc.waitFor({state: 'visible', timeout: T}); } catch { fail(`${what}: not visible`); throw new Error('stop'); }
  const probe = () => loc.evaluate(el => {
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    if (!hit || !(el === hit || el.contains(hit))) return `covered by ${hit ? hit.tagName + (hit.id ? '#' + hit.id : '.' + hit.className) : 'nothing'}`;
    let op = 1; for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); op *= +cs.opacity; }
    if (getComputedStyle(el).pointerEvents === 'none') return 'pointer-events: none';
    if (op < 0.5) return `dimmed (opacity ${op.toFixed(2)})`;
    if (el.disabled) return 'disabled';
    return '';
  });
  // transitions (veils, fades) may cover things briefly; only a state that never clears is a failure
  let bad = await probe();
  for (let i = 0; bad && i < 20; i++) { await page.waitForTimeout(250); bad = await probe(); }
  if (bad) { fail(`${what}: not clickable, ${bad}`); throw new Error('stop'); }
  try { await loc.click({timeout: T}); } catch (e) { fail(`${what}: click failed, ${e.message.split('\n')[0]}`); throw new Error('stop'); }
}

const step = async (name, fn) => {
  const t0 = Date.now();
  try { await fn(); console.log(`smoke: ${name} (${Date.now() - t0} ms)`); }
  catch (e) { if (e.message !== 'stop') fail(`${name}: ${e.message.split('\n')[0]}`); }
};

const page = await newPage();
await page.goto(url, {waitUntil: 'load'});
await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T}).catch(() => fail('home never rendered'));
const bodyLen = await page.evaluate(() => document.body.innerText.length + document.querySelectorAll('canvas').length);
if (!bodyLen) fail('page rendered nothing');

// 1. every menu book opens onto its pages and closes again, leaving the home screen usable
for (const [id, name] of [['bDaily', 'Daily'], ['bUnl', 'Unlimited'], ['bPrac', 'Practice'], ['bAll', 'Shelf'], ['bSets', 'Sets'], ['bStats', 'Stats']]) {
  await step(`open and close ${name}`, async () => {
    await realClick(page, `#${id}`, `${name} book`);
    const dlg = page.locator('[role=dialog].intro').first();
    try { await dlg.waitFor({state: 'visible', timeout: T}); } catch { fail(`${name}: book never opened`); throw new Error('stop'); }
    if (!(await dlg.innerText()).trim()) fail(`${name}: book opened blank`);
    await page.keyboard.press('Escape');
    try { await page.locator('[role=dialog].intro').waitFor({state: 'detached', timeout: T}); } catch { fail(`${name}: book did not close`); throw new Error('stop'); }
    await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => fail(`${name}: home stayed locked after closing`));
  });
}

// 1b. The Daily book opens on its calendar; tapping a day turns to that day, and the page is set in the handwriting face
await step('daily calendar selects a day', async () => {
  await realClick(page, '#bDaily', 'Daily book');
  const dlg = page.locator('[role=dialog].intro').first();
  await dlg.waitFor({state: 'visible', timeout: T}).catch(() => { fail('Daily book never opened'); throw new Error('stop'); });
  const day = dlg.locator('button.cal-d[data-spread]').first();
  await day.waitFor({state: 'visible', timeout: T}).catch(() => { fail('Daily calendar has no selectable day'); throw new Error('stop'); });
  const fam = await day.evaluate(el => getComputedStyle(el).fontFamily);
  if (!/Fuzzy Bubbles/.test(fam)) fail(`Daily calendar not in the handwriting face: ${fam}`);
  const asked = await page.evaluate(() => [...document.fonts].some(f => /Fuzzy Bubbles/.test(f.family)));
  if (!asked) fail('Fuzzy Bubbles face is not declared in the document (self-hosted googleFonts.css)');
  await day.click();
  await dlg.locator('.dly-words').first().waitFor({state: 'visible', timeout: T}).catch(() => fail('tapping a calendar day did not open its entry'));
  await page.keyboard.press('Escape');
  await page.locator('[role=dialog].intro').waitFor({state: 'detached', timeout: T}).catch(() => fail('Daily book did not close'));
  await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => {});
});

// 2. Descend, play one word through the judge to the result card, then on to word 2
await step('descend and play one word', async () => {
  if (await page.locator('#bPlay').count() === 0) { console.log('smoke: daily already played, skipping descend'); return; }
  await realClick(page, '#bPlay', 'Descend');
  await page.locator('#stage .word').waitFor({state: 'visible', timeout: T}).catch(() => { fail('Descend: no word appeared'); throw new Error('stop'); });
  await realClick(page, '#ans', 'answer box');
  await page.keyboard.type('a thing that is the opposite of what you would expect to find here');
  await page.keyboard.press('Enter');
  // let the descent animation be skipped (Space) until the result card is up
  const card = page.locator('#cardlayer:not([hidden])');
  for (let i = 0; i < 40 && !(await card.count()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(250); }
  if (!(await card.count())) { fail('no result card after answering'); throw new Error('stop'); }
  if (!(await page.locator('#cardlayer').innerText()).trim()) fail('result card was blank');
  // the reveal animation owns the card until the verdict shows; closing it earlier is a separate race
  await page.locator('#vd.on').waitFor({state: 'attached', timeout: T}).catch(() => fail('result verdict never revealed'));
  await realClick(page, '#go', 'result card continue button');
  await page.locator('#stage .wlabel', {hasText: 'Word 2'}).waitFor({state: 'visible', timeout: T}).catch(() => fail('did not reach word 2'));
});

// 2b. Enter pressed the moment the card appears (mid-reveal) must close it cleanly and move on, not throw
await step('close result card mid-reveal', async () => {
  if (await page.locator('#stage .wlabel', {hasText: 'Word 2'}).count() === 0) return;
  await realClick(page, '#ans', 'answer box');
  await page.keyboard.type('something that is rather small and quiet');
  await page.keyboard.press('Enter');
  const card = page.locator('#cardlayer:not([hidden])');
  for (let i = 0; i < 40 && !(await card.count()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(250); }
  if (!(await card.count())) { fail('no result card after answering word 2'); throw new Error('stop'); }
  await page.keyboard.press('Enter');
  await page.locator('#stage .wlabel', {hasText: 'Word 3'}).waitFor({state: 'visible', timeout: T}).catch(() => fail('did not reach word 3 after closing the card early'));
  await page.waitForTimeout(1500); // let the abandoned reveal timers fire; any throw lands in pageerror
});

await step('home returns', async () => {
  await realClick(page, '#mark', 'Deepstack home mark');
});

// Leaving mid-run must not hand out a fresh Daily: starting again resumes at the next unanswered word
await step('resume daily after leaving mid-run', async () => {
  if (await page.locator('#bPlay').count() === 0) return;
  await realClick(page, '#bPlay', 'Descend');
  await page.locator('#stage .wlabel', {hasText: 'Word 3'}).waitFor({state: 'visible', timeout: T}).catch(() => fail('Daily did not resume at word 3'));
});

// 3. Unlimited: a well-answered first word must descend to a finite depth (a missing combo field once made it NaN)
await step('unlimited descends to a finite depth', async () => {
  await realClick(page, '#mark', 'Deepstack home mark');
  await realClick(page, '#bUnl', 'Unlimited book');
  await realClick(page, '[role=dialog].intro button.bs-primary:not([data-act])', 'Unlimited primary action');
  await page.locator('#stage .word').waitFor({state: 'visible', timeout: T}).catch(() => { fail('Unlimited: no word appeared'); throw new Error('stop'); });
  const word = await page.locator('#stage .word').getAttribute('aria-label');
  const data = JSON.parse(await readFile(join(root, 'data/words.json'), 'utf8'));
  const entry = (data.words || []).find(w => w.w === word);
  const answer = entry ? entry.def : 'a thing that is the opposite of what you would expect to find here';
  await realClick(page, '#ans', 'answer box');
  await page.keyboard.type(answer.slice(0, 280));
  await page.keyboard.press('Enter');
  const card = page.locator('#cardlayer:not([hidden])');
  for (let i = 0; i < 40 && !(await card.count()); i++) {
    const d = await page.locator('#dnum').innerText().catch(() => '0');
    if (!/^\d+$/.test(d.replace(/[,\s]/g, ''))) fail(`Unlimited: depth readout is "${d}"`);
    await page.keyboard.press('Space'); await page.waitForTimeout(250);
  }
  if (!(await card.count())) { fail('Unlimited: no result card after answering'); throw new Error('stop'); }
  const depth = await page.locator('#dnum').innerText();
  if (!/^\d+$/.test(depth.replace(/[,\s]/g, ''))) fail(`Unlimited: depth after descent is "${depth}"`);
  const filled = await page.evaluate(() => JSON.parse(localStorage.getItem('deepstack.v1')).shelf.every(b => Number.isFinite(b.rows) && b.rows > 0));
  if (!filled) fail('Unlimited: saved book has a non-finite row count');
});

await browser.close(); server.close();
if (problems.length) { console.error('smoke: FAILED\n - ' + [...new Set(problems)].join('\n - ')); process.exit(1); }
console.log('smoke: ok');
