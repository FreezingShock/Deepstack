// A seeded, deterministic save with a full shelf (300 books), for stress tests and perf scripts.
// Shape matches what src/app/run.js pushes onto S.shelf. Fields are additive and `fl` is left off on some
// books on purpose, so the attic has floorless finds as well as recent guesses.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export function fullSave({n = 300, atticShare = 0.2, dupeShare = 0.08, seed = 7} = {}) {
  const words = JSON.parse(readFileSync(join(process.cwd(), 'public/data/words.json'), 'utf8')).words;
  let a = seed >>> 0;
  const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const ROW = [0, 24, 60, 108, 168], MIN = [0, 14, 30, 46, 62, 78, 92];
  const shelf = [], t0 = Date.parse('2026-06-01T09:00:00Z');
  for (let i = 0; i < n; i++) {
    const wi = i > 20 && rnd() < dupeShare ? shelf[(rnd() * shelf.length) | 0].wid : (rnd() * words.length) | 0;
    const w = words[wi], tier = Math.min(6, Math.floor(rnd() ** 1.6 * 7)), score = Math.min(100, MIN[tier] + Math.floor(rnd() * 12));
    const b = {wid: wi, w: w.w, pos: w.pos, def: w.def, answer: 'a made up explanation of the word number ' + i, score, tier, mode: rnd() < .3 ? 'daily' : 'unlimited',
      t: t0 + i * 3 * 3600e3, no: 1 + (i % 4), hints: 0, verdict: 'Solid. You have the gist.', rows: 20, ft: 84};
    if (rnd() >= atticShare) b.fl = Math.min(4, Math.floor(i / n * 5));
    if (rnd() < .1) b.fav = true;
    shelf.push(b);
  }
  return {shelf, daily: {}, streak: {last: '2026-11-05', n: 3}, bestDepth: 1200, bestFloor: 4, sound: false};
}
