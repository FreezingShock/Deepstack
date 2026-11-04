// Measures the load path of a built dist/: every request, who served it, gzip-equivalent bytes, and what had finished by first paint.
// Usage: node scripts/loadpath.mjs [distDir=dist] [--throttle]   (serves dist/ itself; set CHROMIUM_PATH if Playwright's browser is missing)
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {gzipSync} from 'node:zlib';

const dir = resolve(process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || 'dist');
const throttle = process.argv.includes('--throttle');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.woff2': 'font/woff2'};
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
    const body = await readFile(join(dir, p)), type = TYPES[extname(p)] || 'application/octet-stream';
    const gz = /json|javascript|css|html|wasm/.test(type); // what any real host does; woff2 is already compressed
    res.writeHead(200, {'content-type': type, ...(gz ? {'content-encoding': 'gzip'} : {})}).end(gz ? gzipSync(body) : body);
  } catch { res.writeHead(404).end('nf'); }
});
await new Promise(r => server.listen(0, r));
const origin = `http://localhost:${server.address().port}/`;
const {chromium} = await import('playwright');
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
const page = await browser.newPage({viewport: {width: 1280, height: 800}});
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
if (throttle) await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8}); // "slow 4G"
const reqs = new Map(), t0 = Date.now();
cdp.on('Network.requestWillBeSent', e => reqs.set(e.requestId, {url: e.request.url, t: Date.now() - t0, type: e.type}));
cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; r.done = Date.now() - t0; } });
await page.addInitScript(() => { window.__paint = {}; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__paint[e.name] = Math.round(e.startTime); }).observe({type: 'paint', buffered: true}); });
await page.goto(origin, {waitUntil: 'commit'});
await page.waitForSelector('#home *', {state: 'attached', timeout: 60000});
await page.waitForFunction(() => window.__paint['first-contentful-paint'] != null, null, {timeout: 60000});
const fcp = await page.evaluate(() => window.__paint['first-contentful-paint']);
await page.waitForTimeout(throttle ? 15000 : 6000);
const label = u => { const h = new URL(u).host; return h === new URL(origin).host ? 'self' : h; };
const rows = [...reqs.values()].filter(r => r.bytes != null);
const sum = f => rows.filter(f).reduce((a, r) => a + r.bytes, 0);
const kb = n => (n / 1024).toFixed(0).padStart(6) + ' KB';
console.log(`first-contentful-paint ${fcp} ms${throttle ? ' (slow 4G)' : ''}`);
console.log('requests', rows.length, ' third-party', rows.filter(r => label(r.url) !== 'self').length);
console.log('bytes before FCP ', kb(sum(r => r.done <= fcp + 50)), ' after', kb(sum(r => r.done > fcp + 50)));
for (const [name, re] of [['html+js+css', /\.(html|js|css)(\?|$)/], ['fonts', /\.woff2/], ['words.json', /words.*\.json/], ['model/wasm', /models\/|\.onnx|\.wasm/]])
  console.log(name.padEnd(12), kb(sum(r => re.test(r.url))), ' first request at', Math.min(...rows.filter(r => re.test(r.url)).map(r => r.t), Infinity), 'ms, last done at', Math.max(...rows.filter(r => re.test(r.url)).map(r => r.done), 0), 'ms');
for (const r of rows.filter(r => label(r.url) !== 'self')) console.log('3rd party:', label(r.url), r.url.split('/').pop().slice(0, 40), kb(r.bytes));
await browser.close(); server.close();
