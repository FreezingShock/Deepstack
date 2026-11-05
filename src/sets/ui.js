import './sets.css';
import {toSpreads} from '../ui/bookpages.js';
import {TIERS, tierOf} from '../core/index.js';
import {emptyBlock} from '../ui/emptyPages.js';
import {setCrest} from '../ui/sigil.js';
import {setStatus, bonusFt, MIN_SCORE} from './sets.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
let toastEl = null, toastT = 0;
/* Pure page builder: an overview leaf, then one leaf per set. */
/** The set's ring as an inline image (empty string when there is no canvas, e.g. under test). */
export const crestHTML = (i, done) => { const cv = setCrest(i); return `<span class="crest${done ? ' wax' : ''}" data-set="${i}">${cv ? `<img alt="" src="${cv.toDataURL()}">` : ''}</span>`; };
export function setLeaves(S) {
  const st = setStatus(S), got = (S.sets && S.sets.got) || {};
  const done = st.filter(s => s.complete).length, bonus = bonusFt(S);
  const overview = `<h1>Book sets</h1><div class="kicker">${done} of ${st.length} complete${bonus ? ` \u00b7 +${bonus} ft bonus depth` : ''}</div>
   <p class="note">Collect every word in a set with an answer of at least ${MIN_SCORE}/100 and it pays out bonus depth.</p>
   <h2>Contents</h2><ul class="toc">${st.map(s => `<li><span>${esc(s.name)}</span><b>${s.n}/${s.total}${s.complete ? ' \u2713' : ''}</b></li>`).join('')}</ul>${done || bonus || st.some(s => s.n) ? '' : emptyBlock('ledger', 'Nothing crossed off yet.', 'compact')}`;
  const pages = st.map((s, i) => `<div class="setpage${s.complete ? ' done' : ''}">${crestHTML(i, s.complete)}<div class="kicker">Set</div><h1>${esc(s.name)}</h1>
   <p class="note">${esc(s.blurb)}</p>
   <div class="setbar"><i style="width:${s.n / s.total * 100}%"></i></div>
   <div class="setprog">${s.n} of ${s.total} collected \u00b7 ${s.bonus} ft reward</div>
   ${s.complete ? `<span class="seal">Complete${s.doneAt && s.doneAt !== 'earlier' ? ' \u00b7 ' + esc(s.doneAt) : ''}</span>` : ''}
   <ul class="setwords">${s.words.map(w => {
     const sc = got[w] || 0, has = sc >= MIN_SCORE;
     return `<li class="${has ? 'has' : ''}">${has ? `<i class="dot" style="background:${TIERS[tierOf(sc)].spine}"></i>` : '<i class="dot empty"></i>'}${esc(w)}${has ? `<em>${sc}/100</em>` : ''}</li>`;
   }).join('')}</ul></div>`);
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
