// Guard: under reduced motion (html.rm) no rule may give elements a short transition-duration. A 0.01 ms transition
// on every property (the default property is "all") animates zoom too, so a page fitter that sets zoom and reads the
// layout straight after gets the old size back: the Daily book then hid its calendar page under reduced motion.
// Use transition:none for the rm rules instead, which holds a change at once and never animates it.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');
function files(dir, ext) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p, ext);
    return p.endsWith(ext) ? [p] : [];
  });
}

test('reduced-motion rules that reach every element hold transitions at none, not a 0.01ms duration', () => {
  const bad = [];
  for (const f of [...files(SRC, '.css')]) {
    const css = readFileSync(f, 'utf8');
    // a rule whose selector is html.rm or :where(html.rm) followed by any descendant/universal selector
    const re = /((?:html\.rm|:where\(html\.rm\))[^{}]*\*[^{}]*)\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(css))) if (/transition-duration\s*:\s*\.01ms/.test(m[2])) bad.push(`${relative(SRC, f)}: ${m[1].trim()}`);
  }
  assert.deepEqual(bad, [], 'use transition:none!important for reduced-motion rules that reach every element');
});

test('the global reduced-motion rule in topbar.css holds every transition', () => {
  const css = readFileSync(join(SRC, 'ui', 'topbar.css'), 'utf8');
  assert.match(css, /html\.rm \*,html\.rm \*::before,html\.rm \*::after\{[^}]*transition:none!important/);
});
