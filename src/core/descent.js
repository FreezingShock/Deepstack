// The roguelike layer of Unlimited descents. Pure rules, no DOM, so the tests and the run share one source.
// Scoring and depth are untouched: the same answer earns the same feet. What changes is the road down:
// landings offer a way on, relics bend a few rules for the rest of the run, and a failed word ends the run
// unless Spare breath is carried. Run state lives only on the run (never saved), so old saves are unaffected.

export const LANDINGS = [2, 4, 6]; // word indexes that open with a landing (a run is 7 words)
export const FAIL_TIER = 0;        // Pamphlet: nothing here points at the meaning yet
export const DEEPER_MULT = 1.5;    // feet multiplier on the word after a Hard room
export const DEEPER_BUMP = 1.2;    // difficulty steps added to the next word's target
export const WICK_BONUS_MS = 10000;
export const FOLIO_DOUBLE_TIER = 3; // Folio and above double their feet with the Folio double relic
export const SPARE_MAX = 1;

export const PATHS = [
  {id: 'deeper', letter: 'A', name: 'Hard room', fx: 'Feet ×1.5 on the next word',
   line: 'The next word is harder. It is worth more feet, and it is no kinder if you miss it.'},
  {id: 'rest', letter: 'B', name: 'Rest alcove', fx: 'Spare breath',
   line: 'A candle stub in a dry niche. Your next failed word will not end the run.'},
  {id: 'curio', letter: 'C', name: 'Curio shop', fx: 'Take one relic of two',
   line: 'A shopkeeper with two relics on a tray. Keep one for the rest of the descent.'}
];

export const RELICS = [
  {id: 'index', name: 'Index card', fx: 'One more free hint',
   line: 'A card of margin notes. Its first clue costs no feet, once more this run.'},
  {id: 'wick', name: 'Slow wick', fx: '+10 seconds a word',
   line: 'A thinner wick. The candle holds ten seconds longer on every word.'},
  {id: 'folio', name: 'Folio double', fx: 'Folio or better: feet ×2',
   line: 'A bookmark that counts double. Folio and better answers earn twice the feet.'}
];

export const newDescent = () => ({relics: [], spare: 0, spent: 0, pathMult: 1, bump: 0, freeExtra: 0, ended: false, endedAt: 0, path: []});

export const isLanding = i => LANDINGS.includes(i);

/** A failed word: skipped, or scored Pamphlet (nothing here points at the meaning yet). */
export const isFailure = (tier, skipped) => !!skipped || tier <= FAIL_TIER;

/** The doors on a landing, with whether each can be taken now and why not. */
export function pathOptions(d) {
  const hasRelic = RELICS.some(r => !d.relics.includes(r.id));
  return PATHS.map(p => {
    if (p.id === 'rest' && d.spare >= SPARE_MAX) return {...p, enabled: false, reason: 'Already carrying Spare breath'};
    if (p.id === 'curio' && !hasRelic) return {...p, enabled: false, reason: 'The shelf is bare'};
    return {...p, enabled: true, reason: ''};
  });
}

/** Takes a door. Returns a new state; the curio door only opens the relic choice, so it changes nothing here. */
export function takePath(d, id) {
  if (id === 'deeper') return {...d, pathMult: DEEPER_MULT, bump: DEEPER_BUMP, path: [...d.path, id]};
  if (id === 'rest') return {...d, spare: Math.min(SPARE_MAX, d.spare + 1), path: [...d.path, id]};
  return {...d, path: [...d.path, id]};
}

/** Two relics the shopkeeper lays out: not owned yet, a random pair picked by rng. */
export function relicChoices(d, rng = Math.random) {
  const left = RELICS.filter(r => !d.relics.includes(r.id));
  const out = [];
  while (left.length && out.length < 2) out.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
  return out;
}

/** Keeps a relic. Index card adds one free hint for the rest of the run. */
export function takeRelic(d, id) {
  if (d.relics.includes(id) || !RELICS.some(r => r.id === id)) return d;
  return {...d, relics: [...d.relics, id], freeExtra: d.freeExtra + (id === 'index' ? 1 : 0)};
}

/** The time a word gets, on top of its floor's limit. */
export const limitBonusMs = d => (d.relics.includes('wick') ? WICK_BONUS_MS : 0);

/** Feet for an answer after the path multiplier and the Folio double, before combos. Hard room and Folio double stack. */
export function rowsWithPath(d, tier, skipped, rows) {
  let r = Math.round(rows * (d.pathMult || 1));
  if (d.relics.includes('folio') && !skipped && tier >= FOLIO_DOUBLE_TIER) r *= 2;
  return r;
}

/** Called once a word is answered: the path only lasts for the word after it. */
export const endWord = d => ({...d, pathMult: 1, bump: 0});

/** Applies a failure. Spare breath is spent first; with none carried the run ends at this word. */
export function resolveFailure(d, failed, at) {
  if (!failed) return d;
  if (d.spare > 0) return {...d, spare: d.spare - 1, spent: d.spent + 1};
  return {...d, ended: true, endedAt: at};
}

/** What the final page says about a descent. Null when there is nothing to say. */
export function descentSummary(d, words) {
  if (!d) return null;
  const relics = d.relics.map(id => (RELICS.find(r => r.id === id) || {}).name).filter(Boolean);
  const paths = d.path.map(id => (PATHS.find(p => p.id === id) || {}).name).filter(Boolean);
  return {ended: d.ended, endedAt: d.endedAt, of: words, relics, paths, spent: d.spent, spare: d.spare};
}

