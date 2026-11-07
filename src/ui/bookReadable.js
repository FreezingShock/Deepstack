/* Reach for long book pages and the Results card (#final): a page whose writing runs past its foot gets .has-more (bookReadable.css fades the last
   line and writes "more ↓" in the footer). The class goes away once the reader has scrolled to the end, and a page that
   fits never gets it. Runs on resize, on any page change or turn, and on every scroll of a page. */
const PAGES = '.bk-spread .pg-in, #topPanel .pg-in, #final';
const EPS = 3;
/* the pages' own scroll containers: a page that is only scrollable (overflow auto) is not clipped, its writing just needs the cue */

export function syncMore(p) {
  if (!p || !p.isConnected) return;
  const cs = getComputedStyle(p);
  const scrollable = /auto|scroll/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + EPS;
  const more = scrollable && p.scrollHeight - p.clientHeight - p.scrollTop > EPS;
  p.classList.toggle('has-more', more);
}

export function syncAllMore() {
  document.querySelectorAll(PAGES).forEach(syncMore);
}

let queued = 0;
const queue = () => {
  if (queued) return;
  queued = requestAnimationFrame(() => { queued = 0; syncAllMore(); });
};

export function initBookReadable() {
  addEventListener('resize', queue);
  document.addEventListener('scroll', e => { if (e.target && e.target.matches && e.target.matches(PAGES)) syncMore(e.target); }, true);
  /* only page content matters (new writing, a fit or a zoom on a page): the book's own transforms run every frame and do not */
  new MutationObserver(records => {
    if (records.some(r => r.type === 'childList' ? (r.target.closest && r.target.closest('.bk-spread, #topPanel, #final'))
      : (r.target.closest && r.target.closest('.pg-in')))) queue();
  }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style']});
  for (const ev of ['transitionend', 'animationend']) addEventListener(ev, e => { if (e.target.closest && e.target.closest('.bk-spread, #final')) queue(); }, true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  queue();
}
