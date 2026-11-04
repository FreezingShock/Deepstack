/* Quality tiers for slow devices. One place decides how much the world may spend:
   effects read `params()` (or `scale()`), nobody else guesses.
     high   everything as designed
     medium lighter DPR, ~60% particles and dust
     low    DPR 1, 30 fps canvas, ~30% particles, little dust, no creatures
   `pref` is 'auto' (default), 'high', 'medium' or 'low'. Auto starts from device hints (memory, cores,
   data saver) and steps down once or twice if the first seconds of frames are slow. A manual choice is
   never overridden. Stored under its own key so the save and the settings shape are untouched. */

export const QUALITY_KEY = 'deepstack.quality.v1';
export const TIER_NAMES = ['high', 'medium', 'low'];
export const PREFS = ['auto', ...TIER_NAMES];

export const TIERS = Object.freeze({
  high:   Object.freeze({name: 'high',   dprMax: 2,   frameMs: 0,        particles: 1,   particleCap: 1000, dust: 100, ambient: true,  glow: true}),
  medium: Object.freeze({name: 'medium', dprMax: 1.5, frameMs: 0,        particles: 0.6, particleCap: 500,  dust: 60,  ambient: true,  glow: true}),
  low:    Object.freeze({name: 'low',    dprMax: 1,   frameMs: 1000 / 30, particles: 0.3, particleCap: 200,  dust: 25,  ambient: false, glow: false}),
});

export function sanitizePref(v) { return PREFS.includes(v) ? v : 'auto'; }

/** Starting tier from what the browser admits about the device. env: {deviceMemory, hardwareConcurrency, saveData}. */
export function detectTier(env = {}) {
  const mem = Number(env.deviceMemory), cores = Number(env.hardwareConcurrency);
  if (env.saveData) return 'low';
  if (mem > 0 && mem <= 2) return 'low';
  if (cores > 0 && cores <= 2) return 'low';
  if ((mem > 0 && mem <= 4) && (cores > 0 && cores <= 4)) return 'medium';
  return 'high';
}

export const stepDown = t => TIER_NAMES[Math.min(TIER_NAMES.length - 1, TIER_NAMES.indexOf(t) + 1)] || 'low';

/** Frame watcher: feed it frame timestamps; after `n` frames it says whether the median frame was too slow. */
export function createFrameWatch({n = 90, slowMs = 28, skip = 20} = {}) {
  let last = -1, seen = 0, buf = [];
  return {
    /** returns true once per window when the median interval exceeds slowMs; null while collecting. */
    feed(ts) {
      if (last < 0) { last = ts; return null; }
      const d = ts - last; last = ts;
      if (d > 250) return null; // tab was hidden or a long stall: not a signal
      if (++seen <= skip) return null; // warm-up (fonts, first paint)
      buf.push(d);
      if (buf.length < n) return null;
      const s = buf.slice().sort((a, b) => a - b), med = s[s.length >> 1];
      buf = [];
      return med > slowMs;
    },
    reset() { last = -1; seen = 0; buf = []; },
  };
}

export function createQuality({storage, env = {}, doc, watch = createFrameWatch(), maxAutoSteps = 2} = {}) {
  let pref = 'auto', base = detectTier(env), steps = 0, subs = [];
  try { if (storage) pref = sanitizePref(JSON.parse(storage.getItem(QUALITY_KEY))?.pref); } catch (e) { pref = 'auto'; }
  const tier = () => pref === 'auto' ? (steps ? TIER_NAMES[Math.min(2, TIER_NAMES.indexOf(base) + steps)] : base) : pref;
  let shown = null;
  const emit = () => {
    const t = tier();
    if (doc && doc.documentElement) { doc.documentElement.dataset.quality = t; }
    if (t === shown) return;
    shown = t; subs.slice().forEach(f => { try { f(TIERS[t]); } catch (e) {} });
  };
  const api = {
    pref: () => pref,
    tier,
    params: () => TIERS[tier()],
    /** multiply a count by the particle budget; keeps at least 1 when n > 0 */
    scale: n => n > 0 ? Math.max(1, Math.round(n * TIERS[tier()].particles)) : 0,
    setPref(p) {
      pref = sanitizePref(p); steps = 0; watch.reset();
      try { storage && storage.setItem(QUALITY_KEY, JSON.stringify({pref})); } catch (e) {}
      emit();
    },
    subscribe(fn) { subs.push(fn); return () => { subs = subs.filter(f => f !== fn); }; },
    /** call once per displayed frame with the rAF timestamp; only acts in auto mode */
    sample(ts) {
      if (pref !== 'auto' || steps >= maxAutoSteps || tier() === 'low') return;
      if (watch.feed(ts) === true) { steps++; emit(); }
    },
  };
  emit();
  return api;
}

function liveEnv() {
  try {
    const n = navigator;
    return {deviceMemory: n.deviceMemory, hardwareConcurrency: n.hardwareConcurrency, saveData: !!n.connection?.saveData};
  } catch (e) { return {}; }
}
function liveStorage() { try { return globalThis.localStorage; } catch (e) { return undefined; } }

export const Quality = createQuality({storage: liveStorage(), env: liveEnv(), doc: globalThis.document});
