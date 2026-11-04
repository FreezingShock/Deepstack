import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {afterFirstPaint, deferAfterPaint} from '../src/core/boot.js';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

// self-hosted fonts
test('index.html makes no third-party request', () => {
    assert.doesNotMatch(read('index.html'), /https?:\/\//);
});
test('no stylesheet imports or links Google Fonts', () => {
    for (const f of readdirSync(new URL('../src/ui', import.meta.url)).filter(f => f.endsWith('.css')))
      assert.doesNotMatch(read('src/ui/' + f), /fonts\.(googleapis|gstatic)\.com/, f);
    assert.doesNotMatch(read('src/styles.css'), /fonts\.(googleapis|gstatic)\.com/);
});
test('every @font-face file exists in public/', () => {
    const css = read('src/ui/googleFonts.css') + read('src/ui/fonts.css');
    const urls = [...css.matchAll(/url\('(\/fonts\/[^']+)'\)/g)].map(m => m[1]);
    assert.ok(urls.length > 10);
    for (const u of urls) assert.ok(existsSync(new URL('../public' + u, import.meta.url)), u);
});
test('covers every family the game draws with', () => {
    const css = read('src/ui/googleFonts.css');
    for (const fam of ['Cinzel', 'Fuzzy Bubbles', 'IM Fell English', 'Newsreader', 'Source Sans 3', 'Special Elite']) assert.ok(css.includes(`font-family:'${fam}'`), fam);
});
test('preloads only fonts that exist', () => {
    for (const m of read('index.html').matchAll(/rel="preload" as="font"[^>]*href="([^"]+)"/g)) assert.ok(existsSync(new URL('../public' + m[1], import.meta.url)), m[1]);
});

// deferred start
test('runs the callback only after the paint and idle gates, and passes its result through', async () => {
    const order = [];
    const p = deferAfterPaint(() => { order.push('fn'); return 42; });
    order.push('sync');
    assert.equal(await p, 42);
    assert.deepEqual(order, ['sync', 'fn']);
});
test('resolves even without rAF or idle callbacks', async () => {
    assert.equal(await afterFirstPaint(10), undefined);
});
