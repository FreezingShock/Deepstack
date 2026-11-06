// PF5: the judge's relations + senses live in a worker. The worker must answer with the very same pure functions the
// judge used on the page, so scores cannot change; and the page must not parse the 7 MB of JSON itself any more.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relate, answerSynonyms, relationTexts, setRelations} from '../src/scorer/relations.js';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('worker ops are the page functions, unchanged', () => {
  const w = read('src/scorer/lexWorker.js');
  for (const f of ['relate(m.text, m.word)', 'answerSynonyms(m.text, m.word)', 'relationTexts(m.word)', 'senseTexts(m.word)']) assert.ok(w.includes(f), f);
});

test('the page never loads relations/senses itself except as the no-worker fallback', () => {
  for (const f of ['src/main.js', 'src/app/riddle.js', 'src/ui/alsoMeans.js', 'src/ui/alsoAccepted.js', 'src/scorer/index.js'])
    assert.ok(!/loadRelations\(|loadSenses\(/.test(read(f)), f + ' calls loadRelations/loadSenses on the page');
  assert.ok(/goLocal/.test(read('src/scorer/lexicon.js')));
});

test('relate on a cloned word gives the same answer as on the full word (what the worker receives)', () => {
  const rel = JSON.parse(read('public/data/relations.json')).rel;
  setRelations(rel);
  const word = {w: 'taciturn', def: 'Reserved or uncommunicative in speech; saying little.', pos: 'adjective', concepts: ['quiet'], id: 9};
  const clone = structuredClone({w: word.w, def: word.def, pos: word.pos});
  for (const t of ['reserved', 'quiet and saying little', 'talkative', 'not talkative']) {
    assert.deepEqual(relate(t, clone), relate(t, word), t);
    assert.deepEqual(answerSynonyms(t, clone), answerSynonyms(t, word), t);
  }
  assert.deepEqual(relationTexts(clone), relationTexts(word));
  setRelations(null);
});
