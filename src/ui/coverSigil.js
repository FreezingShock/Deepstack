// The word's sigil, stamped large on a front cover (the result card and any shelf book opened from it).
// Same drawing as the spines (src/ui/sigil.js), just rendered at a higher resolution, so the same word
// shows the same mark everywhere. One canvas per cover, drawn once; it never animates.
import {drawSigil} from './sigil.js';

const SIZE = 192;
/** Append a sigil canvas to a `.cover` element, right after its first label. Returns the canvas, or null. */
export function stampCover(cover, word, tier) {
  if (!cover || !word || typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.className = 'cv-sigil'; cv.width = cv.height = SIZE; cv.setAttribute('aria-hidden', 'true');
  const c = cv.getContext('2d');
  if (!c || !drawSigil(c, word, tier, SIZE / 2, SIZE / 2, SIZE / 2, .9, SIZE)) return null;
  const first = cover.querySelector('.ct');
  first ? first.after(cv) : cover.prepend(cv);
  return cv;
}
