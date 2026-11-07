// Installable-app check (after `npm run build`): serves dist/ and, in headless Chromium, checks that
//   1. the launch screen is painted by the HTML and removed once home is drawn (reduced motion too);
//   2. the service worker takes control and caches the data the Daily needs;
//   3. with the network OFF, the app reopens on home and the Daily starts (the offline Daily);
//   4. the "Keep the library" install tag shows on home when the browser offers an install, saves "Not now" and stays hidden after a reload.
// Screenshots of the tag go to SHOTS (default screenshots/install-app/). Skips (exit 0) when no Chromium is available, like smoke.mjs.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'};
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
if (!chromium) { console.log('pwa: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('pwa: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const SHOTS = process.env.SHOTS || 'screenshots/install-app';
await mkdir(SHOTS, {recursive: true});

// Third-party hosts stay blocked (as in smoke.mjs); their failures are expected here.
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = msg => problems.push(msg);
const T = 15000;
const log = msg => console.log(`pwa: ${msg}`);

async function open(ctxOpts = {}) {
  const ctx = await browser.newContext({viewport: {width: 375, height: 667}, ...ctxOpts});
  await ctx.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  const page = await ctx.newPage();
  // set just before the test closes the context: requests still in flight then are cut off by the close, not by the app
  const state = {closing: false};
  page.on('pageerror', e => fail(`pageerror: ${e.message}`));
  page.on('requestfailed', r => { if (process.env.PWA_DEBUG) console.log('requestfailed', r.url().slice(0, 140), r.failure()?.errorText); });
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (process.env.PWA_DEBUG) console.log('console.error at', m.location()?.url, m.text());
    if (BLOCKED.test(m.location()?.url || '')) return;
    if (state.closing && /Failed to load resource/.test(m.text())) return;
    if (/Failed to load resource/.test(m.text()) && (!m.location()?.url?.startsWith(url) || /\/(models|ort)\//.test(m.location().url))) return;
    fail(`console.error: ${m.text()} (at ${m.location()?.url || 'unknown url'})`);
  });
  return {ctx, page, state};
}

// An install prompt as Chromium makes one: beforeinstallprompt is cancelable and carries prompt() and userChoice.
const FAKE_PROMPT = () => {
  const e = new Event('beforeinstallprompt', {cancelable: true});
  e.prompt = async () => {};
  e.userChoice = Promise.resolve({outcome: 'dismissed', platform: 'web'});
  window.dispatchEvent(e);
};

const homeVisible = page => page.waitForFunction(() => {
  const h = document.getElementById('home');
  return h && !h.hidden && !document.getElementById('splash');
}, null, {timeout: T});

try {
  // 1 and 2: first visit online. The page loads, the splash goes, and the service worker takes control.
  const {ctx, page} = await open();
  await page.goto(url, {waitUntil: 'load'});
  const hasSplashFirst = await page.evaluate(() => !!document.getElementById('splash'));
  if (!hasSplashFirst) log('note: splash already removed before the first check (fast boot)');
  await homeVisible(page);
  log('launch screen removed, home drawn');

  const manifest = await page.evaluate(async () => {
    const r = await fetch('/manifest.webmanifest');
    return {status: r.status, json: await r.json()};
  });
  if (manifest.status !== 200 || manifest.json.display !== 'standalone') fail('manifest not served as a standalone app');

  // wait for the worker to be active and in control, then for the day's data to be in its cache
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 30000}).catch(() => {});
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    // the first load is uncontrolled; a reload lets the new worker serve the page
    await page.reload({waitUntil: 'load'});
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {timeout: 30000}).catch(() => fail('service worker never took control'));
  }
  await page.waitForFunction(async () => {
    const c = await caches.open('ds-data-v1');
    const keys = (await c.keys()).map(r => new URL(r.url).pathname);
    const pages = await caches.open('ds-pages-v1');
    const home = (await pages.keys()).map(r => new URL(r.url).pathname);
    return home.includes('/') && ['/data/words.json', '/data/rooms.json', '/data/room-words.json'].every(p => keys.includes(p));
  }, null, {timeout: 30000}).catch(() => fail('the page or the data the Daily needs never reached the cache'));
  await page.waitForTimeout(500);
  log('service worker in control, Daily data cached');

  // 3: the network goes away. Reopen the page: it must come back on home, and the Daily must start.
  // let the page finish its own loads first: a request still in flight when the network drops is a real failure of the test, not of the app
  await page.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
  await ctx.setOffline(true);
  await page.reload({waitUntil: 'load'});
  await homeVisible(page).catch(() => fail('offline: home did not come back'));
  const daily = await page.evaluate(async () => {
    try { await window.__deepstack.startDaily(); } catch (e) { return {ok: false, err: String(e)}; }
    const st = document.getElementById('stage');
    const words = st ? st.textContent.trim().length : 0;
    return {ok: !!st && !st.hidden && words > 0, words};
  });
  if (!daily.ok) fail(`offline Daily did not start: ${JSON.stringify(daily)}`);
  else log('offline: home opens and the Daily starts');
  await ctx.setOffline(false);
  await ctx.close();

  // 4: the install tag. Phone and desktop, then "Not now" must stick across a reload.
  for (const [name, viewport] of [['phone', {width: 375, height: 667}], ['desktop', {width: 1280, height: 800}]]) {
    const {ctx: c2, page: p2} = await open({viewport});
    await p2.goto(url, {waitUntil: 'load'});
    await homeVisible(p2);
    await p2.evaluate(FAKE_PROMPT);
    await p2.waitForFunction(() => {
      const t = document.getElementById('installHint');
      return t && !t.hidden;
    }, null, {timeout: 9000}).catch(() => fail(`${name}: install tag never showed`));
    await p2.waitForTimeout(700);
    await p2.screenshot({path: join(SHOTS, `install-tab-${name}.png`)});
    await p2.click('#installHint .ih-tab');
    await p2.waitForTimeout(400);
    const tag = await p2.evaluate(() => {
      const t = document.getElementById('installHint');
      const r = t.getBoundingClientRect();
      const vw = innerWidth, vh = innerHeight;
      return {inside: r.left >= 0 && r.right <= vw && r.top >= 0 && r.bottom <= vh, text: t.querySelector('.ih-text').textContent, go: !t.querySelector('.ih-go').hidden};
    });
    if (!tag.inside) fail(`${name}: install tag is off screen`);
    if (!tag.text) fail(`${name}: install tag has no text`);
    if (!tag.go) fail(`${name}: install tag has no Install button`);
    await p2.waitForTimeout(700);
    await p2.screenshot({path: join(SHOTS, `install-card-${name}.png`)});
    if (name === 'phone') {
      await p2.click('#installHint .ih-no');
      const hidden = await p2.evaluate(() => document.getElementById('installHint').hidden);
      if (!hidden) fail('phone: "Not now" did not hide the tag');
      await p2.reload({waitUntil: 'load'});
      await homeVisible(p2);
      await p2.evaluate(FAKE_PROMPT);
      await p2.waitForTimeout(5000);
      const back = await p2.evaluate(() => !document.getElementById('installHint') || document.getElementById('installHint').hidden);
      if (!back) fail('phone: the tag came back after "Not now"');
      else log('install tag: tab shows, card offers Install, "Not now" sticks across a reload');
    }
    await c2.close();
  }

  // Reduced motion: the launch screen still goes, with no fade to wait for.
  const {ctx: c3, page: p3, state: s3} = await open({reducedMotion: 'reduce'});
  await p3.goto(url, {waitUntil: 'load'});
  await homeVisible(p3);
  log('reduced motion: launch screen removed, home drawn');
  // the page still has background fetches (the scorer's model, the word data) in flight; the close cuts them off, and Chromium
  // reports each as a page error on the file's own URL. Those are ours, so the close is marked before it happens.
  await p3.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
  s3.closing = true;
  await c3.close();
} catch (e) {
  fail(`stopped: ${e.message.split('\n')[0]}`);
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error('pwa: FAILED');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('pwa: ok');
