// Headless smoke test: serve dist/ and make sure the app boots without page errors.
// Skips (exit 0) if no Chromium is available so local runs without a browser still work.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
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
catch { try { ({chromium} = (await import('node:module')).createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('smoke: playwright not available, skipping'); server.close(); process.exit(0); }

let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('smoke: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const errors = [];
const page = await browser.newPage();
page.on('pageerror', e => errors.push(e.message));
await page.goto(url, {waitUntil: 'load'});
await page.waitForTimeout(1500);
const bodyLen = await page.evaluate(() => document.body.innerText.length + document.querySelectorAll('canvas').length);
await browser.close(); server.close();
if (errors.length) { console.error('smoke: page errors:\n' + errors.join('\n')); process.exit(1); }
if (!bodyLen) { console.error('smoke: page rendered nothing'); process.exit(1); }
console.log('smoke: ok');
