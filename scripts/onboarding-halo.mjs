// Onboarding halo guard: a first-visit home note's gold halo must sit on its target (within 1px), keep sitting on it while the
// home is still fading up (the fade moves it 14px) and when the target is shifted mid-note, must not be covered by anything
// (its ring is hit-tested with pointer-events switched on), and its panel must stay on screen and off its target.
// Every home note is checked in every topic room at a laptop and a phone size with motion on, and in the Reading Room with
// reduced motion on. Run after `npm run build`; set CHROMIUM_PATH if Playwright's own Chromium is missing. Skips (exit 0)
// without a browser, like the other guards.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';
import {HOME_NOTES, noteSelector, PHONE_DOOR_TEXT, DOOR_MIN_WIDTH} from '../src/ui/firstNotes.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.otf': 'font/otf', '.jpg': 'image/jpeg', '.png': 'image/png'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    const data = await readFile(join(root, p));
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); }
catch { console.log('onboarding-halo: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('onboarding-halo: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const KEYS = HOME_NOTES.map(([k]) => k);
const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const SIZES = [[1920, 1080], [375, 667]];
const TOL = 1; // px. The halo is the target's rect grown 5px a side, so anything over a pixel is a visible misplacement.
const failures = [];
let checked = 0, skipped = 0;

// Every home note but the one under test is marked seen, so the tested note is the only one due on the first home visit.
const seedFor = (key, room) => ({room, seen: Object.fromEntries(KEYS.filter(k => k !== key).map(k => [k, 1]))});

// Runs in the page: the halo, its target and its panel, read two frames on. The follower moves the halo in a frame, so a DOM
// change that lands in the same frame after it (a room's label that grows the spine) is one frame behind for a moment; two frames
// on, a halo that follows is level with its target. A halo that was left behind (the old bug) never catches up, and is caught.
// The target selector is the app's own (NOTE_TARGET).
const readOut = ({key, sel}) => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => {
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return {l: r.left, t: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom}; };
  const halo = document.querySelector(`.fhalo[data-note="${key}"]`);
  done({
    tgt: box(document.querySelector(sel)),
    halo: box(halo),
    halohidden: !!(halo && halo.hidden),
    panel: box(document.querySelector(`.fcall[data-note="${key}"]`)),
    panelText: (document.querySelector(`.fcall[data-note="${key}"]`) || {}).textContent || '',
    vw: innerWidth, vh: innerHeight,
  });
})));

// Runs in the page: the four midpoints just outside the target (where the halo ring is), hit-tested with the halo's pointer-events on.
const ringHits = ({key, sel}) => {
  const halo = document.querySelector(`.fhalo[data-note="${key}"]`);
  const t = document.querySelector(sel);
  if (!halo || !t) return null;
  const r = t.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const pts = {top: [cx, r.top - 2.5], bottom: [cx, r.bottom + 2.5], left: [r.left - 2.5, cy], right: [r.right + 2.5, cy]};
  halo.style.pointerEvents = 'auto';
  const out = {};
  for (const [side, [x, y]] of Object.entries(pts)) {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) { out[side] = 'off-screen'; continue; }
    const el = document.elementFromPoint(x, y);
    out[side] = !el ? 'none' : el.closest('.fhalo') ? 'halo' : `covered by ${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`;
  }
  halo.style.pointerEvents = '';
  return out;
};

const driftOf = o => {
  if (!o.tgt || !o.halo || o.halohidden || !(o.tgt.w > 0 && o.tgt.h > 0)) return null;
  return Math.max(Math.abs(o.halo.l + 5 - o.tgt.l), Math.abs(o.halo.t + 5 - o.tgt.t), Math.abs(o.halo.w - 10 - o.tgt.w), Math.abs(o.halo.h - 10 - o.tgt.h));
};

