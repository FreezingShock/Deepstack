// Usage: node scripts/build-word-notes.mjs --kaikki <file.jsonl|/dev/stdin> [--out public/data]
// Writes public/data/word-notes-<letter>.json: for every word in words.json and room-words.json, a short etymology (e),
// one usage example (x), a usage label (u) and up to four related words (r). Shards are per first letter so the card
// fetches only the one file it needs, after a player opens the margin note.
// Input (not committed), same dump as build-words.mjs: https://kaikki.org/dictionary/English/words/kaikki.org-dictionary-English-words.jsonl
//   e.g.  curl -sL <url> | node scripts/build-word-notes.mjs --kaikki /dev/stdin
import {createReadStream, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {summarize, pickNote, shardOf, NOTE_POS, hasUsableSense} from './lib/notesData.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const kaikki = arg('kaikki'), outDir = arg('out', 'public/data');
if (!kaikki) { console.error('need --kaikki <file>'); process.exit(1); }

// Words we need notes for, with their pos as the game records it.
const want = new Map();
for (const r of JSON.parse(readFileSync('public/data/words.json', 'utf8')).words) want.set(r.w, r.pos);
const rooms = JSON.parse(readFileSync('public/data/room-words.json', 'utf8')).rooms;
for (const list of Object.values(rooms)) for (const [w, pos] of list) if (!want.has(w)) want.set(w, pos);
// Related words must be real words: the game's own lists and synonym data, or any headword in the dump with a usable sense (collected below).
const gameWords = new Set([...JSON.parse(readFileSync('public/data/words.json', 'utf8')).words.map(r => r.w), ...Object.values(rooms).flat().map(x => x[0]), ...Object.keys(JSON.parse(readFileSync('public/data/senses.json', 'utf8')).words)]);
const headwords = new Set();
console.log(`notes wanted for ${want.size} words`);

// Summaries per word, reduced as the dump streams so the 3 GB file never sits in memory.
const sums = new Map();
let lines = 0;
for await (const line of createInterface({input: createReadStream(kaikki), crlfDelay: Infinity})) {
  if (!line) continue;
  if (++lines % 1000000 === 0) console.log(`  ${lines} entries read`);
  const e = JSON.parse(line);
  if (hasUsableSense(e)) headwords.add(e.word);
  if (!want.has(e.word) || !NOTE_POS[e.pos]) continue;
  const s = summarize(e);
  if (!s) continue;
  if (!sums.has(e.word)) sums.set(e.word, []);
  sums.get(e.word).push(s);
}
console.log(`read ${lines} entries; ${sums.size} wanted words have summaries`);
console.log(`${headwords.size} headwords with a usable sense`);

const shards = new Map();
let kept = 0;
for (const [w, pos] of want) {
  const note = pickNote(w, pos, sums.get(w) || [], x => headwords.has(x) || gameWords.has(x));
  if (!note) continue;
  const k = shardOf(w);
  if (!shards.has(k)) shards.set(k, {});
  shards.get(k)[w] = note;
  kept++;
}
mkdirSync(outDir, {recursive: true});
const SOURCE = 'Wiktionary via kaikki.org (CC BY-SA 4.0)';
for (const k of [...'abcdefghijklmnopqrstuvwxyz', 'other']) {
  const words = shards.get(k) || {};
  const file = `${outDir}/word-notes-${k}.json`;
  const body = JSON.stringify({version: 1, source: SOURCE, words: Object.fromEntries(Object.entries(words).sort(([a], [b]) => a.localeCompare(b)))});
  writeFileSync(file, body);
  console.log(`${file}: ${Object.keys(words).length} words, ${(body.length / 1024).toFixed(1)} KB`);
}
console.log(`notes for ${kept} of ${want.size} words`);
