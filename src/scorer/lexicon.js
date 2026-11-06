// The judge's word data (relations + other senses), read through a worker (lexWorker.js) so the 7 MB of JSON is never parsed
// on the page's thread. The page keeps only the entries it has asked for (the words on screen and on the shelf) so the UI
// can read them synchronously. Without workers, or if the worker dies, it falls back to loading the data here, as before.
import {dataUrl} from '../core/dataUrl.js';
import {loadRelations, relate, answerSynonyms, relationTexts, relOf} from './relations.js';
import {loadSenses, senseTexts, sensesOf} from './senses.js';

let worker = null, ready = null, local = false, localLoad = null, nextId = 1;
const pending = new Map();
const relCache = new Map(), senCache = new Map(); // word -> entry|null, only words asked for
const CAP = 600; // the shelf caps at 300 books; a long Unlimited session must not grow these forever
const keep = (m, k, v) => { if (m.size >= CAP) m.delete(m.keys().next().value); m.set(k, v); };

function goLocal(why) {
  if (why) console.warn('Lexicon worker unavailable, loading the judge data on the page:', why);
  try { worker?.terminate(); } catch { /* gone */ }
  worker = null; local = true;
  localLoad ||= Promise.all([loadRelations(), loadSenses()]).then(() => true);
  pending.forEach(p => p.retry()); pending.clear();
  return localLoad;
}
function call(op, args) {
  if (local || !worker) return null;
  return new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, {res, rej, retry: () => res(null)});
    worker.postMessage({id, op, ...args});
  });
}

/** Starts loading the judge data (idempotent). Resolves once lookups can be answered. Never throws. */
export function lexReady() {
  return ready ||= new Promise(resolve => {
    if (typeof Worker === 'undefined' || /[?&]judge=main\b/.test(globalThis.location?.search || '')) return resolve(goLocal());
    try { worker = new Worker(new URL('./lexWorker.js', import.meta.url), {type: 'module'}); }
    catch (e) { return resolve(goLocal(e)); }
    worker.onerror = e => { e.preventDefault?.(); resolve(goLocal(e.message || 'failed to start')); };
    worker.onmessage = ({data: m}) => {
      const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
      if ('err' in m) p.rej(new Error(m.err)); else p.res(m.r);
    };
    call('load', {rel: new URL(dataUrl('relations.json'), location.href).href, sen: new URL(dataUrl('senses.json'), location.href).href}).then(ok => resolve(ok ?? true));
  });
}
const word0 = w => ({w: w.w, def: w.def, pos: w.pos});

/** relate() and answerSynonyms() for an answer, computed where the data lives. */
export async function prepAnswer(text, word) {
  await lexReady();
  const r = await call('prep', {text, word: word0(word)});
  if (r) return r;
  await localLoad; return {rel: relate(text, word), via: answerSynonyms(text, word)};
}
/** relationTexts() and senseTexts() for a word (extra reference texts for the judge). */
export async function refTexts(word) {
  await lexReady();
  const r = await call('refs', {word: word0(word)});
  if (r) return r;
  await localLoad; return {rt: relationTexts(word), st: senseTexts(word)};
}
/** Brings these words' entries to the page so relEntry/senEntry can read them synchronously. */
export async function lexEntries(words) {
  const want = [...new Set(words.filter(w => w && !relCache.has(w)))];
  await lexReady();
  if (!want.length || local) return localLoad;
  const r = await call('get', {words: want});
  if (!r) return localLoad;
  want.forEach((w, i) => { keep(relCache, w, r.rel[i]); keep(senCache, w, r.sen[i]); });
}
export const relEntry = w => local ? relOf(w) : relCache.get(w) ?? null;
export const senEntry = w => local ? sensesOf(w) : senCache.get(w) ?? null;
export const hasEntry = w => local || relCache.has(w);
