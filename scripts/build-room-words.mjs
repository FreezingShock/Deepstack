// Builds public/data/room-words.json: for each topic room, words WITH THE DEFINITION THAT BELONGS TO THAT ROOM.
//   node scripts/build-room-words.mjs --kaikki dump.jsonl --freq en_full.txt [--no-model]
//   (kaikki: https://kaikki.org/dictionary/English/words/kaikki.org-dictionary-English-words.jsonl
//    freq:   https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt)
// Why this exists: the main word list keeps one gloss per word (usually the commonest sense), so "calculus" plays as
// "Calculation; computation." and "theorem" as a logic gloss, and many on-topic words fail the playability filters on that
// one gloss ("algebra" repeats its own name, "renaissance" is "A rebirth or revival"). A room should ask for the sense
// that is about the room. Per word and per room this picks, in order:
//   1. a sense Wiktionary labels with one of the room's labels (src/core/rooms.js) that passes the playability filter,
//   2. otherwise (unlabelled words) the usable sense closest in meaning to the room (same MiniLM model as the judge),
//      only when it is plainly about the room and closer to it than to any other room.
// Thresholds for translation breadth are lower than the main list's because a topical word is fairer to ask than an
// equally rare everyday one. The Reading Room is untouched (it never reads this file).
import {createReadStream, readFileSync, writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {parseFreq, difficultyOf, translationBreadth, cleanGloss, makeHint} from './lib/wordsData.mjs';
import {rejectReason} from '../src/core/wordPool.js';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {ABOUT} from './lib/roomAbout.mjs';

const arg = n => { const i = process.argv.indexOf(n); return i < 0 ? null : (process.argv[i + 1] ?? true); };
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const kaikki = arg('--kaikki'), freqPath = arg('--freq');
if (!kaikki || !freqPath) { console.error('need --kaikki and --freq'); process.exit(1); }

export const MIN_D = 1.5;       // same floor as the main list (build-words)
export const MIN_T = 12;        // translation breadth (the main list needs 25 to be asked)
export const MIN_FREQ = 20;
const BAD_TAGS = new Set(['obsolete', 'archaic', 'dialectal', 'dialect', 'offensive', 'vulgar', 'slang', 'derogatory', 'ethnic-slur', 'rare', 'nonstandard', 'misspelling', 'abbreviation', 'initialism', 'dated', 'informal', 'colloquial', 'proscribed']);
const POS = {noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb'};
const EXC = read('./data/room-excludes.json');
const excluded = (id, w) => EXC['*'].includes(w) || (EXC[id] || []).includes(w);

const rooms = ROOMS.filter(r => r.id !== HALL);
// Labels that pull in a sport's or a craft's own jargon (a chess "deflection", a heraldic "abatement", graph-theory "predecessor").
const NOISY = new Set(['heraldry', 'games', 'board-games', 'card-games', 'chess', 'ball-games', 'cricket', 'baseball', 'football', 'hockey', 'rugby', 'golf', 'tennis', 'basketball', 'boxing', 'cycling', 'wrestling', 'topology', 'set-theory', 'typography', 'publishing']);
const LABELS = Object.fromEntries(rooms.map(r => [r.id, new Set(r.labels.filter(l => !NOISY.has(l)))]));
const freq = parseFreq(readFileSync(freqPath, 'utf8'));
const fit = read('../public/data/words.json').fit;

/** Translation breadth: the commonest sense's language categories, or distinct languages in the entry's translation table. */
function breadth(e) {
  const langs = new Set((e.translations || []).map(x => x.lang_code || x.code || x.lang).filter(Boolean));
  return Math.max(translationBreadth(e), langs.size);
}

/** Long encyclopaedic glosses ("A mathematical statement of some importance that has been proven to be true. Minor theorems
 *  are often called...") keep their first clause or sentence, which is the definition. */
function clip(g) {
  if (g.length <= 150) return g;
  const m = /^(.{40,150}?[.;])\s/.exec(g);
  return m ? m[1].replace(/[;]$/, '.') : g;
}

/** Usable senses of one kaikki entry: [{def, topics, examples}] */
function usableSenses(e) {
  const pos = POS[e.pos];
  if (!pos) return [];
  const out = [];
  for (const s of e.senses || []) {
    const tags = [...(s.tags || []), ...(s.raw_tags || [])].map(t => String(t).toLowerCase());
    if (tags.some(t => BAD_TAGS.has(t))) continue;
    const g = (s.glosses || []).slice(-1)[0];
    if (!g || g.length < 14) continue;
    const def = clip(cleanGloss(g));
    if (def.length < 14 || def.length > 190) continue;
    out.push({def, topics: s.topics || [], examples: s.examples || []});
  }
  return out;
}

// Hand-picked on-topic words (scripts/data/room-anchors.json) always get the room, with their first usable sense, even when
// Wiktionary leaves the sense untagged ("treaty") and the meaning check finds it too general.
const ANCHORS = read('./data/room-anchors.json');
const forced = Object.fromEntries(rooms.map(r => [r.id, new Map()]));
const labelled = Object.fromEntries(rooms.map(r => [r.id, new Map()])); // room -> word -> entry
const open = [];                                                           // words with no room label anywhere: classified by meaning
const seen = new Set();
let lines = 0;
for await (const line of createInterface({input: createReadStream(kaikki)})) {
  if (!line || ++lines < 0) continue;
  // cheap pre-filter before JSON.parse (the word key sits after forms/etymology, so scan the whole line)
  const m = /"word": "([a-z]{5,16})", "lang": "English"/.exec(line);
  if (!m) continue;
  const w = m[1], f = freq.get(w) ?? 0;
  if (f < MIN_FREQ) continue;
  const d = difficultyOf(fit, freq, w);
  if (d < MIN_D) continue;
  let e; try { e = JSON.parse(line); } catch { continue; }
  const pos = POS[e.pos];
  if (!pos || seen.has(w + '|' + pos)) continue;
  const t = breadth(e);
  if (t < MIN_T) continue;
  const senses = usableSenses(e);
  if (!senses.length) continue;
  let any = false;
  for (const r of rooms) {
    if (!(ANCHORS[r.id] || []).includes(w) || forced[r.id].has(w)) continue;
    const s = senses.find(x => !rejectReason({w, pos, def: x.def, d, t: Math.max(t, 25)}));
    if (s) forced[r.id].set(w, {w, pos, def: s.def, d, t, hint: makeHint(w, s.examples)});
  }
  for (const r of rooms) {
    if (excluded(r.id, w)) continue;
    for (const s of senses.slice(0, 3)) {   // a niche sense buried at #4 ("magpie" in rifle shooting) is not what the room means
      if (!s.topics.some(k => LABELS[r.id].has(k))) continue;
      const entry = {w, pos, def: s.def, d, t, hint: makeHint(w, s.examples)};
      if (rejectReason({...entry, t: Math.max(t, 25)})) continue;
      if (!labelled[r.id].has(w)) labelled[r.id].set(w, entry);
      any = true; break;
    }
  }
  seen.add(w + '|' + pos);
  if (!any) {
    for (const s of senses.slice(0, 3)) {
      const entry = {w, pos, def: s.def, d, t, hint: makeHint(w, s.examples)};
      if (!rejectReason({...entry, t: Math.max(t, 25)})) { open.push({...entry}); }
    }
  }
}
console.log('read', lines, 'lines;', open.length, 'unlabelled candidate senses');

const byMeaning = Object.fromEntries(rooms.map(r => [r.id, []]));
if (!process.argv.includes('--no-model') && open.length) {
  const {pipeline} = await import('@huggingface/transformers');
  const {MODEL} = await import('../src/scorer/model.js');
  const fe = await pipeline('feature-extraction', MODEL.id, {dtype: MODEL.dtype, revision: MODEL.revision});
  const emb = async t => (await fe(t, {pooling: 'mean', normalize: true})).tolist();
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const about = {};
  for (const r of rooms) about[r.id] = await emb(ABOUT[r.id]);
  // a label is a hint, not proof: a labelled gloss still has to read as being about the room
  const LAB_MIN = 0.33, protos = {};
  for (const r of rooms) {
    const all = [...labelled[r.id].values()];
    for (let i = 0; i < all.length; i += 256) {
      const chunk = all.slice(i, i + 256), vecs = await emb(chunk.map(c => c.def));
      chunk.forEach((c, j) => {
        const xs = about[r.id].map(a => dot(a, vecs[j])).sort((x, y) => y - x);
        if ((xs[0] + xs[1]) / 2 < LAB_MIN) labelled[r.id].delete(c.w);
        else (protos[r.id] ||= []).push(vecs[j]);
      });
    }
    process.stdout.write(`\rverified ${r.id}: ${labelled[r.id].size}   `);
  }
  console.log();
  const PROTO = Number(process.env.PROTO || 0.6);
  const OPEN = {body: .37, math: .38, english: .4}, OPEN_DEFAULT = .42;
  for (let i = 0; i < open.length; i += 256) {
    const chunk = open.slice(i, i + 256);
    const vecs = await emb(chunk.map(c => c.def));
    chunk.forEach((c, j) => {
      const sc = rooms.map(r => { const xs = about[r.id].map(a => dot(a, vecs[j])).sort((x, y) => y - x); return (xs[0] + xs[1]) / 2; });
      // an untagged word ("treaty", "tapestry") also counts when its gloss sits close to several of the room's verified labelled glosses
      const near = rooms.map(r => { const xs = (protos[r.id] || []).map(a => dot(a, vecs[j])).sort((x, y) => y - x); return (xs[0] + xs[1] + xs[2]) / 3; });
      const nb = near.indexOf(Math.max(...near)), n2 = Math.max(...near.filter((_, k) => k !== nb));
      if (near[nb] >= PROTO && near[nb] - n2 >= 0.04) { const id = rooms[nb].id; if (!excluded(id, c.w) && !labelled[id].has(c.w)) { byMeaning[id].push(c); return; } }
      const best = sc.indexOf(Math.max(...sc)), second = Math.max(...sc.filter((_, k) => k !== best));
      const id = rooms[best].id;
      if (sc[best] >= (OPEN[id] || OPEN_DEFAULT) && sc[best] - second >= 0.05 && !excluded(id, c.w) && !labelled[id].has(c.w)) byMeaning[id].push(c);
    });
    process.stdout.write(`\rembedded ${Math.min(i + 256, open.length)}/${open.length}`);
  }
  console.log();
}

const out = {};
for (const r of rooms) {
  const seenW = new Set(), list = [];
  for (const c of [...labelled[r.id].values(), ...forced[r.id].values(), ...byMeaning[r.id]]) {
    if (seenW.has(c.w)) continue; seenW.add(c.w);
    list.push([c.w, c.pos, c.def, +c.d.toFixed(1), c.t, c.hint || 0]);
  }
  list.sort((a, b) => a[0] < b[0] ? -1 : 1);
  out[r.id] = list;
  console.log(`${r.id}: ${list.length} (${labelled[r.id].size} labelled + ${byMeaning[r.id].length} by meaning)`);
}
writeFileSync(new URL('../public/data/room-words.json', import.meta.url), JSON.stringify({version: 1, source: 'Wiktionary sense labels and glosses via kaikki.org (CC BY-SA 4.0); built by scripts/build-room-words.mjs', cols: ['w', 'pos', 'def', 'd', 't', 'hint'], rooms: out}));
