// Takes the launch screen (the #splash block in index.html, painted before any script ran) off the page once the home screen has been drawn.
// Two frames let the first home paint land underneath it. A timer caps the wait so a starved frame loop can't leave it up for good.
let gone = false;
export function dismissSplash({doc = document, win = window, reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches} = {}) {
  const el = doc.getElementById('splash');
  if (!el) return;
  const finish = () => {
    if (gone) return;
    gone = true;
    el.classList.add('gone');
    if (reduced) el.remove();
    else setTimeout(() => el.remove(), 480);
  };
  win.requestAnimationFrame(() => win.requestAnimationFrame(finish));
  setTimeout(finish, 3000);
}
