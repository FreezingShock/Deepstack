import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewItems, reviewCount, recordRetry, retryOf, REVIEW_BELOW} from '../src/core/reviewShelf.js';
import {reviewLeaves, viewTabs, CONTENTS_PER_PAGE} from '../src/ui/reviewPages.js';
import {esc} from '../src/ui/bookpages.js';

const book = (w, score, t, extra = {}) => ({w, pos: 'noun', def: `The meaning of ${w}.`, answer: score ? 'my words' : '', score, tier: score >= 30 ? 2 : 0, t, ...extra});

test('a word is on the review shelf while its best answer is under Folio, and skipped words count as 0', () => {
  const S = {shelf: [book('abandon', 22, 1), book('lucid', 0, 2, {answer: ''}), book('candid', 60, 3), book('Candid', 10, 4)]};
  const items = reviewItems(S).map(i => i.w);
  assert.deepEqual(items, ['lucid', 'abandon']); // candid got 60 once, so it is won; newest miss first
  assert.equal(REVIEW_BELOW, 46);
  assert.equal(reviewCount(S), 2);
});

test('repeated misses fold into one entry per word, case-insensitively, with the latest book shown', () => {
  const S = {shelf: [book('Tenacious', 9, 5), book('tenacious', 12, 9), book('tenacious', 4, 7)]};
  const [it] = reviewItems(S);
  assert.equal(reviewItems(S).length, 1);
  assert.equal(it.n, 3);
  assert.equal(it.best, 12);
  assert.equal(it.last.t, 9);
  assert.equal(it.key, 'tenacious');
});

test('a re-try records tries and best, clears at Folio, and never adds a book', () => {
  const S = {shelf: [book('abandon', 22, 1)]};
  const shelfBefore = JSON.stringify(S.shelf);
  assert.equal(recordRetry(S, 'abandon', 30, 100).cleared, false);
  let r = recordRetry(S, 'abandon', 12, 200);
  assert.deepEqual([r.tries, r.best, r.cleared], [2, 30, false]);
  r = recordRetry(S, 'abandon', REVIEW_BELOW, 300);
  assert.equal(r.cleared, true);
  assert.equal(reviewItems(S).length, 0, 'a cleared word leaves the review shelf');
  recordRetry(S, 'abandon', 5, 400);
  assert.equal(retryOf(S, 'abandon').cleared, true, 'once won back, a later low re-try does not take it off again');
  assert.equal(JSON.stringify(S.shelf), shelfBefore);
});

test('old saves without S.review read as no re-tries', () => {
  assert.equal(retryOf({}, 'x'), null);
  assert.equal(reviewItems({}).length, 0);
  assert.equal(reviewItems({shelf: null}).length, 0);
});

test('the review view lists every word, jumps to each word page, and escapes saved text', () => {
  const words = Array.from({length: CONTENTS_PER_PAGE + 3}, (_, i) => book('word' + i, i % 3 ? 5 : 0, 1000 - i));
  words[0] = book('<img src=x onerror=alert(1)>', 4, 2000, {answer: '<script>x</script>', fb: {m: ['a <b>bold</b> idea']}});
  const S = {shelf: words};
  const {leaves, at, items} = reviewLeaves(S);
  assert.equal(items.length, words.length);
  assert.ok(leaves[0].includes('To review') && leaves[0].includes('sv-tabs'));
  for (const it of items) {
    const page = leaves[at[it.key]];
    assert.ok(page && page.includes('class="rv-entry"') && page.includes('rv-try'), it.key);
    assert.ok(page.includes('data-key="' + esc(it.key) + '"'), it.key);
  }
  const first = leaves[at[items[0].key]];
  assert.ok(!first.includes('<script>') && !first.includes('<img'), 'saved answers and words are escaped');
  assert.ok(first.includes('&lt;script&gt;') && first.includes('a &lt;b&gt;bold&lt;/b&gt; idea'));
  assert.ok(leaves.filter(l => l.includes('rv-toc')).length >= 2, 'contents run over more than one page');
  const skipped = leaves[at['word3']];
  assert.ok(skipped.includes('Skipped. The word stayed closed.'), 'a skipped word says so instead of an empty answer');
});

test('an empty review view says so, and the tabs show the counts and the pressed view', () => {
  const {leaves, items} = reviewLeaves({shelf: []});
  assert.equal(items.length, 0);
  assert.equal(leaves.length, 1);
  assert.ok(leaves[0].includes('Nothing to win back'));
  const tabs = viewTabs('review', 8, 3);
  assert.ok(/data-view="review" aria-pressed="true"[^>]*>To review <small>3<\/small>/.test(tabs));
  assert.ok(/data-view="shelf" aria-pressed="false"[^>]*>Shelf <small>8<\/small>/.test(tabs));
});
