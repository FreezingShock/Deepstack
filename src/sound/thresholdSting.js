/* A one-line sound for passing a floor door: each floor answers in its own room tone, quietly.
   bus = { ctx(), on(), out(node, send), noiseBuf(secs) }; a no-op when sound is off, rate limited. */
const GAP_MS = 1500;
/** what each floor says as you pass (kept short and low; the Stacks have no door) */
export const STINGS = {
  archive: {noise: ['bandpass', 1800, 900, .5, .035], tones: [[880, .08, .1, .02]]},   // a rustle of cards, one brass tick
  catacombs: {noise: ['lowpass', 500, 160, .7, .05], tones: [[78, 0, .5, .09]]},       // a cold breath, a stone knock
  vault: {noise: ['bandpass', 700, 300, .8, .03], tones: [[1250, .1, .16, .04], [1050, .42, .16, .03]]}, // two drips
  hollow: {noise: ['bandpass', 300, 520, 1.3, .05], tones: [[110, 0, 1.1, .035]]},     // wind through the roots
  abyss: {noise: ['lowpass', 220, 90, 1.6, .05], tones: [[46, 0, 1.8, .12], [69, .1, 1.5, .05]]} // a deep swell
};

export function createSting(bus, now = () => performance.now()) {
  let last = -1e9;
  return {
    play(key) {
      const s = STINGS[key]; if (!s || !bus.on() || !bus.ctx()) return false;
      const t0 = now(); if (t0 - last < GAP_MS) return false; last = t0;
      const ctx = bus.ctx(), t = ctx.currentTime, [type, f0, f1, dur, g] = s.noise;
      const src = ctx.createBufferSource(); src.buffer = bus.noiseBuf(dur);
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const gn = ctx.createGain(); gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + dur * .35); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
      src.connect(f); f.connect(gn); bus.out(gn, .5); src.start(t); src.stop(t + dur + .05);
      for (const [hz, at, d, v] of s.tones) {
        const o = ctx.createOscillator(), og = ctx.createGain(), ts = t + at;
        o.type = 'sine'; o.frequency.value = hz;
        og.gain.setValueAtTime(0, ts); og.gain.linearRampToValueAtTime(v, ts + Math.min(.08, d * .3)); og.gain.exponentialRampToValueAtTime(.0001, ts + d);
        o.connect(og); bus.out(og, .6); o.start(ts); o.stop(ts + d + .05);
      }
      return true;
    }
  };
}
