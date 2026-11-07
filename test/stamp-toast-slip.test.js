// The stamp toast as an inked slip (stampToast.js, stamps.css): the stacking rule, the pips, the press-on order, and the
// motion limits that keep it on the app's motion language. Each assertion is a regression guard for the slip's behaviour.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setRoomLists} from '../src/core/roomPool.js';
import {recordStamps, stampRows} from '../src/core/stamps.js';
import {stampToastHTML, stampToastInner, stackStamps, FOLD_MS, HIDE_MS} from '../src/ui/stampToast.js';

const css = readFileSync(new URL('../src/ui/stamps.css', import.meta.url), 'utf8');
const toastCss = css.slice(css.indexOf('/* The stamp toast'));
const entry = {id: 'history.first', room: 'history', name: 'First word', hint: 'Meet a word in this room.', of: {n: 2, total: 6}};

test('a new batch starts a fresh slip when nothing is up, and joins the slip when one is', () => {
  const batch = [entry];
  assert.deepEqual(stackStamps([entry], batch, false), {all: batch, from: 0}, 'a folded slip is replaced, not added to');
  const more = {...entry, id: 'math.first', room: 'math', name: 'Math first'};
  const joined = stackStamps(batch, [more], true);
  assert.equal(joined.all.length, 2, 'a stamp that lands while the slip is up joins it');
  assert.equal(joined.from, 1, 'only the new one presses on');
  assert.equal(stackStamps(null, batch, true).from, 0, 'a damaged slip counts as empty');
});

test('the slip shows every stamp it holds, and only the new ones carry the press-on delay', () => {
  const html = stampToastHTML([entry, {...entry, id: 'math.first', room: 'math', name: 'Math'}], 1);
  assert.match(html, /<div class="stp-entry" data-seen style="--c:235,60,60;--d:180ms">/, 'the seen stamp sits still');
  assert.match(html, /<div class="stp-entry" style="--c:70,140,255;--d:180ms">/, 'the new one presses on from its own start');
  assert.match(html, /<span>2 stamps earned<\/span>/);
});

test('the progress row has one pip for each stamp in the group, lit for each one earned', () => {
  const html = stampToastHTML([entry]);
  assert.equal((html.match(/<span class="stp-pips" aria-hidden="true">/g) || []).length, 1);
  const pips = html.match(/<span class="stp-pips"[^>]*>(.*?)<\/span><span class="stp-count">/)[1];
  assert.equal((pips.match(/<i/g) || []).length, 6, 'one pip per stamp in the room');
  assert.equal((pips.match(/<i class="on"/g) || []).length, 2, 'lit for the two earned');
  assert.match(html, /<span class="stp-count">2 of 6<\/span>/);
});

test('a stamp without progress still renders, with no empty row', () => {
  const html = stampToastHTML([{id: 'math.week', room: 'math', name: 'A week', hint: 'Seven in a row.'}]);
  assert.doesNotMatch(html, /stp-prog/);
  assert.match(html, /<b class="stp-name">A week<\/b>/);
});

test('the tab shows the count, and the slip sits inside the same element', () => {
  const inner = stampToastInner([entry, entry]);
  assert.match(inner, /<button type="button" class="stp-tab"[^>]*aria-label="2 stamps earned, show"[^>]*><span>2<\/span><\/button>/);
  assert.match(inner, /<div class="stp-plaque"><div class="stp-head">/);
});

test('recordStamps reports how many of its group are now earned, so the slip can show progress', () => {
  setRoomLists({math: Array.from({length: 8}, (_, i) => 'maths' + i)});
  const S = {shelf: [], met: {maths0: 1, maths1: 1, maths2: 1, maths3: 1, maths4: 1, maths5: 1, maths6: 1, maths7: 1}};
  const fresh = recordStamps(S, '2026-11-06');
  const mathFirst = fresh.find(s => s.id === 'math.first');
  assert.ok(mathFirst, 'the first word of the room is earned');
  const rows = stampRows(S, 'math');
  assert.deepEqual(mathFirst.of, {n: rows.filter(r => r.earned).length, total: rows.length});
  assert.equal(mathFirst.of.total, 6, 'a topic room has six stamps');
});

test('the slip folds and hides on timers that are at least as long as the press-on', () => {
  assert.ok(FOLD_MS >= 3000 && FOLD_MS < HIDE_MS, 'the slip stays up long enough to read, then folds before the tab goes');
});

test('the toast motion stays on the app tokens: nothing over 560ms, no loops, no fixed long durations', () => {
  const times = [...toastCss.matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)].map(m => m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1]));
  assert.ok(times.length > 0, 'the toast declares some durations');
  for (const t of times) assert.ok(t <= 560, `duration ${t}ms is over 560ms`);
  assert.doesNotMatch(toastCss, /var\(--m-linger\)/, 'the 1 second linger is not used by the toast');
  assert.doesNotMatch(toastCss, /infinite/, 'nothing loops');
  assert.doesNotMatch(toastCss, /@media\s*\(\s*prefers-reduced-motion/, 'reduced motion goes through html.rm, not a media query');
});

test('reduced motion stops every toast motion through :where(html.rm), on selectors as specific as the animated rules', () => {
  assert.match(toastCss, /:where\(html\.rm\) #stamptoast,:where\(html\.rm\) #stamptoast \.stp-tab,:where\(html\.rm\) #stamptoast\.open \.stp-plaque,:where\(html\.rm\) #stamptoast \.stp-mark,:where\(html\.rm\) #stamptoast \.stp-mark::after\{transition:none;animation:none\}/);
});

test('the toast stylesheet has no raw colours: tokens and --c only', () => {
  assert.doesNotMatch(toastCss, /#[0-9a-fA-F]{3,8}\b(?!\s*\{)/, 'no hex colours');
  assert.doesNotMatch(toastCss, /rgba?\(\s*\d/, 'no rgb literals');
});

test('the plaque is the Almanac brass on oak, and stays slip-sized on desktop', () => {
  assert.match(toastCss, /#stamptoast\.open\{width:min\(344px,calc\(100vw - 20px\)\)/, 'open width is capped at 344px, not the full screen');
  assert.match(toastCss, /var\(--c-oak-8\)/, 'dark oak plaque');
  assert.match(toastCss, /var\(--c-brass-cdbb92\)/, 'brass rules and pips');
  assert.doesNotMatch(toastCss, /--c-parchment\)\s*,\s*color-mix/, 'the slip is not the old paper gradient');
});
