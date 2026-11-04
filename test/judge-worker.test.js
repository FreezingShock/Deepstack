import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src = f => readFileSync(new URL(`../src/scorer/${f}`, import.meta.url), 'utf8');

test('the judge worker protocol and the model client agree on message types', () => {
  const worker = src('worker.js'), model = src('model.js');
  for (const t of ['load', 'embed']) { assert.match(worker, new RegExp(`m\\.type === '${t}'`)); assert.match(model, new RegExp(`type: '${t}'`)); }
  for (const t of ['progress', 'ready', 'error', 'result', 'fail']) { assert.match(worker, new RegExp(`type: '${t}'`)); assert.match(model, new RegExp(`'${t}'`)); }
});
test('model.js falls back to the main-thread engine when the worker fails', () => {
  const model = src('model.js');
  assert.match(model, /viaWorker\(\)/); assert.match(model, /mainThread\(\)/);
  assert.match(model, /judge=main/); // test hook used by scripts/judge-bench.mjs
});
test('the worker and the fallback share one engine (so scores cannot differ)', () => {
  assert.match(src('worker.js'), /from '\.\/engine\.js'/);
  assert.match(src('model.js'), /import\('\.\/engine\.js'\)/);
});
test('vite builds the worker as an ES module (the transformers.js import is code-split)', () => {
  assert.match(readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8'), /format:\s*'es'/);
});
