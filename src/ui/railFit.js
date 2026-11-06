/* RA2: on phones the attic hatch sat in the middle of the rail, right on top of the Mute button. The hatch now takes
   whatever space is really free between the wordmark (and streak gauges) on the left and the buttons on the right.
   If even the smallest hatch will not fit, the streak gauges go first, then the keyboard button (Keys also lives in the
   card catalogue), then the wordmark shrinks a little, so Mute, Credits and Settings are always reachable. Pure planner + a thin DOM fitter. */
export const HATCH_MAX = 112, HATCH_MIN = 40, HATCH_PAD = 8;

/** Where the hatch goes in the free span [left, right] of a rail `width` wide: {x: centre, hw} or null when it will not fit. */
export function pickHatch(left, right, width, {max = HATCH_MAX, min = HATCH_MIN, pad = HATCH_PAD} = {}) {
  const hw = Math.min(max, Math.floor(right - left - 2 * (pad + 8)));   // the cue box is hw + 16 wide
  if (!(hw >= min)) return null;
  const half = (hw + 16) / 2, lo = left + pad + half, hi = right - pad - half;
  return {x: Math.round(Math.min(Math.max(width / 2, lo), hi)), hw};
}

/** Steps tried in order: each adds a class to #bar that hides one thing. */
export const FIT_STEPS = [[], ['fit-nogauge'], ['fit-nogauge', 'fit-nokeys'], ['fit-nogauge', 'fit-nokeys', 'fit-smallmark']];

let busy = false, wired = false;
const shown = e => !!(e && e.getClientRects().length);
export function fitRail(doc = document) {
  const bar = doc.querySelector('#bar'), cue = doc.querySelector('.attic-cue-home');
  if (!bar || !cue || busy) return null;
  busy = true;
  try {
    const W = bar.clientWidth;
    let plan = null;
    for (const step of FIT_STEPS) {
      for (const c of FIT_STEPS[FIT_STEPS.length - 1]) bar.classList.toggle(c, step.includes(c));
      const mark = doc.querySelector('#mark'), g = doc.querySelector('#barGauges'), nav = doc.querySelector('#barNav');
      const kids = [...nav.children].filter(shown);
      const left = Math.max(mark.getBoundingClientRect().right, shown(g) ? g.getBoundingClientRect().right : 0);
      const right = kids.length ? Math.min(...kids.map(k => k.getBoundingClientRect().left)) : W;
      plan = pickHatch(left, right, W);
      if (plan) break;
    }
    const hw = plan ? plan.hw : HATCH_MIN;
    cue.style.setProperty('--hw', hw + 'px');
    cue.style.left = plan ? plan.x + 'px' : '';
    cue.dataset.tight = hw < 64 ? '1' : '';
    return plan;
  } finally { busy = false; }
}

/** Call once; refits on resize and when the rail's parts change size (gauges filling in, text scale). */
export function initRailFit(doc = document) {
  if (wired) return; wired = true;
  let raf = 0;
  const go = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => fitRail(doc)); };
  addEventListener('resize', go);
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(go);
    for (const s of ['#mark', '#barGauges']) { const e = doc.querySelector(s); if (e) ro.observe(e); }
  }
  go();
}
