// The first-visit halo follows its target. The browser side is checked by scripts/onboarding-halo.mjs (it fails on the old
// one-shot placement); these tests pin the follower and the retry with stand-in nodes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {followNote, showHomeNoteSoon, NOTE_TARGET} from '../src/ui/firstNotes.js';

const rect = (left, top, width, height) => ({left, top, width, height, right: left + width, bottom: top + height});
const fakeEl = (r, extra = {}) => ({
  rect: r, style: {}, dataset: {}, className: '', offsetWidth: 200, offsetHeight: 40, isConnected: true, hidden: false,
  getBoundingClientRect() { return this.rect; }, remove() { this.isConnected = false; }, ...extra,
});

// Runs the follower's frames by hand: each call is one animation frame.
function frames() {
  const queue = [];
  globalThis.requestAnimationFrame = fn => { queue.push(fn); return queue.length; };
  return {
    step(n = 1) { for (let i = 0; i < n; i++) { const q = queue.splice(0); q.forEach(fn => fn()); } },
    pending: () => queue.length,
  };
}

test('followNote moves the halo and panel with a target that moves, frame by frame', () => {
  const f = frames();
  const target = fakeEl(rect(804, 480, 313, 55));
  const halo = fakeEl(rect(0, 0, 0, 0)), panel = fakeEl(rect(0, 0, 0, 0));
  followNote('home.daily', target, halo, panel);
  assert.equal(halo.style.left, '799px', 'placed at mount: the target less the 5px ring');
  target.rect = rect(801, 465, 318, 56); // the home's fade-up moved it
  f.step();
  assert.equal(halo.style.top, '460px', 'the halo follows on the next frame');
  assert.equal(halo.style.width, '328px');
  target.rect = rect(810, 470, 318, 56); // a book shifts
  f.step();
  assert.equal(halo.style.left, '805px');
  globalThis.requestAnimationFrame = undefined;
});

test('a re-rendered target is followed to its replacement, and a target that is gone takes the note with it', () => {
  const f = frames();
  const old = fakeEl(rect(100, 100, 50, 50));
  const fresh = fakeEl(rect(300, 200, 60, 60));
  const halo = fakeEl(rect(0, 0, 0, 0)), panel = fakeEl(rect(0, 0, 0, 0));
  followNote('home.doors', old, halo, panel, () => fresh);
  old.isConnected = false; // the side doors were re-rendered
  f.step();
  assert.equal(halo.style.left, '295px', 'follows the new element');
  assert.equal(halo.isConnected, true);

  const gone = fakeEl(rect(10, 10, 20, 20));
  const halo2 = fakeEl(rect(0, 0, 0, 0)), panel2 = fakeEl(rect(0, 0, 0, 0));
  followNote('home.ledger', gone, halo2, panel2, () => null);
  gone.isConnected = false;
  f.step();
  assert.equal(halo2.isConnected, false, 'no replacement: the halo goes');
  assert.equal(panel2.isConnected, false, 'and so does the panel');
  globalThis.requestAnimationFrame = undefined;
});

test('a hidden target hides its note until it has a size again', () => {
  const f = frames();
  const target = fakeEl(rect(50, 50, 0, 0));
  const halo = fakeEl(rect(0, 0, 0, 0)), panel = fakeEl(rect(0, 0, 0, 0));
  followNote('home.unlimited', target, halo, panel);
  assert.equal(halo.hidden, true);
  assert.equal(panel.hidden, true);
  target.rect = rect(50, 50, 120, 40);
  f.step();
  assert.equal(halo.hidden, false);
  globalThis.requestAnimationFrame = undefined;
});

test('the side doors are looked for in the document, and the home note waits a few frames for them', () => {
  assert.equal(NOTE_TARGET['home.doors'], '.rm-door');
  const f = frames();
  let placed = false;
  const doorsDoc = {body: {appendChild() {}}, createElement: () => ({...fakeEl(rect(0, 0, 0, 0)), setAttribute() {}}), querySelectorAll: () => [], querySelector: sel => (sel === '.rm-door' && placed ? fakeEl(rect(20, 300, 120, 200)) : null), ownerDocument: null};
  const home = {isConnected: true, closest: () => null, querySelector: () => null, ownerDocument: doorsDoc};
  const S = {seen: {'home.daily': 1, 'home.unlimited': 1, 'home.ledger': 1}};
  let saves = 0;
  showHomeNoteSoon(S, () => saves++, home, 10);
  f.step(3);
  assert.equal(saves, 0, 'no door yet: nothing is shown or flagged');
  placed = true;
  f.step();
  assert.equal(S.seen['home.doors'], 1, 'once the doors are placed the line is flagged');
  assert.equal(saves, 1);
  globalThis.requestAnimationFrame = undefined;
});
