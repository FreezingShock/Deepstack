// Click-to-descend transition: the button presses in, the home sheet sinks and the
// library darkens from the button outward; the game starts under the veil, which then lifts.
import {reducedMotion} from './transitions.js';

let busy = false;
export function descendInto(btn, go) {
  if (busy) return;
  if (reducedMotion() || !btn || !btn.getBoundingClientRect) return go();
  busy = true;
  const home = btn.closest('#home'), r = btn.getBoundingClientRect();
  const veil = document.createElement('div');
  veil.className = 'descend-veil'; veil.setAttribute('aria-hidden', 'true');
  veil.style.setProperty('--vx', (r.left + r.width / 2) + 'px');
  veil.style.setProperty('--vy', (r.top + r.height / 2) + 'px');
  btn.classList.add('pressed'); home && home.classList.add('descending');
  document.body.appendChild(veil);
  setTimeout(() => {
    home && home.classList.remove('descending');
    try { go(); } finally {
      veil.classList.add('lift');
      setTimeout(() => { veil.remove(); busy = false; }, 700);
    }
  }, 650);
}
