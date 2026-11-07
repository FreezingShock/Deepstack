// Guard: the reduced-motion decision has ONE source. settings.js (motionNow) sets html.rm, and every reduced
// rule in CSS keys off that class. Before this, ~60 CSS blocks used a bare @media (prefers-reduced-motion) that
// ignored the in-game Motion setting, so "Full" could not turn them back on and "Calm" did not switch them off.
// A new bare OS query or a data-motion selector fails here, so the setting can't be bypassed again.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {refreshMotion} from '../src/ui/settings.js';

const SRC = join(import.meta.dirname, '..', 'src');
function files(dir, ext) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p, ext);
    return p.endsWith(ext) ? [p] : [];
  });
}
const rel = p => relative(SRC, p);

test('no CSS file reads the OS reduced-motion query directly', () => {
  const bad = files(SRC, '.css').filter(f => /prefers-reduced-motion/.test(readFileSync(f, 'utf8'))).map(rel);
  assert.deepEqual(bad, [], 'use html.rm (set by motionNow) instead of @media (prefers-reduced-motion)');
});

test('no CSS selector keys off data-motion; html.rm is the only switch', () => {
  const bad = files(SRC, '.css').filter(f => /data-motion/.test(readFileSync(f, 'utf8'))).map(rel);
  assert.deepEqual(bad, [], 'replace html[data-motion=...] with html.rm');
});

test('no JS module reads the OS query outside settings.js', () => {
  const bad = files(SRC, '.js').filter(f => !f.endsWith(join('ui', 'settings.js')))
    .filter(f => /matchMedia\([^)]*prefers-reduced-motion/.test(readFileSync(f, 'utf8'))).map(rel);
  assert.deepEqual(bad, [], 'use motionNow() from ui/settings.js');
});

test('refreshMotion sets html.rm to the resolved flag: Full wins over the OS, Calm reduces without it', () => {
  const classes = new Set();
  globalThis.document = {documentElement: {classList: {toggle: (c, on) => on ? classes.add(c) : classes.delete(c)}}};
  try {
    refreshMotion({motion: 'full'}, () => true);
    assert.equal(classes.has('rm'), false, 'Full keeps motion even when the OS asks for less');
    refreshMotion({motion: 'reduce'}, () => false);
    assert.equal(classes.has('rm'), true, 'Calm reduces even when the OS does not');
    refreshMotion({motion: 'system'}, () => true);
    assert.equal(classes.has('rm'), true, 'System follows the OS');
    refreshMotion({motion: 'system'}, () => false);
    assert.equal(classes.has('rm'), false);
  } finally {
    delete globalThis.document;
    refreshMotion({motion: 'system'}, () => false);
  }
});
