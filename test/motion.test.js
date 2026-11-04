import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {DUR, EASE, dur, ease, cssVars, RM_MS, TRAVEL_MIN_MS, TRAVEL_MAX_MS} from '../src/ui/motion.js';

const css = fs.readFileSync(new URL('../src/ui/motion.css', import.meta.url), 'utf8');

test('motion.css declares exactly the tokens of motion.js', () => {
  const root = css.match(/:root\{([^}]*)\}/)[1];
  const decl = Object.fromEntries([...root.matchAll(/(--[\w-]+):([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  assert.deepEqual(decl, cssVars());
});

test('non-glide durations never exceed 1.2 s; glides stay 1.2-2.5 s', () => {
  for (const [k, ms] of Object.entries(DUR)) assert.ok(ms > 0 && ms <= 1200, k);
  assert.equal(TRAVEL_MIN_MS, 1200);
  assert.equal(TRAVEL_MAX_MS, 2500);
});

test('durations ascend by role', () => {
  const v = Object.values(DUR);
  assert.deepEqual(v, [...v].sort((a, b) => a - b));
});

test('reduced motion collapses durations in one place', () => {
  assert.equal(dur('page', true), RM_MS);
  assert.equal(dur('page', false), DUR.page);
  assert.match(css, /data-motion="reduce"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.throws(() => dur('nope'));
  assert.throws(() => ease('nope'));
  assert.equal(ease('settle'), EASE.settle);
});

test('no raw easings or non-ambient durations remain in UI css', () => {
  const walk = d => fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const bad = [];
  for (const f of walk('src').filter(f => f.endsWith('.css') && !f.endsWith('motion.css') && !f.includes('theme/'))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:^|[;{\s])(transition|animation)\s*:\s*([^;}]*)/g)) {
      const v = m[2];
      if (/infinite|!important/.test(v)) continue;
      if (/\bcubic-bezier\(|\bease(-in|-out|-in-out)?\b/.test(v)) bad.push(`${f}: ${m[1]}:${v}`);
    }
  }
  assert.deepEqual(bad, []);
});
