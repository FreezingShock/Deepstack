import './sets.css';
import {toSpreads} from '../ui/bookpages.js';
import {emptyBlock} from '../ui/emptyPages.js';
import {setStatus, bonusFt, MIN_SCORE} from './sets.js';
import {crestHTML, setPageHTML} from './pages.js';
export {crestHTML, setPageHTML};

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
let toastEl = null, toastT = 0;
/* Pure page builder: an overview leaf, then one leaf per set. */
export function setLeaves(S) {
  const st = setStatus(S), got = (S.sets && S.sets.got) || {};
  const done = st.filter(s => s.complete).length, bonus = bonusFt(S);
  const overview = `<h1>Book sets</h1><div class="kicker">${done} of ${st.length} complete${bonus ? ` \u00b7 +${bonus} ft bonus depth` : ''}</div>
   <p class="note">Collect every word in a set with an answer of at least ${MIN_SCORE}/100 and it pays out bonus depth.</p>
   <h2>Contents</h2><ul class="toc">${st.map(s => `<li><span>${esc(s.name)}</span><b>${s.n}/${s.total}${s.complete ? ' \u2713' : ''}</b></li>`).join('')}</ul>${done || bonus || st.some(s => s.n) ? '' : emptyBlock('ledger', 'Nothing crossed off yet.', 'compact')}`;
  const pages = st.map((s, i) => setPageHTML(s, i, got));
  return [overview, ...pages];
}

/** Registry entry for home.js BOOK_PAGES. */
export const setsBook = S => ({label: 'Book sets', spreads: () => toSpreads(setLeaves(S))});

/** Brief banner when a book finishes a set. */
export function toastSetsDone(sets) {
  if (!sets.length) return;
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'settoast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
  toastEl.innerHTML = sets.map(s => `<b>Set complete: ${esc(s.name)}</b> <span>+${s.bonus} ft</span>`).join('<br>');
  toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 5200);
}
