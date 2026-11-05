import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE } from '../src/theme/colors.js';

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [16, 8, 0].map((s) => ((n >> s) & 255) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Fine print on dark surfaces: [label, text, background] (worst-case end of any gradient).
const PAIRS = [
  ['rail locked floor name', PALETTE.fineLocked, PALETTE.oak13],
  ['rail locked floor range', PALETTE.fineLockedDim, PALETTE.oak13],
  ['rail floor range (reached)', PALETTE.parchmentF3e3bd, PALETTE.bronze35],
  ['key hints / mute on sheet', PALETTE.brass70, PALETTE.oak0b0907],
];

for (const [name, fg, bg] of PAIRS) {
  test(`fine print contrast: ${name}`, () => {
    assert.ok(fg && bg, 'tokens exist');
    assert.ok(ratio(fg, bg) >= 4.5, `${name} ${ratio(fg, bg).toFixed(2)}:1`);
  });
}
