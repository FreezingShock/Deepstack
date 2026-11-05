import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOOK_INTROS,introSpreads} from '../src/ui/home.js';

test('Unlimited intro puts the primary action before the feature list, with a dynamic label', () => {
  const i = {...BOOK_INTROS.bUnl, btn: () => 'Descend', second: () => '<button class="bs-again">Place me again</button>'};
  const [{l}] = introSpreads(i);
  assert.ok(l.indexOf('bs-primary') > -1 && l.indexOf('bs-primary') < l.indexOf('In this book'));
  assert.match(l, />Descend</);
  assert.ok(l.indexOf('bs-again') > l.indexOf('bs-primary'));
});