async function checkCase([w, h], reduce, room, key) {
  const tag = `${w}x${h} ${reduce ? 'reduced' : 'motion'} ${room} ${key}`;
  const sel = noteSelector(key, w); // the app's own choice at this width: a phone's door line lights the ring of room lights
  const wantText = key === 'home.doors' && w < DOOR_MIN_WIDTH ? PHONE_DOOR_TEXT : HOME_NOTES.find(([k]) => k === key)[1];
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: reduce ? 'reduce' : 'no-preference'});
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(seed => { try { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', JSON.stringify(seed)); } catch {} }, seedFor(key, room));
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  await page.goto(url);
  await page.waitForSelector('#home', {timeout: 15000});

  // A target with no size on this screen (a phone hides the side doors) gets no note from the app, so there is nothing to check.
  // The doors are placed a few frames after mount, so give the target a moment to appear before deciding it never will.
  const onScreen = await page.waitForFunction(s => { const t = document.querySelector(s); if (!t) return false; const r = t.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth; }, sel, {timeout: 3000, polling: 50}).then(() => true, () => false);
  if (!onScreen) { skipped++; await ctx.close(); return; }
  const lit = await page.waitForSelector(`.fhalo[data-note="${key}"]`, {state: 'attached', timeout: 6000}).then(() => true, () => false);
  if (!lit) { failures.push(`${tag}: the note was not lit although its target is on screen`); await ctx.close(); return; }
  checked++;
  const read = () => page.evaluate(readOut, {key, sel});

  // 1. Through the home's fade-up the halo follows its target on every sample.
  let worst = 0;
  for (let i = 0; i < 12; i++) {
    const d = driftOf(await read());
    if (d !== null) worst = Math.max(worst, d);
    await page.waitForTimeout(90);
  }
  if (worst > TOL) failures.push(`${tag}: halo was ${worst.toFixed(1)}px off its target while the home settled`);

  // 2. The target shifts mid-note (a CSS translate, which leaves the spine's own transform alone): the halo follows, then comes back.
  for (const shift of ['9px -7px', '']) {
    await page.evaluate(({s, v}) => { document.querySelector(s).style.translate = v; }, {s: sel, v: shift});
    await page.waitForTimeout(120);
    const d = driftOf(await read());
    if (d !== null && d > TOL) failures.push(`${tag}: halo was ${d.toFixed(1)}px off after its target shifted (${shift || 'back'})`);
  }

  // 3. Nothing covers the halo ring.
  const hits = await page.evaluate(ringHits, {key, sel});
  if (!hits) failures.push(`${tag}: no halo to hit-test`);
  else for (const [side, what] of Object.entries(hits)) if (what !== 'halo' && what !== 'off-screen') failures.push(`${tag}: halo ${side} ring is ${what}`);

  // 4. The panel is on screen and does not sit on its own target.
  const o = await read();
  if (!o.panel) failures.push(`${tag}: no panel with the note`);
  else {
    if (o.panelText !== wantText) failures.push(`${tag}: panel says "${o.panelText}", expected "${wantText}"`);
    const p = o.panel, t = o.tgt;
    if (p.l < 0 || p.t < 0 || p.r > o.vw || p.b > o.vh) failures.push(`${tag}: panel runs off screen (${[p.l, p.t, p.r, p.b].map(Math.round)})`);
    const overlaps = !(p.r <= t.l || p.l >= t.r || p.b <= t.t || p.t >= t.b);
    if (overlaps) failures.push(`${tag}: panel covers its target`);
  }
  if (errs.length) failures.push(`${tag}: page error: ${errs[0]}`);
  await ctx.close();
}

const cases = [];
for (const size of SIZES) for (const room of ROOMS) for (const key of KEYS) cases.push([size, false, room, key]);
for (const size of SIZES) for (const key of KEYS) cases.push([size, true, 'hall', key]);
for (const [size, reduce, room, key] of cases) await checkCase(size, reduce, room, key);

await browser.close();
server.close();
if (checked === 0) failures.push('no onboarding note was checked, so the guard proves nothing');
if (failures.length) {
  console.log(`onboarding-halo: ${failures.length} problem(s) in ${checked} notes:`);
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
console.log(`onboarding-halo: ${checked} notes checked in every room at ${SIZES.map(s => s.join('x')).join(' and ')} (motion on and reduced), ${skipped} skipped (target not on screen). Halo matches its target, follows it, is uncovered, and the panel stays clear.`);
