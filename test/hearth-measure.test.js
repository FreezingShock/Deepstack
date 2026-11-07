import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The fireplace fit reads boxes right after it changes classes. Transitions must be off while it does (see scripts/home-steady.mjs).
test('the fireplace fit measures with transitions off', () => {
  const js = readFileSync('src/ui/hearth.js', 'utf8');
  assert.match(js, /home\.classList\.add\('hearth-measure'\)/);
  assert.match(js, /finally \{ home\.classList\.remove\('hearth-measure'\); \}/);
  const css = readFileSync('src/ui/hearthMeasure.css', 'utf8');
  assert.match(css, /#home\.hearth-measure \*[^{]*\{transition:none!important\}/);
});
test('the measuring stylesheet is loaded by the app entry', () => {
  assert.match(readFileSync('src/main.js', 'utf8'), /import '\.\/ui\/hearthMeasure\.css';/);
});
