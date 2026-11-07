import {test} from 'node:test';
import assert from 'node:assert/strict';
import {swipeDir} from '../src/ui/swipe.js';
import {createBackStack} from '../src/ui/backGesture.js';
import {roomStep, SHORTCUT_GROUPS, SHORTCUTS} from '../src/ui/keysCore.js';

test('a quick straight drag reads as one direction', () => {
  assert.equal(swipeDir(-120, 4), 'left');
  assert.equal(swipeDir(120, -10), 'right');
  assert.equal(swipeDir(3, -140), 'up');
  assert.equal(swipeDir(-6, 90), 'down');
});

test('taps, short drags and diagonal drags are not swipes', () => {
  assert.equal(swipeDir(0, 0), null);
  assert.equal(swipeDir(30, 10), null);          // too short
  assert.equal(swipeDir(100, 80), null);         // too diagonal to be sideways or vertical
  assert.equal(swipeDir(60, 60), null);
});

/* A fake window: pushState and back() move through a list of entries; a Back press from the user is userBack(),
   and back() (our own) also fires popstate, asynchronously, as a browser does. */
function fakeWin() {
  const listeners = [], entries = [null];
  let idx = 0;
  const fire = () => listeners.forEach(f => f({}));
  return {
    entries, get index() { return idx; },
    addEventListener: (t, f) => { if (t === 'popstate') listeners.push(f); },
    history: {
      get state() { return entries[idx]; },
      pushState(s) { entries.length = idx + 1; entries.push(s); idx++; },
      back() { if (idx > 0) { idx--; queueMicrotask(fire); } },
    },
    userBack() { if (idx > 0) { idx--; fire(); } },
  };
}
const settle = () => new Promise(r => setTimeout(r, 0));

test('a user Back press closes the open overlay and only that one', async () => {
  const w = fakeWin(), s = createBackStack(w);
  let closed = 0;
  s.push('book', {close: () => { closed++; s.pop('book'); }});
  assert.equal(w.index, 1);
  w.userBack();
  assert.equal(closed, 1);
  assert.equal(s.depth, 0);
  assert.equal(w.index, 0);
});

test('closing by the close button takes the history entry back, without a second Back press', async () => {
  const w = fakeWin(), s = createBackStack(w);
  let closed = 0;
  s.push('card', {close: () => closed++});
  s.pop('card');
  await settle();
  assert.equal(w.index, 0);
  assert.equal(s.depth, 0);
  assert.equal(closed, 0);                      // our own back() is not a press: the overlay is not closed twice
});

test('keep() absorbs the Back press and leaves the overlay open', () => {
  const w = fakeWin(), s = createBackStack(w);
  let closed = 0;
  s.push('card', {close: () => closed++, keep: () => true});
  w.userBack();
  assert.equal(closed, 0);
  assert.equal(s.depth, 1);
  assert.equal(w.index, 1);
});

test('stacked overlays unwind one per press: the card first, then the book', () => {
  const w = fakeWin(), s = createBackStack(w);
  const order = [];
  s.push('book', {close: () => { order.push('book'); s.pop('book'); }});
  s.push('card', {close: () => { order.push('card'); s.pop('card'); }});
  w.userBack();
  w.userBack();
  assert.deepEqual(order, ['card', 'book']);
  assert.equal(w.index, 0);
});

test('pushing the same overlay twice (stepping through cards) adds one entry', () => {
  const w = fakeWin(), s = createBackStack(w);
  assert.equal(s.push('card', {close() {}}), true);
  assert.equal(s.push('card', {close() {}}), false);
  assert.equal(w.index, 1);
});

test('with nothing open a Back press does nothing of ours', () => {
  const w = fakeWin(), s = createBackStack(w);
  s.push('help', {close: () => s.pop('help')});
  w.userBack();
  const before = w.index;
  w.userBack();                                 // nothing open now: no close, no history change of ours
  assert.equal(w.index, before);
  assert.equal(s.depth, 0);
});

test('no window (Node, workers) makes every call a harmless no-op', () => {
  const s = createBackStack(null);
  assert.equal(s.push('x', {close() {}}), false);
  s.pop('x');
  assert.equal(s.depth, 0);
});

test('room keys step round the ring: [ and Left go back, ] and Right go on', () => {
  assert.equal(roomStep('['), -1);
  assert.equal(roomStep('ArrowLeft'), -1);
  assert.equal(roomStep(']'), 1);
  assert.equal(roomStep('ArrowRight'), 1);
  assert.equal(roomStep('a'), 0);
  assert.equal(roomStep('constructor'), 0);
});

test('the key sheet lists room keys, Enter on a result and the phone gestures', () => {
  assert.ok(SHORTCUTS.some(([k]) => k === '[ / ] / ← / →'));
  assert.ok(SHORTCUTS.some(([k, d]) => k === 'Enter on a result' && /Next word/.test(d)));
  const phone = SHORTCUT_GROUPS.find(([h]) => h === 'On a phone');
  assert.ok(phone && phone[1].length >= 4);
  assert.ok(phone[1].some(([k]) => k === 'Back'));
});
