// Builds public/data/rooms.json: the word list of each topic room (src/core/rooms.js).
//   node scripts/build-rooms.mjs                       labels from scripts/data/word-topics.json, filtered by the judge's model
//   node scripts/build-rooms.mjs --no-model            labels only (quick look, lower precision)
//   node scripts/build-rooms.mjs --kaikki dump.jsonl   first rebuild scripts/data/word-topics.json from a local kaikki.org dump
//                                                      (https://kaikki.org/dictionary/English/words/kaikki.org-dictionary-English-words.jsonl)
// How a word gets into a room:
//   1. Wiktionary labels at least one of its senses with one of the room's labels, e.g. (heraldry) or (geometry).
//   2. Labels are noisy ("assassin" has a mathematics sense), so the game's own definition must sit close to the room:
//      cosine between the definition and the room's description, using the same MiniLM model as the judge.
//      Words whose labelled senses are mostly the room's need less closeness than words with one stray label.
//   3. Only playable words count (the same filter as the game: src/core/wordPool.js buildPool).
import {readFileSync, writeFileSync, createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {buildPool} from '../src/core/wordPool.js';
import {ROOMS, HALL} from '../src/core/rooms.js';

const arg = n => { const i = process.argv.indexOf(n); return i < 0 ? null : (process.argv[i + 1] ?? true); };
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const TOPICS = new URL('./data/word-topics.json', import.meta.url);

const pool = buildPool(read('../public/data/words.json'));
const byWord = new Map(pool.map(w => [w.w, w]));

if (arg('--kaikki')) {
  const want = new Map(read('../public/data/words.json').words.map(r => [r.w, r]));
  const out = {};
  for await (const line of createInterface({input: createReadStream(arg('--kaikki'))})) {
    let hit = false;
    for (const m of line.matchAll(/"word": "([^"]+)"/g)) if (want.has(m[1])) { hit = true; break; }
    if (!hit) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    const r = want.get(e.word); if (!r || e.pos !== r.pos) continue;
    const t = out[e.word] || {};
    for (const s of e.senses || []) for (const k of s.topics || []) t[k] = (t[k] || 0) + 1;
    if (Object.keys(t).length) out[e.word] = t;
  }
  writeFileSync(TOPICS, JSON.stringify({version: 1, source: 'Wiktionary sense topic labels via kaikki.org (CC BY-SA 4.0); built by scripts/build-rooms.mjs --kaikki', words: out}));
  console.log('wrote', Object.keys(out).length, 'labelled words');
}

const topics = JSON.parse(readFileSync(TOPICS)).words;

/* What each room is about, in plain sentences: the model compares every candidate definition with these. */
const ABOUT = {
  history: ['war', 'army', 'soldiers', 'battle', 'weapon', 'warship', 'navy', 'king and queen', 'empire', 'kingdom', 'government', 'politics', 'election', 'parliament', 'nobility and titles', 'castle and fortress', 'heraldry', 'ancient history', 'revolution', 'ruler'],
  math: ['mathematics', 'number', 'arithmetic', 'counting', 'fraction', 'equation', 'geometry', 'shape', 'angle', 'triangle', 'circle', 'line', 'measurement', 'probability', 'statistics', 'logic', 'algebra', 'calculation', 'quantity'],
  science: ['physics', 'chemistry', 'chemical element', 'atom', 'energy', 'electricity', 'astronomy', 'star', 'planet', 'weather', 'rock and mineral', 'biology', 'plant', 'animal', 'insect', 'bird', 'fish', 'cell', 'living organism', 'scientific experiment'],
  english: ['grammar', 'word', 'language', 'spelling', 'punctuation mark', 'sentence', 'verb', 'noun', 'speech', 'literature', 'story', 'novel', 'poem', 'poetry', 'verse', 'writer', 'writing', 'book', 'printing', 'rhetoric'],
  art: ['art', 'painting', 'drawing', 'sculpture', 'artist', 'colour', 'music', 'musical instrument', 'song', 'melody', 'composer', 'theatre', 'stage play', 'film', 'dance', 'opera', 'architecture', 'building', 'photograph', 'design'],
  body: ['human body', 'anatomy', 'bone', 'muscle', 'organ of the body', 'blood', 'skin', 'joint', 'sport', 'athlete', 'game', 'ball game', 'team', 'player', 'race', 'exercise', 'board game', 'card game', 'chess', 'score']
};

const EXC = read('./data/room-excludes.json');
const excluded = (id, w) => EXC['*'].includes(w) || (EXC[id] || []).includes(w);

/* Every playable word, with the share of its labelled senses that belong to each room (0 when unlabelled). */
const cands = {};
for (const r of ROOMS) {
  if (r.id === HALL) continue;
  const L = new Set(r.labels);
  cands[r.id] = pool.map(p => {
    const t = topics[p.w] || {};
    let n = 0, tot = 0;
    for (const [k, c] of Object.entries(t)) { tot += c; if (L.has(k)) n += c; }
    return {w: p.w, def: p.def, d: p.d, share: n ? n / tot : 0};
  });
}

let sims = null;
if (!process.argv.includes('--no-model')) {
  const {pipeline} = await import('@huggingface/transformers');
  const {MODEL} = await import('../src/scorer/model.js');
  const fe = await pipeline('feature-extraction', MODEL.id, {dtype: MODEL.dtype, revision: MODEL.revision});
  const emb = async t => (await fe(t, {pooling: 'mean', normalize: true})).tolist();
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const vecs = [];
  for (let i = 0; i < pool.length; i += 128) vecs.push(...await emb(pool.slice(i, i + 128).map(p => p.def)));
  sims = {};
  const raw = {};
  for (const id of Object.keys(cands)) {
    const about = await emb(ABOUT[id]);
    raw[id] = vecs.map(v => { const xs = about.map(a => dot(a, v)).sort((x, y) => y - x); return (xs[0] + xs[1]) / 2; });
  }
  /* margin over the best other room: positive means the definition is closer to this room than to any other */
  for (const id of Object.keys(cands)) sims[id] = raw[id].map((x, i) => ({x, m: x - Math.max(...Object.keys(cands).filter(k => k !== id).map(k => raw[k][i]))}));
  console.log('embedded', pool.length, 'definitions');
  if (arg('--probe')) { const id = arg('--probe'); for (const w of String(arg('--words')).split(',')) { const i = pool.findIndex(p => p.w === w); if (i >= 0) console.log(w, cands[id][i].share.toFixed(2), sims[id][i].x.toFixed(3), sims[id][i].m.toFixed(3), pool[i].def.slice(0, 70)); } }
}

/* Labelled words: mostly-on-topic ones need a little closeness, a word with one stray label needs a lot.
   Unlabelled words get in only when the definition is plainly about the room. */
const T = {lab: Number(arg('--lab') || .31), margin: Number(arg('--margin') || .01), open: Number(arg('--open') || .42), openMargin: .05};
const LAB = {body: .37, history: .31};
const OPEN = {body: .37, math: .38, english: .4}; // the body room's game labels catch many everyday words (beggar, auction)
export const keep = (share, sim, id) => sim === undefined ? share >= .5
  : share > 0 ? sim.x >= (LAB[id] || T.lab) - .06 * share && sim.m >= T.margin - .04 * share
  : sim.x >= (OPEN[id] || T.open) && sim.m >= T.openMargin;

const rooms = {}, report = [];
for (const [id, list] of Object.entries(cands)) {
  const kept = list.filter((c, i) => !excluded(id, c.w) && (c.share > 0 || sims) && keep(c.share, sims ? sims[id][i] : undefined, id));
  rooms[id] = kept.map(c => c.w).sort();
  const bands = [kept.filter(c => c.d < 3).length, kept.filter(c => c.d >= 3 && c.d < 4.5).length, kept.filter(c => c.d >= 4.5).length];
  report.push(`${id}: ${kept.length} (${kept.filter(c => c.share > 0).length} labelled + ${kept.filter(c => !c.share).length} by meaning; easy/mid/hard ${bands.join('/')})`);
  if (arg('--show') === id) {
    const idx = new Map(list.map((c, i) => [c, i]));
    console.log('KEPT labelled:', kept.filter(c => c.share).map(c => c.w).join(', '));
    console.log('\nKEPT by meaning:', kept.filter(c => !c.share).map(c => c.w).join(', '));
    console.log('\nDROPPED labelled:', list.filter(c => c.share && !kept.includes(c)).map(c => c.w).join(', '));
  }
}
writeFileSync(new URL('../public/data/rooms.json', import.meta.url), JSON.stringify({version: 1, source: 'Wiktionary sense labels via kaikki.org (CC BY-SA 4.0), filtered with all-MiniLM-L6-v2; scripts/build-rooms.mjs', rooms}));
console.log(report.join('\n'));
