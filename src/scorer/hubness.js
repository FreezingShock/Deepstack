// Hubness correction for the embedding judge. Some answers ("a type of person", "a good thing") sit moderately close to *every*
// definition, so raw cosine rewards them. We measure how close the answer is to a fixed set of unrelated definitions and
// subtract part of that: an answer that fits this word far better than it fits everything else keeps its score, a generic one loses it.
// On the labelled sets this lifted good-vs-bad AUC by ~2 points and band accuracy by ~3% (npm run judge:eval).
import {BANK} from '../core/words.js';

export const HUB_BETA = .75;
/** Typical hub value; the correction is beta * (hub - HUB_REF) so scores stay centred where they were. */
export const HUB_REF = .25;
/** Distractor texts: the curated definitions. Cheap to embed once (a few dozen short sentences). */
export const hubTexts = BANK.map(b => b[3]);

/** @param {number[]} a unit answer vector  @param {number[][]} hubVecs embeddings of hubTexts  @param {{def:string}} word target (its own definition is skipped)
 *  @returns {number} highest cosine to a distractor */
export function hubSim(a, hubVecs, word) {
  let best = -1;
  for (let i = 0; i < hubVecs.length; i++) {
    if (hubTexts[i] === word.def) continue;
    let s = 0; const v = hubVecs[i];
    for (let j = 0; j < a.length; j++) s += a[j] * v[j];
    if (s > best) best = s;
  }
  return best;
}
