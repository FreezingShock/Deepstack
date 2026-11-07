/* Richer end-of-run recap, inserted into the final sheet by main.js. */
import {TIERS} from '../core/index.js';
import {levelChangeLine} from './lexiconRank.js';
import {summarizeRun, setsTouched} from '../core/recap.js';
import {setStatus} from '../sets/sets.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export function recapHTML(d, S) {
  const r = summarizeRun(d), books = d.books || [];
  const tiles = [
    ['Answered', `${r.answered}/${r.total}`],
    r.top ? ['Best book', esc(r.top.w), `${r.top.score} closeness`] : null,
    r.bestCombo >= 2 ? ['Best combo', `${r.bestCombo} in a row`, `+${r.comboFt} ft`] : ['Combo', 'none'],
    r.setFt ? ['Set bonus', `+${r.setFt} ft`] : null,
    r.hints ? ['Hints used', r.hints] : null,
    r.skipped ? ['Skipped', r.skipped] : null
  ].filter(Boolean);
  const sets = setsTouched(books, setStatus(S));
  return `<div class="recap">
   <div class="rtiles">${tiles.map(([k, v, sub]) => `<div class="rtile"><small>${k}</small><b>${v}</b>${sub ? `<i>${sub}</i>` : ''}</div>`).join('')}</div>
   <ol class="rbooks" aria-label="Books from this run">${books.map((b, i) => {
     const T = TIERS[b.tier], skip = b.answer === '' && b.score === 0;
     return `<li><button class="rbook" data-i="${i}" aria-label="Open ${esc(b.w)}"><i class="dot" style="background:${T.spine}"></i><span class="rw">${esc(b.w)}</span><span class="rt">${skip ? 'Skipped' : T.name}</span><span class="rs">${skip ? '–' : b.score}</span><span class="rf">+${b.ft || 0} ft</span><span class="rm">${b.combo ? `×${Math.round(b.combo.mult * 100) / 100}` : ''}</span></button></li>`;
   }).join('')}</ol>
   ${sets.length ? `<div class="rsets"><small>Set progress</small>${sets.map(s => `<div class="rset${s.complete ? ' done' : ''}"><span>${esc(s.name)}</span><span class="setbar"><i style="width:${s.n / s.total * 100}%"></i></span><span>${s.n}/${s.total}</span></div>`).join('')}</div>` : ''}
  </div>`;
}

// Display-only share note: keeps the bar line and each "Tier \u00b7" pair unbroken. Text content is identical to the copied text.
function shareHTML(txt) {
  const L = txt.split('\n'), n = L.length;
  if (n < 2) return esc(txt);
  L[n - 2] = `<span class="nb">${esc(L[n - 2])}</span>`;
  L[n - 1] = L[n - 1].split(' \u00b7 ').map((t, i, a) => `<span class="nb">${esc(t)}${i < a.length - 1 ? ' \u00b7' : ''}</span>`).join(' ');
  return L.slice(0, n - 2).map(esc).concat(L.slice(n - 2)).join('\n');
}

// The whole results sheet. Hierarchy: kicker, title, depth (the hero), one line of run facts,
// the shelf of books, stat cards, the word list, the torn share note, then the buttons.
export function finalHTML(d, S, o) {
  const kicker = d.mode === 'riddle' ? (d.day ? 'Daily Riddle No. ' + o.dayNo : 'Riddle') : d.mode === 'unlimited' ? (d.placing ? 'Placement' : 'Unlimited') : d.practice ? 'Practice run' : 'Daily No. ' + o.no;
  const lex = d.mode === 'riddle' ? `<span>Solved <b>${d.solved}</b> of ${d.of}</span>` : d.mode === 'unlimited' ? `<span>Lexicon <b>${d.lex}</b>${d.placing ? '' : ` (${d.lex >= d.lex0 ? '+' : '\u2212'}${Math.abs(d.lex - d.lex0)})`} \u00b7 ${esc(o.levelTitle(d.lex / 10))}</span>` : '';
  return `<div class="sheet fin">
  <div class="fhead"><p class="fkick">${kicker}</p>
  <h1 class="title ftitle">Descent complete</h1></div>
  <div class="fleft"><div class="bigd"><span id="cnt">0</span><small>ft deep</small></div>
  <p class="fsub">${o.floorName ? `<span>Reached <b>${esc(o.floorName)}</b></span>` : ''}<span>Average <b>${d.avg}</b></span><span>Rarest <b>${esc(o.rarest)}</b></span>${lex}</p>${levelChangeLine(d)?`<p class="lx-change">${esc(levelChangeLine(d))}</p>`:''}
  <div class="spineimgs" id="sp">${o.spines}</div></div>
  <div class="fright">${recapHTML(d, S)}
  <div class="slipwrap fslip"><i class="pin"></i><div class="slip"><pre class="share pe" id="shr">${shareHTML(o.txt)}</pre></div></div>${o.share ? '<button class="linkbtn" id="spic">Save image</button>' : ''}</div>
  <div class="row">${o.share ? '<button class="btn pri" id="sh">Share</button><button class="btn" id="cp">Copy result</button>' : '<button class="btn pri" id="cp">Copy result</button>'}<button class="btn" id="up">Back to the surface</button></div></div>`;
}

export function bindRecap(root, books, openCard) {
  root.querySelectorAll('.rbook').forEach(b => { b.onclick = () => openCard(books[+b.dataset.i], {fresh: false}); });
}
