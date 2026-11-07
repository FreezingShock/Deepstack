import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {passageHTML, sheetHTML, frameHTML, wallHTML} from '../src/restore/markup.js';
import {buildPage, applyScore, applyWord, giveLetter, leaveFaded} from '../src/restore/pages.js';

const css = readFileSync(new URL('../src/restore/restore.css', import.meta.url), 'utf8');
const pool = [
  {w: 'comet', pos: 'noun', def: 'A ball of ice and dust with a glowing tail when near the sun.'},
  {w: 'quasar', pos: 'noun', def: 'A very bright galaxy core powered by a supermassive black hole.'},
  {w: 'nebula', pos: 'noun', def: 'A cloud of gas and dust in space, often where stars form.'},
  {w: 'eclipse', pos: 'noun', def: 'When one heavenly body hides the light of another from view.'},
];
const page = () => buildPage({room: 'science', seed: 9, pool});

test('a faded entry hides its definition until it is restored, so the markup cannot give it away', () => {
  const pg = page();
  const faded = pg.passages.find(p => p.kind === 'faded');
  const html = passageHTML(faded, 0);
  assert.ok(!html.includes(faded.def), 'the definition leaked into a faded entry');
  assert.ok(html.includes(faded.w), 'the headword is shown');
  applyScore(faded, 99);
  assert.ok(passageHTML(faded, 0).includes(faded.def), 'a restored entry shows its definition');
});

test('a smudged word never appears whole before it is written, and gaps show where letters are missing', () => {
  const pg = page();
  const sm = pg.passages.find(p => p.kind === 'smudged');
  const html = passageHTML(sm, 1);
  assert.ok(!html.includes(`>${sm.w}<`) && !html.includes(`${sm.w}</span>`), 'whole word in the markup');
  assert.ok(html.includes('class="gap"'), 'no gaps shown');
  assert.ok(html.includes(sm.def), 'the definition is the clue and stays readable');
  giveLetter(sm);
  assert.match(html, /class="rs-btn" type="button" data-act="letter"/, 'letter button markup');
});

test('user text is escaped everywhere it lands', () => {
  const evil = {w: 'comet', pos: 'noun', def: 'A <img src=x onerror=alert(1)> rock & ice that "burns".'};
  const pg = buildPage({room: 'science', seed: 2, pool: [evil, pool[1], pool[2]]});
  for (let i = 0; i < pg.passages.length; i++) {
    const html = passageHTML(pg.passages[i], i);
    assert.ok(!html.includes('<img'), 'raw tag');
  }
  const pgDone = buildPage({room: 'science', seed: 2, pool: [evil, pool[1], pool[2]]});
  pgDone.passages.forEach(p => applyScore(p, 100));
  assert.ok(!sheetHTML(pgDone).includes('<img'), 'sheet leaks a raw tag');
  assert.ok(frameHTML(pgDone).includes('&lt;img'));
});

test('a left smudged or faded entry stays damaged on the sheet and the wall', () => {
  const pg = page();
  pg.passages.forEach(p => leaveFaded(p));
  const html = sheetHTML(pg);
  assert.ok(html.includes('rs-lost'));
  assert.ok(!pg.passages.some(p => p.restored && html.includes(`${p.def}`)));
  assert.match(frameHTML(pg), /lost/);
});

test('the sheet carries its damage as a variable, and the wall is empty without pages', () => {
  const pg = page();
  assert.match(sheetHTML(pg), /--damage:1\.000/);
  assert.match(wallHTML([]), /The wall is bare/);
  assert.match(wallHTML([pg]), /rs-frame/);
});

test('the answer wrong state and the restored state are both reachable from the sheet', () => {
  const pg = page();
  const sm = pg.passages.find(p => p.kind === 'smudged');
  assert.equal(applyWord(sm, 'nope'), false);
  assert.match(passageHTML(sm, 0), /Write the word/);
  assert.equal(applyWord(sm, sm.w), true);
  assert.match(passageHTML(sm, 0, true), /rs-p smudged done restored fresh/);
});

test('CSS guard: entries wrap instead of clipping, and every motion rule has a reduced-motion off switch (html.rm)', () => {
  assert.match(css, /\.rs-def,\.rs-lost\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.rs-head\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.rs-word\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /:where\(html\.rm\) \.rs-stain/);
  assert.match(css, /@media \(max-width:640px\)/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, 'raw hex: use a colour token from src/theme/colors.js');
});
