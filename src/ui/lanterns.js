/* Alcove lanterns: each hangs from an iron chain bolted to the arch and swings like a real pendulum.
   One damped-pendulum state per lantern, stepped inside the existing canvas frame (no extra rAF, no DOM,
   no layout reads). The cursor pushes a lantern as it nears or sweeps past, and the glow warms with
   proximity and swing. prefers-reduced-motion / the in-game setting: lanterns hang still. */
import {reducedMotion} from './settings.js';

const RM = reducedMotion();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ptr = {x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0, on: false, step: 0};
const states = new Map();
let bound = false;

function bind() {
  if (bound || RM || typeof window === 'undefined') return;
  bound = true;
  addEventListener('pointermove', e => {
    const t = performance.now(), dt = Math.max(8, t - ptr.t);
    if (ptr.on) {
      ptr.vx = ptr.vx * .5 + clamp((e.clientX - ptr.x) / dt * 1000, -1600, 1600) * .5;
      ptr.vy = ptr.vy * .5 + clamp((e.clientY - ptr.y) / dt * 1000, -1600, 1600) * .5;
    }
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = t; ptr.on = true;
  }, {passive: true});
  document.addEventListener('mouseleave', () => { ptr.on = false; ptr.x = ptr.y = -1e4; });
}

const K = 9, DAMP = .85, REACH = 105, LIMIT = .85;

function stateFor(id, now, ay) {
  let s = states.get(id);
  if (!s) { s = {th: 0, w: 0, hot: 0, last: now, ay, ph: (id.length * 7 + id.charCodeAt(id.length - 1)) % 17}; states.set(id, s); }
  return s;
}

