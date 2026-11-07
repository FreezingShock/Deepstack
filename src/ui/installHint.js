// "Keep the library" install hint: a small brass tab on the home wall, bottom right. Tapping it opens a card that offers to put Deepstack
// on the home screen. Chromium browsers (Chrome, Edge, Android) fire beforeinstallprompt, so the card gets an Install button that calls the
// browser's own prompt. iOS Safari has no prompt, so the card explains the Share menu instead.
// It never shows inside the installed app, after "Not now", or where the browser offers no way to install (desktop Firefox and Safari,
// headless test browsers). Nothing pops up: the tab waits quietly for a few seconds after home is shown.
export function installState({standalone = false, ios = false, prompt = null, dismissed = false} = {}) {
  if (standalone || dismissed) return 'hidden';
  if (prompt) return 'install';
  if (ios) return 'ios';
  return 'hidden';
}

const COPY = {
  install: 'Open Deepstack like an app, straight from your home screen.',
  ios: 'Tap Share, then Add to Home Screen.',
};

export function initInstallHint({S, save, win = window, doc = document, delay = 4000}) {
  const standalone = () => win.matchMedia?.('(display-mode: standalone)').matches || win.navigator.standalone === true;
  const ios = /iPad|iPhone|iPod/.test(win.navigator.userAgent || '') && !win.MSStream;
  let prompt = null, timer = 0, shown = false;

  const el = doc.createElement('aside');
  el.className = 'ih';
  el.id = 'installHint';
  el.hidden = true;
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Install Deepstack');
  el.innerHTML = '<button type="button" class="ih-tab" aria-expanded="false">Keep the library</button>'
    + '<div class="ih-card" hidden><p class="ih-title">Keep the library</p><p class="ih-text"></p>'
    + '<div class="ih-actions"><button type="button" class="ih-go">Install</button><button type="button" class="ih-no">Not now</button></div></div>';
  (doc.getElementById('ui') || doc.body).appendChild(el);
  const tab = el.querySelector('.ih-tab'), card = el.querySelector('.ih-card');
  const text = el.querySelector('.ih-text'), go = el.querySelector('.ih-go'), no = el.querySelector('.ih-no');

  // home is the only place the tag belongs: no book, card or stats page may be open over it
  const onHome = () => {
    const home = doc.getElementById('home');
    if (!home || home.hidden) return false;
    return ['cardlayer', 'all', 'stats'].every(id => !doc.getElementById(id) || doc.getElementById(id).hidden);
  };
  const mode = () => installState({standalone: standalone(), ios, prompt, dismissed: !!S.install?.dismissed});
  // open: the card is centred over a dim veil (the element itself is the veil); closing returns to the tab in the corner
  const collapse = () => { el.classList.remove('open'); card.hidden = true; tab.hidden = false; tab.setAttribute('aria-expanded', 'false'); };
  // `shown` remembers that the delay has passed this visit, so the tab comes back at once when home is shown again
  const sync = () => {
    const m = mode();
    if (m === 'hidden' || !onHome()) { el.hidden = true; win.clearTimeout(timer); timer = 0; return; }
    text.textContent = COPY[m];
    go.hidden = m !== 'install';
    if (shown) { el.hidden = false; return; }
    if (!timer) timer = win.setTimeout(() => { timer = 0; shown = true; sync(); }, delay);
  };

  tab.addEventListener('click', () => { el.classList.add('open'); card.hidden = false; tab.hidden = true; tab.setAttribute('aria-expanded', 'true'); (go.hidden ? no : go).focus?.(); });
  el.addEventListener('click', e => { if (e.target === el) collapse(); });
  doc.addEventListener('keydown', e => { if (e.key === 'Escape' && el.classList.contains('open')) collapse(); });
  win.addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; sync(); });
  win.addEventListener('appinstalled', () => { prompt = null; el.hidden = true; });
  go.addEventListener('click', async () => {
    if (!prompt) return;
    const p = prompt;
    prompt = null;
    el.hidden = true;
    try { await p.prompt(); await p.userChoice; } catch { /* the browser refused: the tag stays hidden for this visit */ }
  });
  no.addEventListener('click', () => {
    S.install = {...(S.install || {}), dismissed: true};
    save();
    el.hidden = true;
  });
  // watch only the screens that decide visibility (never the tag itself: setting its own hidden attribute would re-trigger this forever)
  const watch = new win.MutationObserver(sync);
  for (const id of ['home', 'cardlayer', 'all', 'stats']) { const n = doc.getElementById(id); if (n) watch.observe(n, {attributes: true, attributeFilter: ['hidden']}); }
  sync();
  return {sync, collapse};
}
