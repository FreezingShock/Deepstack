/* Each topic room has a few sparse, quiet sound accents of its own: a clock ticking in the Chronicle, abacus beads in
   the Counting House, a soft bell in the Observatory, a quill in the Scriptorium, a low chord in the Gallery and a slow
   heartbeat in the Anatomy Theatre. The Reading Room has none (its sound is the shared room tone in feel.js).
   Every room has its own gain node. A walk to another room crossfades: the old room's gain glides to silence while the
   new one's glides up, so the last tail of an accent rings out on its own gain. The gains are built once per room, the
   voices are one-shot and short (like drips and materials), and nothing plays while sound is off or the tab is hidden.
   Reduced motion does not change this: it is sound, not motion. bus = { ctx(), on(), dest(), noiseBuf(secs) }; tests
   drive it with a fake AudioContext and an injected timer. */
import {HALL} from '../core/rooms.js';

/** which accent each room plays (rooms not listed, the Reading Room, stay silent) */
export const ACCENTS = {history: 'tick', math: 'beads', science: 'chime', english: 'quill', art: 'chord', body: 'heart'};
/** seconds between one accent and the next, [min, max], per accent: sparse on purpose, so a room is felt more than heard */
export const GAP = {tick: [6, 12], beads: [7, 14], chime: [6, 12], quill: [6, 13], chord: [12, 20], heart: [8, 14]};
/** setTargetAtTime time constants (s) for the crossfade: the room colours glide over --m-page (560 ms), so the old room
   is mostly gone by then and the new one is mostly in */
export const FADE = {out: .2, in: .32};
/** most one-shot voices alive at once (a clock burst is about ten) */
export const MAX_VOICES = 24;
/** long-lived nodes: one gain per room, at most */
export const MAX_GAINS = 7;
/** the observatory chime's notes (C major pentatonic: never dissonant) */
const CHIME = [523.25, 587.33, 659.25, 783.99, 880];

const rnd = (a, b) => a + Math.random() * (b - a);

