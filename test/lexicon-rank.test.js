import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankFor, rankIndex, rankHTML, levelChangeLine, RANK_NOTES} from '../src/ui/lexiconRank.js';
import {LEVEL_TITLES} from '../src/core/level.js';
import {lexicon} from '../src/core/unlimited.js';

test('every band has a rank name and a note', () => {
  for (const [m, name] of LEVEL_TITLES) { assert.equal(rankFor(m), name); assert.ok(RANK_NOTES[name]); }
  assert.equal(rankFor(19), 'Casual Reader'); assert.equal(rankFor(20), 'Bookworm'); assert.equal(rankFor(100), 'Grand Logophile');
});
test('rank block: unplaced explains placement, placed shows rank and Lexicon', () => {
  assert.match(rankHTML({placed: false, L: 3.5}, lexicon), /Not yet placed/);
  const h = rankHTML({placed: true, L: 5.2}, lexicon);
  assert.match(h, /Philologist/); assert.match(h, /Lexicon 52/);
});
test('level-change line', () => {
  assert.equal(levelChangeLine({mode: 'daily'}), '');
  assert.match(levelChangeLine({mode: 'unlimited', placing: true, lex: 40, lex0: 35}), /placed as a Wordsmith/);
  assert.match(levelChangeLine({mode: 'unlimited', lex: 41, lex0: 36}), /Still a Wordsmith/);
  assert.match(levelChangeLine({mode: 'unlimited', lex: 51, lex0: 49}), /rose from Wordsmith to Philologist/);
  assert.match(levelChangeLine({mode: 'unlimited', lex: 19, lex0: 21}), /slipped from Bookworm to Casual Reader/);
  assert.equal(rankIndex(0), 0);
});
