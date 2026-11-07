// Book readability: the "more ↓" cue on long book pages, and the rules that keep the floors (type, touch) in place.
// The browser side is checked by scripts/book-readability.mjs; these tests pin the logic and the wiring.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd();
const css = readFileSync(join(root, 'src/ui/bookReadable.css'), 'utf8');
const main = readFileSync(join(root, 'src/main.js'), 'utf8');

// a tiny page stand-in: just what syncMore reads
function page({overflowY = 'auto', scrollHeight = 600, clientHeight = 400, scrollTop = 0} = {}) {
  const classes = new Set();
  return {
    scrollHeight, clientHeight, scrollTop, isConnected: true,
    classList: {toggle: (c, force) => { if (force) classes.add(c); else classes.delete(c); }, contains: c => classes.has(c)},
    _overflowY: overflowY,
    _classes: classes,
  };
}

globalThis.getComputedStyle = el => ({overflowY: el._overflowY});
const {syncMore} = await import('../src/ui/bookReadable.js');

test('a page with writing below its foot gets the more cue until it is read to the end', () => {
  const p = page({scrollTop: 0});
  syncMore(p);
  assert.equal(p.classList.contains('has-more'), true);
  p.scrollTop = 200; // 600 - 400 - 200 = 0: at the end
  syncMore(p);
  assert.equal(p.classList.contains('has-more'), false);
});

test('a page that fits never gets the cue, and a hidden overflow is never a scroll', () => {
  const fits = page({scrollHeight: 400, clientHeight: 400});
  syncMore(fits);
  assert.equal(fits.classList.contains('has-more'), false);
  const hidden = page({overflowY: 'hidden', scrollHeight: 900, clientHeight: 400});
  syncMore(hidden);
  assert.equal(hidden.classList.contains('has-more'), false);
});

test('the floors are written into the stylesheet, with the book selectors that need them', () => {
  assert.match(css, /\.bk-spread \.kicker,\.bk-spread \.pg-kicker[^{]*\{font-size:calc\(12\.5px\*var\(--ts\)\)!important\}/);
  assert.match(css, /min-height:44px!important/);
  assert.match(css, /\.bk-spread \.pg-in\.has-more\s*\{/);
  assert.match(css, /\.bk-spread \.pg-in\.has-more \+ \.pg-foot::after\{content:"more ↓"/);
  // the smallest type size any book rule sets must stay at 12px or more
  const sizes = [...css.matchAll(/font-size:calc\((\d+(?:\.\d+)?)px\*var\(--ts\)\)/g)].map(m => Number(m[1]));
  assert.ok(sizes.length > 0);
  assert.ok(Math.min(...sizes) >= 12, `smallest book font floor is ${Math.min(...sizes)}px`);
});

test('the cue and the floors are wired in last, so they win over the book styles', () => {
  assert.match(main, /import '\.\/ui\/bookReadable\.css';/);
  assert.match(main, /import \{initBookReadable\} from '\.\/ui\/bookReadable\.js';/);
  const cssImports = [...main.matchAll(/import '\.\/ui\/[^']+\.css';/g)].map(m => m[0]);
  assert.equal(cssImports[cssImports.length - 1], "import './ui/bookReadable.css';");
});
