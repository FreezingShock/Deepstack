/* Nemesis: the word you keep missing comes back as a weekly rematch. Each UTC week (Monday to Sunday) has one Nemesis: the
   hardest word in your answers (lowest average closeness, core/almanacProgress.js) that you have not beaten yet. The word is
   pinned for the week the first time it is asked for, so answering it does not swap it out mid-week. You get one swing a week.
   Folio or better beats it: the word is captured and never comes back, and the Rematch won stamp is earned. Anything lower and
   the word stays wanted, so next Monday it returns as a rematch.
   Saved as S.nemesis = {weeks: {[mondayKey]: {w, pos, def, room, avg, n, tier, duel?: {score, tier, t}}}, beaten: {[word]: mondayKey}}.
   Additive and tolerant of a missing or damaged field. Pure: no DOM, no storage (the caller saves). */
import {answeredBooks, hardestWords} from './almanacProgress.js';
import {TIERS} from './tiers.js';

export const BEAT_SCORE = TIERS[3].min; // Folio: a rematch is won at Folio or better

const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);

/** S.nemesis, tidied: {weeks, beaten}, both objects, whatever the save holds. */
export function nemesisState(S) {
  const n = S && isObj(S.nemesis) ? S.nemesis : {};
  return {weeks: isObj(n.weeks) ? n.weeks : {}, beaten: isObj(n.beaten) ? n.beaten : {}};
}

/** The record for one week, or null when none was pinned yet. A record without a word is treated as none. */
export function nemesisOf(S, weekKey) {
  const r = nemesisState(S).weeks[weekKey];
  return isObj(r) && typeof r.w === 'string' && r.w ? r : null;
}

/** The hardest word not beaten yet, from the save's answers, or null. Only words the pool knows can be duelled. */
export function pickNemesis(S, pool) {
  const {beaten} = nemesisState(S), byName = new Map();
  for (const w of pool || []) if (w && typeof w.w === 'string' && typeof w.def === 'string') byName.set(w.w, w);
  for (const h of hardestWords(answeredBooks(S), Infinity)) {
    if (beaten[h.w] || !byName.has(h.w)) continue;
    const w = byName.get(h.w);
    return {w: h.w, pos: w.pos || '', def: w.def, room: h.room, avg: h.avg, n: h.n, tier: h.tier};
  }
  return null;
}

/** Pins this week's Nemesis into S.nemesis the first time it is asked for, and returns it (null when there is none to pick).
 *  Mutates S only to pin; the caller saves. Later calls return the same record, whatever answers come in. */
export function pinNemesis(S, weekKey, pool) {
  if (!S) return null;
  const have = nemesisOf(S, weekKey);
  if (have) return have;
  const pick = pickNemesis(S, pool);
  if (!pick) return null;
  if (!isObj(S.nemesis)) S.nemesis = {};
  if (!isObj(S.nemesis.weeks)) S.nemesis.weeks = {};
  S.nemesis.weeks[weekKey] = pick;
  return pick;
}

/** Where this week's duel stands: 'none' (no Nemesis yet), 'open' (the swing is still to take), 'captured' or 'lost'. */
export function duelState(S, weekKey) {
  const r = nemesisOf(S, weekKey);
  if (!r) return 'none';
  if (!r.duel) return 'open';
  return r.duel.score >= BEAT_SCORE ? 'captured' : 'lost';
}

/** Writes the week's swing into its record, and captures the word when Folio or better. The book keeps its own answer. */
export function recordNemesis(S, weekKey, book) {
  if (!S || !book) return;
  const r = nemesisOf(S, weekKey);
  if (!r || r.duel || r.w !== book.w) return; // one swing a week, and only at the pinned word
  r.duel = {score: book.score | 0, tier: book.tier | 0, t: typeof book.t === 'number' ? book.t : Date.now()};
  if (r.duel.score >= BEAT_SCORE) {
    if (!isObj(S.nemesis.beaten)) S.nemesis.beaten = {};
    S.nemesis.beaten[r.w] = weekKey;
  }
}

/** How many Nemesis words have been captured so far (the Rematch won stamp needs one). */
export const nemesisCaptured = S => Object.keys(nemesisState(S).beaten).length;

