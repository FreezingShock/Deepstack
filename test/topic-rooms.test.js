import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOMS, HALL, roomById, neighbours, isRoom} from '../src/core/rooms.js';
import {installRooms, switchRoom, saveShape, currentRoom, roomData} from '../src/core/roomStore.js';
import {captureFullPool, setRoomLists, applyRoomPool, roomSeed, MIN_ROOM_WORDS} from '../src/core/roomPool.js';
import {WORDS, GHOSTS} from '../src/core/words.js';
import {buildPool} from '../src/core/wordPool.js';
import {dailyWords} from '../src/core/daily.js';
import {dailyRiddleWords} from '../src/core/riddleDaily.js';
import {isBlocked} from '../src/core/blocklist.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const POOL = buildPool(read('../public/data/words.json'));
const LISTS = read('../public/data/rooms.json').rooms;

test('the registry: the Reading Room first, unique ids, a ring of neighbours', () => {
  assert.equal(ROOMS[0].id, HALL);
  assert.equal(new Set(ROOMS.map(r => r.id)).size, ROOMS.length);
  for (const r of ROOMS) { assert.ok(r.name && r.topic && r.rgb.length === 3); assert.equal(roomById(r.id), r); }
  assert.equal(roomById('nope').id, HALL);
  assert.equal(neighbours(HALL).prev.id, ROOMS.at(-1).id);
  assert.equal(neighbours(ROOMS.at(-1).id).next.id, HALL);
  for (const id of ['history', 'math', 'science', 'english', 'art', 'body']) assert.ok(isRoom(id), id);
});

test('each topic room has a playable, unblocked word list big enough for a month of Dailies', () => {
  const playable = new Set(POOL.map(w => w.w));
  for (const r of ROOMS.filter(r => r.id !== HALL)) {
    const list = LISTS[r.id];
    assert.ok(Array.isArray(list) && list.length >= Math.max(MIN_ROOM_WORDS, 100), `${r.id}: ${list && list.length}`);
    for (const w of list) { assert.ok(playable.has(w), `${r.id}: ${w} not playable`); assert.ok(!isBlocked(w, ''), `${r.id}: ${w} blocked`); }
  }
});

test('room save data: a fresh Daily and rating per room, the Reading Room untouched on disk', () => {
  const S = {shelf: [], daily: {'2026-11-05': {score: 1}}, streak: {last: '2026-11-05', n: 3}, rating: {L: 6, placed: true}};
  installRooms(S);
  assert.equal(currentRoom(S), HALL);
  assert.ok(switchRoom(S, 'history'));
  assert.deepEqual(S.daily, {}); assert.equal(S.rating.placed, false); assert.equal(S.streak.n, 0);
  S.daily['2026-11-06'] = {score: 2}; S.rating = {...S.rating, L: 2, placed: true};
  const disk = JSON.parse(JSON.stringify(S));
  assert.deepEqual(disk.daily, {'2026-11-05': {score: 1}}, 'top level stays the Reading Room');
  assert.equal(disk.rating.L, 6);
  assert.deepEqual(disk.rooms.history.daily, {'2026-11-06': {score: 2}});
  assert.equal(disk.room, 'history');
  assert.equal(roomData(S, HALL).rating.L, 6);
  // reload: lands back in the Chronicle with its own data
  const S2 = installRooms(disk);
  assert.equal(currentRoom(S2), 'history');
  assert.deepEqual(S2.daily, {'2026-11-06': {score: 2}}); assert.equal(S2.rating.L, 2);
  assert.ok(switchRoom(S2, HALL));
  assert.deepEqual(S2.daily, {'2026-11-05': {score: 1}}); assert.equal(S2.rating.L, 6); assert.equal(S2.streak.n, 3);
  assert.equal(S2.rooms.history.rating.L, 2);
  assert.equal(switchRoom(S2, HALL), false); assert.equal(switchRoom(S2, 'nope'), false);
  assert.equal(JSON.stringify(saveShape(S2)), JSON.stringify(S2));
});

test('old saves and damaged room data load cleanly', () => {
  const S = installRooms({shelf: [], daily: {}, room: 'gone', rooms: {history: 'junk', fake: {}}});
  assert.equal(currentRoom(S), HALL);
  assert.deepEqual(Object.keys(S.rooms), ['history']);
  switchRoom(S, 'history');
  assert.deepEqual(S.daily, {}); assert.equal(typeof S.rating.L, 'number');
});

test('the word pool narrows per room; the Reading Room Daily and the riddle never change', () => {
  WORDS.length = 0; WORDS.push(...POOL); GHOSTS.length = 0; GHOSTS.push(...POOL.ghosts);
  const day = '2026-11-06';
  const hallDaily = dailyWords(day, 7).map(w => w.w), riddle = dailyRiddleWords(day).map(w => w.w);
  captureFullPool(); setRoomLists(LISTS);
  const n = applyRoomPool('history');
  assert.equal(n, POOL.filter(w => LISTS.history.includes(w.w)).length);
  assert.equal(roomSeed(), 'history-');
  const hist = dailyWords(day, 7);
  assert.ok(hist.every(w => LISTS.history.includes(w.w)), 'the Chronicle Daily uses Chronicle words');
  assert.notDeepEqual(hist.map(w => w.w), hallDaily);
  assert.deepEqual(dailyWords(day, 7).map(w => w.w), hist.map(w => w.w), 'seeded: same words twice');
  assert.deepEqual(dailyRiddleWords(day).map(w => w.w), riddle, 'riddle is shared by every room');
  applyRoomPool('math');
  assert.notDeepEqual(dailyWords(day, 7).map(w => w.w), hist.map(w => w.w));
  applyRoomPool(HALL);
  assert.equal(WORDS.length, POOL.length); assert.equal(roomSeed(), '');
  assert.deepEqual(dailyWords(day, 7).map(w => w.w), hallDaily);
  setRoomLists({history: ['abandon']}); // a broken list falls back to every word
  applyRoomPool('history'); assert.equal(WORDS.length, POOL.length); assert.equal(roomSeed(), '');
  applyRoomPool(HALL); setRoomLists(LISTS);
});
