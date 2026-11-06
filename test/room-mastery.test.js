import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allMet, metWords, recordMet, metLabel} from '../src/core/roomDepth.js';
import {doorHTML} from '../src/ui/roomHome.js';
import {roomLeaves} from '../src/ui/roomLedger.js';
import {roomById} from '../src/core/rooms.js';

test('allMet is true only when every word is met', () => {
  assert.equal(allMet('118 of 118 met'), true);
  assert.equal(allMet('117 of 118 met'), false);
  assert.equal(allMet(''), false);
  assert.equal(allMet('0 of 0 met'), false);
});

test('S.met outlives the 300-book shelf, so a big room can reach 100%', () => {
  const list = Array.from({length: 400}, (_, i) => 'w' + i), S = {shelf: []};
  for (const w of list) recordMet(S, {w});
  recordMet(S, {w: 'skipped', skipped: true}); recordMet(S, null);
  assert.equal(metWords(S, list), 400);
  assert.equal(S.met.skipped, undefined);
  assert.equal(metWords({met: [1, 2]}, list), 0, 'a damaged field is ignored');
  assert.ok(allMet(metLabel(metWords(S, list), list.length)));
});

test('the door plate, ledger row and room page mark a fully met room, and only that room', () => {
  const r = roomById('history');
  assert.match(doorHTML(r, 'next', '413 of 413 met'), /rm-sw all/);
  assert.match(doorHTML(r, 'next', '413 of 413 met'), /rm-met all/);
  assert.doesNotMatch(doorHTML(r, 'next', '412 of 413 met'), / all/);
  const met = id => (id === 'history' ? '413 of 413 met' : id === 'math' ? '3 of 302 met' : '');
  const {leaves} = roomLeaves({shelf: []}, {met});
  const html = leaves.join('');
  assert.equal((html.match(/rl-dot[^"]* all/g) || []).length, 1);
  assert.equal((html.match(/class="rl-all"/g) || []).length, 1);
});

test('the glint is opacity and transform only and is off under reduced motion', () => {
  const css = readFileSync(new URL('../src/ui/roomMastery.css', import.meta.url), 'utf8');
  const frames = css.match(/@keyframes rmGlint\{.*?\}\}/s)[0];
  assert.doesNotMatch(frames.replace(/opacity:[\d.]+|transform:[^;}]+/g, ''), /[a-z-]+:[^;}]+/);
  assert.match(css, /prefers-reduced-motion:reduce\)\{[^}]*animation:none/);
});
