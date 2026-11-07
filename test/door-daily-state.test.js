// DS-door: each side-door plate says whether that room's Daily for today is done or still open.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS, neighbours} from '../src/core/rooms.js';
import {installRooms, roomData} from '../src/core/roomStore.js';
import {loadRating} from '../src/core/unlimited.js';

const today = '2026-11-07';
const plateOf = html => /<span class="rm-plate">([\s\S]*?)<\/span>\s*<span class="rm-arch"/.exec(html)[1];

test('a door plate shows Daily: done once the room has played today', async () => {
  const {doorHTML} = await import('../src/ui/roomHome.js');
  const h = doorHTML(ROOMS[1], 'prev', '0 of 413 met', true);
  assert.match(plateOf(h), /<small class="rm-daily done">Daily: done<\/small>/);
  assert.match(h, /aria-label="Previous room: The Chronicle History 0 of 413 met Daily: done"/);
  assert.match(h, /Previous room: The Chronicle/); // the name and topic stay as they were
});

test('a door plate shows Daily: open while today\'s Daily is still to play', async () => {
  const {doorHTML} = await import('../src/ui/roomHome.js');
  const h = doorHTML(ROOMS[3], 'next', '0 of 809 met', false);
  assert.match(plateOf(h), /<small class="rm-daily open">Daily: open<\/small>/);
  assert.doesNotMatch(plateOf(h), /Daily: done/);
  assert.match(h, /Daily: open"/);
});

test('no Daily line when the caller does not say (the old call shape)', async () => {
  const {doorHTML} = await import('../src/ui/roomHome.js');
  const h = doorHTML(ROOMS[1], 'prev');
  assert.doesNotMatch(h, /Daily:/);
  assert.doesNotMatch(h, /rm-daily/);
});

test('the Daily state read for a door comes from that room\'s own save', () => {
  // the same lookup mountRoomHome's daily callback makes (src/app/home.js): roomData(S, id).daily[today]
  const S = {room: 'math', daily: {}, rating: loadRating(null), streak: {last: '', n: 0}, shelf: [], rooms: {history: {daily: {[today]: 420}}}};
  installRooms(S);
  const {prev, next} = neighbours('math');
  assert.equal(prev.id, 'history');
  assert.equal(!!(roomData(S, prev.id).daily || {})[today], true);   // played in The Chronicle today
  assert.equal(!!(roomData(S, next.id).daily || {})[today], false);  // not yet in The Observatory
  assert.equal(!!(roomData(S, 'math').daily || {})[today], false);   // the room you are in
});
