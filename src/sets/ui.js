import './sets.css';
import {TIERS, tierOf} from '../core/index.js';
import {setStatus, bonusFt, MIN_SCORE} from './sets.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
let layer = null, toastEl = null, toastT = 0;

function ensure() {
  if (layer) return layer;
  layer = document.createElement('div'); layer.id = 'sets'; layer.hidden = true;
  document.body.appendChild(layer);
  return layer;
}
export function closeSets() { if (layer) layer.hidden = true; }
export const setsOpen = () => !!layer && !layer.hidden;

export function openSets(S) {
  const A = ensure(), st = setStatus(S), got = (S.sets && S.sets.got) || {};
  const done = st.filter(s => s.complete).length, bonus = bonusFt(S);
  A.hidden = false;
  A.innerHTML = `<div class="sheet panel" role="dialog" aria-modal="true" aria-label="Book sets"><button class="x" id="setclose" aria-label="Close">×</button>
   <h1 class="title small">Book sets</h1>
   <div class="meta">${done} of ${st.length} complete${bonus ? ` · +${bonus} ft bonus depth` : ''}</div>
   <p class="setnote">Collect every word in a set with an answer of at least ${MIN_SCORE}/100 and it pays out bonus depth.</p>
   <div class="setlist">${st.map(s => `<section class="setcard${s.complete ? ' done' : ''}">
     <div class="sethead"><h2>${esc(s.name)}</h2><span class="setprog">${s.n}/${s.total}${s.complete ? ' · +' + s.bonus + ' ft' : ''}</span></div>
     <p class="setblurb">${esc(s.blurb)}</p>
     <div class="setbar"><i style="width:${s.n / s.total * 100}%"></i></div>
     <ul class="setwords">${s.words.map(w => {
       const sc = got[w] || 0, has = sc >= MIN_SCORE;
       return `<li class="${has ? 'has' : ''}">${has ? `<i class="dot" style="background:${TIERS[tierOf(sc)].spine}"></i>` : '<i class="dot empty"></i>'}${esc(w)}</li>`;
     }).join('')}</ul></section>`).join('')}</div></div>`;
  const x = A.querySelector('#setclose');
  x.onclick = closeSets; A.onclick = e => { if (e.target === A) closeSets(); };
  x.focus({preventScroll: true});
}

/** Brief banner when a book finishes a set. */
export function toastSetsDone(sets) {
  if (!sets.length) return;
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'settoast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
  toastEl.innerHTML = sets.map(s => `<b>Set complete: ${esc(s.name)}</b> <span>+${s.bonus} ft</span>`).join('<br>');
  toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 5200);
}
