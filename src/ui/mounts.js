/* Mounts: the bolts, plates and cast shadows that show what a wall-hung thing hangs from, so nothing
   hangs from nothing. Geometry is pure (and tested); the draw helpers only paint into a given 2D context. */

/** Bolt centres for a plaque rect: one in each end, on the vertical centre line, inset from the edge.
 *  Every point lies inside the rect (that is what "the bolt is in the plaque" means). */
export function plaqueBolts(x, y, w, h, inset = 5) {
  const cy = y + h / 2, ix = Math.min(inset, w / 4);
  return [[x + ix, cy], [x + w - ix, cy]];
}

/** A wall plate behind a hung point: centred on the anchor, capped so it never grows past the frame. */
export function anchorPlate(ax, ay, w = 14, h = 6) {
  return {x: ax - w / 2, y: ay - h / 2, w, h, bolts: [[ax, ay]]};
}

/** Domed iron bolt with a slot and a catch-light. */
export function drawBolt(ctx, x, y, r = 2) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.arc(x + .6, y + .9, r + .5, 0, 6.3); ctx.fill();
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, 0, x, y, r);
  g.addColorStop(0, '#e2c88e'); g.addColorStop(.55, '#8a6a3c'); g.addColorStop(1, '#2d2012');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
  ctx.strokeStyle = 'rgba(10,6,3,.8)'; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.moveTo(x - r * .6, y + r * .25); ctx.lineTo(x + r * .6, y - r * .25); ctx.stroke();
  ctx.restore();
}

/** Soft shadow a flat plate casts on the wall behind it (down and a little to the side, light is above). Draw first. */
export function drawWallShadow(ctx, x, y, w, h, depth = 5) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = depth * 1.8; ctx.shadowOffsetX = depth * .25; ctx.shadowOffsetY = depth;
  ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Shadow and bolts for a hung rectangular plaque. Call shadow before the plaque, bolts after. */
export const plaqueShadow = (ctx, x, y, w, h) => drawWallShadow(ctx, x, y, w, h, 4);
export function plaqueMount(ctx, x, y, w, h) {
  for (const [bx, by] of plaqueBolts(x, y, w, h)) drawBolt(ctx, bx, by, 1.9);
}
