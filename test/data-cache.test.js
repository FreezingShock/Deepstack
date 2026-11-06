import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {dataUrl} from '../src/core/dataUrl.js';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('dataUrl is the plain path without a build, and carries the content hash with one', () => {
  assert.equal(dataUrl('words.json'), '/data/words.json');
  globalThis.__DATA_V__ = {'words.json': 'abc1234567'};
  try {
    assert.equal(dataUrl('words.json'), '/data/words.json?v=abc1234567');
    assert.equal(dataUrl('unknown.json'), '/data/unknown.json');
  } finally { delete globalThis.__DATA_V__; }
});

test('every data file the app loads goes through dataUrl, so the service worker can cache it by hash', () => {
  const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
  for (const f of walk('src')) {
    if (f.endsWith('dataUrl.js')) continue;
    const bad = read(f).split('\n').filter(l => /fetch\(|url\s*=/.test(l) && /['"`]data\/[a-z-]+\.json/.test(l));
    assert.deepEqual(bad, [], `${f} builds a data URL by hand; use dataUrl()`);
  }
});

test('vite defines the hashes and the worker answers hashed data from its cache without waiting on the network', () => {
  assert.match(read('vite.config.js'), /__DATA_V__/);
  const sw = read('src/sw/sw.js');
  assert.match(sw, /searchParams\.has\('v'\) \? hashedData/);
  assert.match(sw, /__DATA_PRECACHE__/);
  for (const f of ['words.json', 'rooms.json', 'room-words.json']) assert.ok(read('vite.config.js').includes(`'${f}'`), `${f} not precached`);
});

test('room lists and room entries download side by side', () => {
  const src = read('src/core/roomPool.js');
  const body = src.slice(src.indexOf('export function loadRoomLists'));
  assert.ok(body.indexOf('fetch(entriesUrl)') < body.indexOf('await fetch(url)'), 'room-words.json must start before rooms.json is awaited');
});

test('judge data (relations, senses) starts downloading with the model, not after it', () => {
  const main = read('src/main.js');
  const i = main.indexOf('startModelLoad();');
  assert.ok(i > 0 && /lexReady\(\)/.test(main.slice(i, i + 200)), 'the lexicon worker (relations + senses) must start beside the model');
  const lex = read('src/scorer/lexicon.js');
  assert.ok(/dataUrl\('relations\.json'\)/.test(lex) && /dataUrl\('senses\.json'\)/.test(lex), 'the worker loads the hashed data URLs');
});
