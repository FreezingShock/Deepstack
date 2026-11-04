import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dueStamp, PROPS, LOAN_DAYS} from '../src/ui/deskProps.js';

test('dueStamp adds the loan period and rolls over months and years', () => {
  assert.equal(LOAN_DAYS, 14);
  assert.equal(dueStamp(new Date(2026, 10, 4)), 'DUE 18 NOV');
  assert.equal(dueStamp(new Date(2026, 11, 25)), 'DUE 8 JAN');
});
test('three props: bell, inkwell, stamp, each with a label and one known sound', () => {
  assert.deepEqual(PROPS.map(p => p.id), ['bell', 'ink', 'stamp']);
  for (const p of PROPS) { assert.ok(p.label && p.svg.startsWith('<svg')); assert.ok(['chime1', 'quill', 'thud'].includes(p.sfx)); }
});
test('css hides the props below 560 px and keeps them on the ledge line', () => {
  const css = readFileSync(new URL('../src/ui/deskProps.css', import.meta.url), 'utf8');
  assert.match(css, /\.desk-props\{[^}]*display:none/);
  assert.match(css, /@media\(min-width:561px\)\{\.desk-props\{display:block\}\}/);
  assert.match(css, /\.desk-props\{[^}]*bottom:3px/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/);
});
