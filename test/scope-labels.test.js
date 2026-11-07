import test from 'node:test';
import assert from 'node:assert/strict';
import {scopeRoom, roomTag, allTag, ALL} from '../src/ui/scope.js';
import {ledgerHTML} from '../src/ui/welcome.js';
import {statsLeaves} from '../src/ui/statsPages.js';
import {installRooms, switchRoom} from '../src/core/roomStore.js';

const TIERS = Array.from({length: 7}, (_, i) => ({id: i, name: 'T' + i, spine: '#888'}));
const base = {runs: 3, streak: 2, bestStreak: 2, deepest: 300, books: 3, answered: 3, tiers: [3, 0, 0, 0, 0, 0, 0], recent: [], totalFt: 10, avg: 50};
const ctx = {TIERS, FLOORS: [{id: 0, name: 'A', sub: 'a'}], floorStartFt: () => 0};

test('scopeRoom follows the active room', () => {
  const S = installRooms({shelf: [], daily: {}, streak: {last: '', n: 0}});
  assert.equal(scopeRoom(S).id, 'hall');
  switchRoom(S, 'history');
  assert.equal(scopeRoom(S).short, 'Chronicle');
});

test('Card tags the streak as this room and books/deepest as all rooms', () => {
  const html = ledgerHTML({streak: 0, deepest: 300, books: 5, floor: '', room: scopeRoom({room: 'history', rooms: {}})});
  const row = c => html.match(new RegExp(`lg-${c}[^>]*>.*?</div>`))[0];
  assert.match(row('streak'), /Chronicle/);
  assert.match(row('deep'), new RegExp(ALL));
  assert.match(row('books'), new RegExp(ALL));
  assert.doesNotMatch(ledgerHTML({streak: 0, deepest: 0, books: 0}), /scope/);
});

test('Almanac labels its pages', () => {
  const l = statsLeaves(base, {room: 'history', rooms: {}, shelf: [{tier: 0}], rating: {hist: []}}, ctx);
  assert.match(l[0], /scope-room/);
  assert.match(l[0], /Deepest dive[\s\S]*all rooms/);
  assert.match(l[1], /Chronicle/);
  assert.match(l[2], /scope-all/);
  assert.match(l[3], /scope-all/);
  assert.match(roomTag(scopeRoom({})), /Reading Room/);
  assert.match(allTag(), /all rooms/);
});

/* CI guard: every room labels every readout, so a new room or a new row can't ship unlabelled. */
import {ROOMS} from '../src/core/rooms.js';
for (const r of ROOMS) {
  test(`scope labels in ${r.id}`, () => {
    const S = {room: r.id, rooms: {}, shelf: [{tier: 0}], rating: {hist: []}};
    const room = scopeRoom(S);
    assert.equal(room.id, r.id);
    const card = ledgerHTML({streak: 1, deepest: 10, books: 2, floor: 'The Archive', room});
    const rows = card.match(/<div class="lg-row[\s\S]*?<\/span>/g);
    assert.equal(rows.length, 4);
    for (const row of rows) assert.match(row, /class="scope /, 'every Card row is tagged');
    assert.match(rows[0], new RegExp(r.short), 'streak names the room');
    for (const row of rows.slice(1)) assert.match(row, /all rooms/);
    const pages = statsLeaves(base, S, ctx);
    assert.match(pages[0], new RegExp(r.short));
    assert.match(pages[1], new RegExp(r.short));
    assert.match(pages[2], /scope-all/);
    assert.match(pages[3], /scope-all/);
  });
}

import {anyRoomStreak} from '../src/ui/statsPages.js';
test('any-room streak counts a day when any room played', () => {
  const S = installRooms({shelf: [], daily: {'2026-11-05': {}, '2026-11-06': {}}, streak: {last: '2026-11-06', n: 2}});
  S.rooms.history = {daily: {'2026-11-04': {}}, streak: {last: '2026-11-04', n: 1}};
  assert.deepEqual(anyRoomStreak(S, '2026-11-06'), {n: 3, best: 3});
  const l = statsLeaves(base, S, ctx);
  assert.match(l[0], /Any room/);
});
