/* Sound, ambience and "juice". Everything is synthesized with WebAudio (no assets).
   Kept calm on purpose: soft attacks, low levels, a shared reverb, nothing sharp. */

import { motionNow } from './ui/settings.js';
import { createScribe } from './sound/scribe.js';
import { createAmbience } from './sound/ambience.js';
import { createRoomTone } from './sound/roomTone.js';
import { loadSettings } from './ui/settings.js';
import { createSting } from './sound/thresholdSting.js';
import { createScore } from './sound/score.js';
import { createMaterials } from './sound/materials.js';
import { Quality } from './ui/quality.js';
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- visual feel: slow-motion + shake (read by the render loops) ---------- */
export const Feel = (() => {
  let slow = { scale: 1, until: 0, from: 0, ease: 1 };
  let shakeAmp = 0, shakeDecay = 0, ox = 0, oy = 0;
  return {
    /** time scale applied to world/particle dt (1 = normal). */
    ts: 1,
    get ox() { return ox; }, get oy() { return oy; },
    slowmo(scale, ms) { if (motionNow()) return; slow = { scale, from: performance.now(), until: performance.now() + ms, ease: 1 }; },
    shake(amp, ms = 500) { if (motionNow()) return; shakeAmp = Math.max(shakeAmp, amp); shakeDecay = amp / (ms / 1000); },
    /** call once per frame with real (unscaled) dt in seconds. */
    tick(dt) {
      const now = performance.now();
      if (now < slow.until) {
        const u = (now - slow.from) / (slow.until - slow.from);
        // dip fast, hold, then ease back out
        const k = u < .15 ? u / .15 : u < .6 ? 1 : 1 - (u - .6) / .4;
        this.ts = 1 + (slow.scale - 1) * Math.max(0, Math.min(1, k));
      } else this.ts = 1;
      if (shakeAmp > .05) {
        ox = (Math.random() * 2 - 1) * shakeAmp; oy = (Math.random() * 2 - 1) * shakeAmp * .7;
        shakeAmp = Math.max(0, shakeAmp - shakeDecay * dt);
      } else { shakeAmp = 0; ox = oy = 0; }
    },
  };
})();

