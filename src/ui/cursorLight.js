/* Pointer light (backlog 26, reworked). The normal system cursor stays everywhere. On fine pointers a
   soft warm pool of light follows it, but only over dark ground (the world canvas and bare page),
   fading out over lit surfaces such as paper, cards and controls. No sprite is drawn.
   Cost: one transformed element. The rAF loop runs only while the light is catching up to the pointer;
   fades use the shared motion tokens in CSS. */

export const LIGHT_LAG_MS = 140;   // glow time constant: trails the hand
// Surfaces that are already lit, where the pool would only wash them out.
export const LIT_SEL = 'a,button,[role="button"],summary,label,select,input,textarea,[contenteditable],.lnk,.ledgebook,.hbook,[data-book],[tabindex]:not([tabindex="-1"]),.card,.paper,.page,.slip,.panel,dialog,[role="dialog"]';
/** Where the glow is and whether it is lit, for the world's light map (lighting.js) to reveal what is under it. */
export const pointerLightState = { x: -99, y: -99, on: false };
export const DARK_SEL = 'canvas,html,body';

/** Exponential approach: fraction of the remaining gap closed in dt ms. Frame-rate independent. */
export function follow(cur, target, dt, tau) {
  return cur + (target - cur) * (1 - Math.exp(-Math.max(0, dt) / tau));
}

/** Should the light exist at all? Fine, hovering pointer and motion not reduced. */
export function lightEnabled({ fine, hover, reduced }) { return !!fine && !!hover && !reduced; }

/** True when the element under the pointer is dark ground that the light should brighten. */
export function isDarkSpot(el) {
  if (!el || !el.closest) return false;
  if (el.closest(LIT_SEL)) return false;
  return !!el.closest(DARK_SEL) && (el.matches ? el.matches(DARK_SEL) || !!el.closest('#world') : true);
}

export function initCursorLight({ doc = globalThis.document, win = globalThis.window, reduced = false } = {}) {
  if (!doc || !win || !win.matchMedia) return null;
  const mqFine = win.matchMedia('(pointer: fine)'), mqHover = win.matchMedia('(hover: hover)');
  if (!lightEnabled({ fine: mqFine.matches, hover: mqHover.matches, reduced })) return null;

  const root = doc.createElement('div');
  root.id = 'pointerLight'; root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<i class="pl-glow"></i>';
  doc.body.appendChild(root);
  const glow = root.firstChild;

  let tx = -99, ty = -99, gx = tx, gy = ty, last = 0, raf = 0, seen = false, over = null;

  const draw = () => { pointerLightState.x = gx; pointerLightState.y = gy; glow.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)`; };
  const setOn = on => { pointerLightState.on = on; root.classList.toggle('on', on); };
  function tick(now) {
    raf = 0;
    const dt = Math.min(64, now - last || 16); last = now;
    gx = follow(gx, tx, dt, LIGHT_LAG_MS); gy = follow(gy, ty, dt, LIGHT_LAG_MS);
    draw();
    if (Math.abs(gx - tx) + Math.abs(gy - ty) > .1) raf = win.requestAnimationFrame(tick);
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = win.requestAnimationFrame(tick); } };

  function onMove(e) {
    if (e.pointerType === 'touch') { setOn(false); seen = false; return; }
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; gx = tx; gy = ty; draw(); }
    if (e.target !== over) { over = e.target; setOn(isDarkSpot(over)); }
    wake();
  }
  const off = () => { setOn(false); seen = false; over = null; };
  doc.addEventListener('pointermove', onMove, { passive: true });
  doc.addEventListener('pointerleave', off);
  doc.documentElement.addEventListener('mouseleave', off);
  win.addEventListener('blur', off);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) off(); });
  return { root, destroy() { off(); win.cancelAnimationFrame(raf); root.remove(); } };
}
