// One-line verdict under a scored answer. The line must agree with the score: tier 0 covers 0-13, so an answer that
// earned a few points must not be told "nothing here points at the meaning" (it did point a little).
import {TIERS} from './tiers.js';

const SEEDS = 3; // points; at or above this the answer shared real ground with the meaning
const gist = def => {
  const c = String(def || '').split(/;\s*/)[0].replace(/\.$/, '').trim();
  return c && c.length <= 70 ? c.charAt(0).toLowerCase() + c.slice(1) : '';
};

export function verdictFor(j, t, w) {
  if (j.empty) return 'Nothing written.';
  if (j.opposite) return 'That points the other way. The word means close to the opposite.';
  if (t === 0 && j.score >= SEEDS) {
    const g = gist(w.def);
    return g ? `Close in spirit, but it misses the core: ${g}.` : 'Close in spirit, but it misses the core meaning.';
  }
  const T = TIERS[t];
  return T.lines[(w.id + j.score) % T.lines.length];
}
