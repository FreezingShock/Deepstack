import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NOTE_TEXT, noteDue, seenOf, showFirstNote, firstNoteHTML, clearFirstNote} from '../src/ui/firstNotes.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

/* a minimal stand-in for the run stage's #hl strip: records what lands in it and whether it was lit */
const fakeRoot = () => {
 const hl = {html: '', classes: new Set(), insertAdjacentHTML(_, h) { this.html += h; }, classList: {add: c => hl.classes.add(c)}};
 return {hl, querySelector: sel => (sel === '#hl' ? hl : null)};
};

test('every first-time note is one short plain line', () => {
 for (const [key, line] of Object.entries(NOTE_TEXT)) {
  assert.ok(line.length > 0, `${key} has text`);
  assert.ok(line.split(/\s+/).length <= 6, `${key} stays under 6 words`);
  /* a phone's run sheet has room for one pencilled line; two lines squeeze the answer slip (measured at 375x667) */
  assert.ok(line.length <= 34, `${key} fits one line at 375 wide`);
  assert.doesNotMatch(line, /—|–/, `${key} uses no dashes`);
 }
});

test('a save with no seen field counts as nothing seen yet', () => {
 assert.deepEqual(seenOf({}), {});
 assert.deepEqual(seenOf({seen: 'yes'}), {});
 assert.deepEqual(seenOf({seen: [1]}), {});
 assert.equal(noteDue({}, 'slip'), true);
 assert.equal(noteDue({seen: {slip: 1}}, 'slip'), false);
 assert.equal(noteDue({}, 'unknown'), false, 'only the known keys ever show');
});

test('a note is written once, flagged and saved before it is shown', async () => {
 const S = {shelf: []};
 let saves = 0;
 const save = () => { saves++; assert.equal(S.seen.candle, 1, 'flag is set before save'); };
 const root = fakeRoot();
 assert.equal(showFirstNote(S, 'candle', save, root), true);
 assert.equal(saves, 1);
 assert.match(root.hl.html, /class="hslip fnote"/);
 assert.match(root.hl.html, /data-note="candle"/);
 await new Promise(r => setTimeout(r, 5)); // the strip is lit on the next frame, like the hint slips
 assert.ok(root.hl.classes.has('on'), 'the strip is lit so the note fades in with the hints');
 assert.equal(showFirstNote(S, 'candle', save, root), false, 'second time is silent');
 assert.equal(saves, 1);
 assert.equal(root.hl.html.match(/fnote/g).length, 1);
 assert.equal(S.seen.candle, 1);
});

test('one aside at a time: a newer note replaces the older one in the DOM', () => {
 const S = {};
 const removed = [];
 const old = {remove: () => removed.push('old')};
 const hl = {html: '', classes: new Set(), insertAdjacentHTML(_, h) { this.html += h; }, classList: {add() {}}, querySelectorAll: () => [old]};
 const root = {querySelector: sel => (sel === '#hl' ? hl : null)};
 assert.equal(showFirstNote(S, 'hint', () => {}, root), true);
 assert.deepEqual(removed, ['old']);
 assert.match(hl.html, /data-note="hint"/);
});

test('no strip on the page means nothing is flagged, so the note waits for a real run screen', () => {
 const S = {};
 assert.equal(showFirstNote(S, 'slip', () => {}, {querySelector: () => null}), false);
 assert.equal(S.seen, undefined);
});

test('the slip note is rubbed out by the first keystroke, and only that one', () => {
 const removed = [];
 const mk = key => ({remove: () => removed.push(key)});
 const nodes = [mk('slip')];
 const root = {querySelectorAll: sel => (sel === '#hl .fnote[data-note="slip"]' ? nodes : [])};
 assert.equal(clearFirstNote('slip', root), 1);
 assert.deepEqual(removed, ['slip']);
 assert.equal(clearFirstNote('candle', {querySelectorAll: () => []}), 0);
 assert.equal(clearFirstNote('slip', null), 0, 'no document, no crash');
 const run = read('../src/app/run.js');
 assert.match(run, /ta\.oninput=\(\)=>\{Sfx\.quill\(\);clearFirstNote\('slip'\);/);
});

test('note markup escapes its key and text', () => {
 assert.doesNotMatch(firstNoteHTML('<img>'), /<img>/);
 assert.match(firstNoteHTML('slip'), /Explain it, then send\./);
});

test('the run screen shows the three notes at their moments', () => {
 const src = read('../src/app/run.js');
 assert.match(src, /import \{showFirstNote,clearFirstNote\} from '\.\.\/ui\/firstNotes\.js'/);
 assert.match(src, /showFirstNote\(S,'slip',save\)/, 'first word explains the answer slip');
 assert.match(src, /if\(left<10000\)showFirstNote\(S,'candle',save\)/, 'the candle explains itself the first time it runs low');
 assert.match(src, /if\(free\)showFirstNote\(S,'hint',save\)/, 'the first hint says it is free');
});

test('notes are styled as pencil on the existing strip and add no animation', () => {
 const css = read('../src/ui/firstNotes.css');
 assert.match(css, /\.hslip\.fnote\{/);
 assert.doesNotMatch(css, /animation/, 'reduced motion needs nothing extra: no keyframes here');
 assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, 'colours come from tokens');
 assert.match(read('../src/main.js'), /import '\.\/ui\/firstNotes\.css';/);
});
