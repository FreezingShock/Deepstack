/* Candle cursor (backlog 26). On fine pointers a small flame replaces the arrow and a soft warm
   pool of light follows it, lifting the spines and brass nearby. Off on touch and in reduced motion.
   Cost: two transformed elements. The rAF loop runs only while the light is still catching up to
   the pointer (flicker and breathing are pure CSS on the compositor), and hover state is read from
   the element under the pointer, never from layout. */

// Timings follow the shared "settle" feel; swap for src/ui/motion.js presets once item 22 lands.
export const LIGHT_LAG_MS = 140;   // glow time constant: trails the hand
export const FLAME_LAG_MS = 45;    // flame time constant: nearly on the pointer
export const HOVER_SEL = 'a,button,[role="button"],summary,label,select,.lnk,.ledgebook,.hbook,[data-book],[tabindex]:not([tabindex="-1"])';
export const TEXT_SEL = 'input:not([type=button]):not([type=checkbox]):not([type=radio]):not([type=range]),textarea,[contenteditable=""],[contenteditable="true"]';

/** Exponential approach: fraction of the remaining gap closed in dt ms. Frame-rate independent. */
export function follow(cur, target, dt, tau) {
  return cur + (target - cur) * (1 - Math.exp(-Math.max(0, dt) / tau));
}

/** Should the candle exist at all? Fine, hovering pointer and motion not reduced. */
export function candleEnabled({ fine, hover, reduced }) { return !!fine && !!hover && !reduced; }

/** 'text' over editable fields (native caret stays), 'hand' over anything clickable, else 'idle'. */
export function stateFor(el) {
  if (!el || !el.closest) return 'idle';
  if (el.closest(TEXT_SEL)) return 'text';
  const c = el.style && el.style.cursor;
  if (c === 'pointer' || c === 'help' || el.closest(HOVER_SEL)) return 'hand';
  return 'idle';
}

export function initCursorLight({ doc = globalThis.document, win = globalThis.window, reduced = false } = {}) {
  if (!doc || !win || !win.matchMedia) return null;
  const mqFine = win.matchMedia('(pointer: fine)'), mqHover = win.matchMedia('(hover: hover)');
  if (!candleEnabled({ fine: mqFine.matches, hover: mqHover.matches, reduced })) return null;

  const root = doc.createElement('div');
  root.id = 'candleCursor'; root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<i class="cc-glow"></i><svg class="cc-flame" viewBox="0 0 20 32" width="20" height="32">'
    + '<path class="cc-outer" d="M10 1C14 8 18 13 18 20a8 8 0 0 1-16 0C2 13 6 9 10 1z"/>'
    + '<path class="cc-core" d="M10 12c2.4 3.4 4 5.4 4 8.2a4 4 0 0 1-8 0c0-2.8 1.6-4.8 4-8.2z"/>'
    + '<path class="cc-wick" d="M10 27v4"/></svg>';
  doc.body.appendChild(root);
  const glow = root.firstChild, flame = glow.nextSibling;
  const html = doc.documentElement;

  let tx = -99, ty = -99, gx = tx, gy = ty, fx = tx, fy = ty, last = 0, raf = 0, seen = false, state = 'idle', over = null;

  const setState = s => { if (s !== state) { state = s; root.dataset.state = s; html.classList.toggle('candle-text', s === 'text'); } };
  function draw() {
    glow.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)`;
    flame.style.transform = `translate3d(${fx.toFixed(1)}px,${fy.toFixed(1)}px,0)`;
  }
  function tick(now) {
    raf = 0;
    const dt = Math.min(64, now - last || 16); last = now;
    gx = follow(gx, tx, dt, LIGHT_LAG_MS); gy = follow(gy, ty, dt, LIGHT_LAG_MS);
    fx = follow(fx, tx, dt, FLAME_LAG_MS); fy = follow(fy, ty, dt, FLAME_LAG_MS);
    // canvas hover changes without a new pointerover, so re-read the inline cursor cheaply
    if (over) setState(stateFor(over));
    draw();
    if (Math.abs(gx - tx) + Math.abs(gy - ty) > .1 || Math.abs(fx - tx) + Math.abs(fy - ty) > .1) raf = win.requestAnimationFrame(tick);
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = win.requestAnimationFrame(tick); } };

  function onMove(e) {
    if (e.pointerType === 'touch') { root.classList.remove('on'); html.classList.remove('candle-on'); seen = false; return; }
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; gx = fx = tx; gy = fy = ty; root.classList.add('on'); html.classList.add('candle-on'); draw(); }
    if (e.target !== over) { over = e.target; setState(stateFor(over)); }
    wake();
  }
  const off = () => { root.classList.remove('on'); html.classList.remove('candle-on'); seen = false; over = null; };
  doc.addEventListener('pointermove', onMove, { passive: true });
  doc.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') root.classList.add('press'); }, { passive: true });
  doc.addEventListener('pointerup', () => root.classList.remove('press'), { passive: true });
  doc.addEventListener('pointerleave', off);
  doc.documentElement.addEventListener('mouseleave', off);
  win.addEventListener('blur', off);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) off(); });
  return { root, destroy() { off(); win.cancelAnimationFrame(raf); root.remove(); } };
}
