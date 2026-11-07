/* Manuscript restoration (the Restoration bench): a water-damaged page drawn from the room you are in.
   Each page has three passages. Two are FADED entries: the headword shows, the definition has run, and you write what the
   word means in your own words. The judge (src/scorer) scores it, and the real entry comes back in ink once the score
   reaches the bar. One is SMUDGED: the definition is clear and the headword has missing letters, so you recover the word
   from its meaning and any letters you ask for. A finished page is pinned to the wall.
   Pure logic only (no DOM), so tests can import it. Storage lives in src/restore/store.js. */
import {mulberry, hashStr} from '../core/daily.js';
import {MIN_SCORE} from '../sets/sets.js';

export const PASSAGES = 3;
/** A judged definition at this score or better restores the entry (the same bar as a Paperback in the sets). */
export const RESTORE_AT = MIN_SCORE;
/** How much faint ink a near miss leaves behind (0..1). Only a score at RESTORE_AT or better brings the whole entry back. */
const WASH_MAX = 0.3;

const norm = s => String(s == null ? '' : s).normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
/** Typed word against the real one: case and stray spaces do not matter, spelling does. */
export const sameWord = (typed, word) => norm(typed) === norm(word);

/** Ink that returns for a judged definition: the whole entry at RESTORE_AT, a faint wash below it. */
export function inkFor(score) {
  const s = Math.max(0, Math.min(100, Math.round(+score || 0)));
  return s >= RESTORE_AT ? 1 : +(WASH_MAX * s / RESTORE_AT).toFixed(3);
}

/** Words fit a smudged entry when they are a single run of letters with a real definition. */
const smudgeable = w => w && typeof w.w === 'string' && /^[a-z]{5,12}$/i.test(w.w) && typeof w.def === 'string' && w.def.length >= 12;
const usable = w => w && typeof w.w === 'string' && /^[a-z][a-z' -]*$/i.test(w.w) && typeof w.def === 'string' && w.def.length >= 12;

/** Picks PASSAGES distinct words, skipping words used on earlier pages while enough fresh ones remain. Deterministic for a given rng. */
export function pickPassageWords(pool, used = [], rng = Math.random, n = PASSAGES) {
  const seen = new Set(used.map(x => String(x).toLowerCase()));
  const fresh = (pool || []).filter(w => usable(w) && !seen.has(w.w.toLowerCase()));
  const all = (pool || []).filter(usable);
  let cand = fresh.length >= n ? fresh : all;
  cand = cand.slice();
  const out = [], picked = new Set();
  while (out.length < n && cand.length) {
    const w = cand.splice(Math.floor(rng() * cand.length), 1)[0];
    if (picked.has(w.w.toLowerCase())) continue;
    picked.add(w.w.toLowerCase());
    out.push(w);
  }
  return out;
}

/** Missing letters for a smudged headword: the first letter stays, about 40% of the rest go (at least two). */
export function smudge(word, rng = Math.random) {
  const chars = [...word];
  const open = [];
  for (let i = 1; i < chars.length; i++) open.push(i);
  const want = Math.min(open.length, Math.max(2, Math.round(chars.length * 0.4)));
  const hidden = [];
  while (hidden.length < want) hidden.push(open.splice(Math.floor(rng() * open.length), 1)[0]);
  hidden.sort((a, b) => a - b);
  return {hidden};
}

/** The headword as it reads now: hidden letters are gaps, and the first `hints` hidden letters have been shown. */
export function smudgedShown(p) {
  const chars = [...p.w], shown = new Set((p.hidden || []).slice(0, p.hints || 0));
  return chars.map((c, i) => (p.hidden || []).includes(i) && !shown.has(i) ? '_' : c);
}

/** A new page: PASSAGES passages for `room`, one of them smudged, built from `pool` (the room's words). Null when the pool
    cannot fill a page. `seed` makes it repeatable: the same room and seed always give the same page. */
export function buildPage({room, seed, pool, used = []}) {
  const rng = mulberry(hashStr(`restore:${room}:${seed}`));
  const words = pickPassageWords(pool, used, rng);
  if (words.length < PASSAGES) return null;
  const fits = words.map((w, i) => (smudgeable(w) ? i : -1)).filter(i => i >= 0);
  if (!fits.length) return null; // a page needs one headword that can be smudged (five to twelve letters)
  const smudgedAt = fits[Math.floor(rng() * fits.length)];
  const passages = words.map((w, i) => {
    const p = {kind: i === smudgedAt ? 'smudged' : 'faded', w: w.w, pos: w.pos || '', def: w.def, ink: 0, tries: 0, hints: 0, best: 0, done: false, restored: false};
    if (p.kind === 'smudged') p.hidden = smudge(w.w, rng).hidden;
    return p;
  });
  return {id: `${room}-${seed}`, room, seed, passages, at: null};
}

/** Applies a judged faded answer. Returns true when the entry came back in full. */
export function applyScore(p, score) {
  const s = Math.max(0, Math.min(100, Math.round(+score || 0)));
  p.tries++;
  p.best = Math.max(p.best || 0, s);
  p.ink = Math.max(p.ink || 0, inkFor(s));
  if (s >= RESTORE_AT) { p.done = true; p.restored = true; p.ink = 1; }
  return !!p.restored;
}

/** Applies a typed word to a smudged entry. Returns true when it matches. */
export function applyWord(p, typed) {
  p.tries++;
  if (!sameWord(typed, p.w)) return false;
  p.done = true; p.restored = true; p.ink = 1;
  return true;
}

/** The player lets an entry stay damaged: it counts as finished for the page, without ink. */
export function leaveFaded(p) { p.done = true; p.restored = false; }

/** Asks for one more letter of a smudged entry. Returns false when every hidden letter is already shown. */
export function giveLetter(p) {
  if ((p.hints || 0) >= (p.hidden || []).length) return false;
  p.hints = (p.hints || 0) + 1;
  return true;
}

export const pageComplete = page => !!page && page.passages.every(p => p.done);
/** How much of the page is restored, 0..1 (drives the water stain on the sheet). */
export const pageInk = page => (page && page.passages.length ? page.passages.reduce((a, p) => a + (p.restored ? 1 : Math.min(1, p.ink || 0)), 0) / page.passages.length : 0);
/** How much of the page is still stained, 0..1. */
export const pageDamage = page => 1 - pageInk(page);
