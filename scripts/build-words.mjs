// Usage: node scripts/build-words.mjs --kaikki <file.jsonl> --freq <en_full.txt> [--out public/data/words.json] [--min-d 1.5]
// Inputs (not committed):
//   kaikki: https://kaikki.org/dictionary/English/words/kaikki.org-dictionary-English-words.jsonl
//   freq:   https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt
import {createReadStream, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {dirname} from 'node:path';
import {parseFreq, fitDifficulty, difficultyOf, collect} from './lib/wordsData.mjs';
import {BANK} from '../src/core/words.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const kaikki = arg('kaikki'), freqPath = arg('freq'), out = arg('out', 'public/data/words.json');
const minD = Number(arg('min-d', 1.5));
if (!kaikki || !freqPath) { console.error('need --kaikki and --freq'); process.exit(1); }

const freq = parseFreq(readFileSync(freqPath, 'utf8'));
const anchors = BANK.map(b => ({w: b[0], d: b[2]}));
const fit = fitDifficulty(anchors, freq);
console.log('difficulty fit', fit);

const entries = (async function* () {
  for await (const line of createInterface({input: createReadStream(kaikki)})) { if (line) yield JSON.parse(line); }
})();
// collect() is sync over an iterable; drain the async stream into a lazily-filtered array first.
const all = [];
for await (const e of entries) { if ((freq.get(e.word) ?? 0) >= 3) all.push(e); }
const rec = collect(all, freq);
const curated = new Set(anchors.map(a => a.w));
const words = [...rec.values()]
  .map(r => ({...r, d: difficultyOf(fit, freq, r.w), curated: curated.has(r.w) || undefined}))
  .filter(r => r.curated || r.d >= minD)
  .sort((a, b) => a.d - b.d || a.w.localeCompare(b.w));
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify({version: 1, source: 'Wiktionary via kaikki.org (CC BY-SA 4.0)', fit, words}));
console.log(`wrote ${words.length} words to ${out}`);
