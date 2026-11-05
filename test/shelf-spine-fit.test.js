import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('shelf spine labels never ellipsize', () => {
  const css = readFileSync('src/ui/shelfSpineFit.css', 'utf8');
  assert.match(css, /\.sb-t\{text-overflow:clip/);
  assert.doesNotMatch(css, /ellipsis/);
});
