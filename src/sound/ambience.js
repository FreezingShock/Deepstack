/* Per-floor room tone. Five always-running layers (paper hush, stone, water, hollow wind, abyss drone)
   whose levels crossfade with depth, plus sparse stone drips. Layer nodes are created once and only
   their gains move, so start/stop never clicks and the node count is fixed.
   bus = { ctx(), on(), dest(), send(), noiseBuf(secs) }; tests drive it with a fake AudioContext. */
import { FLOORS, floorStartFt } from '../core/floors.js';

export const LAYERS = ['paper', 'stone', 'water', 'wind', 'drone'];
/** how much of each layer each floor carries (0..1), in floor order */
export const MIX = [
  { paper: 1 },                          // Stacks: hush of paper and still air
  { paper: .8, stone: .2 },              // Archive: paper, a hint of stone
  { stone: 1, paper: .15 },              // Catacombs: cold stone, drips
  { water: 1, stone: .25 },              // Sunken Vault: slow water
  { wind: 1, stone: .1 },                // Hollow: hollow wind
  { drone: 1, wind: .3 },                // Abyss: low drone
];
/** feet over which neighbouring floors crossfade, centred on each boundary */
export const BLEND_FT = 44;
/** per-layer peak gain; kept low so it sits under the existing hum and every effect */
export const LEVEL = { paper: .05, stone: .06, water: .07, wind: .06, drone: .085 };
/** ceiling on one-shot drips alive at once */
export const MAX_DRIPS = 4;
/** fixed number of long-lived nodes the module may create (asserted in tests) */
export const MAX_NODES = 40;

const smooth = u => u * u * (3 - 2 * u);
/** layer weights for a depth in feet: each floor's mix, blended smoothly across boundaries */
export function weightsAt(ft) {
  const d = Math.max(0, ft || 0), w = {}; for (const l of LAYERS) w[l] = 0;
  let i = 0; for (let k = 1; k < FLOORS.length; k++) if (d >= floorStartFt(FLOORS[k]) - BLEND_FT / 2) i = k;
  let a = i, b = i, u = 0;
  if (i > 0) { const s = floorStartFt(FLOORS[i]); if (d < s + BLEND_FT / 2) { a = i - 1; b = i; u = smooth((d - (s - BLEND_FT / 2)) / BLEND_FT); } }
  for (const l of LAYERS) w[l] = (MIX[a][l] || 0) * (1 - u) + (MIX[b][l] || 0) * u;
  return w;
}

const rnd = (x, y) => x + Math.random() * (y - x);

export function createAmbience(bus, hidden = () => typeof document !== 'undefined' && document.hidden) {
  let built = false, enabled = false, depth = 0, nodes = 0, drips = 0, timer = 0, out, gains = {};
  const mk = (fn) => { nodes++; return fn(); };
  const noiseSrc = (buf) => { const s = mk(() => bus.ctx().createBufferSource()); s.buffer = buf; s.loop = true; s.start(); return s; };
  const filt = (type, f, q = 1) => { const n = mk(() => bus.ctx().createBiquadFilter()); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const gain = (v = 0) => { const n = mk(() => bus.ctx().createGain()); n.gain.value = v; return n; };
  const lfo = (hz, depthAmt, target) => { const c = bus.ctx(), o = mk(() => c.createOscillator()), g = gain(depthAmt); o.frequency.value = hz; o.connect(g); g.connect(target); o.start(); return o; };

  function build() {
    if (built || !bus.ctx()) return; built = true;
    const buf = bus.noiseBuf(4);
    out = gain(0); out.connect(bus.dest());
    const layer = (name) => { gains[name] = gain(0); gains[name].connect(out); return gains[name]; };
    // paper hush: airy high band, slowly breathing
    { const s = noiseSrc(buf), hp = filt('highpass', 2200, .5), lp = filt('lowpass', 6200, .4), g = layer('paper'); s.connect(hp); hp.connect(lp); lp.connect(g); lfo(.09, 700, lp.frequency); }
    // stone: dark rumble of a big cold room
    { const s = noiseSrc(buf), lp = filt('lowpass', 170, .7), g = layer('stone'); s.connect(lp); lp.connect(g); lfo(.05, 50, lp.frequency); }
    // water: wandering band that swells like slow lapping
    { const s = noiseSrc(buf), bp = filt('bandpass', 620, 1.3), g = layer('water'), swell = gain(.5); s.connect(bp); bp.connect(swell); swell.connect(g); lfo(.13, 260, bp.frequency); lfo(.17, .35, swell.gain); }
    // hollow wind: narrow band sweeping up and down
    { const s = noiseSrc(buf), bp = filt('bandpass', 420, 5), g = layer('wind'); s.connect(bp); bp.connect(g); lfo(.06, 170, bp.frequency); lfo(.045, 140, bp.frequency); }
    // abyss drone: two beating low voices
    { const c = bus.ctx(), lp = filt('lowpass', 150, .8), g = layer('drone');
      for (const [f, type] of [[41.2, 'sine'], [41.9, 'triangle'], [61.9, 'sine']]) { const o = mk(() => c.createOscillator()); o.type = type; o.frequency.value = f; o.connect(lp); o.start(); }
      lp.connect(g); lfo(.04, 40, lp.frequency); }
    apply(true);
  }

  function apply(snap) {
    if (!built) return; const c = bus.ctx(), t = c.currentTime, w = weightsAt(depth), tc = snap ? .05 : .9;
    for (const l of LAYERS) gains[l].gain.setTargetAtTime(enabled ? w[l] * LEVEL[l] : 0, t, tc);
    out.gain.setTargetAtTime(enabled ? 1 : 0, t, enabled ? 1.2 : .25); // fade, never cut: no clicks
  }

  function drip() {
    const c = bus.ctx(); if (!enabled || !c || hidden() || drips >= MAX_DRIPS) return;
    const p = weightsAt(depth).stone; if (p < .2) return;
    const t = c.currentTime, f = rnd(260, 520), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .55, t + .35);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05 * p, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + .5);
    o.connect(g); g.connect(out); if (bus.send) { const s = c.createGain(); s.gain.value = 1.1; g.connect(s); s.connect(bus.send()); }
    o.start(t); o.stop(t + .55); drips++; o.onended = () => { drips = Math.max(0, drips - 1); };
  }
  function loop() { clearTimeout(timer); if (!enabled) return; timer = setTimeout(() => { drip(); loop(); }, rnd(4, 11) * 1000); }

  return {
    /** sound on/off: fades the whole bed, builds the graph the first time it is wanted */
    enable(v) { enabled = !!v && bus.on(); if (enabled) build(); apply(false); loop(); },
    setDepth(ft) { if (Math.abs(ft - depth) < 4) return; depth = ft; apply(false); },
    weights: () => weightsAt(depth),
    nodeCount: () => nodes,
    dripCount: () => drips,
  };
}
