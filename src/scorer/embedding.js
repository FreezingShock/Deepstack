// Pure scoring math for the embedding judge (no model code, so it runs in Node tests).
import {analyze} from './lexical.js';
import {contrary} from './antonyms.js';
import calibration from './calibration.json' with {type: 'json'};

export const cosine = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }; // vectors are unit length

/** Piecewise-linear map from cosine similarity to a 0-100 score, using calibration.json points. */
export function curve(sim, points = calibration.points) {
  if (sim <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i], [x0, y0] = points[i - 1];
    if (sim <= x1) return y0 + (y1 - y0) * (sim - x0) / (x1 - x0);
  }
  return points[points.length - 1][1];
}

/** Texts embedded as reference for a word: the definition, each ';' clause, and curated concept labels. */
export function referenceTexts(word) {
  const refs = [word.def];
  const clauses = word.def.split(/;\s*/).map(s => s.replace(/\.$/, '').trim()).filter(s => s.split(/\s+/).length >= 2);
  if (clauses.length > 1) refs.push(...clauses);
  if (word.concepts?.length) refs.push(word.concepts.map(c => c[0]).join(', '));
  return [...new Set(refs)];
}

const OPPOSITE = /\b(opposite|antonym|contrary to|unlike)\b/i;

/** Removes the target word from the answer so naming it earns nothing. */
export function prepareAnswer(text, word) {
  const A = analyze(text, word);
  const re = new RegExp('\\b' + word.w.slice(0, Math.max(4, word.w.length - 3)) + '\\w*', 'ig');
  const stripped = text.replace(re, ' ').replace(/\s+/g, ' ').trim();
  return {text: stripped, content: A.content, usedWord: A.usedWord, tokens: A.toks};
}

const SYNONYM_MIN = .42, SYNONYM_CAP = .55;

/**
 * @param {number[]} sims cosine of the answer against each reference text
 * @param {object} prepared result of prepareAnswer
 * @param {string} rawText the answer as typed
 * @param {{word?:object, wordSim?:number, points?:number[][]}} ctx word: the target (enables the antonym guard);
 *   wordSim: cosine of the answer with the target word itself (lets a bare synonym such as "thrifty" count);
 *   points: curve override used while calibrating
 * @returns {{score:number,sim:number,opposite:boolean}}
 */
export function scoreFromSims(sims, prepared, rawText, ctx = {}) {
  let sim = Math.max(...sims);
  const contrarian = !!ctx.word && contrary(rawText, ctx.word.def, ctx.word, ctx.word.opp || '');
  // A one- or two-word answer is a synonym attempt; it is compared with the word itself, not just the longer definition.
  if (!contrarian && ctx.wordSim >= SYNONYM_MIN && prepared.content <= 2) sim = Math.max(sim, Math.min(SYNONYM_CAP, ctx.wordSim + .05));
  let s = curve(sim, ctx.points);
  let opposite = false;
  if (OPPOSITE.test(rawText) && s > 20) { s *= .3; opposite = true; }
  else if (contrarian && s > 12) { s *= .35; opposite = true; }
  if (s >= 40) { // fancy vocabulary: a small bonus only
    const fancy = prepared.tokens.filter(t => t.length >= 9).length;
    s += Math.min(calibration.fancyBonusMax, 2 * fancy);
  }
  return {score: Math.max(0, Math.min(100, Math.round(s))), sim, opposite};
}
