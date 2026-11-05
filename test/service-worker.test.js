import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src = readFileSync(new URL('../src/sw/sw.js', import.meta.url), 'utf8');

test('service worker source parses and keeps the build placeholder the vite plugin fills in', () => {
  assert.doesNotThrow(() => new Function(src));
  assert.match(src, /__ORT_VERSION__/);
});

test('service worker never touches the model (transformers.js caches it) or non-GET/range requests', () => {
  assert.doesNotMatch(src, /\/models\//);
  assert.match(src, /req\.method !== 'GET'/);
  assert.match(src, /headers\.has\('range'\)/);
});

test('every cache the worker opens is in its keep list, so activate never deletes a live cache', () => {
  const names = [...src.matchAll(/respondWith\((?:cacheFirst|networkFirst)\((\w+),/g)].map(m => m[1]);
  const keep = /const KEEP = \[([^\]]+)\]/.exec(src)[1].split(',').map(s => s.trim());
  for (const n of names) assert.ok(keep.includes(n), `${n} missing from KEEP`);
});
