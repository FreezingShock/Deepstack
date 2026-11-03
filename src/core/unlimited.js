/* Unlimited mode: an ~8 word placement test, then an Elo-style rating (the Lexicon, 0-100) that picks word difficulty.
   Pure functions plus a tiny state shape, so it saves additively as S.rating and old saves keep working. */
import {levelUpdate, levelTitle, pickWord} from './level.js';

export const PLACEMENT_WORDS = 8;
export const RUN_WORDS = 7;
export const START_LEVEL = 3.5;
const SEEN_CAP = 400;

export const newRating = () => ({L: START_LEVEL, placed: false, n: 0, runs: 0, seen: [], hist: []});

/** Tolerates missing or damaged saved data. */
export function loadRating(r) {
  const base = newRating();
  if (!r || typeof r !== 'object') return base;
  const L = Number(r.L);
  return {
    L: isFinite(L) ? Math.max(.3, Math.min(9.8, L)) : base.L,
    placed: !!r.placed,
    n: r.n | 0,
    runs: r.runs | 0,
    seen: Array.isArray(r.seen) ? r.seen.slice(-SEEN_CAP) : [],
    hist: Array.isArray(r.hist) ? r.hist.slice(-60) : []
  };
}

/** Lexicon is the rating shown to players: level 0-10 as 0-100. */
export const lexicon = L => Math.round(L * 10);
export {levelTitle};

/** Big steps while we are still finding the player, small ones once placed. */
export function kFactor(placed, i) {
  return placed ? .5 : Math.max(.7, 1.6 - i * .13);
}

/** Difficulty to ask for word i of n once placed: a ramp centred on the rating. */
export function targetFor(L, i, n, span = 1.6) {
  const f = n > 1 ? i / (n - 1) : .5;
  return Math.max(.5, L - span / 2 + span * f);
}

/** Picks the next word. Placement is adaptive: it just asks at the current estimate, which moves after each answer. */
export function nextWord(rating, i, n, used, rng = Math.random) {
  const seen = new Set([...rating.seen, ...used]);
  const target = rating.placed ? targetFor(rating.L, i, n) : rating.L;
  let w = pickWord(target, seen, rng);
  if (seen.has(w.id)) w = pickWord(target, new Set(used), rng); // pool exhausted: allow repeats across runs
  return w;
}

/** Applies one scored word to the rating. Returns the new rating (input untouched). */
export function applyResult(rating, word, score, i) {
  const L = levelUpdate(rating.L, word.d, score, kFactor(rating.placed, i));
  const seen = [...rating.seen, word.id].slice(-SEEN_CAP);
  return {...rating, L, n: rating.n + 1, seen};
}

/** Closes out a run: marks placement complete and records history. */
export function finishRating(rating, avg, now = Date.now()) {
  const hist = [...rating.hist, {t: now, lex: lexicon(rating.L), avg}].slice(-60);
  return {...rating, placed: true, runs: rating.runs + 1, hist};
}
