// Settings sections fit their page (the full browser walk is scripts/settings-walk.mjs, run in CI).
// These checks pin the two fixes it found, so a static edit cannot quietly bring them back.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css = readFileSync(new URL('../src/ui/settingsBook.css', import.meta.url), 'utf8');

test('a slider value label is wide enough for 100% and never wraps', () => {
  const rule = css.match(/\.bk-spread\.panel \.sb-slider output\{([^}]*)\}/);
  assert.ok(rule, 'output rule exists');
  assert.match(rule[1], /min-width:4\.4ch/);
  assert.match(rule[1], /white-space:nowrap/);
  assert.doesNotMatch(rule[1], /width:3\.6ch/, 'the old fixed 3.6ch width clipped "100%" and pushed the row past its edge');
});

test('settings controls sit above the page-turn corners', () => {
  assert.match(css, /\.bk-spread\.panel \.sb-group button,\.bk-spread\.panel \.sb-group input,\.bk-spread\.panel \.sb-group \[role="switch"\],\.bk-spread\.panel \.sb-confirm \.btn\{position:relative;z-index:5\}/);
});

test('the walk is wired into CI beside the other browser checks', () => {
  const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /node scripts\/settings-walk\.mjs & walk=\$!/);
  assert.match(ci, /wait \$walk \|\| rc=1/);
});
