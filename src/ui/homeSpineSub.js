/* Shrinks a home spine's label (title + caption together) until it fits its spine; never clipped, never an ellipsis. */
const MIN = 11;
export function fitHomeSpines(root = document) {
  root.querySelectorAll('#home .hb-t').forEach(el => {
    el.style.fontSize = '';
    el.classList.remove('sub-off');
    el.style.letterSpacing = '';
    let fs = parseFloat(getComputedStyle(el).fontSize) || 14, tries = 0;
    while (el.scrollWidth > el.clientWidth + .5 && fs > MIN && tries++ < 24) {
      fs -= .5;
      el.style.fontSize = fs + 'px';
      if (fs < 12) el.style.letterSpacing = '0';
    }
    /* still too wide on a very narrow spine: the caption steps aside rather than clip */
    if (el.scrollWidth > el.clientWidth + .5) { el.classList.add('sub-off'); el.style.fontSize = ''; el.style.letterSpacing = ''; }
  });
}
let queued = false;
const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; fitHomeSpines(); }); };
if (typeof document !== 'undefined') {
  new MutationObserver(m => { if (m.some(r => [...r.addedNodes].some(n => n.nodeType === 1 && (n.id === 'home' || n.querySelector?.('.hb-t'))))) schedule(); })
    .observe(document.body || document.documentElement, {childList: true, subtree: true});
  // The hearth switches #home between compact and tall layouts by its class; a spine fitted before that switch would
  // keep its caption (the class is what hides it), so refit whenever #home's own class list changes.
  new MutationObserver(() => schedule()).observe(document.getElementById('home') || document.body, {attributes: true, attributeFilter: ['class'], attributeOldValue: false});
  addEventListener('resize', () => { schedule(); setTimeout(schedule, 400); });
  document.fonts?.ready.then(schedule);
}
