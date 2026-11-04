import test from 'node:test';
import assert from 'node:assert/strict';
import {nookMetrics, alcoveRects, alcovePath, paintAroundAlcoves} from '../src/ui/alcoveArt.js';
import {ledgeLayout} from '../src/ui/ledge.js';

const dims = b => ({w: 24 + (b.w || '').length * 1.5, h: 70 + ((b.w || '').length % 5) * 12});
// seven answered books and one skipped slot, one of them a 14-letter word
const BOOKS = ['obfuscate', 'ephemeral', 'sesquipedalian', 'x', 'nadir', 'lacuna', 'ineffable'].map((w, i) => i === 3 ? {w, skipped: true} : {w, tier: i % 7, score: 50});

test('phones reserve a strip and the books never stand taller than it', () => {
  const m = nookMetrics(375);
  assert.ok(m.phone && m.reserve > 0 && m.maxBookH > 0 && m.maxBookH < m.reserve);
  const L = ledgeLayout(BOOKS, 375, dims, m.maxBookH);
  for (const it of L.items) if (!it.skipped) assert.ok(dims(BOOKS[it.i]).h * L.s <= m.maxBookH + 1e-6, 'book fits the strip');
});
test('the ledge fits 7 books plus the skipped slot inside the alcove from 320 to 414 px wide', () => {
  for (const w of [320, 360, 375, 414]) {
    const L = ledgeLayout(BOOKS, w - 24, dims, nookMetrics(w).maxBookH);
    assert.equal(L.items.length, 7);
    const first = L.items[0], last = L.items[L.items.length - 1];
    assert.ok(first.dx >= 0 && last.dx + last.w <= w - 24, `fits at ${w}`);
    for (let i = 1; i < L.items.length; i++) assert.ok(L.items[i].dx >= L.items[i - 1].dx + L.items[i - 1].w, 'no overlap');
  }
});
test('on wide screens the books gather right of the hint and skip buttons', () => {
  const m = nookMetrics(1280); assert.ok(!m.phone && m.reserve === 0);
  for (const w of [640, 760]) { const L = ledgeLayout(BOOKS, w, dims, 0); assert.ok(L.items.at(-1).dx + L.items.at(-1).w <= w); }
  const L = ledgeLayout(BOOKS, 760, dims, 0);
  assert.ok(L.items[0].dx >= 760 / 2 + 5, 'clear of the centred answer controls at 760');
});
test('floor effects are clipped around every visible alcove', () => {
  const box = {x: 260, w: 760, t: 80, h: 400}, H = 800, RH = 146, BM = 14;
  const rects = alcoveRects([5, 6, 900], box, RH, H, BM, 5 * RH - 100);
  assert.ok(rects.length >= 1 && rects.length <= 2, 'off-screen alcoves are left out');
  const calls = [];
  const ctx = new Proxy({}, {get: (_, k) => (...a) => { calls.push([k, ...a]); }});
  let ran = 0;
  paintAroundAlcoves(ctx, 1280, H, rects, () => { ran++; });
  assert.equal(ran, 1);
  assert.ok(calls.some(c => c[0] === 'clip' && c[1] === 'evenodd'), 'even-odd clip excludes the alcove shapes');
  assert.ok(calls.findIndex(c => c[0] === 'save') < calls.findIndex(c => c[0] === 'clip') && calls.at(-1)[0] === 'restore');
  const none = []; paintAroundAlcoves(new Proxy({}, {get: (_, k) => (...a) => none.push(k)}), 1280, H, [], () => none.push('fn'));
  assert.deepEqual(none, ['fn'], 'no alcove, no clip');
});
test('alcovePath covers the alcove rectangle', () => {
  const calls = []; alcovePath(new Proxy({}, {get: (_, k) => (...a) => calls.push([k, ...a])}), [{x: 10, y: 20, w: 100, h: 200, r: 30}]);
  assert.ok(calls.some(c => c[0] === 'moveTo' && c[1] === 10 && c[2] === 220));
  assert.ok(calls.some(c => c[0] === 'lineTo' && c[1] === 110 && c[2] === 220));
});
