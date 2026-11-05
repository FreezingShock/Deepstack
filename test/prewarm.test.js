import test from 'node:test';
import assert from 'node:assert/strict';
import {glowJobs, FONT_SPECS} from '../src/ui/prewarm.js';
import {lampGlow, flameGlow, tierGlow, litGlow, eyeGlow, LIT_COLS, EYE_COLS} from '../src/ui/glowDefs.js';
import {FLOORS} from '../src/core/floors.js';
import {TIERS} from '../src/core/tiers.js';

test('prewarm covers every fixed-key glow the frame loop uses', () => {
  const keys = glowJobs().map(j => j[0]);
  for (const k of ['candle-light', 'lift-lantern', lampGlow(0)[0]]) assert.ok(keys.includes(k), k);
  for (const c of LIT_COLS) assert.ok(keys.includes(litGlow(c)[0]));
  for (const c of EYE_COLS) assert.ok(keys.includes(eyeGlow(c)[0]));
  for (const t of TIERS) assert.ok(keys.includes(tierGlow(t.spine)[0]));
  for (const f of FLOORS) { const l = f.lamp.map(v => v | 0); assert.ok(keys.includes(flameGlow(`${l[0]},${l[1] + 6},${l[2] + 10}`)[0])); }
  assert.equal(new Set(keys).size, keys.length, 'no duplicate jobs');
});

test('glow defs keep the original gradients', () => {
  assert.deepEqual(lampGlow(0.5)[1][1], [.3, 'rgba(6,4,2,0.325)']);
  assert.equal(tierGlow('#abcdef')[1][0][1], '#abcdef26');
});

test('alcove serif weights are listed for fonts.load', () => {
  assert.ok(FONT_SPECS.some(f => f.includes('Anthropic Serif Display')) && FONT_SPECS.length >= 6);
});
