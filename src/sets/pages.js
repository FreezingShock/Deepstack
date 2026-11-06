/* Set page markup without styles, so the Sets pages and the Rooms book (src/ui/roomLedger.js) share it and tests can
   import it (sets.css is pulled in by src/sets/ui.js). */
import {TIERS, tierOf} from '../core/index.js';
import {setCrest} from '../ui/sigil.js';
import {MIN_SCORE} from './sets.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
/** The set's ring as an inline image (empty string when there is no canvas, e.g. under test). */
export const crestHTML = (i, done) => { const cv = setCrest(i); return `<span class="crest${done ? ' wax' : ''}" data-set="${i}">${cv ? `<img alt="" src="${cv.toDataURL()}">` : ''}</span>`; };
/** One set's page: its crest, progress and words. `s` is a setStatus entry, `i` its index in SETS (the crest ring). */
export const setPageHTML = (s, i, got = {}) => `<div class="setpage${s.complete ? ' done' : ''}">${crestHTML(i, s.complete)}<div class="kicker">Set</div><h1>${esc(s.name)}</h1>
   <p class="note">${esc(s.blurb)}</p>
   <div class="setbar"><i style="width:${s.n / s.total * 100}%"></i></div>
   <div class="setprog">${s.n} of ${s.total} collected \u00b7 ${s.bonus} ft reward</div>
   ${s.complete ? `<span class="seal">Complete${s.doneAt && s.doneAt !== 'earlier' ? ' \u00b7 ' + esc(s.doneAt) : ''}</span>` : ''}
   <ul class="setwords">${s.words.map(w => {
     const sc = got[w] || 0, has = sc >= MIN_SCORE;
     return `<li class="${has ? 'has' : ''}">${has ? `<i class="dot" style="background:${TIERS[tierOf(sc)].spine}"></i>` : '<i class="dot empty"></i>'}${esc(w)}${has ? `<em>${sc}/100</em>` : ''}</li>`;
   }).join('')}</ul></div>`;

