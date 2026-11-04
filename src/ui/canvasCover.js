/* Throttle the library canvas while something dark and (almost) opaque sits on top of it.
   The canvas keeps its last frame between draws, so a covered library still breathes (dust,
   lanterns, lore glow) at a low rate and returns to full speed on the very next frame with no
   pop: all animation is time-based and the world's dt is widened to match the longer gap. */

export const COVERED_MS = 1000 / 15;

// full-screen layers that dim the world to 67-93% black (see styles.css / topbar.css)
const LAYERS = ['#all:not([hidden])', '#stats:not([hidden])', '#sets:not([hidden])', '#topPanel:not([hidden])', '#cardlayer.on:not([hidden])'];

/** is the world mostly hidden behind a modal, the shelf, or an open menu book? */
export function worldCovered(doc = document) {
  if (doc.hidden) return true;
  return LAYERS.some(s => doc.querySelector(s)) || !!doc.querySelector('.bk-spread.open:not(.closing)');
}

/** minimum ms between canvas draws right now. 0 = every frame.
    Never throttle mid-animation (descent, pull, rest glide) or while screen shake / slow-mo runs. */
export function frameInterval({covered, busy, feelActive}) {
  return covered && !busy && !feelActive ? COVERED_MS : 0;
}