/** draw one chain-hung lantern. o: {id, ax, ay (anchor), len (chain), lc (lamp rgb), a (decay 0..1), now} */
export function drawLantern(ctx, o) {
  bind();
  const {ax, ay, len, lc, a, now} = o, d = len + 21;
  const s = stateFor(o.id, now, ay);
  const dt = clamp((now - s.last) / 1000, 0, .05); s.last = now;
  const sway = s.ph, fk = .75 + .25 * Math.sin(now / 95 + sway) + .08 * Math.sin(now / 37 + sway);
  let hot = 0;
  if (!RM) {
    // world position of the lantern body (screen coords) for the cursor test
    const cx = ax - Math.sin(s.th) * d, cy = ay + Math.cos(s.th) * d;
    const dx = cx - ptr.x, dy = cy - ptr.y, dist = Math.hypot(dx, dy);
    const prox = ptr.on ? clamp(1 - dist / REACH, 0, 1) : 0, f = prox * prox * (3 - 2 * prox);
    // the camera scrolling a lantern past a still cursor counts as the cursor passing it
    const camV = dt > 0 ? (ay - s.ay) / dt : 0; s.ay = ay;
    const rel = clamp(ptr.vy - camV, -1600, 1600);
    let acc = -K * Math.sin(s.th) - DAMP * s.w;
    acc += 0.35 * Math.sin(now / 1900 + sway) + .18 * Math.sin(now / 777 + sway * 2);                // faint draught
    acc += -(ptr.vx / d) * f * 2.6 + Math.sign(dx || 1) * (Math.abs(rel) / d) * f * 1.6;             // cursor shove
    s.w += acc * dt; s.th += s.w * dt;
    if (Math.abs(s.th) > LIMIT) { s.th = Math.sign(s.th) * LIMIT; s.w *= -.3; }
    // cursor velocity fades each frame (once, however many lanterns drew)
    if (ptr.step !== now) { ptr.step = now; ptr.vx *= Math.exp(-dt * 7); ptr.vy *= Math.exp(-dt * 7); }
    s.hot += (f - s.hot) * Math.min(1, dt * 6);
    hot = clamp(s.hot + Math.min(.35, Math.abs(s.w) * .12), 0, 1);
  }
  const th = RM ? 0 : s.th, lean = RM ? 0 : clamp(-s.w * 1.4, -3, 3);
  const heat = 1 + .5 * hot;
  ctx.save();
  ctx.translate(ax, ay);
  // ceiling bolt + iron plate (fixed, does not swing)
  ctx.fillStyle = '#2b1d12'; ctx.fillRect(-7, -3, 14, 6); ctx.fillStyle = '#6a4d30'; ctx.fillRect(-7, -3, 14, 1.5);
  ctx.fillStyle = '#8a6a46'; ctx.beginPath(); ctx.arc(0, 1, 2.2, 0, 6.3); ctx.fill();
  ctx.rotate(th);
  // chain: bows against the swing so it reads as flexible, links alternate face-on / edge-on
  const bow = RM ? 0 : clamp(s.w * 4, -7, 7), n = Math.max(4, Math.round(len / 6));
  const px = t => 2 * (1 - t) * t * bow, py = t => 3 + (len - 3) * t;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i < n; i++) { const t = (i + .5) / n; if (i & 1) { ctx.moveTo(px(t), py(t) - 2.2); ctx.lineTo(px(t), py(t) + 2.2); } }
  ctx.stroke();
  ctx.strokeStyle = '#8a6a46'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i < n; i++) { const t = (i + .5) / n; if (i & 1) { ctx.moveTo(px(t) - .5, py(t) - 2); ctx.lineTo(px(t) - .5, py(t) + 2); } else { ctx.moveTo(px(t) + 2.2, py(t)); ctx.ellipse(px(t), py(t), 2.2, 3.4, 0, 0, 6.3); } }
  ctx.stroke();
  // top ring and domed cap
  ctx.strokeStyle = '#9a7a52'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, len - 1, 3.2, 0, 6.3); ctx.stroke();
  const gy = len + 3;
  ctx.fillStyle = '#4a3524'; ctx.beginPath(); ctx.moveTo(-10, gy + 6); ctx.quadraticCurveTo(-8, gy - 1, 0, gy - 2); ctx.quadraticCurveTo(8, gy - 1, 10, gy + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a6a46'; ctx.fillRect(-10, gy + 5, 20, 1.6);
  // glass, lit from inside
  const fl = .55 + .35 * fk, gh = 24, gt = gy + 6.6;
  const gg = ctx.createLinearGradient(0, gt, 0, gt + gh);
  gg.addColorStop(0, `rgba(${lc[0]},${Math.min(255, lc[1] + 40) | 0},${lc[2] + 30},${Math.min(1, (fl + .1 * hot) * 1)})`);
  gg.addColorStop(1, `rgba(${lc[0]},${lc[1]},${lc[2]},${Math.min(1, (fl - .1) * .9 + .1 * hot)})`);
  ctx.fillStyle = gg; ctx.fillRect(-7, gt, 14, gh);
  // flame
  const fw = 2.6 + .5 * fk, fh = 9 + 3 * fk;
  ctx.fillStyle = `rgba(255,${230 + 20 * fk | 0},170,${.9})`;
  ctx.beginPath(); ctx.moveTo(lean * .4, gt + gh - 2); ctx.quadraticCurveTo(-fw, gt + gh - 6, lean, gt + gh - fh - 2); ctx.quadraticCurveTo(fw, gt + gh - 6, lean * .4, gt + gh - 2); ctx.fill();
  // posts + base
  ctx.fillStyle = '#2a1c10'; ctx.fillRect(-8.2, gt, 2, gh); ctx.fillRect(6.2, gt, 2, gh); ctx.fillRect(-1, gt, 2, gh);
  ctx.fillStyle = '#4a3524'; ctx.fillRect(-9.5, gt + gh, 19, 4); ctx.fillStyle = '#8a6a46'; ctx.fillRect(-9.5, gt + gh, 19, 1.2);
  ctx.fillStyle = '#4a3524'; ctx.beginPath(); ctx.arc(0, gt + gh + 6, 2, 0, 6.3); ctx.fill();
  ctx.restore();
  // glow: centred on the swinging glass, warms when the cursor is near or it is swinging hard
  const gx = ax - Math.sin(th) * d, gyy = ay + Math.cos(th) * d, R = 150 + 30 * hot;
  ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createRadialGradient(gx, gyy, 0, gx, gyy, R);
  const al = (.34 - .18 * a) * fk * heat;
  lg.addColorStop(0, `rgba(${lc[0]},${lc[1] - 10},${lc[2] - 20},${al})`); lg.addColorStop(1, `rgba(${lc[0]},${lc[1] - 10},${lc[2] - 20},0)`);
  ctx.fillStyle = lg; ctx.fillRect(gx - R, gyy - R, R * 2, R * 2);
  ctx.globalCompositeOperation = 'source-over';
}

/** the two lanterns of one alcove, hung from the arch. box = alcove x,y,w,h,r. */
export function drawAlcoveLanterns(ctx, b) {
  const {x, y, w, h, r, lc, a, now, row} = b;
  const arch = lx => {
    const dx = lx < x + r ? x + r - lx : lx > x + w - r ? lx - (x + w - r) : 0;
    return y + r - Math.sqrt(Math.max(0, r * r - dx * dx));
  };
  const cy = y + Math.min(120, h * .28);
  for (const [i, lx] of [[0, x + 36], [1, x + w - 36]]) {
    const ay = arch(lx) + 8;
    drawLantern(ctx, {id: `${row}:${i}`, ax: lx, ay, len: Math.max(26, cy - ay - 21), lc, a, now});
  }
}
