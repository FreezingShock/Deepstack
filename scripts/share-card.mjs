// Daily share picture guard (src/ui/dailyShareImage.js). Every topic room, every look: each line of the card must fit its
// slot (shrinks at most to 80%), stay inside the frame, not overlap another line, and draw no word or answer.
// Lines are measured in a real browser with the app's own serif. Then a seeded finished Daily is opened on the results
// page at 375x667 and 1280x800 with reduced motion on: no sideways scroll, the picture button shows on desktop only.
// Set SHARE_CARD_OUT to a folder to save the pictures and the results screenshots. Run after `npm run build`.
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';
import {shareCardOps, drawShareOps, LOOKS, CARD_W, CARD_H} from '../src/ui/dailyShareImage.js';
import {ROOMS} from '../src/core/rooms.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.otf': 'font/otf'};
const root = join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  let body;
  try { let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    body = await readFile(join(root, p)); res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
let chromium;
try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch { console.log('share-card: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch { console.log('share-card: no browser, skipping'); server.close(); process.exit(0); }

const out = process.env.SHARE_CARD_OUT;
if (out) await mkdir(out, {recursive: true});
const failures = [];
const today = new Date().toISOString().slice(0, 10);
const WORDS = ['zebrafinch', 'quorumlike', 'mizzenmast', 'filler', 'filler2'];
const ANSWERS = ['a secret answer here', 'another private reply'];
const TIER_NAMES = ['Pamphlet', 'Paperback', 'Hardbound', 'Folio', 'Codex', 'Grimoire', 'Apocrypha'];
const books = [
  {w: WORDS[0], tier: 6, score: 91, answer: ANSWERS[0], ft: 150},
  {w: WORDS[1], tier: 3, score: 60, answer: ANSWERS[1], ft: 80},
  {w: WORDS[2], tier: 0, score: 0, answer: '', ft: 12},
  {w: WORDS[3], tier: 2, score: 40, answer: 'x', ft: 40},
  {w: WORDS[4], tier: 1, score: 25, answer: 'y', ft: 30},
  {w: 'filler5', tier: 4, score: 70, answer: 'z', ft: 60},
  {w: 'filler6', tier: 5, score: 75, answer: 'q', ft: 50}
].map(b => ({...b, combo: null, hints: 0}));
const run = {books, avg: 52, depth: 1234, floor: 2, best: 6, mode: 'daily', day: today, practice: false};
const cardOpts = room => ({room: room.name, no: 123, floorName: 'The Catacombs', tierNames: TIER_NAMES, keys: [today], today, rgb: room.rgb});

// 1. The picture, per room and look, measured in the browser.
const ctx0 = await browser.newContext({viewport: {width: 800, height: 600}, reducedMotion: 'reduce'});
const page0 = await ctx0.newPage();
await page0.route(u => !u.href.startsWith(url), r => r.abort());
await page0.goto(url);
await page0.waitForLoadState('load');
await page0.addScriptTag({content: `window.drawShareOps = ${drawShareOps.toString()};`});
for (const room of ROOMS) for (const look of LOOKS) {
  const card = shareCardOps(run, cardOpts(room), look);
  const tag = `${room.short} (${look})`;
  const r = await page0.evaluate(async c => {
    try { await document.fonts.load('400 40px "Anthropic Serif"'); } catch (e) {}
    const cv = document.createElement('canvas'); cv.width = c.w * 2; cv.height = c.h * 2;
    const ctx = cv.getContext('2d'); ctx.scale(2, 2);
    const report = window.drawShareOps(ctx, c);
    return {report, png: out => out, dataUrl: cv.toDataURL('image/png'), font: document.fonts.check('400 40px "Anthropic Serif"')};
  }, card);
  const rep = r.report;
  for (const o of rep.over) failures.push(`${tag}: "${o.t}" is ${o.width}px in a ${o.max}px slot even at 60%`);
  for (const s of rep.shrunk) if (s.to / s.from < .8) failures.push(`${tag}: "${s.t}" shrinks to ${Math.round(s.to / s.from * 100)}% to fit`);
  for (const b of rep.boxes) {
    if (b.l < 60 || b.r > CARD_W - 60) failures.push(`${tag}: "${b.t}" runs past the frame (${Math.round(b.l)}..${Math.round(b.r)})`);
  }
  const B = rep.boxes;
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], b = B[j];
    if (a.l < b.r - 2 && b.l < a.r - 2 && a.top < b.bot - 2 && b.top < a.bot - 2) failures.push(`${tag}: "${a.t}" overlaps "${b.t}"`);
  }
  for (const w of [...WORDS, ...ANSWERS]) if (JSON.stringify(card.ops).includes(w)) failures.push(`${tag}: spoiler "${w}" is drawn`);
  if (out) await writeFile(`${out}/card-${room.id}-${look}.png`, Buffer.from(r.dataUrl.split(',')[1], 'base64'));
}
await ctx0.close();

// 2. The results page, seeded with a finished Daily in each room.
const SIZES = [[375, 667], [1280, 800]];
for (const room of ROOMS) for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce', deviceScaleFactor: 1});
  const page = await ctx.newPage();
  await page.route(u => !u.href.startsWith(url), r => r.abort());
  // The Reading Room keeps its Daily at the top level; topic rooms keep theirs in S.rooms (see src/core/roomStore.js).
  const own = {daily: {[today]: run}, streak: {last: today, n: 1}};
  const save = room.id === 'hall' ? {shelf: [], ...own} : {room: room.id, shelf: [], streak: {last: '', n: 0}, daily: {}, rooms: {[room.id]: own}};
  await page.addInitScript(({save, settings}) => {
    try { localStorage.setItem('deepstack.v1', JSON.stringify(save)); localStorage.setItem('deepstack.settings.v1', JSON.stringify(settings)); } catch (e) {}
  }, {save, settings: {motion: 'reduce'}});
  await page.goto(url);
  const tag = `${room.short} ${w}x${h}`;
  try {
    await page.waitForSelector('#bRes', {timeout: 15000});
    await page.click('#bRes');
    await page.waitForSelector('.fin #cp', {timeout: 15000});
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const b = document.querySelector('#spic'), sh = document.querySelector('#sh');
      const vis = e => !!e && !!e.getClientRects().length && getComputedStyle(e).display !== 'none';
      return {sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, spic: vis(b), sh: vis(sh), slip: document.querySelector('#shr')?.textContent || ''};
    });
    if (m.sw > m.cw) failures.push(`${tag}: sideways scroll (${m.sw} in ${m.cw})`);
    const phone = w < 761;
    if (!m.sh) failures.push(`${tag}: the Share button is not on the results page`);
    if (m.spic === phone) failures.push(`${tag}: Save picture should ${phone ? 'be hidden' : 'show'} here`);
    for (const w2 of [...WORDS, ...ANSWERS]) if (m.slip.includes(w2)) failures.push(`${tag}: the results slip shows "${w2}"`);
    if (out) await page.screenshot({path: `${out}/results-${room.id}-${w}.png`});
  } catch (e) {
    failures.push(`${tag}: results page did not open (${e.message.split('\n')[0]})`);
  }
  await ctx.close();
}

if (failures.length) {
  console.log(`share-card: ${failures.length} problem(s)`);
  for (const f of failures) console.log('  - ' + f);
} else {
  console.log(`share-card: ${ROOMS.length} rooms x ${LOOKS.length} looks fit, no spoilers; results page checked at ${SIZES.map(s => s.join('x')).join(' and ')}`);
}
// The report is printed first; closing can hang on a context, so do not wait for it.
browser.close().catch(() => {});
server.close();
process.exit(failures.length ? 1 : 0);
