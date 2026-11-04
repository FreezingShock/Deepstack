import {PALETTE} from '../theme/colors.js';
// Back-wall dressing and floor props for the deepest floors (The Hollow, The Abyss).
// Everything here is static, so rows that use it can be cached as bitmaps.
import {mulberry} from '../core/daily.js';

// Wall behind the books. `rg` is a seeded rng so a row always looks the same.
export function deepWall(c, fl, x0, x1, y, base, rh, r) {
  const rg = mulberry(r * 97 + 5);
  c.save();
  if (fl.motif === 'hollow') {
    // empty shelf boards receding into the dark, with pale hanging chains
    c.globalAlpha = .5; c.strokeStyle = PALETTE.violet18Alpha99; c.lineWidth = 1.5;
    for (let k = 1; k < 4; k++) { const yy = y + (base - y) * k / 4; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke(); }
    c.globalAlpha = .45; c.strokeStyle = PALETTE.violet45; c.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const cx = x0 + rg() * (x1 - x0), len = (base - y) * (.3 + rg() * .4);
      for (let yy = y; yy < y + len; yy += 7) { c.beginPath(); c.ellipse(cx, yy + 3, 2, 3.4, 0, 0, 6.3); c.stroke(); }
    }
    // a pair of eyes in the gaps, sometimes
    if (rg() < .55) {
      const ex = x0 + 40 + rg() * (x1 - x0 - 80), ey = y + (base - y) * (.25 + rg() * .45);
      c.globalAlpha = .75; c.fillStyle = PALETTE.violet86; c.shadowColor = PALETTE.violet77; c.shadowBlur = 8;
      c.beginPath(); c.ellipse(ex, ey, 2.4, 1.5, 0, 0, 6.3); c.ellipse(ex + 11, ey, 2.4, 1.5, 0, 0, 6.3); c.fill();
    }
  } else if (fl.motif === 'abyss') {
    // faint glowing glyphs scratched into the stone
    c.globalAlpha = .55; c.lineCap = 'round'; c.shadowColor = PALETTE.blood58; c.shadowBlur = 6;
    const n = 2 + ((rg() * 4) | 0);
    for (let i = 0; i < n; i++) {
      const gx = x0 + 30 + rg() * (x1 - x0 - 60), gy = y + 14 + rg() * (base - y - 60), s = 10 + rg() * 12;
      c.strokeStyle = `rgba(255,${50 + ((rg() * 60) | 0)},${70 + ((rg() * 50) | 0)},${.35 + rg() * .35})`; c.lineWidth = 1.4;
      c.beginPath();
      const segs = 3 + ((rg() * 3) | 0);
      let px = gx, py = gy; c.moveTo(px, py);
      for (let k = 0; k < segs; k++) { px += (rg() - .5) * s * 1.6; py += (rg() - .3) * s; c.lineTo(px, py); }
      c.stroke();
      c.beginPath(); c.arc(gx, gy + s * .4, s * .55, 0, 6.3); c.stroke();
    }
  }
  c.restore();
}

// Floor props standing on the ledge: pr.k is 'candle' | 'urn' | 'tendril'.
export function deepProp(c, pr, base) {
  c.save(); c.translate(pr.x, base);
  if (pr.k === 'urn') {
    c.fillStyle = PALETTE.violet11; c.beginPath(); c.moveTo(-7, 0); c.quadraticCurveTo(-12, -16, -5, -24); c.lineTo(5, -24); c.quadraticCurveTo(12, -16, 7, 0); c.closePath(); c.fill();
    c.fillStyle = PALETTE.whiteAlpha12; c.fillRect(-4, -22, 1.5, 18);
  } else if (pr.k === 'candle') { // a long-cold stub with one pale drip
    c.fillStyle = PALETTE.ash55; c.fillRect(-3, -14, 6, 14); c.fillStyle = PALETTE.violet74; c.fillRect(-3, -14, 6, 2); c.fillRect(1, -12, 2, 7);
  } else if (pr.k === 'tendril') { // dark roots creeping up from below
    c.strokeStyle = PALETTE.oak1a0a12; c.lineWidth = 3; c.lineCap = 'round';
    const g = mulberry(pr.seed);
    for (let i = 0; i < 3; i++) { const x = (i - 1) * 9; c.beginPath(); c.moveTo(x, 2); c.bezierCurveTo(x + (g() - .5) * 20, -10, x + (g() - .5) * 24, -20, x + (g() - .5) * 18, -28 - g() * 14); c.stroke(); }
  }
  c.restore();
}

// Props for a row of a deep floor (positions only; drawn by deepProp).
export function deepProps(fl, W, rng) {
  const out = [];
  if (fl.motif === 'hollow') {
    for (let x = 40 + rng() * 80; x < W - 30; x += 90 + rng() * 170) out.push({k: rng() < .5 ? 'candle' : 'urn', x});
  } else if (fl.motif === 'abyss') {
    for (let x = 30 + rng() * 80; x < W - 30; x += 110 + rng() * 200) out.push({k: 'tendril', x, seed: (rng() * 999) | 0});
  }
  return out;
}
