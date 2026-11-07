import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 NOTE_TEXT, HOME_NOTES, NOTE_TARGET, NOTE_LOOK, NOTE_LIFE_MS,
 noteDue, seenOf, calloutBox, targetOf, mountNote, showFirstNote, clearFirstNote, nextHomeNote, showHomeNote,
} from '../src/ui/firstNotes.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const rect = (left, top, width, height) => ({left, top, width, height, right: left + width, bottom: top + height});

/* a stand-in element: a rect, a class list, a data-note attribute and remove() */
const fakeEl = (r = rect(0, 0, 0, 0)) => {
 const n = {
  rect: r, className: '', dataset: {}, style: {}, attrs: {}, textContent: '', offsetWidth: 200, offsetHeight: 40,
  setAttribute(k, v) { this.attrs[k] = v; },
  getBoundingClientRect() { return this.rect; },
  remove() { if (n.parent) n.parent.children = n.parent.children.filter(c => c !== n); n.removed = true; },
  insertAdjacentHTML() {},
 };
 return n;
};

/* a stand-in document: createElement, a body that keeps what is appended, and the .fcall/.fhalo query */
const fakeDoc = () => {
 const body = {children: [], appendChild(c) { c.parent = body; body.children.push(c); return c; }};
 const doc = {
  body,
  createElement: () => fakeEl(),
  querySelectorAll: sel => (sel === '.fcall, .fhalo' ? body.children.filter(c => /\bf(call|halo)\b/.test(c.className)) : []),
 };
 return doc;
};

/* a root (document or run stage) that holds the given elements by selector */
const rootWith = (map, doc) => ({ownerDocument: doc, querySelector: sel => map[sel] || null, querySelectorAll: () => []});

test('every note line is short, plain and fits a phone', () => {
 for (const [key, line] of [...Object.entries(NOTE_TEXT), ...HOME_NOTES]) {
  assert.ok(line.length > 0, `${key} has text`);
  assert.ok(line.split(/\s+/).length <= 8, `${key} stays under 9 words`);
  assert.ok(line.length <= 40, `${key} fits two lines in a small panel`);
  assert.doesNotMatch(line, /—|–/, `${key} uses no dashes`);
 }
});

test('every note names a target and a look, and the looks vary', () => {
 const keys = [...Object.keys(NOTE_TEXT), ...HOME_NOTES.map(([k]) => k)];
 for (const k of keys) {
  assert.ok(NOTE_TARGET[k], `${k} lights something`);
  assert.ok(['plate', 'card', 'tag', 'seal'].includes(NOTE_LOOK[k]), `${k} has a known panel`);
 }
 assert.ok(new Set(keys.map(k => NOTE_LOOK[k])).size >= 3, 'at least three different panels');
 assert.ok(NOTE_LIFE_MS >= 5000 && NOTE_LIFE_MS <= 15000, 'a note fades on its own after a few seconds');
});

test('a save with no seen field counts as nothing seen yet', () => {
 assert.deepEqual(seenOf({}), {});
 assert.deepEqual(seenOf({seen: 'yes'}), {});
 assert.deepEqual(seenOf({seen: [1]}), {});
 assert.equal(noteDue({}, 'slip'), true);
 assert.equal(noteDue({seen: {slip: 1}}, 'slip'), false);
 assert.equal(noteDue({}, 'unknown'), false, 'only the known keys ever show');
});

test('a panel sits beside its target on a wide window and stays inside it', () => {
 const tr = rect(300, 300, 40, 60);
 assert.deepEqual(calloutBox(tr, 200, 40, 1280, 800), {left: 354, top: 310}, 'right of the target');
 assert.deepEqual(calloutBox(rect(1200, 300, 40, 60), 200, 40, 1280, 800).left, 986, 'no room on the right: left of it');
 assert.deepEqual(calloutBox(rect(0, 0, 40, 40), 200, 40, 1280, 800).top, 8, 'never above the margin');
});

