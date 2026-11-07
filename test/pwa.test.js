// Installable-app guards: the manifest, the icon and launch-image files it and index.html point at, the iOS meta tags, and the safe-area
// padding that keeps the top rail clear of a notch. Static checks, so they run in `npm test` without a browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const pub = p => join('public', p);
const html = readFileSync('index.html', 'utf8');
const manifest = JSON.parse(readFileSync(pub('manifest.webmanifest'), 'utf8'));

// PNG width/height come from the IHDR chunk: bytes 16..23, big-endian.
function pngSize(path) {
  const b = readFileSync(path);
  assert.equal(b.readUInt32BE(0), 0x89504e47, `${path} is not a PNG`);
  return {w: b.readUInt32BE(16), h: b.readUInt32BE(20)};
}

test('manifest asks for a standalone app with a name, colours and a start URL', () => {
  assert.equal(manifest.name, 'Deepstack');
  assert.equal(manifest.short_name, 'Deepstack');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
});

test('every manifest icon exists and is the size it declares', () => {
  for (const icon of manifest.icons) {
    const file = pub(icon.src.replace(/^\//, ''));
    assert.ok(existsSync(file), `${icon.src} is missing from public/`);
    if (icon.type !== 'image/png') continue;
    const [w, h] = icon.sizes.split('x').map(Number);
    assert.deepEqual(pngSize(file), {w, h}, `${icon.src} size`);
  }
});

test('the manifest has the sizes Android and iOS ask for, plus a maskable icon', () => {
  const sizes = new Set(manifest.icons.map(i => i.sizes));
  for (const s of ['192x192', '512x512']) assert.ok(sizes.has(s), `missing ${s}`);
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable'), 'no maskable icon');
  assert.ok(manifest.icons.some(i => i.purpose === 'any' && i.sizes === '512x512'), 'no 512 any icon');
});

test('index.html links the manifest, the apple icon and the theme colour, and uses the standalone meta tags', () => {
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="\/icons\/apple-touch-icon\.png">/);
  assert.match(html, /<meta name="theme-color" content="#1b130c">/);
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes">/);
  assert.match(html, /<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">/);
  assert.match(html, /<meta name="apple-mobile-web-app-title" content="Deepstack">/);
  // notch: the page draws under the status bar, so it must ask for the full screen
  assert.match(html, /viewport-fit=cover/);
});

test('every iOS launch image exists and matches its device media query', () => {
  const links = [...html.matchAll(/<link rel="apple-touch-startup-image" href="([^"]+)" media="([^"]+)">/g)];
  assert.ok(links.length >= 8, 'expected a launch image per common iPhone');
  for (const [, href, media] of links) {
    const file = pub(href.replace(/^\//, ''));
    assert.ok(existsSync(file), `${href} is missing`);
    const {w, h} = pngSize(file);
    const dpr = +/pixel-ratio: (\d)/.exec(media)[1];
    const cw = +/device-width: (\d+)px/.exec(media)[1], ch = +/device-height: (\d+)px/.exec(media)[1];
    assert.equal(w, cw * dpr, `${href} width`);
    assert.equal(h, ch * dpr, `${href} height`);
  }
});

test('the splash is painted by index.html itself, before any script runs', () => {
  assert.match(html, /<div id="splash" aria-hidden="true">/);
  assert.match(html, /#splash\{position:fixed;inset:0;/);
});

test('the top rail pads itself for the notch (safe-area inset), so the status bar never covers it', () => {
  const base = readFileSync('src/styles/base.css', 'utf8');
  const bar = /#bar\{[^}]*\}/.exec(base)[0];
  assert.match(bar, /padding:env\(safe-area-inset-top,0px\)/);
  assert.match(bar, /height:calc\(var\(--barH\) \+ env\(safe-area-inset-top,0px\)\)/);
});

test('the install tag sits clear of the notch and home bar', () => {
  const css = readFileSync('src/ui/installHint.css', 'utf8');
  assert.match(css, /bottom:max\(12px,env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(css, /right:max\(12px,env\(safe-area-inset-right,0px\)\)/);
});
