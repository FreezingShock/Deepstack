// Room-switch guard (#303 smooth room switch). Walking to another room must leave nothing behind: the fire, the
// tagline, the Daily tag, the ring of lights, the side doors, the Rooms-book badge and the Librarian's Card (per-room
// streak) all have to name the same room, and the fireplace itself must never be rebuilt. This drives the built app in
// headless Chromium, enters rooms every way a player can (side door, [ and ] keys, ring of lights, the Rooms book on a
// phone, and a reload mid-run), and records a snapshot on EVERY animation frame of each walk, so a frame where the
// pieces disagree or the fire flashes is caught even if the end state is right. Skips (exit 0) without a browser.
// Tests only: reads the DOM, never changes behaviour. Run after `npm run build`. Set ROOM_SHOTS=dir to keep frames.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {ROOMS, HALL, neighbours} from '../src/core/rooms.js';

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
if (!chromium) { console.log('room-switch: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('room-switch: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const problems = [];
const fail = m => { if (problems.length < 40) problems.push(m); };
const T = 15000;
const SHOTS = process.env.ROOM_SHOTS;
if (SHOTS) await mkdir(SHOTS, {recursive: true});

const today = new Date().toISOString().slice(0, 10); // the app's Daily day is UTC
const STREAK = {hall: 2, history: 7, math: 3, science: 5, english: 4, art: 11, body: 9};
const rooms = Object.fromEntries(ROOMS.filter(r => r.id !== HALL).map(r => [r.id, {daily: {}, rating: undefined, streak: {last: today, n: STREAK[r.id]}}]));
const seed = {shelf: [], sound: false, streak: {last: today, n: STREAK.hall}, rooms, room: 'history'};

// What every part of the room must say, read straight off the page. `fire` is the inline colour the glide starts from.
const READ = `(() => {
  const q = s => document.querySelector(s), h = q('#home'), html = document.documentElement;
  const ds = window.__deepstack || {}, tl = q('#home .hz-title .tagline'), tag = q('#home .daily-tag');
  return {
    sRoom: (ds.S && ds.S.room) || 'hall',
    htmlRoom: html.dataset.room || 'hall',
    fire: html.style.getPropertyValue('--rm-rgb').trim(),
    tagline: tl ? tl.textContent.replace(/\\s+/g, ' ').trim() : null,
    dailyTag: tag ? tag.textContent.trim() : null,
    ring: [...document.querySelectorAll('#home .rm-ring .rm-dot.on')].map(d => d.dataset.room),
    doors: document.querySelector('#rm-doors') && !document.querySelector('#rm-doors').hidden ? [...document.querySelectorAll('#rm-doors .rm-door')].map(d => d.dataset.room) : null,
    badge: (q('#bRooms') || {}).textContent || null,
    streak: ((q('#home .lg-streak dd') || {}).textContent || '').trim(),
    hearth: !!q('#home .hearth, .hearth'),
    hearthTag: (q('.hearth') || {}).__roomGuard || 0,
    homeHidden: !h || h.hidden,
  };
})()`;

// Which room do the visible words belong to? Hall has no room name in its tagline.
const roomOfText = s => (s ? (ROOMS.find(r => r.id !== HALL && s.includes(r.name)) || {id: HALL}).id : null);
const rgbStr = r => r.rgb.join(',');
const norm = s => String(s || '').replace(/\s+/g, '');

/** Do all the parts of the home name the same room `id`? Returns the list of parts that disagree. */
function mismatches(v, id, {fire = true} = {}) {
  const r = ROOMS.find(x => x.id === id), bad = [];
  if (v.sRoom !== id) bad.push(`state room ${v.sRoom}`);
  if (v.htmlRoom !== id) bad.push(`data-room ${v.htmlRoom}`);
  if (fire && norm(v.fire) !== norm(rgbStr(r))) bad.push(`fire ${v.fire}`);
  if (v.tagline != null && roomOfText(v.tagline) !== id) bad.push(`tagline "${v.tagline}"`);
  if (id !== HALL && v.dailyTag != null && !v.dailyTag.startsWith(r.topic)) bad.push(`daily tag "${v.dailyTag}"`);
  if (v.ring.length !== 1 || v.ring[0] !== id) bad.push(`ring lit ${v.ring.join('+') || 'none'}`);
  if (v.doors) { const n = neighbours(id); if (v.doors[0] !== n.prev.id || v.doors[1] !== n.next.id) bad.push(`doors ${v.doors.join(',')}`); }
  const want = id === HALL ? 'rooms' : r.short;
  if (v.badge != null && !v.badge.includes(want)) bad.push(`Rooms badge "${v.badge.trim().slice(0, 40)}"`);
  if (v.streak && !new RegExp(`(^|\\D)${STREAK[id]}(\\D|$)`).test(v.streak)) bad.push(`Card streak "${v.streak}" (want ${STREAK[id]})`);
  if (!v.hearth || v.homeHidden) bad.push('home or fire missing');
  return bad;
}

async function newPage(viewport) {
  const ctx = await browser.newContext({viewport});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => fail('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fail('console.error: ' + m.text()); });
  await page.addInitScript(([s, k]) => { try { if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); localStorage.setItem('deepstack.v1', JSON.stringify(s)); } } catch {} }, [seed, 'room-switch-seeded']);
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#home').waitFor({state: 'visible', timeout: T}).catch(() => fail('home never rendered'));
  await page.waitForFunction(() => document.querySelector('#home .rm-ring') && document.querySelector('.hearth'), null, {timeout: T}).catch(() => fail('home never finished mounting'));
  return page;
}

// Per-frame recorder: one snapshot per animation frame until stopped. The fireplace node is tagged so a rebuild shows.
const startRec = page => page.evaluate(r => {
  const h = document.querySelector('.hearth'); if (h && !h.__roomGuard) h.__roomGuard = Math.random() + 1;
  window.__rec = {frames: [], on: true, tag: h && h.__roomGuard};
  const tick = () => { if (!window.__rec.on) return; window.__rec.frames.push(eval(r)); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}, READ);
const stopRec = page => page.evaluate(() => { window.__rec.on = false; return {frames: window.__rec.frames, tag: window.__rec.tag}; });
const settled = (page, id) => page.waitForFunction(([r, id]) => {
  const v = eval(r), tl = v.tagline || '';
  return v.sRoom === id && v.htmlRoom === id && v.ring[0] === id && !document.querySelector('#home .hz-title .tagline span[style*="hidden"]') && !!tl;
}, [READ, id], {timeout: T}).then(() => true, () => false);

/** One walk: start recording, do `act`, wait to settle, then check the end state and every frame in between. */
async function walk(page, how, from, to, act, {viewport = 'desktop'} = {}) {
  const name = `${viewport}/${how}: ${from} -> ${to}`;
  await startRec(page);
  await act();
  if (!(await settled(page, to))) fail(`${name}: never arrived`);
  await page.waitForTimeout(250); // the typewriter and the glide finish
  const {frames, tag} = await stopRec(page);
  const end = await page.evaluate(READ);
  const bad = mismatches(end, to);
  if (bad.length) fail(`${name}: after the walk, ${bad.join('; ')}`);
  if (end.hearthTag && end.hearthTag !== tag) fail(`${name}: the fireplace was rebuilt (nothing should reset)`);
  // Frame rules. The fire and colours lead (they glide first); the words, ring, doors, badge and Card swap together in
  // one redraw, so on any frame they must all agree on ONE room, from or to, never a mix and never a third room.
  let sawFrom = false, sawTo = false;
  frames.forEach((v, i) => {
    if (!v.hearth || v.homeHidden) { fail(`${name}: frame ${i}: home or fireplace vanished`); return; }
    if (v.tagline === '') fail(`${name}: frame ${i}: tagline blank`);
    const group = [['tagline', roomOfText(v.tagline)], ['ring', v.ring[0]], ['badge', v.badge == null ? null : (ROOMS.find(r => r.id !== HALL && v.badge.includes(r.short)) || {id: HALL}).id],
      ['Card streak', v.streak ? (Object.entries(STREAK).find(([, n]) => new RegExp(`(^|\\D)${n}(\\D|$)`).test(v.streak)) || [null])[0] : null]].filter(([, r]) => r);
    const ids = new Set(group.map(([, r]) => r));
    if (ids.size > 1) fail(`${name}: frame ${i}: parts disagree (${group.map(([k, r]) => k + '=' + r).join(', ')})`);
    for (const r of ids) { if (r !== from && r !== to) fail(`${name}: frame ${i}: showed a third room, ${r}`); }
    if (ids.has(from)) sawFrom = true; if (ids.has(to)) sawTo = true;
    if (v.hearthTag && v.hearthTag !== tag) fail(`${name}: frame ${i}: fireplace rebuilt`);
    if (from !== HALL && to !== HALL && v.htmlRoom === HALL) fail(`${name}: frame ${i}: room tint dropped between two topic rooms`);
  });
  if (frames.length < 3) fail(`${name}: only ${frames.length} frames recorded`);
  if (SHOTS) await page.screenshot({path: join(SHOTS, `${name.replace(/[^a-z0-9]+/gi, '-')}.png`)});
  return {frames, sawFrom, sawTo};
}

const idle = page => page.waitForFunction(() => { const h = document.querySelector('#home'); return h && !h.hidden && !h.classList.contains('book-opening'); }, null, {timeout: T});
const cur = page => page.evaluate(() => (window.__deepstack.S.room) || 'hall');

// ---- Desktop: side doors, keys, ring of lights ----
{
  const page = await newPage({width: 1280, height: 800});
  let at = await cur(page); // seeded in the Chronicle
  const first = await page.evaluate(READ);
  const bad = mismatches(first, at);
  if (bad.length) fail(`desktop/first paint in ${at}: ${bad.join('; ')}`);
  if (!first.doors) fail('desktop: side doors are not shown at 1280px');

  // doors, forwards then backwards
  for (const side of ['next', 'next', 'prev', 'prev']) {
    const to = neighbours(at)[side].id, from = at;
    await idle(page);
    await walk(page, `door ${side}`, from, to, () => page.locator(`#rm-doors .rm-${side}`).click({timeout: T}));
    at = to;
  }
  // keys
  for (const key of [']', '[', '[']) {
    const to = neighbours(at)[key === ']' ? 'next' : 'prev'].id, from = at;
    await idle(page);
    await walk(page, `key ${key}`, from, to, () => page.keyboard.press(key));
    at = to;
  }
  // dots: every room from where we stand, including the Reading Room and a far jump
  for (const r of [ROOMS[0], ROOMS[3], ROOMS[6], ROOMS[1]]) {
    if (r.id === at) continue;
    const from = at;
    await idle(page);
    await walk(page, `dot`, from, r.id, () => page.locator(`#home .rm-ring .rm-dot[data-room="${r.id}"]`).click({timeout: T}));
    at = r.id;
  }
  // Every room, once, by the ring, to catch one room's data leaking into another.
  for (const r of ROOMS) {
    if (r.id === at) continue;
    const from = at; await idle(page);
    await walk(page, `dot sweep`, from, r.id, () => page.locator(`#home .rm-ring .rm-dot[data-room="${r.id}"]`).click({timeout: T}));
    at = r.id;
  }

  // reload: each room must come back as itself (fire, words, Card, badge) on the very first home
  for (const r of [ROOMS[2], ROOMS[0], ROOMS[5]]) {
    const from = at;
    await idle(page);
    await walk(page, 'dot (before reload)', from, r.id, () => page.locator(`#home .rm-ring .rm-dot[data-room="${r.id}"]`).click({timeout: T}));
    at = r.id;
    await page.waitForTimeout(400); // the save is written when the walk lands
    await page.reload({waitUntil: 'load'});
    await page.waitForFunction(() => document.querySelector('#home .rm-ring') && document.querySelector('.hearth'), null, {timeout: T}).catch(() => fail(`reload in ${r.id}: home never mounted`));
    await settled(page, r.id);
    const v = await page.evaluate(READ), b = mismatches(v, r.id);
    if (b.length) fail(`desktop/reload in ${r.id}: ${b.join('; ')}`);
  }

  // mid-run reload: start the Daily in a topic room, reload while the run is up, and the home must be that room again
  {
    const id = 'art';
    if (at !== id) { await idle(page); await walk(page, 'dot (before run)', at, id, () => page.locator(`#home .rm-ring .rm-dot[data-room="${id}"]`).click({timeout: T})); at = id; }
    await page.evaluate(() => window.__deepstack.startDaily && window.__deepstack.startDaily(false)).catch(() => {});
    await page.waitForFunction(() => !!window.__deepstack.run, null, {timeout: T}).catch(() => fail('mid-run: the run never started'));
    await page.waitForTimeout(600);
    await page.reload({waitUntil: 'load'});
    await page.waitForFunction(() => document.querySelector('#home .rm-ring') && document.querySelector('.hearth'), null, {timeout: T}).catch(() => fail('mid-run reload: home never mounted'));
    await settled(page, id);
    const v = await page.evaluate(READ), b = mismatches(v, id);
    if (b.length) fail(`desktop/mid-run reload in ${id}: ${b.join('; ')}`);
    // and a walk still works afterwards
    await idle(page);
    await walk(page, 'door next (after mid-run reload)', id, neighbours(id).next.id, () => page.locator('#rm-doors .rm-next').click({timeout: T}));
  }
  await page.context().close();
}

// ---- Phone: the Rooms book is the only way (no side doors) ----
{
  const page = await newPage({width: 375, height: 700});
  let at = await cur(page);
  const first = await page.evaluate(READ);
  if (first.doors) fail('phone: side doors should be hidden at 375px');
  const bad = mismatches(first, at);
  if (bad.length) fail(`phone/first paint in ${at}: ${bad.join('; ')}`);
  for (const id of ['science', 'hall', 'body']) {
    if (id === at) continue;
    const from = at;
    await idle(page);
    await walk(page, 'ledger', from, id, async () => {
      await page.locator('#bRooms').click({timeout: T});
      const enter = page.locator(`.rl-enter [data-room="${id}"]`);
      // turn to the room's page through the contents list, then Enter
      await page.locator(`.rl-toc li[data-room="${id}"]`).first().click({timeout: T}).catch(() => {});
      await enter.first().click({timeout: T});
    }, {viewport: 'phone'});
    at = id;
    await page.waitForTimeout(300);
  }
  // the ring of lights opens the Rooms book on a phone instead of walking
  await idle(page);
  await page.locator('#home .rm-ring .rm-dot').first().click({timeout: T});
  await page.waitForSelector('.bk-spread', {timeout: T}).catch(() => fail('phone: the ring of lights did not open the Rooms book'));
  await page.context().close();
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`room-switch: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('room-switch: every room entered by door, keys, ring of lights, the Rooms book and a reload stays in step');
