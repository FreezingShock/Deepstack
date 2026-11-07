import {motionNow} from './settings.js';
// Smooth screen transitions. Screens are toggled with the `hidden` attribute elsewhere;
// this module watches them so every change fades instead of snapping, without touching
// the code that toggles them. Hiding leaves a short-lived ghost copy that fades out.
const SCREENS = ['#home', '#stage', '#final', '#all', '#stats', '#sets'];
export const OUT_MS = 260;
// Chrome that is positioned by its id (or by a transform) fades out only, keeping its id on the ghost
const CHROME = ['#depthHud', '#shelfcap'];

export function reducedMotion() {
  return motionNow();
}

function ghostOf(el, chrome = false) {
  if (reducedMotion() || !el.isConnected || !el.innerHTML.trim()) return;
  if (el.classList.contains('out') || getComputedStyle(el).opacity === '0') return;
  const g = el.cloneNode(true);
  g.removeAttribute('hidden');
  if (!chrome) g.removeAttribute('id');
  g.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  g.querySelectorAll('button,a,input,textarea,[tabindex]').forEach(n => n.setAttribute('tabindex', '-1'));
  g.setAttribute('aria-hidden', 'true'); g.inert = true;
  g.classList.remove('fadein'); g.classList.add(chrome ? 'ghost-fade' : 'ghost-out');
  el.parentNode.insertBefore(g, el.nextSibling);
  setTimeout(() => g.remove(), OUT_MS + 40);
}

export function initTransitions(root = document) {
  const seen = new WeakMap();
  const watch = (el, chrome = false) => {
    seen.set(el, el.hidden);
    new MutationObserver(() => {
      const was = seen.get(el), now = el.hidden;
      if (was === now) return;
      seen.set(el, now);
      if (now) ghostOf(el, chrome);
      else if (chrome) return;
      else if (!reducedMotion() && !el.classList.contains('fadein')) {
        el.classList.add('fadein'); setTimeout(() => el.classList.remove('fadein'), 600);
      }
    }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  };
  SCREENS.forEach(s => { const el = root.querySelector(s); if (el) watch(el); });
  CHROME.forEach(s => { const el = root.querySelector(s); if (el) watch(el, true); });
  // #sets is created lazily by sets/ui.js
  new MutationObserver((_, o) => { const el = root.querySelector('#sets'); if (el) { watch(el); o.disconnect(); } })
    .observe(root.body || root, { childList: true });
}
