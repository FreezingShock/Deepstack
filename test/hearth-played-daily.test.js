// The fireplace must not depend on the Descend button: once today's Daily is played the plaque holds
// "Today's result" instead (#bRes), and the hearth used to skip itself, so the room went dark.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src = readFileSync(new URL('../src/ui/hearth.js', import.meta.url), 'utf8');

test('hearth layout falls back to the result button when Descend is gone', () => {
  assert.match(src, /descend = q\('#bPlay'\) \|\| q\('#bNext'\) \|\| q\('#bRes'\)/);
});
test('hearth no longer hides itself when the streak mantel is hidden in short rooms', () => {
  assert.doesNotMatch(src, /display === 'none'\) \{ layer\.hidden = true; return; \}/);
});
