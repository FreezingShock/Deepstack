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
