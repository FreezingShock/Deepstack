// Measures the local judge against the labelled answer sets (test/fixtures/answers.json + tricky-answers.json).
//   npm run judge:eval                 run the real model, print the report
//   npm run judge:eval -- --cache f    keep raw model output in f so reruns (after tweaking the scoring math) are instant
//   npm run judge:eval -- --no-rel     score without the Wiktionary relations (the pre-v2 judge), for before/after
//   npm run judge:eval -- --verbose    list every answer outside its expected band
//   npm run judge:eval -- --fit        also propose new calibration.json points (add --write to save them); `npm run calibrate` is this
// Needs the MiniLM weights (Hugging Face or a populated cache), like `npm run calibrate`.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {WORDS} from '../src/core/words.js';
import {hubTexts, hubSim} from '../src/scorer/hubness.js';
import {buildPool} from '../src/core/wordPool.js';
import {cosine, referenceTexts, prepareAnswer, scoreFromSims} from '../src/scorer/embedding.js';
import {setRelations, relate, relationTexts} from '../src/scorer/relations.js';
import {setSenses, senseTexts} from '../src/scorer/senses.js';

const arg = n => { const i = process.argv.indexOf(n); return i < 0 ? null : (process.argv[i + 1] ?? true); };
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
WORDS.push(...buildPool(read('../public/data/words.json')).filter(p => !WORDS.some(w => w.w === p.w)));
const noRel = process.argv.includes('--no-rel');
const REL = noRel || !existsSync(new URL('../public/data/relations.json', import.meta.url)) ? null : read('../public/data/relations.json').rel;
setRelations(REL);
const SEN = process.argv.includes('--no-senses') || !existsSync(new URL('../public/data/senses.json', import.meta.url)) ? null : read('../public/data/senses.json').words;
setSenses(SEN);
const fixtures = ['answers', 'tricky-answers', 'relation-answers'].filter(f => existsSync(new URL(`../test/fixtures/${f}.json`, import.meta.url)));
const rows = fixtures.flatMap(f => read(`../test/fixtures/${f}.json`).map(r => ({...r, set: f})));
const wordOf = n => WORDS.find(x => x.w === n);

// Expected score band per label. Same as calibrate, plus the labels only the tricky set uses.
export const BAND = {exact: [46, 100], good: [30, 95], partial: [10, 62], vague: [0, 50], wrong: [0, 30], opposite: [0, 30], echo: [0, 20], unrelated: [0, 14]};
const BAD = new Set(['wrong', 'opposite', 'vague', 'echo', 'unrelated']);

async function rawSims() {
  const cache = arg('--cache');
  if (cache && existsSync(cache)) return JSON.parse(readFileSync(cache));
  const {pipeline} = await import('@huggingface/transformers');
  const {MODEL} = await import('../src/scorer/model.js');
  const fe = await pipeline('feature-extraction', MODEL.id, {dtype: MODEL.dtype, revision: MODEL.revision});
  const emb = async t => (await fe(t, {pooling: 'mean', normalize: true})).tolist();
  const refs = new Map(), wvec = new Map(), out = [], hubVecs = await emb(hubTexts);
  for (const r of rows) {
    const w = wordOf(r.word);
    if (!refs.has(w.w)) {
      const {group, singles} = relationTexts(w, REL), extra = [...(group ? [group] : []), ...singles];
      const {alt, syn} = senseTexts(w, SEN), all = await emb([...referenceTexts(w), ...extra, ...alt, ...syn]), n = referenceTexts(w).length, m = n + (group ? 1 : 0) + (relationTexts(w, REL).singles.length);
      refs.set(w.w, {defs: all.slice(0, n), grp: group ? all[n] : null, singles: all.slice(n + (group ? 1 : 0), m), alt: all.slice(m, m + alt.length), gloss: all.slice(m + alt.length)}); wvec.set(w.w, (await emb([w.w]))[0]);
    }
    const prep = prepareAnswer(r.answer, w), R = refs.get(w.w);
    const [a] = await emb([prep.text || r.answer]);
    out.push({sims: R.defs.map(v => cosine(a, v)), wordSim: cosine(a, wvec.get(w.w)), hub: hubSim(a, hubVecs, w),
      synSim: R.singles.length ? Math.max(...R.singles.map(v => cosine(a, v))) : null, grpSim: R.grp ? cosine(a, R.grp) : null,
      altSim: R.alt.length ? Math.max(...R.alt.map(v => cosine(a, v))) : null, glossSim: R.gloss.length ? Math.max(...R.gloss.map(v => cosine(a, v))) : null});
  }
  if (cache) writeFileSync(cache, JSON.stringify(out));
  return out;
}

