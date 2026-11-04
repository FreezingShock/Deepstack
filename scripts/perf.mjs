// Records frame-time stats headlessly: serve dist/, load with ?perf, sample for N seconds per scenario.
// Usage: npm run build && node scripts/perf.mjs [--secs 10] [--json out.json] [--viewport 1280x800] [--dpr 2]
// Set CHROMIUM_PATH to use a specific Chromium. Software rendering numbers are for before/after comparison, not absolute.
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {summarize, fmt} from '../src/ui/perfStats.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const secs = +arg('secs', 10), jsonOut = arg('json', ''), [vw, vh] = arg('viewport', '1280x800').split('x').map(Number), dpr = +arg('dpr', 1);
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
const url = `http://localhost:${server.address().port}/?perf`;

let chromium;
try { ({chromium} = await import('playwright')); } catch { console.log('perf: playwright not available'); process.exit(1); }
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const page = await (await browser.newContext({viewport: {width: vw, height: vh}, deviceScaleFactor: dpr})).newPage();
await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
await page.goto(url, {waitUntil: 'load'});
await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: 20000});

const results = {};
async function record(name) {
  await page.evaluate(() => window.__perf.reset());
  await page.waitForTimeout(secs * 1000);
  const {intervals, work} = await page.evaluate(() => ({intervals: window.__perf.intervals.slice(), work: window.__perf.work.slice()}));
  results[name] = summarize(intervals, work);
}
await page.waitForTimeout(1500);
await record('home');
if (await page.locator('#bPlay').count()) {
  await page.locator('#bPlay').click();
  await page.locator('#stage .word').waitFor({state: 'visible', timeout: 20000}).catch(() => {});
  await record('run');
  // descent: answer and let the camera travel
  await page.locator('#ans').click().catch(() => {});
  await page.keyboard.type('a thing that is the opposite of what you would expect');
  await page.evaluate(() => window.__perf.reset());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(Math.min(secs, 6) * 1000);
  const {intervals, work} = await page.evaluate(() => ({intervals: window.__perf.intervals.slice(), work: window.__perf.work.slice()}));
  results.descent = summarize(intervals, work);
}
await browser.close(); server.close();

console.log(`perf: ${vw}x${vh}@${dpr}x, ${secs}s per scenario\nscenario  frames   fps  p50   p95   p99   max  drop%  workAvg workP95`);
for (const [k, s] of Object.entries(results))
  console.log(`${k.padEnd(9)} ${String(s.frames).padStart(6)} ${fmt(s.fps, 0).padStart(5)} ${fmt(s.p50).padStart(5)} ${fmt(s.p95).padStart(5)} ${fmt(s.p99).padStart(5)} ${fmt(s.max).padStart(5)} ${fmt(s.droppedPct).padStart(5)} ${fmt(s.workAvg, 2).padStart(8)} ${fmt(s.workP95, 2).padStart(7)}`);
if (jsonOut) await writeFile(jsonOut, JSON.stringify(results, null, 2));
