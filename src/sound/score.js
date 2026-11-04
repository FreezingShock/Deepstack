/* A slow score that follows the descent: soft strings and a low piano, a different scale and mood per floor.
   It thins out as the candle burns down (fewer notes, a single bare string, a darker filter) and blooms on a Folio
   or better. Pure synthesis on a "bus" handed in by feel.js (no audio files), so tests can drive it with a fake
   AudioContext. bus = { ctx(), on(), dest(), send() }. Everything runs through one output gain that is never
   louder than the room tone (MAX_OUT), is ducked by door and reveal stings, and fades out (never cuts).
   Off when sound is off, in low quality / saver mode, in a hidden tab. */
import { floorAtFt as floorAt } from '../core/floors.js';

/** per-floor mood: MIDI root, scale steps, seconds per beat-slot, base chance a piano note plays, string brightness (Hz) */
export const MOODS = {
  stacks:    { root: 50, scale: [0, 2, 4, 7, 9],             slot: 4.2, play: .55, bright: 1300 }, // D major pentatonic: warm, open
  archive:   { root: 45, scale: [0, 2, 3, 5, 7, 9, 10],      slot: 4.6, play: .5,  bright: 1100 }, // A dorian: dusty, patient
  catacombs: { root: 40, scale: [0, 1, 3, 5, 7, 8, 10],      slot: 5.4, play: .4,  bright: 800 },  // E phrygian: cold stone
  vault:     { root: 41, scale: [0, 2, 4, 6, 7, 9, 11],      slot: 5,   play: .45, bright: 1000 }, // F lydian: slow, watery
  hollow:    { root: 46, scale: [0, 2, 4, 6, 8, 10],         slot: 6,   play: .3,  bright: 650 },  // whole tone: unmoored
  abyss:     { root: 38, scale: [0, 1, 5, 7],                slot: 7.2, play: .22, bright: 420 },  // D with a b2: almost silent
};
/** output ceiling: stays under the room-tone bed (ambience tops out near .085) */
export const MAX_OUT = .06;
/** most voices alive at once, and each voice's peak as a share of the output (sum <= 1) */
export const MAX_VOICES = 8;
export const VOICE_PEAK = 1 / MAX_VOICES;
/** longest a single voice may live (s), so nothing leaks */
export const MAX_LIFE = 14;

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (x, y) => x + Math.random() * (y - x);
const pick = a => a[(Math.random() * a.length) | 0];

/** how much of the score plays for a candle fraction 1..0: full while lit, thin to a sliver near the end */
export const thin = fr => .12 + .88 * clamp(fr, 0, 1) * clamp(fr, 0, 1);
export const moodAt = ft => MOODS[floorAt(Math.max(0, ft || 0)).key] || MOODS.stacks;

