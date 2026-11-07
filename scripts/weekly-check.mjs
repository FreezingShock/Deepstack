// Weekly themed challenge check: serves dist/, then for every room in the ring (Reading Room and the six topic rooms) on a
// phone and a desktop view: opens the Daily book, checks the cover entry and the two weekly leaves for overflow, and saves a
// screenshot. In the Reading Room it also plays today's themed word, checks that a half-written answer comes back after a reload,
// and checks the save. Fails on page errors, a cut-off cover
// or leaf, or a missing weekly section. Screenshots go to WEEKLY_SHOTS (default: screenshots/weekly/after).
// Usage: npm run build && CHROMIUM_PATH=... node scripts/weekly-check.mjs   (skips with a message when no browser is found)
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg'};
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
if (!chromium) { console.log('weekly-check: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('weekly-check: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const SHOTS = process.env.WEEKLY_SHOTS || 'screenshots/weekly/after';
await mkdir(`${SHOTS}/rooms`, {recursive: true});
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const OPTIONAL = /\/(models|ort)\//;
const problems = [];
const fail = m => problems.push(m);
const T = 15000;
// The ring of rooms, in side-door order (core/rooms.js).
const RING = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];

const VIEWS = [
  {name: '375', viewport: {width: 375, height: 667}, scale: 2, mobile: true},
  {name: '1280', viewport: {width: 1280, height: 800}, scale: 2, mobile: false},
];

// The weekly leaves must hold their text: no cut-off page and no sideways scroll.
async function checkLeaves(page, tag, label) {
  const leaves = page.locator('.dly.wk');
  const n = await leaves.count();
  if (n < 2) fail(tag(`${label}: expected two weekly leaves, found ${n}`));
  for (let i = 0; i < n; i++) {
    const over = await leaves.nth(i).evaluate(el => {
      const pg = el.closest('.pg-in') || el.parentElement;
      return {tall: pg.scrollHeight > pg.clientHeight + 1, wide: pg.scrollWidth > pg.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1, h: [pg.scrollHeight, pg.clientHeight]};
    });
    if (over.tall || over.wide) fail(tag(`${label}: weekly leaf ${i + 1} overflows: ${JSON.stringify(over)}`));
  }
}

// Opens the Daily book, enters the weekly leaves through the cover, and checks them. Leaves the book open.
async function openWeeklyLeaves(page, tag, label, shot) {
  await page.locator('#bDaily').first().click({timeout: T}).catch(() => fail(tag(`${label}: Daily book not clickable`)));
  const hasCover = await page.locator('.wk-cover').first().waitFor({state: 'attached', timeout: T}).then(() => true, () => false);
  if (!hasCover) { fail(tag(`${label}: Daily book cover has no weekly section`)); return; }
  await page.waitForTimeout(800);
  const cover = await page.locator('.dly').first().evaluate(el => ({tall: el.scrollHeight > el.clientHeight + 1, h: [el.scrollHeight, el.clientHeight]})).catch(() => null);
  if (cover && cover.tall) fail(tag(`${label}: Daily cover is cut off: ${JSON.stringify(cover)}`));
  if (shot) await page.screenshot({path: shot.replace(/\.png$/, '-cover.png')});
  await page.locator('.wk-cover .dly-go').first().click({timeout: T}).catch(() => fail(tag(`${label}: cover entry not clickable`)));
  await page.waitForTimeout(1000);
  await checkLeaves(page, tag, label);
  if (shot) await page.screenshot({path: shot});
}

async function run(view) {
  const ctx = await browser.newContext({viewport: view.viewport, deviceScaleFactor: view.scale, isMobile: view.mobile, reducedMotion: 'reduce', hasTouch: view.mobile});
  const page = await ctx.newPage();
  const tag = m => `[${view.name}] ${m}`;
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => fail(tag(`pageerror: ${e.message}`)));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (BLOCKED.test(m.location()?.url || '')) return;
    if (/Failed to load resource/.test(m.text()) && (!m.location()?.url?.startsWith(url) || OPTIONAL.test(m.location().url))) return;
    fail(tag(`console.error: ${m.text()}`));
  });
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bDaily').first().waitFor({state: 'visible', timeout: T}).catch(() => { fail(tag('home never rendered')); throw new Error('stop'); });

  // 1. Reading Room: the cover entry and leaves, then play today's themed word and check the save.
  await openWeeklyLeaves(page, tag, 'Reading Room', `${SHOTS}/leaf-${view.name}.png`);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(3500); // the first-time tooltip sits over the book for a few seconds
  const btn = page.locator('.dly.wk [data-act=weekly]').first();
  await btn.click({timeout: T}).catch(() => fail(tag('weekly button not clickable')));
  const ans = page.locator('#ans');
  await ans.waitFor({state: 'visible', timeout: T}).catch(() => { fail(tag('weekly run never showed an answer slip')); throw new Error('stop'); });
  const label = await page.locator('.wlabel').first().textContent();
  if (!/ · (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/.test(label || '')) fail(tag(`weekly run label is "${label}"`));
  await page.waitForTimeout(700);
  await page.screenshot({path: `${SHOTS}/run-${view.name}.png`});
  // WK3: a half-written answer survives a reload. Type part of it, reload, reopen the weekly word and check the text is back.
  const PART = 'A small room of old';
  await ans.fill(PART);
  await page.waitForTimeout(700);
  await page.reload({waitUntil: 'load'});
  await page.locator('#bDaily').first().waitFor({state: 'visible', timeout: T}).catch(() => { fail(tag('home never rendered after reload')); throw new Error('stop'); });
  await openWeeklyLeaves(page, tag, 'Reading Room after reload', null);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(3500);
  const resume = page.locator('.dly.wk [data-act=weekly]').first();
  const resumeLabel = await resume.textContent({timeout: T}).catch(() => '');
  if (!/Continue/.test(resumeLabel || '')) fail(tag(`weekly button after reload says "${resumeLabel}", expected "Continue"`));
  await resume.click({timeout: T}).catch(() => fail(tag('weekly button not clickable after reload')));
  await ans.waitFor({state: 'visible', timeout: T}).catch(() => { fail(tag('weekly word did not come back after reload')); throw new Error('stop'); });
  await page.waitForTimeout(700);
  const restored = await ans.inputValue().catch(() => '');
  if (restored !== PART) fail(tag(`answer after reload is "${restored}", expected "${PART}"`));
  await page.screenshot({path: `${SHOTS}/resume-${view.name}.png`});
  await ans.fill('A small room of old stories, each one shelved by the people who kept them.');
  await ans.press('Enter');
  const go = page.locator('#go');
  await go.waitFor({state: 'visible', timeout: 30000}).catch(() => fail(tag('weekly answer never reached the card')));
  await page.waitForTimeout(600);
  await page.screenshot({path: `${SHOTS}/card-${view.name}.png`});
  await go.click().catch(() => fail(tag('card button not clickable')));
  await page.waitForTimeout(2500);
  // The run is one word: its last card leads to the result screen, whose "up" button returns to the library.
  await page.locator('#up').first().click({timeout: T}).catch(() => fail(tag('result screen has no way back to the library')));
  await page.waitForTimeout(3500);
  const saved = await page.evaluate(() => {
    try { const S = JSON.parse(localStorage.getItem('deepstack.v1') || '{}'); return {weekly: S.weekly || null, daily: Object.keys(S.daily || {}).length, dailyRun: !!S.dailyRun}; }
    catch (e) { return {error: String(e)}; }
  });
  const days = saved.weekly ? Object.values(saved.weekly).flatMap(w => Object.values(w.days || {})) : [];
  if (days.length !== 1 || !days[0].answer) fail(tag(`save has ${days.length} weekly days, expected 1: ${JSON.stringify(saved).slice(0, 200)}`));
  if (saved.dailyRun) fail(tag('weekly run wrote the Daily resume field'));
  if (saved.daily !== 0) fail(tag('weekly run counted as a Daily'));
  await page.screenshot({path: `${SHOTS}/result-${view.name}.png`});

  // 2. Every room: walk the ring (desktop side doors; the phone reaches rooms through the Rooms book) and check each room's weekly leaves.
  for (const id of RING) {
    if (id !== 'hall') {
      if (!view.mobile) {
        await page.locator('#rm-doors .rm-next').first().click({timeout: T}).catch(() => fail(tag(`no next side door on the way to ${id}`)));
      } else {
        await page.locator('#bRooms').first().click({timeout: T}).catch(() => fail(tag(`Rooms book not clickable before ${id}`)));
        await page.waitForTimeout(900);
        // The contents lists every room; its entry turns to that room's page, which has the Enter button.
        await page.locator(`.rl-toc li[data-room="${id}"]`).first().click({timeout: T}).catch(() => fail(tag(`Rooms book contents has no entry for ${id}`)));
        await page.waitForTimeout(900);
        await page.locator(`.rl-enter [data-room="${id}"]`).first().click({timeout: T}).catch(() => fail(tag(`Rooms book has no Enter for ${id}`)));
      }
      await page.waitForTimeout(3200);
      const now = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('deepstack.v1') || '{}').room || 'hall'; } catch { return null; } });
      if (now !== id) fail(tag(`switched to ${now}, expected ${id}`));
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(600);
    await openWeeklyLeaves(page, tag, id, `${SHOTS}/rooms/${id}-${view.name}.png`);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(900);
  }
  await ctx.close();
}

try {
  for (const v of VIEWS) {
    try { await run(v); } catch (e) { if (e.message !== 'stop') fail(`[${v.name}] ${e.message}`); }
  }
} finally {
  await browser.close();
  server.close();
}
if (problems.length) { console.error('weekly-check FAILED:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`weekly-check ok (screenshots in ${SHOTS})`);
