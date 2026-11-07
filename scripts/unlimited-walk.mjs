// Unlimited walk: plays Unlimited in every room at phone and desktop sizes with OS reduced motion on.
// Per room: Find my rank (8 placement words), the placed rank, then Descend (7 words) and back home.
// Every screen is checked for NaN/undefined text, clipped or overflowing text, sideways or vertical page scroll,
// stray scrollable panes, and wrong word counts. Output: screenshots + report.json in OUT (default screenshots/unlimited-walk).
// Usage: npm run build && node scripts/unlimited-walk.mjs [ONLY=history-phone,...] [OUT=dir]
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';
import {findClipped} from './lib/textFit.mjs';

const root = join(process.cwd(), 'dist');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json'};
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
catch { ({chromium} = createRequire(import.meta.url)('playwright')); }
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});

const OUT = process.env.OUT || join(process.cwd(), 'screenshots/unlimited-walk');
await mkdir(OUT, {recursive: true});
const entries = JSON.parse(await readFile(join(root, 'data/room-words.json'), 'utf8')).rooms || {};
const defOf = new Map();
for (const list of Object.values(entries)) for (const e of list) defOf.set(e[0], e[2]);
const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [{tag: 'phone', w: 375, h: 667, dsf: 2, mobile: true}, {tag: 'desk', w: 1280, h: 800, dsf: 1, mobile: false}];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const T = 15000;
const report = {rooms: {}, generated: new Date().toISOString()};
const note = (key, msg) => { (report.rooms[key] ||= {problems: [], steps: []}).problems.push(msg); };
const step = (key, msg) => { (report.rooms[key] ||= {problems: [], steps: []}).steps.push(msg); if (process.env.TRACE) console.log(new Date().toISOString().slice(11, 19), key, msg); };

// Reads what a screen shows: the words of the page text, the number readouts, and the layout problems.
const scan = page => page.evaluate(() => {
  const vis = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length; };
  const text = [...document.querySelectorAll('body *')].filter(el => vis(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim()).join('\n');
  const sw = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  const sh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const panes = [...document.querySelectorAll('*')].filter(e => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2 && e.getClientRects().length && e.clientHeight > 20; }).map(e => e.id ? '#' + e.id : (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName));
  const q = s => document.querySelector(s);
  return {
    text, sw, sh, panes: [...new Set(panes)].slice(0, 8),
    word: q('#stage .word') ? q('#stage .word').getAttribute('aria-label') : null,
    wlabel: q('#stage .wlabel') ? q('#stage .wlabel').textContent.trim() : null,
    pips: q('#stage .pips, #stage .ledge, #stage .pipline') ? q('#stage .pips, #stage .ledge, #stage .pipline').children.length : null,
    dnum: q('#dnum') ? q('#dnum').textContent.trim() : null,
    descend: q('#bNext') ? q('#bNext').innerText.replace(/\s+/g, ' ').trim() : null,
    lexText: q('#final') && !q('#final').hidden ? q('#final').innerText.replace(/\s+/g, ' ').trim().slice(0, 400) : null
  };
});

const checkScreen = async (key, label, page) => {
  const s = await scan(page);
  const clipped = await page.evaluate(findClipped).catch(e => [{err: e.message}]);
  const bad = s.text.match(/\b(NaN|undefined|Infinity|null)\b/g);
  if (bad) note(key, `${label}: bad value text ${[...new Set(bad)].join(', ')}`);
  if (s.sw) note(key, `${label}: page scrolls sideways`);
  if (s.sh > 2) note(key, `${label}: page scrolls vertically by ${s.sh}px`);
  if (s.panes.length) note(key, `${label}: scrollable panes ${s.panes.join(' ')}`);
  if (clipped.length) note(key, `${label}: ${clipped.length} clipped text: ${clipped.slice(0, 3).map(c => (c.text || c.err || JSON.stringify(c)).toString().slice(0, 50)).join(' | ')}`);
  return s;
};

// The saved Unlimited rating for this room: numbers only, so a NaN or a wrong count shows up here.
const savedRating = (page, room) => page.evaluate(id => {
  const raw = JSON.parse(localStorage.getItem('deepstack.v1') || '{}');
  const r = id === 'hall' ? raw.rating : ((raw.rooms || {})[id] || {}).rating;
  return r ? {L: r.L, placed: r.placed, n: r.n, runs: r.runs, seen: (r.seen || []).length, hist: (r.hist || []).length} : null;
}, room);

