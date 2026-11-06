// Adds the other meanings of every topic-room word to public/data/senses.json, so the judge accepts them and the book's
// "Also means" shows them (the shape src/scorer/senses.js already reads: words.<w>.alt = [[pos, gloss]]).
//   node scripts/build-room-senses.mjs --kaikki dump.jsonl        (run after scripts/build-room-words.mjs)
// A room word's main definition is the room's sense, so the other senses (including the everyday one the main list would
// have used) become alts. Existing alt/syn entries are kept; only new glosses are appended (up to 3 alts per word).
// Homophones are not added: they share no meaning, so the judge has nothing to score them against.
import {createReadStream, readFileSync, writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {pickAlts} from './lib/sensesData.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const kaikki = arg('kaikki'), out = arg('out', 'public/data/senses.json');
if (!kaikki) { console.error('need --kaikki'); process.exit(1); }
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const rooms = read('../public/data/room-words.json').rooms;
const sen = JSON.parse(readFileSync(out));
const extras = read('./data/sense-extras.json').words;

const mainDef = new Map();
for (const list of Object.values(rooms)) for (const e of list) if (!mainDef.has(e[0])) mainDef.set(e[0], e[2]);
const entries = new Map();
for await (const line of createInterface({input: createReadStream(kaikki)})) {
  if (!line) continue;
  const m = /"word": "([a-z]{5,16})", "lang": "English"/.exec(line);
  if (!m || !mainDef.has(m[1])) continue;
  const e = JSON.parse(line);
  if (/^(noun|verb|adj|adv)$/.test(e.pos)) (entries.get(m[1]) ?? entries.set(m[1], []).get(m[1])).push(e);
}
let added = 0, touched = 0;
for (const [w, def] of mainDef) {
  const have = sen.words[w]?.alt || [];
  const fresh = pickAlts(entries.get(w) || [], def, 3, w).filter(a => !have.some(h => h[1] === a[1]));
  const alt = [...have, ...fresh].slice(0, 3);
  if (fresh.length) { sen.words[w] = {...(sen.words[w] || {}), alt}; added += fresh.length; touched++; }
}
for (const [w, x] of Object.entries(extras)) {
  const alt = sen.words[w]?.alt || [];
  const fresh = x.alt.filter(a => !alt.some(h => h[1] === a[1]));
  if (fresh.length) sen.words[w] = {...(sen.words[w] || {}), alt: [...fresh, ...alt].slice(0, 3)};
}
writeFileSync(out, JSON.stringify(sen));
console.log(`room senses: ${added} new alternate senses on ${touched} words (${Object.keys(sen.words).length} words in ${out})`);
