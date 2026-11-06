// Lexicon worker: holds the judge's word relations (relations.json, 3.9 MB) and other senses (senses.json, 3.1 MB) off the
// page's thread. Parsing them on the main thread was 1.5-3 s of frozen frames on a slow phone and ~60 MB of page heap.
// The page asks for the few answers it needs (src/scorer/lexicon.js); the pure functions are the same ones the tests pin.
// Protocol: main -> {id, op:'load', rel, sen} | {id, op:'prep', text, word} | {id, op:'refs', word} | {id, op:'get', words}
//           worker -> {id, r} | {id, err}
import {setRelations, relate, answerSynonyms, relationTexts, relOf} from './relations.js';
import {setSenses, senseTexts, sensesOf} from './senses.js';

const get = async u => {
  const r = await fetch(u);
  if (!r.ok || /html/.test(r.headers.get('content-type') || '')) throw new Error('HTTP ' + r.status);
  return r.json();
};
let loaded = null;
const OPS = {
  prep: m => ({rel: relate(m.text, m.word), via: answerSynonyms(m.text, m.word)}),
  refs: m => ({rt: relationTexts(m.word), st: senseTexts(m.word)}),
  get: m => ({rel: m.words.map(w => relOf(w)), sen: m.words.map(w => sensesOf(w))}),
};
self.onmessage = async ({data: m}) => {
  if (m.op === 'load') {
    loaded ||= Promise.all([
      get(m.rel).then(j => setRelations(j.rel)).catch(e => console.warn('Judge relations unavailable:', e)),
      get(m.sen).then(j => setSenses(j.words)).catch(e => console.warn('Judge senses unavailable:', e)),
    ]);
    await loaded; self.postMessage({id: m.id, r: true}); return;
  }
  await loaded;
  try { self.postMessage({id: m.id, r: OPS[m.op](m)}); }
  catch (e) { self.postMessage({id: m.id, err: String(e?.message || e)}); }
};
