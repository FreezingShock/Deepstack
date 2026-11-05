// Text-fit sweep: opens home, a run, the Shelf and Settings at every text size, at phone and desktop width,
// and fails when any text is clipped by its own box or runs off screen.
//   node scripts/text-fit.mjs            run after `npm run build`
//   node scripts/text-fit.mjs --selftest prove the detector fires on a deliberately broken label (no build needed)
// Skips (exit 0) when no Chromium is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {findClipped} from './lib/textFit.mjs';

const SELFTEST = process.argv.includes('--selftest');
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
if (!chromium) { console.log('text-fit: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('text-fit: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

if (SELFTEST) {
  const page = await browser.newPage({viewport: {width: 375, height: 700}});
  await page.setContent('<body><b id="bad" style="display:block;width:60px;overflow:hidden;white-space:nowrap">A deliberately overlong label</b><i style="display:block">fine</i></body>');
  const hits = await page.evaluate(findClipped);
  await browser.close(); server.close();
  if (hits.length !== 1 || !hits[0].el.includes('#bad')) { console.error('text-fit selftest FAILED: expected exactly the broken label, got', JSON.stringify(hits)); process.exit(1); }
  console.log('text-fit selftest: ok (flagged ' + hits[0].el + ': ' + hits[0].why + ')');
  process.exit(0);
}

const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const T = 15000;
const SIZES = ['normal', 'large', 'xlarge'];
const VIEWS = [{name: '375', width: 375, height: 700}, {name: '1280', width: 1280, height: 800}];
const problems = [];

async function scan(page, tag) {
  await page.waitForTimeout(700); // let entrance transitions settle so we measure the final layout
  for (const h of await page.evaluate(findClipped)) problems.push(`${tag}: ${h.el} "${h.text}": ${h.why}`);
}

for (const view of VIEWS) for (const size of SIZES) {
  const ctx = await browser.newContext({viewport: {width: view.width, height: view.height}});
  await ctx.addInitScript(s => { try { localStorage.setItem('deepstack.settings.v1', JSON.stringify({text: s, motion: 'reduce'})); } catch {} }, size);
  const page = await ctx.newPage();
  await page.route(BLOCKED, r => r.request().url().includes('fonts.googleapis') ? r.fulfill({status: 200, contentType: 'text/css', body: ''}) : r.abort());
  const tag = (scene) => `${view.name}px ${size} ${scene}`;
  const run = async (scene, fn) => { try { await fn(); } catch (e) { problems.push(`${tag(scene)}: could not reach this screen (${e.message.split('\n')[0]})`); } };
  await page.goto(url, {waitUntil: 'load'});
  await run('home', async () => { await page.locator('#bPlay, #bRes').first().waitFor({state: 'visible', timeout: T}); await scan(page, tag('home')); });
  await run('settings', async () => {
    await page.locator('#bSettings').click({timeout: T});
    await page.locator('#topPanel .tpbox').waitFor({state: 'visible', timeout: T});
    await scan(page, tag('settings'));
    await page.keyboard.press('Escape');
    await page.locator('#topPanel').waitFor({state: 'hidden', timeout: T});
  });
  await run('shelf', async () => {
    await page.locator('#bAll').click({timeout: T});
    await page.locator('[role=dialog].intro').first().waitFor({state: 'visible', timeout: T});
    await scan(page, tag('shelf'));
    await page.keyboard.press('Escape');
    await page.locator('[role=dialog].intro').waitFor({state: 'detached', timeout: T});
  });
  await run('run', async () => {
    await page.locator('#home.book-opening').waitFor({state: 'detached', timeout: T}).catch(() => {});
    await page.locator('#bPlay, #bUnl').first().click({timeout: T});
    const primary = page.locator('[role=dialog].intro button.bs-primary:not([data-act])').first();
    if (await primary.count()) await primary.click({timeout: T});
    await page.locator('#stage .word').waitFor({state: 'visible', timeout: T});
    await scan(page, tag('run'));
  });
  await ctx.close();
}

await browser.close(); server.close();
if (problems.length) { console.error(`text-fit: FAILED (${problems.length})\n - ` + [...new Set(problems)].join('\n - ')); process.exit(1); }
console.log('text-fit: ok (home, settings, shelf, run x normal/large/xlarge x 375/1280)');
