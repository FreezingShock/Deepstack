/* Headwords never break mid-word: shrink the font size until the whole word fits its box on one line.
   Natural size is restored first, so widening the window grows it back. */
const SEL = '#stage .word, .page h2, .cover .cw';
const MIN = 12;
function natural(el) { return el.clientWidth - (parseFloat(getComputedStyle(el).paddingLeft) || 0) - (parseFloat(getComputedStyle(el).paddingRight) || 0); }
function used(el) {
  if (el.classList.contains('word')) { const k = el.children; if (!k.length) return 0; return k[k.length - 1].getBoundingClientRect().right - k[0].getBoundingClientRect().left; }
  const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width;
}
function fitOne(el) {
  el.style.fontSize = '';
  const avail = natural(el); if (avail < 20) return;
  const w = used(el); if (w <= avail) return;
  const fs = parseFloat(getComputedStyle(el).fontSize);
  el.style.fontSize = Math.max(MIN, Math.floor(fs * avail / w * 97) / 100) + 'px';
}
let q = 0;
function fitAll() { q = 0; document.querySelectorAll(SEL).forEach(fitOne); }
function later() { if (!q) q = requestAnimationFrame(fitAll); }
new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
addEventListener('resize', later);
if (document.fonts) { document.fonts.ready.then(later); document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', later); }
later();
