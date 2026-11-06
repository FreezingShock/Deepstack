// Spine lettering for the books standing on the home shelf. The old spines had a fixed label
// length (and squashed the word to fit), so long words came out clipped or tiny. Here the book is
// sized from the word: measure it at a readable size, shrink the font only when the word cannot
// fit the tallest spine the shelf allows, and grow the spine (and its label plate) to match.
export const FS_MAX = 14, FS_MIN = 9, PAD = 8; // font px, and the gap between lettering and plate edge

let ctx = null;
const cache = new Map();
export const resetSpineMeasure = () => cache.clear();

function measureAt(word, fs) {
  const k = fs + '|' + word;
  let v = cache.get(k);
  if (v == null) {
    if (cache.size > 4000) cache.clear(); // measurements are cheap to redo; never let a long session grow this forever
    if (!ctx && typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d');
    if (ctx) { ctx.font = spineFont(fs); v = ctx.measureText(word).width; } else v = word.length * fs * .52;
    cache.set(k, v);
  }
  return v;
}

export const spineFont = fs => `${fs}px "IM Fell English",Georgia,serif`;

// Pure given a measure function (tests pass a fake). Returns the lettering size and the spine
// size that holds it (top = room kept clear above the label for a gem or seal): h is at least baseH, never more than maxH; lh is the label plate length.
export function fitSpine(word, {baseH, baseW, maxH, top = 0, measure = measureAt}) {
  const room = maxH - top - 2 * (PAD + 6); // longest lettering the tallest spine allows
  let fs = FS_MAX;
  while (fs > FS_MIN && measure(word, fs) > room) fs--;
  const tw = measure(word, fs);
  const lh = Math.min(maxH - 12 - top, Math.ceil(tw + 2 * PAD));
  const h = Math.min(maxH, Math.max(baseH, lh + 12 + top));
  return {fs, tw, top, lh: Math.min(lh, h - 12 - top), h, w: Math.max(baseW, Math.round(fs * 1.6 + 14))};
}
