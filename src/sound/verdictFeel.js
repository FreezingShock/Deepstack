/* The verdict feel: when the one line under a scored answer lands on the card, the pen writes it and, on a phone, the device buzzes.
   Pure rules (no DOM, no audio) so they can be tested: which pen strokes, which page turn, which vibration pattern.
   Higher tiers write more strokes and turn a page first. Reduce Motion keeps one soft stroke and no buzz (the sound is not motion).
   Low Power (the quality tier 'low') caps the strokes at two. The Haptics setting turns the buzz off. */

/** pen strokes per tier (Pamphlet writes one, Apocrypha five) */
export const STROKES = [1, 1, 2, 2, 3, 4, 5];
/** from this tier up, a page turns just before the pen writes */
export const TURN_FROM = 3;
/** ms between pen strokes and between the page turn and the first stroke */
export const STROKE_GAP = 70;
export const TURN_LEAD = 120;
/** the most strokes a Low Power device plays */
export const LOW_MAX_STROKES = 2;

/** navigator.vibrate patterns (on, off, on, ...) in ms: each tier buzzes longer and more often; every pattern stays under 400 ms */
export const BUZZ = [
  [10],
  [12],
  [14, 40, 14],
  [16, 44, 16, 44, 16],
  [18, 50, 18, 50, 18, 50, 24],
  [20, 50, 20, 50, 20, 50, 20, 50, 30],
  [22, 50, 22, 50, 22, 50, 22, 50, 22, 50, 40],
];

const clampT = t => Math.max(0, Math.min(STROKES.length - 1, t | 0));

/**
 * What to play when a verdict lands.
 * @param {number} tier 0..6
 * @param {{calm?: boolean, low?: boolean, haptics?: boolean}} o
 *   calm: Reduce Motion is on; low: Low Power (quality tier low); haptics: the Haptics setting
 * @returns {{sound: {at: number, kind: 'quill'|'paper'}[], buzz: number[] | null}} times in ms from the moment the line lands
 */
export function verdictPlan(tier, {calm = false, low = false, haptics = true} = {}) {
  const t = clampT(tier);
  if (calm) return {sound: [{at: 0, kind: 'quill'}], buzz: null};
  let n = STROKES[t];
  if (low) n = Math.min(n, LOW_MAX_STROKES);
  const sound = [];
  let at = 0;
  if (t >= TURN_FROM) { sound.push({at: 0, kind: 'paper'}); at = TURN_LEAD; }
  for (let i = 0; i < n; i++) sound.push({at: at + i * STROKE_GAP, kind: 'quill'});
  return {sound, buzz: haptics ? BUZZ[t].slice() : null};
}
