import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPool} from '../src/core/wordPool.js';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {dailyWords} from '../src/core/daily.js';
import {SETS} from '../src/sets/sets.js';
import {WORDS} from '../src/core/words.js';
import {captureFullPool, setRoomLists, setRoomEntries, setRoomExtras, applyRoomPool} from '../src/core/roomPool.js';
import {simulateRoom, metWords, metLabel, MIN_DEPTH_WORDS, MIN_REPEAT_GAP_DAYS} from '../src/core/roomDepth.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const POOL = buildPool(read('../public/data/words.json'));
const LISTS = read('../public/data/rooms.json').rooms;
// the real room pool: list + sets + the room's own entries (room-words.json), exactly as entering the room builds it
WORDS.length = 0; WORDS.push(...POOL); captureFullPool();
setRoomLists(LISTS); setRoomEntries(read('../public/data/room-words.json').rooms);
setRoomExtras(Object.fromEntries(ROOMS.map(r => [r.id, SETS.filter(x => x.room === r.id).flatMap(x => x.words)])));
const roomPool = id => { applyRoomPool(id); const p = WORDS.slice(); applyRoomPool(HALL); return p; };

test('every topic room holds at least MIN_DEPTH_WORDS playable words', () => {
  for (const r of ROOMS.filter(r => r.id !== HALL)) {
    const p = roomPool(r.id);
    assert.ok(p.length >= MIN_DEPTH_WORDS, `${r.id} has ${p.length} playable words, floor is ${MIN_DEPTH_WORDS}: widen the room with scripts/build-rooms.mjs and scripts/build-room-words.mjs`);
  }
});

test('60 days of Dailies in each room: no word returns within two weeks, and the room is covered', () => {
  for (const r of ROOMS.filter(r => r.id !== HALL)) {
    const p = roomPool(r.id), s = simulateRoom(p, r.id);
    assert.equal(s.picks, 420);
    assert.ok(s.soonestRepeatDays === null || s.soonestRepeatDays >= MIN_REPEAT_GAP_DAYS, `${r.id}: a word repeats after ${s.soonestRepeatDays} days`);
    assert.ok(s.distinct >= Math.min(p.length, 100) * 0.9, `${r.id}: only ${s.distinct} of ${p.length} words came up in 60 days`);
    console.log(`  depth: ${r.id} holds ${p.length} words; 60 days showed ${s.distinct} distinct, ${(s.repeatRate * 100).toFixed(0)}% repeat picks`);
  }
});

test('a room Daily is deterministic and differs between rooms', () => {
  const day = '2026-12-01', p = roomPool('math');
  const ids = ws => ws.map(w => w.w).join();
  assert.equal(ids(dailyWords(day, 7, {pool: p, ghosts: [], seed: 'math-'})), ids(dailyWords(day, 7, {pool: p, ghosts: [], seed: 'math-'})));
  assert.notEqual(ids(dailyWords(day, 7, {pool: roomPool('art'), ghosts: [], seed: 'art-'})), ids(dailyWords(day, 7, {pool: p, ghosts: [], seed: 'math-'})));
});

test('met counts shelf books and set words in the room, once each, ignoring skips', () => {
  const S = {shelf: [{w: 'bayonet'}, {w: 'bayonet'}, {w: 'banner', skipped: true}, {w: 'zzz'}], sets: {got: {citadel: 40, zzz2: 1}}};
  assert.equal(metWords(S, ['bayonet', 'banner', 'citadel']), 2);
  assert.equal(metWords({}, ['a']), 0);
  assert.equal(metLabel(47, 118), '47 of 118 met');
});
