/* Pure data for the book-reveal particles: what each tier throws, in what shapes. No DOM here so it can be tested.
   Rarity is the hero: Pamphlet is a puff of dust, every tier up adds one more kind of motion, Apocrypha implodes then detonates.
   Counts are at quality 1 and are multiplied by the engine's quality scale. Times are seconds, speeds are px/s. */

/** Mix a #rrggbb colour toward white (k 0..1) or black (k<0). */
export function tint(hex, k) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16), ch = [n >> 16 & 255, n >> 8 & 255, n & 255];
  const t = k >= 0 ? 255 : 0, a = Math.abs(k);
  return '#' + ch.map(c => Math.round(c + (t - c) * a).toString(16).padStart(2, '0')).join('');
}

const clampT = t => Math.max(0, Math.min(6, t | 0));

/** Emitter kinds (see revealFx.js): spray, spiral, stars, rise, flecks, rain, implode. `spr` is the sprite: dot, streak, star, fleck. */
export function revealRecipe(tier) {
  const t = clampT(tier);
  const R = [];
  const ring = (r, max, delay = 0) => R.push({k: 'ring', r, max, delay});
  const spray = (n, o) => R.push({k: 'spray', n, spr: 'dot', sp: [80, 300], life: [.6, 1.3], size: [2, 5], g: 240, drag: .8, up: 80, delay: 0, hot: .35, ...o});
  const spiral = (n, o) => R.push({k: 'spiral', n, spr: 'dot', life: [.9, 1.7], size: [2, 4], spin: 1.6, out: 150, delay: 0, hot: .3, ...o});
  const stars = (n, o) => R.push({k: 'stars', n, spr: 'star', life: [.8, 1.9], size: [3, 7], reach: [30, 190], delay: 0, ...o});
  const rise = (n, o) => R.push({k: 'rise', n, spr: 'dot', life: [1.6, 3.2], size: [1.6, 3.6], reach: [20, 140], delay: 0, ...o});
  const flecks = (n, o) => R.push({k: 'flecks', n, spr: 'fleck', life: [1.2, 2.4], size: [2.5, 5], g: 150, delay: 0, ...o});
  const rain = (n, o) => R.push({k: 'rain', n, spr: 'dot', life: [1.4, 2.6], size: [1.6, 3.4], over: 1.2, delay: .3, ...o});
  const implode = (n, o) => R.push({k: 'implode', n, spr: 'dot', life: .55, size: [2, 4], radius: [180, 320], delay: 0, ...o});
  if (t === 0) { spray(12, {sp: [30, 110], up: 20, g: 60, size: [3, 6], hot: 0, soft: true}); flecks(5); }
  else if (t === 1) { spray(18, {sp: [50, 190]}); flecks(8); }
  else if (t === 2) { ring(170, .7); spray(26, {spr: 'streak', sp: [120, 330]}); flecks(10); }
  else if (t === 3) { ring(200, .8); ring(300, 1.1, .1); spray(34, {spr: 'streak'}); stars(10, {delay: .15}); rise(14); flecks(10); }
  else if (t === 4) {
    ring(230, .85); ring(340, 1.2, .12);
    spiral(34, {delay: .05}); spray(44, {spr: 'streak', sp: [140, 380]}); stars(16, {delay: .2}); rise(24); rain(22, {spr: 'star', size: [2, 4], delay: .45});
  } else if (t === 5) {
    ring(260, .9); ring(380, 1.2, .1); ring(500, 1.5, .22);
    spiral(48, {out: 190, spin: 2.2}); spray(54, {spr: 'streak', sp: [160, 420]}); stars(18, {delay: .2}); rise(40, {reach: [60, 260], up: 1});
    rain(36, {delay: .35, over: 1.6});
  } else {
    implode(60, {delay: 0});
    ring(300, 1.0, .5); ring(440, 1.4, .6); ring(600, 1.8, .72);
    spray(90, {spr: 'streak', sp: [200, 520], delay: .55, g: 160}); spiral(60, {out: 230, spin: 2.8, delay: .55});
    stars(30, {delay: .6, reach: [60, 380], life: [1, 2.4]}); rise(44, {delay: .6, reach: [80, 320]}); rain(40, {delay: .9, over: 2});
  }
  return R;
}

/** The smaller follow-up when the verdict line lands (Folio and above). */
export function settleRecipe(tier) {
  const t = clampT(tier);
  if (t < 3) return [];
  return [{k: 'stars', n: 8 + t * 3, spr: 'star', life: [.9, 1.8], size: [2.5, 5.5], reach: [30, 150], delay: 0}, {k: 'rise', n: 8 + t * 3, spr: 'dot', life: [1.4, 2.6], size: [1.4, 3], reach: [20, 100], delay: .05}];
}

