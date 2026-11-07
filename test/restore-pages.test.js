import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {
  PASSAGES, RESTORE_AT, sameWord, inkFor, pickPassageWords, smudge, smudgedShown, buildPage,
  applyScore, applyWord, leaveFaded, giveLetter, pageComplete, pageDamage, pageInk,
} from '../src/restore/pages.js';
import {restoreOf, currentPage, pinToWall, WALL_MAX} from '../src/restore/store.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const RW = read('../public/data/room-words.json');
const topicRooms = ROOMS.filter(r => r.id !== HALL);
/** A room's words as pool entries (the shape the bench receives from WORDS). */
const poolOf = id => RW.rooms[id].map(([w, pos, def]) => ({w, pos, def}));

test('a page is three passages, one smudged, built from the room and repeatable for the same seed', () => {
  const pool = poolOf('history');
  const a = buildPage({room: 'history', seed: 4, pool});
  const b = buildPage({room: 'history', seed: 4, pool});
  assert.equal(a.passages.length, PASSAGES);
  assert.equal(a.passages.filter(p => p.kind === 'smudged').length, 1);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.passages.map(p => p.w), buildPage({room: 'history', seed: 5, pool}).passages.map(p => p.w));
});

test('every topic room can print pages, with distinct headwords and a readable smudged word', () => {
  for (const r of topicRooms) {
    const pool = poolOf(r.id);
    for (let seed = 1; seed <= 25; seed++) {
      const pg = buildPage({room: r.id, seed, pool});
      assert.ok(pg, `${r.id} seed ${seed}: no page`);
      assert.equal(new Set(pg.passages.map(p => p.w)).size, PASSAGES, `${r.id} seed ${seed}: repeated word`);
      for (const p of pg.passages) if (p.kind === 'smudged') {
        assert.match(p.w, /^[a-z]{5,12}$/i);
        assert.ok(p.hidden.length >= 2 && !p.hidden.includes(0), `${r.id}: ${p.w} hides ${p.hidden}`);
      }
    }
  }
});

test('pages avoid words printed earlier while fresh ones remain', () => {
  const pool = poolOf('science');
  const first = buildPage({room: 'science', seed: 1, pool});
  const used = first.passages.map(p => p.w);
  const second = buildPage({room: 'science', seed: 2, pool, used});
  for (const p of second.passages) assert.ok(!used.includes(p.w), `${p.w} came back too soon`);
});

test('too small a pool cannot print a page', () => {
  assert.equal(buildPage({room: 'x', seed: 1, pool: poolOf('math').slice(0, 2)}), null);
  assert.equal(pickPassageWords([{w: 'ab', def: 'short'}]).length, 0);
});

test('smudging keeps the first letter and hides about two fifths of the rest, never more than fits', () => {
  for (const word of ['ephemeral', 'pelvis', 'comet', 'abdicate', 'constellation']) {
    let s = 7;
    const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const {hidden} = smudge(word, rng);
    assert.ok(!hidden.includes(0));
    assert.equal(new Set(hidden).size, hidden.length);
    assert.ok(hidden.length >= 2 && hidden.length <= word.length - 1, `${word}: ${hidden.length}`);
    assert.ok(hidden.length >= Math.round(word.length * 0.4) - 1 || hidden.length === word.length - 1);
  }
});

test('the smudged headword shows gaps until a letter is given, and letters come in order', () => {
  const p = {w: 'comet', kind: 'smudged', hidden: [1, 3], hints: 0};
  assert.equal(smudgedShown(p).join(''), 'c_m_t');
  assert.equal(giveLetter(p), true);
  assert.equal(smudgedShown(p).join(''), 'com_t');
  assert.equal(giveLetter(p), true);
  assert.equal(smudgedShown(p).join(''), 'comet');
  assert.equal(giveLetter(p), false, 'no letter left to give');
});

test('typed words match ignoring case and stray spaces, and not on spelling', () => {
  assert.ok(sameWord('  Ephemeral ', 'ephemeral'));
  assert.ok(sameWord('ephe  meral', 'EPHE meral'));
  assert.ok(!sameWord('ephemerel', 'ephemeral'));
  const p = {w: 'comet', tries: 0, done: false};
  assert.equal(applyWord(p, 'comit'), false);
  assert.equal(p.done, false);
  assert.equal(applyWord(p, 'Comet'), true);
  assert.equal(p.restored, true);
  assert.equal(p.ink, 1);
});

test('ink returns in full at the bar and only a faint wash below it', () => {
  assert.equal(inkFor(0), 0);
  assert.equal(inkFor(RESTORE_AT), 1);
  assert.equal(inkFor(100), 1);
  assert.ok(inkFor(RESTORE_AT - 1) > 0 && inkFor(RESTORE_AT - 1) < 0.3);
  let last = -1;
  for (let s = 0; s <= 100; s++) { assert.ok(inkFor(s) >= last); last = inkFor(s); }
});

test('a judged definition restores the entry at the bar, and a weak one leaves it faded but still wet', () => {
  const p = {kind: 'faded', w: 'comet', def: 'x', ink: 0, tries: 0, done: false, restored: false};
  assert.equal(applyScore(p, RESTORE_AT - 3), false);
  assert.equal(p.done, false);
  assert.ok(p.ink > 0);
  assert.equal(applyScore(p, RESTORE_AT + 10), true);
  assert.equal(p.done && p.restored && p.ink === 1, true);
  const q = {kind: 'faded', w: 'comet', ink: 0, tries: 0, done: false, restored: false};
  leaveFaded(q);
  assert.equal(q.done, true);
  assert.equal(q.restored, false);
});

test('a page is complete when every passage is done, and the stain tracks what is left', () => {
  const pg = buildPage({room: 'art', seed: 3, pool: poolOf('art')});
  assert.equal(pageDamage(pg), 1);
  assert.equal(pageComplete(pg), false);
  pg.passages.forEach(p => { p.done = true; p.restored = true; p.ink = 1; });
  assert.equal(pageComplete(pg), true);
  assert.equal(pageInk(pg), 1);
  assert.equal(pageDamage(pg), 0);
});

test('the save gains one restoration field, resumes a page in progress, and pins finished pages to a capped wall', () => {
  const S = {shelf: [{w: 'kept'}], sets: {got: {}}};
  const pool = poolOf('english');
  const a = currentPage(S, 'english', pool);
  assert.ok(a);
  assert.equal(currentPage(S, 'english', pool).id, a.id, 'resumes the page in progress');
  assert.equal(JSON.stringify({shelf: S.shelf, sets: S.sets}), JSON.stringify({shelf: [{w: 'kept'}], sets: {got: {}}}));
  pinToWall(S, a);
  assert.equal(restoreOf(S).wall.length, 1);
  assert.equal(restoreOf(S).cur.english, null);
  const next = currentPage(S, 'english', pool);
  assert.notEqual(next.id, a.id);
  for (let k = 0; k < WALL_MAX + 5; k++) pinToWall(S, {...buildPage({room: 'english', seed: 100 + k, pool}), passages: a.passages});
  assert.equal(restoreOf(S).wall.length, WALL_MAX);
});
