// Guard: a @keyframes name declared twice is a silent override. The later declaration wins for every
// element that uses the name, so the earlier one is dead code that looks alive (the page-flip keyframes
// were copied into home.css and pageFlip.css). Each name must be declared exactly once in src/.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'src');
function cssFiles(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return cssFiles(p);
    return f.endsWith('.css') ? [p] : [];
  });
}

test('every @keyframes name is declared once across src/', () => {
  const where = new Map();
  for (const file of cssFiles(ROOT)) {
    const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of src.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)) {
      const name = m[1];
      if (!where.has(name)) where.set(name, []);
      where.get(name).push(relative(ROOT, file));
    }
  }
  const dups = [...where].filter(([, files]) => files.length > 1).map(([n, files]) => `${n}: ${files.join(', ')}`);
  assert.deepEqual(dups, [], 'duplicate @keyframes (the later copy silently wins):\n' + dups.join('\n'));
});
