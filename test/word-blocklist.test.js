import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BANK, WORDS, GHOSTS} from '../src/core/words.js';
import {buildPool, rejectReason} from '../src/core/wordPool.js';
import {isBlocked, isBlockedWord, isBlockedDef, BLOCKED_WORDS} from '../src/core/blocklist.js';
import {dailyWords} from '../src/core/daily.js';
import {dailyRiddleWords} from '../src/core/riddleDaily.js';
import {SETS} from '../src/sets/sets.js';

const data = JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url), 'utf8'));
const pool = buildPool(data);

test('the blocklist catches slurs, their families and slur glosses', () => {
  for (const w of ['coolie', 'gypsy', 'nigger', 'niggers', 'faggot', 'retarded', 'kike', 'chink']) assert.ok(isBlockedWord(w), w);
  for (const d of ['An Asian person.', 'A person of Indian descent.', 'An offensive term for a woman.']) assert.ok(isBlockedDef(d), d);
  for (const w of ['cocoon', 'conspicuous', 'bullfrog', 'allspice', 'jewel', 'paddy', 'slope', 'spice', 'savage', 'whorl', 'leapfrog', 'skyscraper']) assert.ok(!isBlockedWord(w), w);
  assert.ok(!isBlockedDef('A place of worship for Jews.'));
});

test('no blocked word or gloss is in the playable pool, the bank, or any set', () => {
  assert.ok(pool.length > 5000);
  for (const w of pool) assert.ok(!isBlocked(w.w, w.def), `${w.w}: ${w.def}`);
  for (const b of BANK) assert.ok(!isBlocked(b[0], b[3]), b[0]);
  for (const s of SETS) for (const w of s.words) assert.ok(!isBlockedWord(w), w);
});

test('every blocked entry in the dump is rejected as blocked, except ones dropped for other reasons', () => {
  const hits = data.words.filter(e => isBlocked(e.w, e.def));
  assert.ok(hits.length > 20);
  const inPool = new Set(pool.map(w => w.w));
  for (const e of hits) if (!e.curated) assert.ok(!inPool.has(e.w), e.w);
  for (const w of ['coolie', 'chopstick', 'gypsy']) assert.ok(!inPool.has(w), w);
  assert.equal(rejectReason({...data.words.find(e => e.w === 'coolie')}), 'blocked');
  for (const w of BLOCKED_WORDS) assert.ok(!inPool.has(w), w);
});

test('removing blocked words does not reshuffle the seeded Daily or Riddle', () => {
  // Rebuild the pool the way it was before the blocklist: same words plus the ghosts, then compare the schedules.
  assert.ok(pool.ghosts.length > 0);
  WORDS.length = 0; WORDS.push(...pool); GHOSTS.length = 0; GHOSTS.push(...pool.ghosts);
  const keep = [], kr = [];
  let days = 0;
  for (let i = 0; i < 400; i++) {
    const key = new Date(Date.parse('2026-11-03') + i * 864e5).toISOString().slice(0, 10);
    const a = dailyWords(key, 7).map(w => w.w), r = dailyRiddleWords(key, 7).map(w => w.w);
    keep.push(a); kr.push(r); days++;
    assert.equal(new Set(a).size, 7);
    for (const w of [...a, ...r]) assert.ok(!isBlockedWord(w), w);
  }
  // The first four days (already played) must match the schedule from before the blocklist existed.
  assert.deepEqual(keep.slice(0, 4), PLAYED);
  assert.equal(days, 400);
});

// Daily No. 1 to 4 as they were generated before the blocklist (recorded from origin/main).
const PLAYED = JSON.parse(readFileSync(new URL('./fixtures/daily-1-4-pre-blocklist.json', import.meta.url), 'utf8'));
