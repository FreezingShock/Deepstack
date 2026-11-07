/* Shows the problem plaques (stateCopy.js) for whatever is open in src/core/stateEvents.js. One at a time, the oldest first.
   A plaque stays until the player closes it or the problem clears; closing it keeps it shut until the problem clears
   (a failing save reports again on every write, which must not bring it back). Try again runs the entry's retry and
   keeps the plaque up while it is still failing. The DOM part is small; the copy and markup are pure. */
import {onState} from '../core/stateEvents.js';
import {noticeHTML} from './stateCopy.js';

let el = null, shownKind = null, timer = 0;
const closed = new Set();
const queue = []; // open kinds in the order they were reported

function ensureEl() {
  if (el || typeof document === 'undefined') return el;
  el = document.createElement('div');
  el.id = 'statenotice';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-sn]');
    if (!b) return;
    if (b.dataset.sn === 'close') return hide(true);
    if (b.dataset.sn === 'retry') retry(b);
  });
  return el;
}

function show(entry) {
  ensureEl();
  shownKind = entry.kind;
  el.innerHTML = noticeHTML(entry.kind);
  const stamp = document.getElementById('stamptoast');
  el.style.top = stamp && stamp.classList.contains('on') ? '112px' : '';
  el.classList.remove('on');
  void el.offsetWidth; // restart the drop when a new problem replaces an old one
  el.classList.add('on');
}

function hide(byPlayer) {
  if (!el) return;
  if (byPlayer && shownKind) closed.add(shownKind);
  el.classList.remove('on');
  shownKind = null;
  clearTimeout(timer);
  timer = setTimeout(next, 260); // after the plaque has slid away
}

function next() {
  const k = queue.find(e => !closed.has(e.kind));
  if (k) show(k); else if (el) el.classList.remove('on');
}

function retry(btn) {
  const entry = queue.find(e => e.kind === shownKind);
  if (!entry || typeof entry.retry !== 'function') return hide(true);
  btn.disabled = true;
  Promise.resolve()
    .then(() => entry.retry())
    .catch(() => {})
    .finally(() => { if (btn.isConnected) btn.disabled = false; });
}

onState(entry => {
  const i = queue.findIndex(e => e.kind === entry.kind);
  if (entry.cleared) {
    if (i >= 0) queue.splice(i, 1);
    closed.delete(entry.kind);
    if (shownKind === entry.kind) hide(false);
    else if (!shownKind) next();
    return;
  }
  if (i >= 0) queue[i] = entry; else queue.push(entry);
  if (!shownKind && !closed.has(entry.kind)) show(entry); // a plaque already up stays put, even when its problem is reported again
});