test('on a phone a panel goes under its target, or over it when there is no room below', () => {
 assert.deepEqual(calloutBox(rect(20, 200, 330, 120), 200, 40, 375, 667), {left: 85, top: 332});
 assert.deepEqual(calloutBox(rect(20, 600, 330, 40), 200, 40, 375, 667), {left: 85, top: 548}, 'above when below is off screen');
 const c = calloutBox(rect(340, 300, 30, 30), 260, 40, 375, 667);
 assert.ok(c.left >= 8 && c.left + 260 <= 375 - 8, 'a wide panel stays inside the window');
 assert.deepEqual(calloutBox(rect(20, 500, 330, 60), 200, 40, 375, 667, true), {left: 85, top: 448}, 'a home note goes above its target');
 assert.deepEqual(calloutBox(rect(20, 20, 330, 60), 200, 40, 375, 667, true), {left: 85, top: 92}, 'above is off screen, so below');
});

test('a target counts only when it has a size and is on screen', () => {
 const doc = fakeDoc();
 const el = fakeEl(rect(10, 10, 50, 50));
 assert.equal(targetOf('candle', null), null, 'no document, no target');
 assert.equal(targetOf('candle', rootWith({'#candle': null}, doc)), null, 'no element');
 assert.equal(targetOf('candle', rootWith({'#candle': fakeEl(rect(10, 10, 0, 0))}, doc)), null, 'no size');
 assert.equal(targetOf('unknown', rootWith({}, doc)), null, 'no selector for an unknown key');
 assert.equal(targetOf('candle', rootWith({'#candle': el}, doc)), el);
});

test('a note whose target is not on screen is not shown and not flagged', () => {
 const S = {};
 let saves = 0;
 const root = rootWith({}, fakeDoc());
 assert.equal(showFirstNote(S, 'candle', () => saves++, root), false);
 assert.equal(S.seen, undefined);
 assert.equal(saves, 0);
});

test('a note is lit once, flagged and saved, and never again', () => {
 const doc = fakeDoc();
 const S = {shelf: []};
 let saves = 0;
 const save = () => { saves++; assert.equal(S.seen.candle, 1, 'flag is set before save'); };
 const root = rootWith({'#candle': fakeEl(rect(300, 400, 40, 60))}, doc);
 assert.equal(showFirstNote(S, 'candle', save, root), true);
 assert.equal(saves, 1);
 const panel = doc.body.children.find(c => c.dataset.note === 'candle' && /\bfcall\b/.test(c.className));
 const halo = doc.body.children.find(c => c.dataset.note === 'candle' && /\bfhalo\b/.test(c.className));
 assert.ok(panel, 'a panel is on screen');
 assert.ok(halo, 'the target is lit');
 assert.equal(panel.textContent, NOTE_TEXT.candle);
 assert.equal(panel.attrs.role, 'note');
 assert.match(panel.className, /fcall-card/, 'the candle note uses the pinned card');
 assert.equal(showFirstNote(S, 'candle', save, root), false, 'second time is silent');
 assert.equal(saves, 1);
 assert.equal(doc.body.children.filter(c => /\bfcall\b/.test(c.className)).length, 1);
});

test('one note at a time: a newer note takes down the older one and its halo', () => {
 const doc = fakeDoc();
 const S = {};
 const root = rootWith({'#hint': fakeEl(rect(20, 500, 90, 40)), '#candle': fakeEl(rect(300, 400, 40, 60))}, doc);
 assert.equal(showFirstNote(S, 'candle', () => {}, root), true);
 assert.equal(showFirstNote(S, 'hint', () => {}, root), true);
 const panels = doc.body.children.filter(c => /\bfcall\b/.test(c.className));
 assert.equal(panels.length, 1);
 assert.equal(panels[0].dataset.note, 'hint');
 assert.equal(doc.body.children.filter(c => /\bfhalo\b/.test(c.className)).length, 1);
});

test('mountNote returns null with no document to put it in', () => {
 assert.equal(mountNote('slip', fakeEl(rect(1, 1, 5, 5)), null), null);
});

