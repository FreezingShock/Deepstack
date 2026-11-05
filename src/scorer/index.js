// Scorer facade. The app only calls judgeAnswer(); it uses the embedding model when ready
// and the lexical stand-in otherwise (see docs/PLAN.md).
import {judge as lexicalJudge, stem, STOP} from './lexical.js';
import {cosine, referenceTexts, prepareAnswer, scoreFromSims} from './embedding.js';
import {embed, whenReady, modelStatus} from './model.js';
import {hubTexts, hubSim} from './hubness.js';
import {relate, relationTexts, loadRelations} from './relations.js';
import {senseTexts, loadSenses} from './senses.js';
export {loadSenses} from './senses.js';
export {loadRelations} from './relations.js';
export {startModelLoad, onModelStatus, modelStatus, whenReady} from './model.js';

const refCache = new Map(); // word -> Promise<{texts, vecs}>
const refsFor = w => {
  if (!refCache.has(w.w)) {
    const texts = referenceTexts(w), {group, singles} = relationTexts(w), extra = [...(group ? [group] : []), ...singles], {alt, syn} = senseTexts(w);
    refCache.set(w.w, embed([...texts, ...extra, ...alt, ...syn, w.w]).then(vecs => {
      const n = texts.length, m = n + (group ? 1 : 0) + singles.length;
      return {vecs: vecs.slice(0, n), grp: group ? vecs[n] : null, singles: vecs.slice(n + (group ? 1 : 0), m), alt: vecs.slice(m, m + alt.length), gloss: vecs.slice(m + alt.length, -1), wordVec: vecs.at(-1)};
    }));
  }
  return refCache.get(w.w);
};

let hubVecs = null; // embeddings of the distractor definitions, computed once per page
const hubFor = () => (hubVecs ??= embed(hubTexts).catch(e => { hubVecs = null; throw e; }));

/** Embed the day's definitions up front (cheap: a handful of short texts). No-op until the model is ready. */
export async function prepareWords(words) {
  if (modelStatus().state !== 'ready') return;
  await Promise.all([loadRelations(), loadSenses()]);
  await Promise.all([hubFor(), ...words.map(refsFor)]);
}

/** Answer words the judge counted: the lexical matches plus any word tied to the target by the relation data. */
function countedWords(text, lexHits, rl) {
  const st = new Set(rl?.hit || []), out = new Set(lexHits || []);
  for (const t of text.toLowerCase().replace(/n['\u2019]t\b/g, 'nt').split(/[^a-z]+/)) if (t.length >= 3 && !STOP.has(t) && st.has(stem(t))) out.add(t);
  return [...out];
}

// Without concept lists the lexical scorer can only reward definition-word overlap; keep that as an honest, rough fallback.
function fallback(text, word) {
  const j = lexicalJudge(text, word);
  if (!word.concepts?.length && !j.empty) j.score = Math.min(60, Math.round(j.score * 2.4));
  return {...j, engine: 'lexical'};
}

/** @returns {Promise<{score:number,caught:string[],missed:string[],opposite:boolean,usedWord:boolean,empty:boolean,words:number,engine:string}>} */
export async function judgeAnswer(text, word) {
  const lex = lexicalJudge(text, word);
  if (lex.empty) return {...lex, engine: 'embedding'};
  if (!(await whenReady(6000))) return fallback(text, word);
  try {
    const prep = prepareAnswer(text, word);
    await Promise.all([loadRelations(), loadSenses()]);
    const [{vecs, grp, singles, alt, gloss, wordVec}, [a], hv] = await Promise.all([refsFor(word), embed([prep.text || text]), hubFor()]);
    const rl = relate(text, word);
    const r = scoreFromSims(vecs.map(v => cosine(a, v)), prep, text, {word, wordSim: cosine(a, wordVec), hub: hubSim(a, hv, word),
      rel: rl, altSim: alt.length ? Math.max(...alt.map(v => cosine(a, v))) : null, glossSim: gloss.length ? Math.max(...gloss.map(v => cosine(a, v))) : null, synSim: singles.length ? Math.max(...singles.map(v => cosine(a, v))) : null, grpSim: grp ? cosine(a, grp) : null});
    return {score: r.score, sim: r.sim, caught: lex.caught, missed: lex.missed, opposite: r.opposite || lex.opposite,
      usedWord: lex.usedWord, empty: false, words: lex.words, hits: countedWords(text, lex.hits, rl), engine: 'embedding'};
  } catch (err) {
    console.warn('Embedding judge failed, using fallback:', err);
    return fallback(text, word);
  }
}
