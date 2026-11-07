// Unlimited walk regression: the run stage must not scroll (a live combo and a deep floor's rule used to push #stage
// 12-32 px past the window, a stray scrollbar). The live combo sits on the word-count row, and no rule hides the
// combo along with the word count. The browser check is scripts/run-stage-fit.mjs (run in CI).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the live combo is written inside the word-count row, with the count in its own wrapper', () => {
  const run = src('src/app/run.js');
  assert.match(run, /<div class="wlabel"><span class="wl-n">Word \$\{run\.i\+1\} of \$\{run\.words\.length\}<\/span>\$\{run\.combo\?`<span class="combo live"/);
  assert.doesNotMatch(run, /<div class="combo live"/, 'the combo is no longer its own row under the word count');
});

test('no stylesheet hides the whole word-count row, so a live combo never disappears with the count', () => {
  for (const f of ['src/ui/runScreen.css', 'src/ui/hintSlips.css', 'src/styles/late.css']) {
    const css = src(f);
    assert.doesNotMatch(css, /\.wlabel\s*\{\s*display:\s*none/, `${f} hides .wlabel`);
    assert.doesNotMatch(css, /,\s*\.wlabel\s*\{\s*display:\s*none|\.wlabel\s*,/, `${f} hides .wlabel in a list`);
  }
  assert.match(src('src/ui/runScreen.css'), /#stage \.wl-n\{display:none\}/);
  assert.match(src('src/ui/hintSlips.css'), /\.wl-n\{display:none\}/);
  assert.match(src('src/styles/late.css'), /\.wl-n,\.pos,#depthHud\{display:none\}/);
});

test('a deep floor rule plus a combo gives the answer slip back in short windows', () => {
  const css = src('src/ui/comboLine.css');
  assert.match(css, /@media\(max-height:860px\)\{html #stage\.center:has\(\.floorrule\) \.slip textarea\{height:84px\}\}/);
  assert.match(css, /#stage \.wlabel:has\(\.combo\.live\)\{letter-spacing:\.14em;margin-top:2px\}/);
  assert.match(src('src/main.js'), /import '\.\/ui\/comboLine\.css';/, 'loaded after the run styles');
});

test('the screen reader announcement reads the word count, not the combo', () => {
  const a11y = src('src/ui/a11y.js');
  assert.match(a11y, /\(lab\.querySelector\('\.wl-n'\)\|\|lab\)\.textContent/);
});
