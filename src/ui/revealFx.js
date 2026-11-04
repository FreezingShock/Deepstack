/* Pooled, prewarmed particle engine for the book reveal (and the small bursts around it).
   - Fixed typed-array pool: nothing is allocated per particle or per frame, so a Divine reveal costs the same as a Common one in GC.
   - Sprites (soft dots, streaks, stars, flecks, rings) are rendered once into tiny canvases and drawn with drawImage;
     no gradients, paths or save/restore in the hot loop.
   - warm() builds the sprites and pushes them through the canvas once, off the critical path (idle after boot, again when an
     answer is sent for judging), so the reveal never pays for first-use setup.
   Quality: reads <html data-quality="low|medium|high"> if a quality setting exists, Save-Data and small devices, and backs off
   by itself if frames run long. */
import {revealRecipe, settleRecipe, landRecipe, tint} from './revealRecipes.js';
import {particleVisibility} from './particleMask.js';

const CAP = 1500, RINGS = 12;
const SPR = {dot: 0, streak: 1, star: 2, fleck: 3};

export function qualityScale() {
  let q = 1;
  try {
    const d = document.documentElement.dataset.quality;
    if (d === 'low') q = .3; else if (d === 'medium') q = .6;
    if (navigator.connection && navigator.connection.saveData) q = Math.min(q, .3);
    if ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) q = Math.min(q, .6);
  } catch (e) { /* keep q */ }
  return q;
}

