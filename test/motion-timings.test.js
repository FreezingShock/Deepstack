// Guard: the motion overhaul's timing rules. Nothing non-ambient runs longer than 1200 ms (camera glides are
// exempt; they live in camMotion.js). Screen fades and the world dip read the shared table, not typed numbers.
// The allowlist below is the to-do list for the calmer-motion pass: a file leaves it when its long move is cut.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');
const read = p => readFileSync(join(SRC, p), 'utf8');
function files(dir, ext) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p, ext);
    return p.endsWith(ext) ? [p] : [];
  });
}

test('screen fades and the world dip take their durations from the motion table', () => {
  const t = read('ui/transitions.js');
  assert.match(t, /import \{DUR\} from '\.\/motion\.js'/);
  assert.match(t, /OUT_MS = DUR\.base/);
  assert.match(t, /'fadein'\), DUR\.page\)/);
  assert.doesNotMatch(t, /\b600\b|\b260\b/, 'no raw 600/260 ms left in transitions.js');
  assert.match(read('ui/screenFx.js'), /DIP_MS = 240;/, 'DIP_MS matches --m-base');
});

test('the room mastery glint is capped at smooth x2, not page x3', () => {
  assert.match(read('ui/roomMastery.css'), /rmGlint calc\(var\(--m-smooth\)\*2\)/);
});

// Files whose one-shot move still runs past 1200 ms. Each is a pending decision for the calmer-motion pass.
const LONG_OK = new Set([
  'styles/floors.css',     // #floorBanner reading hold (4.2 s -> 2.5 s); nate to pick the hold length
  'ui/candle.css',         // candle wisp, 1.6 s
  'ui/idleRoom.css',       // idle drip and orbit (ambient)
  'ui/runScreen.css',      // run-screen stagger
]);

test('no non-ambient CSS animation runs past 1200 ms outside the allowlist', () => {
  const bad = [];
  for (const f of files(SRC, '.css')) {
    const rel = relative(SRC, f).replace(/\\/g, '/');
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/animation(?:-duration)?:\s*([^;}]*)/g)) {
      const v = m[1];
      if (/infinite/.test(v)) continue;
      const over = [...v.matchAll(/(\d*\.?\d+)(ms|s)\b/g)].some(x => (x[2] === 's' ? +x[1] * 1000 : +x[1]) > 1200);
      if (over && !LONG_OK.has(rel)) bad.push(`${rel}: ${v.trim().slice(0, 60)}`);
    }
  }
  assert.deepEqual(bad, [], 'shorten the move to 1200 ms or less, or justify it here');
});
