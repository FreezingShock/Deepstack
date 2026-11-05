// Word relations for the judge: synonyms, hypernyms, related terms and antonyms from Wiktionary (public/data/relations.json,
// built by scripts/build-relations.mjs). An answer that never repeats the definition's words can still be right because it
// is *related* to the word ("reserved" for taciturn) or to the words of its definition ("miserly" for a definition that says
// "stingy"). Pure functions here; the facade loads the data once and hands it in.
import {analyze, stem, STOP, FILL} from './lexical.js';

let REL = null;           // word -> {s,h,r,a}
const stemSets = new Map(); // "word|field" -> Set of stemmed forms
let byStem = null;          // stem -> [keys sharing it], so "reducing" in a definition finds the list of "reduce"

export const setRelations = obj => { REL = obj || null; stemSets.clear(); byStem = null; };
export const hasRelations = () => !!REL;

let loading = null;
/** Fetches relations.json once. Resolves false (never throws) when it is missing so the judge still works without it. */
export function loadRelations(url = (import.meta.env?.BASE_URL || '/') + 'data/relations.json') {
  return loading ||= (async () => {
    try {
      const r = await fetch(url);
      if (!r.ok || /html/.test(r.headers.get('content-type') || '')) throw new Error('HTTP ' + r.status);
      setRelations((await r.json()).rel); return true;
    } catch (err) { console.warn('Judge relations unavailable:', err); return false; }
  })();
}

const norm = s => s.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
const keyOf = s => norm(s).split(' ').map(stem).join(' ');
/** Stemmed set of one relation list ("s", "h", "r", "a") for a word. */
function setOf(word, field, rel = REL) {
  const id = word + '|' + field;
  let s = stemSets.get(id);
  if (!s) { s = new Set([...(rel?.[word]?.[field] || []), ...(field === 's' ? rel?.[word]?.c || [] : [])].map(keyOf)); stemSets.set(id, s); } // c = everyday synonyms (WordNet, Moby) count as synonyms
  return s;
}
/** Synonyms of every key that shares this stem (inflections of one word), as a stemmed Set. */
function stemSyn(st, rel) {
  const id = '~' + st;
  let s = stemSets.get(id);
  if (!s) {
    if (!byStem || byStem.rel !== rel) { byStem = new Map(); byStem.rel = rel; for (const k of Object.keys(rel)) if (!k.includes(' ')) { const t = stem(k); (byStem.get(t) ?? byStem.set(t, []).get(t)).push(k); } }
    s = new Set();
    for (const k of byStem.get(st) || []) for (const x of rel[k].s || []) s.add(keyOf(x));
    stemSets.set(id, s);
  }
  return s;
}
export const stemOf = w => stem(w.toLowerCase());
export const relOf = (w, rel = REL) => rel?.[w] || null;

const contentStems = def => [...new Set(def.toLowerCase().split(/[^a-z]+/).filter(t => t.length >= 3 && !STOP.has(t) && !FILL.has(t)).map(stem))];
/** Hypernyms so broad that naming one says almost nothing ("a kind of person"). */
const VAGUE_HYPERNYM = new Set(['person', 'thing', 'people', 'object', 'item', 'act', 'state', 'quality', 'action', 'being', 'man', 'woman', 'someone', 'something', 'one'].map(keyOf));
const GENERIC = new Set(['person', 'thing', 'make', 'cause', 'state', 'quality', 'act', 'use', 'form', 'type', 'kind', 'some', 'often', 'especially', 'usual', 'various', 'something', 'someone', 'have', 'get', 'way', 'part', 'time', 'very', 'much', 'great', 'highly', 'big', 'small', 'large', 'good', 'bad', 'lot', 'many', 'make', 'give', 'take', 'become', 'being', 'made', 'one', 'also', 'especially', 'exhibiting', 'showing', 'having'].map(stem));

/** Candidate terms of an answer: each token's stem, plus adjacent pairs ("yes man", "penny pinch"). */
function terms(list) {
  const out = [...new Set(list.map(o => o.s))];
  for (let i = 0; i + 1 < list.length; i++) out.push(list[i].s + ' ' + list[i + 1].s);
  return out;
}

