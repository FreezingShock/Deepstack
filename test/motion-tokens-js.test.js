// Guard: JS motion uses the shared table in ui/motion.js, not typed-in curves. A raw cubic-bezier in a feature
// module is a second motion language that the CSS tokens and the reduced-motion switch never see.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');
function js(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return js(p);
    return p.endsWith('.js') ? [p] : [];
  });
}

test('no feature module types a raw cubic-bezier; only the motion table defines curves', () => {
  const bad = js(SRC)
    .filter(f => !f.endsWith(join('ui', 'motion.js')))
    .filter(f => /cubic-bezier\(/.test(readFileSync(f, 'utf8')))
    .map(f => relative(SRC, f));
  assert.deepEqual(bad, [], 'use EASE.<role> from ui/motion.js');
});

test('plaque morph and the book flip read their durations from the table', () => {
  assert.match(readFileSync(join(SRC, 'ui', 'plaqueMorph.js'), 'utf8'), /DUR\.smooth/);
  assert.match(readFileSync(join(SRC, 'ui', 'home.js'), 'utf8'), /FLIP_MS=DUR\.page/);
});
