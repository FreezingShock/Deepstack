/* Makes the review view live: the Shelf / To review switch, contents jumps, and the quick re-try on each word.
   A re-try is judged by the same full judge the Daily uses (strict), so a word is only won back on a real score.
   It writes only the re-try record (S.review); no book is added and no depth is earned. */
import {REVIEW_BELOW, recordRetry} from '../core/reviewShelf.js';
import {TIERS, tierOf} from '../core/tiers.js';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * @param {HTMLElement} sp   the open spread
 * @param {{setSpreads:Function}} api   the book's controls
 * @param {object} d
 *   S, save(), judge(text, word, opts), fullWord(key) -> word record or undefined, verdictFor(j, t, word),
 *   jump(leafIndex) -> repaints the book at that leaf, switch(view) -> switches the Shelf / To review view
 */
export function wireReview(sp, api, {S, save, judge, fullWord, verdictFor, jump, switchView}) {
  sp.querySelectorAll('.sv-tab').forEach(b => { b.onclick = () => switchView(b.dataset.view); });
  sp.querySelectorAll('.rv-jump,.rv-back').forEach(b => { b.onclick = () => jump(+b.dataset.leaf); });
  sp.querySelectorAll('.rv-entry').forEach(entry => {
    const form = entry.querySelector('.rv-form'), ta = entry.querySelector('.rv-in'), out = entry.querySelector('.rv-result');
    const go = entry.querySelector('.rv-go');
    const close = () => { entry.classList.remove('trying'); form.hidden = true; };
    entry.querySelector('.rv-try').onclick = () => {
      entry.classList.add('trying'); form.hidden = false; out.textContent = '';
      setTimeout(() => ta.focus({preventScroll: true}), 60);
    };
    entry.querySelector('.rv-close').onclick = close;
    ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }};
    form.onsubmit = async e => {
      e.preventDefault();
      const key = entry.dataset.key, text = ta.value.trim();
      if (!text) { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); out.textContent = 'Write something first.'; return; }
      const word = fullWord(key);
      if (!word) { out.textContent = 'The word list is still arriving. Try again in a moment.'; return; }
      go.disabled = true; out.textContent = 'Reading your answer…';
      const j = await judge(text, word, {strict: true, onWait: () => { out.textContent = 'The librarian is still arriving. Your answer is safe.'; }});
      const t = tierOf(j.score), rec = recordRetry(S, key, j.score);
      save();
      entry.classList.remove('trying'); // the meaning comes back once the answer is read
      entry.classList.toggle('won', !!rec.cleared);
      entry.querySelector('.rv-meta').textContent = `Re-tried ${plural(rec.tries, 'time', 'times')} · best ${rec.best}`;
      out.textContent = `${j.score}/100 · ${TIERS[t].name}. ${verdictFor(j, t, word)} ` +
        (rec.cleared ? 'Won back. It leaves the review shelf when you reopen the book.' : `${REVIEW_BELOW}/100 or better wins it back.`);
      go.disabled = false;
    };
  });
  return api;
}
