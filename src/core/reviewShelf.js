// Review shelf: the words to win back. Pure (no DOM, no storage).
// The source is the saved shelf (every book you have earned, capped at 300), so a miss needs no new record.
// Quick re-tries live in the additive field S.review, keyed by the lower-cased word, so old saves read the same.

/** Folio starts at 46. A word whose best answer is under this is still to win back, and a re-try at this score or better wins it back. */
export const REVIEW_BELOW = 46;

const keyOf = w => String(w || '').toLowerCase();

/** The re-try record for a word, or null. */
export function retryOf(S, key) {
  const rv = S && S.review && typeof S.review === 'object' ? S.review : null;
  const r = rv && rv[key];
  return r && typeof r === 'object' ? r : null;
}

/**
 * The words to win back, most recent miss first. One entry per word (case-insensitive): its latest book, how many books
 * it has, its best score across them, and its re-try record. Skipped words count as 0. A word drops off once any of its
 * books reached REVIEW_BELOW, or once a re-try has cleared it.
 */
export function reviewItems(S) {
  const groups = new Map();
  for (const b of (S && Array.isArray(S.shelf) ? S.shelf : [])) {
    if (!b || typeof b.w !== 'string' || !b.w) continue;
    const key = keyOf(b.w), g = groups.get(key) || {key, w: b.w, n: 0, best: -1, last: b, lastT: -Infinity};
    const t = +b.t || 0;
    g.n++;
    g.best = Math.max(g.best, +b.score || 0);
    if (t >= g.lastT) { g.last = b; g.lastT = t; }
    groups.set(key, g);
  }
  return [...groups.values()]
    .filter(g => g.best < REVIEW_BELOW && !(retryOf(S, g.key) || {}).cleared)
    .sort((a, b) => b.lastT - a.lastT || a.w.localeCompare(b.w))
    .map(g => ({key: g.key, w: g.w, n: g.n, best: g.best, last: g.last, retry: retryOf(S, g.key)}));
}

/** How many words are waiting: the number on the review tab. */
export const reviewCount = S => reviewItems(S).length;

/**
 * Records one re-try. Adds no book and no depth; only the re-try record changes. Returns the stored record.
 * `cleared` sticks once a re-try reaches REVIEW_BELOW.
 */
export function recordRetry(S, key, score, now = Date.now()) {
  if (!S.review || typeof S.review !== 'object') S.review = {};
  const old = retryOf(S, key) || {};
  const s = Math.max(0, Math.min(100, Math.round(+score || 0)));
  const rec = {
    tries: (+old.tries || 0) + 1,
    best: Math.max(typeof old.best === 'number' ? old.best : -1, s),
    at: now,
    cleared: !!old.cleared || s >= REVIEW_BELOW,
  };
  S.review[key] = rec;
  return rec;
}
