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

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/** The seen flags, tolerant of a save that predates them. */
export const seenOf = S => (S && S.seen && typeof S.seen === 'object' && !Array.isArray(S.seen)) ? S.seen : {};

/** True when this key has a line to show and the player has never been shown it. */
export const noteDue = (S, key) => Object.prototype.hasOwnProperty.call(NOTE_TEXT, key) && !seenOf(S)[key];

/** Rubs out a pencilled note of one key, e.g. the slip note once the player starts writing (it no longer helps, and it takes room on a phone). */
export function clearFirstNote(key, root = globalThis.document) {
 if (!root || typeof root.querySelectorAll !== 'function') return 0;
 const gone = root.querySelectorAll(`#hl .fnote[data-note="${key}"]`);
 gone.forEach(n => n.remove());
 return gone.length;
}

/** The markup for one note; it sits inside #hl with the hint slips. */
export const firstNoteHTML = key => `<div class="hslip fnote" data-note="${esc(key)}" role="note">${esc(NOTE_TEXT[key])}</div>`;

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
