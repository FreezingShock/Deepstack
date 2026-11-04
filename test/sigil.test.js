import test from 'node:test';
import assert from 'node:assert/strict';
import {sigilSpec, sigilBitmap, drawSigil, sigilColor, sigilCacheSize} from '../src/ui/sigil.js';
import {bookArt} from '../src/ui/bookArt.js';
import {Quality} from '../src/ui/quality.js';

const WORDS = Array.from({length: 600}, (_, i) => 'word' + i.toString(36) + 'x'.repeat(i % 5));

test('same word, same sigil; case and spacing do not matter', () => {
  assert.deepEqual(sigilSpec('lantern'), sigilSpec('Lantern '));
  assert.notDeepEqual(sigilSpec('lantern'), sigilSpec('lanterns'));
});

test('600 words give 600 distinct sigils', () => {
  assert.equal(new Set(WORDS.map(w => JSON.stringify(sigilSpec(w)))).size, WORDS.length);
});

test('every tier has a sigil ink', () => { for (let t = 0; t < 7; t++) assert.equal(sigilColor(t).length, 3); });

function fakeDoc() {
  const calls = [];
  globalThis.document = {createElement: () => ({width: 0, height: 0, getContext: () => new Proxy({}, {get: (t, k) => (...a) => { calls.push(k); }, set: () => true})})};
  return calls;
}
test('bitmaps are cached per word and tier and capped', () => {
  const calls = fakeDoc();
  try {
    const a = sigilBitmap('cache-me', 3), n = calls.length;
    assert.ok(a);
    assert.equal(sigilBitmap('cache-me', 3), a);
    assert.equal(calls.length, n, 'second call draws nothing');
    assert.notEqual(sigilBitmap('cache-me', 4), a);
    for (let i = 0; i < 700; i++) sigilBitmap('w' + i, 1);
    assert.ok(sigilCacheSize() <= 600);
  } finally { delete globalThis.document; }
});

test('bookArt stamps the sigil on spines, skips it in low mode, and keeps it on the held book', () => {
  fakeDoc();
  const c = () => { const log = []; return new Proxy({log}, {get(t, k) { if (k in t) return t[k]; if (k === 'measureText') return s => ({width: s.length * 4}); if (k.startsWith('create')) return () => ({addColorStop() {}}); return (...a) => { log.push(k); }; }, set: () => true}); };
  const run = o => { const x = c(); bookArt(x, {w: 30, h: 100, tier: 4, seed: 3, word: 'lantern', ...o}, 0); return x.log.filter(k => k === 'drawImage').length; };
  try {
    assert.equal(run({}), 1);
    Quality.setPref('low');
    assert.equal(run({}), 0, 'off on spines in low mode');
    assert.equal(run({held: true}), 1, 'held book keeps it');
    assert.equal(run({word: undefined}), 0, 'no word, no sigil');
  } finally { Quality.setPref('auto'); delete globalThis.document; }
});

test('drawSigil without a canvas environment is a quiet no-op', () => {
  assert.equal(drawSigil({}, 'lantern', 2, 0, 0, 8), false);
});
