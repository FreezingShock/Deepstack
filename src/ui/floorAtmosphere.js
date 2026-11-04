// Per-floor air and light, drawn over the world but under the lamp glow and HUD.
// Fog drifts in low bands, the Sunken Vault gets rippling caustics, the Abyss breathes.
// Everything is a handful of gradients/strokes per frame, and none of it is particles.
const TAU = Math.PI * 2;

export function drawFloorAtmosphere(ctx, W, H, atm, t, lx, ly, still) {
  const [r, g, b, fa] = atm.fog, ph = still ? 0 : t;
  if (fa > .004) { // two slow bands of haze, thicker toward the bottom edge
    const col = `${r | 0},${g | 0},${b | 0}`;
    for (let i = 0; i < 2; i++) {
      const cy = H * (i ? .78 : .5) + Math.sin(ph * (.12 + i * .07) + i * 2) * H * .06;
      const gr = ctx.createLinearGradient(0, cy - H * .32, 0, cy + H * .32);
      const al = fa * (i ? .8 : .5) * (.75 + .25 * Math.sin(ph * .2 + i));
      gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(.5, `rgba(${col},${al})`); gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr; ctx.fillRect(0, cy - H * .32, W, H * .64);
    }
  }
  if (atm.vig > .005) { // tightening vignette, deeper floors close in around the lamp
    const pul = atm.pulse * (still ? 0 : .05 * Math.sin(t * 1.3));
    const rad = Math.hypot(W, H) * (.55 - atm.vig * .4 + pul);
    const gr = ctx.createRadialGradient(lx, ly, rad * .35, lx, ly, rad);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${atm.vig * 1.6})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  if (atm.shimmer > .01) { // caustics: slow wavy light threads sinking through the water
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(90,220,230,${.05 * atm.shimmer})`;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      const y0 = H * (k + .5) / 5;
      for (let x = 0; x <= W; x += 24) {
        const y = y0 + Math.sin(x * .012 + ph * .5 + k * 1.7) * 14 + Math.sin(x * .031 - ph * .8 + k) * 6;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
