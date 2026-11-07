import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STATE_COPY, noticeHTML} from '../src/ui/stateCopy.js';
import {reportState, clearState, onState, openStates} from '../src/core/stateEvents.js';

const KINDS = Object.keys(STATE_COPY);

test('every problem has a short title and a calm body of a few sentences', () => {
  for (const k of KINDS) {
    const c = STATE_COPY[k];
    assert.ok(c.title.length > 0 && c.title.length <= 48, `${k} title length`);
    assert.ok(c.body.length > 40 && c.body.length <= 200, `${k} body length`);
    assert.doesNotMatch(c.body, /!/, `${k}: no exclamation marks`);
    assert.doesNotMatch(c.title + c.body, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${k}: no emoji`);
  }
});

test('retry is offered only where a retry can work, and always has a visible action', () => {
  for (const k of KINDS) {
    const html = noticeHTML(k);
    assert.equal(html.includes('data-sn="retry"'), STATE_COPY[k].retry, k);
    assert.ok(html.includes(`>${STATE_COPY[k].action}<`), `${k} action label`);
    assert.match(html, /aria-label="Close"/, `${k} can always be closed`);
  }
});

test('an unknown problem still gets a readable plaque instead of an empty box', () => {
  const html = noticeHTML('no-such-kind');
  assert.match(html, /Something went wrong/);
  assert.match(html, /Reload the page/);
});

test('the event hub replays open problems to late subscribers and forgets cleared ones', () => {
  KINDS.forEach(clearState);
  reportState('words-unavailable', {retry: () => 1});
  const seen = [];
  const off = onState(e => seen.push(e.kind + (e.cleared ? ':cleared' : '')));
  assert.deepEqual(seen, ['words-unavailable']);
  assert.equal(openStates().length, 1);
  clearState('words-unavailable');
  assert.deepEqual(seen, ['words-unavailable', 'words-unavailable:cleared']);
  assert.equal(openStates().length, 0);
  clearState('words-unavailable'); // clearing something that is not open is quiet
  assert.equal(seen.length, 2);
  off();
  reportState('rooms-unavailable');
  assert.equal(seen.length, 2, 'an unsubscribed listener hears nothing');
  clearState('rooms-unavailable');
});
