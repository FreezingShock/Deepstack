import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDescent, takePath, takeRelic, resolveFailure, endWord} from '../src/core/descent.js';
import {recordDescent, descentStore, RUN_KEEP, runCount} from '../src/core/descentLog.js';
import {relicCodexLeaves, descentHistoryLeaves, relicArt, RECENT_SHOWN} from '../src/ui/relicCodex.js';

/** A finished descent the way run.js leaves it: path, relics, and a failure at a word if it ended. */
const finished = ({paths = [], relics = [], failAt = 0} = {}) => {
  let d = newDescent();
  for (const p of paths) d = takePath(d, p);
  for (const r of relics) d = takeRelic(d, r);
  if (failAt) d = resolveFailure(d, true, failAt);
  return endWord(d);
};

test('a finished descent is written once, with its doors, relics and ending', () => {
  const S = {room: 'hall'};
  const run = recordDescent(S, finished({paths: ['deeper', 'curio'], relics: ['wick'], failAt: 5}), {day: '2026-11-06', ft: 340, words: 7});
  assert.equal(run.ended, true);
  assert.equal(run.endedAt, 5);
  assert.deepEqual(run.doors, ['deeper', 'curio']);
  assert.deepEqual(run.relics, ['wick']);
  assert.equal(runCount(S), 1);
  assert.equal(descentStore(S).best.hall.ft, 340);
  assert.deepEqual(descentStore(S).relics.wick, {day: '2026-11-06', room: 'hall', ft: 340});
});

test('a run held to the last word is recorded as held, with no ending word', () => {
  const S = {room: 'math'};
  const run = recordDescent(S, finished({paths: ['rest']}), {day: '2026-11-01', ft: 120});
  assert.equal(run.ended, false);
  assert.equal(run.endedAt, 0);
  assert.equal(run.spent, 0);
  assert.equal(descentStore(S).best.math.ft, 120);
});

test('the history keeps the newest runs only, and never past RUN_KEEP', () => {
  const S = {room: 'hall'};
  for (let i = 0; i < RUN_KEEP + 5; i++) recordDescent(S, finished(), {day: '2026-10-01', ft: i});
  const runs = descentStore(S).runs;
  assert.equal(runs.length, RUN_KEEP);
  assert.equal(runs[runs.length - 1].ft, RUN_KEEP + 4);
});

test('personal bests only ever rise, and each room keeps its own', () => {
  const S = {room: 'hall'};
  recordDescent(S, finished(), {day: '2026-11-01', ft: 300, room: 'hall'});
  recordDescent(S, finished(), {day: '2026-11-02', ft: 200, room: 'hall'});
  recordDescent(S, finished(), {day: '2026-11-03', ft: 90, room: 'science'});
  const st = descentStore(S);
  assert.deepEqual(st.best.hall, {ft: 300, day: '2026-11-01'});
  assert.deepEqual(st.best.science, {ft: 90, day: '2026-11-03'});
});

test('a relic is dated the first time it is carried and never overwritten', () => {
  const S = {room: 'hall'};
  recordDescent(S, finished({relics: ['folio']}), {day: '2026-11-01', ft: 150});
  recordDescent(S, finished({relics: ['folio']}), {day: '2026-11-04', ft: 800, room: 'art'});
  assert.deepEqual(descentStore(S).relics.folio, {day: '2026-11-01', room: 'hall', ft: 150});
});

test('a missing, odd or older save reads as an empty memory', () => {
  for (const S of [{}, {descent: null}, {descent: 'x'}, {descent: {runs: 'no', best: [], relics: null}}]) {
    const st = descentStore(S);
    assert.deepEqual(st.runs, []);
    assert.deepEqual(st.best, {});
    assert.deepEqual(st.relics, {});
  }
  assert.equal(recordDescent({}, null), null);
});

test('the codex shows every relic: found ones dated and placed, the rest greyed', () => {
  const S = {room: 'hall'};
  recordDescent(S, finished({relics: ['index']}), {day: '2026-11-02', ft: 210, room: 'science'});
  const [left, right] = relicCodexLeaves(S);
  assert.match(left, /1 of 3 found/);
  assert.equal((left + right).match(/class="rc-entry found"/g).length, 1);
  assert.equal((left + right).match(/class="rc-entry lost"/g).length, 2);
  assert.match(left, /First carried Nov 2 in <span class="rc-room" style="--c:90,215,110">Observatory<\/span>, at 210 ft\./);
  assert.match(left, /Index card/);
  assert.match(right, /Folio double/);
  assert.match(right, /Not found yet/);
});

test('a lost relic does not show its flavour line; a found one does', () => {
  const S = {room: 'hall'};
  const [lostLeft] = relicCodexLeaves(S);
  assert.equal(lostLeft.includes('A card of margin notes'), false);
  recordDescent(S, finished({relics: ['index']}), {day: '2026-11-02', ft: 1});
  assert.match(relicCodexLeaves(S)[0], /A card of margin notes/);
});

test('an empty codex and history say so in words', () => {
  const S = {};
  const [codex] = relicCodexLeaves(S);
  assert.match(codex, /None found yet/);
  const [hist, runs] = descentHistoryLeaves(S);
  assert.match(hist, /0 runs kept/);
  assert.match(hist, /–/);
  assert.match(runs, /No descents yet\./);
});

test('recent runs list the doors by letter, the relics, and how the run ended', () => {
  const S = {room: 'hall'};
  recordDescent(S, finished({paths: ['deeper', 'curio'], relics: ['index', 'wick'], failAt: 4}), {day: '2026-11-05', ft: 260, words: 7});
  recordDescent(S, finished({paths: ['rest']}), {day: '2026-11-06', ft: 380, words: 7});
  const [, right] = descentHistoryLeaves(S);
  assert.match(right, /Held to the last word/);
  assert.match(right, /Ended at word 4 of 7/);
  assert.match(right, /Doors A · C/);
  assert.match(right, /Doors B/);
  assert.match(right, /Nothing carried/);
  assert.match(right, /One more free hint|Index card/);
  assert.ok(right.indexOf('380 ft') < right.indexOf('260 ft'), 'newest first');
});

test('the history shows at most RECENT_SHOWN runs', () => {
  const S = {room: 'hall'};
  for (let i = 0; i < RECENT_SHOWN + 4; i++) recordDescent(S, finished(), {day: '2026-11-01', ft: 10 + i});
  const [hist, right] = descentHistoryLeaves(S);
  assert.equal((right.match(/class="dh-run /g) || []).length, RECENT_SHOWN);
  assert.match(hist, new RegExp(`${RECENT_SHOWN + 4} runs kept`));
});

test('every relic has a drawing, and an unknown id draws nothing', () => {
  for (const id of ['index', 'wick', 'folio']) assert.match(relicArt(id), /<svg class="rc-art"/);
  assert.equal(relicArt('nope'), '<svg class="rc-art" viewBox="0 0 48 48" aria-hidden="true" focusable="false"></svg>');
});

test('the codex and history use theme tokens, never raw colours', () => {
  for (const f of ['src/ui/relicCodex.css', 'src/ui/relicCodex.js', 'src/core/descentLog.js']) {
    const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(src), `${f} has a raw hex colour`);
  }
});
