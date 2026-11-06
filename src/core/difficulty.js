// Difficulty ramp and fairness filters for the generated word pool.
// Raw frequency alone ranks "sweetshop" above "didactic"; translation breadth (how many languages
// Wiktionary has a word for) is a better "would a reader know this" signal, so we blend it in.

// Specialist entries: taxonomy, chemistry, medicine, and cultural terms that are a vocabulary quiz
// on the topic rather than on the word ("Any shrub of the genus Sambucus").
const SPECIALIST = /\b(genus|genera|species of|subfamily|superfamily|suborder|taxon\w*|cultivar|chemical element|atomic number|isotope|enzyme|antibiotic|antibody|inflammation|syndrome|carcinoma|tumou?r|currency|monetary unit|dynasty|caliph\w*|imam|mosque|hindu\w*|islam\w*|muslim|buddhis\w*|sikh\w*|jewish|judaism|soviet|ussr|kolkhoz)\b|\b(?:family|order|class|phylum)\s+[A-Z]?[a-z]+(?:idae|iformes|ptera|ales|inae)\b|\b(?:a |an )?(?:acute |chronic )?(?:disease|disorder|infection)s? (?:of|caused|characterized|affecting)\b|^(a similar|any of (?:various|several|numerous) (?:species|fish|birds|insects|plants|trees|shrubs|mammals))\b/i;
export const isSpecialist = def => SPECIALIST.test(def);

/** Widely translated words read easier than their raw frequency suggests, and vice versa. */
export function effectiveDifficulty(d, translations) {
  if (translations == null) return d;
  const adj = -0.5 * Math.log2(Math.max(translations, 12) / 30);
  return +Math.max(0.5, Math.min(10, d + Math.max(-0.8, Math.min(0.5, adj)))).toFixed(1);
}

/** Daily ramp: eases in (two accessible words), then climbs. Daily stays in words a good share of players know; the easy end is not glaringly obvious. */
export const RAMP_START = 2.4;
export const RAMP_END = 5.2;
export function rampTargets(n) {
  return Array.from({length: n}, (_, i) => {
    const f = n > 1 ? i / (n - 1) : .5;
    return +(RAMP_START + (RAMP_END - RAMP_START) * Math.pow(f, 1.15)).toFixed(2);
  });
}

const stemKey = w => w.slice(0, 5);
/**
 * Picks one word near `target`, avoiding near-duplicates of words already in the run
 * (same first five letters: dermal/dermatitis). `pool` is the sorted word pool.
 */
export function pickRampWord(pool, target, usedIds, usedWords, rng, jitter = .35, ghosts = []) {
  const seenStems = new Set(usedWords.map(stemKey));
  let best = null, bk = Infinity, g = 0;
  // `ghosts` are blocked words that used to sit in the pool. They draw from the rng exactly as before (never win),
  // so the schedule for every other word stays the same after a word is removed. Both lists are sorted by word.
  const burn = upTo => { for (; g < ghosts.length && (upTo === null || ghosts[g].w < upTo); g++) if (!seenStems.has(stemKey(ghosts[g].w))) rng(); };
  for (const w of pool) {
    burn(w.w);
    if (usedIds.has(w.id) || seenStems.has(stemKey(w.w))) continue;
    const k = Math.abs(w.d - target) + rng() * jitter;
    if (k < bk) { bk = k; best = w; }
  }
  burn(null);
  return best;
}
