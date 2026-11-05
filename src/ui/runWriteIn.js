// The run screen writes itself in: candle first, then pips, label, word, part of speech, clock, answer
// slip, hint row, each rising and fading on the shared motion language (animate transform + opacity only).
// Used when a new word arrives and when the camera snaps back from looking up the descent, so the
// alcove is never an abrupt pop. Reduced motion shows everything at once; the low graphics tier
// skips the stagger and fades the whole stage in one move.
import {animate, isReduced, DUR} from './motion.js';
import {Quality} from './quality.js';

const STEP_MS = 60;     // gap between neighbouring elements
const MAX_STAGGER = 8;  // later elements share the last slot so the whole write-in stays brief

export function runParts(stage) {
  if (!stage) return [];
  const parts = [...stage.querySelectorAll('.candle')];
  const sheet = stage.querySelector('.sheet');
  if (sheet) parts.push(...sheet.children);
  return parts;
}

/** Stagger the stage's parts in. `wait` (ms) lets a camera move arrive first. Returns the animations. */
export function writeInRun(stage, {wait = 0, reduced = isReduced(), low = Quality.params().name === 'low'} = {}) {
  if (reduced || !stage) return [];
  if (low) return [animate(stage, [{opacity: 0}, {opacity: 1}], {d: 'smooth', e: 'settle', delay: wait, fill: 'backwards'})].filter(Boolean);
  const parts = runParts(stage);
  return parts.map((el, i) => {
    const slot = Math.min(i, MAX_STAGGER);
    const isWord = el.classList.contains('word');
    const from = isWord || el.classList.contains('candle') ? 0 : 10;
    return animate(el, [{opacity: 0, transform: `translateY(${from}px)`}, {opacity: 1, transform: 'none'}],
      {d: 'smooth', e: 'settle', delay: wait + slot * STEP_MS, fill: 'backwards'});
  }).filter(Boolean);
}

export const WRITE_IN_TOTAL_MS = DUR.smooth + MAX_STAGGER * STEP_MS;
