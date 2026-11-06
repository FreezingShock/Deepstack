/* Collectible book sets: themed groups of words. Answer every word in a set (at least a Paperback, so a real
   attempt) and the set is complete and pays a bonus in feet. Progress lives in S.sets, an additive field:
   { got: {word: bestScore}, done: {setId: isoDate} }. It is kept separately from the shelf, which is capped. */
export const MIN_SCORE = 14; // Paperback: a skipped or off-target answer does not collect a word

/* Each set lives in a topic room (src/core/rooms.js) and is shown on that room's page of the Rooms book; its words are
   added to the room's word pool, so every set can be finished inside its own room. Progress (S.sets) is global and keyed
   by word, so a set word answered anywhere still counts. The first six keep their ids and order (their sigil rings). */
export const SETS = [
  {id:'time', room:'history', name:'Tides of Time', blurb:'Words about how long things last.', bonus:150,
   words:['ephemeral','fleeting','perpetual','interval','duration','epoch']},
  {id:'weather', room:'science', name:'Weather Almanac', blurb:'Storms, rain and the long dry.', bonus:150,
   words:['drizzle','blizzard','tempest','frost','monsoon','drought']},
  {id:'land', room:'science', name:'The Atlas', blurb:'Places on the map.', bonus:150,
   words:['meadow','glacier','canyon','lagoon','marsh','prairie']},
  {id:'travel', room:'history', name:'Wayfarer’s Shelf', blurb:'Going, leaving and straying.', bonus:200,
   words:['wander','voyage','expedition','stray','depart','harbor']},
  {id:'speech', room:'english', name:'The Orator’s Row', blurb:'Ways of saying things.', bonus:200,
   words:['mutter','proclaim','declare','babble','narrate','retort']},
  {id:'craft', room:'art', name:'Workshop Manuals', blurb:'Making and joining.', bonus:200,
   words:['weave','forge','stitch','engrave','solder','tailor']},
  {id:'crown', room:'history', name:'Crown and Coronet', blurb:'Who sat on the throne, and who stood beside it.', bonus:200,
   words:['monarchy','reign','empress','viceroy','viscount','marquess']},
  {id:'shapes', room:'math', name:'The Geometer’s Case', blurb:'Flat shapes and solid ones.', bonus:150,
   words:['triangle','hexagon','pentagon','rhombus','trapezium','cylinder']},
  {id:'parts', room:'math', name:'Parts of the Whole', blurb:'Splitting things up fairly.', bonus:200,
   words:['fraction','numerator','denominator','quotient','percentage','ratio']},
  {id:'survey', room:'math', name:'The Surveyor’s Chain', blurb:'Measuring across, along and up.', bonus:250,
   words:['perimeter','diameter','hypotenuse','diagonal','slope','azimuth']},
  {id:'sky', room:'science', name:'The Night Sky', blurb:'What burns and drifts above the roof.', bonus:200,
   words:['comet','nebula','quasar','supernova','eclipse','constellation']},
  {id:'marks', room:'english', name:'Marks on the Page', blurb:'The small signs between the words.', bonus:150,
   words:['comma','colon','apostrophe','ellipsis','umlaut','exclamation']},
  {id:'forms', room:'english', name:'The Poet’s Forms', blurb:'Shapes a poem can take.', bonus:250,
   words:['sonnet','stanza','couplet','quatrain','elegy','ghazal']},
  {id:'pit', room:'art', name:'The Orchestra Pit', blurb:'Strings, reeds and drums.', bonus:200,
   words:['violin','bassoon','piccolo','kettledrum','zither','mandolin']},
  {id:'stone', room:'art', name:'Stone and Arch', blurb:'The parts of a building that hold it up.', bonus:250,
   words:['buttress','cupola','facade','lintel','cornice','keystone']},
  {id:'bones', room:'body', name:'The Skeleton', blurb:'The frame under everything.', bonus:200,
   words:['pelvis','humerus','coccyx','sacrum','mandible','shinbone']},
  {id:'inner', room:'body', name:'Inner Workings', blurb:'What keeps going without being asked.', bonus:250,
   words:['aorta','pancreas','intestine','diaphragm','ventricle','oesophagus']},
  {id:'field', room:'body', name:'Field and Court', blurb:'Whistles, goals and the rules of the game.', bonus:150,
   words:['referee','umpire','goalkeeper','dribble','offside','sprint']}
];
/** The sets kept in one room, in SETS order. */
export const setsOfRoom = room => SETS.filter(s => s.room === room);

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
