import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {summarize, pickNote, pickExample, cleanRelated, shortEtymology, shardOf, isCleanText, etymologyOk, isFragment} from '../scripts/lib/notesData.mjs';
import {shardKey, noteHTML, marginNoteHTML} from '../src/ui/wordNotes.js';

const sample = readFileSync(new URL('./fixtures/kaikki-notes-sample.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
const byWord = {};
for (const e of sample) { const s = summarize(e); if (s) (byWord[e.word] ??= []).push(s); }

test('a headword gets an etymology, a usage example and related words from its entry', () => {
  const n = pickNote('ephemeral', 'adjective', byWord.ephemeral);
  assert.match(n.e, /^From Ancient Greek ephēmeros/);
  assert.equal(n.x, 'The beauty of cherry blossoms is ephemeral and falls within days.');
  assert.deepEqual(n.r, ['transient', 'fleeting', 'ephemerality']);
});
test('a usage label comes from the sense tags, and synonyms fill in related words', () => {
  const n = pickNote('quixotic', 'adjective', byWord.quixotic);
  assert.equal(n.u, 'Often used figuratively');
  assert.deepEqual(n.r, ['idealistic', 'utopian']);
});
test('a word with only form-of senses gets no note', () => {
  assert.equal(summarize(sample.find(e => e.word === 'walked')), null);
  assert.equal(pickNote('walked', 'verb', []), null);
});
test('a noun with only a cross-reference etymology and no examples gets no note', () => {
  assert.equal(pickNote('ephemeral', 'noun', byWord.ephemeral), null);
});
test('blocked words never appear in a note, and their examples are dropped', () => {
  assert.equal(pickExample('slurword', ['That is an ethnic slur, a chink joke about the crowd.']), null);
  assert.equal(isCleanText('a chink in the armour'), false);
  assert.deepEqual(cleanRelated('x', ['chinaman', 'quit', 'quit', 'abandon', 'as well as', 'x']), ['quit', 'abandon']);
});
test('etymologies are cut to whole sentences or end in an ellipsis, never mid-word', () => {
  const long = 'From Latin ' + 'bellum '.repeat(40) + 'in the end.';
  const short = shortEtymology(long);
  assert.ok(short.length <= 171, `too long: ${short.length}`);
  assert.ok(/(…|\.)$/.test(short));
  const first = 'From Old French, itself borrowed from an older Latin verb that meant to hand over.';
  assert.equal(shortEtymology(first + ' ' + 'It spread through Europe over many centuries and became common in English prose '.repeat(3)), first);
});
test('template dumps and stray bullets are not shown as etymologies', () => {
  assert.equal(etymologyOk('Etymology tree Proto-Indo-European *h₂éd Proto-Italic *ad Latin ad'), false);
  assert.equal(etymologyOk('From Proto-Indo-European *per-der.? Old French'), false);
  assert.equal(etymologyOk('From Proto-Italic *ad, from Proto-Indo-European *h₂éd, from Proto-Germanic *bann.'), false);
  assert.equal(etymologyOk('From Old French, from Latin verb.'), true);
  const s = summarize({word: 'approval', pos: 'noun', etymology_text: '* First attested in the late 15th century, from approve + -al.', senses: [{glosses: ['The act of approving.']}]});
  assert.equal(s.et, 'First attested in the late 15th century, from approve + -al.');
  assert.equal(summarize({word: 'approval', pos: 'noun', etymology_text: 'Etymology tree Proto-Indo-European ?', senses: [{glosses: ['The act of approving.']}]}), null);
});
test('a fragment of the headword is never a related word, but a derived form is', () => {
  assert.equal(isFragment('ephemeral', 'hemeral'), true);
  assert.equal(isFragment('ephemeral', 'ephemerality'), false);
  assert.deepEqual(cleanRelated('ephemeral', ['hemeral', 'ephemeron', 'ephemerality'], 4), ['ephemeron', 'ephemerality']);
});
test('related words must be real words when the caller knows the list', () => {
  const known = w => w !== 'xyzzy';
  assert.deepEqual(cleanRelated('ephemeral', ['xyzzy', 'transient'], 4, known), ['transient']);
  assert.deepEqual(pickNote('ephemeral', 'adjective', byWord.ephemeral, w => w !== 'transient').r, ['fleeting', 'ephemerality']);
});
test('a note stays short: example and etymology sizes are bounded', () => {
  const n = pickNote('ephemeral', 'adjective', byWord.ephemeral);
  assert.ok(n.e.length <= 171 && n.x.length <= 150 && n.r.length <= 4);
});
test('shards are one file per first letter, and the card and the builder agree on the key', () => {
  for (const w of ['ephemeral', 'Quixotic', 'zebra']) assert.equal(shardKey(w), w[0].toLowerCase());
  assert.equal(shardOf('ephemeral'), 'e');
  assert.equal(shardOf('3d'), 'other');
  assert.equal(shardKey('3d'), 'other');
});
test('the margin note renders escaped text, italicises the headword in its example, and credits the source', () => {
  const html = noteHTML('ephemeral', {e: 'From <Greek>.', x: 'Ephemeral things fade, and so do ephemerally bright days.', u: 'Formal', r: ['fleeting']});
  assert.match(html, /From &lt;Greek&gt;\./);
  assert.match(html, /<em>Ephemeral<\/em> things/);
  assert.match(html, /<em>ephemerally<\/em>/);
  assert.match(html, /Usage · Formal/);
  assert.match(html, /CC BY-SA 4\.0/);
  assert.match(noteHTML('quixotic', null), /No note on this one yet/);
});
test('the card gets a closed tab that loads nothing until opened', () => {
  const h = marginNoteHTML({w: 'ephemeral'});
  assert.match(h, /class="mn-tab" aria-expanded="false"/);
  assert.equal(marginNoteHTML({}), '');
});
test('the boot path does not fetch notes: only the result card and its module refer to them', () => {
  const files = [];
  const walk = dir => { for (const f of readdirSync(dir, {withFileTypes: true})) { const p = `${dir}/${f.name}`; if (f.isDirectory()) walk(p); else if (/\.js$/.test(f.name)) files.push(p); } };
  walk(new URL('../src', import.meta.url).pathname);
  const rel = p => p.split('/src/')[1];
  const fetchers = files.filter(p => readFileSync(p, 'utf8').includes('word-notes-')).map(rel);
  assert.deepEqual(fetchers, ['ui/wordNotes.js'], 'only the margin note module fetches a note shard');
  const importers = files.filter(p => /from '[./]*ui\/wordNotes\.js'/.test(readFileSync(p, 'utf8'))).map(rel);
  assert.deepEqual(importers, ['app/card.js'], 'only the result card imports the margin note');
});
test('no shipped related word is a fragment of its headword', { skip: !readdirSync('public/data').some(f => f.startsWith('word-notes-')) }, () => {
  for (const f of readdirSync('public/data').filter(f => /^word-notes-.+\.json$/.test(f))) {
    const {words} = JSON.parse(readFileSync(`public/data/${f}`, 'utf8'));
    for (const [w, n] of Object.entries(words)) for (const r of n.r || []) assert.ok(!isFragment(w, r), `${w}: "${r}" is a fragment of it`);
  }
});
test('shipped note shards are small, sorted, clean and keyed by their own letter', { skip: !readdirSync('public/data').some(f => f.startsWith('word-notes-')) }, () => {
  let total = 0;
  for (const f of readdirSync('public/data').filter(f => /^word-notes-.+\.json$/.test(f))) {
    const raw = readFileSync(`public/data/${f}`, 'utf8');
    total += raw.length;
    const {words} = JSON.parse(raw);
    const k = f.slice('word-notes-'.length, -'.json'.length);
    assert.ok(raw.length <= 700 * 1024, `${f} is ${raw.length} bytes`);
    for (const [w, n] of Object.entries(words)) {
      assert.equal(shardOf(w), k, `${w} in the wrong shard`);
      assert.ok(!n.x || (isCleanText(n.x) && n.x.length <= 150), `${w}: example`);
      assert.ok(!n.r || n.r.every(isCleanText), `${w}: related`);
      assert.ok(!n.e || isCleanText(n.e), `${w}: etymology`);
    }
  }
  assert.ok(total <= 12 * 1024 * 1024, `all shards ${total} bytes`);
});
