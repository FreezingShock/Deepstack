import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dueStamp, PROPS, LOAN_DAYS} from '../src/ui/deskProps.js';

test('dueStamp adds the loan period and rolls over months and years', () => {
  assert.equal(LOAN_DAYS, 14);
  assert.equal(dueStamp(new Date(2026, 10, 4)), 'DUE 18 NOV');
  assert.equal(dueStamp(new Date(2026, 11, 25)), 'DUE 8 JAN');
});
test('two props, one per piece of furniture: bell on the cabinet, stamp on the ledger (inkwell retired in the overhaul)', () => {
  assert.deepEqual(PROPS.map(p => p.id), ['bell', 'stamp']);
  for (const p of PROPS) { assert.ok(p.label && p.svg.startsWith('<svg')); assert.ok(['chime1', 'thud'].includes(p.sfx)); }
});
test('props mount into the furniture slots and stamp the ledger', () => {
  const w = readFileSync(new URL('../src/ui/welcome.js', import.meta.url), 'utf8');
  const cab = readFileSync(new URL('../src/ui/cabinet.js', import.meta.url), 'utf8');
  assert.match(cab, /data-prop-slot="bell"/);
  assert.match(w, /data-prop-slot="stamp"/);
  const css = readFileSync(new URL('../src/ui/deskProps.css', import.meta.url), 'utf8');
  assert.match(css, /\.dp\{position:absolute;bottom:calc\(100% - 2px\)/);
  assert.match(css, /\.home \.ledger \.dp-mark/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/);
});