export function createScore(bus, { hidden = () => typeof document !== 'undefined' && document.hidden, allowed = () => true, rand = Math.random } = {}) {
  let out, enabled = false, built = false, depth = 0, candle = 1, timer = 0, live = 0, step = 0, deg = 0, duckUntil = 0, peakSeen = 0;
  const ctx = () => bus.ctx();

  function build() {
    if (built || !ctx()) return; built = true;
    out = ctx().createGain(); out.gain.value = 0; out.connect(bus.dest());
    if (bus.send) { const s = ctx().createGain(); s.gain.value = .9; out.connect(s); s.connect(bus.send()); }
  }
  const live_ok = () => enabled && bus.on() && allowed() && !!ctx() && built;

  /** one voice: osc stack -> lowpass -> gain envelope -> out */
  function voice({ midi, kind, at = 0, dur, level = 1, bright }) {
    const c = ctx(); if (!live_ok() || live >= MAX_VOICES) return false;
    const t = c.currentTime + at, life = Math.min(MAX_LIFE, dur), peak = VOICE_PEAK * level * (kind === 'piano' ? 1 : .8);
    const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .5;
    const oscs = [];
    if (kind === 'piano') { // sine + soft triangle partial, quick hammer, long decay
      lp.frequency.value = bright * 1.4;
      for (const [type, mul, v] of [['sine', 1, 1], ['triangle', 2.003, .25]]) { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = hz(midi) * mul; og.gain.value = v; o.connect(og); og.connect(lp); oscs.push(o); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + life);
    } else { // strings: three detuned saws, slow bow in, slow release
      lp.frequency.value = bright;
      for (const d of [-6, 0, 7]) { const o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(midi); o.detune.value = d; og.gain.value = .34; o.connect(og); og.connect(lp); oscs.push(o); }
      const a = Math.min(life * .4, 2.6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + life - Math.min(3, life * .45)); g.gain.exponentialRampToValueAtTime(.0001, t + life);
    }
    lp.connect(g); g.connect(out); peakSeen = Math.max(peakSeen, peak);
    live++; let ended = 0;
    const done = () => { if (ended++) return; live = Math.max(0, live - 1); };
    oscs.forEach((o, i) => { o.start(t); o.stop(t + life + .1); if (i === 0) o.onended = done; });
    return true;
  }

  const note = (m, k) => { const s = m.scale; return m.root + s[((k % s.length) + s.length) % s.length] + 12 * Math.floor(k / s.length); };

  function tick() {
    if (!live_ok() || hidden()) return;
    const m = moodAt(depth), th = thin(candle), c = ctx();
    if (c.currentTime < duckUntil - 1.5) return; // a sting is still speaking
    step++;
    // strings change chord every few slots; a thin candle leaves one bare root
    if (step % 3 === 1) {
      const bright = m.bright * (.45 + .55 * candle), dur = m.slot * 3.2, full = candle > .35;
      voice({ midi: note(m, 0) - 12, kind: 'strings', dur, bright, level: 1 });
      if (full) { voice({ midi: note(m, 2), kind: 'strings', at: .4, dur: dur - .4, bright, level: .8 }); if (candle > .7) voice({ midi: note(m, 4), kind: 'strings', at: .9, dur: dur - .9, bright, level: .6 }); }
    }
    // low piano: a wandering line, sparser as the candle goes
    if (rand() < m.play * th) {
      deg += pick([-2, -1, -1, 1, 1, 2]); deg = clamp(deg, -2, m.scale.length + 2);
      voice({ midi: note(m, deg) + 12, kind: 'piano', dur: rnd(4, 7), bright: m.bright, level: .9 });
    }
  }
  function loop() {
    clearTimeout(timer); if (!enabled) return;
    timer = setTimeout(() => { tick(); loop(); }, moodAt(depth).slot * 1000 * (.8 + rand() * .4) * (1 + (1 - candle) * .8)); if (timer && timer.unref) timer.unref();
  }

  function level() {
    if (!built) return; const c = ctx(), t = c.currentTime;
    const on = live_ok(), ducked = t < duckUntil;
    out.gain.cancelScheduledValues && out.gain.cancelScheduledValues(t);
    out.gain.setTargetAtTime(on ? (ducked ? MAX_OUT * .25 : MAX_OUT) : 0, t, on ? (ducked ? .15 : 1.6) : .4); // fade, never cut
  }

  return {
    enable(v) { enabled = !!v && bus.on() && allowed(); if (enabled) build(); level(); loop(); },
    /** call when quality or settings change */
    refresh() { enabled = enabled && allowed(); level(); if (!enabled) clearTimeout(timer); },
    setDepth(ft) { if (!enabled) { depth = ft; return; } const fl = floorAt(Math.max(0, ft)).key, was = floorAt(Math.max(0, depth)).key; depth = ft; if (fl !== was) { step = 0; deg = 0; } },
    /** candle fraction 1 (fresh) .. 0 (guttered); thins notes and darkens strings */
    setCandle(fr) { candle = clamp(+fr || 0, 0, 1); },
    /** a Folio or better: the strings bloom into a full chord (tier 3..6) */
    swell(tier) {
      if (!live_ok() || tier < 3) return false; const m = moodAt(depth), k = tier - 3, dur = 7 + k;
      [0, 2, 4, 6 + 0, 8].slice(0, 3 + Math.min(2, k)).forEach((d, i) => voice({ midi: note(m, d) - (i ? 0 : 12), kind: 'strings', at: i * .25, dur, bright: m.bright * 1.5, level: 1 }));
      voice({ midi: note(m, 7) + 12, kind: 'piano', at: .9, dur: 6, bright: m.bright * 1.5, level: 1 });
      return true;
    },
    /** drop the whole score for a moment under a door or reveal sting, then bring it back */
    duck(secs = 2.5) { if (!built) return; const c = ctx(); duckUntil = c.currentTime + secs; level(); const tm = setTimeout(level, secs * 1000); if (tm.unref) tm.unref(); },
    voices: () => live,
    maxPeak: () => peakSeen,
    mood: () => moodAt(depth),
  };
}
