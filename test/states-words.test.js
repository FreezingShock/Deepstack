import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadWords, retryWords} from '../src/core/wordPool.js';
import {openStates, clearState} from '../src/core/stateEvents.js';

test('a word list that will not download is reported with a retry that asks again', async () => {
  clearState('words-unavailable');
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return {ok: false, status: 503, json: async () => ({})}; };
  const first = await loadWords('/data/words.json');
  assert.equal(first.ok, false);
  const open = openStates().find(e => e.kind === 'words-unavailable');
  assert.ok(open && typeof open.retry === 'function', 'the problem is reported with a retry');
  assert.equal(calls.length, 1);
  // retry forgets the failed attempt and asks the server again; the report stays while it still fails
  const again = await retryWords('/data/words.json');
  assert.equal(again.ok, false);
  assert.equal(calls.length, 2, 'retry goes back to the network');
  assert.ok(openStates().some(e => e.kind === 'words-unavailable'));
  clearState('words-unavailable');
  delete globalThis.fetch;
});
