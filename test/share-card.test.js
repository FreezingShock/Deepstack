import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shareCardOps, drawShareOps, LOOKS, CARD_W, CARD_H} from '../src/ui/dailyShareImage.js';
import {shareDaily} from '../src/ui/dailyShare.js';
import {ROOMS} from '../src/core/rooms.js';

// shareDaily reads navigator; stub it per test and restore afterwards (as test/daily-share.test.js does).
const realNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
function setNav(v) { Object.defineProperty(globalThis, 'navigator', {value: v, configurable: true, writable: true}); }
test.after(() => { if (realNav) Object.defineProperty(globalThis, 'navigator', realNav); });

const TIER_NAMES = ['Pamphlet', 'Paperback', 'Hardbound', 'Folio', 'Codex', 'Grimoire', 'Apocrypha'];
const WORDS = ['zebrafinch', 'quorumlike', 'mizzenmast'];
const ANSWERS = ['a secret answer here', 'another private reply'];
const run = {
  books: [
    {w: WORDS[0], tier: 6, score: 91, answer: ANSWERS[0], ft: 150},
    {w: WORDS[1], tier: 3, score: 60, answer: ANSWERS[1], ft: 80},
    {w: WORDS[2], tier: 0, score: 0, answer: '', ft: 12},
    {w: 'filler', tier: 2, score: 40, answer: 'x', ft: 40},
    {w: 'filler2', tier: 1, score: 25, answer: 'y', ft: 30},
    {w: 'filler3', tier: 4, score: 70, answer: 'z', ft: 60},
    {w: 'filler4', tier: 5, score: 75, answer: 'q', ft: 50}
  ],
  avg: 52, depth: 1234, floor: 2, mode: 'daily', day: '2026-11-06'
};
const opts = (room, keys = ['2026-11-06'], extra = {}) => ({room: room.name, no: 123, floorName: 'The Catacombs', tierNames: TIER_NAMES, keys, today: '2026-11-06', rgb: room.rgb, ...extra});
// Every text op, including the ones inside the rotated stamp group.
const allTexts = card => {
  const out = [];
  const walk = list => list.forEach(o => { if (o.k === 'text') out.push(o.t); if (o.k === 'group') walk(o.ops); });
  walk(card.ops);
  return out;
};

test('the card is a fixed 1080 square for every topic room and look', () => {
  for (const room of ROOMS) for (const look of LOOKS) {
    const c = shareCardOps(run, opts(room), look);
    assert.equal(c.w, CARD_W); assert.equal(c.h, CARD_H);
    assert.equal(c.look, look);
  }
});

test('the picture names the room, the Daily number, depth, floor and every tier', () => {
  const t = allTexts(shareCardOps(run, opts(ROOMS[1]), 'stamp'));
  assert.ok(t.includes(ROOMS[1].name), 'room name');
  assert.ok(t.includes('Daily No. 123'));
  assert.ok(t.includes('123'), 'stamp number');
  assert.ok(t.includes('1,234'), 'depth with its comma');
  assert.ok(t.includes('The Catacombs'));
  for (const name of TIER_NAMES) assert.ok(t.includes(name), name);
});

test('the picture is spoiler-free: no word and no answer is drawn', () => {
  for (const room of ROOMS) for (const look of LOOKS) {
    const t = allTexts(shareCardOps(run, opts(room), look)).join('\n');
    for (const w of [...WORDS, 'filler', 'filler2']) assert.ok(!t.includes(w), `word ${w} leaked on ${look}`);
    for (const a of ANSWERS) assert.ok(!t.includes(a), 'answer leaked');
  }
});

test('streak line appears only with a streak', () => {
  assert.ok(!allTexts(shareCardOps(run, opts(ROOMS[0], []), 'stamp')).some(t => t.startsWith('Streak')));
  assert.ok(allTexts(shareCardOps(run, opts(ROOMS[0], ['2026-11-06']), 'stamp')).includes('Streak 1 day in a row'));
});

test('one spine per book in the stamp and plain looks, one dot per book in the dots look', () => {
  const spines = c => c.ops.filter(o => o.spine).length;
  const dots = c => c.ops.filter(o => o.k === 'circle' && o.fill).length;
  assert.equal(spines(shareCardOps(run, opts(ROOMS[0]), 'stamp')), 7);
  assert.equal(spines(shareCardOps(run, opts(ROOMS[0]), 'plain')), 7);
  assert.equal(dots(shareCardOps(run, opts(ROOMS[0]), 'dots')), 7);
  assert.equal(dots(shareCardOps(run, opts(ROOMS[0]), 'stamp')), 0);
});

test('the stamp is drawn only in the stamp look, and the plain look keeps full-width header lines', () => {
  const hasStamp = c => c.ops.some(o => o.k === 'group');
  assert.ok(hasStamp(shareCardOps(run, opts(ROOMS[0]), 'stamp')));
  assert.ok(!hasStamp(shareCardOps(run, opts(ROOMS[0]), 'plain')));
  assert.ok(!hasStamp(shareCardOps(run, opts(ROOMS[0]), 'dots')));
});

test('drawShareOps runs on a fake context and reports text that cannot fit', () => {
  const calls = [];
  const ctx = {
    save() {}, restore() {}, translate() {}, rotate() {}, clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
    fillText(t) { calls.push(t); }, createRadialGradient() { return {addColorStop() {}}; },
    measureText(t) { return {width: t.length * parseFloat(this.font.split(' ').find(p => p.endsWith('px'))) * .5}; }, font: '', letterSpacing: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: '', textBaseline: '', globalAlpha: 1
  };
  const card = shareCardOps(run, opts(ROOMS[0]), 'stamp');
  const report = drawShareOps(ctx, card);
  assert.ok(calls.includes('DEEPSTACK'));
  assert.equal(report.over.length, 0, JSON.stringify(report.over));
  // a fake width of half the font size per character: the depth numeral is too wide for its slot, so it shrinks and is reported
  assert.ok(report.shrunk.some(x => x.t === '1,234'), JSON.stringify(report.shrunk));
  assert.equal(calls.length, allTexts(card).length);
});

test('shareDaily sends the picture with the text when the browser can share files', async () => {
  let got = null;
  const file = {name: 'deepstack-daily-1.png', type: 'image/png'};
  setNav({share: async o => { got = o; }, canShare: o => o.files && o.files.length === 1});
  assert.equal(await shareDaily('hello', 'Deepstack', file), 'shared');
  assert.deepEqual(got, {title: 'Deepstack', text: 'hello', files: [file]});
});

test('shareDaily sends text only when files cannot be shared', async () => {
  let got = null;
  setNav({share: async o => { got = o; }, canShare: () => false});
  assert.equal(await shareDaily('hello', 'Deepstack', {name: 'x.png'}), 'shared');
  assert.deepEqual(got, {title: 'Deepstack', text: 'hello'});
});

test('the tallest spine stays clear of the depth block (its label ends near y 580)', () => {
  const tops = shareCardOps(run, opts(ROOMS[0]), 'plain').ops.filter(o => o.spine).map(o => o.y);
  assert.ok(Math.min(...tops) > 600, `top spine at ${Math.min(...tops)}`);
});
