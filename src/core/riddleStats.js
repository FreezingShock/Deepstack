/* Riddle Shelf bookkeeping. Saved additively as S.riddle, so old saves without it keep working. */
export const RIDDLE_WORDS = 7;
export const RIDDLE_SEEN_CAP = 300;
export const SOLVED_AT = 92; // Apocrypha

export const newRiddle = () => ({runs: 0, solved: 0, best: 0, seen: [], days: {}});

/** Tolerates missing or damaged saved data. */
export function loadRiddle(r) {
  const base = newRiddle();
  if (!r || typeof r !== 'object') return base;
  const n = v => (Number.isFinite(+v) && +v > 0 ? +v | 0 : 0);
  return {runs: n(r.runs), solved: n(r.solved), best: n(r.best), seen: Array.isArray(r.seen) ? r.seen.filter(x => Number.isFinite(x)).slice(-RIDDLE_SEEN_CAP) : [], days: r.days && typeof r.days === 'object' && !Array.isArray(r.days) ? {...r.days} : {}};
}

/** Difficulty to ask for riddle i of n: a gentle ramp around the player's level (riddles are harder than explaining). */
export function riddleTarget(L, i, n) {
  const f = n > 1 ? i / (n - 1) : .5;
  return Math.max(.5, L - 1.4 + 1.6 * f);
}

/** Closes out a run. Returns the new state (input untouched). */
export function recordRiddleRun(r, results, ids = []) {
  const base = loadRiddle(r);
  const solved = results.filter(b => b.score >= SOLVED_AT).length;
  return {runs: base.runs + 1, solved: base.solved + solved, best: Math.max(base.best, solved), seen: [...base.seen, ...ids].slice(-RIDDLE_SEEN_CAP), days: base.days};
}
