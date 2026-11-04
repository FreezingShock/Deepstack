import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The four Graphics choices must wrap on a phone instead of running past the panel (Low was clipped at 375 px).
test('settings Graphics row wraps on narrow screens', () => {
  const css = readFileSync(new URL('../src/ui/topbar.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width:480px\)\{#sQual\{flex-wrap:wrap/);
});
