/* The Patrons book: a menu book on the home shelf. Its left page is the patron at the desk today (a bust, a greeting, the
   count of commendations); the right page is their request and an answer slip. A served request enters the Shelf as a
   book and a commendation enters the desk ledger, which is the second spread with links to the Stats (Almanac and
   Stamps) and Shelf pages. Registered in main.js as BOOK_PAGES.bPat; the logic is in core/patrons.js. */
import {pg} from './home.js';
import {BOOK_TIMING} from './bookOpenFx.js';
import {patronSVG} from './patronArt.js';
import {rgbOf,roomById} from '../core/rooms.js';
import {hashStr} from '../core/daily.js';
import {tierOf,TIERS} from '../core/tiers.js';
import {floorAtRow} from '../core/floors.js';
import {riddleJudge,riddleVerdict} from '../core/riddleJudge.js';
import {verdictFor} from '../core/verdict.js';
import {requestFor,servesWith,recordServed,commendations,commendationTotal,deskRoll,patronsOf} from '../core/patrons.js';
import {relEntry,judgeAnswer} from '../scorer/index.js';
import {Sfx} from '../feel.js';
import './patrons.css';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const pick = (list, day, salt) => list[hashStr(day + '|' + salt) % list.length];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** A spread's left page: the patron, their greeting and their record at this desk. */
function deskLeft(r, S) {
  const p = r.patron, n = commendations(S, p.id), home = roomById(p.room);
  const ask = r.served ? '' : `<blockquote class="pt-ask">${esc(r.ask)}</blockquote>`;
  return `<div class="pt-desk" style="--pt-rgb:${rgbOf(home)}">${pg.head(`The desk · ${home.short}`, p.name)}`
    + `<div class="pt-figure">${patronSVG(p)}</div>`
    + `<p class="pg-body">${esc(p.title)}. ${esc(pick(p.greet, r.day, p.id + 'g'))}</p>${ask}`
    + `<p class="pt-tally">${n ? `Commended ${plural(n, 'time', 'times')} at this desk.` : 'Has not been served here before.'}</p></div>`;
}

/** The right page while a request is open: the ask and the answer slip. */
function requestRight(r, p) {
  const rows = r.kind === 'define' ? 2 : 1, max = r.kind === 'define' ? 160 : 28;
  return `<div class="pt-req" style="--pt-rgb:${rgbOf(roomById(p.room))}">${pg.label('Your answer')}`
    + `<label class="pt-lab" for="ptAns">${r.kind === 'define' ? 'Your definition' : 'The word'}</label>`
    + `<textarea id="ptAns" class="pt-ans" rows="${rows}" maxlength="${max}" enterkeyhint="send" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" aria-describedby="ptSay"></textarea>`
    + `<div class="pt-row"><button type="button" class="bs-start pt-send" id="ptSend">Hand it over</button><span class="pt-kbd"><kbd>Enter</kbd></span></div>`
    + `<p class="pt-say" id="ptSay" aria-live="polite"></p></div>`;
}

/** The right page once served: the thanks, the entry on the Shelf, and links to the Almanac and Stamps. */
function servedRight(r, p, S) {
  const last = patronsOf(S).ledger.find(e => e.day === r.day && e.p === p.id);
  const word = last ? last.w : r.word.w;
  return `<div class="pt-req" style="--pt-rgb:${rgbOf(roomById(p.room))}">${pg.label('Served today')}`
    + `<p class="pg-body">${esc(pick(p.thanks, r.day, p.id + 't'))}</p>`
    + `<p class="pt-reward">Entered on your Shelf: <b>${esc(word)}</b>. Commended in the desk ledger.</p>`
    + `<div class="pt-links"><button type="button" class="bs-again pt-link" data-pt="stats">Stamps and Almanac</button>`
    + `<button type="button" class="bs-again pt-link" data-pt="shelf">Your Shelf</button></div>`
    + `<p class="pt-say">Back tomorrow, when the next request comes in.</p></div>`;
}

/** The right page with no request (an empty word pool). */
const quietRight = () => `<div class="pt-req">${pg.label('The desk')}<p class="pg-body">Nobody is waiting. Step into a topic room and its patron will come to the desk.</p></div>`;

