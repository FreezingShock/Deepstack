// Pure scoring math for the embedding judge (no model code, so it runs in Node tests).
import {analyze} from './lexical.js';
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

/**
 * @param {number[]} sims cosine of the answer against each reference text
 * @returns {{score:number,sim:number,opposite:boolean}}
 */
export function scoreFromSims(sims, prepared, rawText) {
  const sim = Math.max(...sims);
  let s = curve(sim);
  let opposite = false;
  if (OPPOSITE.test(rawText) && s > 20) { s *= .4; opposite = true; }
  if (s >= 40) { // fancy vocabulary: a small bonus only
    const fancy = prepared.tokens.filter(t => t.length >= 9).length;
    s += Math.min(calibration.fancyBonusMax, 2 * fancy);
  }
  return {score: Math.max(0, Math.min(100, Math.round(s))), sim, opposite};
}
