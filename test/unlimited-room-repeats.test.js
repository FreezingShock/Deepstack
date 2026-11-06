import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPool} from '../src/core/wordPool.js';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {SETS} from '../src/sets/sets.js';
import {WORDS} from '../src/core/words.js';
import {captureFullPool, setRoomLists, setRoomEntries, setRoomExtras, applyRoomPool} from '../src/core/roomPool.js';
import {newRating, loadRating, nextWord, applyResult, finishRating, RUN_WORDS, SEEN_CAP} from '../src/core/unlimited.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
WORDS.length = 0; WORDS.push(...buildPool(read('../public/data/words.json'))); captureFullPool();
setRoomLists(read('../public/data/rooms.json').rooms); setRoomEntries(read('../public/data/room-words.json').rooms);
setRoomExtras(Object.fromEntries(ROOMS.map(r => [r.id, SETS.filter(x => x.room === r.id).flatMap(x => x.words)])));

/** Plays `runs` Unlimited runs in the active room and returns every word dealt, in order. */
function play(runs) {
  let r = {...newRating(), placed: true}; const dealt = [];
  for (let k = 0; k < runs; k++) {
    const used = [];
    for (let i = 0; i < RUN_WORDS; i++) { const w = nextWord(r, i, RUN_WORDS, used); used.push(w.id); dealt.push(w.w); r = applyResult(r, w, 60, i); }
    r = finishRating(r, 60);
  }
  return {dealt, r};
}

test('Unlimited never repeats a word in a room until every word in it has been dealt', () => {
  for (const room of ROOMS.filter(x => x.id !== HALL)) {
    const n = applyRoomPool(room.id);
    assert.ok(n <= SEEN_CAP, `${room.id} (${n}) must fit under the seen cap`);
    const runs = Math.floor(n / RUN_WORDS);
    const {dealt} = play(runs);
    assert.equal(new Set(dealt).size, dealt.length, `${room.id}: a word came up twice before the room was spent`);
    applyRoomPool(HALL);
  }
});

test('a spent room replays the words met longest ago first, never one from the run before', () => {
  applyRoomPool('math');
  const n = WORDS.length, runs = Math.ceil(n / RUN_WORDS) + 6;
  const {dealt} = play(runs);
  for (let i = n; i < dealt.length; i++) {
    const lastSeen = dealt.lastIndexOf(dealt[i], i - 1);
    assert.ok(i - lastSeen > 30, `${dealt[i]} came back after only ${i - lastSeen} words`);
  }
  applyRoomPool(HALL);
});

test('old saves still load: seen ids are kept, trimmed to the cap', () => {
  const r = loadRating({L: 5, placed: true, seen: Array.from({length: SEEN_CAP + 50}, (_, i) => i)});
  assert.equal(r.seen.length, SEEN_CAP);
  assert.equal(r.seen.at(-1), SEEN_CAP + 49);
});
