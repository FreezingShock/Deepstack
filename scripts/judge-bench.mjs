// Repeated-run check for the judge worker: serves dist/, loads the page N times in each mode (worker, forced main thread,
// worker blocked so the automatic fallback runs)
// and compares load time, scores and the longest animation-frame gap while answers are scored.
// Usage: npm run build && node scripts/judge-bench.mjs [runs=5]   (CHROMIUM_PATH optional). Exits 1 on any failed run or score mismatch.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {createRequire} from 'node:module';
import {WORDS} from '../src/core/words.js';

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.onnx': 'application/octet-stream'};
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (p.endsWith('/')) p += 'index.html';
    let body; try { body = await readFile(join('dist', p)); } catch { body = await readFile(join('public', p)); }
    res.writeHead(200, {'content-type': TYPES[extname(p)] || 'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
const {chromium} = createRequire(import.meta.url)('playwright');
const runs = +process.argv[2] || 5;
const picks = ['ephemeral', 'lucid', 'pernicious'].map(n => WORDS.find(w => w.w === n) || WORDS[0]);
const answers = ['lasting only a very short time', 'something that is clear and easy to understand', 'the opposite of good', 'a small furry animal', 'harmful in a gradual subtle way'];

async function once(mode) {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now();
  if (mode === 'worker-blocked') await page.route('**/assets/worker-*.js', r => r.abort()); // simulates a worker that cannot start
  await page.goto(url + (mode === 'main' ? '?judge=main' : ''), {waitUntil: 'load'});
  await page.waitForFunction(() => document.querySelector('canvas'), null, {timeout: 30000});
  const out = await page.evaluate(async ({picks, answers}) => {
    const gaps = []; let last = performance.now(), stop = false;
    const tick = t => { gaps.push(t - last); last = t; if (!stop) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    const w0 = picks[0]; // wait for the model: the first judged answer blocks up to 6s, so retry until the embedding engine answers
    for (let i = 0; i < 12 && (await window.__deepstack.judge('warm up', w0)).engine !== 'embedding'; i++);
    gaps.length = 0; last = performance.now();
    const scores = []; const t = performance.now();
    for (const w of picks) for (const a of answers) { const j = await window.__deepstack.judge(a, w); scores.push([j.score, j.engine]); }
    stop = true;
    return {scores, ms: performance.now() - t, maxGap: gaps.length > 1 ? Math.max(...gaps.slice(1)) : Infinity};
  }, {picks, answers});
  await browser.close();
  return {...out, loadMs: Date.now() - t0, errs};
}

let bad = 0; const byMode = {worker: [], main: [], 'worker-blocked': []};
for (let i = 0; i < runs; i++) for (const mode of ['worker', 'main', 'worker-blocked']) {
  try {
    const r = await once(mode); byMode[mode].push(r);
    const engines = new Set(r.scores.map(s => s[1]));
    console.log(`${mode} #${i + 1}: engines=${[...engines]} scoring=${r.ms.toFixed(0)}ms maxFrameGap=${r.maxGap.toFixed(0)}ms errors=${r.errs.length}`);
    if (r.errs.length || !engines.has('embedding') || engines.size > 1) bad++;
  } catch (e) { bad++; console.log(`${mode} #${i + 1}: FAILED ${e.message.split('\n')[0]}`); }
}
const ref = JSON.stringify(byMode.main[0]?.scores.map(s => s[0]));
for (const m of Object.keys(byMode)) for (const r of byMode[m]) if (JSON.stringify(r.scores.map(s => s[0])) !== ref) { bad++; console.log(`score mismatch in ${m}:`, JSON.stringify(r.scores.map(s => s[0]))); }
console.log('reference scores', ref);
server.close();
console.log(bad ? `judge-bench: ${bad} problem(s)` : 'judge-bench: all runs ok, scores identical');
process.exit(bad ? 1 : 0);
