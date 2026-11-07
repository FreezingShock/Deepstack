/* Patrons: visitors who come to the library desk with one word they need. Each topic room has its own patron (the
   Archivist in the Chronicle, the Apothecary in the Observatory, and so on). In the Reading Room the desk is taken by
   whichever patron the day chooses. A patron asks in one of two ways:
     word    "I need a word meaning ..." (the definition is the clue; you write the word, judged like the Riddle Shelf)
     define  "What does ... mean?" (the word is named; you define it, judged like the Daily)
   Serving a request adds the word to the Shelf as a book and writes a commendation into the desk ledger. Patrons
   remember you: S.patrons.served counts their commendations and S.patrons.used keeps recent words from coming back.
   Everything is derived from the day and the word pool, so the same patron asks the same word all day, and the save
   stores only what has happened (additive field S.patrons, tidied on read). Pure: no DOM, no storage. */
import {HALL, ROOMS} from './rooms.js';
import {hashStr} from './daily.js';

export const WORD_PASS = 58;   // riddle score at which a patron takes the word (a synonym or better: src/core/riddleJudge.js)
export const DEFINE_PASS = 46; // full-judge score for a definition (Folio, src/core/tiers.js)
export const USED_CAP = 200;   // recent words kept so a patron does not ask for the same one soon
export const LEDGER_CAP = 60;  // commendations kept in the desk ledger

/* The six patrons. `room` is the topic room they wait in; `hat` picks the silhouette in patronArt.js. */
export const PATRONS = [
  {id: 'archivist', room: 'history', name: 'The Archivist', title: 'keeps the county’s old papers', hat: 'wig',
   greet: ['Sit down, the ink is still wet.', 'The register has a gap in it, and I want it filled.', 'Every date in this room was once a stranger.'],
   thanks: ['Entered. The register is a little less empty.', 'That will go in the bound volume. Thank you.', 'Filed under the right reign. Good.'],
   miss: ['That is the wrong reign. Try again.', 'Close to the date, not the meaning.', 'No. The record says something else.']},
  {id: 'clerk', room: 'math', name: 'The Clerk of Sums', title: 'checks every column twice', hat: 'visor',
   greet: ['Don’t speak, I am carrying a one.', 'I have a figure with no name. Give me the word.', 'The books balance only if you find it.'],
   thanks: ['Balanced. Put it on the shelf.', 'Two columns agree at last.', 'The sum is right. Good work.'],
   miss: ['The column does not add up that way.', 'Near, but the figure is off.', 'Recount. That is not the term.']},
  {id: 'apothecary', room: 'science', name: 'The Apothecary', title: 'sells remedies by the drachm', hat: 'spectacles',
   greet: ['Mind the jars. Now, what do you call this?', 'A customer asked for it by name, and I forgot it.', 'Measure carefully. Nature is exact.'],
   thanks: ['Dispensed. The customer is grateful.', 'Labelled and shelved. That is the right term.', 'A remedy for my memory. Thank you.'],
   miss: ['The jar says otherwise.', 'Not quite the active ingredient.', 'That would poison somebody. Try again.']},
  {id: 'bookbinder', room: 'english', name: 'The Bookbinder', title: 'sews every spine by hand', hat: 'cap',
   greet: ['Hold the page flat, please.', 'I am binding a dictionary and one entry is missing.', 'Every word needs its own stitch.'],
   thanks: ['Stitched in. The spine holds.', 'That is the word for the title page.', 'Pressed flat and tidy. Thank you.'],
   miss: ['That word would split the spine.', 'The stitch is loose. Try once more.', 'Not that one. Look at the sentence again.']},
  {id: 'varnisher', room: 'art', name: 'The Varnisher', title: 'cleans old paintings for the Gallery', hat: 'beret',
   greet: ['Don’t breathe on the canvas.', 'The critic wants a word for a painting he cannot name.', 'Say what the picture means, and I will hang it.'],
   thanks: ['Varnished and hung. Lovely.', 'That is exactly how the critic would say it.', 'The gallery is pleased. So am I.'],
   miss: ['The varnish would cloud that.', 'Not the picture I was asked about.', 'Look closer. That is not the word.']},
  {id: 'trainer', room: 'body', name: 'The Trainer', title: 'coaches the Anatomy Theatre’s teams', hat: 'crop',
   greet: ['Stretch first. Now the word.', 'The team needs a term for the drill, and nobody knows it.', 'Every player needs the right name for the move.'],
   thanks: ['Good. The team runs it tomorrow.', 'That is the term in the playbook now.', 'Whistle blown. Well played.'],
   miss: ['Off-side. Try the term again.', 'That is a different move entirely.', 'Not the drill. Think of the body first.']},
];

