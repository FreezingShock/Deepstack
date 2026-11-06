import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {SETS, setsOfRoom} from '../src/sets/sets.js';
import {setRing} from '../src/ui/sigil.js';
import {setRoomLists, setRoomExtras, roomList} from '../src/core/roomPool.js';
import {installRooms} from '../src/core/roomStore.js';
import {loadRating} from '../src/core/unlimited.js';

test('every set lives in a topic room, three to a room', () => {
  const ids = new Set(ROOMS.map(r => r.id));
  for (const s of SETS) assert.ok(ids.has(s.room) && s.room !== HALL, s.id);
  for (const r of ROOMS.slice(1)) assert.equal(setsOfRoom(r.id).length, 3, r.id);
  assert.deepEqual(SETS.slice(0, 6).map(s => s.id), ['time', 'weather', 'land', 'travel', 'speech', 'craft']); // rings unchanged
  assert.deepEqual(setRing(3), {ring: 'ticked', ring2: false});
});

test("a room's pool holds its sets' words", () => {
  setRoomLists({history: ['siege']});
  setRoomExtras({history: ['epoch', 'siege']});
  assert.deepEqual(roomList('history'), ['siege', 'epoch']);
  setRoomExtras({}); setRoomLists(null);
});

test('the Room ledger: every room opens on a left page, sets follow their room, Enter everywhere but here', async () => {
  globalThis.document ??= undefined;
  const {roomLeaves} = await import('../src/ui/roomLedger.js');
  const S = {sets: {got: {epoch: 40}, done: {}}, daily: {}, rating: loadRating(null)};
  installRooms(S);
  const {leaves, at} = roomLeaves(S, {today: '2026-11-06', lexicon: () => 'B1', words: () => 120});
  for (const r of ROOMS.slice(1)) {
    assert.equal(at[r.id] % 2, 0, r.id + ' on a left page');
    assert.match(leaves[at[r.id]], new RegExp(`data-room="${r.id}"`));
    for (const s of setsOfRoom(r.id)) assert.ok(leaves.slice(at[r.id], at[r.id] + 4).some(l => l.includes(s.name.replace(/[’]/g, '’'))), s.id);
  }
  assert.match(leaves[at[HALL]], /You are here/);
  assert.match(leaves[0], /Room ledger/);
});

test('ring of lights and side doors name the rooms', async () => {
  const {ringHTML, doorHTML} = await import('../src/ui/roomHome.js');
  const h = ringHTML('math');
  assert.equal((h.match(/class="rm-dot/g) || []).length, ROOMS.length);
  assert.match(h, /rm-dot on" data-room="math"/);
  assert.match(doorHTML(ROOMS[1], 'prev'), /Previous room: The Chronicle/);
});

test('shelf room tabs: books without a room are Reading Room books', async () => {
  const {bookRoom, roomCounts} = await import('../src/core/shelfRooms.js');
  const {filterShelf} = await import('../src/core/shelf.js');
  const shelf = [{w: 'a', tier: 1, score: 30}, {w: 'b', tier: 1, score: 30, room: 'math'}, {w: 'c', tier: 1, score: 30, room: 'nowhere'}];
  assert.equal(bookRoom(shelf[0]), HALL); assert.equal(bookRoom(shelf[2]), HALL);
  assert.equal(roomCounts(shelf).hall, 2); assert.equal(roomCounts(shelf).math, 1);
  assert.deepEqual(filterShelf(shelf, {room: 'math'}).map(x => x.b.w), ['b']);
  assert.equal(filterShelf(shelf, {}).length, 3);
});

test('stats per room read each room on its own', async () => {
  const {roomRows, roomStatsLeaves} = await import('../src/ui/roomStats.js');
  const {computeStats} = await import('../src/core/stats.js');
  const S = {shelf: [{w: 'x', tier: 2, score: 40, room: 'art'}], sets: {got: {}, done: {}}, daily: {'2026-11-06': {depth: 500, books: []}},
    rating: {...loadRating(null), placed: true, L: 6}, rooms: {art: {daily: {}, rating: {placed: true, L: 3}}}};
  installRooms(S);
  const rows = roomRows(S, {today: '2026-11-06', computeStats});
  const by = Object.fromEntries(rows.map(x => [x.r.id, x]));
  assert.equal(by.hall.runs, 1); assert.equal(by.hall.deepest, 500); assert.equal(by.hall.lex, 60);
  assert.equal(by.art.runs, 0); assert.equal(by.art.lex, 30); assert.equal(by.art.books, 1);
  assert.equal(by.math.lex, null);
  const [l, r] = roomStatsLeaves(S, {today: '2026-11-06', computeStats});
  assert.match(l, /The Rooms/); assert.match(r, /Strongest: The Reading Room/);
});
