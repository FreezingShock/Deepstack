/* Menu-book pages (Shelf, Sets, Stats, Daily) and the Settings, Credits and keys panels: when one is only a little too tall for the window, shrink its
   contents to fit rather than growing a scrollbar. A page that is a lot too tall is genuinely long and keeps its
   (slim, dark) scrollbar; see styles/scrollbars.css. */
const MIN = .5; // below this a page is genuinely too long and keeps the slim scrollbar
let queued = false;
function fitPage(pg) {
  const kids = [...pg.children];
  const set = z => kids.forEach(k => z >= 1 ? k.style.removeProperty('zoom') : (k.style.zoom = z));
  set(1);
  pg.style.removeProperty('overflow-y');
  /* measure the in-flow content only: the pen-ink overlay is absolutely positioned and can be taller than the text */
  const flow = kids.filter(k => getComputedStyle(k).position !== 'absolute');
  const cs = getComputedStyle(pg), padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0, have = pg.clientHeight;
  const bottom = () => Math.max(0, ...flow.map(k => k.getBoundingClientRect().bottom)) - (pg.getBoundingClientRect().top - pg.scrollTop) + padB;
  let b = bottom();
  if (b <= have + 1) { pg.style.overflowY = 'hidden'; return; }
  /* shrinking also widens the text column (the zoomed box is laid out 1/z wider), so lines unwrap and the first
     estimate overshoots; nudge the zoom back up while it still fits */
  let z = Math.floor((have - padT - padB) / (b - padT - padB) * 100) / 100, best = 0;
  for (let i = 0; i < 6 && z >= MIN; i++) {
    set(z); b = bottom();
    if (b <= have + 1) { best = Math.max(best, z); if (z >= 1 || b > have - 6) break; }
    const nz = Math.floor(Math.min(1, z * (have - padT - padB) / Math.max(1, b - padT - padB)) * 100) / 100;
    if (nz === z) break;
    z = nz;
  }
  /* fitted: the in-flow text fits, so a stray few px from a rotated pen note must not raise a bar */
  if (best >= MIN) { set(best); pg.style.overflowY = 'hidden'; } else set(1);
}
function run() {
  queued = false;
  document.querySelectorAll('.bk-spread.menu .pg-in, .tpbox, .khbox').forEach(fitPage);
}
const queue = () => { if (!queued) { queued = true; setTimeout(run, 120); } };
new MutationObserver(queue).observe(document.body, {childList: true, subtree: true});
addEventListener('resize', queue);
/* the book opens and turns with transitions that change the page size; refit once each settles */
for (const ev of ['transitionend', 'animationend']) addEventListener(ev, e => { if (e.target.closest && e.target.closest('.bk-spread')) queue(); }, true);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
