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

import {setRoomLists, setRoomEntries, setRoomExtras} from '../src/core/roomPool.js';
import {unmetWords, recordMastery} from '../src/core/roomDepth.js';
import {masteredLine} from '../src/ui/roomStats.js';
import {UNMET_SHOW} from '../src/ui/roomLedger.js';

test('unmetWords lists what is left, and recordMastery stamps a room once, the day it was completed', () => {
  setRoomEntries(null); setRoomExtras({});
  setRoomLists({math: ['ratio', 'prime', 'sum'], history: Array.from({length: 200}, (_, i) => 'h' + i)});
  const S = {shelf: [], met: {ratio: 1, prime: 1}};
  assert.deepEqual(unmetWords(S, 'math'), ['sum']);
  assert.deepEqual(unmetWords(S, 'art'), [], 'a room without a list has nothing to show');
  assert.deepEqual(recordMastery(S, '2026-11-06'), []);
  assert.equal(S.metAt.math, undefined);
  S.met.sum = 1;
  assert.deepEqual(recordMastery(S, '2026-11-07'), ['math']);
  assert.deepEqual(recordMastery(S, '2026-11-09'), []);
  assert.equal(S.metAt.math, '2026-11-07', 'the first day stays');
  assert.deepEqual(unmetWords(S, 'math'), []);
});

test('the Rooms Almanac names mastered rooms and survives damaged data', () => {
  assert.match(masteredLine({}), /No room mastered yet/);
  assert.match(masteredLine({metAt: []}), /No room mastered yet/);
  assert.match(masteredLine({metAt: {history: 'garbage'}}), /No room mastered yet/);
  assert.match(masteredLine({metAt: {math: '2026-11-07'}}), /Mastered: .*\(Nov 7\)/);
});

test('the Room ledger lists the words still to meet only when a room is nearly done', () => {
  const left = n => Array.from({length: n}, (_, i) => 'w' + i);
  const html = n => roomLeaves({shelf: []}, {unmet: id => (id === 'history' ? left(n) : [])}).leaves.join('');
  assert.match(html(7), /rl-unmet/); assert.match(html(7), /7 to go/); assert.match(html(7), /<span>w0<\/span> <span>w1<\/span>/);
  assert.match(html(UNMET_SHOW), /rl-unmet/);
  assert.doesNotMatch(html(UNMET_SHOW + 1), /rl-unmet/);
  assert.doesNotMatch(html(0), /rl-unmet/);
});
