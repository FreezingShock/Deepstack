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

/* RV2 and RV3, RV4 helpers */
import {filterReview} from '../src/ui/reviewPages.js';
import {runWordsToReview} from '../src/core/reviewShelf.js';

test('the room and rarity filters narrow the words, and the tab still counts every word waiting', () => {
  const S = {shelf: [
    book('abandon', 22, 1, {room: 'science', tier: 1}),
    book('lucid', 0, 2, {answer: '', room: 'art', tier: 0}),
    book('candid', 10, 3, {tier: 1}),                 // no room: the Reading Room (hall)
  ]};
  const all = reviewItems(S);
  assert.deepEqual(filterReview(all, {room: 'science'}).map(i => i.w), ['abandon']);
  assert.deepEqual(filterReview(all, {room: 'hall'}).map(i => i.w), ['candid']);
  assert.deepEqual(filterReview(all, {tier: 1}).map(i => i.w), ['candid', 'abandon']);
  assert.deepEqual(filterReview(all, {room: 'art', tier: 1}), []);
  const {leaves, items} = reviewLeaves(S, {room: 'art', tier: 1});
  assert.equal(items.length, 0);
  assert.ok(leaves[0].includes('Nothing in this room or rarity'));
  assert.ok(leaves[0].includes('data-view="review" aria-pressed="true"') && leaves[0].includes('To review <small>3</small>'));
});

test('the filter chips show only the rooms and rarities that have words, and carry their filter values', () => {
  const S = {shelf: [book('abandon', 22, 1, {room: 'science', tier: 1}), book('candid', 10, 3, {tier: 2})]};
  const {leaves} = reviewLeaves(S);
  assert.ok(leaves[0].includes('data-k="room" data-v="science"'));
  assert.ok(leaves[0].includes('data-k="room" data-v="hall"'));
  assert.ok(!leaves[0].includes('data-v="art"'));
  assert.ok(!leaves[0].includes('data-k="tier" data-v="0"'), 'a rarity with no words gets no chip');
  assert.ok(leaves[0].includes('data-k="tier" data-v="1"') && leaves[0].includes('data-k="tier" data-v="2"'));
  const one = reviewLeaves({shelf: [book('candid', 10, 3)]}).leaves[0];
  assert.ok(!one.includes('aria-label="Room"'), 'one room, no room chips');
});

test('a filtered review shows its contents and word pages for the narrowed set only', () => {
  const shelf = [];
  for (let i = 0; i < 9; i++) shelf.push(book(`scienceword${i}`, 5, 100 + i, {room: 'science'}));
  shelf.push(book('artword', 5, 50, {room: 'art'}));
  const {leaves, at} = reviewLeaves({shelf}, {room: 'science'});
  assert.equal(Object.keys(at).length, 9);
  assert.ok(!Object.keys(at).includes('artword'));
  assert.equal(leaves.length, 1 + 2 + 9); // overview, two contents pages, nine word pages
});

test('a result card counts only its words that are still to win back, once each', () => {
  const S = {shelf: [book('abandon', 22, 1), book('lucid', 0, 2, {answer: ''}), book('candid', 60, 3)]};
  const run = [{w: 'Abandon'}, {w: 'abandon'}, {w: 'lucid'}, {w: 'candid'}, {w: 'vivid'}, null];
  assert.equal(runWordsToReview(S, run), 2);       // abandon and lucid; candid was won, vivid never missed
  assert.equal(runWordsToReview(S, []), 0);         // a clean run shows no link
  assert.equal(runWordsToReview(S, undefined), 0);  // a run with no books list
  recordRetry(S, 'abandon', 50, 9);
  assert.equal(runWordsToReview(S, run), 1);        // a re-try that wins a word back takes it off the list
});

test('the result card offers the link only when the run has words to win back (RV2)', async () => {
  const {finalHTML} = await import('../src/ui/results.js');
  const d = {books: [{w: 'abandon', tier: 1, score: 22, answer: 'x', ft: 9}], avg: 22, best: 1, depth: 40, floor: 0, mode: 'daily'};
  const opts = {txt: 'x', rarest: 'Folio', no: 2, floorName: '', levelTitle: () => '', spines: ''};
  assert.ok(finalHTML(d, {}, {...opts, toReview: 2}).includes('id="rvw">Words to win back (2)</button>'));
  assert.ok(!finalHTML(d, {}, {...opts, toReview: 0}).includes('id="rvw"'), 'a clean run has no link');
  assert.ok(!finalHTML(d, {}, opts).includes('id="rvw"'), 'no count, no link');
});
