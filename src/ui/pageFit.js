/* Menu-book pages (Shelf, Sets, Stats, Daily): when a page is only a little too tall for the window, shrink its
   contents to fit rather than growing a scrollbar. A page that is a lot too tall is genuinely long and keeps its
   (slim, dark) scrollbar; see styles/scrollbars.css. */
const MIN = .6, SHELF_MIN = .5; // shelf pages can always turn, so they shrink further before scrolling
let queued = false;
function fitPage(pg) {
  const kids = [...pg.children];
  for (const k of kids) k.style.removeProperty('zoom');
  const over = pg.scrollHeight - pg.clientHeight;
  if (over <= 1) return;
  const cs = getComputedStyle(pg), pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  const z = Math.floor((pg.clientHeight - pad) / (pg.scrollHeight - pad) * 100) / 100;
  if (z < (pg.querySelector('.ssec') ? SHELF_MIN : MIN)) return;
  for (const k of kids) k.style.zoom = z;
}
function run() {
  queued = false;
  document.querySelectorAll('.bk-spread.menu .pg-in').forEach(fitPage);
}
const queue = () => { if (!queued) { queued = true; setTimeout(run, 120); } };
new MutationObserver(queue).observe(document.body, {childList: true, subtree: true});
addEventListener('resize', queue);
/* the book opens and turns with transitions that change the page size; refit once each settles */
for (const ev of ['transitionend', 'animationend']) addEventListener(ev, e => { if (e.target.closest && e.target.closest('.bk-spread')) queue(); }, true);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
