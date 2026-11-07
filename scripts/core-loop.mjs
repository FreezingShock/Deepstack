// Guard for the answer and result flow (run after `npm run build`), in a Daily run:
//  CL1: pressing Enter answers at once: the slip locks, says "Reading your answer" inside itself and keeps its height, synchronously, before the judge returns.
//  CL2: Enter, Space or a tap during the card reveal hurries it: the verdict, score and Next word focus land within ~300ms, the card stays open, and a second Enter goes on.
//  CL3: the card's Enter hint is hidden on phones and touch screens (375px) and shown on desktop (1280px), like the run screen's own hint.
//  CL4: a 300-character answer shows in full under "You wrote" (no two-line clamp, no ellipsis) at 375px and 1280px, and Next word stays reachable.
// Skips (exit 0) when no Chromium is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.
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
if (!chromium) { console.log('core-loop: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('core-loop: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const T = 15000;
const problems = [];

async function daily(w, h, motion) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: motion, serviceWorkers: 'block'});
  await ctx.addInitScript(m => { try { localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: m})); } catch {} }, motion === 'reduce' ? 'reduce' : 'system');
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(BLOCKED, r => r.abort());
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bPlay').first().waitFor({state: 'visible', timeout: T});
  await page.waitForTimeout(400);
  await page.locator('#bPlay').first().evaluate(el => el.click()); // the home plaque keeps idle motion, so click the element itself
  await page.locator('#stage .word').waitFor({state: 'visible', timeout: T});
  await page.locator('#ans').waitFor({state: 'visible', timeout: T});
  await page.waitForTimeout(900);
  return {ctx, page, errors};
}

// CL1: the press answers at once (checked synchronously inside the keydown, before any judge can return)
{
  const {ctx, page, errors} = await daily(375, 667, 'reduce');
  try {
    const h0 = await page.evaluate(() => document.querySelector('#fld').getBoundingClientRect().height);
    const r = await page.evaluate(() => {
      const ta = document.querySelector('#ans');
      ta.value = 'a short answer about the meaning';
      ta.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));
      const fld = document.querySelector('#fld');
      return {reading: document.querySelector('#reading')?.textContent || '', judging: !!fld && fld.classList.contains('judging'), locked: ta.readOnly};
    });
    const h1 = await page.evaluate(() => document.querySelector('#fld').getBoundingClientRect().height);
    if (Math.abs(h1 - h0) > 1) problems.push(`CL1: the slip changes height while judging (${Math.round(h0)}px to ${Math.round(h1)}px)`);
    if (r.reading !== 'Reading your answer…') problems.push(`CL1: no "Reading your answer" line on Enter (got ${JSON.stringify(r.reading)})`);
    if (!r.judging) problems.push('CL1: the answer slip does not hold (no judging class) while the judge reads');
    if (!r.locked) problems.push('CL1: the answer box stays editable while the judge reads');
    await page.waitForFunction(() => document.activeElement?.id === 'go', null, {timeout: 30000, polling: 'raf'});
    const after = await page.evaluate(() => ({reading: !!document.querySelector('#reading'), judging: document.querySelector('#fld')?.classList.contains('judging') ?? false}));
    if (after.reading || after.judging) problems.push('CL1: the reading line or judging class is left behind after the verdict');
    if (errors.length) problems.push('CL1: page error ' + errors[0]);
  } finally { await ctx.close(); }
}