export function createRevealFx({canvas, tiers, palette, feel, reduced = false, now = () => performance.now()}) {
  const c = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1, running = false, last = 0, frame = 0, adapt = 1, ema = 16;
  const f = n => new Float32Array(n);
  const px = f(CAP), py = f(CAP), vx = f(CAP), vy = f(CAP), gy = f(CAP), dr = f(CAP), tt = f(CAP), mx = f(CAP), sz = f(CAP), rt = f(CAP), vr = f(CAP), vis = f(CAP).fill(1), tw = f(CAP);
  const sp = new Uint8Array(CAP), ci = new Uint8Array(CAP);
  let n = 0;
  const rg = {x: f(RINGS), y: f(RINGS), t: f(RINGS), max: f(RINGS), r: f(RINGS), ci: new Uint8Array(RINGS)};
  let rn = 0;
  const R = (a, b) => a + Math.random() * (b - a);
  const RR = r => R(r[0], r[1]);

  /* ---- sprites ---- */
  const sprites = new Map(); // `${kind}|${color}` -> canvas
  const colors = []; // every color seen, indexed by ci
  const colorIx = col => { let i = colors.indexOf(col); if (i < 0) { i = colors.length; colors.push(col); } return i; };
  const mk = (w, h) => { if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(w, h); const e = document.createElement('canvas'); e.width = w; e.height = h; return e; };
  function sprite(kind, col) {
    const key = kind + '|' + col; let s = sprites.get(key); if (s) return s;
    if (kind === 'dot') { s = mk(48, 48); const g = s.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24); gr.addColorStop(0, '#fff'); gr.addColorStop(.18, col); gr.addColorStop(.5, col + '55'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); }
    else if (kind === 'streak') { s = mk(64, 16); const g = s.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, col + '00'); gr.addColorStop(.7, col + 'aa'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.beginPath(); g.ellipse(32, 8, 32, 4.5, 0, 0, 6.3); g.fill(); }
    else if (kind === 'star') { s = mk(48, 48); const g = s.getContext('2d'); g.fillStyle = col; g.beginPath(); g.moveTo(24, 0); g.quadraticCurveTo(24, 24, 48, 24); g.quadraticCurveTo(24, 24, 24, 48); g.quadraticCurveTo(24, 24, 0, 24); g.quadraticCurveTo(24, 24, 24, 0); g.fill(); const gr = g.createRadialGradient(24, 24, 0, 24, 24, 9); gr.addColorStop(0, '#fff'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); }
    else if (kind === 'fleck') { s = mk(16, 10); const g = s.getContext('2d'); g.fillStyle = col; g.fillRect(1, 1, 14, 8); }
    else { s = mk(256, 256); const g = s.getContext('2d'), gr = g.createRadialGradient(128, 128, 96, 128, 128, 126); gr.addColorStop(0, col + '00'); gr.addColorStop(.62, col + 'cc'); gr.addColorStop(.72, col + '55'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
    sprites.set(key, s); return s;
  }
  const palFor = tier => {
    const base = tiers[Math.max(0, Math.min(6, tier | 0))].spine;
    return {base, hot: tint(base, .55), warm: palette.amberFff4d6 || tint(base, .8), paper: palette.parchmentEfe2c0, brass: palette.brass68};
  };
  const warmed = new Set();
  function warmTier(tier) {
    if (warmed.has(tier)) return;
    warmed.add(tier);
    const p = palFor(tier);
    colorIx(p.base); colorIx(p.hot); colorIx(p.warm); colorIx(p.paper); colorIx(p.brass);
    for (const col of [p.base, p.hot, p.warm]) { sprite('dot', col); sprite('streak', col); sprite('star', col); }
    sprite('ring', p.base); sprite('fleck', p.paper); sprite('fleck', p.brass);
  }
  /** Push every sprite through the canvas once at ~zero alpha so the first real frame has nothing left to upload or rasterize. */
  function touch() {
    if (running) return;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .004; c.globalCompositeOperation = 'lighter';
    for (const s of sprites.values()) c.drawImage(s, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, canvas.width, canvas.height);
  }
  function warm(tier) {
    if (reduced) return;
    if (typeof tier === 'number') warmTier(tier); else for (let t = 0; t <= 6; t++) warmTier(t);
    touch();
  }
  let warming = false;
  /** Spread warming over idle slices, one tier each, so boot never takes a long task. */
  function warmIdle() {
    if (reduced || warming) return;
    warming = true; let t = 0;
    const step = () => { if (t > 6) { warming = false; return; } warmTier(t++); touch(); schedule(); };
    const schedule = () => { if (typeof requestIdleCallback === 'function') requestIdleCallback(step, {timeout: 1500}); else setTimeout(step, 120); };
    schedule();
  }

  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  }
  addEventListener('resize', resize); resize();

  /* ---- emit ---- */
  function put(x, y, vx_, vy_, g, drag, delay, life, size, spr, col, o = 0) {
    if (n >= CAP) return -1;
    const i = n++;
    px[i] = x; py[i] = y; vx[i] = vx_; vy[i] = vy_; gy[i] = g; dr[i] = drag; tt[i] = -delay; mx[i] = life; sz[i] = size; sp[i] = SPR[spr]; ci[i] = colorIx(col); rt[i] = o; vr[i] = 0; tw[i] = 0; vis[i] = 1;
    return i;
  }
  function emit(e, x, y, p, q) {
    const cnt = Math.max(1, Math.round((e.n || 0) * q)), delay = e.delay || 0;
    let i0;
    switch (e.k) {
      case 'ring': if (rn < RINGS) { const i = rn++; rg.x[i] = x; rg.y[i] = y; rg.t[i] = -delay; rg.max[i] = e.max; rg.r[i] = e.r; rg.ci[i] = colorIx(p.base); } break;
      case 'spray': for (let i = 0; i < cnt; i++) { const a = R(0, 6.283), s = RR(e.sp); put(x, y, Math.cos(a) * s, Math.sin(a) * s - (e.up || 0), e.g, e.drag, delay + R(0, .05), RR(e.life), RR(e.size), e.spr, e.soft ? p.paper : (Math.random() < e.hot ? p.warm : p.base)); } break;
      case 'spiral': for (let i = 0; i < cnt; i++) { const a = (i / cnt) * 12.566 + R(-.1, .1), s = e.out * R(.6, 1.15), tg = a + 1.5708, k = e.out * .25 * e.spin; put(x, y, Math.cos(a) * s + Math.cos(tg) * k, Math.sin(a) * s + Math.sin(tg) * k - 30, 0, 1.1, delay + i / cnt * .25, RR(e.life), RR(e.size), e.spr, Math.random() < e.hot ? p.warm : p.hot); } break;
      case 'stars': for (let i = 0; i < cnt; i++) { const a = R(0, 6.283), d = RR(e.reach); i0 = put(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, Math.cos(a) * 14, Math.sin(a) * 14 - 8, 0, .4, delay + R(0, .5), RR(e.life), RR(e.size), 'star', Math.random() < .4 ? p.warm : p.hot, R(0, 6.28)); if (i0 >= 0) tw[i0] = R(5, 11); } break;
      case 'rise': for (let i = 0; i < cnt; i++) { const a = R(0, 6.283), d = RR(e.reach); put(x + Math.cos(a) * d, y + Math.sin(a) * d * .5 + 40, R(-18, 18), -R(25, 85) * (e.up || 1), -8, .3, delay + R(0, .6), RR(e.life), RR(e.size), 'dot', Math.random() < .5 ? p.base : p.hot); } break;
      case 'flecks': for (let i = 0; i < cnt; i++) { const a = R(0, 6.283), s = R(60, 240); i0 = put(x, y, Math.cos(a) * s, Math.sin(a) * s - 110, e.g, .8, delay + R(0, .08), RR(e.life), RR(e.size), 'fleck', Math.random() < .5 ? p.paper : p.brass, R(0, 6.28)); if (i0 >= 0) vr[i0] = R(-9, 9); } break;
      case 'rain': for (let i = 0; i < cnt; i++) {
        const dd = delay + R(0, e.over);
        if (e.spr === 'star') { i0 = put(R(.15, .85) * W, -10, R(-12, 12), R(40, 90), 30, .2, dd, RR(e.life), RR(e.size), 'star', Math.random() < .5 ? p.warm : p.hot, R(0, 6.28)); if (i0 >= 0) tw[i0] = R(6, 12); }
        else put(R(0, 1) * W, H + 8, R(-24, 24), -R(60, 150), -10, .3, dd, RR(e.life), RR(e.size), 'dot', Math.random() < .6 ? p.base : p.hot);
      } break;
      case 'implode': for (let i = 0; i < cnt; i++) { const a = R(0, 6.283), d = RR(e.radius), life = e.life * R(.85, 1.1); put(x + Math.cos(a) * d, y + Math.sin(a) * d, -Math.cos(a) * d / life * .9, -Math.sin(a) * d / life * .9, 0, 0, delay + R(0, .18), life, RR(e.size), 'streak', Math.random() < .5 ? p.hot : p.base); } break;
    }
  }
  const ensure = () => { if (!running && (n || rn)) { running = true; last = now(); requestAnimationFrame(loop); } };
  function play(recipe, x, y, tier) {
    if (reduced) return;
    warmTier(tier);
    const q = Math.min(qualityScale(), adapt), p = palFor(tier);
    for (const e of recipe) emit(e, x, y, p, q);
    ensure();
  }

  /* ---- frame ---- */
  function loop(ts) {
    const real = Math.min(.05, (ts - last) / 1000); last = ts;
    // back off for later bursts if frames run long (EMA of real frame time, ms)
    ema += (real * 1000 - ema) * .1; adapt = ema > 30 ? Math.max(.35, adapt * .96) : Math.min(1, adapt + .004);
    const dt = real * (feel ? feel.ts : 1), tnow = now(); frame++;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height);
    c.globalCompositeOperation = 'lighter';
    for (let i = rn - 1; i >= 0; i--) {
      rg.t[i] += dt;
      if (rg.t[i] >= rg.max[i]) { rn--; if (i !== rn) { rg.x[i] = rg.x[rn]; rg.y[i] = rg.y[rn]; rg.t[i] = rg.t[rn]; rg.max[i] = rg.max[rn]; rg.r[i] = rg.r[rn]; rg.ci[i] = rg.ci[rn]; } continue; }
      if (rg.t[i] < 0) continue;
      const u = rg.t[i] / rg.max[i], e = 1 - (1 - u) * (1 - u), rad = 24 + e * rg.r[i];
      c.globalAlpha = (1 - u) * (1 - u) * .55;
      c.drawImage(sprite('ring', colors[rg.ci[i]]), (rg.x[i] - rad) * DPR, (rg.y[i] - rad) * DPR, rad * 2 * DPR, rad * 2 * DPR);
    }
    // integrate + cull (swap-remove)
    for (let i = n - 1; i >= 0; i--) {
      tt[i] += dt;
      if (tt[i] >= mx[i]) {
        n--;
        if (i !== n) { px[i] = px[n]; py[i] = py[n]; vx[i] = vx[n]; vy[i] = vy[n]; gy[i] = gy[n]; dr[i] = dr[n]; tt[i] = tt[n]; mx[i] = mx[n]; sz[i] = sz[n]; rt[i] = rt[n]; vr[i] = vr[n]; vis[i] = vis[n]; tw[i] = tw[n]; sp[i] = sp[n]; ci[i] = ci[n]; }
        continue;
      }
      if (tt[i] < 0) continue;
      vy[i] += gy[i] * dt; const k = 1 - dr[i] * dt; vx[i] *= k; if (dr[i] > .5) vy[i] *= k;
      px[i] += vx[i] * dt; py[i] += vy[i] * dt;
      if ((i + frame) % 3 === 0) vis[i] = particleVisibility(px[i], py[i], tnow);
    }
    // glow kinds additively, then flecks normally
    for (let pass = 0; pass < 2; pass++) {
      c.globalCompositeOperation = pass ? 'source-over' : 'lighter';
      for (let i = 0; i < n; i++) {
        if (tt[i] < 0) continue;
        const k = sp[i]; if ((k === 3) !== (pass === 1)) continue;
        const u = tt[i] / mx[i], col = colors[ci[i]];
        let a = Math.min(1, (1 - u) * 1.6, tt[i] * 8 + .05) * vis[i], s = sz[i];
        if (k === 0) { s *= 2.6 * (1 - u * .4); c.globalAlpha = a; c.setTransform(DPR, 0, 0, DPR, 0, 0); c.drawImage(sprite('dot', col), px[i] - s, py[i] - s, s * 2, s * 2); }
        else if (k === 1) {
          const ang = Math.atan2(vy[i], vx[i]), len = Math.max(6, Math.min(70, Math.hypot(vx[i], vy[i]) * .09)) * (s * .35 + .6), co = Math.cos(ang) * DPR, si = Math.sin(ang) * DPR;
          c.globalAlpha = a; c.setTransform(co, si, -si, co, px[i] * DPR, py[i] * DPR); c.drawImage(sprite('streak', col), -len, -s * .9, len, s * 1.8);
        } else if (k === 2) {
          s *= 2.4 * (1 + .35 * Math.sin(tt[i] * tw[i] + rt[i])) * (1 - u * .35); c.globalAlpha = a * .9; c.setTransform(DPR, 0, 0, DPR, 0, 0); c.drawImage(sprite('star', col), px[i] - s, py[i] - s, s * 2, s * 2);
        } else {
          const ang = rt[i] + tt[i] * vr[i], co = Math.cos(ang) * DPR, si = Math.sin(ang) * DPR; c.globalAlpha = a * .9; c.setTransform(co, si, -si, co, px[i] * DPR, py[i] * DPR); c.drawImage(sprite('fleck', col), -s, -s * .6, s * 2, s * 1.2);
        }
      }
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (n || rn) requestAnimationFrame(loop); else { running = false; c.clearRect(0, 0, canvas.width, canvas.height); }
  }

  return {
    warm, warmIdle,
    reveal(x, y, tier) { play(revealRecipe(tier), x, y, tier); },
    settle(x, y, tier) { play(settleRecipe(tier), x, y, tier); },
    land(x, y, tier) { play(landRecipe(tier), x, y, tier); },
    /** one small spark (candle embers, ink puffs) */
    spark(x, y, vx_, vy_, g, life, size, col) { if (reduced) return; put(x, y, vx_, vy_, g, .3, 0, life, size, 'dot', col); ensure(); },
    get live() { return n + rn; }, get capacity() { return CAP; }, get quality() { return Math.min(qualityScale(), adapt); },
    get spriteCount() { return sprites.size; },
  };
}
