// Is a background (lore) book hidden behind a lit alcove? Alcoves are carved over a horizontal
// band of the wall (the "niche box") at rows that have one open; a book that overlaps that band
// is neither lit nor clickable. Books outside the band, or on rows without an alcove, never are.
// Pure so test/lore-reach.test.js can pin it; main.js passes its live geometry.

/**
 * @param b book {x,w,h}; base its foot y on screen; cam camera offset
 * @param n niche box {x,w,t,h}; nicheRows rows with an open alcove; RH row height; H, BM viewport height and bottom margin
 */
export function loreCovered(b, base, cam, n, nicheRows, RH, H, BM) {
  if (b.x + b.w <= n.x || b.x >= n.x + n.w) return false;
  for (const nr of nicheRows) {
    const ny = n.t + (nr * RH - (H - RH - BM)) - cam;
    if (base > ny && base - b.h < ny + n.h) return true;
  }
  return false;
}
