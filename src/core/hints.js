// Tiered hints. Each costs depth (shelf rows) instead of a fixed pool of free uses, so a hint
// is a real trade: an easier word now for fewer feet later. The ladder is built per word from
// what its data supports, because only ~31% of words have a real example sentence.
import {selfReferential} from './wordPool.js';

/** Rows deducted from a word's descent. A row is about 4 ft; an answer earns 3 to 35 rows. */
export const HINT_COST = {sentence: 1, synonym: 2, opening: 3};
export const MIN_ROWS = 2; // hints can shrink a descent but never erase it

/** A real example sentence with the word blanked, or null (the pool's templated fallback has no blank). */
export function sentenceClue(w) {
  // a sentence that still spells the word anywhere else (only the first use is blanked) gives it away
  return w.hint && w.hint.includes('___') && !w.hint.toLowerCase().includes(w.w.toLowerCase()) ? w.hint : null;
}

/** A near-synonym: curated concept terms, else a short gloss fragment from the definition. */
export function synonymClue(w) {
  const skip = t => !t || t.startsWith('~') || t.includes(w.w) || selfReferential(w.w, t);
  if (w.concepts && w.concepts.length) {
    const terms = w.concepts[0][2].split(',').map(t => t.trim()).filter(t => !skip(t) && t.split(' ').length <= 2);
    if (terms.length) return terms.slice(0, 2).join(', ');
  }
  const frags = w.def.replace(/\.$/, '').split(/;\s*/).map(x => x.replace(/^(to|a|an|the)\s+/i, '').trim());
  if (frags.length < 2) return null; // a lone gloss would be the answer itself
  const short = frags.filter(f => f && f.split(/\s+/).length <= 3 && !skip(f)).sort((a, b) => a.length - b.length);
  return short[0] || null;
}

/** The first few words of the definition, trailed by an ellipsis. Withheld for short definitions,
 *  where a fragment would be most of the answer. */
export function openingClue(w) {
  const words = w.def.replace(/\.$/, '').split(/;\s*/)[0].replace(/^(to|a|an|the)\s+/i, '').split(/\s+/).filter(Boolean);
  if (words.length < 5) return null;
  const n = Math.max(2, Math.min(4, Math.floor(words.length * 0.35)));
  const head = words.slice(0, n).join(' ');
  return head.toLowerCase().includes(w.w.toLowerCase()) ? null : head + '\u2026';
}

/** The ordered ladder of hints this word can give: [{kind, cost, text}]. Sentence leads when the
 *  data has a real one; otherwise the ladder simply starts at the next meaning hint. */
export function hintLadder(w) {
  const out = [];
  const s = sentenceClue(w); if (s) out.push({kind: 'sentence', cost: HINT_COST.sentence, text: s});
  const y = synonymClue(w); if (y) out.push({kind: 'synonym', cost: HINT_COST.synonym, text: y});
  const o = openingClue(w); if (o) out.push({kind: 'opening', cost: HINT_COST.opening, text: o});
  return out;
}

/** Rows after paying for hints used on this word. */
export function rowsAfterHints(rows, spent) {
  return Math.max(Math.min(rows, MIN_ROWS), rows - spent);
}
