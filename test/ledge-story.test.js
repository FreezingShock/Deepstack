import test from 'node:test';
import assert from 'node:assert/strict';
import {runStory, storyNote, closeGap, drawStory, resetStoryTrack, STORY_PAD, CLOSE_GAP} from '../src/ui/chain.js';
import {ledgeLayout, ledgeLabel, ledgeTip, drawLedge} from '../src/ui/ledge.js';
import {applyCombo, COMBO_MAX} from '../src/core/combo.js';
import {TIERS, tierOf} from '../src/core/tiers.js';
// the phone strip the nook reserves (src/ui/alcoveArt.js nookMetrics): 64px, books stand 6px up
const nookMetrics = w => ({D: 64, inset: 6, maxBookH: 56});

const bk = (w, score, skipped = false) => ({w, score, tier: skipped ? 0 : tierOf(score), skipped});
const SEQ = [bk('a', 50), bk('b', 70), bk('c', 20), bk('d', 0, true), bk('e', 47), bk('f', 80), bk('g', 95), bk('h', 60), bk('i', 62), bk('j', 10)];

test('link count follows applyCombo exactly, including breaks and the x2 cap', () => {
  let chain = 0;
  const st = runStory(SEQ);
  SEQ.forEach((b, i) => {
    const r = applyCombo(chain, b.tier, 10, !!b.skipped); chain = r.chain;
    assert.equal(st[i].chain, r.chain, `chain at ${b.w}`);
    assert.equal(st[i].broke, r.broke, `break at ${b.w}`);
    assert.equal(st[i].linked, r.chain > 0);
  });
  const five = runStory([bk('a', 50), bk('b', 50), bk('c', 50), bk('d', 50), bk('e', 50), bk('f', 50)]);
  assert.equal(five[3].mult < COMBO_MAX, true);
  assert.equal(five[4].capped && five[5].capped, true);
});
test('a skip or a miss resets the chain; a lone Folio is a link but not a break', () => {
  const st = runStory([bk('a', 50), bk('b', 0, true), bk('c', 50), bk('d', 10)]);
  assert.deepEqual(st.map(s => s.chain), [1, 0, 1, 0]);
  assert.deepEqual(st.map(s => s.broke), [false, false, false, false]);
});
test('close calls: a few points short of the next rarity, never the top tier or a skip', () => {
  assert.equal(closeGap(bk('a', 44)), 2);
  assert.equal(closeGap(bk('a', 46 - CLOSE_GAP - 1)), 0);
  assert.equal(closeGap(bk('a', 46)), 0);
  assert.equal(closeGap(bk('a', 99)), 0);
  assert.equal(closeGap(bk('a', 0, true)), 0);
  assert.equal(runStory([bk('a', 12)])[0].next, TIERS[1].name);
});
test('labels and tooltips carry the story and stay as before without it', () => {
  const st = runStory([bk('a', 50), bk('b', 52), bk('c', 12), bk('d', 0, true)]);
  assert.match(ledgeLabel(SEQ[0], TIERS, st[0]), /starts a chain/);
  assert.match(ledgeTip(SEQ[1], TIERS, st[1]), /chain of 2/);
  assert.match(ledgeLabel(bk('c', 12), TIERS, st[2]), /chain of 2 broken, 2 short of Paperback/);
  assert.equal(ledgeLabel(bk('x', 20), TIERS), 'x, Paperback, 20');
  assert.equal(ledgeLabel({w: 'x', skipped: true}, TIERS), 'x, skipped');
  assert.equal(storyNote(null), '');
});

const dims = b => ({w: 24 + (b.w || '').length * 1.5, h: 70 + ((b.w || '').length % 5) * 12});
function ctxStub() {
  const calls = [];
  return {calls, ...Object.fromEntries(['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke', 'fillRect', 'strokeRect', 'ellipse', 'arc', 'translate', 'scale', 'rotate', 'setLineDash'].map(n => [n, (...a) => calls.push([n, ...a])])), globalAlpha: 1};
}
const seven = ['obfuscate', 'ephemeral', 'sesquipedalian', 'x', 'nadir', 'lacuna', 'ineffable'].map((w, i) => i === 3 ? {w, skipped: true, tier: 0, score: 0} : bk(w, [50, 55, 61, 0, 70, 44, 85][i]));

test('7 books, a skip, links and ribbons all fit inside the alcove and the phone strip from 320 to 414 px', () => {
  for (const w of [320, 360, 375, 414]) {
    const m = nookMetrics(w), ow = w - 24;
    const L = ledgeLayout(seven, ow, dims, m.maxBookH - STORY_PAD);
    // the height cap exists once the reading nook (#112) lands; before that only the width fit applies
    if (ledgeLayout.length >= 4) for (const it of L.items) if (!it.skipped) assert.ok(dims(seven[it.i]).h * L.s <= m.maxBookH - STORY_PAD + 1e-6, `book fits at ${w}`);
    assert.ok(L.items[0].dx >= 0 && L.items.at(-1).dx + L.items.at(-1).w <= ow);
    const c = ctxStub(); resetStoryTrack();
    const hits = drawLedge(c, {books: seven, x: 0, y: 0, w: ow, h: 300, now: 1000, RH: 140, inset: m.inset, maxH: m.maxBookH, dims, bookArt() {}, ribbons: [], hash: () => 1});
    assert.equal(hits.length, 7);
    const topMost = Math.min(...c.calls.filter(k => k[0] === 'lineTo' || k[0] === 'moveTo').map(k => k[2]));
    if (ledgeLayout.length >= 4) assert.ok(300 - m.inset - topMost <= m.D + 0.5, `story art stays inside the ${m.D}px strip at ${w}`);
  }
});
test('fresh link and fall animate once; reduced motion draws the final state at once', () => {
  const books = [bk('a', 50), bk('b', 52)], after = [...books, bk('c', 5)];
  const L = a => ledgeLayout(a, 700, dims, 0);
  const run = (a, now, RM) => { const c = ctxStub(); drawStory(c, {L: L(a), books: a, base: 200, x: 0, dims, now, RM, }); return JSON.stringify(c.calls); };
  resetStoryTrack();
  run(books, 0, false);
  const early = run(after, 1000, false), settled = run(after, 1000 + 5000, false), rm = run(after, 1000, true);
  assert.notEqual(early, settled, 'falling differs from lying');
  resetStoryTrack(); run(books, 0, true);
  assert.equal(run(after, 1000, true), settled, 'reduced motion is static');
  assert.equal(rm, settled);
  resetStoryTrack(); run(after, 0, false);
  assert.equal(run(after, 9000, false), settled, 'a reload (no fresh book) draws the final state');
});
