/* The Restoration bench: a full-screen manuscript page from the room you are in. Opened from the entry on the home screen
   (src/restore/entry.js). Rendering uses event delegation on one root, and the page repaints only the parts that changed,
   so the sheet's water stain can glide back while the restored entry comes up in ink. Pure rules live in pages.js. */
import {S, save, WORDS, wordsReady, utc} from '../app/state.js';
import {judgeAnswer, prepareWords} from '../scorer/index.js';
import {Sfx} from '../feel.js';
import {currentRoom} from '../core/roomStore.js';
import {roomById} from '../core/rooms.js';
import {fullPool} from '../core/roomPool.js';
import {toastStamps} from '../ui/stampToast.js';
import {currentPage, pinToWall, restoreOf, rewardRestored, saveProgress} from './store.js';
import {applyScore, applyWord, giveLetter, leaveFaded, pageComplete, pageDamage, smudgedShown} from './pages.js';
import {passageHTML, sheetHTML, wallHTML, footHTML, roomName, pageNo, esc} from './markup.js';
import './restore.css';

let root = null, page = null, room = null, view = 'bench', busy = false, opener = null;

/** The full word object for a passage (the judge needs its concepts), from the room's pool or the whole list. */
const wordObj = w => WORDS.find(x => x.w === w) || fullPool().find(x => x.w === w) || null;

function shellHTML(body) {
  const n = restoreOf(S).wall.length;
  const title = view === 'wall' ? 'The wall' : roomName(room || currentRoom(S));
  const no = view === 'bench' && page ? `<span class="rs-no">${esc(pageNo(page))}</span>` : '';
  return `<div class="rs-stage">
    <header class="rs-top">
      <div class="rs-title"><span class="rs-kicker">Restoration bench</span><h2>${esc(title)} ${no}</h2></div>
      <div class="rs-actions">
        ${view === 'wall' ? '<button class="rs-btn" type="button" data-act="bench">Back to the bench</button>' : `<button class="rs-btn" type="button" data-act="wall">The wall (${n})</button>`}
        <button class="rs-btn quiet" type="button" data-act="close" aria-label="Close the bench">Close</button>
      </div>
    </header>
    ${body}
  </div>`;
}

/* ---------- painting ---------- */
function full(body) {
  root.innerHTML = shellHTML(body);
}

function paint(freshI = -1) {
  if (!root) return;
  if (view === 'wall') return full(wallHTML(restoreOf(S).wall));
  if (!page) return full('<div class="rs-empty"><p>This room has no words to print a page from yet. Try another room.</p></div>');
  const sheet = root.querySelector('.rs-sheet');
  if (!sheet || sheet.dataset.page !== page.id) return full(sheetHTML(page, freshI));
  sheet.style.setProperty('--damage', pageDamage(page).toFixed(3));
  sheet.classList.toggle('done', pageComplete(page));
  sheet.querySelector('.rs-pages').innerHTML = page.passages.map((p, i) => passageHTML(p, i, i === freshI)).join('');
  sheet.querySelector('.rs-foot').innerHTML = footHTML(page);
  const wb = root.querySelector('[data-act=wall]');
  if (wb) wb.textContent = `The wall (${restoreOf(S).wall.length})`;
  root.querySelector('.rs-no') && (root.querySelector('.rs-no').textContent = pageNo(page));
}

const msgOf = i => root && root.querySelector(`.rs-p[data-i="${i}"] .rs-msg`);
const say = (i, text) => { const m = msgOf(i); if (m) m.textContent = text; };
function shake(i) {
  const el = root && root.querySelector(`.rs-p[data-i="${i}"]`);
  if (!el) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}
/** Focus the first entry still waiting for ink. */
function focusNext() {
  const el = root && root.querySelector('.rs-p:not(.done) .rs-in');
  if (el) el.focus({preventScroll: true});
}

/* ---------- actions ---------- */
function settle(i, restored) {
  const complete = pageComplete(page);
  if (complete) pinToWall(S, page); else saveProgress(S, page);
  // a restored entry counts as met for its room; a finished page can earn the wax seal (MR3, MR4)
  const fresh = restored ? rewardRestored(S, page.passages[i], utc()) : [];
  save();
  if (restored) { if (complete) Sfx.seal && Sfx.seal(); else Sfx.flip && Sfx.flip(); }
  toastStamps(fresh);
  paint(restored ? i : -1);
  focusNext();
}

