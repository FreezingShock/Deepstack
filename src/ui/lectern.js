/* Reading stand under the held book: a slanted desk with a lip the book rests on, a turned column and a
   foot, so the pulled book is presented on something instead of hovering. Geometry is pure and tested. */

/** Where every part of the stand sits for a book whose base centre is (px, py), drawn bw x bh at scale s.
 *  rise 0..1 lifts the stand up out of the dark with the pull. */
export function lecternGeom(px, py, bw, bh, s, rise = 1) {
  const W = bw * s, H = bh * s;
  const deskW = W * 1.9, lipH = Math.max(5, H * .07);
  const colH = H * .42, drop = (1 - rise) * H * .5;
  const top = py + lipH * .35 + drop;                       // the book's base sits on the lip, slightly sunk into it
  return {
    lip: {x: px - deskW / 2, y: top - lipH * .65, w: deskW, h: lipH},
    back: {x: px - deskW * .42, y: py - H * .55 + drop, w: deskW * .84, h: H * .55 + lipH * .3},   // slanted board behind the book
    column: {x: px - W * .16, y: top + lipH * .35, w: W * .32, h: colH},
    foot: {x: px - deskW * .38, y: top + lipH * .35 + colH, w: deskW * .76, h: lipH * .9},
    shadow: {cx: px, cy: top + lipH * .35 + colH + lipH, rx: deskW * .55, ry: lipH * 1.2},
  };
}

/** Part of the book's footprint that rests on the lip, 0..1: the support test. */
export function lipSupport(g, px, bw, s) {
  const a = Math.max(g.lip.x, px - bw * s / 2), b = Math.min(g.lip.x + g.lip.w, px + bw * s / 2);
  return Math.max(0, b - a) / (bw * s);
}

function wood(ctx, x, y, w, h, c0, c1, horiz) {
  const g = horiz ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c0); g.addColorStop(.5, c1); g.addColorStop(1, c0);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

/** Everything behind the book (shadow, foot, column, slanted back board). */
export function drawLecternBack(ctx, g, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(g.shadow.cx, g.shadow.cy, g.shadow.rx, g.shadow.ry, 0, 0, 6.3); ctx.fill();
  wood(ctx, g.foot.x, g.foot.y, g.foot.w, g.foot.h, '#1a110a', '#3a281a', true);
  wood(ctx, g.column.x, g.column.y, g.column.w, g.column.h, '#1c120b', '#4a3420', true);
  ctx.fillStyle = '#6a4d30'; ctx.fillRect(g.column.x, g.column.y + g.column.h * .45, g.column.w, 1.6);   // turned ring
  wood(ctx, g.back.x, g.back.y, g.back.w, g.back.h, '#150d08', '#2e2013', true);
  ctx.strokeStyle = '#6a4d30'; ctx.lineWidth = 1; ctx.strokeRect(g.back.x + .5, g.back.y + .5, g.back.w - 1, g.back.h);
  ctx.restore();
}

/** The lip, drawn over the book's bottom edge so the book sits in it. */
export function drawLecternLip(ctx, g, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  wood(ctx, g.lip.x, g.lip.y, g.lip.w, g.lip.h, '#2a1b10', '#5a3f25', false);
  ctx.fillStyle = '#b08a56'; ctx.fillRect(g.lip.x, g.lip.y, g.lip.w, 1.4);
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(g.lip.x, g.lip.y + g.lip.h - 1.5, g.lip.w, 1.5);
  ctx.restore();
}
