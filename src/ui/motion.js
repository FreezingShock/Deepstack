// The motion language: ONE table of durations and easings for every move in the game.
// CSS reads the same values as custom properties from motion.css (a test keeps the two in sync),
// JS reads them from here. Rules of the language:
//   - Durations are named by role, never typed as raw numbers. Nothing non-ambient exceeds 1200 ms,
//     except camera glides, which live in camMotion.js (clamped 1200-2500 ms).
//   - Three easing roles: accelerate (leaving), cruise (travelling), settle (arriving). Plus two
//     tactile curves: spring (a little overshoot) and press (instant, firm).
//   - Animate transform and opacity only. Reduced motion is handled here and in motion.css, nowhere else.
import {reducedMotion} from './settings.js';
export {TRAVEL_MIN_MS, TRAVEL_MAX_MS, travelMs, travelEase} from './camMotion.js';

/** Milliseconds by role. */
export const DUR = Object.freeze({
  press: 80,    // a button/book pressed down
  quick: 160,   // hover, colour, small fades
  base: 240,    // most enters/exits, toggles
  smooth: 360,  // panels, banners, cards settling
  page: 560,    // page flips, book opens/closes, cover swings
  linger: 1000, // slow fades (reveal out, veils); the longest non-glide move
});

/** CSS timing functions by role. */
export const EASE = Object.freeze({
  accelerate: 'cubic-bezier(.5,0,.75,.35)', // leaving: slow start, fast end
  cruise: 'cubic-bezier(.4,0,.2,1)',        // travelling: smooth in and out
  settle: 'cubic-bezier(.2,.8,.2,1)',       // arriving: fast start, soft landing
  spring: 'cubic-bezier(.34,1.56,.64,1)',   // tactile overshoot
  press: 'cubic-bezier(.3,.7,.4,1)',        // firm, immediate
  ink: 'cubic-bezier(.4,.1,.3,1)',          // pen strokes
});

export const RM_MS = 1; // reduced motion collapses every duration to this

/** True when motion should be reduced (setting wins over the OS preference). */
export const isReduced = () => reducedMotion();

/** Duration in ms for a preset name (1 when motion is reduced). Unknown names throw, so typos are caught early. */
export function dur(name, reduced = isReduced()) {
  if (!(name in DUR)) throw new Error(`unknown motion duration: ${name}`);
  return reduced ? RM_MS : DUR[name];
}

/** Easing string for a preset name. */
export function ease(name) {
  if (!(name in EASE)) throw new Error(`unknown motion easing: ${name}`);
  return EASE[name];
}

/** setTimeout that waits exactly as long as a named animation (use for "remove after it finishes"). */
export const after = (name, fn, extra = 0) => setTimeout(fn, dur(name) + extra);

/** Web Animations helper: animate transform/opacity keyframes with a duration and easing preset. */
export function animate(el, keyframes, {d = 'base', e = 'settle', delay = 0, fill = 'both'} = {}) {
  if (!el || typeof el.animate !== 'function') return null;
  return el.animate(keyframes, {duration: dur(d), easing: ease(e), delay, fill});
}

/** The same table as CSS custom properties; motion.css must declare exactly this. */
export function cssVars() {
  const v = {};
  for (const [k, ms] of Object.entries(DUR)) v[`--m-${k}`] = `${ms}ms`;
  for (const [k, c] of Object.entries(EASE)) v[`--e-${k}`] = c;
  return v;
}
