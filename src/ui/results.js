/* Richer end-of-run recap, inserted into the final sheet by main.js. */
import {TIERS} from '../core/index.js';
import {summarizeRun, setsTouched} from '../core/recap.js';
import {setStatus} from '../sets/sets.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export function recapHTML(d, S) {
  const r = summarizeRun(d), books = d.books || [];
  const tiles = [
    ['Answered', `${r.answered}/${r.total}`],
    r.top ? ['Best book', `${esc(r.top.w)} · ${r.top.score}`] : null,
    r.bestCombo >= 2 ? ['Best combo', `${r.bestCombo} in a row · +${r.comboFt} ft`] : ['Combo', 'none'],
    r.setFt ? ['Set bonus', `+${r.setFt} ft`] : null,
    r.hints ? ['Hints used', r.hints] : null,
    r.skipped ? ['Skipped', r.skipped] : null
  ].filter(Boolean);
  const sets = setsTouched(books, setStatus(S));
  return `<div class="recap">
   <div class="rtiles">${tiles.map(([k, v]) => `<div class="rtile"><small>${k}</small><b>${v}</b></div>`).join('')}</div>
   <ol class="rbooks" aria-label="Books from this run">${books.map((b, i) => {
     const T = TIERS[b.tier], skip = b.answer === '' && b.score === 0;
     return `<li><button class="rbook" data-i="${i}" aria-label="Open ${esc(b.w)}"><i class="dot" style="background:${T.spine}"></i><span class="rw">${esc(b.w)}</span><span class="rt">${skip ? 'Skipped' : T.name}</span><span class="rs">${skip ? '–' : b.score}</span><span class="rf">+${b.ft || 0} ft${b.combo ? ` <em>×${Math.round(b.combo.mult * 100) / 100}</em>` : ''}</span></button></li>`;
   }).join('')}</ol>
   ${sets.length ? `<div class="rsets"><small>Set progress</small>${sets.map(s => `<div class="rset${s.complete ? ' done' : ''}"><span>${esc(s.name)}</span><span class="setbar"><i style="width:${s.n / s.total * 100}%"></i></span><span>${s.n}/${s.total}</span></div>`).join('')}</div>` : ''}
  </div>`;
}

export function bindRecap(root, books, openCard) {
  root.querySelectorAll('.rbook').forEach(b => { b.onclick = () => openCard(books[+b.dataset.i], {fresh: false}); });
}
