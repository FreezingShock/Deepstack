import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeStore, SAVE_KEY, UNREADABLE_KEY} from '../src/core/saveStore.js';
import {onState, clearState, openStates} from '../src/core/stateEvents.js';

/** A Map-backed storage; `broken` makes every call throw the way a full or blocked browser does. */
function fakeStorage(broken = {}) {
  const m = new Map();
  return {
    m,
    getItem(k) { if (broken.read) throw new DOMException('blocked', 'SecurityError'); return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { if (broken.write) throw new DOMException('full', 'QuotaExceededError'); m.set(k, String(v)); },
  };
}
const reset = () => ['storage-read', 'storage-write', 'save-unreadable'].forEach(clearState);
const kinds = () => openStates().map(e => e.kind);

test('a readable save loads and round-trips without any report', () => {
  reset();
  const st = fakeStorage(), mem = {};
  const s = makeStore(mem, () => st);
  st.m.set(SAVE_KEY, JSON.stringify({shelf: [1, 2]}));
  assert.deepEqual(s.get(SAVE_KEY, {}), {shelf: [1, 2]});
  s.set(SAVE_KEY, {shelf: [1, 2, 3]});
  assert.deepEqual(JSON.parse(st.m.get(SAVE_KEY)), {shelf: [1, 2, 3]});
  assert.deepEqual(kinds(), []);
});

test('a save that will not parse is copied aside once, reported, and the default is used', () => {
  reset();
  const st = fakeStorage(), mem = {};
  const s = makeStore(mem, () => st);
  st.m.set(SAVE_KEY, '{"shelf":[');
  assert.deepEqual(s.get(SAVE_KEY, {fresh: true}), {fresh: true});
  assert.equal(st.m.get(UNREADABLE_KEY), '{"shelf":[');
  assert.deepEqual(kinds(), ['save-unreadable']);
  // a second read keeps the first copy rather than overwriting it
  st.m.set(SAVE_KEY, 'other broken');
  s.get(SAVE_KEY, {});
  assert.equal(st.m.get(UNREADABLE_KEY), '{"shelf":[');
  reset();
});

test('an unreadable key other than the save is not copied or reported', () => {
  reset();
  const st = fakeStorage();
  st.m.set('deepstack.cabinet.v1', '{bad');
  makeStore({}, () => st).get('deepstack.cabinet.v1', null);
  assert.equal(st.m.has(UNREADABLE_KEY), false);
  assert.deepEqual(kinds(), []);
});

test('storage that cannot be read is reported once and the in-memory value still answers', () => {
  reset();
  const mem = {'deepstack.v1': {live: true}};
  const s = makeStore(mem, () => fakeStorage({read: true, write: true}));
  assert.deepEqual(s.get(SAVE_KEY, {}), {live: true});
  s.get(SAVE_KEY, {});
  assert.deepEqual(kinds(), ['storage-read']);
  s.set(SAVE_KEY, {live: 2}); // writes are quiet once reads have already said storage is shut
  assert.deepEqual(kinds(), ['storage-read']);
  reset();
});

test('a full store is reported with a retry, which clears the report once a write lands', () => {
  reset();
  let broken = {write: true};
  const st = fakeStorage(broken), mem = {};
  const s = makeStore(mem, () => st);
  const seen = [];
  const off = onState(e => seen.push(e));
  s.set(SAVE_KEY, {shelf: ['a']});
  const entry = seen.find(e => e.kind === 'storage-write');
  assert.ok(entry && typeof entry.retry === 'function', 'a retry is offered');
  entry.retry(); // still full: the report stays open
  assert.deepEqual(kinds(), ['storage-write']);
  broken = {};
  st.setItem = (k, v) => st.m.set(k, String(v)); // space freed
  entry.retry();
  assert.deepEqual(kinds(), []);
  assert.equal(JSON.parse(st.m.get(SAVE_KEY)).shelf[0], 'a', 'the latest value is written on retry');
  off();
  reset();
});