/**
 * How the answer relates to the target word and its definition.
 * @param {string} text the answer as typed  @param {object} word target ({w, def})
 * @returns {{syn:string[], hyp:string[], rel:string[], near:string[], ant:string[], flip:string[], links:string[], cover:number, extra:number}|null}
 *   syn/hyp/rel/near: answer terms listed as synonym / hypernym / related word / near synonym (synonym of synonyms) of the target. ant: answer terms that are antonyms.
 *   flip: negated synonyms ("not quiet"), which point the wrong way; "not talkative" (negated antonym) counts as syn.
 *   extra: content words of the answer that are not the related term itself (0 = the answer is just the synonym).
 *   links: answer terms tied to a content word of the definition by a synonym edge only; cover: share of definition words
 *   the answer reaches by repeating or relating to them (0-1).
 */
export function relate(text, word, rel = REL) {
  if (!rel) return null;
  const A = analyze(text, word), P = terms(A.pos), N = terms(A.neg);
  const S = setOf(word.w, 's', rel), H = setOf(word.w, 'h', rel), R = setOf(word.w, 'r', rel), Nr = setOf(word.w, 'n', rel), An = setOf(word.w, 'a', rel);
  const pick = (set, list) => list.filter(t => set.has(t));
  // Relatives that share the word's first letters are its own family ("candle" for candid): not evidence of meaning.
  const kin = t => t.slice(0, 4) === word.w.slice(0, 4);
  const out = {syn: pick(S, P), hyp: pick(H, P).filter(t => !VAGUE_HYPERNYM.has(t)), rel: pick(R, P).filter(t => !kin(t) && !GENERIC.has(t)), near: pick(Nr, P).filter(t => !S.has(t) && !kin(t) && !GENERIC.has(t)), ant: pick(An, P), flip: pick(S, N), links: [], cover: 0, extra: 0};
  out.syn.push(...pick(An, N)); // "not talkative"
  const hitStems = new Set([...out.syn, ...out.hyp, ...out.rel, ...out.near, ...out.ant, ...out.flip].flatMap(t => t.split(' ')));
  out.extra = [...A.pos, ...A.neg].filter(o => !FILL.has(o.raw) && !GENERIC.has(o.s) && !hitStems.has(o.s)).length; // content words besides the related term
  const D = contentStems(word.def).filter(d => !GENERIC.has(d));
  // Broad ideas: answer words that repeat a content word of the definition, or are tied to one (or to the target) by any relation list.
  const ans = [...new Set(A.pos.filter(o => !FILL.has(o.raw) && !GENERIC.has(o.s) && o.s.length >= 3).map(o => o.s))];
  out.echo = ans.filter(a => D.includes(a)).length;
  const tieT = [S, H, R, Nr].map(x => ans.filter(a => x.has(a) && !kin(a))), tied = new Set(tieT.flat());
  const tieD = new Set();
  for (const d of D) { const r = rel[d]; if (!r) continue; for (const f of ['s', 'c', 'h', 'r', 'n']) for (const x of r[f] || []) { const k = keyOf(x); if (ans.includes(k) && !D.includes(k)) tieD.add(k); } }
  out.broad = tied.size; out.broadDef = tieD.size;
  if (D.length) {
    const have = new Set(A.pos.map(o => o.s));
    let hit = 0;
    for (const d of D) {
      if (have.has(d)) { hit++; continue; }
      const syn = stemSyn(d, rel), via = P.find(t => syn.has(t));
      if (via) { hit++; out.links.push(via); }
    }
    out.cover = hit / D.length;
  }
  out.hit = [...new Set([...hitStems, ...tied, ...tieD, ...out.links.flatMap(t => t.split(' ')), ...ans.filter(a => D.includes(a))])];
  return out;
}

/** Texts embedded as extra references: a group of the closest synonyms, and the single synonyms themselves. */
export function relationTexts(word, rel = REL) {
  const s = (rel?.[word.w]?.s || []).filter(x => !x.includes(' ') || x.split(' ').length <= 2).slice(0, 8);
  return {group: s.length >= 2 ? s.slice(0, 6).join(', ') : null, singles: s};
}