test('the slip note is rubbed out by the first keystroke, and only that one', () => {
 const removed = [];
 const nodes = [{remove: () => removed.push('slip')}];
 const root = {querySelectorAll: sel => (sel === '.fcall[data-note="slip"], .fhalo[data-note="slip"]' ? nodes : [])};
 assert.equal(clearFirstNote('slip', root), 1);
 assert.deepEqual(removed, ['slip']);
 assert.equal(clearFirstNote('candle', {querySelectorAll: () => []}), 0);
 assert.equal(clearFirstNote('slip', null), 0, 'no document, no crash');
});

test('home lines: the next unseen one lights its target, one per visit, in order', () => {
 const doc = fakeDoc();
 const S = {};
 assert.equal(nextHomeNote(S), 'home.daily');
 const root = rootWith({'#bPlay': fakeEl(rect(40, 200, 300, 60)), '#bUnl': fakeEl(rect(40, 300, 300, 60)), '.rm-door': fakeEl(rect(0, 400, 30, 60)), '#bRooms': fakeEl(rect(40, 500, 300, 60))}, doc);
 let saves = 0;
 assert.equal(showHomeNote(S, () => saves++, root), 'home.daily');
 assert.equal(S.seen['home.daily'], 1);
 assert.equal(saves, 1);
 assert.equal(showHomeNote(S, () => saves++, root), 'home.unlimited', 'the next visit shows the next line');
 assert.equal(showHomeNote({seen: {'home.daily': 1, 'home.unlimited': 1, 'home.doors': 1, 'home.ledger': 1}}, () => {}, root), null, 'all seen: nothing');
});

test('a home line with no target on screen waits, and does not block the lines after it', () => {
 const doc = fakeDoc();
 const S = {};
 const root = rootWith({'#bRooms': fakeEl(rect(40, 500, 300, 60))}, doc);
 S.seen = {'home.daily': 1, 'home.unlimited': 1};
 assert.equal(showHomeNote(S, () => {}, root), 'home.ledger', 'the side door is off screen (phone), so the Ledger line is the one shown');
 assert.equal(S.seen['home.doors'], undefined, 'the door line is not flagged, so it can still show later');
});

test('notes are panels, not ruled paper, and they use tokens and no keyframes', () => {
 const css = read('../src/ui/firstNotes.css');
 assert.match(css, /\.fcall-plate\{/);
 assert.match(css, /\.fcall-card\{/);
 assert.match(css, /\.fcall-tag\{/);
 assert.match(css, /\.fcall-seal\{/);
 assert.doesNotMatch(css, /@keyframes|animation:/, 'reduced motion needs nothing extra: no keyframes here');
 assert.doesNotMatch(css, /repeating-linear-gradient|hslip/, 'no ruled lines and no hint-strip paper');
 assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, 'colours come from tokens');
 assert.match(css, /html\.rm/, 'reduced motion turns the fade off');
});

test('the run screen and the home screen call the notes at their moments', () => {
 const run = read('../src/app/run.js');
 assert.match(run, /import \{showFirstNote,clearFirstNote\} from '\.\.\/ui\/firstNotes\.js'/);
 assert.match(run, /showFirstNote\(S,'slip',save\)/, 'first word explains the answer slip');
 assert.match(run, /if\(left<10000\)showFirstNote\(S,'candle',save\)/, 'the candle explains itself the first time it runs low');
 assert.match(run, /if\(free\)showFirstNote\(S,'hint',save\)/, 'the first hint says it is free');
 assert.match(run, /ta\.oninput=\(\)=>\{Sfx\.quill\(\);clearFirstNote\('slip'\);/);
 const home = read('../src/app/home.js');
 assert.match(home, /import \{showHomeNoteSoon\} from '\.\.\/ui\/firstNotes\.js'/);
 assert.match(home, /if\(!keep\)showHomeNoteSoon\(S,save,ui\.home\)/);
 assert.match(read('../src/main.js'), /import '\.\/ui\/firstNotes\.css';/);
});