/** When a book lands in its niche at the end of the descent. */
export function landRecipe(tier) {
  const t = clampT(tier);
  return [{k: 'ring', r: 120 + t * 30, max: .6, delay: 0}, {k: 'spray', n: 6 + t * 4, spr: 'dot', sp: [50, 200], life: [.5, 1.1], size: [1.6, 3.4], g: 220, drag: .8, up: 60, delay: 0, hot: .3}];
}

/** Total particle count of a recipe at quality q (rings excluded). */
export function recipeCount(rec, q = 1) { return rec.reduce((s, e) => s + (e.k === 'ring' ? 0 : Math.round(e.n * q)), 0); }

/* ---- The ceremony: everything around the particles, one row per tier ----
   rays/rune/vig are the backdrop (rays = beam count, rayA = beam opacity %, spin = seconds per turn);
   flash is the screen flash (peak opacity, at = ms after the reveal starts, up/down = ms, hue = how far the tier colour is lifted toward white);
   cover is how the book's cover swings open (ms, delay ms, so Apocrypha waits for its implosion);
   sound picks the cues (sting = rising swell + bell chord, chimeAt = ms after the cover opens);
   shake/slow are the camera feel; ink/pulse are the tier name treatments; hold is how long the backdrop lingers (ms).
   Rows only ever get richer going up, which the tests pin. Pamphlet and Paperback stay plain on purpose. */
const CEREMONY = [
  /* 0 Pamphlet */ {vig: 0,   rays: 0,  rayA: 0,  spin: 0,  rune: false, runeSpin: 0,  embers: 0,  flash: null, cover: {ms: 520, delay: 0},   sound: {sting: false}, shake: null, slow: null, ink: false, pulse: false, hold: 0},
  /* 1 Paperback */ {vig: 0,  rays: 0,  rayA: 0,  spin: 0,  rune: false, runeSpin: 0,  embers: 0,  flash: null, cover: {ms: 560, delay: 0},   sound: {sting: false}, shake: null, slow: null, ink: false, pulse: false, hold: 0},
  /* 2 Hardbound */ {vig: 0,  rays: 0,  rayA: 0,  spin: 0,  rune: false, runeSpin: 0,  embers: 0,  flash: null, cover: {ms: 600, delay: 0},   sound: {sting: false}, shake: null, slow: null, ink: false, pulse: false, hold: 0},
  /* 3 Folio */     {vig: .18, rays: 6,  rayA: 26, spin: 48, rune: false, runeSpin: 0,  embers: 0,  flash: null, cover: {ms: 640, delay: 0},   sound: {sting: false}, shake: null, slow: null, ink: false, pulse: false, hold: 0},
  /* 4 Codex */     {vig: .32, rays: 8,  rayA: 32, spin: 40, rune: false, runeSpin: 0,  embers: 0,  flash: {peak: .14, at: 60,  up: 140, down: 900,  hue: .45}, cover: {ms: 700, delay: 60},  sound: {sting: false}, shake: {amp: 6.4, ms: 600},  slow: {scale: .6, ms: 1200}, ink: true, pulse: false, hold: 900},
  /* 5 Grimoire */  {vig: .46, rays: 10, rayA: 38, spin: 32, rune: true,  runeSpin: 60, embers: 10, flash: {peak: .28, at: 120, up: 160, down: 1200, hue: .55}, cover: {ms: 780, delay: 140}, sound: {sting: true}, shake: {amp: 7.5, ms: 600},  slow: {scale: .4, ms: 1200}, ink: true, pulse: true, hold: 1300},
  /* 6 Apocrypha */ {vig: .6,  rays: 14, rayA: 46, spin: 22, rune: true,  runeSpin: 40, embers: 18, flash: {peak: .55, at: 520, up: 250, down: 1600, hue: .7},  cover: {ms: 900, delay: 480}, sound: {sting: true}, shake: {amp: 8.6, ms: 900},  slow: {scale: .25, ms: 1700}, ink: true, pulse: true, hold: 1900},
];
for (const r of CEREMONY) { Object.freeze(r.cover); Object.freeze(r.sound); r.flash && Object.freeze(r.flash); r.shake && Object.freeze(r.shake); r.slow && Object.freeze(r.slow); Object.freeze(r); }

/** One tier's whole reveal besides the particles (which revealRecipe owns). */
export function revealCeremony(tier) { return CEREMONY[clampT(tier)]; }

/** What the ceremony costs on a given Quality.params(): no glow means no rune, fewer and fainter rays, a gentler flash. */
export function ceremonyFor(tier, params = {}) {
  const c = revealCeremony(tier);
  if (params.glow !== false) return c;
  return {...c, rune: false, embers: 0, rays: c.rays ? Math.max(4, c.rays >> 1) : 0, rayA: Math.round(c.rayA * .6), flash: c.flash && {...c.flash, peak: c.flash.peak * .6}};
}
