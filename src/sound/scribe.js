/* Tactile desk sounds: quill scratch, paper, wax-seal press, heavy book landing.
   Pure synthesis on a "bus" handed in by feel.js, so tests can drive it with a fake AudioContext.
   bus = { ctx(), on(), out(node, send), noiseBuf(secs) }. Everything is rate limited and a no-op when sound is off. */

const rnd = (a, b) => a + Math.random() * (b - a);
/** minimum gap between triggers of each sound, in ms, so mashing keys or flipping fast never stacks nodes */
export const GAPS = { quill: 38, paper: 90, seal: 400, land: 250 };
/** hard ceiling on voices alive at once across all sounds */
export const MAX_VOICES = 24;

export function createScribe(bus, now = () => performance.now()) {
  const last = {}; let live = 0, flip = 0;
  const ready = kind => {
    if (!bus.on() || !bus.ctx() || live >= MAX_VOICES) return false;
    const t = now(); if (last[kind] !== undefined && t - last[kind] < GAPS[kind]) return false;
    last[kind] = t; return true;
  };
  function noise(dur, type, f0, f1, g, { q = 1, at = 0, attack = .005, send = .1 } = {}) {
    const ctx = bus.ctx(), t = ctx.currentTime + at, s = ctx.createBufferSource();
    s.buffer = bus.noiseBuf(dur);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + attack); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(gn); bus.out(gn, send); s.start(t); s.stop(t + dur + .05);
    live++; s.onended = () => { live = Math.max(0, live - 1); };
  }
  function tone(f, at, dur, g, { type = 'sine', attack = .01, glide = 0, send = .2 } = {}) {
    const ctx = bus.ctx(), t = ctx.currentTime + at, o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glide), t + dur);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + attack); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(gn); bus.out(gn, send); o.start(t); o.stop(t + dur + .05);
    live++; o.onended = () => { live = Math.max(0, live - 1); };
  }
  return {
    /** quill on paper: a short dry scratch, pitch alternating a little like strokes up and down */
    quill() {
      if (!ready('quill')) return;
      flip ^= 1;
      const d = rnd(.045, .08), f = flip ? rnd(2600, 3400) : rnd(1900, 2600);
      noise(d, 'bandpass', f, f * rnd(.55, .8), rnd(.035, .055), { q: 2.2, attack: .008, send: .04 });
      if (Math.random() < .25) noise(.02, 'lowpass', 700, 300, .02, { send: .02 }); // nib tick on the page
    },
    /** paper: soft broad rustle with a few fibres, one per page turn */
    paper() {
      if (!ready('paper')) return;
      noise(rnd(.22, .3), 'bandpass', 700, 2200, .06, { q: .7, attack: .07, send: .15 });
      const n = 2 + (Math.random() * 3 | 0);
      for (let i = 0; i < n; i++) noise(rnd(.03, .06), 'highpass', rnd(2800, 4200), rnd(5000, 7000), rnd(.02, .04), { at: .04 + i * rnd(.03, .06), attack: .006, send: .1 });
    },
    /** wax seal: wet press squelch, soft thump, small settling click */
    seal() {
      if (!ready('seal')) return;
      noise(.16, 'lowpass', 900, 220, .09, { q: 1.2, attack: .03, send: .1 });
      tone(120, .05, .2, .16, { glide: .55, attack: .006, send: .25 });
      noise(.05, 'bandpass', 1500, 600, .05, { at: .16, q: 3, attack: .004, send: .1 });
    },
    /** a heavy book landing on the ledge: deep body, stone knock, dust */
    land() {
      if (!ready('land')) return;
      tone(62, 0, .5, .24, { glide: .5, attack: .006, send: .45 });
      tone(118, 0, .22, .1, { glide: .7, attack: .004, send: .3 });
      noise(.16, 'lowpass', 700, 110, .16, { attack: .004, send: .4 });
      noise(.6, 'bandpass', 500, 1400, .03, { at: .08, q: .6, attack: .15, send: .3 });
    },
  };
}
