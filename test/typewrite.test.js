import test from 'node:test';
import assert from 'node:assert/strict';
import {typewrite} from '../src/ui/typewrite.js';

test('typewrite leaves the text alone with no animation frames or when still', () => {
  const el = {childNodes: [], nodeType: 1};
  assert.equal(typeof typewrite(el, {still: true}), 'function');
  assert.equal(typeof typewrite(null), 'function');
});
