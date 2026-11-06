// Vertical fit of the lit alcove: it sits centred in the window with half a shelf row of books showing above it
// (under the top rail) and half a row below it. The row height is nudged so the shelves line up with that:
// the row above the alcove ends on a plank at its top frame, and the row below starts at its upper half.
// Pure, so test/alcove-fit.test.js can pin it across window sizes.
export const FRAME = 16; // the alcove's carved frame, above and below, in px
export const FOOT = 12;  // a row's plank sits this far above the row's bottom edge (see drawRow)

/** The natural row height for a window: short windows get shorter shelves. */
export function wantRow(H) {
  const lo = Math.min(108, Math.max(70, H * .2));
  return Math.min(172, Math.max(lo, H * .22));
}

/**
 * @param H window height; bar height of the top rail (incl. safe area); BM bottom margin
 * @returns {{RH:number, m:number, top:number, bottom:number, h:number}}
 *   RH row height; m whole rows from the plank above the alcove to the plank under it;
 *   top/bottom the alcove's box (y of its top and bottom edge from the window top, resting state); h its height.
 */
let memoKey = '', memo = null;
export function alcoveFit(H, bar, BM) {
  const key = H + '|' + bar + '|' + BM;
  if (key === memoKey) return memo;
  return (memo = compute(H, bar, BM), memoKey = key, memo);
}
function compute(H, bar, BM) {
  const base = H - BM - FOOT, room = base - bar;           // from the rail to the bottom row's plank
  const want = wantRow(H), oldH = H - want - Math.max(BM, 20) - 10 - bar - FRAME; // the alcove before centring (its bottom margin was stuck at 20)
  let best = null;
  for (let m = 1; m <= 30; m++) {
    const RH = room / (m + .5);
    if (RH < 64 || RH > 190) continue;
    const h = room - RH - FRAME * 2;
    const c = {RH, m, h, cost: Math.abs(Math.log(RH / want)) + (h < oldH - 2 ? 10 : 0)}; // never trade away the alcove's height on short windows
    if (!best || c.cost < best.cost) best = c;
  }
  if (!best) { const RH = Math.max(40, Math.min(want, room / 2)); best = {RH, m: 1, h: room - RH - FRAME * 2}; }
  const top = bar + FRAME + best.RH / 2, bottom = base - best.RH / 2 - FRAME;
  return {RH: best.RH, m: best.m, top, bottom, h: bottom - top};
}
