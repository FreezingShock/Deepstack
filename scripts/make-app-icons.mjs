// Writes the installable-app artwork: public/icons/* (favicon, app icons, maskable icon, apple-touch-icon) and
// public/splash/* (iOS launch images for the common iPhone sizes). One source: the SVG below, drawn in the game's own
// palette (oak rail, gilt bands, parchment labels, the spine colours from src/theme/colors.js).
// Run after changing the art: `node scripts/make-app-icons.mjs` (needs Playwright's Chromium, which renders the PNGs).
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const ROOT = process.cwd();
const FONT = pathToFileURL(join(ROOT, 'public/fonts/anthropic-serif/Text-Medium.woff2')).href;

// The art lives in a 512 box and stays inside the maskable safe zone (a circle of radius 205 at the centre), so the same drawing works as
// a full-bleed icon, a rounded icon and an Android adaptive icon.
const BOOKS = [
  // x, width, height, spine colour, shade
  [134, 50, 180, '#2b4066', '#141f36'],
  [186, 42, 200, '#6e2228', '#36100f'],
  [230, 56, 168, '#2f6160', '#143030'],
  [288, 44, 192, '#a07a2c', '#4e3a10'],
  [334, 48, 158, '#54324f', '#2a1428'],
];
const SHELF_Y = 340;

// `scale` shrinks the drawing inside a full-bleed background (the maskable icon); the background itself is never scaled.
function artwork(scale = 1) {
  const books = BOOKS.map(([x, w, h, c, dk], i) => {
    const top = SHELF_Y - h, mid = top + h / 2;
    return `<g>
  <rect x="${x}" y="${top}" width="${w}" height="${h}" rx="3" fill="url(#spine${i})"/>
  <rect x="${x + 3}" y="${top + 14}" width="${w - 6}" height="6" fill="#d8b676"/>
  <rect x="${x + 3}" y="${SHELF_Y - 20}" width="${w - 6}" height="6" fill="#d8b676"/>
  <rect x="${x + w / 2 - 10}" y="${mid - 19}" width="20" height="38" rx="1.5" fill="#efe0b4" opacity=".92"/>
  <rect x="${x + w / 2 - 6}" y="${mid - 11}" width="12" height="2" fill="#2a2013" opacity=".6"/>
  <rect x="${x + w / 2 - 6}" y="${mid - 3}" width="12" height="2" fill="#2a2013" opacity=".6"/>
  <rect x="${x + w / 2 - 6}" y="${mid + 5}" width="8" height="2" fill="#2a2013" opacity=".6"/>
</g>`;
  }).join('\n');
  const grads = BOOKS.map(([, , , c, dk], i) => `<linearGradient id="spine${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${dk}"/></linearGradient>`).join('');
  return `<defs>
  <radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#4a3420"/><stop offset=".5" stop-color="#1b130c"/><stop offset="1" stop-color="#0a0604"/></radialGradient>
  <radialGradient id="lamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f0d9a6" stop-opacity=".34"/><stop offset="1" stop-color="#f0d9a6" stop-opacity="0"/></radialGradient>
  <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5630"/><stop offset=".15" stop-color="#5b3a1d"/><stop offset="1" stop-color="#2b1c10"/></linearGradient>
  ${grads}
</defs>
<rect width="512" height="512" fill="url(#bg)"/>
<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
<circle cx="256" cy="210" r="210" fill="url(#lamp)"/>
${books}
<ellipse cx="256" cy="${SHELF_Y + 14}" rx="160" ry="8" fill="#000" opacity=".45"/>
<rect x="112" y="${SHELF_Y}" width="288" height="14" rx="2" fill="url(#plank)"/>
<rect x="112" y="${SHELF_Y}" width="288" height="2" fill="#d8b676" opacity=".5"/>
</g>`;
}

const svgDoc = (inner, size = 512) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">${inner}</svg>`;

// Splash: the same art above a gilt wordmark, centred. Sized in CSS pixels, so it scales with the screen.
function splashHtml(w, h, dpr) {
  const iconPx = Math.round(w * 0.36);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Anthropic Serif';font-weight:500;src:url('${FONT}') format('woff2')}
html,body{margin:0;height:100%;background:#120c07}
.s{position:relative;width:${w}px;height:${h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(w * 0.05)}px;
  background:radial-gradient(ellipse at 50% 40%,#3a2819 0%,#1b130c 45%,#0a0604 100%)}
.s svg{width:${iconPx}px;height:${iconPx}px;border-radius:${Math.round(iconPx * 0.22)}px;box-shadow:0 ${Math.round(iconPx * .08)}px ${Math.round(iconPx * .3)}px rgba(0,0,0,.6)}
.s p{margin:0;font:500 ${Math.round(w * 0.085)}px/1 'Anthropic Serif',Georgia,serif;letter-spacing:.04em;color:#f0d9a6}
.s i{display:block;width:${Math.round(w * 0.22)}px;height:1px;background:#b08a56;opacity:.7}
</style></head><body><div class="s">${svgDoc(artwork(1), iconPx).replace(/width="\d+" height="\d+"/, '')}<p>Deepstack</p><i></i></div></body></html>`;
}

// Device sizes (CSS px @ scale), each a common iPhone. The file names are the device pixel sizes Apple's launch-image links expect.
const SPLASH = [[375, 667, 2], [414, 896, 2], [375, 812, 3], [390, 844, 3], [393, 852, 3], [414, 736, 3], [428, 926, 3], [430, 932, 3], [440, 956, 3]];
const ICONS = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
try {
  await mkdir(join(ROOT, 'public/icons'), {recursive: true});
  await mkdir(join(ROOT, 'public/splash'), {recursive: true});

  // The vector source, committed so the favicon and the docs can point at it.
  await writeFile(join(ROOT, 'public/icons/icon.svg'), svgDoc(artwork(1)));

  const shot = async (html, w, h, dpr, file) => {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: dpr});
    const page = await ctx.newPage();
    await page.setContent(html, {waitUntil: 'load'});
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path: file, type: 'png', omitBackground: false});
    await ctx.close();
  };

  // The art is a 512 drawing; the svg is sized to the viewport so each PNG is exactly the size it is named for.
  const iconHtml = (px, scale = 1) => `<!doctype html><html><head><style>html,body{margin:0;background:#120c07}svg{display:block}</style></head><body>${
    svgDoc(artwork(scale), px)}</body></html>`;
  for (const s of ICONS) await shot(iconHtml(s), s, s, 1, join(ROOT, `public/icons/icon-${s}.png`));
  // maskable: the art sits at 80% so launchers that crop to a circle or squircle keep the books in view
  await shot(iconHtml(512, 0.8), 512, 512, 1, join(ROOT, 'public/icons/icon-maskable-512.png'));
  await shot(iconHtml(32), 32, 32, 1, join(ROOT, 'public/icons/favicon-32.png'));
  await shot(iconHtml(180), 180, 180, 1, join(ROOT, 'public/icons/apple-touch-icon.png'));

  for (const [w, h, dpr] of SPLASH) await shot(splashHtml(w, h, dpr), w, h, dpr, join(ROOT, `public/splash/splash-${w * dpr}x${h * dpr}.png`));
  console.log(`wrote ${ICONS.length + 4} icons and ${SPLASH.length} launch images`);
} finally {
  await browser.close();
}
