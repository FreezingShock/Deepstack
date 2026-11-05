/* Physical sanity for the shelf world: pure geometry the canvas renderer, the lore hit test and the
   tests share. A leaning book rests on the bottom corner of the side it leans toward, only leans when
   a neighbour is there to take its weight, and nothing stands on a pillar or over a cracked plank. */

/** x of the book's resting corner, relative to its centre: the side it leans toward (0 when upright). */
export const footPivot = (tilt, w) => (tilt > 0 ? w / 2 : tilt < 0 ? -w / 2 : 0);

/** Lean the canvas about the book's resting corner. Call after translating to the book's foot centre. */
export function tiltAboutFoot(ctx, tilt, w) {
  const p = footPivot(tilt, w);
  ctx.translate(p, 0); ctx.rotate(tilt); ctx.translate(-p, 0);
}

/** Where a point in the canvas lands in the book's own frame (inverse of tiltAboutFoot). lx, ly from the foot centre. */
export function untilt(lx, ly, tilt, w) {
  const ox = footPivot(tilt, w), dx = lx - ox, s = Math.sin(-tilt), k = Math.cos(-tilt);
  return [ox + dx * k - ly * s, dx * s + ly * k];
}

const MIN_LEAN = 0.03;   // below ~1.7 degrees a book just reads as upright
const MAX_GAP = 0.5;     // a gap wider than half the book's height and it would fall, not lean

/** Largest angle (rad) book i can lean toward `dir` (+1 right, -1 left) before it would pass through
    or slide off its neighbour, or null when nothing there can hold it. bs is sorted by x. */
export function leanAllowance(bs, i, dir) {
  const b = bs[i], n = bs[i + dir];
  if (!n || n.lying) return null;
  const gap = dir > 0 ? n.x - (b.x + b.w) : b.x - (n.x + n.w);
  if (gap > b.h * MAX_GAP || n.h < b.h * 0.55) return null;
  const hc = Math.min(b.h, n.h); // it touches at the neighbour's top at the latest
  const nt = n.tilt || 0, over = nt * dir > 0 ? hc * Math.sin(Math.abs(nt)) : 0; // a neighbour leaning away makes room
  return Math.asin(Math.min(0.6, Math.max(0, (Math.max(0, gap) + over) / hc)));
}

/** Settle a row of books in place. Each has {x, w, h, tilt, lean, rnd}: `lean` is the whole shelf racking
    inward (kept), `rnd` is this book slumping on its own (kept only if something holds it). */
export function settleBooks(bs) {
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i]; if (b.lying) { b.tilt = 0; continue; }
    const lean = b.lean || 0, rnd = b.rnd || 0; let res = rnd;
    if (Math.abs(rnd) >= MIN_LEAN) {
      const s = Math.sign(rnd), a1 = leanAllowance(bs, i, s);
      if (a1 != null) res = s * Math.min(Math.abs(rnd), a1);
      else { const a2 = leanAllowance(bs, i, -s); res = a2 != null ? -s * Math.min(Math.abs(rnd), a2) : 0; }
      if (Math.abs(res) < MIN_LEAN) res = 0;
    } else res = 0;
    b.tilt = lean + res;
  }
  return bs;
}

/** How far a book lying on its side spreads along the shelf (it is drawn h*.7 wide). */
export const lyingFootprint = b => Math.max(b.w, b.h * 0.7);

/** Half-width of a floor prop, so it can be kept clear of pillars and cracks. */
export function propHalf(pr) {
  switch (pr.k) {
    case 'plate': return 14;
    case 'papers': return (pr.w || 30) / 2 + 3;
    case 'skull': return 15 * (pr.s || 1);
    case 'bones': return 22 * (pr.s || 1);
    case 'urn': return 12;
    case 'tendril': return 18;
    case 'brazier': return 12;
    default: return 5;
  }
}

/** Slide x out of the band [lo, hi] to whichever edge is nearer (half = the prop's own half-width). */
export function clearOfSpan(x, half, lo, hi) {
  if (x + half <= lo || x - half >= hi) return x;
  return x - lo < hi - x ? lo - half : hi + half;
}

/** Keep a prop off the pillars (W/3 apart, 14 wide) and out of a cracked stretch of plank. */
export function placeProp(x, half, W, crack) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 3; i++) x = clearOfSpan(x, half, i * W / 3 - 8, i * W / 3 + 8);
    if (crack) x = clearOfSpan(x, half, crack.x, crack.x + crack.w);
  }
  return Math.max(half + 8, Math.min(W - half - 8, x));
}
