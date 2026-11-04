// Everyday thesaurus from Princeton WordNet 3.1 (npm `wordnet-db`, WordNet licence), filtered by word frequency.
// Pure helpers: parse the dict files, then ask for the common synonyms of a word, ranked by how well the synset's gloss matches a definition.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const POS = {noun: 'n', verb: 'v', adj: 'a', adv: 'r'};
const clean = l => l.replace(/\(.*\)$/, '').toLowerCase();

/** Reads data.* and index.* into {syn: Map(offset|pos -> {words, gloss, sim:[keys]}), idx: Map(lemma -> [keys by sense rank])}. */
export function loadWordNet(dir) {
  const syn = new Map(), idx = new Map();
  for (const [name, p] of Object.entries(POS)) {
    for (const line of readFileSync(join(dir, 'data.' + name), 'utf8').split('\n')) {
      if (!line || line[0] === ' ') continue;
      const [head, gloss = ''] = line.split(' | ');
      const f = head.split(' '), n = parseInt(f[3], 16), words = [];
      for (let i = 0; i < n; i++) words.push(clean(f[4 + 2 * i]));
      const pc = parseInt(f[4 + 2 * n], 10), sim = [];
      for (let i = 0; i < pc; i++) { const [sym, off, pos] = f.slice(5 + 2 * n + 4 * i, 9 + 2 * n + 4 * i); if (sym === '&' || sym === '^') sim.push(off + (pos === 's' ? 'a' : pos)); }
      syn.set(f[0] + (f[2] === 's' ? 'a' : f[2]), {words, gloss: gloss.split(';')[0], sim});
    }
    for (const line of readFileSync(join(dir, 'index.' + name), 'utf8').split('\n')) {
      if (!line || line[0] === ' ') continue;
      const f = line.split(' '), pc = parseInt(f[3], 10), offs = f.slice(6 + pc);
      const l = f[0].replace(/_/g, ' '), cur = idx.get(l) ?? idx.set(l, []).get(l);
      offs.forEach(o => cur.push(o + p));
    }
  }
  return {syn, idx};
}

/**
 * Common synonyms of `word`. Senses whose gloss overlaps `def` (via overlap(gloss, def)) rank first with weight 7; the word's most
 * frequent sense is kept at weight 1 when nothing overlaps. Satellites of an adjective's cluster ("similar to") add weight 1.
 * isCommon(w) filters out words nobody would type. Returns Map(word -> weight).
 */
export function wnSynonyms(wn, word, def, overlap, isCommon, minOverlap = .2) {
  const keys = wn.idx.get(word) || [], out = new Map();
  const put = (ws, wt) => { for (const w of ws) if (w !== word && isCommon(w)) out.set(w, Math.max(out.get(w) ?? 0, wt)); };
  let hit = false;
  keys.forEach((k, i) => {
    const s = wn.syn.get(k); if (!s) return;
    if (overlap(s.gloss, def) > minOverlap) { hit = true; put(s.words, 7); for (const x of s.sim) put(wn.syn.get(x)?.words || [], 1); }
  });
  if (!hit && keys[0]) { const s = wn.syn.get(keys[0]); if (s) put(s.words, 1); }
  return out;
}

/** Moby Thesaurus (public domain): word -> Set of its entries (lower case). */
export function loadMoby(path) {
  const m = new Map();
  for (const line of readFileSync(path, 'utf8').split('\n')) { const [h, ...r] = line.split(','); if (h) m.set(h.toLowerCase(), new Set(r.map(x => x.toLowerCase().trim()))); }
  return m;
}
/** Moby lists are loose, so keep only entries that list the word back (A names B and B names A) and are common words. */
export const mobySynonyms = (moby, word, isCommon) => [...(moby.get(word) || [])].filter(x => x !== word && isCommon(x) && moby.get(x)?.has(word));

/** Lemmas that share a synset with `word` (any sense, plus an adjective's "similar to" synsets). */
export function wnNeighbours(wn, word) {
  const out = new Set();
  for (const k of wn.idx.get(word) || []) { const s = wn.syn.get(k); if (!s) continue; for (const w of s.words) out.add(w); for (const x of s.sim) for (const w of wn.syn.get(x)?.words || []) out.add(w); }
  out.delete(word); return out;
}
/** Words within two WordNet hops of `word`: the corroboration a loose Moby entry needs before it counts. */
export function wnNear(wn, word) {
  const one = wnNeighbours(wn, word), two = new Set(one);
  for (const w of one) for (const x of wnNeighbours(wn, w)) two.add(x);
  two.delete(word); return two;
}
