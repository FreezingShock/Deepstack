// Pure scoring math for the embedding judge (no model code, so it runs in Node tests).
import {analyze} from './lexical.js';
import {contrary} from './antonyms.js';
import {HUB_BETA, HUB_REF} from './hubness.js';
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
/** How much a Wiktionary relation is worth, as a floor on the similarity (see relations.js). Fitted with npm run judge:eval. */
export const RELATION = {broad: .29, broadDef: .275, echo: .29, altDiscount: .06, glossDiscount: .08, senseCap: .40, viaDiscount: 0.14, viaCap: 0.33, syn: .50, boost: .12, rel: .40, near: .36, link0: .28, linkSlope: .10, synSimMin: .55, synSimCap: .56, grpDiscount: .08};

/**
 * @param {number[]} sims cosine of the answer against each reference text
 * @param {object} prepared result of prepareAnswer
 * @param {string} rawText the answer as typed
 * @param {{word?:object, wordSim?:number, points?:number[][], rel?:object, synSim?:number, grpSim?:number}} ctx
 *   rel: relate() result (synonym / related / definition links); synSim: cosine to the closest single synonym; grpSim: cosine to the synonym list; word: the target (enables the antonym guard);
 *   wordSim: cosine of the answer with the target word itself (lets a bare synonym such as "thrifty" count);
 *   hub: highest cosine of the answer to the distractor definitions (hubness.js); points: curve override used while calibrating
 * @returns {{score:number,sim:number,opposite:boolean}}
 */
export function scoreFromSims(sims, prepared, rawText, ctx = {}) {
  if (!prepared.text) return {score: 0, sim: 0, opposite: false}; // nothing left once the target word (or a form of it) is removed
  let sim = Math.max(...sims);
  if (ctx.hub != null) sim -= HUB_BETA * (ctx.hub - HUB_REF); // see hubness.js
  const rel = ctx.rel, T = RELATION;
  const relOpp = !!rel && !rel.syn.length && prepared.content <= 3 && (rel.ant.length > 0 || rel.flip.length > 0); // an antonym, or a negated synonym
  const contrarian = relOpp || (!!ctx.word && contrary(rawText, ctx.word.def, ctx.word, ctx.word.opp || ''));
  // A one- or two-word answer is a synonym attempt; it is compared with the word itself, not just the longer definition.
  if (!contrarian && ctx.wordSim >= SYNONYM_MIN && prepared.content <= 2) sim = Math.max(sim, Math.min(SYNONYM_CAP, ctx.wordSim + .05));
  if (!contrarian) {
    // An answer that is just the related word earns a floor; a synonym amid other words is only a hint (it may sit in an unrelated phrase), so it lifts what the embedding already saw.
    const bare = rel?.extra === 0;
    if (rel?.syn.length) sim = Math.max(sim, bare ? T.syn : Math.min(T.syn - .05, sim + T.boost));
    else if (bare && (rel?.hyp.length || rel?.rel.length)) sim = Math.max(sim, T.rel);
    else if (bare && rel?.near.length) sim = Math.max(sim, T.near);
    // Lenient tier: general ideas and close concepts earn a low floor (Pamphlet to Paperback), never more than a real match.
    if (rel?.echo) sim = Math.max(sim, T.echo);
    if (rel?.broad) sim = Math.max(sim, T.broad);
    if (rel?.broadDef) sim = Math.max(sim, T.broadDef);
    if (ctx.altSim != null) sim = Math.max(sim, Math.min(T.senseCap, ctx.altSim - T.altDiscount)); // other meanings count, but never as much as the main one
    if (ctx.glossSim != null) sim = Math.max(sim, Math.min(T.senseCap, ctx.glossSim - T.glossDiscount));
    if (ctx.viaSim != null) sim = Math.max(sim, Math.min(T.viaCap, ctx.viaSim - T.viaDiscount)); // the answer's own synonyms, one step removed
    if (rel?.links.length) sim = Math.max(sim, T.link0 + T.linkSlope * rel.cover);
    if (ctx.synSim >= T.synSimMin && prepared.content <= 2 && !rel?.extra) sim = Math.max(sim, Math.min(T.synSimCap, ctx.synSim));
    if (ctx.grpSim != null) sim = Math.max(sim, ctx.grpSim - T.grpDiscount);
  }
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
