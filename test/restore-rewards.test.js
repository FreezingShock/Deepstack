// What a restored entry earns (MR3, MR4): it counts as met for its room, and a page with every entry in ink seals the wall.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPage, applyScore, applyWord, leaveFaded, RESTORE_AT} from '../src/restore/pages.js';
import {pinToWall, rewardRestored, restoreOf} from '../src/restore/store.js';
import {metWords, unmetWords} from '../src/core/roomDepth.js';
import {earnedStamps, stampsOf, CATALOG, sealedPage, stampRows} from '../src/core/stamps.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const RW = read('../public/data/room-words.json');
const poolOf = id => RW.rooms[id].map(([w, pos, def]) => ({w, pos, def}));
const DAY = '2026-11-07';
const names = id => RW.rooms[id].map(([w]) => w);

test('a restored entry counts as met for its room; a left one does not', () => {
  const S = {};
  const list = names('history');
  const page = buildPage({room: 'history', seed: 3, pool: poolOf('history')});
  const [a, b] = page.passages;
  assert.equal(metWords(S, list), 0);
  assert.equal(applyScore(a, RESTORE_AT), true);
  rewardRestored(S, a, DAY);
  assert.equal(metWords(S, list), 1, 'the faded entry comes back and counts');
  leaveFaded(b); // left damaged: nothing recorded
  assert.equal(metWords(S, list), 1);
  assert.ok(!unmetWords(S, 'history').includes(a.w) || !list.includes(a.w));
});

test('a faded entry with only faint ink does not count', () => {
  const S = {};
  const page = buildPage({room: 'science', seed: 5, pool: poolOf('science')});
  applyScore(page.passages[0], RESTORE_AT - 10);
  assert.equal(page.passages[0].restored, false);
  assert.deepEqual(rewardRestored(S, page.passages[0], DAY).map(s => s.id), []);
  assert.equal(metWords(S, names('science')), 0);
});

test('a smudged word counts once it is typed right', () => {
  const S = {};
  const pool = poolOf('math');
  const page = buildPage({room: 'math', seed: 2, pool});
  const sm = page.passages.find(p => p.kind === 'smudged');
  assert.equal(applyWord(sm, sm.w), true);
  rewardRestored(S, sm, DAY);
  assert.equal(metWords(S, names('math')), 1);
});

test('a page with every entry in ink earns the wax seal once it is pinned, and the stamp is returned for the toast', () => {
  const S = {};
  const page = buildPage({room: 'history', seed: 7, pool: poolOf('history')});
  page.passages.forEach(p => applyScore(p, RESTORE_AT));
  assert.equal(sealedPage(page), true);
  pinToWall(S, page);
  const fresh = rewardRestored(S, page.passages[2], DAY);
  assert.ok(fresh.some(s => s.id === 'library.seal'), 'the seal toast lists the stamp');
  assert.equal(stampsOf(S)['library.seal'], DAY, 'recorded with the day it was earned');
  assert.ok(earnedStamps(S).some(s => s.id === 'library.seal'));
  assert.ok(CATALOG.some(s => s.id === 'library.seal' && s.name === 'Wax seal' && s.hint));
});

test('a page with one entry left damaged does not earn the seal', () => {
  const S = {};
  const page = buildPage({room: 'history', seed: 8, pool: poolOf('history')});
  page.passages.slice(0, 2).forEach(p => applyScore(p, RESTORE_AT));
  leaveFaded(page.passages[2]);
  assert.equal(sealedPage(page), false);
  pinToWall(S, page);
  const fresh = rewardRestored(S, page.passages[1], DAY);
  assert.ok(!fresh.some(s => s.id === 'library.seal'));
  assert.ok(!earnedStamps(S).some(s => s.id === 'library.seal'));
  assert.ok(!stampRows(S, null).find(r => r.id === 'library.seal').earned);
});

test('the seal stays earned after its page leaves the wall', () => {
  const S = {};
  const sealed = buildPage({room: 'math', seed: 1, pool: poolOf('math')});
  sealed.passages.forEach(p => applyScore(p, RESTORE_AT));
  pinToWall(S, sealed);
  rewardRestored(S, sealed.passages[0], DAY);
  restoreOf(S).wall = []; // the wall is cleared or capped away
  assert.equal(stampRows(S, null).find(r => r.id === 'library.seal').earned, true);
});
