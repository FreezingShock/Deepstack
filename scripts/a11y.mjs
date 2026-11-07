// Accessibility audit: axe-core on every screen the player reaches (home, each menu book, a word in play, the result card)
// at phone and desktop widths with OS reduced motion on, plus two checks axe does not do for this game:
//   - every visible control is at least 44px on each side (touch target), and
//   - every control shows a visible focus ring when reached with the keyboard.
// Fails on serious and critical axe violations and on any target or focus-ring finding. `--report` prints everything.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.woff2': 'font/woff2'};
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
const AXE = require.resolve('axe-core/axe.min.js');
const REPORT = process.argv.includes('--report');

let chromium;
try { ({chromium} = await import('playwright')); }
catch { try { ({chromium} = require('playwright')); } catch {} }
if (!chromium) { console.log('a11y: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('a11y: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const seen = new Map(); // state -> violations (for the report)
const checked = []; // every state that was audited, so a skipped screen cannot pass unnoticed
// named exceptions, printed on every run so they stay visible
const exempt = new Set(['depth tracker floor buttons on phones (known gap, see the backlog)']);
const skipped = []; // screens that could not be reached here; printed, not failed (the judge needs its model files)
const T = 15000;
const VIEWPORTS = [['phone', 375, 667], ['desktop', 1280, 800]];

// axe run for one state: serious/critical violations are failures; everything is kept for --report
async function audit(page, vp, state) {
  checked.push(`${vp} ${state}`);
  const res = await page.evaluate(async () => {
    const r = await axe.run(document, {resultTypes: ['violations'], rules: {'color-contrast': {enabled: true}}});
    return r.violations.map(v => ({id: v.id, impact: v.impact || 'minor', help: v.help, nodes: v.nodes.slice(0, 5).map(n => ({t: n.target.join(' '), s: (n.failureSummary || '').split('\n').slice(0, 2).join(' ').slice(0, 220)}))}));
  });
  for (const v of res) {
    const key = `${vp} ${state}: ${v.id} (${v.impact}) ${v.help}`;
    seen.set(key, v);
    if (v.impact === 'serious' || v.impact === 'critical') problems.push(key + ' -> ' + v.nodes.map(n => n.t).join(', '));
  }
}

// Every visible control: at least 44 CSS px on both sides, unless it is disabled. The tap area is measured where a finger
// would land: step outwards from each edge while elementFromPoint still returns the control. So a hit slop (an
// absolutely positioned ::before/::after) counts, and so does any other way a control reaches the size, with no
// assumption about how it was built. The room lights on wide screens are spaced about 21px apart, so they can only
// reach 24px (WCAG 2.5.8 spacing exception).
async function targets(page, vp, state) {
  const bad = await page.evaluate(() => {
    const sel = 'button, a[href], [role=button], [role=tab], [role=menuitem], input:not([type=hidden]), textarea, select, [tabindex]:not([tabindex="-1"])';
    // how many px a point can move outwards from one edge and still hit the element (or one of its children)
    const reach = (el, dx, dy, max, r) => {
      let n = 0;
      for (let d = 1; d <= max; d++) {
        const x = dx > 0 ? r.right + d - 0.5 : dx < 0 ? r.left - d + 0.5 : (r.left + r.right) / 2;
        const y = dy > 0 ? r.bottom + d - 0.5 : dy < 0 ? r.top - d + 0.5 : (r.top + r.bottom) / 2;
        const hit = document.elementFromPoint(x, y);
        if (!hit || !(hit === el || el.contains(hit))) break;
        n = d;
      }
      return n;
    };
    const out = [];
    const cardUp = document.querySelector('#cardlayer.on:not([hidden]), .keyhelp');
    for (const el of document.querySelectorAll(sel)) {
      const cs = getComputedStyle(el);
      // inert controls (behind an open book) cannot be tapped, so their size is not a target
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.disabled || el.closest('[hidden],[aria-hidden="true"],[inert]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
      // KNOWN GAP, listed in the backlog: on phones the depth tracker's floor buttons are 19px-wide slivers of the rail,
      // and the rail sits on top of them, so no slop reaches 44px without moving the rail. Exempted by name, printed below.
      if (el.closest('nav[aria-label="Depth tracker"]') && el.tagName === 'BUTTON') continue;
      // a control under an open modal layer (the result card, the shortcut panel) cannot be tapped now, so it is not a target here
      if (cardUp && !cardUp.contains(el)) continue;
      // WCAG 2.5.8 (AA) minimum is 24px. Room lights and book spines sit side by side, so they keep the spacing exception.
      const min = el.matches('.rm-dot, .ledgebook') ? 24 : 44;
      if (r.width >= min && r.height >= min) continue;
      const max = 44;
      const w = r.width + reach(el, -1, 0, max, r) + reach(el, 1, 0, max, r);
      const h = r.height + reach(el, 0, -1, max, r) + reach(el, 0, 1, max, r);
      if (w < min || h < min) {
        const name = el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30) || el.id || el.className;
        out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${String(name).slice(0, 30)}" ${Math.round(w)}x${Math.round(h)}`);
      }
    }
    return out;
  });
  for (const b of bad) {
    const key = `${vp} ${state}: small target ${b}`;
    if (REPORT) seen.set(key, {id: 'target', impact: 'serious'});
    problems.push(key);
  }
}

// Tab through the page: each control that takes focus must look different from its resting state. Compares the
// computed look of the focused element with the same element after blur (outline, shadow, border, background, colour).
async function focusRings(page, vp, state, max = 60) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const missing = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(async () => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const props = ['outline-style', 'outline-width', 'outline-color', 'outline-offset', 'box-shadow', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width', 'background-color', 'color', 'text-decoration-line'];
      // a transition still running reports its old value, so wait for the look to settle before reading it
      const settled = async () => { await Promise.all(el.getAnimations({subtree: true}).map(a => a.finished.catch(() => {}))); };
      const snap = () => { const cs = getComputedStyle(el); return props.map(p => cs.getPropertyValue(p)).join('|'); };
      await settled();
      const focused = snap();
      el.blur();
      await settled();
      const resting = snap();
      el.focus({preventScroll: true});
      await settled();
      const name = el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30) || el.id || el.className;
      return {ok: focused !== resting, label: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${String(name).slice(0, 30)}"`};
    });
    if (!info) continue;
    if (!info.ok) missing.push(info.label);
  }
  for (const m of [...new Set(missing)]) {
    const key = `${vp} ${state}: no visible focus ring on ${m}`;
    if (REPORT) seen.set(key, {id: 'focus', impact: 'serious'});
    problems.push(key);
  }
}