const raw = await rawSims();
const scored = rows.map((r, i) => {
  const w = wordOf(r.word), prep = prepareAnswer(r.answer, w);
  const s = scoreFromSims(raw[i].sims, prep, r.answer, {word: w, wordSim: raw[i].wordSim, hub: raw[i].hub, synSim: raw[i].synSim, grpSim: raw[i].grpSim, altSim: raw[i].altSim, glossSim: raw[i].glossSim, rel: REL ? relate(r.answer, w, REL) : null});
  return {...r, score: s.score};
});

const fitOn = process.argv.includes('--fit');
const pct = (n, d) => d ? (100 * n / d).toFixed(0).padStart(3) + '%' : '  - ';
let inBand = 0; const byLabel = {}, byKind = {};
for (const o of scored) {
  const [lo, hi] = BAND[o.label], ok = o.score >= lo && o.score <= hi;
  if (ok) inBand++;
  for (const [m, k] of [[byLabel, o.label], [byKind, o.kind ? `${o.label}/${o.kind}` : o.label]]) { m[k] ??= {n: 0, ok: 0, sum: 0}; m[k].n++; m[k].ok += ok; m[k].sum += o.score; }
  if (!ok && process.argv.includes('--verbose')) console.log(`MISS ${o.label}/${o.kind || '-'} ${o.word} score=${o.score} "${o.answer}"`);
}
// AUC: chance a random good/exact answer outscores a random bad one (1.0 = perfect ordering).
const goods = scored.filter(o => o.label === 'good' || o.label === 'exact'), bads = scored.filter(o => BAD.has(o.label));
let wins = 0; for (const g of goods) for (const b of bads) wins += g.score > b.score ? 1 : g.score === b.score ? .5 : 0;
const auc = wins / (goods.length * bads.length);

console.log('label/kind              n  in-band  mean');
for (const [k, v] of Object.entries(byKind).sort()) console.log(k.padEnd(22), String(v.n).padStart(3), pct(v.ok, v.n).padStart(7), (v.sum / v.n).toFixed(0).padStart(6));
for (const f of fixtures) { // per fixture file, so the fresh relation set can be read on its own
  const sub = scored.filter(o => o.set === f), ok = sub.filter(o => o.score >= BAND[o.label][0] && o.score <= BAND[o.label][1]).length;
  const g = sub.filter(o => o.label === 'good' || o.label === 'exact'), b = sub.filter(o => BAD.has(o.label));
  let w2 = 0; for (const x of g) for (const y of b) w2 += x.score > y.score ? 1 : x.score === y.score ? .5 : 0;
  console.log(`  ${f.padEnd(18)} ${String(sub.length).padStart(3)} answers  in band ${pct(ok, sub.length)}  AUC ${(w2 / (g.length * b.length)).toFixed(3)}`);
}
console.log(`\nin band: ${inBand}/${scored.length} (${pct(inBand, scored.length).trim()})   good-vs-bad AUC: ${auc.toFixed(3)}`);
console.log('SUMMARY', JSON.stringify({inBand, n: scored.length, auc: +auc.toFixed(3), ...Object.fromEntries(Object.entries(byLabel).map(([k, v]) => [k, +(v.ok / v.n).toFixed(2)]))}));

if (fitOn) { // same anchors as the original calibration, now over both labelled sets and on the hub-corrected similarity
  const calPath = new URL('../src/scorer/calibration.json', import.meta.url), cal = read('../src/scorer/calibration.json');
  const HUB = await import('../src/scorer/hubness.js');
  const simOf = i => Math.max(...raw[i].sims) - (raw[i].hub == null ? 0 : HUB.HUB_BETA * (raw[i].hub - HUB.HUB_REF));
  const by = l => rows.map((r, i) => r.label === l && !['echo', 'antonym'].includes(r.kind) ? simOf(i) : null).filter(x => x != null);
  const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  const low = [...by('vague'), ...by('wrong')];
  const pts = [[q(by('unrelated'), .9), 0], [q(low, .5), 16], [q(by('good'), .5), 52], [q(by('exact'), .25), 76], [q(by('exact'), .5), 90], [1, 100]]
    .sort((a, b) => a[0] - b[0]).filter((p, i, a) => i === 0 || (p[0] > a[i - 1][0] + .005 && p[1] > a[i - 1][1])).map(([x, v]) => [+x.toFixed(3), v]);
  console.log('\nproposed points:', JSON.stringify(pts));
  if (process.argv.includes('--write')) {
    writeFileSync(calPath, JSON.stringify({...cal, provisional: false, points: pts, calibratedOn: new Date().toISOString().slice(0, 10)}, null, 2) + '\n');
    console.log('wrote calibration.json');
  }
}