/* ---------- audio ---------- */
export const Sfx = (() => {
  let vol = 1, musicLv = 1, fxLv = 1, ctx, master, wet, musicBus, musicSend, fxBus, fxSend, humG, humLP, humO1, humO2, amb, ambLP, on = false, lastKey = 0, depth = 0, timers = [];
  const noiseBuf = (secs, shape) => {
    const n = ctx.sampleRate * secs | 0, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (shape ? shape(i / n) : 1);
    return b;
  };
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.ratio.value = 3; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = .9 * vol; master.connect(comp);
    // reverb: decaying noise impulse, darkened
    const conv = ctx.createConvolver(); conv.buffer = (() => {
      const n = ctx.sampleRate * 2.6 | 0, b = ctx.createBuffer(2, n, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = b.getChannelData(c), lp = { v: 0 }; for (let i = 0; i < n; i++) { lp.v += .25 * ((Math.random() * 2 - 1) - lp.v); d[i] = lp.v * Math.pow(1 - i / n, 2.6); } }
      return b;
    })();
    wet = ctx.createGain(); wet.gain.value = .5; wet.connect(conv); conv.connect(master);
    // two buses under master (settings: Music and Effects). Music = room tone, depth hum and the score; Effects = one-shot sounds.
    // Each bus has a send into the reverb that follows its level, so a muted bus is silent, tails included.
    musicBus = ctx.createGain(); musicBus.gain.value = musicLv; musicBus.connect(master);
    musicSend = ctx.createGain(); musicSend.gain.value = musicLv; musicSend.connect(wet);
    fxBus = ctx.createGain(); fxBus.gain.value = fxLv; fxBus.connect(master);
    fxSend = ctx.createGain(); fxSend.gain.value = fxLv; fxSend.connect(wet);
    // room tone (existing soft brown-ish noise, slowly breathing)
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    ambLP = ctx.createBiquadFilter(); ambLP.type = 'lowpass'; ambLP.frequency.value = 380;
    amb = ctx.createGain(); amb.gain.value = 0; src.connect(ambLP); ambLP.connect(amb); amb.connect(musicBus); src.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = .07; const lg = ctx.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(ambLP.frequency); lfo.start();
    // depth hum: two slightly detuned low sines through a lowpass; deeper = lower, darker, a touch louder
    humG = ctx.createGain(); humG.gain.value = 0; humLP = ctx.createBiquadFilter(); humLP.type = 'lowpass'; humLP.frequency.value = 300;
    humO1 = ctx.createOscillator(); humO2 = ctx.createOscillator(); humO1.type = 'sine'; humO2.type = 'triangle';
    humO1.connect(humLP); humO2.connect(humLP); humLP.connect(humG); humG.connect(musicBus); humO1.start(); humO2.start();
    setHum();
  }
  function setHum() {
    if (!ctx) return;
    const t = ctx.currentTime, k = Math.min(1, depth / 400); // 0..1 over the first ~400 ft
    const f = 82 - 30 * k;
    humO1.frequency.linearRampToValueAtTime(f, t + 1.2); humO2.frequency.linearRampToValueAtTime(f * 1.503 + .6 + 1.4 * k, t + 1.2);
    humLP.frequency.linearRampToValueAtTime(320 - 170 * k, t + 1.2);
    humG.gain.linearRampToValueAtTime(on ? .028 + .03 * k : 0, t + 1.2);
  }
  const out = (node, send = .3) => { node.connect(fxBus); if (send) { const s = ctx.createGain(); s.gain.value = send; node.connect(s); s.connect(fxSend); } };
  function noise(dur, type, f0, f1, g, { q = 1, at = 0, attack = .005, send = .15 } = {}) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + at, s = ctx.createBufferSource(); s.buffer = noiseBuf(dur);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + attack); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(gn); out(gn, send); s.start(t); s.stop(t + dur + .05);
  }
  function tone(f, at, dur, g, { type = 'sine', attack = .02, glide = 0, send = .35 } = {}) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glide), t + dur);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + attack); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(gn); out(gn, send); o.start(t); o.stop(t + dur + .05);
  }
  // soft bell: fundamental + two inharmonic partials with faster decay
  const bell = (f, at, g, len = 1.6) => { tone(f, at, len, g); tone(f * 2.76, at, len * .45, g * .22); tone(f * 5.4, at, len * .22, g * .08); };
  const PENT = [0, 2, 4, 7, 9]; // major pentatonic: never dissonant
  const note = (root, i) => root * Math.pow(2, (PENT[i % 5] + 12 * Math.floor(i / 5)) / 12);

  function schedule(kind, min, max) {
    const id = setTimeout(() => {
      timers = timers.filter(x => x !== id);
      if (on && ctx && !document.hidden) fire[kind]();
      if (on) schedule(kind, min, max);
    }, rnd(min, max) * 1000);
    timers.push(id);
  }
  const fire = {
    drip() {
      if (depth < 12) return;
      const f = rnd(900, 1500), p = Math.min(1, depth / 300);
      tone(f, 0, .16, .05 + .03 * p, { glide: .45, attack: .004, send: .8 });
      if (Math.random() < .35) tone(f * 1.2, .26, .14, .025, { glide: .5, attack: .004, send: .9 }); // rebound drop
    },
    steps() {
      if (depth < 6) return;
      const n = 3 + (Math.random() * 4 | 0), gap = rnd(.55, .75), g = rnd(.03, .05);
      for (let i = 0; i < n; i++) { // faint, far away, fading as they leave
        const at = i * gap + rnd(-.03, .03), v = g * (1 - i / (n + 1));
        noise(.11, 'lowpass', 420, 90, v, { at, attack: .01, send: .7 }); tone(62, at, .14, v * .8, { glide: .7, send: .6 });
      }
    },
  };
  function startAmbient() { stopAmbient(); schedule('drip', 3, 9); schedule('steps', 28, 70); }
  function stopAmbient() { timers.forEach(clearTimeout); timers = []; }

  const floorTone = createAmbience({ ctx: () => ctx, on: () => on, dest: () => musicBus, send: () => musicSend, noiseBuf });
  // each topic room's own accents (src/sound/roomTone.js). Off with the Room sounds switch, and in the low quality tier (like the score)
  let roomsOn = loadSettings().roomSounds !== false;
  const roomTone = createRoomTone({ ctx: () => ctx, on: () => on, dest: () => musicBus, noiseBuf, allowed: () => roomsOn && Quality.tier() !== 'low' });
  const score = createScore({ ctx: () => ctx, on: () => on, dest: () => musicBus, send: () => musicSend }, { allowed: () => Quality.tier() !== 'low' });
  Quality.subscribe(() => { score.refresh(); roomTone.refresh(); });
  const mats = createMaterials({ ctx: () => ctx, on: () => on, out, noiseBuf }, { fine: () => Quality.tier() !== 'low' });
  const scribe = createScribe({ ctx: () => ctx, on: () => on, out, noiseBuf });
  const sting = createSting({ ctx: () => ctx, on: () => on, out, noiseBuf });
  return {
    /** a floor door going by (key = floor key) */
    threshold: key => { if (sting.play(key)) score.duck(2.5); },
    /** the room the player is now in (src/app/roomGo.js, src/app/home.js): its accents crossfade in */
    room: id => roomTone.setRoom(id),
    /** the Room sounds switch (Settings): on or off for the topic-room accents only; a change glides at once */
    roomAccents(v) { roomsOn = !!v; roomTone.refresh(); },
    /** candle fraction 1..0: the score thins as the flame burns down */
    candle: fr => score.setCandle(fr),
    /** one cue from the sound palette (src/sound/materials.js): turn, lift, shut, hatch, rung, knock, tick, crackle ... */
    cue: (kind, arg) => mats.play(kind, arg),
    quill: () => scribe.quill(), paper: () => scribe.paper(), seal: () => scribe.seal(), land: () => scribe.land(),
    /** a short sample of one bus, played while its slider is let go (ST4). Silent when Sound is off. */
    preview(kind) {
      if (!on || !ctx) return;
      if (kind === 'music') {
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(196, t);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .3); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8);
        o.connect(g); g.connect(musicBus); g.connect(musicSend); o.start(t); o.stop(t + 1.9);
      } else scribe.paper();
    },
    /** master volume 0..1 (settings panel) */
    volume(v) { vol = Math.max(0, Math.min(1, v)); if (master) master.gain.setTargetAtTime(.9 * vol, ctx.currentTime, .05); },
    /** Music and Effects levels 0..1 under the master volume (settings panel); applied live once audio exists */
    levels(music, effects) {
      musicLv = Math.max(0, Math.min(1, music)); fxLv = Math.max(0, Math.min(1, effects));
      if (!ctx) return;
      const t = ctx.currentTime;
      for (const g of [musicBus, musicSend]) g.gain.setTargetAtTime(musicLv, t, .05);
      for (const g of [fxBus, fxSend]) g.gain.setTargetAtTime(fxLv, t, .05);
    },
    set(v) {
      on = v;
      if (v) { init(); if (!ctx) return; ctx.resume(); amb.gain.linearRampToValueAtTime(.07, ctx.currentTime + 1.5); setHum(); startAmbient(); floorTone.enable(true); roomTone.enable(true); floorTone.setDepth(depth); score.enable(true); score.setDepth(depth); }
      else { stopAmbient(); floorTone.enable(false); roomTone.enable(false); score.enable(false); if (ctx) { amb.gain.linearRampToValueAtTime(0, ctx.currentTime + .4); setHum(); } }
    },
    /** depth in feet; drives hum pitch/level and how often drips and footsteps occur */
    setDepth(ft) { if (Math.abs(ft - depth) < 8) return; depth = ft; setHum(); floorTone.setDepth(ft); score.setDepth(ft); },
    /** page rustle: a few short papery grains, slightly different each time */
    flip() {
      const n = 3 + (Math.random() * 3 | 0);
      for (let i = 0; i < n; i++) noise(rnd(.05, .11), 'bandpass', rnd(1800, 3000), rnd(3800, 6000), rnd(.05, .09) * (1 - i / (n + 2)), { at: i * rnd(.035, .07), q: .8, attack: .012, send: .2 });
      noise(.2, 'bandpass', 500, 1600, .06, { attack: .06, send: .2 });
    },
    key() { const n = performance.now(); if (n - lastKey < 45) return; lastKey = n; noise(.03, 'highpass', 2500, 4000, .04, { send: .05 }); },
    whoosh(d) { noise(d, 'bandpass', 200, 1400, .12, { attack: Math.min(.4, d * .4), send: .3 }); },
    /** a brass link settling on its book (pitch climbs a little with the chain) */
    link(n = 1) { const f = 1500 + 90 * Math.min(8, n); tone(f, 0, .09, .05, { type: 'triangle', attack: .003, send: .3 }); tone(f * 1.51, .01, .07, .025, { type: 'triangle', attack: .003, send: .3 }); },
    /** a chain letting go: links rattle down and land with a clunk */
    clunk() { for (let i = 0; i < 6; i++) tone(1100 - i * 90, .15 + i * .08, .06, .035, { type: 'triangle', attack: .003, send: .25 }); noise(.16, 'lowpass', 700, 150, .2, { at: .62, send: .3 }); tone(95, .62, .3, .16, { glide: .5, attack: .006, send: .3 }); },
    thud() { tone(80, 0, .35, .2, { glide: .6, attack: .008, send: .4 }); noise(.14, 'lowpass', 500, 120, .16, { send: .4 }); },
    /** tier chime: a pentatonic bell phrase that grows with tier (1 = single soft note) */
    chime(t) {
      if (!t) return;
      score.swell(t);
      const root = [0, 392, 440, 494, 523, 587, 659][t], voices = [0, 1, 2, 3, 4, 5, 6][t];
      const idx = [0, 2, 1, 3, 4, 6, 8].slice(0, voices);
      idx.forEach((k, i) => bell(note(root, k), i * .11, .07 - .005 * t, 1.2 + t * .25));
      if (t >= 4) tone(root / 2, 0, 2.4, .05, { attack: .08, send: .6 }); // warm low octave under the rare tiers
    },
    /** dramatic sting for the top tiers: low swell, rising shimmer, then a wide bell chord */
    sting(t) {
      if (t < 5) return;
      score.duck(3.5);
      const top = t >= 6, root = top ? 164.8 : 196;
      tone(root / 2, 0, 3.2, .1, { attack: .7, send: .7 }); tone(root / 4, 0, 3.6, .09, { attack: .9, send: .5 });
      noise(1.1, 'bandpass', 300, top ? 5200 : 3600, .09, { attack: .9, q: 1.5, send: .6 });
      [0, 2, 4, 7].forEach((k, i) => tone(note(root * 2, k), .35 + i * .16, 2, .035, { attack: .3, send: .8 }));
      const hit = top ? 1.15 : .95;
      [0, 3, 4, 6, 7, 9].slice(0, top ? 6 : 4).forEach((k, i) => bell(note(root * 2, k), hit + i * .06, top ? .08 : .06, 2.8));
    },
  };
})();
