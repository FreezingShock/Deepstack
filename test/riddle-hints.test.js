import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {riddleHintLadder, givesAway, riddleSentence, MAX_RIDDLE_HINTS} from '../src/core/riddleHints.js';
import {hintSlipHtml} from '../src/ui/hintSlips.js';
import {buildPool} from '../src/core/wordPool.js';
import {WORDS} from '../src/core/words.js';

const read = f => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));
const pool = buildPool(read('../public/data/words.json'));
const rel = read('../public/data/relations.json').rel;
const LETTERS = /\b[a-z](_\s*){2,}|\bsyllables?\b/i; // hints are bare words, so only blank patterns or counts could leak spelling

test('givesAway catches the word, its forms and near-spellings', () => {
  for (const t of ['frugal', 'Frugally', 'frugality', 'frugel', 'a frugal man']) assert.ok(givesAway(t, 'frugal'), t);
  for (const t of ['thrifty', 'miserly', 'sparing']) assert.ok(!givesAway(t, 'frugal'), t);
});
test('a sentence that spells the word anywhere is dropped', () => {
  assert.equal(riddleSentence({w: 'frugal', hint: 'He was ___ , a frugal man.'}), null);
  assert.equal(riddleSentence({w: 'frugal', hint: 'They lived a ___ life.'}), 'They lived a ___ life.');
});
test('no riddle hint for any word contains the answer, a form of it, or a spelling clue', () => {
  let words = 0, hints = 0, withHint = 0;
  const kinds = new Set();
  for (const w of [...WORDS, ...pool]) {
    const l = riddleHintLadder(w, rel[w.w]); words++; if (l.length) withHint++;
    assert.ok(l.length <= MAX_RIDDLE_HINTS);
    for (const h of l) {
      hints++; kinds.add(h.kind);
      assert.ok(h.cost >= 1);
      if (h.kind !== 'sentence') assert.doesNotMatch(h.text, LETTERS, `${w.w}: ${h.text}`);
      const text = h.kind === 'sentence' ? h.text.replace(/___/g, ' ') : h.text;
      for (const tok of text.split(/[^A-Za-z']+/).filter(t => t.length >= 4)) assert.ok(!givesAway(tok, w.w), `${w.w} leaks via ${h.kind}: ${h.text}`);
      assert.ok(!text.toLowerCase().includes(w.w.toLowerCase()), `${w.w} in ${h.kind}`);
    }
  }
  assert.ok(hints > 1000 && withHint / words > .6, `${hints} hints, ${withHint}/${words}`);
  for (const k of ['sentence', 'kin', 'kind', 'opposite', 'synonym']) assert.ok(kinds.has(k), 'kind present: ' + k);
});
test('a riddle sentence slip leaves the gap empty instead of filling in the word', () => {
  const html = hintSlipHtml({kind: 'sentence', cost: 1, text: 'They lived a ___ life.'}, null, 0, 1);
  assert.match(html, /class="gap"/);
  assert.doesNotMatch(html, /<mark>/);
});
