// Shoots the Almanac progress options in context: the real built app, a seeded three-week save, the Stats book open,
// and the option's leaves dropped into the first spread. Usage: node design/almanac-stats/shoot.mjs [outDir] [--only=A,B]
// Run after `npx vite build`. Prints a line per shot with any overflow found. Skips (exit 0) without a browser.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {OPTIONS, fixtureSave} from './options.mjs';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png'};
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
if (!chromium) { console.log('almanac-shoot: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('almanac-shoot: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const args = process.argv.slice(2);
const only = (args.find(a => a.startsWith('--only=')) || '--only=before,A,B,C').slice(7).split(',');
const outDir = resolve(args.find(a => !a.startsWith('--')) || 'screenshots/almanac-stats');
await mkdir(outDir, {recursive: true});
const css = await readFile(new URL('./options.css', import.meta.url), 'utf8');
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const seed = fixtureSave();
const SIZES = [{w: 1280, h: 800, tag: '1280'}, {w: 375, h: 740, tag: '375'}];
const problems = [];

async function shot(name, size, leaves) {
  const ctx = await browser.newContext({viewport: {width: size.w, height: size.h}, reducedMotion: 'reduce', deviceScaleFactor: 2, timezoneId: 'UTC'});
  const page = await ctx.newPage();
  page.on('pageerror', e => problems.push(`${name}: page error ${e.message}`));
  await page.route('**/*', r => (BLOCKED.test(r.request().url()) ? r.abort() : r.continue()));
  await page.addInitScript(s => localStorage.setItem('deepstack.v1', JSON.stringify(s)), seed);
  await page.goto(url);
  await page.waitForSelector('#bStats', {state: 'visible', timeout: 15000});
  await page.waitForTimeout(1200);
  await page.click('#bStats', {timeout: 5000});
  await page.waitForSelector('.bk-spread.menu .alm', {state: 'visible', timeout: 10000});
  await page.waitForTimeout(600);
  if (leaves) {
    await page.addStyleTag({content: css});
    await page.evaluate(([L, R]) => {
      const sp = document.querySelector('.bk-spread.menu');
      const alms = [...sp.querySelectorAll('.alm')];
      if (L) alms[0].outerHTML = L;
      if (R) alms[1].outerHTML = R;
    }, leaves);
  }
  if (name.startsWith('after')) { // the built page: turn to the progress spread
    for (let t = 0; t < 12; t++) { if (await page.evaluate(() => [...document.querySelectorAll('.alm.pg')].some(a => a.getBoundingClientRect().width > 0))) break; await page.keyboard.press('ArrowRight'); await page.waitForTimeout(350); }
  }
  await page.waitForTimeout(400);
  const report = await page.evaluate(() => {
    const out = [];
    if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
    for (const a of document.querySelectorAll('.bk-spread.menu .alm')) {
      const p = a.parentElement.getBoundingClientRect(), r = a.getBoundingClientRect();
      if (a.scrollHeight > a.clientHeight + 2 || r.bottom > p.bottom + 1) out.push(`leaf overflows its page by ${Math.round(Math.max(a.scrollHeight - a.clientHeight, r.bottom - p.bottom))}px`);
      if (a.scrollWidth > a.clientWidth + 1) out.push('leaf is wider than its page');
    }
    return out;
  });
  await page.screenshot({path: join(outDir, `${name}.png`)});
  console.log(`${name}: ${report.length ? report.join('; ') : 'fits'}`);
  await ctx.close();
}

for (const size of SIZES) {
  if (only.includes('before')) await shot(`before-${size.tag}`, size, null);
  if (only.includes('after')) await shot(`after-${size.tag}`, size, null);
  for (const key of ['A', 'B', 'C']) {
    if (!only.includes(key)) continue;
    const [L, R] = OPTIONS[key](seed);
    await shot(`option-${key}-${size.tag}`, size, [L, R]);
  }
}
await browser.close(); server.close();
if (problems.length) { console.error('almanac-shoot: problems\n' + problems.join('\n')); process.exit(1); }