export function createRoomTone(bus, {
  later = (fn, ms) => setTimeout(fn, ms),
  cancel = id => clearTimeout(id),
  hidden = () => typeof document !== 'undefined' && document.hidden,
  rand = rnd,
  allowed = () => true, // the Room sounds switch and the quality tier (src/feel.js); false silences the accents at once
} = {}) {
  let enabled = false, cur = HALL, timer = 0, live = 0, nodes = 0, noise = null;
  const gains = {};
  const mk = fn => { nodes++; return fn(); };
  const target = id => (ACCENTS[id] ? 1 : 0);
  /** accents play only when sound is on and the room-sound switch allows them */
  const playing = () => enabled && allowed();

  /** one gain per room, created the first time that room is needed */
  function roomGain(id) {
    if (gains[id]) return gains[id];
    const c = bus.ctx(), g = mk(() => c.createGain());
    g.gain.value = 0; g.connect(bus.dest()); return (gains[id] = g);
  }
  /** one-shot oscillator voice with a soft attack and an exponential tail */
  function osc(c, dst, f, t, dur, peak, {type = 'sine', attack = .006, glide = 0} = {}) {
    const o = mk(() => c.createOscillator()), g = mk(() => c.createGain());
    o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + .05);
    live++; o.onended = () => { live = Math.max(0, live - 1); };
  }
  /** one-shot band of noise: a click, a bead, a scratch */
  function hiss(c, dst, t, f, q, dur, peak) {
    if (!noise) noise = bus.noiseBuf(.6);
    const s = mk(() => c.createBufferSource()), fl = mk(() => c.createBiquadFilter()), g = mk(() => c.createGain());
    s.buffer = noise; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dst); s.start(t, rand(0, .3)); s.stop(t + dur + .05);
    live++; s.onended = () => { live = Math.max(0, live - 1); };
  }

  /** the voices, one per accent kind; `t` is the audio time to start */
  const VOICES = {
    /* a wall clock in the next room: a short burst of alternating ticks and tocks */
    tick(c, d, t) {
      const n = 3 + Math.floor(rand(0, 3));
      for (let i = 0; i < n; i++) { const at = t + i * .5; osc(c, d, i % 2 ? 1100 : 1500, at, .05, .05, {type: 'triangle', attack: .002}); hiss(c, d, at, 3200, 2, .02, .03); }
    },
    /* abacus beads: a rattle of short bright clicks that slide and settle */
    beads(c, d, t) {
      const n = 3 + Math.floor(rand(0, 4));
      for (let i = 0; i < n; i++) hiss(c, d, t + i * rand(.05, .1), rand(3000, 4200), 4, .035, .05);
      osc(c, d, rand(1400, 1700), t + .02, .04, .012, {type: 'triangle', attack: .002});
    },
    /* a soft bell from the pentatonic scale, with its faint inharmonic partial */
    chime(c, d, t) {
      const f = CHIME[Math.floor(rand(0, CHIME.length))];
      osc(c, d, f, t, 2.2, .05, {attack: .01}); osc(c, d, f * 2.76, t, 1, .012, {attack: .005});
    },
    /* a quill: two to four grains of scratch on paper */
    quill(c, d, t) {
      const n = 2 + Math.floor(rand(0, 3));
      for (let i = 0; i < n; i++) hiss(c, d, t + i * rand(.07, .11), rand(2000, 2600), 1.4, .16, .03);
    },
    /* a low major chord that swells in and fades slowly */
    chord(c, d, t) { for (const f of [261.63, 329.63, 392]) osc(c, d, f, t, 4.6, .016, {attack: 1.2}); },
    /* a slow heartbeat: lub, then dub */
    heart(c, d, t) { osc(c, d, 58, t, .16, .07, {glide: .7, attack: .01}); osc(c, d, 52, t + .3, .14, .05, {glide: .7, attack: .01}); },
  };

  function fire() {
    const kind = ACCENTS[cur], c = bus.ctx();
    if (!playing() || !kind || !c || hidden() || live >= MAX_VOICES) return;
    VOICES[kind](c, roomGain(cur), c.currentTime);
  }
  /** the next accent of the current room, after a random gap; stopped when sound goes off or the room has none */
  function loop() {
    cancel(timer); timer = 0;
    const kind = ACCENTS[cur]; if (!playing() || !kind) return;
    const [a, b] = GAP[kind];
    timer = later(() => { timer = 0; fire(); loop(); }, rand(a, b) * 1000);
  }
  /** bring the sound in line with playing(): the current room glides in and its timer runs, or every room glides out
   *  and no timer is left behind (so a switched-off room never makes a voice) */
  function sync() {
    const c = bus.ctx();
    if (!playing()) { cancel(timer); timer = 0; if (c) for (const id in gains) gains[id].gain.setTargetAtTime(0, c.currentTime, FADE.out); return; }
    if (!c) return;
    roomGain(cur).gain.setTargetAtTime(target(cur), c.currentTime, FADE.in); loop();
  }

  return {
    /** sound on/off: the current room's accents start or stop; nothing is built until sound is on */
    enable(v) { enabled = !!v && bus.on(); sync(); },
    /** re-read `allowed` (the Room sounds switch, the quality tier): a change glides in or out at once */
    refresh() { sync(); },
    /** the room the player is in now: crossfades from the old room's accents to the new one's */
    setRoom(id) {
      if (id === cur) return;
      const prev = cur; cur = id;
      const c = bus.ctx(); if (!playing() || !c) return; // remembered; the bed starts when sound is on
      if (gains[prev]) gains[prev].gain.setTargetAtTime(0, c.currentTime, FADE.out); // the old room glides out; its tail rings on
      roomGain(id).gain.setTargetAtTime(target(id), c.currentTime, FADE.in);
      loop();
    },
    room: () => cur,
    voiceCount: () => live,
    nodeCount: () => nodes,
    gainCount: () => Object.keys(gains).length,
  };
}
