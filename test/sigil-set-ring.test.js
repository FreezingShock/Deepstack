import test from 'node:test';
import assert from 'node:assert/strict';
import {sigilSpec, setRing, setIndexOf} from '../src/ui/sigil.js';
import {SETS} from '../src/sets/sets.js';

test('members of one set share a ring but differ in core', () => {
  for (const s of SETS) {
    const specs = s.words.map(sigilSpec);
    assert.equal(new Set(specs.map(x => x.ring + '|' + x.ring2)).size, 1, s.id);
    assert.equal(new Set(specs.map(x => JSON.stringify(x))).size, s.words.length, s.id + ' sigils stay unique');
    assert.ok(new Set(specs.map(x => x.core + x.n + x.pip)).size > 1, s.id + ' centres differ');
  }
});

test('every set has its own ring', () => {
  const rings = SETS.map((_, i) => JSON.stringify(setRing(i)));
  assert.equal(new Set(rings).size, SETS.length);
});

test('words outside any set keep their own ring and cores are unchanged by sets', () => {
  assert.equal(setIndexOf('zebra'), -1);
  assert.equal(sigilSpec('zebra').set, undefined);
  assert.equal(sigilSpec('Tempest').set, 'weather');
  assert.equal(sigilSpec('tempest').core, sigilSpec(' TEMPEST ').core);
});
