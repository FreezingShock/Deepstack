// Shrinks any Shelf spine label that overflows its plate until the whole word shows (never an ellipsis).
const MIN = 6;
export function fitShelfSpines(root = document) {
  root.querySelectorAll('.sb-t').forEach(el => {
    el.style.fontSize = '';
    el.style.letterSpacing = '';
    let fs = parseFloat(getComputedStyle(el).fontSize) || 12;
    let tries = 0;
    while (el.scrollWidth > el.clientWidth + .5 && fs > MIN && tries++ < 20) {
      fs -= .5;
      el.style.fontSize = fs + 'px';
      if (fs < 10) el.style.letterSpacing = '0';
    }
  });
}

let queued = false;
const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; fitShelfSpines(); }); };
if (typeof document !== 'undefined') {
  new MutationObserver(m => { if (m.some(r => [...r.addedNodes].some(n => n.nodeType === 1))) schedule(); })
    .observe(document.body || document.documentElement, {childList: true, subtree: true});
  addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
}
