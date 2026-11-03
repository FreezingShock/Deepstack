// Calibrates src/scorer/calibration.json against the real embedding model using test/fixtures/answers.json.
//   npm run calibrate            report only
//   npm run calibrate -- --write rewrite calibration.json from the labelled medians
// Needs network access to Hugging Face (or a populated cache) to run the model in Node.
import {readFileSync, writeFileSync} from 'node:fs';
import {pipeline} from '@huggingface/transformers';
import {MODEL} from '../src/scorer/model.js';
import {WORDS} from '../src/core/words.js';
import {cosine, referenceTexts, prepareAnswer, scoreFromSims, curve} from '../src/scorer/embedding.js';
import {tierOf, TIERS} from '../src/core/tiers.js';

const rows = JSON.parse(readFileSync(new URL('../test/fixtures/answers.json', import.meta.url)));
const calPath = new URL('../src/scorer/calibration.json', import.meta.url);
const cal = JSON.parse(readFileSync(calPath));
const fe = await pipeline('feature-extraction', MODEL.id, {dtype: MODEL.dtype, revision: MODEL.revision});
const emb = async t => (await fe(t, {pooling: 'mean', normalize: true})).tolist();

const refs = new Map(), wvec = new Map();
for (const w of WORDS) { refs.set(w.w, await emb(referenceTexts(w))); wvec.set(w.w, (await emb([w.w]))[0]); }
const out = [];
for (const r of rows) {
  const w = WORDS.find(x => x.w === r.word);
  const prep = prepareAnswer(r.answer, w);
  const [a] = await emb([prep.text || r.answer]);
  const sims = refs.get(w.w).map(v => cosine(a, v));
  out.push({...r, sim: Math.max(...sims), sims, wordSim: cosine(a, wvec.get(w.w)), prep});
}
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const by = l => out.filter(o => o.label === l).map(o => o.sim);
console.log('label        n   min   p25   med   p75   max');
for (const l of ['exact', 'good', 'vague', 'wrong', 'opposite', 'unrelated']) {
  const v = by(l); if (!v.length) continue;
  console.log(l.padEnd(11), String(v.length).padStart(2), [0, .25, .5, .75, .999].map(p => q(v, p).toFixed(2).padStart(5)).join(' '));
}

// Anchors: unrelated p90 -> 0, vague+wrong pooled median -> 16 (embeddings cannot separate topical-but-wrong from vague),
// good median -> 52, exact p25 -> 76, exact median -> 90. Kept strictly increasing in both axes.
const low = [...by('vague'), ...by('wrong')];
const pts = [[q(by('unrelated'), .9), 0], [q(low, .5), 16], [q(by('good'), .5), 52], [q(by('exact'), .25), 76], [q(by('exact'), .5), 90], [1, 100]]
  .sort((a, b) => a[0] - b[0]).filter((p, i, a) => i === 0 || (p[0] > a[i - 1][0] + .005 && p[1] > a[i - 1][1])).map(([s, v]) => [+s.toFixed(3), v]);
console.log('\nproposed points:', JSON.stringify(pts));

// Expected band per label, as [min, max] score. "good" can legitimately be near-verbatim, and short exact paraphrases land at Folio, so the floors are Folio/Hardbound.
const BAND = {exact: [46, 100], good: [30, 95], vague: [0, 50], wrong: [0, 30], opposite: [0, 30], unrelated: [0, 14]};
const points = process.argv.includes('--write') ? pts : cal.points;
let bad = 0;
for (const o of out) {
  const w = WORDS.find(x => x.w === o.word);
  const s = scoreFromSims(o.sims, o.prep, o.answer, {word: w, wordSim: o.wordSim, points}).score;
  const [lo, hi] = BAND[o.label];
  if (s < lo || s > hi) { bad++; console.log(`OUT OF BAND ${o.label} ${w.w} sim=${o.sim.toFixed(2)} score=${Math.round(s)} (${TIERS[tierOf(s)].name}) "${o.answer}"`); }
}
console.log(`\n${out.length - bad}/${out.length} inside expected bands`);
if (process.argv.includes('--write')) {
  writeFileSync(calPath, JSON.stringify({...cal, provisional: false, points: pts, calibratedOn: new Date().toISOString().slice(0, 10)}, null, 2) + '\n');
  console.log('wrote calibration.json');
}
