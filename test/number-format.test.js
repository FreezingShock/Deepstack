// Depths and counts on screen take a thousands comma (1,008 ft). The helper is pure; the source guard stops a
// new screen from writing a raw depth next to " ft" again (text-fit checks the rendered copy too).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {fmtNum, fmtFt} from '../src/core/numFmt.js';

test('fmtNum adds a thousands comma and rounds', () => {
  assert.equal(fmtNum(0), '0');
  assert.equal(fmtNum(101), '101');
  assert.equal(fmtNum(1008), '1,008');
  assert.equal(fmtNum(12345.4), '12,345');
  assert.equal(fmtNum(undefined), '0');
});

test('fmtFt keeps the unit after the number', () => {
  assert.equal(fmtFt(454), '454 ft');
  assert.equal(fmtFt(1008), '1,008 ft');
});

const files = d => readdirSync(d).flatMap(f => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? files(p) : p.endsWith('.js') ? [p] : [];
});

test('no screen writes a raw depth next to " ft" (use fmtNum)', () => {
  // ${x} ft where x is a depth or floor start, unless it is already wrapped in fmtNum(...)
  const raw = /\$\{(?!fmt)[^{}]*(?:floorStartFt|deepest|depth)[^{}]*\}\s*ft\b/;
  // deepest + ' ft' or floorStartFt(f) + ' ft' concatenation
  const concat = /\b(?:deepest|depth|floorStartFt\(\w+\))\s*\+\s*'\s*ft'/;
  const bad = [];
  for (const f of files('src')) {
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments are not copy
      if (raw.test(line) || concat.test(line)) bad.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(bad, []);
});