/** The patron who sits at the desk in a room: the room’s own patron, or the day’s pick in the Reading Room. */
export function patronFor(room, day = '') {
  const own = PATRONS.find(p => p.room === room);
  if (own) return own;
  return PATRONS[hashStr('desk|' + day) % PATRONS.length];
}

/** The first clause of a definition, lower-cased and short enough to read as a request. */
export function gistOf(def) {
  const c = String(def || '').split(/;\s*/)[0].replace(/\.$/, '').trim();
  if (!c || c.length > 120) return '';
  return c.charAt(0).toLowerCase() + c.slice(1);
}

/** A definition can give its own word away ("Ferrous: containing iron"). Such words are never asked for. */
const givesAway = w => {
  const word = String(w.w).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^a-z])' + word + '([^a-z]|$)', 'i').test(String(w.def || ''));
};

/** The save's patron fields, tolerating a missing or damaged object. */
export function patronsOf(S) {
  const p = S && S.patrons && typeof S.patrons === 'object' && !Array.isArray(S.patrons) ? S.patrons : {};
  return {
    served: p.served && typeof p.served === 'object' && !Array.isArray(p.served) ? p.served : {},
    last: p.last && typeof p.last === 'object' && !Array.isArray(p.last) ? p.last : {},
    used: Array.isArray(p.used) ? p.used.filter(x => Number.isFinite(x)).slice(-USED_CAP) : [],
    ledger: Array.isArray(p.ledger) ? p.ledger.filter(e => e && typeof e === 'object').slice(0, LEDGER_CAP) : [],
  };
}

/** Which kind of request a patron makes on a day: two in three ask for a word, one in three asks for a definition. */
export const kindFor = (p, day) => (hashStr(day + '|kind|' + p.id) % 3 === 0 ? 'define' : 'word');

/**
 * Today's request for a patron, from the active word pool. Deterministic for a day, so the desk does not change when
 * the player reloads. Returns null when the pool has no usable word.
 * @returns {{patron, day, kind, word, ask, served: boolean}|null}
 */
export function requestFor(S, pool, day, room = HALL) {
  const p = patronFor(room, day);
  const book = patronsOf(S);
  const used = new Set(book.used);
  const usable = (pool || []).filter(w => w && w.w && w.def && !givesAway(w));
  if (!usable.length) return null;
  const fresh = usable.filter(w => !used.has(w.id));
  const list = fresh.length ? fresh : usable;
  const word = list[hashStr(day + '|' + p.id) % list.length];
  const kind = kindFor(p, day);
  const ask = kind === 'word'
    ? `I need a word meaning ${gistOf(word.def) || 'the thing described here'}.`
    : `What does “${word.w}” mean? Tell me in your own words.`;
  return {patron: p, day, kind, word, ask, served: book.last[p.id] === day};
}

/** Did an answer satisfy the patron? A word needs the riddle score, a definition the full judge's. */
export const servesWith = (kind, score) => Number.isFinite(score) && score >= (kind === 'define' ? DEFINE_PASS : WORD_PASS);

/**
 * Writes one served request into the save: counts the commendation, marks the word used, keeps the ledger.
 * The caller pushes the Shelf book (see patronsBook.js). Returns the ledger entry.
 */
export function recordServed(S, {day, patron, word, kind, score, tier, answer}) {
  if (!S.patrons || typeof S.patrons !== 'object' || Array.isArray(S.patrons)) S.patrons = {};
  const b = patronsOf(S);
  const entry = {day, p: patron.id, w: word.w, k: kind, s: Math.round(score), t: tier, a: String(answer || '').slice(0, 40)};
  S.patrons = {
    served: {...b.served, [patron.id]: (b.served[patron.id] | 0) + 1},
    last: {...b.last, [patron.id]: day},
    used: [...b.used, word.id].slice(-USED_CAP),
    ledger: [entry, ...b.ledger].slice(0, LEDGER_CAP),
  };
  return entry;
}

/** How many commendations the patron has on file. */
export const commendations = (S, id) => patronsOf(S).served[id] | 0;

/** Total commendations across the desk (the Patrons book badge). */
export const commendationTotal = S => Object.values(patronsOf(S).served).reduce((n, x) => n + (x | 0), 0);

/** Patrons in ring order with their counts, for the ledger page. */
export const deskRoll = S => PATRONS.map(p => ({id: p.id, name: p.name, room: p.room, count: commendations(S, p.id)}));

/** A short name for each room's patron for the book's page header. */
export const roomName = id => (ROOMS.find(r => r.id === id) || ROOMS[0]).short;
