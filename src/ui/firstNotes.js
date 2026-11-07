/* First-time margin notes: one pencilled line the first time each thing matters in a run, then never again.
   They land on the hint strip under the answer slip (the same parchment the hints use), so they cost no new layout.
   Each note is flagged in `S.seen.<key>` (an additive field; a save without it is read as "nothing seen yet").
   Pure helpers plus one DOM call; styles in firstNotes.css. */

/* One line each. Plain words, no spelling, no numbers that could go stale. */
export const NOTE_TEXT = {
 slip: 'Explain it, then send.',
 candle: 'Candle low: your words are sent.',
 hint: 'Hints after this cost depth.',
};

/* The home screen's first-visit lines: one new line per home visit, in this order, until each has been shown once.
   They are pinned under the Descend plaque, so they explain the three ways in (Daily, Unlimited, the side doors, the Room Ledger). */
export const HOME_NOTES = [
 ['home.daily', 'Daily is seven words for everyone.'],
 ['home.unlimited', 'Unlimited: words matched to your rank.'],
 ['home.doors', 'Side doors open the topic rooms.'],
 ['home.ledger', 'Room Ledger: words met, per room.'],
];
const HOME_TEXT = Object.fromEntries(HOME_NOTES);

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/** The seen flags, tolerant of a save that predates them. */
export const seenOf = S => (S && S.seen && typeof S.seen === 'object' && !Array.isArray(S.seen)) ? S.seen : {};

/** True when this key has a line to show and the player has never been shown it. */
const textOf = key => (Object.prototype.hasOwnProperty.call(NOTE_TEXT, key) ? NOTE_TEXT[key] : Object.prototype.hasOwnProperty.call(HOME_TEXT, key) ? HOME_TEXT[key] : '');

export const noteDue = (S, key) => !!textOf(key) && !seenOf(S)[key];

/** Rubs out a pencilled note of one key, e.g. the slip note once the player starts writing (it no longer helps, and it takes room on a phone). */
export function clearFirstNote(key, root = globalThis.document) {
 if (!root || typeof root.querySelectorAll !== 'function') return 0;
 const gone = root.querySelectorAll(`#hl .fnote[data-note="${key}"]`);
 gone.forEach(n => n.remove());
 return gone.length;
}

/** The markup for one note; it sits inside #hl with the hint slips. */
export const firstNoteHTML = key => `<div class="hslip fnote" data-note="${esc(key)}" role="note">${esc(textOf(key))}</div>`;

/** Shows the note if it is due: flags it seen (saved at once, so a reload never repeats it), then adds it to the hint strip.
 *  Returns true when a note was written. `root` is the document or the run's stage. */
export function showFirstNote(S, key, save, root = globalThis.document) {
 if (!noteDue(S, key) || !root) return false;
 const hl = root.querySelector('#hl');
 if (!hl) return false; // no strip on screen: nothing was shown, so nothing is flagged
 S.seen = {...seenOf(S), [key]: 1};
 if (typeof save === 'function') save();
 /* one pencilled aside at a time: the newest replaces the last, so the strip never stacks three lines */
 if (typeof hl.querySelectorAll === 'function') hl.querySelectorAll('.fnote').forEach(n => n.remove());
 hl.insertAdjacentHTML('beforeend', firstNoteHTML(key));
 const raf = globalThis.requestAnimationFrame || (f => setTimeout(f, 0));
 raf(() => hl.classList.add('on'));
 return true;
}

/** The next home line this player has not seen, or null once all are seen. */
export const nextHomeNote = S => {
 const seen = seenOf(S);
 const hit = HOME_NOTES.find(([k]) => !seen[k]);
 return hit ? hit[0] : null;
};

/** Pins the next home line under the Descend plaque (the plaque section is the positioned host). Flags it seen and saves first.
 *  Returns the key shown, or null. */
export function showHomeNote(S, save, root = globalThis.document) {
 const key = nextHomeNote(S);
 if (!key || !root || typeof root.querySelector !== 'function') return null;
 /* on phones the plaque's band is full (Shelf and the Daily books sit under it), so the line goes under the tagline instead */
 const phone = !!(globalThis.innerWidth && globalThis.innerWidth <= 640);
 const host = root.querySelector(phone ? '.hz-title' : '.hz-plaque');
 if (!host) return null;
 host.querySelectorAll('.fnote-home').forEach(n => n.remove());
 S.seen = {...seenOf(S), [key]: 1};
 if (typeof save === 'function') save();
 host.insertAdjacentHTML('beforeend', `<div class="fnote-home" data-note="${esc(key)}" role="note">${esc(textOf(key))}</div>`);
 /* sit just under the "Daily No." line, so the plaque's own text is never covered (measured: a fixed offset hid the Shelf book at 375) */
 const tag = host.querySelector(host.classList.contains('hz-title') ? '.tagline' : '.daily-tag, .next'), note = host.querySelector('.fnote-home:last-of-type') || host.lastElementChild;
 if (tag && note && typeof tag.getBoundingClientRect === 'function') {
  const hb = host.getBoundingClientRect(), tb = tag.getBoundingClientRect();
  if (tb.height) note.style.top = Math.round(tb.bottom - hb.top + 3) + 'px';
 }
 return key;
}