// Answers the current word: the room's own definition on odd words, a weak answer on even ones, so the rating moves both ways.
async function answer(page, key, idx) {
  const w = await page.locator('#stage .word').first().getAttribute('aria-label', {timeout: T}).catch(() => null);
  if (!w) { note(key, `word ${idx}: no word on screen`); return null; }
  await page.locator('#ans').click({timeout: T}).catch(() => note(key, `word ${idx}: no answer box`));
  const text = idx % 2 === 0 ? (defOf.get(w) || 'a thing that does this') : 'something';
  await page.keyboard.type(text.slice(0, 280));
  await page.keyboard.press('Enter');
  const card = page.locator('#cardlayer:not([hidden]) #go');
  await card.waitFor({state: 'visible', timeout: T}).catch(() => note(key, `word ${idx}: card never showed`));
  await page.waitForTimeout(300);
  return {word: w, text};
}

for (const v of VIEWS) {
  for (const room of ROOMS) {
    const key = `${room}-${v.tag}`;
    if (only && !only.includes(key)) continue;
    const ctx = await browser.newContext({viewport: {width: v.w, height: v.h}, deviceScaleFactor: v.dsf, isMobile: v.mobile, hasTouch: v.mobile, reducedMotion: 'reduce'});
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.|huggingface|hf\.co/.test(m.text())) errs.push('console: ' + m.text()); });
    await page.route(u => !u.href.startsWith(url) && !/fonts\.googleapis|fonts\.gstatic/.test(u.href), r => r.abort());
    await page.route(/fonts\.googleapis/, r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
    const save = JSON.stringify({shelf: [], streak: {last: '', n: 0}, bestDepth: 0, room: room === 'hall' ? undefined : room});
    await page.addInitScript(sv => { if (!localStorage.getItem('deepstack.v1')) localStorage.setItem('deepstack.v1', sv); }, save);
    await page.goto(url, {waitUntil: 'load'});
    await page.locator('#bUnl').waitFor({state: 'visible', timeout: T}).catch(() => note(key, 'home never rendered'));
    await page.waitForTimeout(1200);
    const shot = name => page.screenshot({path: join(OUT, `${key}-${name}.png`)});
    try {
      if (process.env.TRACE) console.log(new Date().toISOString().slice(11, 19), key, 'start');
      // 1. Home, Unlimited book unplaced
      await shot('1-home');
      await checkScreen(key, 'home', page);
      await page.locator('#bUnl').click({timeout: 5000});
      await page.locator('[role=dialog].intro').first().waitFor({state: 'visible', timeout: T}).catch(() => note(key, 'Unlimited book did not open'));
      await page.waitForTimeout(800);
      await shot('2-unlimited-book');
      await checkScreen(key, 'unlimited book (unplaced)', page);
      await page.locator('[role=dialog].intro button.bs-primary:not([data-act])').first().click({timeout: 5000}).catch(() => note(key, 'Find my rank button missing'));
      // 2. Placement: 8 words
      for (let i = 0; i < 8; i++) {
        await page.locator('#stage .word').first().waitFor({state: 'visible', timeout: T}).catch(() => note(key, `placement word ${i + 1}: never shown`));
        await page.waitForTimeout(700);
        const s = await checkScreen(key, `placement word ${i + 1}`, page);
        if (s.wlabel && !s.wlabel.includes(`Word ${i + 1} of 8`)) note(key, `placement word ${i + 1}: label says "${s.wlabel}"`);
        if (i === 0) await shot('3-placement-word1');
        if (process.env.TRACE) console.log(new Date().toISOString().slice(11, 19), key, 'placement word', i + 1, 'shown');
        const a = await answer(page, key, i);
        step(key, `placement ${i + 1}: ${a ? a.word : '-'}`);
        await page.waitForTimeout(500);
        if (i === 0) await shot('4-placement-card1');
        await checkScreen(key, `placement card ${i + 1}`, page);
        await page.locator('#go').click({timeout: 5000}).catch(() => note(key, `placement ${i + 1}: continue not clickable`));
        await page.waitForTimeout(400);
      }
      // 3. Placed result
      await page.waitForTimeout(2200);
      await page.locator('#final:not([hidden])').waitFor({state: 'visible', timeout: T * 2}).catch(() => note(key, 'placement result never shown'));
      await page.waitForTimeout(1200);
      await shot('5-placed-result');
      const fin = await checkScreen(key, 'placement result', page);
      step(key, `placement result: ${fin.lexText ? fin.lexText.slice(0, 160) : '(none)'}`);
      if (fin.lexText && !/placement|unlimited/i.test(fin.lexText)) note(key, 'placement result: no Unlimited kicker');
      if (fin.lexText && !/You are placed as a/.test(fin.lexText)) note(key, 'placement result: no "You are placed as a" line');
      const rPlaced = await savedRating(page, room);
      step(key, `saved rating after placement: ${JSON.stringify(rPlaced)}`);
      if (!rPlaced || !Number.isFinite(rPlaced.L) || rPlaced.L < 0.3 || rPlaced.L > 9.8) note(key, `placement: saved rating L is not a number in range: ${JSON.stringify(rPlaced)}`);
      if (rPlaced && (!rPlaced.placed || rPlaced.n !== 8 || rPlaced.runs !== 1)) note(key, `placement: saved rating wrong (want placed, n 8, runs 1): ${JSON.stringify(rPlaced)}`);
      // 4. Home after placing: the Unlimited book now reads the rank; Descend first offers the unplayed Daily
      await page.locator('#up').click({timeout: 5000}).catch(() => note(key, 'ascend button missing'));
      await page.waitForTimeout(2600);
      await page.locator('#bUnl').waitFor({state: 'visible', timeout: T}).catch(() => note(key, 'home did not return after placement'));
      await page.waitForTimeout(800);
      const home2 = await checkScreen(key, 'home after placement', page);
      await shot('6-home-placed');
      step(key, `home after placement: unlimited badge "${await page.locator('#bUnl').innerText().catch(() => '')}"`);
      // 5. Unlimited run: the book's Descend button (7 words)
      await page.locator('#mark').click({timeout: 3000}).catch(() => {});
      await page.waitForTimeout(900);
      await page.locator('#bUnl').click({timeout: 5000}).catch(() => note(key, 'Unlimited book click failed (run 2)'));
      await page.locator('[role=dialog].intro').first().waitFor({state: 'visible', timeout: T}).catch(() => note(key, 'Unlimited book did not reopen'));
      await page.waitForTimeout(900);
      const bookTxt = await page.locator('[role=dialog].intro').first().innerText().catch(() => '');
      if (!/lexicon \d+/i.test(bookTxt)) note(key, 'placed Unlimited book shows no Lexicon number');
      if (/NaN|undefined/.test(bookTxt)) note(key, 'placed Unlimited book: bad value text');
      await shot('7-unlimited-book-placed');
      await checkScreen(key, 'unlimited book (placed)', page);
      await page.locator('[role=dialog].intro button.bs-primary:not([data-act])').first().click({timeout: 5000}).catch(() => note(key, 'Descend button missing from placed book'));
      for (let i = 0; i < 7; i++) {
        await page.locator('#stage .word').first().waitFor({state: 'visible', timeout: T}).catch(() => note(key, `run word ${i + 1}: never shown`));
        await page.waitForTimeout(700);
        const s = await checkScreen(key, `run word ${i + 1}`, page);
        if (s.wlabel && !s.wlabel.includes(`Word ${i + 1} of 7`)) note(key, `run word ${i + 1}: label says "${s.wlabel}"`);
        if (i === 2) await shot('8-run-word3');
        const a = await answer(page, key, i + 1);
        step(key, `run ${i + 1}: ${a ? a.word : '-'}`);
        await page.waitForTimeout(500);
        if (s.dnum !== null && !/^-?\d+$/.test(s.dnum)) note(key, `run word ${i + 1}: depth readout "${s.dnum}"`);
        await page.locator('#go').click({timeout: 5000}).catch(() => note(key, `run ${i + 1}: continue not clickable`));
        await page.waitForTimeout(400);
      }
      await page.waitForTimeout(2600);
      await page.locator('#final:not([hidden])').waitFor({state: 'visible', timeout: T * 2}).catch(() => note(key, 'run result never shown'));
      await page.waitForTimeout(1200);
      await shot('9-run-result');
      const runRes = await checkScreen(key, 'run result', page);
      step(key, `run result: ${runRes.lexText ? runRes.lexText.slice(0, 160) : '(none)'}`);
      if (runRes.lexText && !/lexicon \d+/i.test(runRes.lexText)) note(key, 'run result: no Lexicon line');
      const rRun = await savedRating(page, room);
      step(key, `saved rating after run: ${JSON.stringify(rRun)}`);
      if (!rRun || !Number.isFinite(rRun.L) || rRun.n !== 15 || rRun.runs !== 2) note(key, `run: saved rating wrong (want n 15, runs 2): ${JSON.stringify(rRun)}`);
      // 6. Back home after the run
      await page.locator('#up').click({timeout: 5000}).catch(() => {});
      await page.waitForTimeout(2600);
      await page.locator('#bUnl').waitFor({state: 'visible', timeout: T}).catch(() => note(key, 'home did not return after run'));
      await shot('10-home-after-run');
      await checkScreen(key, 'home after run', page);
      const err = [...new Set(errs)];
      if (err.length) note(key, 'errors: ' + err.slice(0, 4).join(' || '));
    } catch (e) {
      note(key, 'walk stopped: ' + e.message.split('\n')[0]);
      await shot('error').catch(() => {});
    }
    console.log(key, (report.rooms[key].problems || []).length, 'problems');
    await ctx.close();
  }
}
await browser.close();
server.close();
await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
