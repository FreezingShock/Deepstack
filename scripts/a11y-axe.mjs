import {createServer} from 'node:http';
// Accessibility guard (axe-core, WCAG 2.x A and AA rules), run after `npm run build`, reduced motion on.
// Scans every topic room at 375px and 1280px: the home screen, every menu book it opens, and the word screen (the run).
// Fails on any violation that is not in the allowlist below. Set A11Y_REPORT=1 to print every violation with its nodes.
// Skips (exit 0) when no Chromium is available, like smoke.mjs. Set CHROMIUM_PATH to use your own.

import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {extname, join, normalize} from 'node:path';

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
catch { try { ({chromium} = createRequire(import.meta.url)('playwright')); } catch {} }
if (!chromium) { console.log('a11y-axe: playwright not available, skipping'); server.close(); process.exit(0); }
let browser;
try { browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}); }
catch (e) { console.log('a11y-axe: no browser, skipping:', e.message.split('\n')[0]); server.close(); process.exit(0); }

const AXE = await readFile(join(process.cwd(), 'node_modules/axe-core/axe.min.js'), 'utf8');
const BLOCKED = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|huggingface\.co|[^/]*\.hf\.co|cdn\.jsdelivr\.net)\//;
const ROOMS = ['hall', 'history', 'math', 'science', 'english', 'art', 'body'];
const VIEWS = [{w: 375, h: 667}, {w: 1280, h: 800}];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BOOKS = ['bDaily', 'bUnl', 'bAll', 'bRooms', 'bStats', 'bSettings'];
const REPORT = !!process.env.A11Y_REPORT;
const T = 15000;
const problems = [];
// Known, reviewed exceptions: {rule, room?, why}. Keep this empty unless a rule is a deliberate design choice.
const ALLOW = [];

async function open(view, room) {
  const ctx = await browser.newContext({viewport: {width: view.w, height: view.h}, reducedMotion: 'reduce', serviceWorkers: 'block'});
  await ctx.addInitScript(r => {
    try {
      localStorage.setItem('deepstack.v1', JSON.stringify({room: r === 'hall' ? undefined : r, streak: {last: '', n: 3}, daily: {}}));
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

const incomplete = []; // colour-contrast checks axe could not decide (text over images or gradients): reported, not failing
async function audit(page, tag, ctxSel = null) {
  await page.addScriptTag({content: AXE});
  const res = await page.evaluate(async ([tags, sel]) => {
    const root = (sel && document.querySelector(sel)) || document;
    const r = await window.axe.run(root, {runOnly: {type: 'tag', values: tags}, resultTypes: ['violations', 'incomplete']});
    const inc = r.incomplete.filter(v => v.id === 'color-contrast').flatMap(v => v.nodes.map(n => n.target.join(' ')));
    return {inc, violations: r.violations.map(v => ({id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map(n => ({target: n.target.join(' '), summary: (n.failureSummary || '').split('\n').slice(0, 2).join(' ')}))}))};
  }, [TAGS, ctxSel]);
  incomplete.push(...res.inc);
  for (const v of res.violations) {
    if (ALLOW.some(a => a.rule === v.id && (!a.room || tag.includes(a.room)))) continue;
    problems.push(`${tag}: [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}+ nodes)`);
    for (const n of v.nodes) problems.push(`      ${n.target}  ${n.summary}`);
    if (REPORT) for (const n of v.nodes) console.log(`    ${n.target}  ${n.summary}`);
  }
  return res.violations.length;
}

for (const view of VIEWS) for (const room of ROOMS) {
  const tag = `${view.w}px ${room}`;
  const {ctx, page} = await open(view, room);
  try {
    await audit(page, `${tag} home`);
    // every menu book and panel the home screen opens (each one closes again with Escape)
    for (const id of BOOKS) {
      const btn = page.locator(`#${id}`).first();
      if (!(await btn.count()) || !(await btn.isVisible().catch(() => false))) continue;
      await btn.click({timeout: T}).catch(() => {});
      // the book's own pages are the thing to check: the home buttons under it are still moving while it opens
      await page.locator('[role=dialog]:not([hidden]), #topPanel:not([hidden])').first().waitFor({state: 'visible', timeout: 3000}).catch(() => {});
      await page.waitForTimeout(150);
      await audit(page, `${tag} ${id}`, '[role=dialog]:not([hidden]), #topPanel:not([hidden])');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(350);
    }
    // the word screen: Descend (or Unlimited when Descend is already played), then the first word
    const play = page.locator('#bPlay, #bUnl').first();
    await play.click({timeout: T}).catch(e => problems.push(`${tag}: could not open the run: ${e.message.split('\n')[0]}`));
    const primary = page.locator('#bPlay, #bUnl, #bNext, .intro button.btn').filter({hasText: /Begin|Start|Descend|Play|Open|Continue/}).first();
    if (await primary.count()) await primary.click({timeout: 3000}).catch(() => {});
    await page.locator('#stage .word').waitFor({state: 'visible', timeout: T}).catch(() => {});
    if (await page.locator('#stage .word').count()) {
      await page.waitForTimeout(500);
      await audit(page, `${tag} run`);
    } else problems.push(`${tag}: word screen never appeared`);
  } catch (e) { problems.push(`${tag}: ${e.message.split('\n')[0]}`); }
  finally { await ctx.close(); }
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`a11y-axe: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (incomplete.length) console.log(`a11y-axe: ${incomplete.length} colour-contrast check(s) axe could not decide (not failing): ${[...new Set(incomplete)].slice(0, 8).join(', ')}`);
console.log(`a11y-axe: ok (${ROOMS.length} rooms x ${VIEWS.map(v => v.w).join('/')}px, home and run, ${TAGS.join(' ')})`);
