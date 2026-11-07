import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  PATRONS, WORD_PASS, DEFINE_PASS, USED_CAP, LEDGER_CAP, patronFor, gistOf, patronsOf, kindFor, requestFor,
  servesWith, recordServed, commendations, commendationTotal, deskRoll,
} from '../src/core/patrons.js';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {patronSVG, PATRON_ART} from '../src/ui/patronArt.js';

const POOL = Array.from({length: 40}, (_, i) => ({
  id: 1000 + i, w: 'word' + i, pos: 'noun', def: `a thing number ${i} that is quite particular; with a second clause`,
}));
POOL.push({id: 9000, w: 'ferrous', pos: 'adjective', def: 'Ferrous: containing iron'}); // the definition gives the word away

test('six patrons, one per topic room, each with a complete voice', () => {
  const topic = ROOMS.filter(r => r.id !== HALL).map(r => r.id).sort();
  assert.deepEqual(PATRONS.map(p => p.room).sort(), topic, 'every topic room has exactly one patron');
  assert.equal(new Set(PATRONS.map(p => p.id)).size, PATRONS.length, 'patron ids are unique');
  for (const p of PATRONS) {
    assert.ok(p.name.startsWith('The '), `${p.id} is named by its office`);
    for (const k of ['greet', 'thanks', 'miss']) assert.ok(p[k].length >= 3, `${p.id} has three ${k} lines`);
    assert.ok(p.hat, `${p.id} has a silhouette`);
  }
});

test('the desk: a room has its own patron, the Reading Room picks one by day', () => {
  assert.equal(patronFor('history').id, 'archivist');
  assert.equal(patronFor('body').id, 'trainer');
  const seen = new Set();
  for (let d = 1; d <= 60; d++) seen.add(patronFor(HALL, `2026-11-${String(d).padStart(2, '0')}`).id);
  assert.ok(seen.size >= 4, `the Reading Room desk changes hands across the month (saw ${seen.size})`);
});

test('a request is the same all day, asks one word, and never gives its word away', () => {
  const S = {};
  const a = requestFor(S, POOL, '2026-11-07', 'history');
  const b = requestFor(S, POOL, '2026-11-07', 'history');
  assert.deepEqual(a, b, 'deterministic for a day');
  assert.equal(a.patron.id, 'archivist');
  assert.ok(POOL.some(w => w.id === a.word.id));
  assert.notEqual(a.word.w, 'ferrous', 'the word a definition names is never asked for');
  if (a.kind === 'word') assert.match(a.ask, /^I need a word meaning /);
  else assert.match(a.ask, /^What does “.+” mean\? /);
  assert.equal(a.served, false);
});

test('word and definition requests mix, about one define in three', () => {
  const n = 600;
  let define = 0;
  for (let i = 0; i < n; i++) if (kindFor(PATRONS[i % 6], '2026-' + i) === 'define') define++;
  const share = define / n;
  assert.ok(share > 0.2 && share < 0.45, `define share ${share.toFixed(2)}`);
});

test('a served request stays served for the day and the word leaves the pool for a while', () => {
  const S = {shelf: []};
  const r = requestFor(S, POOL, '2026-11-07', 'history');
  const entry = recordServed(S, {day: '2026-11-07', patron: r.patron, word: r.word, kind: r.kind, score: 80, tier: 4, answer: 'an answer'});
  assert.equal(entry.p, 'archivist');
  assert.equal(commendations(S, 'archivist'), 1);
  assert.equal(commendationTotal(S), 1);
  assert.equal(requestFor(S, POOL, '2026-11-07', 'history').served, true, 'the same patron is done for the day');
  assert.equal(requestFor(S, POOL, '2026-11-08', 'history').served, false, 'a new day brings a new request');
  const next = requestFor(S, POOL, '2026-11-08', 'history');
  assert.notEqual(next.word.id, r.word.id, 'the word just served does not come straight back');
});

test('the judge bar: a word needs a synonym or better, a definition the full judge’s Folio line', () => {
  assert.equal(servesWith('word', WORD_PASS), true);
  assert.equal(servesWith('word', WORD_PASS - 1), false);
  assert.equal(servesWith('define', DEFINE_PASS), true);
  assert.equal(servesWith('define', DEFINE_PASS - 1), false);
  assert.equal(servesWith('word', NaN), false, 'a missing score never serves');
});

test('the save fields are additive, tolerant of damage and capped', () => {
  assert.deepEqual(patronsOf({}).served, {});
  assert.deepEqual(patronsOf({patrons: 'junk'}).used, []);
  assert.deepEqual(patronsOf({patrons: {used: [1, 'x', 2], served: [], ledger: [null, {}]}}).used, [1, 2]);
  const S = {patrons: {served: {}, last: {}, used: Array.from({length: USED_CAP + 20}, (_, i) => i), ledger: []}};
  const r = requestFor(S, POOL, '2026-11-09', 'history');
  recordServed(S, {day: '2026-11-09', patron: r.patron, word: r.word, kind: 'word', score: 90, tier: 5, answer: 'x'.repeat(80)});
  assert.ok(S.patrons.used.length <= USED_CAP);
  assert.ok(S.patrons.ledger[0].a.length <= 40, 'an answer is kept short in the ledger');
  for (let i = 0; i < LEDGER_CAP + 5; i++) recordServed(S, {day: '2026-' + i, patron: PATRONS[0], word: POOL[i % 40], kind: 'word', score: 60, tier: 2, answer: 'a'});
  assert.equal(S.patrons.ledger.length, LEDGER_CAP);
  assert.equal(deskRoll(S).length, PATRONS.length);
});

test('gistOf: the first clause, lower-cased, short enough to read as a request', () => {
  assert.equal(gistOf('A fear of open spaces; agoraphobia.'), 'a fear of open spaces');
  assert.equal(gistOf(''), '');
  assert.equal(gistOf('x'.repeat(130)), '', 'a long definition is not used as a request');
});

test('busts: one labelled svg per patron, no raw colours in the markup', () => {
  for (const p of PATRONS) {
    const svg = patronSVG(p);
    assert.match(svg, /<svg class="pt-svg" viewBox="0 0 64 72" role="img" aria-label="The /);
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(svg), `${p.id} carries no hex colour`);
    assert.equal(PATRON_ART[p.id], svg);
  }
});

test('CI guard: the Patrons page stylesheet has no raw hex and keeps touch targets at 44px', () => {
  const css = readFileSync(new URL('../src/ui/patrons.css', import.meta.url), 'utf8');
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css), 'colours come from tokens');
  for (const sel of ['.pt-send', '.pt-link', '.pt-ans']) {
    const rule = css.split('\n').find(l => l.includes(sel + '{') || l.includes(sel + ' {')) || '';
    assert.match(rule, /min-height:44px/, `${sel} is at least 44px tall`);
  }
  assert.match(css, /\.pt-svg\{width:clamp\(/, 'the bust scales with the page, so it cannot push the text off a phone');
});

test('the Patrons book is on the home shelf and its page is registered in main.js', () => {
  const home = readFileSync(new URL('../src/ui/home.js', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(home, /\{id:'bPat',stack:0/);
  // the desk loads on first open (a lazy stub, like lazyBooks), so main.js imports it dynamically
  assert.match(main, /BOOK_PAGES\.bPat=\{load:loadPatrons\}/);
  assert.match(main, /import\('\.\/ui\/patronsBook\.js'\)/);
});
