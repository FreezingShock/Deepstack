// Scorer facade. The app only calls judgeAnswer(); it uses the embedding model when ready
// and the lexical stand-in otherwise (see docs/PLAN.md).
import {judge as lexicalJudge} from './lexical.js';
import {cosine, referenceTexts, prepareAnswer, scoreFromSims} from './embedding.js';
import {embed, whenReady, modelStatus} from './model.js';
export {startModelLoad, onModelStatus, modelStatus, whenReady} from './model.js';

const refCache = new Map(); // word -> Promise<{texts, vecs}>
const refsFor = w => {
  if (!refCache.has(w.w)) { const texts = referenceTexts(w); refCache.set(w.w, embed([...texts, w.w]).then(vecs => ({vecs: vecs.slice(0, -1), wordVec: vecs.at(-1)}))); }
  return refCache.get(w.w);
};

/** Embed the day's definitions up front (cheap: a handful of short texts). No-op until the model is ready. */
export async function prepareWords(words) {
  if (modelStatus().state !== 'ready') return;
  await Promise.all(words.map(refsFor));
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
    const [{vecs, wordVec}, [a]] = await Promise.all([refsFor(word), embed([prep.text || text])]);
    const r = scoreFromSims(vecs.map(v => cosine(a, v)), prep, text, {word, wordSim: cosine(a, wordVec)});
    return {score: r.score, sim: r.sim, caught: lex.caught, missed: lex.missed, opposite: r.opposite || lex.opposite,
      usedWord: lex.usedWord, empty: false, words: lex.words, engine: 'embedding'};
  } catch (err) {
    console.warn('Embedding judge failed, using fallback:', err);
    return fallback(text, word);
  }
}
