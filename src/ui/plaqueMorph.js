/* The Descend plaque between rooms: the box stays, its button glides to its new place and size, and the words that
   changed type themselves in from the middle (src/ui/typewrite.js). Used by src/app/roomGo.js around the home redraw:
   snap before it, morph after it. Web Animations only, nothing is left behind on the elements. */
import {typewrite} from './typewrite.js';
import {DUR, EASE as TOKEN} from './motion.js';

const GLIDE = [['.descend', 'btn'], ['.hz-plaque .plaque-second', 'second'], ['.hz-plaque .next', 'next']];
const WORDS = ['.descend .d-t', '.descend .d-sub', '.hz-plaque .next', '#bRes'];
const MS = DUR.smooth, EASE = TOKEN.cruise; // the shared table: same values as before (360 ms, cruise)
const box = el => { const r = el.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; };

/** What the plaque looks like now: where its pieces are and what they say. */
export function snapPlaque(home) {
  const s = {at: {}, words: {}};
  if (!home) return s;
  for (const [sel, k] of GLIDE) { const el = home.querySelector(sel); if (el) s.at[k] = box(el); }
  for (const sel of WORDS) { const el = home.querySelector(sel); s.words[sel] = el ? el.textContent.trim() : null; }
  return s;
}

/** After the redraw: glide each piece from where it was, type the words that changed. `still`: reduced motion, do nothing. */
export function morphPlaque(home, snap, {still = false, delay = 90} = {}) {
  if (!home || !snap || still || typeof Element === 'undefined' || !Element.prototype.animate) return;
  for (const [sel, k] of GLIDE) {
    const el = home.querySelector(sel); if (!el) continue;
    const was = snap.at[k], now = box(el);
    if (!was) { el.animate([{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'none'}], {duration: MS, easing: EASE, delay}); continue; }
    const dx = was.x - now.x, dy = was.y - now.y, grow = Math.abs(was.w - now.w) > 2 || Math.abs(was.h - now.h) > 2;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && !grow) continue;
    const from = {transform: `translate(${dx}px,${dy}px)`}, to = {transform: 'none'};
    if (grow && k === 'btn') { from.width = was.w + 'px'; from.height = was.h + 'px'; to.width = now.w + 'px'; to.height = now.h + 'px'; }
    el.animate([from, to], {duration: MS, easing: EASE});
  }
  WORDS.forEach((sel, i) => {
    const el = home.querySelector(sel); if (!el) return;
    if (snap.words[sel] !== el.textContent.trim()) typewrite(el, {delay: delay + i * 30});
  });
}
