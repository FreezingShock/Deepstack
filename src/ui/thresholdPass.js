// Walking through a floor door. While the camera travels, a gentle slow-down hugs each door it crosses
// (a held breath, then on again), and as the door goes by its hanging sign gives one small damped swing,
// as if you had brushed past it. Pure functions plus a tiny tracker; world.js calls them from its camera
// branches. Reduced motion: no slow-down, no swing (the camera is untouched).
import {FLOORS} from '../core/floors.js';

export const PASS = Object.freeze({
  dip: .5,       // fraction of speed shed at the very threshold (1 - dip is the slowest speed)
  reach: 1.1,    // half-width of the slow zone, in shelf rows
  edge: .1,      // trip fraction over which the effect fades in and out, so a trip's ends never move
  swing: .075,   // sign swing at its first peak, radians (about 4 degrees)
  swingMs: 2600, // time for the swing to die away
  swingHz: .9    // swings per second
});

const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };

/** Camera position (px) that puts a floor's door row in the middle of the screen. Floors with row 0 have no door. */
export const doorCam = (fl, RH, H) => fl.row * RH + RH / 2 - H / 2;
export const doors = (RH, H) => FLOORS.filter(f => f.row > 0).map(f => ({row: f.row, key: f.key, cam: doorCam(f, RH, H)}));

/** How much the camera is held back at `cam` by the doors (px, signed). Zero far from every door. */
export function dipOffset(cam, RH, H, list = doors(RH, H)) {
  const s = RH * PASS.reach; let off = 0;
  for (const d of list) { const x = cam - d.cam; if (Math.abs(x) < s * 3) off -= PASS.dip * x * Math.exp(-(x / s) * (x / s)); }
  return off;
}

/** Strength of the effect through a trip: 0 at both ends, 1 in between. */
export const tripWeight = u => smooth(u / PASS.edge) * smooth((1 - u) / PASS.edge);

/** Camera for a trip of progress u whose undisturbed position is `base`. Returns base when motion is reduced. */
export function passCam(base, u, RH, H, reduced, list) {
  if (reduced) return base;
  return base + tripWeight(u) * dipOffset(base, RH, H, list);
}

/** Sign angle (radians) `age` ms after the door was passed; `dir` is +1 going down, -1 going up. */
export function swingAngle(age, dir = 1) {
  if (age < 0 || age > PASS.swingMs) return 0;
  const k = age / PASS.swingMs;
  return dir * PASS.swing * (1 - k) * (1 - k) * Math.sin(2 * Math.PI * PASS.swingHz * age / 1000);
}

/** Remembers the previous camera and starts a swing when the door line is crossed. */
export function createPass() {
  let prev = null; const swings = new Map(); // floor row -> {t0, dir}
  return {
    /** call each frame of a camera trip with the camera it just used. Returns the keys of floors crossed. */
    track(cam, now, RH, H, reduced, list = doors(RH, H)) {
      const crossed = [];
      if (prev !== null && !reduced && Math.abs(cam - prev) < RH * 3) {
        for (const d of list) if ((prev - d.cam) * (cam - d.cam) < 0 || (cam === d.cam && prev !== cam)) {
          swings.set(d.row, {t0: now, dir: cam > prev ? 1 : -1}); crossed.push(d.key);
        }
      }
      prev = cam; return crossed;
    },
    /** call when no trip is running, so the next trip does not compare against an old position. */
    idle() { prev = null; },
    /** angle for the sign on the floor starting at `row`, right now. */
    angle(row, now) {
      const s = swings.get(row); if (!s) return 0;
      if (now - s.t0 > PASS.swingMs) { swings.delete(row); return 0; }
      return swingAngle(now - s.t0, s.dir);
    },
    get active() { return swings.size > 0; },
    clear() { swings.clear(); prev = null; }
  };
}
