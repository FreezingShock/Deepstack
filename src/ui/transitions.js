// Smooth screen transitions. Screens are toggled with the `hidden` attribute elsewhere;
// this module watches them so every change fades instead of snapping, without touching
// the code that toggles them. Hiding leaves a short-lived ghost copy that fades out.
const SCREENS = ['#home', '#stage', '#final', '#all', '#stats', '#sets'];
export const OUT_MS = 260;

export function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ghostOf(el) {
  if (reducedMotion() || !el.isConnected || !el.innerHTML.trim()) return;
  if (el.classList.contains('out') || getComputedStyle(el).opacity === '0') return;
  const g = el.cloneNode(true);
  g.removeAttribute('hidden'); g.removeAttribute('id');
  g.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  g.querySelectorAll('button,a,input,textarea,[tabindex]').forEach(n => n.setAttribute('tabindex', '-1'));
  g.setAttribute('aria-hidden', 'true'); g.inert = true;
  g.classList.remove('fadein'); g.classList.add('ghost-out');
  el.parentNode.insertBefore(g, el.nextSibling);
  setTimeout(() => g.remove(), OUT_MS + 40);
}

export function initTransitions(root = document) {
  const seen = new WeakMap();
  const watch = el => {
    seen.set(el, el.hidden);
    new MutationObserver(() => {
      const was = seen.get(el), now = el.hidden;
      if (was === now) return;
      seen.set(el, now);
      if (now) ghostOf(el);
      else if (!reducedMotion() && !el.classList.contains('fadein')) {
        el.classList.add('fadein'); setTimeout(() => el.classList.remove('fadein'), 600);
      }
    }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  };
  SCREENS.forEach(s => { const el = root.querySelector(s); if (el) watch(el); });
  // #sets is created lazily by sets/ui.js
  new MutationObserver((_, o) => { const el = root.querySelector('#sets'); if (el) { watch(el); o.disconnect(); } })
    .observe(root.body || root, { childList: true });
}