// CL2 + CL3: hurry the reveal with Enter, then a second Enter goes on; the phone card hides its Enter hint
{
  const {ctx, page, errors} = await daily(375, 667, 'no-preference');
  try {
    await page.locator('#ans').fill('a short answer about the meaning');
    await page.locator('#ans').press('Enter');
    await page.waitForFunction(() => document.querySelector('#cardlayer')?.classList.contains('on'), null, {timeout: 30000, polling: 'raf'});
    const t0 = Date.now();
    await page.keyboard.press('Enter');
    try {
      await page.waitForFunction(() => document.activeElement?.id === 'go' && document.querySelector('#vd')?.classList.contains('on'), null, {timeout: 1500, polling: 'raf'});
      const ms = Date.now() - t0;
      if (ms > 300) problems.push(`CL2: the reveal took ${ms}ms to hurry (limit 300ms)`);
    } catch { problems.push('CL2: Enter during the card reveal did not hurry it (verdict and Next word focus not reached)'); }
    const st = await page.evaluate(() => {
      const cn = document.querySelector('#cn')?.textContent, bk = document.querySelector('#bk');
      return {open: document.querySelector('#cardlayer')?.classList.contains('on') ?? false, cn, bk: !!bk && bk.classList.contains('open'), kbd: getComputedStyle(document.querySelector('#go kbd')).display};
    });
    if (!st.open) problems.push('CL2: the card closed on the hurry press; it should stay open for one more Enter');
    if (!st.bk) problems.push('CL2: the cover did not open on hurry');
    if (st.cn === '0') problems.push('CL2: the score still reads 0 after hurry');
    if (st.kbd !== 'none') problems.push(`CL3: the card Enter hint is shown on a 375px phone (display ${st.kbd})`);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('#cardlayer')?.classList.contains('on'), null, {timeout: 10000, polling: 'raf'}).catch(() => problems.push('CL2: a second Enter did not move on from the card'));
    if (errors.length) problems.push('CL2: page error ' + errors[0]);
  } finally { await ctx.close(); }
}
{
  const {ctx, page} = await daily(1280, 800, 'no-preference');
  try {
    await page.locator('#ans').fill('a short answer about the meaning');
    await page.locator('#ans').press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'go', null, {timeout: 30000, polling: 'raf'});
    const kbd = await page.evaluate(() => getComputedStyle(document.querySelector('#go kbd')).display);
    if (kbd === 'none') problems.push('CL3: the card Enter hint is hidden on desktop (should show)');
  } finally { await ctx.close(); }
}

// CL4: a long answer is shown whole under "You wrote"; the card page scrolls rather than clipping it
const LONG = 'a long and careful explanation that tries to cover several of the concepts behind this word, including its usual sense, a common example, and what it is not, so the card has more to show while the user reads the verdict back and checks it against the definition printed above it on the page today';
for (const [w, h] of [[375, 667], [1280, 800]]) {
  const {ctx, page, errors} = await daily(w, h, 'reduce');
  try {
    await page.locator('#ans').fill(LONG.slice(0, 300));
    await page.locator('#ans').press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'go', null, {timeout: 30000, polling: 'raf'});
    const r = await page.evaluate(() => {
      const el = document.querySelector('#bk .page .wrote');
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {text: el.textContent, clamp: cs.webkitLineClamp, clipped: el.scrollHeight > el.clientHeight + 1, ellipsis: /\u2026|\.\.$/.test(el.textContent), goReach: (() => { const pg = document.querySelector('#bk .page'); const g = document.querySelector('#go'); pg.scrollTop = pg.scrollHeight; return g.getBoundingClientRect().bottom <= innerHeight + 1; })()};
    });
    if (!r) problems.push(`CL4 (${w}px): no "You wrote" line on the card`);
    else {
      if (!r.text.includes(LONG.slice(0, 300))) problems.push(`CL4 (${w}px): "You wrote" does not show the whole answer`);
      if (r.clamp !== 'none') problems.push(`CL4 (${w}px): "You wrote" is still clamped (${r.clamp})`);
      if (r.clipped) problems.push(`CL4 (${w}px): "You wrote" clips its text`);
      if (!r.goReach) problems.push(`CL4 (${w}px): Next word is not reachable after scrolling the card`);
    }
    if (errors.length) problems.push(`CL4 (${w}px): page error ` + errors[0]);
  } finally { await ctx.close(); }
}

await browser.close();
server.close();
if (problems.length) { console.error('core-loop: FAILED\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('core-loop: ok (CL1 answer feedback, CL2 hurry the reveal, CL3 phone hint, CL4 full answer)');
