// The alcove as a reading nook: a desk edge under the word with an open book, an inkwell and a quill on it,
// the candle's light pooling across the wood, and this run's books standing on the desk.
// Also keeps floor effects (water, fog, vignette, tint) out of the alcove, so the nook stays visually clean.
import {PALETTE} from '../theme/colors.js';

// How deep the desk's top surface is, and how much room the page leaves for it. Wide screens let the books stand
// beside the answer controls, so nothing is reserved; phones reserve a strip (`reserve`) so the earned books stand
// in it, below the controls, and never taller than the strip (`maxBookH`).
export function nookMetrics(w) {
  const phone = w < 640;
  const D = phone ? 64 : 40, S = phone ? 14 : 22;
  const inset = Math.round(S * .45); // books stand this far above the desk's front edge
  return {phone, D, S, inset, reserve: phone ? D : 0, maxBookH: phone ? D - inset - 2 : 0};
}

// Screen-space rects of alcoves (frame, plaque, ledge included) to keep floor effects away from.
export function alcoveRects(niches, box, rowH, H, BM, cam) {
  const out = [];
  for (const nr of niches) {
    const y = box.t + (nr * rowH - (H - rowH - BM)) - cam;
    if (y > H + 40 || y + box.h < -40) continue;
    out.push({x: box.x - 16, y: y - 18, w: box.w + 32, h: box.h + 18 + 16, r: Math.min(52, box.w * .09) + 10});
  }
  return out;
}

// Adds the alcove shapes to the current path, for an even-odd clip that excludes them.
export function alcovePath(ctx, rects) {
  for (const q of rects) {
    const r = Math.min(q.r, q.w / 2);
    ctx.moveTo(q.x, q.y + q.h); ctx.lineTo(q.x, q.y + r);
    ctx.arc(q.x + r, q.y + r, r, Math.PI, 1.5 * Math.PI);
    ctx.lineTo(q.x + q.w - r, q.y);
    ctx.arc(q.x + q.w - r, q.y + r, r, 1.5 * Math.PI, 2 * Math.PI);
    ctx.lineTo(q.x + q.w, q.y + q.h); ctx.closePath();
  }
}

// Runs fn with everything inside the alcoves clipped out, so it paints the wall and floor around them only.
export function paintAroundAlcoves(ctx, W, H, rects, fn) {
  if (!rects.length) { fn(); return; }
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); alcovePath(ctx, rects); ctx.clip('evenodd');
  fn();
  ctx.restore();
}

function openBook(c, x, y, w, h) { // lying flat on the desk, seen from the front and above; (x,y) = front-left corner
  const hw = w / 2, th = Math.max(2, h * .22);
  c.save();
  c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x + hw, y + 1, hw * 1.05, 2.5, 0, 0, 6.3); c.fill();
  c.fillStyle = PALETTE.oak16; c.fillRect(x - 1, y - th, w + 2, th + 1); // cover edge
  c.fillStyle = PALETTE.bronze35; c.fillRect(x - 1, y - th, w + 2, 1);
  const pg = (px, dir) => { // one page block, rising slightly toward the gutter
    c.beginPath(); c.moveTo(px, y - th); c.lineTo(px + dir * hw, y - th - 1.5); c.lineTo(px + dir * hw, y - th - h * .78); c.lineTo(px + dir * .5, y - th - h * .8 + 1); c.closePath();
    const g = c.createLinearGradient(px, 0, px + dir * hw, 0); g.addColorStop(0, PALETTE.parchment85); g.addColorStop(1, PALETTE.parchmentDim); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(58,40,25,.45)'; c.lineWidth = .7;
    for (let k = 1; k <= 3; k++) { const t = k / 4; c.beginPath(); c.moveTo(px + dir * 5, y - th - h * (.1 + .6 * t)); c.lineTo(px + dir * (hw - 5), y - th - h * (.1 + .6 * t) - 1); c.stroke(); }
  };
  pg(x + hw - .5, -1); pg(x + hw + .5, 1);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x + hw - 1, y - th - h * .8, 2, h * .8); // gutter shadow
  c.strokeStyle = PALETTE.blood43; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + hw + 2, y - th - h * .4); c.lineTo(x + hw + 5, y - th + 5); c.stroke(); // ribbon
  c.restore();
}

function inkwell(c, x, y, s) { // pot with a quill leaning out of it; (x,y) = base centre
  c.save();
  c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x, y + 1, 7 * s, 2.2 * s, 0, 0, 6.3); c.fill();
  c.fillStyle = PALETTE.oak7; c.beginPath(); c.moveTo(x - 6 * s, y); c.lineTo(x - 5 * s, y - 8 * s); c.lineTo(x + 5 * s, y - 8 * s); c.lineTo(x + 6 * s, y); c.closePath(); c.fill();
  c.fillStyle = PALETTE.bronze35; c.fillRect(x - 5.5 * s, y - 9 * s, 11 * s, 2 * s);
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x - 4 * s, y - 7 * s, 1.4 * s, 6 * s);
  c.strokeStyle = PALETTE.parchmentDim; c.lineWidth = Math.max(1, 1.3 * s); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + 1 * s, y - 9 * s); c.lineTo(x + 11 * s, y - 24 * s); c.stroke();
  c.strokeStyle = PALETTE.parchment85; c.lineWidth = Math.max(.8, s); c.beginPath(); c.moveTo(x + 11 * s, y - 24 * s); c.lineTo(x + 16 * s, y - 31 * s); c.stroke();
  c.restore();
}

// Desk surface and props. (x, y, w, h) is the alcove box on screen; the surface fills its bottom S pixels.
export function drawNook(c, o) {
  const {x, y, w, h, lc} = o, m = nookMetrics(w), top = y + h - m.S;
  c.save();
  // the desk top: wood in a lighter band with a faint grain, shaded at the back where it meets the wall
  const g = c.createLinearGradient(0, top, 0, y + h);
  g.addColorStop(0, PALETTE.oak16); g.addColorStop(1, PALETTE.oak24); c.fillStyle = g; c.fillRect(x, top, w, m.S);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x, top, w, 2);
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1;
  for (let gy = top + 5; gy < y + h - 2; gy += 5) { c.beginPath(); c.moveTo(x, gy + .5); c.lineTo(x + w, gy + .5); c.stroke(); }
  // candle light pooling on the wood, from the left where the candle stands
  const lx = x + (m.phone ? w * .5 : 64), lg = c.createRadialGradient(lx, y + h - m.S * .4, 0, lx, y + h - m.S * .4, m.phone ? w * .55 : 190);
  lg.addColorStop(0, `rgba(${lc[0]},${lc[1]},${lc[2]},.3)`); lg.addColorStop(1, `rgba(${lc[0]},${lc[1]},${lc[2]},0)`);
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = lg; c.fillRect(x, top, w, m.S); c.restore();
  // props: an open book, then an inkwell with a quill (phones keep the bare desk: the books stand on it)
  if (!m.phone) { const bw = 90, bx = x + 78, by = y + h - m.S * .35; openBook(c, bx, by, bw, 16); inkwell(c, bx + bw + 20, y + h - m.S * .38, .85); }
  c.restore();
}
