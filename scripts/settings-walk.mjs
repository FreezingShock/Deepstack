// Settings walk: opens the Settings book and checks every section fits its page, at phone (375x667) and desktop (1280x800),
// with the OS reduced-motion flag on and off, every text size, every Motion choice and High contrast on and off.
// Sections checked: Sound, Motion, Display (text size, graphics, contrast), Play, Progress, and the reset confirm card.
// Fails when any element sticks out of its page, a page or the book scrolls, a page number is covered, the page
// itself is wider than the viewport, or a label is clipped (findClipped from lib/textFit.mjs).
//   node scripts/settings-walk.mjs               run after `npm run build`
//   node scripts/settings-walk.mjs --shots DIR   also save a screenshot of each page at phone and desktop, text size normal and xlarge
// Skips (exit 0) when no Chromium is available, like text-fit.mjs. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {findClipped} from './lib/textFit.mjs';

const SHOTS = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'};
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
if (!chromium) { console.log('settings-walk: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('settings-walk: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const T = 15000;
const VIEWS = [{name: 'phone', width: 375, height: 667}, {name: 'desktop', width: 1280, height: 800}];
const TEXTS = ['normal', 'large', 'xlarge'];
const MOTIONS = ['system', 'reduce', 'full'];
const problems = [];
const shotsTaken = [];
let checks = 0;

/* Runs in the page: every visible page of the open Settings book, plus the book itself. Returns a list of problems. */
function auditBook() {
  const out = [];
  const spread = document.querySelector('.bk-spread.panel');
  if (!spread) return [{where: 'book', why: 'Settings book is not open'}];
  const label = el => {
    const sec = el.closest('[aria-label]');
    const name = sec && sec.getAttribute('aria-label');
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return (name ? `[${name}] ` : '') + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };
  const vis = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const pages = [...spread.querySelectorAll('.bs-page')].filter(p => p.getClientRects().length && vis(p));
  if (!pages.length) out.push({where: 'book', why: 'no visible page'});
  pages.forEach(p => {
    const pr = p.getBoundingClientRect();
    const name = p.classList.contains('l') ? 'left page' : 'right page';
    // content taller or wider than its page box is cut off or scrolled: either way the section does not fit
    for (const box of [p, ...p.querySelectorAll('.pg-in')]) {
      if (box.scrollHeight > box.clientHeight + 1) out.push({where: name, why: `${box.className || 'page'} content ${box.scrollHeight}px tall in ${box.clientHeight}px`});
      // the page's own edge decoration (a pseudo-element) can reach past the page; the content boxes below are what must fit
      if (box !== p && box.scrollWidth > box.clientWidth + 1) out.push({where: name, why: `${box.className || 'page'} content ${box.scrollWidth}px wide in ${box.clientWidth}px`});
    }
    // each section row must hold its own controls: a row whose children stick out of it is a fault even when the page has room
    for (const row of p.querySelectorAll('.tprow,.tpseg,.sb-group,.sb-confirm,.sb-dangerrow,.sb-acts,.tphint')) {
      if (row.closest('.bs-corner,.pg-foot')) continue;
      const rr = row.getBoundingClientRect();
      if (row.scrollWidth > row.clientWidth + 1) out.push({where: name, why: `${label(row)} is ${row.scrollWidth}px wide in a ${row.clientWidth}px row`});
      for (const el of row.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        if (cs.position === 'absolute' && /rect\(0/.test(cs.clip)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        if (r.right > rr.right + 1 || r.left < rr.left - 1) out.push({where: name, why: `${label(el)} sticks out of its row by ${Math.round(Math.max(r.right - rr.right, rr.left - r.left))}px`});
      }
    }

    const foot = p.querySelector('.pg-foot');
    const fr = foot && foot.getBoundingClientRect();
    let bottom = -Infinity;
    for (const el of p.querySelectorAll('*')) {
      if (el.closest('.pg-foot,.bs-corner,.bs-cue,.bs-curl,.bs-flip')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      if (cs.position === 'absolute' && /rect\(0/.test(cs.clip)) continue; // sr-only helpers
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > pr.right + 1 || r.left < pr.left - 1) out.push({where: name, why: `${label(el)} spans ${Math.round(r.left - pr.left)}..${Math.round(r.right - pr.left)}px of a ${Math.round(pr.width)}px page`});
      if (r.bottom > pr.bottom + 1) out.push({where: name, why: `${label(el)} runs ${Math.round(r.bottom - pr.bottom)}px past the bottom of the page`});
      bottom = Math.max(bottom, r.bottom);
    }
    if (fr && bottom > fr.top + 1 && fr.height) out.push({where: name, why: `content reaches ${Math.round(bottom - fr.top)}px into the page number strip`});
  });
  // every control on a visible page must be what a tap at its centre reaches (a page-turn corner or another layer covering it is a fault)
  for (const p of pages) for (const c of p.querySelectorAll('button,input,[role="switch"],a')) {
    if (c.closest('.bs-corner,.pg-foot') || c.disabled || c.hidden) continue;
    const cs = getComputedStyle(c);
    if (cs.display === 'none' || cs.visibility === 'hidden' || c.getClientRects().length === 0) continue;
    const r = c.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const hit = document.elementFromPoint(x, y);
    if (hit && hit !== c && !c.contains(hit) && !hit.contains(c)) out.push({where: 'controls', why: `${label(c)} is covered at its centre by ${label(hit)}`});
  }
  for (const h of window.__findClipped(spread)) out.push({where: 'text', why: `${h.el} "${h.text}": ${h.why}`});
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.push({where: 'page', why: `page is ${document.documentElement.scrollWidth}px wide in a ${document.documentElement.clientWidth}px viewport`});
  return out;
}

/* Turn to the next page when the book is one-page (phone); returns false on the last page. */
async function nextPage(page) {
  const next = page.locator('.bk-spread.panel .bs-corner.next:not([hidden]):not([disabled])');
  if (!(await next.count())) return false;
  await next.first().click({timeout: T});
  await settle(page);
  return true;
}

/* Let the book's open, turn and confirm choreography finish: wait for every finite CSS animation or transition to end
   (looping ones, such as the candle, never end and are skipped). Without this a cover still swinging shut reads as a fault. */
async function settle(page) {
  await page.waitForTimeout(150);
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity), null, {timeout: 6000, polling: 50}).catch(() => {});
  await page.waitForTimeout(100);
}

/* One group per viewport and OS motion flag, run side by side; each group walks text x motion x contrast in one context. */
async function walkGroup(view, osReduce) {
  const ctx = await browser.newContext({viewport: {width: view.width, height: view.height}, reducedMotion: osReduce ? 'reduce' : 'no-preference'});
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  const phone = view.name === 'phone';
  for (const text of TEXTS) for (const motion of MOTIONS) for (const contrast of [false, true]) {
    const tag = `${view.name} os-${osReduce ? 'reduce' : 'full'} text-${text} motion-${motion} contrast-${contrast ? 'on' : 'off'}`;
    const shoot = SHOTS && (text === 'normal' || text === 'xlarge') && motion === 'system' && !contrast;
    const name = scene => `${SHOTS}/${view.name}-os-${osReduce ? 'reduce' : 'full'}-text-${text}-${scene}.png`;
    const scan = async scene => {
      checks++;
      for (const h of await page.evaluate(auditBook)) problems.push(`${tag} ${scene} ${h.where}: ${h.why}`);
    };
    try {
      await page.goto('about:blank');
      await page.evaluate(s => { try { localStorage.setItem('deepstack.settings.v1', JSON.stringify(s)); } catch {} }, {text, motion, contrast});
      await page.goto(url, {waitUntil: 'load'});
      await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T});
      await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => {});
      await page.addScriptTag({content: 'window.__findClipped=' + findClipped.toString()});
      await page.locator('#bSettings').first().waitFor({state: 'visible', timeout: T});
      await page.locator('#bSettings').first().click({timeout: T});
      await page.locator('.bk-spread.panel.open').first().waitFor({state: 'attached', timeout: T});
      await settle(page);
      await scan('open');
      if (shoot) { await mkdir(SHOTS, {recursive: true}); await page.screenshot({path: name('p1')}); shotsTaken.push(name('p1')); }
      if (phone) {
        for (let i = 2; i <= 4; i++) {
          if (!(await nextPage(page))) break;
          await scan(`page${i}`);
          if (shoot) { await page.screenshot({path: name('p' + i)}); shotsTaken.push(name('p' + i)); }
        }
      }
      // the reset confirm card, open (on the phone the loop above has turned to the last page, which holds Progress)
      const reset = page.locator('.bk-spread.panel #sReset');
      if (await reset.count()) {
        await reset.scrollIntoViewIfNeeded().catch(() => {});
        await reset.click({timeout: T});
        await settle(page);
        await scan('confirm');
        if (shoot) { await page.screenshot({path: name('confirm')}); shotsTaken.push(name('confirm')); }
        await page.locator('.bk-spread.panel #scKeep').click({timeout: T}).catch(() => {});
      }
      await page.keyboard.press('Escape');
      await page.locator('.bk-spread.panel').waitFor({state: 'detached', timeout: T}).catch(() => {});
    } catch (e) {
      problems.push(`${tag}: could not reach this screen (${e.message.split('\n').filter(l => l.trim()).slice(0, 4).join(' | ').slice(0, 400)})`);
    }
  }
  await ctx.close();
}

await Promise.all(VIEWS.flatMap(view => [true, false].map(osReduce => walkGroup(view, osReduce))));
await browser.close(); server.close();
if (problems.length) {
  const uniq = [...new Set(problems)];
  console.error(`settings-walk: FAILED (${uniq.length} problems in ${checks} checks)\n - ` + uniq.join('\n - '));
  process.exit(1);
}
if (SHOTS) console.log(`settings-walk: saved ${shotsTaken.length} screenshots to ${SHOTS}`);
console.log(`settings-walk: ok (${checks} checks: sound, motion, display, play, progress and reset confirm at phone and desktop, OS motion on and off, every text size, motion and contrast option)`);
