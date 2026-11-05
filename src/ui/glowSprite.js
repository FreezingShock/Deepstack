/* Cached radial glows (backlog 38). Full-screen radial gradients were rebuilt and shaded every frame; here each
   distinct falloff is rendered once into a small canvas and stamped with one scaled drawImage. Alpha is applied
   with globalAlpha (a linear scale of the gradient's alpha stops, so the result is the same as the live gradient),
   which lets per-frame flicker change nothing but a number. */
const SIZE = 96, cache = new Map();

/** The sprite for a gradient from `inner` (fraction of the radius, 0 = centre) to the edge. stops: [[offset, 'rgba(...)'], ...] across 0..1. */
export function glowSprite(key, stops) {
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = SIZE;
  const g = c.getContext('2d'), h = SIZE / 2, gr = g.createRadialGradient(h, h, 0, h, h, h);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, SIZE, SIZE);
  if (cache.size > 160) cache.clear(); // colours are quantised by callers; this is only a safety net
  cache.set(key, c); return c;
}

/** Build a glow into the cache ahead of its first frame and push it through a scratch canvas once (near-zero alpha), so the first real stamp has nothing left to rasterize or upload. */
export function warmGlow(key, stops, scratch) {
  const s = glowSprite(key, stops);
  if (scratch) { scratch.globalAlpha = .004; scratch.drawImage(s, 0, 0, 2, 2); }
  return s;
}

/** Stamp a glow centred on (cx, cy) with radius r, clipped to the W x H canvas. Pixels beyond r take the edge colour, as a padded gradient would. */
export function stampGlow(ctx, sprite, cx, cy, r, alpha = 1) {
  const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha;
  ctx.drawImage(sprite, cx - r, cy - r, r * 2, r * 2);
  ctx.globalAlpha = a;
}

/** Fill everything outside the square the sprite covers with one flat colour (for glows whose edge colour is opaque, e.g. the lamp vignette). */
export function fillOutside(ctx, W, H, cx, cy, r, style) {
  const x0 = Math.max(0, cx - r), x1 = Math.min(W, cx + r), y0 = Math.max(0, cy - r), y1 = Math.min(H, cy + r);
  ctx.fillStyle = style;
  if (y0 > 0) ctx.fillRect(0, 0, W, y0);
  if (y1 < H) ctx.fillRect(0, y1, W, H - y1);
  if (x0 > 0) ctx.fillRect(0, y0, x0, y1 - y0);
  if (x1 < W) ctx.fillRect(x1, y0, W - x1, y1 - y0);
}
