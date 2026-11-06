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
    syncFlame(doc, bar, cue);
    return plan;
  } finally { busy = false; }
}

/* RA9: when the streak plate has had to hide, a small flame tag hangs beside the hatch's cord so the number is still there. */
export function syncFlame(doc, bar, cue) {
  const on = bar.classList.contains('fit-nogauge'), n = doc.querySelector('#bgStreak'), dot = doc.querySelector('#bgStreakRoom .rl-dot');
  let el = cue.querySelector('.ach-flame');
  if (!on || !n) { if (el) el.hidden = true; return; }
  if (!el) { el = doc.createElement('span'); el.className = 'ach-flame'; el.setAttribute('aria-hidden', 'true'); cue.appendChild(el); }
  el.hidden = false;
  el.style.setProperty('--c', (dot && dot.style.getPropertyValue('--c')) || '255,140,60');
  el.innerHTML = '<svg viewBox="0 0 16 16" width="11" height="11"><path d="M8 1.5c.4 2.2-1.9 3.2-1.9 5.4 0 .8.3 1.3.7 1.7-.1-1 .5-1.8 1.2-2.4.2 1.5 1.7 2.3 1.7 4A2.6 2.6 0 0 1 8 13a3.3 3.3 0 0 1-3.3-3.3C4.7 6 8 5 8 1.5z" fill="currentColor"/></svg><b></b>';
  el.querySelector('b').textContent = n.textContent;
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
  setInterval(() => { const bar = doc.querySelector('#bar'), cue = doc.querySelector('.attic-cue-home'); if (bar && cue) syncFlame(doc, bar, cue); }, 1500);
  go();
}
