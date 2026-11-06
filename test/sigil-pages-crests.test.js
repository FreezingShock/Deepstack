import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setCrestSpec} from '../src/ui/sigil.js';
import {SETS} from '../src/sets/sets.js';

test('six sets give six distinct ring-only crests', () => {
  const specs = SETS.map((_, i) => JSON.stringify(setCrestSpec(i)));
  assert.equal(new Set(specs).size, SETS.length);
  assert.ok(SETS.every((_, i) => setCrestSpec(i).core === 'none'));
});

test('set leaves wear their crest by index, wax when complete (source pin; ui.js pulls in css)', () => {
  const src = readFileSync(new URL('../src/sets/ui.js', import.meta.url), 'utf8') + readFileSync(new URL('../src/sets/pages.js', import.meta.url), 'utf8');
  assert.match(src, /st\.map\(\(s, i\) =>[^]*crestHTML\(i, s\.complete\)/);
  assert.match(src, /crest\$\{done \? ' wax' : ''\}/);
});

test('the open result card stamps a sigil watermark at ~6% alpha', () => {
  assert.match(readFileSync(new URL('../src/ui/coverSigil.js', import.meta.url), 'utf8'), /stampPage[^]*, \.06, MARK\)/);
  assert.match(readFileSync(new URL('../src/app/card.js', import.meta.url), 'utf8'), /stampPage\(bk\.querySelector\('\.page'\)/);
});
