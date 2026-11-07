/* First-time notes: one short line the first time each thing matters, then never again.
   Each note lights the thing it is about (a lamp-gold halo over its target) and puts a small themed panel beside it.
   The panel is one of four objects (brass plate, pinned card, ribbon tag, wax seal), so the notes vary and none of them
   is ruled paper. A note fades by itself after a few seconds and never takes a tap (pointer-events: none).
   Each note is flagged in `S.seen.<key>` (an additive field; a save without it is read as "nothing seen yet"),
   and the flag is saved before the note is shown. Notes whose target is not on screen are not flagged, so they wait.
   Pure helpers plus a few DOM calls; styles in firstNotes.css. */

/* One line each. Plain words, no spelling, no numbers that could go stale. */
export const NOTE_TEXT = {
 slip: 'Explain it, then send.',
 candle: 'Candle low: your words are sent.',
 hint: 'Hints after this cost depth.',
};

/* The home screen's first-visit lines: one new line per home visit, in this order, until each has been shown once.
   They explain the three ways in (Daily, Unlimited, the side doors, the Room Ledger). */
export const HOME_NOTES = [
 ['home.daily', 'Daily is seven words for everyone.'],
 ['home.unlimited', 'Unlimited: words matched to your rank.'],
 ['home.doors', 'Side doors open the topic rooms.'],
 ['home.ledger', 'Room Ledger: words met, per room.'],
];
const HOME_TEXT = Object.fromEntries(HOME_NOTES);

/* What each note lights. The first match on screen wins; a note with no target on screen is not shown. */
export const NOTE_TARGET = {
 slip: '#fld',
 candle: '#candle',
 hint: '#hint',
 'home.daily': '#bPlay',
 'home.unlimited': '#bUnl',
 'home.doors': '.rm-door',
 'home.ledger': '#bRooms',
};

/* Which object holds each note. Varied on purpose: a plate, a pinned card, a ribbon tag, a wax seal. */
export const NOTE_LOOK = {
 slip: 'plate',
 candle: 'card',
 hint: 'tag',
 'home.daily': 'seal',
 'home.unlimited': 'plate',
 'home.doors': 'card',
 'home.ledger': 'tag',
};

/* How long a note stays up before it fades away on its own (ms). */
export const NOTE_LIFE_MS = 9000;

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/** The seen flags, tolerant of a save that predates them. */
export const seenOf = S => (S && S.seen && typeof S.seen === 'object' && !Array.isArray(S.seen)) ? S.seen : {};

const textOf = key => (Object.prototype.hasOwnProperty.call(NOTE_TEXT, key) ? NOTE_TEXT[key] : Object.prototype.hasOwnProperty.call(HOME_TEXT, key) ? HOME_TEXT[key] : '');

/** True when this key has a line to show and the player has never been shown it. */
export const noteDue = (S, key) => !!textOf(key) && !seenOf(S)[key];

/** Where a panel of size w x h goes beside a target rect (viewport coordinates), kept inside the window with an 8px margin.
 *  Wide windows: to the right of the target, or the left if there is no room. Phones: below the target, or above it
 *  (above first when phoneAbove is set, so a home note never covers the Daily line under the Descend button). */
export function calloutBox(tr, w, h, vw, vh, phoneAbove = false) {
 const m = 8, gap = 14;
 let left, top;
 if (vw > 640) {
  left = tr.right + gap + w <= vw - m ? tr.right + gap : tr.left - gap - w;
  top = tr.top + tr.height / 2 - h / 2;
 } else {
  const below = tr.bottom + 12 + h <= vh - m, above = tr.top - 12 - h >= m;
  top = (phoneAbove && above) || !below ? tr.top - 12 - h : tr.bottom + 12;
  left = tr.left + tr.width / 2 - w / 2;
 }
 left = Math.max(m, Math.min(vw - w - m, left));
 top = Math.max(m, Math.min(vh - h - m, top));
 return {left: Math.round(left), top: Math.round(top)};
}

/** The element a note lights, or null when it is not on screen (no size, or entirely outside the window). */
export function targetOf(key, root = globalThis.document) {
 const sel = NOTE_TARGET[key];
 if (!sel || !root || typeof root.querySelector !== 'function') return null;
 const el = root.querySelector(sel);
 if (!el || typeof el.getBoundingClientRect !== 'function') return null;
 const r = el.getBoundingClientRect(), vw = globalThis.innerWidth || 0, vh = globalThis.innerHeight || 0;
 if (!(r.width > 0 && r.height > 0)) return null;
 if (vw && (r.right < 0 || r.left > vw)) return null;
 if (vh && (r.bottom < 0 || r.top > vh)) return null;
 return el;
}

