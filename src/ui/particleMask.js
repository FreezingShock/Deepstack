/* Keeps overlay particles (#fx, drawn above the UI) from smearing over panels and text.
   Rects of solid UI surfaces are cached briefly; particles over them are faded, not removed. */
const SEL = '.sheet,.slip,.splaque,.cardnav,.hud:not([hidden]),#hud,.card,.book-card,button,input,textarea';
const FADE = 0.18; // alpha multiplier over a panel (1 = untouched)
let rects = [], stamp = -1e9;

function refresh(now) {
  stamp = now;
  rects = [];
  for (const el of document.querySelectorAll(SEL)) {
    if (el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 8 && r.height > 8) rects.push(r);
  }
}

/** Alpha multiplier (FADE..1) for a particle at viewport x,y; soft edge of 14px. */
export function particleVisibility(x, y, now = performance.now()) {
  if (now - stamp > 200) refresh(now);
  let m = 1;
  for (const r of rects) {
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    const d = Math.hypot(dx, dy);
    if (d < 14) m = Math.min(m, FADE + (1 - FADE) * (d / 14));
  }
  return m;
}
