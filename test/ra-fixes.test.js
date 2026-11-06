import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pickHatch, FIT_STEPS, HATCH_MIN, HATCH_MAX} from '../src/ui/railFit.js';
import {cabinetHTML} from '../src/ui/cabinet.js';
import {roomLeaves} from '../src/ui/roomLedger.js';
import {ROOMS, HALL} from '../src/core/rooms.js';

test('RA2: the hatch keeps to the free span and never reaches the buttons', () => {
  const p = pickHatch(136, 231, 375);                 // wordmark ends at 136, buttons start at 231
  assert.ok(p && p.hw >= HATCH_MIN);
  assert.ok(p.x - (p.hw + 16) / 2 >= 136 && p.x + (p.hw + 16) / 2 <= 231, 'the whole cue box sits inside the gap');
  assert.equal(pickHatch(100, 900, 1000).x, 500, 'with room to spare it stays centred');
  assert.equal(pickHatch(100, 900, 1000).hw, HATCH_MAX);
  assert.equal(pickHatch(136, 170, 375), null, 'a 34px gap is too small: something has to give');
  assert.deepEqual(FIT_STEPS[0], [], 'nothing is hidden when it fits');
  assert.ok(FIT_STEPS[FIT_STEPS.length - 1].includes('fit-nokeys') && !FIT_STEPS.flat().includes('fit-nosound'), 'Mute is never what gives');
});

test('RA7: the Today card names the room and carries its colour', () => {
  const room = {name: 'The Chronicle', short: 'Chronicle', rgb: [235, 60, 60]};
  const h = cabinetHTML({steps: [], today: {no: 4, kind: 'daily', tag: '', streak: 0, played: false, room}});
  const slot = h.match(/<div class="cc-slot" id="cc-today"[^>]*>/)[0];
  assert.match(slot, /--rc:235,60,60/);
  const card = h.slice(h.indexOf('id="cc-today"'), h.indexOf('id="cc-today"') + 6000);
  assert.match(card, /<span class="cc-no">Chronicle<\/span>/);
  assert.match(card, /cb-room[^>]*><i[^>]*><\/i>The Chronicle</);
  const other = h.replace(card, '');
  assert.match(other, /<span class="cc-no">No\. 1 of 7<\/span>/, 'other cards keep their numbers');
});

test('RA5: every Room Ledger row shows met progress, with a swatch fill to match', () => {
  const S = {shelf: [{w: 'a'}, {w: 'b'}, {w: 'c', skipped: true}], sets: {got: {}}};
  const met = id => (id === 'history' ? '47 of 118 met' : '');
  const {leaves} = roomLeaves(S, {met});
  const toc = leaves[0];
  assert.match(toc, /<b>2 words met<\/b>/, 'the Reading Room counts distinct shelf words');
  assert.match(toc, /data-room="history"[^>]*>.*?--f:0\.398.*?<b>47 of 118 met<\/b>/);
  const rows = toc.match(/<li [^>]*data-room="[^"]+"/g);
  assert.equal(rows.length, ROOMS.length);
  assert.ok(!/<b>every word<\/b>/.test(toc));
  // a room whose list has not loaded yet falls back to the sets tally, never to nothing
  assert.match(toc, /data-room="math".*?<b>0\/3 sets<\/b>/);
  assert.equal(HALL, 'hall');
});

test('RA8/RA10: Today card carries the met line; ledger rows carry a sets ring', () => {
  const room = {name: 'The Chronicle', short: 'Chronicle', rgb: [235, 60, 60], met: '5 of 156 met'};
  assert.match(cabinetHTML({steps: [], today: {no: 4, kind: 'daily', tag: '', streak: 0, played: false, room}}), /<p class="cb-met">5 of 156 met<\/p>/);
  const toc = roomLeaves({shelf: [], sets: {got: {}}}, {met: () => ''}).leaves[0];
  assert.match(toc, /data-room="math"[^>]*title="[^"]*0 of 3 sets complete"/);
  assert.match(toc, /class="rl-dot nosets"/);
});