/** Rubs out a note of one key (its halo and its panel), e.g. the slip note once the player starts writing. Returns how many went. */
export function clearFirstNote(key, root = globalThis.document) {
 if (!root || typeof root.querySelectorAll !== 'function') return 0;
 const gone = root.querySelectorAll(`.fcall[data-note="${key}"], .fhalo[data-note="${key}"]`);
 gone.forEach(n => n.remove());
 return gone.length;
}

/** Puts the halo and the panel for one note on screen. The panel is positioned from the target's rect.
 *  Any note already up is taken down first (one aside at a time). Returns the panel, or null when there is no document. */
export function mountNote(key, target, doc = globalThis.document) {
 if (!doc || !doc.body || !target || typeof target.getBoundingClientRect !== 'function') return null;
 doc.querySelectorAll('.fcall, .fhalo').forEach(n => n.remove());
 const tr = target.getBoundingClientRect();
 const halo = doc.createElement('div');
 halo.className = 'fhalo';
 halo.dataset.note = key;
 halo.setAttribute('aria-hidden', 'true');
 Object.assign(halo.style, {left: (tr.left - 5) + 'px', top: (tr.top - 5) + 'px', width: (tr.width + 10) + 'px', height: (tr.height + 10) + 'px'});
 const panel = doc.createElement('div');
 panel.className = `fcall fcall-${NOTE_LOOK[key] || 'plate'}`;
 panel.dataset.note = key;
 panel.setAttribute('role', 'note');
 panel.textContent = textOf(key);
 doc.body.appendChild(halo);
 doc.body.appendChild(panel);
 const vw = globalThis.innerWidth || 0, vh = globalThis.innerHeight || 0;
 const w = panel.offsetWidth || 200, h = panel.offsetHeight || 40;
 const at = calloutBox(tr, w, h, vw || w + 16, vh || h + 16, key.startsWith('home.'));
 panel.style.left = at.left + 'px';
 panel.style.top = at.top + 'px';
 const life = globalThis.setTimeout;
 if (typeof life === 'function') {
  const fade = life(() => {
   panel.classList.add('out');
   halo.classList.add('out');
   const gone = life(() => { panel.remove(); halo.remove(); }, 400);
   if (gone && gone.unref) gone.unref();
  }, NOTE_LIFE_MS);
  if (fade && fade.unref) fade.unref(); // a pending fade never holds a Node process open (tests)
 }
 return panel;
}

/** Shows the note if it is due and its target is on screen: flags it seen (saved at once, so a reload never repeats it), then lights it.
 *  Returns true when a note was shown. `root` is the document or the run's stage. */
export function showFirstNote(S, key, save, root = globalThis.document) {
 if (!noteDue(S, key) || !root) return false;
 const target = targetOf(key, root);
 if (!target) return false; // not on screen: nothing was shown, so nothing is flagged
 const doc = root.ownerDocument || globalThis.document;
 if (!mountNote(key, target, doc)) return false;
 S.seen = {...seenOf(S), [key]: 1};
 if (typeof save === 'function') save();
 return true;
}

/** The next home line this player has not seen, or null once all are seen. */
export const nextHomeNote = S => {
 const seen = seenOf(S);
 const hit = HOME_NOTES.find(([k]) => !seen[k]);
 return hit ? hit[0] : null;
};

/** Lights the next home line whose target is on screen (the Daily book, Unlimited, a side door or the Ledger). A line with no
 *  target on screen waits for a visit where it is there. Flags it seen and saves first. Returns the key shown, or null. */
export function showHomeNote(S, save, root = globalThis.document) {
 if (!root || typeof root.querySelector !== 'function') return null;
 const seen = seenOf(S);
 for (const [key] of HOME_NOTES) {
  if (seen[key]) continue;
  const target = targetOf(key, root);
  if (!target) continue;
  const doc = root.ownerDocument || globalThis.document;
  if (!mountNote(key, target, doc)) return null;
  S.seen = {...seenOf(S), [key]: 1};
  if (typeof save === 'function') save();
  return key;
 }
 return null;
}

/** Takes down every note on screen, its halo and its panel. A note is about the thing it lights, so once the player acts
 *  (opens a book, a card or a room) the note goes, rather than sitting over the new screen. Returns how many went. */
export function clearAllNotes(root = globalThis.document) {
 if (!root || typeof root.querySelectorAll !== 'function') return 0;
 const gone = root.querySelectorAll('.fcall, .fhalo');
 gone.forEach(n => n.remove());
 return gone.length;
}

/** Installs the click listener once: any click (or Enter on a button, which also clicks) clears the notes before its handler runs. */
export function initNoteClear(doc = globalThis.document) {
 if (!doc || typeof doc.addEventListener !== 'function' || doc.__noteClear) return false;
 doc.__noteClear = true;
 doc.addEventListener('click', () => clearAllNotes(doc), true);
 return true;
}