/** The ledger spread: every patron's commendations, and the latest entries. */
function ledgerSpread(S) {
  const roll = deskRoll(S);
  const rows = roll.map(x => `<li><span>${esc(x.name)}</span><b>${x.count}</b></li>`).join('');
  const entries = patronsOf(S).ledger.slice(0, 6);
  const list = entries.length
    ? `<ol class="pg-list pt-entries">${entries.map(e => `<li><span><b>${esc(e.w)}</b> · ${esc(TIERS[e.t]?.name || '')}</span><small>${esc(e.day)}</small></li>`).join('')}</ol>`
    : pg.body('Nothing entered yet. The first commendation goes here.');
  return {
    l: `${pg.head('Desk ledger', 'Commendations')}<ol class="pg-list pt-roll">${rows}</ol>`
      + `<p class="pt-tally">${commendationTotal(S) ? `${plural(commendationTotal(S), 'commendation', 'commendations')} in all.` : 'No commendations yet.'}</p>`,
    r: `${pg.label('Entered')}${list}`
      + `<div class="pt-links"><button type="button" class="bs-again pt-link" data-pt="stats">Stamps and Almanac</button>`
      + `<button type="button" class="bs-again pt-link" data-pt="shelf">Your Shelf</button></div>`,
  };
}

/**
 * Registry entry for home.js BOOK_PAGES. ctx: {S, save, utc(), dailyNo(), pool() -> the active word list,
 * room() -> the active room id}.
 */
export function patronsBook(ctx) {
  const {S, save, utc, dailyNo, pool, room} = ctx;
  let api = null, busy = false, spreads = [];
  const current = () => requestFor(S, pool(), utc(), room());
  const build = () => {
    const r = current();
    if (!r) return [{l: pg.head('The desk', 'Nobody waiting'), r: quietRight()}, ledgerSpread(S)];
    return [{l: deskLeft(r, S), r: r.served ? servedRight(r, r.patron, S) : requestRight(r, r.patron)}, ledgerSpread(S)];
  };

  const say = (sp, text) => { const el = sp.querySelector('#ptSay'); if (el) el.textContent = text; };

  async function submit(sp) {
    const r = current();
    if (!r || r.served || busy) return;
    const ta = sp.querySelector('#ptAns'), text = ta ? ta.value.trim() : '';
    if (!text) { say(sp, 'Write something for them first.'); ta && ta.focus({preventScroll: true}); return; }
    busy = true;
    const btn = sp.querySelector('#ptSend'); if (btn) btn.disabled = true;
    say(sp, 'They are reading it…');
    let j;
    try { j = r.kind === 'word' ? riddleJudge(text, r.word, relEntry(r.word.w)) : await judgeAnswer(text, r.word); }
    catch (e) { console.warn('Patron judge failed:', e); j = {score: 0, empty: false}; }
    busy = false;
    const score = Math.round(Number(j.score) || 0), t = tierOf(score);
    if (j.empty || !servesWith(r.kind, score)) {
      if (btn) btn.disabled = false;
      const i = hashStr(r.day + '|m' + r.patron.id) % r.patron.miss.length;
      const why = r.kind === 'word' ? riddleVerdict(j, r.word) : verdictFor(j, t, r.word);
      say(sp, `${r.patron.miss[i]} ${why}`);
      ta && ta.focus({preventScroll: true});
      return;
    }
    const why = r.kind === 'word' ? riddleVerdict(j, r.word) : verdictFor(j, t, r.word);
    S.shelf.push({fl: floorAtRow(0).id, wid: r.word.id, w: r.word.w, pos: r.word.pos, def: r.word.def, answer: text, score, tier: t,
      mode: 'patron', patron: r.patron.id, t: Date.now(), no: dailyNo(), hints: 0, verdict: why, rows: 0, ft: 0, skipped: false});
    if (S.shelf.length > 300) S.shelf.shift();
    recordServed(S, {day: r.day, patron: r.patron, word: r.word, kind: r.kind, score, tier: t, answer: text});
    save();
    Sfx.seal && Sfx.seal();
    spreads = build();
    api.setSpreads(spreads, api.index);
  }

  function wire(sp) {
    const send = sp.querySelector('#ptSend'), ta = sp.querySelector('#ptAns');
    if (send) send.onclick = () => submit(sp);
    if (ta) {
      ta.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); submit(sp); } };
      setTimeout(() => ta.focus({preventScroll: true}), 120);
    }
    sp.querySelectorAll('.pt-link').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.pt === 'shelf' ? '#bAll' : '#bStats';
        api.close();
        setTimeout(() => document.querySelector(id)?.click(), BOOK_TIMING.shutHold + BOOK_TIMING.flyBack + 60);
      };
    });
  }

  /* read-only hook for scripts/patrons.mjs: today's request at this desk (the word it wants is in it) */
  if (typeof globalThis !== 'undefined') globalThis.__deepstackPatron = {request: () => current()};
  return {
    label: 'The Desk',
    spreads() { spreads = build(); return spreads; },
    onPaint(sp, a) { api = a; wire(sp); },
  };
}

/** Badge for the home shelf: total commendations, blank until the first. */
export const patronsBadge = S => commendationTotal(S) || '';

