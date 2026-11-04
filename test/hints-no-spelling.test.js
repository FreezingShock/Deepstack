import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hintLadder} from '../src/core/hints.js';
import {buildPool} from '../src/core/wordPool.js';
import {WORDS} from '../src/core/words.js';

// Pins #18: the first-letter hint was rejected. No hint, for any word in the real pool, may give
// away the word's spelling: not its letters, its length, a letter-by-letter blank pattern.
const data = JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url), 'utf8'));
const pool = buildPool(data);
// real quotations may talk about letters, so the wording check covers the generated hints only; blanks are checked everywhere
const BLANK = /\b[a-z](_\s*){2,}|(_\s*){2,}[a-z]_/i;
const LEAK = /(begins?|starts?|starting|first|initial|opening)\s+(with|letter)|\bsyllables?\b|\b[a-z](_\s*){2,}|(_\s*){2,}[a-z]_|\b[A-Za-z]\.\.\.\s*$/i;

test('no hint for any word in the full pool reveals its spelling', () => {
  assert.ok(pool.length > 500, 'pool loaded: ' + pool.length);
  let checked = 0;
  for (const w of [...WORDS, ...pool]) for (const h of hintLadder(w)) {
    checked++;
    assert.doesNotMatch(h.text, BLANK, `${w.w}: ${h.text}`);
    if (h.kind !== 'sentence') assert.doesNotMatch(h.text, LEAK, `${w.w}: ${h.kind}: ${h.text}`);
    assert.ok(!h.text.toLowerCase().includes(w.w.toLowerCase()), `${w.w} appears in its own ${h.kind} hint`);
  }
  assert.ok(checked > 1000, 'checked ' + checked);
});
test('the ladder offers only the three meaning hints, never a spelling hint', () => {
  const kinds = new Set();
  for (const w of pool) for (const h of hintLadder(w)) kinds.add(h.kind);
  assert.deepEqual([...kinds].sort(), ['opening', 'sentence', 'synonym']);
});
