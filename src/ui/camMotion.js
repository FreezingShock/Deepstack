// Shared timing + easing for the library's long camera travels (ascent home,
// descent into a run, glide to Today's Result / replay). One place so every trip
// feels the same: accelerate in, cruise, ease out, with the duration scaling
// gently with distance but clamped so the Abyss is never a crawl or a teleport.
export const TRAVEL_MIN_MS = 1200;
export const TRAVEL_MAX_MS = 2500;
export const RM_MS = 200;

const ACCEL = 0.28, DECEL = 0.42; // fractions of the trip; longer settle than launch
const V = 1 / (1 - (ACCEL + DECEL) / 2); // cruise speed so the profile covers exactly 1

// u in [0,1] -> progress in [0,1]: quadratic accel, constant cruise, quadratic decel (C1-smooth).
export function travelEase(u) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (u < ACCEL) return (V * u * u) / (2 * ACCEL);
  if (u < 1 - DECEL) return (V * ACCEL) / 2 + V * (u - ACCEL);
  const r = 1 - u;
  return 1 - (V * r * r) / (2 * DECEL);
}

// Duration in ms for a trip of `rows` shelf rows (sqrt-ish growth: far trips don't drag).
export function travelMs(rows, reduced = false) {
  if (reduced) return RM_MS;
  const d = Math.abs(rows) || 0;
  const ms = TRAVEL_MIN_MS + Math.sqrt(d) * 55;
  return Math.round(Math.min(TRAVEL_MAX_MS, Math.max(TRAVEL_MIN_MS, ms)));
}

// Return trip home: players have already seen the shelves, so it is much shorter than a descent.
export function ascendMs(rows, reduced = false) {
  if (reduced) return RM_MS;
  const d = Math.abs(rows) || 0;
  return Math.round(Math.min(1200, Math.max(650, 650 + Math.sqrt(d) * 40)));
}