async function judgeFaded(i, text) {
  const p = page.passages[i];
  const w = wordObj(p.w);
  if (!w) return say(i, 'The librarian cannot find that entry in this room. Try another page.');
  busy = true;
  const pg = page, form = root.querySelector(`form[data-i="${i}"]`);
  form && form.classList.add('busy');
  say(i, 'Reading your definition…');
  let score = 0;
  try { score = (await judgeAnswer(text, w)).score; } catch (e) { score = 0; } // practice-style: the quick judge if the full one is still loading (the bench has no timer)
  busy = false;
  if (!root || page !== pg) return; // the bench was closed while the librarian read the answer
  form && form.classList.remove('busy');
  if (applyScore(p, score)) return settle(i, true);
  saveProgress(S, page); save();
  say(i, 'Only faint ink came back. Say more about what it means.');
  shake(i);
  Sfx.clunk && Sfx.clunk();
}

function writeWord(i, text) {
  const p = page.passages[i];
  if (!text.trim()) return shake(i);
  if (applyWord(p, text)) return settle(i, true);
  saveProgress(S, page); save();
  say(i, 'The ink runs. That is not the word.');
  shake(i);
  Sfx.clunk && Sfx.clunk();
}

function nextPage() {
  page = currentPage(S, room, WORDS, utc());
  save();
  view = 'bench';
  if (page) prepareWords(page.passages.map(p => wordObj(p.w)).filter(Boolean)).catch(() => {});
  paint();
}

function act(name, i) {
  if (busy && name !== 'close') return;
  if (name === 'close') return close();
  if (name === 'wall') { view = 'wall'; return paint(); }
  if (name === 'bench') { view = 'bench'; return paint(); }
  if (name === 'next') return nextPage();
  if (name === 'letter') {
    if (!giveLetter(page.passages[i])) return;
    saveProgress(S, page); save();
    return paint();
  }
  if (name === 'leave') {
    leaveFaded(page.passages[i]);
    return settle(i, false);
  }
}

function close() {
  if (!root) return;
  document.removeEventListener('keydown', onKey);
  root.classList.remove('on');
  const r = root;
  root = null; page = null; view = 'bench'; busy = false;
  setTimeout(() => r.remove(), 320);
  if (opener && opener.isConnected) opener.focus({preventScroll: true});
  opener = null;
  save();
  const entry = document.querySelector('.rs-entry');
  if (entry) { const n = restoreOf(S).wall.length; entry.querySelector('.rs-entry-v')?.remove(); if (n) entry.insertAdjacentHTML('beforeend', `<span class="rs-entry-v">${n} on the wall</span>`); }
}

function onKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); close(); }
}

/** Opens the bench for the current room: resumes its page in progress, or prints a new one. */
export async function openRestore(from) {
  if (root) return;
  await wordsReady;
  opener = from || null;
  room = currentRoom(S);
  page = currentPage(S, room, WORDS, utc());
  save();
  if (page) prepareWords(page.passages.map(p => wordObj(p.w)).filter(Boolean)).catch(() => {});
  view = 'bench';
  root = document.createElement('div');
  root.className = 'rs-bench';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Restoration bench');
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || !root || !root.contains(b) || b.disabled) return;
    act(b.dataset.act, +b.dataset.i);
  });
  root.addEventListener('submit', e => {
    const f = e.target.closest('form[data-i]');
    if (!f || !page || busy) return;
    e.preventDefault();
    const i = +f.dataset.i, p = page.passages[i];
    if (!p || p.done) return;
    if (p.kind === 'smudged') return writeWord(i, f.querySelector('input').value);
    const text = f.querySelector('textarea').value.trim();
    if (!text) return shake(i);
    judgeFaded(i, text);
  });
  document.body.append(root);
  document.addEventListener('keydown', onKey);
  paint();
  requestAnimationFrame(() => root && root.classList.add('on'));
  focusNext();
}
