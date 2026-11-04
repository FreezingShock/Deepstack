// Usage: node scripts/build-relations.mjs --kaikki <file.jsonl> [--wordnet <wordnet-db/dict> --freq <en_full.txt> [--moby words.txt]] [--words public/data/words.json] [--out public/data/relations.json]
// With --wordnet and --freq, every key also gets the everyday synonyms WordNet lists for the sense that matches its definition ("curt" for laconic).
// Only words seen at least --min-count times in the frequency list are kept, so nobody has to know "brownnoser" to be right. wordnet-db ships on npm; the list is hermitdave/FrequencyWords en_full.txt.
// Builds the word-relation lists the judge uses to forgive answers that are related to the meaning without sharing its words:
//   s = synonyms, c = everyday synonyms from WordNet and Moby (see below; kept apart so the judge's reference texts stay Wiktionary's), h = hypernyms ("a kind of ..."), r = related and derived terms, a = antonyms, n = near synonyms
//   (synonyms of synonyms reached by two or more routes, for target words only).
// Keys are the target words plus every content word of the definitions (so "stingy" can be linked to a definition saying "miserly").
// Edges are symmetric: if A lists B as a synonym, B gets A too. Single words and two-word phrases only.
import {createReadStream, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {dirname} from 'node:path';
import {BANK} from '../src/core/words.js';
import {STOP, FILL, stem} from '../src/scorer/lexical.js';
import {loadWordNet, wnSynonyms, loadMoby, mobySynonyms, wnNear} from './lib/wordnet.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const kaikki = arg('kaikki'), wordsPath = arg('words', 'public/data/words.json'), out = arg('out', 'public/data/relations.json');
const CAP = {s: 14, c: 24, h: 8, r: 12, a: 8, n: 12};
if (!kaikki) { console.error('need --kaikki'); process.exit(1); }

const defs = [...JSON.parse(readFileSync(wordsPath)).words.map(w => [w.w, w.def]), ...BANK.map(b => [b[0], b[3]])];
const keys = new Set();
for (const [w, d] of defs) {
  keys.add(w);
  for (const t of d.toLowerCase().split(/[^a-z]+/)) if (t.length >= 3 && !STOP.has(t) && !FILL.has(t)) keys.add(t);
}
const defOf = new Map(BANK.map(b => [b[0], b[3]])); // curated definitions win, like the word pool
for (const [w, d] of defs) if (!defOf.has(w)) defOf.set(w, d);
const stems = text => new Set(text.toLowerCase().split(/[^a-z]+/).filter(t => t.length >= 3 && !STOP.has(t) && !FILL.has(t)).map(stem));
/** Word overlap between a Wiktionary sense gloss and the definition we ask about (0-1). */
const overlap = (gloss, def) => { const a = stems(gloss), b = stems(def); let n = 0; for (const x of a) if (b.has(x)) n++; return n ? n / Math.min(a.size, b.size) : 0; };
const BAD_TAGS = new Set(['obsolete', 'archaic', 'dialectal', 'dialect', 'offensive', 'vulgar', 'slang', 'derogatory', 'ethnic-slur', 'rare', 'nonstandard', 'misspelling', 'dated']);
const ok = w => /^[a-z]+(?:[- ][a-z]+)?$/.test(w) && w.length >= 3;
const FIELDS = {synonyms: 's', hypernyms: 'h', related: 'r', derived: 'r', antonyms: 'a'};
const targets = new Set(defs.map(d => d[0]));
const graph = new Map(); // every synonym edge in the dump, symmetric: word -> Map(neighbour -> 1), for the two-hop lists
const edge = (a, b) => { const m = graph.get(a) ?? graph.set(a, new Map()).get(a); m.set(b, 1); };
const book = new Map(); // key -> {s:Map(word->weight), ...}
const add = (k, f, w, weight) => {
  if (k === w || !keys.has(k) || !ok(w)) return;
  const e = book.get(k) ?? book.set(k, {s: new Map(), h: new Map(), r: new Map(), a: new Map(), c: new Map()}).get(k);
  e[f].set(w, (e[f].get(w) ?? 0) + weight);
};
const SYMM = {s: 's', a: 'a', r: 'r', h: null}; // a hypernym is not symmetric: "animal" does not list "dog" as a kind of animal
let n = 0;
for await (const line of createInterface({input: createReadStream(kaikki)})) {
  if (!line) continue;
  const e = JSON.parse(line);
  if (!/^(noun|verb|adj|adv)$/.test(e.pos) || !ok(e.word) || e.word.includes(' ') && !keys.has(e.word)) continue;
  n++;
  // Wiktionary files synonyms per sense; "candid" lists the synonyms of "impartial" first. For a target word, trust the sense whose
  // gloss overlaps the definition we ask about, and drop the other senses' lists when it has any.
  const target = defOf.has(e.word) && targets.has(e.word);
  let best = -1, bestScore = .2;
  if (target) (e.senses || []).forEach((sn, i) => { const o = Math.max(0, ...(sn.glosses || []).map(g => overlap(g, defOf.get(e.word)))); if (o > bestScore) { best = i; bestScore = o; } });
  const lists = [{src: e, matched: false}, ...(e.senses || []).map((src, i) => ({src, matched: i === best}))];
  const found = lists.some(l => l.matched && Object.keys(FIELDS).some(fl => (l.src[fl] || []).length));
  for (const {src, matched} of lists) for (const [field, f] of Object.entries(FIELDS)) for (const x of src[field] || []) {
    const tags = [...(x.tags || []), ...(x.raw_tags || [])].map(t => String(t).toLowerCase());
    if (tags.some(t => BAD_TAGS.has(t))) continue;
    const w = String(x.word || '').toLowerCase();
    const weight = matched ? 6 : target && found ? 0 : x.source ? 1 : 2; // other senses are dropped when the right one has lists
    if (!weight) continue;
    if (f === 's' && ok(w) && !w.includes(' ')) { edge(e.word, w); edge(w, e.word); }
    add(e.word, f, w, weight);
    if (SYMM[f]) add(w, SYMM[f], e.word, Math.min(weight, 2));
  }
}
// Everyday thesaurus (WordNet): synonyms Wiktionary has no list for. They rank below Wiktionary's own sense-matched lists.
if (arg('wordnet') && arg('freq')) {
  const wn = loadWordNet(arg('wordnet')), minCount = Number(arg('min-count', 300)), freq = new Map();
  for (const l of readFileSync(arg('freq'), 'utf8').split('\n')) { const [w, c] = l.split(' '); if (c) freq.set(w, +c); }
  const common = w => ok(w) && w.split(/[- ]/).every(p => (freq.get(p) ?? 0) >= minCount) && (freq.get(w) ?? 1e9) >= minCount;
  const moby = arg('moby') ? loadMoby(arg('moby')) : null, mobyWt = Number(arg('moby-weight', 2));
  let added = 0;
  for (const [w, d] of defOf) for (const [x, wt] of wnSynonyms(wn, w, d, overlap, common)) { add(w, 'c', x, wt); if (targets.has(w)) add(x, 'c', w, 1); added++; }
  if (moby) for (const w of defOf.keys()) { const near = wnNear(wn, w); for (const x of mobySynonyms(moby, w, common)) { if (!near.has(x)) continue; add(w, 'c', x, mobyWt); add(x, 'c', w, 1); added++; } }
  console.log(`WordNet: ${added} synonym edges for ${defOf.size} words`);
}
// Near synonyms: reached through two or more different synonyms of the word (one shared route is mostly noise).
for (const t of targets) {
  const direct = graph.get(t); if (!direct) continue;
  const count = new Map();
  for (const mid of direct.keys()) for (const x of graph.get(mid)?.keys() || []) if (x !== t && !direct.has(x)) count.set(x, (count.get(x) ?? 0) + 1);
  const e = book.get(t) ?? book.set(t, {s: new Map(), h: new Map(), r: new Map(), a: new Map(), c: new Map()}).get(t);
  e.n = new Map([...count].filter(([x, c]) => c >= 2 && !e.a.has(x)));
}
const o = {};
for (const [k, v] of book) {
  const rec = {};
  for (const f of Object.keys(CAP)) {
    if (!targets.has(k) && f !== 's' && f !== 'c') continue; // words that only appear inside definitions need just their synonyms
    const l = [...(v[f] || [])].filter(([w]) => f === 'a' || !v.a.has(w) && (f !== 'c' || !v.s.has(w))).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, CAP[f]).map(x => x[0]);
    if (l.length) rec[f] = l;
  }
  if (Object.keys(rec).length) o[k] = rec;
}
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify({version: 1, source: 'Wiktionary via kaikki.org (CC BY-SA 4.0); c = everyday synonyms from Princeton WordNet 3.1 and the Moby Thesaurus', rel: o}));
console.log(`scanned ${n} entries, ${keys.size} keys, wrote ${Object.keys(o).length} words to ${out}`);
