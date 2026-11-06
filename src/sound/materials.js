/* The sound palette: five materials (paper, leather, wood, stone, brass) plus fire. Every UI motion is mapped to
   one cue here (see CUES), so a hatch, a cover and a ladder rung all sound like the same room.
   Pure synthesis on a "bus" handed in by feel.js: bus = { ctx(), on(), out(node, send), noiseBuf(secs) }.
   Rate limited per cue, a hard voice cap, a no-op when sound is off. `fine` (default true) gates the optional
   layers (fire crackle, hover ticks) so low quality / saver mode keeps only the essential cues. */

const rnd = (a, b) => a + Math.random() * (b - a);
export const MAX_VOICES = 20;

/** the material each cue is made of, how often it may fire (ms) and whether it is optional (dropped at low quality) */
export const CUES = {
  turn:    { material: 'paper',   gap: 90 },   // a page turn
  slip:    { material: 'paper',   gap: 120 },  // a slip or card sliding
  lift:    { material: 'leather', gap: 200 },  // a cover lifting off a book
  shut:    { material: 'leather', gap: 200 },  // a cover closing: soft thud
  hatch:   { material: 'wood',    gap: 600 },  // the attic hatch creaking
  rung:    { material: 'wood',    gap: 60 },   // a ladder rung
  knock:   { material: 'wood',    gap: 150 },  // a wooden knock (shelf, desk)
  scrape:  { material: 'stone',   gap: 400 },  // stone dragged
  door:    { material: 'wood',    gap: 400 },  // a room door: latch, short swing, the far fire
  tick:    { material: 'brass',   gap: 70 },   // a button, lantern latch
  hover:   { material: 'brass',   gap: 160, fine: true },
  crackle: { material: 'fire',    gap: 120, fine: true },
};

export function createMaterials(bus, { now = () => performance.now(), fine = () => true } = {}) {
  const last = {}; let live = 0;
  const ready = kind => {
    const c = CUES[kind]; if (!c || !bus.on() || !bus.ctx() || live >= MAX_VOICES) return false;
    if (c.fine && !fine()) return false;
    const t = now(); if (last[kind] !== undefined && t - last[kind] < c.gap) return false;
    last[kind] = t; return true;
  };
  function noise(dur, type, f0, f1, g, { q = 1, at = 0, attack = .005, send = .12 } = {}) {
    const ctx = bus.ctx(), t = ctx.currentTime + at, s = ctx.createBufferSource();
    s.buffer = bus.noiseBuf(dur);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + attack); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(gn); bus.out(gn, send); s.start(t); s.stop(t + dur + .05);
    live++; s.onended = () => { live = Math.max(0, live - 1); };
  }
  function tone(f, at, dur, g, { type = 'sine', attack = .008, glide = 0, send = .2 } = {}) {
    const ctx = bus.ctx(), t = ctx.currentTime + at, o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glide), t + dur);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + attack); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(gn); bus.out(gn, send); o.start(t); o.stop(t + dur + .05);
    live++; o.onended = () => { live = Math.max(0, live - 1); };
  }
  const voices = {
    /** pages: broad rustle that grows with page count (heavier books = lower, longer) */
    turn: (n = 100) => { const w = Math.min(1, n / 400); noise(.2 + .12 * w, 'bandpass', 900 - 300 * w, 2400, .05 + .02 * w, { q: .7, attack: .06 }); noise(.04, 'highpass', rnd(3000, 4200), 6000, .025, { at: .06, attack: .006, send: .08 }); },
    slip: () => noise(.14, 'bandpass', 2200, 1000, .035, { q: 1, attack: .03, send: .1 }),
    lift: (n = 100) => { const w = Math.min(1, n / 400); noise(.28, 'lowpass', 420, 1100, .07, { q: .8, attack: .1, send: .2 }); tone(150 - 40 * w, .06, .22, .05, { glide: .8, attack: .05, send: .25 }); },
    shut: (n = 100) => { const w = Math.min(1, n / 400); tone(95 - 25 * w, 0, .32, .17, { glide: .55 }); noise(.14, 'lowpass', 650, 130, .14, { attack: .004, send: .3 }); noise(.08, 'bandpass', 1200, 600, .03, { at: .02, q: 1.5, send: .1 }); },
    hatch: () => { // a long dry wooden creak: a wobbling sawtooth through a narrow band, then a settling knock
      const ctx = bus.ctx(), t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(70, 85), t); o.frequency.linearRampToValueAtTime(rnd(105, 130), t + .7); f.type = 'bandpass'; f.Q.value = 6; f.frequency.value = 340;
      lfo.frequency.value = 17; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .2); g.gain.linearRampToValueAtTime(.03, t + .55); g.gain.exponentialRampToValueAtTime(.0001, t + .85);
      o.connect(f); f.connect(g); bus.out(g, .3); o.start(t); lfo.start(t); o.stop(t + .9); lfo.stop(t + .9);
      live++; o.onended = () => { live = Math.max(0, live - 1); };
      tone(78, .78, .25, .09, { glide: .6, send: .3 }); noise(.09, 'lowpass', 600, 150, .07, { at: .78, send: .2 });
    },
    door: () => { // a brass latch lifts, the door swings on a short creak, and the far room's fire breathes in
      tone(rnd(1500, 1650), 0, .05, .03, { type: 'triangle', attack: .002, send: .15 }); noise(.03, 'bandpass', 2600, 1800, .03, { q: 2, attack: .002 });
      noise(.32, 'bandpass', 520, 300, .045, { at: .05, q: 4, attack: .08, send: .25 });
      noise(.5, 'lowpass', 700, 220, .05, { at: .14, q: .6, attack: .2, send: .35 });
    },
    rung: () => { tone(rnd(190, 230), 0, .09, .06, { type: 'triangle', glide: .6, attack: .003, send: .15 }); noise(.04, 'bandpass', 900, 500, .035, { q: 2, attack: .002, send: .08 }); },
    knock: () => { tone(rnd(130, 160), 0, .12, .1, { type: 'triangle', glide: .6, attack: .003, send: .2 }); noise(.05, 'lowpass', 900, 200, .06, { attack: .002, send: .1 }); },
    scrape: () => noise(.5, 'bandpass', 380, 260, .06, { q: 1.4, attack: .15, send: .3 }),
    tick: () => { const f = rnd(1750, 1900); tone(f, 0, .06, .035, { type: 'triangle', attack: .002, send: .15 }); tone(f * 1.51, .005, .04, .015, { type: 'triangle', attack: .002, send: .15 }); },
    hover: () => tone(2300, 0, .035, .012, { type: 'triangle', attack: .002, send: .08 }),
    /** a small pop of the hearth: a short filtered crack, sometimes a double */
    crackle: () => { const n = Math.random() < .35 ? 2 : 1; for (let i = 0; i < n; i++) noise(rnd(.015, .04), 'bandpass', rnd(1800, 4200), rnd(900, 2000), rnd(.02, .05), { at: i * rnd(.03, .09), q: 1.6, attack: .001, send: .1 }); },
  };
  return {
    /** play a mapped cue; unknown names and rate-limited or disabled cues return false */
    play(kind, arg) { if (!ready(kind)) return false; voices[kind](arg); return true; },
    has: kind => kind in CUES,
  };
}
