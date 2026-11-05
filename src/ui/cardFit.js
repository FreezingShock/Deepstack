/* Result card: shrink the whole book to fit the window instead of letting .page grow a scrollbar.
   --fz is the zoom (1 = natural size). It is measured at natural size, then applied in the same task,
   so nothing paints in between. .page keeps overflow:auto only as a last resort below the floor. */
const FLOOR = .5;
const layer = document.getElementById('cardlayer');
function fit() {
  const book = layer && layer.querySelector('.book'), page = book && book.querySelector('.page');
  if (!page) return;
  book.style.setProperty('--fz', 1);
  const cs = getComputedStyle(book);
  const chrome = (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
  const avail = innerHeight - 32, need = page.scrollHeight + chrome;
  const z = need > avail ? Math.max(FLOOR, Math.floor(avail / need * 100) / 100) : 1;
  book.style.setProperty('--fz', z);
}
if (layer) {
  const later = () => { fit(); setTimeout(fit, 350); };
  new MutationObserver(later).observe(layer, {childList: true});
  addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
}
