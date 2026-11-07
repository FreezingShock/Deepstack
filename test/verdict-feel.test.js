import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verdictPlan, STROKES, TURN_FROM, BUZZ, LOW_MAX_STROKES} from '../src/sound/verdictFeel.js';

const strokes = p => p.sound.filter(s => s.kind === 'quill').length;
const turns = p => p.sound.filter(s => s.kind === 'paper').length;

test('every tier writes at least one stroke, and higher tiers write more', () => {
  const n = [0, 1, 2, 3, 4, 5, 6].map(t => strokes(verdictPlan(t)));
  assert.ok(n.every(x => x >= 1), 'no tier is silent');
  for (let i = 1; i < n.length; i++) assert.ok(n[i] >= n[i - 1], `tier ${i} writes at least as much as ${i - 1}`);
  assert.ok(n[6] > n[0], 'Apocrypha writes more than Pamphlet');
  assert.deepEqual(STROKES, [1, 1, 2, 2, 3, 4, 5]);
});

test('a page turns first from the Folio up, and not below', () => {
  for (let t = 0; t <= 6; t++) {
    const p = verdictPlan(t);
    assert.equal(turns(p), t >= TURN_FROM ? 1 : 0, `tier ${t}`);
    if (turns(p)) assert.equal(p.sound[0].kind, 'paper', 'the turn comes before the pen');
  }
});

test('the sound timeline is in order and never overlaps the next stroke', () => {
  for (let t = 0; t <= 6; t++) {
    const at = verdictPlan(t).sound.map(s => s.at);
    assert.deepEqual(at, [...at].sort((a, b) => a - b), `tier ${t}`);
    for (let i = 1; i < at.length; i++) assert.ok(at[i] - at[i - 1] >= 38, `tier ${t}: gap ${at[i] - at[i - 1]}ms is above the quill rate limit`);
  }
});

test('buzz patterns escalate with tier and stay short', () => {
  const sum = a => a.reduce((x, y) => x + y, 0);
  for (const pat of BUZZ) {
    assert.ok(pat.every(n => Number.isInteger(n) && n > 0), 'whole ms, all positive');
    assert.ok(sum(pat) <= 400, `pattern ${pat} lasts under 400ms`);
  }
  for (let i = 1; i < BUZZ.length; i++) assert.ok(BUZZ[i].length >= BUZZ[i - 1].length, `tier ${i} buzzes at least as often`);
  assert.ok(sum(BUZZ[6]) > sum(BUZZ[0]), 'Apocrypha buzzes longer than Pamphlet');
});

test('Reduce Motion keeps one soft stroke and no buzz', () => {
  for (let t = 0; t <= 6; t++) {
    const p = verdictPlan(t, {calm: true});
    assert.deepEqual(p.sound, [{at: 0, kind: 'quill'}], `tier ${t}`);
    assert.equal(p.buzz, null, `tier ${t}`);
  }
});

test('Low Power caps the strokes but keeps the buzz', () => {
  for (let t = 0; t <= 6; t++) {
    const p = verdictPlan(t, {low: true});
    assert.ok(strokes(p) <= LOW_MAX_STROKES, `tier ${t}`);
    assert.ok(p.buzz && p.buzz.length, `tier ${t} still buzzes`);
  }
  assert.equal(strokes(verdictPlan(6, {low: true})), LOW_MAX_STROKES);
});

test('the Haptics setting turns the buzz off and leaves the sound alone', () => {
  const off = verdictPlan(5, {haptics: false}), on = verdictPlan(5, {haptics: true});
  assert.equal(off.buzz, null);
  assert.deepEqual(off.sound, on.sound);
  assert.deepEqual(verdictPlan(5).buzz, BUZZ[5]);
});

test('the buzz array is a copy, so a caller cannot change the table', () => {
  verdictPlan(2).buzz.push(999);
  assert.deepEqual(BUZZ[2], [14, 40, 14]);
});

test('the card plays the feel the moment the verdict line lands, on both paths', () => {
  const src = readFileSync(new URL('../src/app/card.js', import.meta.url), 'utf8');
  assert.match(src, /import \{landVerdict\} from '\.\.\/ui\/verdictFeel\.js'/);
  // the hurry path (a press during the reveal) and the normal path both light the verdict line; each must also play the feel
  const lands = [...src.matchAll(/classList\.add\('on'\);(\}?)landVerdict\(b\.tier\)/g)];
  assert.equal(lands.length, 2, 'both verdict-landing paths call landVerdict');
  assert.equal(src.match(/landVerdict\(/g).length, 2, 'only the two calls (the import has no parenthesis)');
});

test('the Haptics switch is on the settings page and wired in topbar', () => {
  const book = readFileSync(new URL('../src/ui/settingsBook.js', import.meta.url), 'utf8');
  const top = readFileSync(new URL('../src/ui/topbar.js', import.meta.url), 'utf8');
  assert.match(book, /sw\('sHaptics'/);
  assert.match(top, /sw\(\$\('#sHaptics'\),v=>set\(\{haptics:v\}\)\)/);
});
