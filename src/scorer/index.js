// Scorer facade. The app only calls judgeAnswer(); it uses the embedding model when ready
// and the lexical stand-in otherwise (see docs/PLAN.md).
import {judge as lexicalJudge} from './lexical.js';
import {cosine, referenceTexts, prepareAnswer, scoreFromSims} from './embedding.js';
import {embed, whenReady, modelStatus, retryModelLoad} from './model.js';
import {hubTexts, hubSim} from './hubness.js';
import {lexReady, prepAnswer, refTexts, lexEntries} from './lexicon.js';
export {lexReady, lexEntries, relEntry, senEntry} from './lexicon.js';
export {loadSenses} from './senses.js';
export {loadRelations} from './relations.js';
export {startModelLoad, onModelStatus, modelStatus, whenReady} from './model.js';

const refCache = new Map(); // word -> Promise<{texts, vecs}>
const refsFor = w => {
  if (!refCache.has(w.w)) {
    refCache.set(w.w, refTexts(w).then(({rt: {group, singles}, st: {alt, syn}}) => {
      const texts = referenceTexts(w), extra = [...(group ? [group] : []), ...singles];
      return embed([...texts, ...extra, ...alt, ...syn, w.w]).then(vecs => {
      const n = texts.length, m = n + (group ? 1 : 0) + singles.length;
      return {vecs: vecs.slice(0, n), grp: group ? vecs[n] : null, singles: vecs.slice(n + (group ? 1 : 0), m), alt: vecs.slice(m, m + alt.length), gloss: vecs.slice(m + alt.length, -1), wordVec: vecs.at(-1)};
    });
    }).catch(e => { refCache.delete(w.w); throw e; }));
    if (refCache.size > 400) refCache.delete(refCache.keys().next().value); // a long Unlimited session: keep the recent words' vectors only
  }
  return refCache.get(w.w);
};

let hubVecs = null; // embeddings of the distractor definitions, computed once per page
const hubFor = () => (hubVecs ??= embed(hubTexts).catch(e => { hubVecs = null; throw e; }));

/** Embed the day's definitions up front (cheap: a handful of short texts). No-op until the model is ready. */
export async function prepareWords(words) {
  if (modelStatus().state !== 'ready') return;
  await lexReady();
  await Promise.all([hubFor(), ...words.map(refsFor), lexEntries(words.map(w => w.w))]);
}

// Without concept lists the lexical scorer can only reward definition-word overlap; keep that as an honest, rough fallback.
function fallback(text, word) {
  const j = lexicalJudge(text, word);
  if (!word.concepts?.length && !j.empty) j.score = Math.min(60, Math.round(j.score * 2.4));
  return {...j, engine: 'lexical'};
}

/** Daily is the one place a score is permanent (streak, shelf), so it never gets the quick judge. */
export const mayUseQuickJudge = opts => !opts?.strict;

async function fullJudge(text, word, lex) {
  const prep = prepareAnswer(text, word);
  const [{rel, via}] = await Promise.all([prepAnswer(text, word), lexEntries([word.w])]); // the card reads this word's entries right after
  const [{vecs, grp, singles, alt, gloss, wordVec}, [a, ...vv], hv] = await Promise.all([refsFor(word), embed([prep.text || text, ...via]), hubFor()]);
  const viaSim = vv.length ? Math.max(...vv.flatMap(v => [...vecs, ...singles].map(r => cosine(v, r)))) : null;
  const r = scoreFromSims(vecs.map(v => cosine(a, v)), prep, text, {word, wordSim: cosine(a, wordVec), hub: hubSim(a, hv, word),
    rel, viaSim, altSim: alt.length ? Math.max(...alt.map(v => cosine(a, v))) : null, glossSim: gloss.length ? Math.max(...gloss.map(v => cosine(a, v))) : null, synSim: singles.length ? Math.max(...singles.map(v => cosine(a, v))) : null, grpSim: grp ? cosine(a, grp) : null});
  return {score: r.score, sim: r.sim, caught: lex.caught, missed: lex.missed, opposite: r.opposite || lex.opposite,
    usedWord: lex.usedWord, empty: false, words: lex.words, engine: 'embedding'};
}

const pause = ms => new Promise(r => setTimeout(r, ms));

/**
 * @param {{strict?:boolean,onWait?:()=>void}} [opts] strict (Daily): never score with the quick judge; wait for the full one, retrying a failed load, and call onWait once if that takes a moment.
 * @returns {Promise<{score:number,caught:string[],missed:string[],opposite:boolean,usedWord:boolean,empty:boolean,words:number,engine:string}>}
 */
export async function judgeAnswer(text, word, opts) {
  const lex = lexicalJudge(text, word);
  if (lex.empty) return {...lex, engine: 'embedding'};
  if (!mayUseQuickJudge(opts)) {
    let told = false, delay = 1500;
    for (;;) {
      if (await whenReady(6000)) {
        try { return await fullJudge(text, word, lex); } catch (err) { console.warn('Embedding judge failed, retrying (Daily never uses the quick judge):', err); }
      }
      if (!told) { told = true; opts.onWait?.(); }
      if (modelStatus().state !== 'loading') { await pause(delay); delay = Math.min(delay * 2, 15000); retryModelLoad().catch(() => {}); }
    }
  }
  if (!(await whenReady(6000))) return fallback(text, word);
  try { return await fullJudge(text, word, lex); }
  catch (err) {
    console.warn('Embedding judge failed, using fallback:', err);
    return fallback(text, word);
  }
}
