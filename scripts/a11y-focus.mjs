// Keyboard focus guard, run after `npm run build`, reduced motion on. Tabs through the home screen of every topic room
// at 375px and 1280px and checks each stop: it has a name a screen reader can say, and it shows a visible focus ring
// (an outline or box-shadow on :focus-visible). Set A11Y_REPORT=1 to print every stop.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
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
catch { try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('a11y-focus: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('a11y-focus: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [{w: 375, h: 667}, {w: 1280, h: 800}];
const STOPS = 40; // tab stops checked per screen
const REPORT = !!process.env.A11Y_REPORT;
const T = 15000;
const problems = [];

async function open(view, room) {
  const ctx = await browser.newContext({viewport: {width: view.w, height: view.h}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  await ctx.addInitScript(r => {
    try {
      localStorage.setItem('deepstack.v1', JSON.stringify({room: r === 'hall' ? undefined : r, shelf: [{w: 'word0', word: 'word0', s: 60, t: Date.now()}], bestDepth: 900, bestFloor: 2, streak: {last: '', n: 3}, daily: {}}));
      localStorage.setItem('deepstack.settings.v1', JSON.stringify({motion: 'reduce'}));
    } catch {}
  }, room);
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  page.on('pageerror', e => problems.push(`${view.w}px ${room}: pageerror ${e.message}`));
  await page.goto(url, {waitUntil: 'load'});
  await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T});
  await page.waitForTimeout(400);
  return {ctx, page};
}

// Describe the focused element: its name as a screen reader would say it, and whether it draws a focus ring.
const describe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
  const name = el.getAttribute('aria-label') || el.getAttribute('title') || (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ') || el.id || el.className || el.tagName;
  return {tag: el.tagName.toLowerCase(), id: el.id, name: String(name).slice(0, 60), ring};
};

for (const view of VIEWS) for (const room of ROOMS) {
  const tag = `${view.w}px ${room}`;
  const {ctx, page} = await open(view, room);
  try {
    const seen = new Set();
    for (let i = 0; i < STOPS; i++) {
      await page.keyboard.press('Tab');
      const s = await page.evaluate(describe);
      if (!s) { if (REPORT) console.log(`    ${tag} stop ${i + 1}: focus is on the page`); continue; }
      const key = `${s.tag}#${s.id}:${s.name}`;
      if (REPORT) console.log(`    ${tag} stop ${i + 1}: ${s.tag}${s.id ? '#' + s.id : ''} "${s.name}"${s.ring ? '' : '  NO RING'}`);
      if (!s.ring && !seen.has(key)) problems.push(`${tag}: no visible focus ring on ${s.tag}${s.id ? '#' + s.id : ''} "${s.name}"`);
      if (!s.name || /^[\w-]+$/.test(s.name) && s.name === s.id) { if (!seen.has(key)) problems.push(`${tag}: stop ${i + 1} has no spoken name (${s.tag}${s.id ? '#' + s.id : ''})`); }
      seen.add(key);
    }
  } catch (e) { problems.push(`${tag}: ${e.message.split('\n')[0]}`); }
  finally { await ctx.close(); }
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`a11y-focus: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`a11y-focus: ok (${ROOMS.length} rooms x ${VIEWS.map(v => v.w).join('/')}px, ${STOPS} tab stops each)`);
