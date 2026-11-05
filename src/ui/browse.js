// Look back up the descent you've already travelled (wheel, drag, PageUp/PageDown, or the depth
// tracker), then snap back to where you are. The run keeps going underneath: the world just
// offsets its camera while idle. Also owns the depth tracker, so main.js needs one line to hook in.
import './browse.css';
import {buildTracker} from './tracker.js';
import {writeInRun} from './runWriteIn.js';

export function initBrowse({world, floors, startOf, ft, rm, doc = document}) {
  const $ = s => doc.querySelector(s);
  const ui = $('#ui');
  const tracker = buildTracker(doc, floors, startOf, i => world.browseToFt(startOf(floors[i])));
  ui.appendChild(tracker.el);
  const snap = doc.createElement('button');
  snap.id = 'snapback'; snap.type = 'button'; snap.hidden = true;
  ui.appendChild(snap);
  snap.onclick = () => world.snap();

  // follow the depth HUD: tracker only shows during a run
  const hud = $('#depthHud');
  const sync = () => { tracker.el.hidden = hud.hidden; };
  new MutationObserver(sync).observe(hud, {attributes: true, attributeFilter: ['hidden']}); sync();

  const modalOpen = () => ['#cardlayer', '#all', '#stats'].some(s => { const m = $(s); return m && !m.hidden; });
  const typing = el => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
  const scrolls = el => { for (; el && el !== doc.body; el = el.parentElement) { const o = getComputedStyle(el).overflowY; if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1) return true; } return false; };

  world.onBrowse(b => {
    doc.body.classList.toggle('browsing', b);
    snap.hidden = !b;
    // coming back to the run: the alcove writes its elements in as the camera settles, not in one snap
    if (!b && !ui.querySelector('#stage')?.hidden) writeInRun(ui.querySelector('#stage'), {wait: 160});
    if (b) snap.textContent = `↓ Back to ${Math.round(world.restRow * ft)} ft`;
  });

  addEventListener('wheel', e => {
    if (!world.canBrowse || modalOpen() || e.ctrlKey || scrolls(e.target)) return;
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    world.browse(e.deltaY * k);
    e.preventDefault();
  }, {passive: false});

  let drag = null;
  const cv = $('#world');
  cv.addEventListener('pointerdown', e => { if (world.canBrowse && !modalOpen()) { drag = {id: e.pointerId, y: e.clientY}; } });
  addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; world.browse(drag.y - e.clientY); drag.y = e.clientY; });
  const end = e => { if (drag && e.pointerId === drag.id) drag = null; };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);

  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || modalOpen()) return;
    if (world.browsing && (e.key === 'Escape' || e.key === 'End')) { world.snap(); e.preventDefault(); return; }
    if (world.browsing && typing(e.target) && (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace')) { world.snap(); return; }
    if (!world.canBrowse || typing(e.target)) return;
    const page = innerHeight * .8;
    if (e.key === 'PageUp') { world.browse(-page); e.preventDefault(); }
    else if (e.key === 'PageDown') { world.browse(page); e.preventDefault(); }
    else if (e.key === 'Home') { world.browseToFt(0); e.preventDefault(); }
  });

  return {update(viewFt) { tracker.update(viewFt, world.browsing ? world.restRow * ft : viewFt, world.browsing); }};
}
