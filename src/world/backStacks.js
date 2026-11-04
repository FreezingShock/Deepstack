/* Parallax back stacks: a dim second row of shelves behind the main ones, seen through the gaps between books
   and above the spines. One small cached tile per floor (built once, blitted a few times a frame), scrolled at a
   fraction of the camera so the library reads as deep. Pure layout in `backLayout`; canvas work in the rest.
   Off on the low quality tier (rows then keep their own wall, see world.js). */
import {hex, mixc, rgbs} from '../ui/bookArt.js';
import {mulberry} from '../core/daily.js';

export const BACK_FACTOR = 0.55; // how much of the camera the back stacks follow
export const BACK_SCALE = 0.72;  // they stand further away, so everything is a little smaller

export const tileHeight = RH => Math.max(48, Math.round(RH * BACK_SCALE));

/** Deterministic shapes for one floor's tile: {pillars:[x], books:[{x,w,h,lean,k}]}. k picks a shade 0..1. */
export function backLayout(fl, W, TH) {
  const rng = mulberry(7001 + fl.id * 131);
  const pillars = [];
  for (let i = 0; i < 3; i++) pillars.push(Math.round(W * (i * 2 + 1) / 6)); // between the main pillars (which sit on thirds)
  const books = [], plank = Math.max(4, Math.round(TH * 0.05)), room = TH - plank - 4;
  const hole = Math.min(0.7, 0.04 + (fl.decay || 0) * 0.35 + (fl.gap || 0)); // deeper floors lose more of their back books
  let x = -4;
  while (x < W + 10) {
    const w = (8 + rng() * 14) * BACK_SCALE;
    if (rng() < hole) { x += w * (0.6 + rng() * 1.2); continue; }
    books.push({x, w, h: room * (0.5 + rng() * 0.42), lean: rng() < 0.06 + (fl.decay || 0) * 0.2 ? (rng() - 0.5) * 0.3 : 0, k: rng()});
    x += w + (rng() < 0.1 ? 2 + rng() * 8 : 0.5);
  }
  return {pillars, books, plank};
}

/** Draw one tile into canvas context `o` (already scaled to css px). Colours come from the floor's own tokens. */
export function paintTile(o, fl, W, TH) {
  const top = hex(fl.wallTop), bot = hex(fl.wallBot), led = hex(fl.ledge), bk = fl.books[0];
  const L = backLayout(fl, W, TH);
  const g = o.createLinearGradient(0, 0, 0, TH);
  g.addColorStop(0, rgbs(mixc(top, [0, 0, 0], 0.3))); g.addColorStop(1, rgbs(mixc(bot, [0, 0, 0], 0.15)));
  o.fillStyle = g; o.fillRect(0, 0, W, TH);
  o.fillStyle = rgbs(mixc(led, [0, 0, 0], 0.5)); // far pillars
  for (const px of L.pillars) { o.fillRect(px - 6, 0, 12, TH); }
  o.fillStyle = 'rgba(255,255,255,.04)';
  for (const px of L.pillars) o.fillRect(px - 4, 0, 1.5, TH);
  const base = TH - L.plank;
  for (const b of L.books) {
    const c = mixc(mixc(bk, led, 0.25 + b.k * 0.4), [0, 0, 0], 0.4);
    o.save(); o.translate(b.x + b.w / 2, base);
    if (b.lean) o.rotate(b.lean);
    o.fillStyle = rgbs(c); o.fillRect(-b.w / 2, -b.h, b.w, b.h);
    o.fillStyle = 'rgba(255,255,255,.05)'; o.fillRect(-b.w / 2, -b.h, b.w, 1);
    o.fillStyle = 'rgba(0,0,0,.35)'; o.fillRect(b.w / 2 - 1.5, -b.h, 1.5, b.h);
    o.restore();
  }
  o.fillStyle = rgbs(mixc(led, [0, 0, 0], 0.35)); o.fillRect(0, base, W, L.plank);
  o.fillStyle = 'rgba(0,0,0,.3)'; o.fillRect(0, base - 2, W, 2);
  const haze = o.createLinearGradient(0, 0, 0, TH); // each bay is darkest at its top, like a shelf shadowing the one below
  haze.addColorStop(0, 'rgba(0,0,0,.4)'); haze.addColorStop(0.6, 'rgba(0,0,0,.08)'); haze.addColorStop(1, 'rgba(0,0,0,.2)');
  o.fillStyle = haze; o.fillRect(0, 0, W, TH);
}

let cache = new Map(), key = '';
export function resetBackStacks() { cache = new Map(); key = ''; }

function tileFor(fl, W, RH, DPR) {
  const k = W + 'x' + RH + 'x' + DPR;
  if (k !== key) { cache = new Map(); key = k; }
  let t = cache.get(fl.id);
  if (!t) {
    const TH = tileHeight(RH), cv = document.createElement('canvas');
    cv.width = Math.ceil(W * DPR); cv.height = Math.ceil(TH * DPR);
    const o = cv.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0);
    paintTile(o, fl, W, TH);
    t = {cv, TH}; cache.set(fl.id, t);
  }
  return t;
}

/** Fill screen band [y0,y1) with floor `fl`'s back stacks, scrolled at BACK_FACTOR of the camera. */
export function drawBackStacks(ctx, fl, {W, RH, DPR, cam, y0, y1}) {
  const {cv, TH} = tileFor(fl, W, RH, DPR), off = cam * BACK_FACTOR;
  for (let sy = Math.floor(y0); sy < y1;) {
    let t = Math.round((((sy + off) % TH) + TH) % TH * DPR) / DPR; if (t >= TH) t = 0; // rounding can land on the seam
    const h = Math.max(1, Math.min(Math.ceil(TH - t), Math.ceil(y1) - sy)); // whole css pixels, never zero, so the loop always advances
    ctx.drawImage(cv, 0, Math.round(t * DPR), cv.width, Math.max(1, Math.round(h * DPR)), 0, sy, W, h);
    sy += h;
  }
}
