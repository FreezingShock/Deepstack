import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {captureFullPool, setRoomLists, setRoomEntries, roomEntries, applyRoomPool} from '../src/core/roomPool.js';
import {WORDS} from '../src/core/words.js';
import {rejectReason} from '../src/core/wordPool.js';
import {isBlocked} from '../src/core/blocklist.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const RW = read('../public/data/room-words.json');
const ANCHORS = read('../scripts/data/room-anchors.json');
const LISTS = read('../public/data/rooms.json').rooms;
const topicRooms = ROOMS.filter(r => r.id !== HALL);

test('room-words.json: every topic room has sorted, unique, playable, unblocked entries in the documented shape', () => {
  assert.deepEqual(RW.cols, ['w', 'pos', 'def', 'd', 't', 'hint']);
  for (const r of topicRooms) {
    const list = RW.rooms[r.id];
    assert.ok(list.length >= 300, `${r.id}: ${list.length}`);
    assert.equal(new Set(list.map(e => e[0])).size, list.length, `${r.id}: duplicate words`);
    for (const [w, pos, def, d, t] of list) {
      assert.match(w, /^[a-z]{5,16}$/);
      assert.ok(!isBlocked(w, def), `${r.id}: ${w} blocked`);
      assert.equal(rejectReason({w, pos, def, d, t: Math.max(t, 25)}), null, `${r.id}: ${w} fails the playability filter`);
    }
  }
});

test('the hand-picked anchor words that can be asked at all are in their room (the TA1 audit, as a guard)', () => {
  for (const r of topicRooms) {
    const have = new Set([...(LISTS[r.id] || []), ...RW.rooms[r.id].map(e => e[0])]);
    const miss = ANCHORS[r.id].filter(w => !have.has(w));
    assert.ok(miss.length / ANCHORS[r.id].length <= 0.15, `${r.id} is missing ${miss.join(', ')}`);
  }
});

test('a room plays its own sense of a word, and the Reading Room is untouched', () => {
  const full = WORDS.slice();
  captureFullPool();
  setRoomLists(LISTS); setRoomEntries(RW.rooms);
  const e = roomEntries('math').find(x => x.w === 'theorem');
  assert.ok(e && /mathematic|proposition|proven|statement/i.test(e.def), e && e.def);
  applyRoomPool('math');
  assert.equal(WORDS.find(w => w.w === 'theorem').def, e.def);
  assert.ok(WORDS.length >= RW.rooms.math.length);
  applyRoomPool(HALL);
  assert.equal(WORDS.length, full.length);
  setRoomEntries(null);
});

test('room words carry their other senses in senses.json (the shape the judge reads), including the hand-added prose sense', () => {
  const SEN = read('../public/data/senses.json').words;
  let withAlt = 0, total = 0;
  for (const r of topicRooms) for (const [w] of RW.rooms[r.id]) {
    total++;
    const alt = SEN[w]?.alt;
    if (!alt) continue;
    withAlt++;
    assert.ok(alt.length <= 4, w);
    for (const [pos, g] of alt) { assert.match(pos, /^(noun|verb|adjective|adverb)$/); assert.ok(g.length >= 10, `${w}: ${g}`); }
  }
  assert.ok(withAlt / total > 0.4, `${withAlt}/${total} room words have other senses`);
  assert.ok(SEN.prose.alt.some(a => /ordinary/i.test(a[1])));
});
