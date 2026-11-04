// A short dark dip over the canvas world, used to hide an instant swap of what the world shows
// (e.g. jumping from the home shelf to the replayed descent). cover() resolves once the world is hidden.
import {reducedMotion} from './transitions.js';

export const DIP_MS = 220;
let veil = null;

export function coverWorld() {
  if (reducedMotion() || typeof document === 'undefined') return Promise.resolve();
  if (!veil) {
    veil = document.createElement('div');
    veil.className = 'world-dip'; veil.setAttribute('aria-hidden', 'true');
    document.body.appendChild(veil);
  }
  veil.classList.remove('lift');
  void veil.offsetWidth;
  veil.classList.add('on');
  return new Promise(r => setTimeout(r, DIP_MS));
}

export function liftWorld() {
  if (!veil) return;
  const v = veil; veil = null;
  v.classList.remove('on'); v.classList.add('lift');
  setTimeout(() => v.remove(), DIP_MS + 400);
}
