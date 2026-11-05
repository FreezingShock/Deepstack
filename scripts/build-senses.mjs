// Usage: node scripts/build-senses.mjs --kaikki <file.jsonl> [--words public/data/words.json] [--rel public/data/relations.json] [--out public/data/senses.json]
// Builds the other meanings the judge also accepts and the book shows ("Also means"):
//   alt = up to 3 other usable senses of the word itself, syn = the main gloss of up to 3 of its closest synonyms.
// Output (additive; words.json is untouched): {version, words: {word: {alt: [[pos, gloss]...], syn: [[synonym, gloss]...]}}}
import {createReadStream, readFileSync, writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {BANK} from '../src/core/words.js';
import {pickAlts, glossOf} from './lib/sensesData.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const kaikki = arg('kaikki'), out = arg('out', 'public/data/senses.json');
if (!kaikki) { console.error('need --kaikki'); process.exit(1); }
const words = JSON.parse(readFileSync(arg('words', 'public/data/words.json'))).words;
const rel = JSON.parse(readFileSync(arg('rel', 'public/data/relations.json'))).rel;
const defOf = new Map(words.map(w => [w.w, w.def])); for (const b of BANK) defOf.set(b[0], b[3]);
const synsOf = w => [...new Set([...(rel[w]?.s || []), ...(rel[w]?.c || [])])].filter(x => /^[a-z]{3,}$/.test(x) && x.slice(0, 4) !== w.slice(0, 4)).slice(0, 8);
const wantSyn = new Set(); for (const w of defOf.keys()) for (const x of synsOf(w)) wantSyn.add(x);

const alts = new Map(), glosses = new Map();
for await (const line of createInterface({input: createReadStream(kaikki)})) {
  if (!line) continue;
  const e = JSON.parse(line);
  if (!/^(noun|verb|adj|adv)$/.test(e.pos)) continue;
  if (defOf.has(e.word)) (alts.get(e.word) ?? alts.set(e.word, []).get(e.word)).push(e);
  if (wantSyn.has(e.word) && !glosses.has(e.word)) { const g = glossOf(e); if (g) glosses.set(e.word, g); }
}
const res = {};
for (const [w, def] of defOf) {
  const alt = pickAlts(alts.get(w) || [], def, 3, w);
  const syn = synsOf(w).filter(x => glosses.has(x)).slice(0, 3).map(x => [x, glosses.get(x)]);
  if (alt.length || syn.length) res[w] = {...(alt.length && {alt}), ...(syn.length && {syn})};
}
writeFileSync(out, JSON.stringify({version: 1, source: 'Wiktionary via kaikki.org (CC BY-SA 4.0)', words: res}));
console.log(`wrote senses for ${Object.keys(res).length} words to ${out}`);