async function settle(page, ms = 900) { await page.waitForTimeout(ms); }

for (const [vp, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => problems.push(`${vp}: pageerror ${e.message}`));
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T}).catch(() => problems.push(`${vp}: home never rendered`));
  await page.addScriptTag({path: AXE});
  await settle(page, 1200);

  await audit(page, vp, 'home');
  await targets(page, vp, 'home');
  await focusRings(page, vp, 'home');

  for (const [id, name] of [['bDaily', 'Daily'], ['bUnl', 'Unlimited'], ['bAll', 'Shelf'], ['bRooms', 'Rooms'], ['bStats', 'Stats']]) {
    const btn = page.locator(`#${id}`).first();
    if (!(await btn.count())) { problems.push(`${vp}: ${name} book missing`); continue; }
    await btn.click({timeout: T}).catch(() => {});
    const dlg = page.locator('[role=dialog].intro').first();
    if (await dlg.waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) {
      await settle(page);
      await audit(page, vp, `${name} book`);
      await targets(page, vp, `${name} book`);
      await focusRings(page, vp, `${name} book`);
    }
    await page.keyboard.press('Escape');
    await page.locator('[role=dialog].intro').waitFor({state: 'detached', timeout: T}).catch(() => {});
    await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => {});
    await settle(page, 400);
  }

  // one word in play, then its result card
  const play = page.locator('#bPlay').first();
  if (await play.count()) {
    await play.click({timeout: T}).catch(() => {});
    await page.locator('#stage .word').waitFor({state: 'visible', timeout: T}).catch(() => problems.push(`${vp}: no word appeared`));
    await settle(page, 600);
    await audit(page, vp, 'word in play');
    await targets(page, vp, 'word in play');
    await focusRings(page, vp, 'word in play', 12);
    await page.locator('#ans').click({timeout: T}).catch(() => {});
    await page.keyboard.type('a thing that is the opposite of what you would expect to find here');
    await page.keyboard.press('Enter');
    const card = page.locator('#cardlayer:not([hidden])');
    for (let i = 0; i < 40 && !(await card.count()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(250); }
    await page.locator('#vd.on').waitFor({state: 'attached', timeout: T}).catch(() => {});
    await settle(page, 600);
    if (await card.count()) {
      await audit(page, vp, 'result card');
      await targets(page, vp, 'result card');
      await focusRings(page, vp, 'result card', 12);
    } else skipped.push(`${vp}: result card not reached (the judge did not answer, so the answer never submitted)`);
  }
  // the room, the dialogs and the top bar start again from a fresh load: a finished word can leave its card layer up
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T}).catch(() => {});
  await page.addScriptTag({path: AXE});
  await settle(page, 1200);
  // a topic room: enter one from its side door (desktop) or its ring light (phone), then audit the room's home
  const home = page.locator('#bPlay, #bRes').first();
  if (await home.count()) {
    const door = page.locator('.rm-door.rm-next, .rm-dot:not(.on)').first();
    if (await door.count()) {
      await door.click({timeout: T, force: true}).catch(() => {});
      await page.waitForTimeout(3500);
      await settle(page, 600);
      await audit(page, vp, 'topic room');
      await targets(page, vp, 'topic room');
      await focusRings(page, vp, 'topic room');
    } else problems.push(`${vp}: no topic room door or ring light to enter`);
  }

  // the three small dialogs from the top bar: Settings, Credits and the keyboard shortcuts
  for (const [id, name] of [['bSettings', 'Settings'], ['bCredits', 'Credits'], ['bKeys', 'Keyboard shortcuts']]) {
    const btn = page.locator(`#${id}`).first();
    if (!(await btn.count())) continue;
    if (!(await btn.isVisible())) { skipped.push(`${vp}: ${name} dialog (its top-bar button is hidden at this width, by design)`); continue; }
    await btn.click({timeout: T}).catch(() => {});
    if (await page.locator('[role=dialog]:not([hidden])').first().waitFor({state: 'visible', timeout: T}).then(() => true, () => false)) {
      await settle(page, 700);
      await audit(page, vp, `${name} dialog`);
      await targets(page, vp, `${name} dialog`);
      await focusRings(page, vp, `${name} dialog`, 30);
    } else problems.push(`${vp}: ${name} dialog did not open`); // a screen that never opens must not pass silently
    await page.keyboard.press('Escape');
    await settle(page, 500);
  }
  await ctx.close();
}

await browser.close(); server.close();
if (REPORT) {
  for (const [k, v] of seen) console.log(`${k}\n    ${(v.nodes || []).map(n => n.t + '  ' + n.s).join('\n    ')}`);
}
if (problems.length) {
  console.error(`a11y: FAILED (${problems.length})\n - ` + [...new Set(problems)].join('\n - '));
  process.exit(1);
}
console.log(`a11y: ok, ${checked.length} states audited:\n  ${[...new Set(checked)].join('\n  ')}`);
for (const k of skipped) console.log(`a11y: skipped ${k}`);
for (const k of exempt) console.log(`a11y: exempt ${k}`);
