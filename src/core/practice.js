/* Practice: a learning mode. Fresh words every time (never the Daily's, never a repeat until the pool runs dry),
   a gentle difficulty ramp below your Lexicon, free hints and a long clock. Pure helpers; saved additively as S.practice. */
import {pickWord} from './level.js';
import {START_LEVEL} from './unlimited.js';

export const PRACTICE_WORDS = 7;
export const PRACTICE_MS = 120000; // two minutes a word: nobody is racing a candle while learning
const SEEN_CAP = 600;

export const newPractice = () => ({seen: [], runs: 0, words: 0});

/** Tolerates missing or damaged saved data. */
export function loadPractice(p) {
  const base = newPractice();
  if (!p || typeof p !== 'object') return base;
  return {seen: Array.isArray(p.seen) ? p.seen.slice(-SEEN_CAP) : [], runs: p.runs | 0, words: p.words | 0};
}

/** Where the ramp starts: a little under the player's Lexicon, so most words are ones they can reason toward. */
export function practiceLevel(rating) {
  const L = rating && rating.placed ? rating.L : START_LEVEL;
  return Math.max(.5, L - .6);
}

/** n words climbing gently from the level, none seen before. When the pool is spent, the oldest sightings are forgiven. */
export function pickPracticeWords(practice, rating, n = PRACTICE_WORDS, exclude = [], rng = Math.random) {
  const L = practiceLevel(rating), out = [];
  let seen = new Set([...practice.seen, ...exclude]);
  for (let i = 0; i < n; i++) {
    const target = L + (n > 1 ? i / (n - 1) : .5) * 1.2;
    let w = pickWord(target, seen, rng);
    if (seen.has(w.id)) { w = pickWord(target, new Set([...out.map(x => x.id), ...exclude]), rng); }
    out.push(w); seen.add(w.id);
  }
  return out;
}

/** Marks one word as met. Returns a new practice object. */
export function markSeen(practice, word) {
  return {...practice, seen: [...practice.seen, word.id].slice(-SEEN_CAP), words: practice.words + 1};
}
export const finishPractice = practice => ({...practice, runs: practice.runs + 1});

/** What the coaching panel says for one answered book. Returns null for skips, where the card already shows the meaning. */
export function coachNotes(b, w) {
  const fb = b && b.fb || {}, concepts = (w && w.concepts || []).map(c => c[0]).filter(Boolean);
  const caught = fb.c || [], missed = fb.m || [];
  const ideas = concepts.length ? concepts : missed;
  const skipped = !b.answer;
  let headline;
  if (skipped) headline = 'Skipped. The meaning is above; try saying it back in your own words.';
  else if (b.score >= 85) headline = 'You had it. Nothing important was missing.';
  else if (caught.length && missed.length) headline = 'Part of it was there. The missing idea is what moves the score.';
  else if (caught.length) headline = 'You covered what the judge looks for.';
  else headline = 'The judge found none of the word’s main ideas. Read the meaning, then try it in your own words.';
  return {headline, caught, missed, ideas: skipped || b.score < 85 ? ideas : [], def: b.def, skipped};
}
