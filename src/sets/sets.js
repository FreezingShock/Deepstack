/* Collectible book sets: themed groups of words. Answer every word in a set (at least a Paperback, so a real
   attempt) and the set is complete and pays a bonus in feet. Progress lives in S.sets, an additive field:
   { got: {word: bestScore}, done: {setId: isoDate} }. It is kept separately from the shelf, which is capped. */
export const MIN_SCORE = 14; // Paperback: a skipped or off-target answer does not collect a word

export const SETS = [
  {id:'time', name:'Tides of Time', blurb:'Words about how long things last.', bonus:150,
   words:['ephemeral','fleeting','perpetual','interval','duration','epoch']},
  {id:'weather', name:'Weather Almanac', blurb:'Storms, rain and the long dry.', bonus:150,
   words:['drizzle','blizzard','tempest','frost','monsoon','drought']},
  {id:'land', name:'The Atlas', blurb:'Places on the map.', bonus:150,
   words:['meadow','glacier','canyon','lagoon','marsh','prairie']},
  {id:'travel', name:'Wayfarer’s Shelf', blurb:'Going, leaving and straying.', bonus:200,
   words:['wander','voyage','expedition','stray','depart','harbor']},
  {id:'speech', name:'The Orator’s Row', blurb:'Ways of saying things.', bonus:200,
   words:['mutter','proclaim','declare','babble','narrate','retort']},
  {id:'craft', name:'Workshop Manuals', blurb:'Making and joining.', bonus:200,
   words:['weave','forge','stitch','engrave','solder','tailor']}
];

const norm = w => String(w || '').toLowerCase();
export const emptyProgress = () => ({got: {}, done: {}});
export const progressOf = S => {
  const p = S && S.sets && typeof S.sets === 'object' ? S.sets : null;
  return {got: p && p.got || {}, done: p && p.done || {}};
};

/** Per-set progress: which words are collected and whether the set is complete. */
export function setStatus(S, sets = SETS) {
  const {got, done} = progressOf(S);
  return sets.map(s => {
    const have = s.words.filter(w => (got[w] || 0) >= MIN_SCORE);
    return {...s, have, n: have.length, total: s.words.length, complete: have.length === s.words.length, doneAt: done[s.id] || null};
  });
}

/** Total bonus feet from completed sets. */
export function bonusFt(S, sets = SETS) {
  const {done} = progressOf(S);
  return sets.reduce((a, s) => a + (done[s.id] ? s.bonus : 0), 0);
}

/** Mutates S.sets: fold one finished book in. Returns the sets this book completed (usually none). */
export function recordBook(S, book, now = new Date().toISOString().slice(0, 10), sets = SETS) {
  if (!book || !book.w || !(book.score >= MIN_SCORE)) return [];
  if (!S.sets || typeof S.sets !== 'object') S.sets = emptyProgress();
  S.sets.got = S.sets.got || {}; S.sets.done = S.sets.done || {};
  const w = norm(book.w);
  if (!(S.sets.got[w] >= book.score)) S.sets.got[w] = book.score;
  const finished = [];
  for (const s of setStatus(S, sets)) if (s.complete && !S.sets.done[s.id]) { S.sets.done[s.id] = now; finished.push(s); }
  return finished;
}

/** One-time backfill from books already saved, so existing players keep their progress.
    Does not award completions (nobody was playing for them); those pay out on the next matching book. */
export function backfill(S, sets = SETS) {
  if (S.sets && S.sets.seeded) return;
  const books = [...(S.shelf || [])];
  for (const d of Object.values(S.daily || {})) books.push(...(d.books || []));
  if (!S.sets || typeof S.sets !== 'object') S.sets = emptyProgress();
  S.sets.got = S.sets.got || {}; S.sets.done = S.sets.done || {};
  for (const b of books) {
    if (b && b.w && b.score >= MIN_SCORE && !(S.sets.got[norm(b.w)] >= b.score)) S.sets.got[norm(b.w)] = b.score;
  }
  for (const s of setStatus(S, sets)) if (s.complete && !S.sets.done[s.id]) S.sets.done[s.id] = 'earlier';
  S.sets.seeded = true;
}
