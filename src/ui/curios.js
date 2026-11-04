import {PALETTE} from '../theme/colors.js';
import {isLore, loreClear, hitLoreBook, drawLoreGlow} from './lore.js';
// Curios: rare thin books on the background shelves hide something other than a word. Like lore
// books they are a pure function of the row seed (nothing stored): which books are curios, what
// kind, and what they say. Thin spines only (lore books are the thick ones), so the two never clash.
// Halo rules are the lore book's: tight, and never near the pillars or the alcove frame.

export const CURIO_MIN = 13, CURIO_MAX = 23, EVERY = 17, SEALED_BELOW = 40; // rows
export const KINDS = ['page', 'ribbon', 'sealed'];
export const KIND_LABEL = {page: 'A loose page', ribbon: 'A bookmark', sealed: 'A sealed book', note: 'A marginal note'};

const PAGES = ['…and so the last line is never the one you meant to write.', 'Torn here. The other half is lower, if it was ever kept.', 'Whoever reads this: the ones below are heavier than they look.', 'A list of names, each crossed out except one.', 'It is not the word that sinks. It is what you thought it meant.'];
const RIBBONS = ['Someone stopped reading here, and never came back for it.', 'The ribbon is warm. Someone has just been here.', 'Marked at a page that has been cut out.', 'It was a long way down for whoever left this.'];
const NOTES = ['Disagree. See p. 212. (There is no p. 212.)', 'This is not what it means. I checked. — M.', 'Underlined twice, then rubbed out.', 'Yes, but who was standing there when it was said?'];
const SEALED = ['The clasp has given way. Inside, only a pressed leaf and the word “patience”.', 'Opens now. A key-shaped hollow is cut into the pages.', 'Unlocked from the other side. The lock is on the inside.'];

const mix = n => { n = (n ^ (n >>> 16)) * 0x45d9f3b; n = (n ^ (n >>> 16)) * 0x45d9f3b; return (n ^ (n >>> 16)) >>> 0; };

/** Is this background book (an entry of a generated row) a curio? Not a lore book; same margins. */
export const isCurio = (b, W) => !!b && !b.lying && b.w >= CURIO_MIN && b.w < CURIO_MAX && !isLore(b)
  && b.seed % EVERY === 3 && (!W || loreClear(b, W));

/** The kind of curio a book is: a pure function of its seed. */
export const curioKind = b => KINDS[mix(b.seed | 0) % KINDS.length];

/** What a curio shows: deterministic in (row, seed); a sealed book only opens at depth. */
export function curioText(row, b) {
  const h = mix((row * 7919 + (b.seed | 0)) | 0), kind = curioKind(b);
  if (kind === 'sealed') {
    if (row < SEALED_BELOW) return {kind, label: KIND_LABEL.sealed, text: 'Locked. The clasp will not give, not yet. Come back lower.'};
    return {kind, label: KIND_LABEL.sealed, text: SEALED[h % SEALED.length]};
  }
  const list = kind === 'page' ? PAGES : (h & 1 ? RIBBONS : NOTES);
  return {kind: list === NOTES ? 'note' : kind, label: KIND_LABEL[list === NOTES ? 'note' : kind], text: list[(h >>> 3) % list.length]};
}

/** The small mark on the spine, in book-local space (origin: bottom centre). */
export function drawCurioMark(c, b) {
  const kind = curioKind(b), w = b.w, y = -b.h * .78;
  c.save();
  if (kind === 'page') { // a pale corner of paper sticking out of the top
    c.fillStyle = PALETTE.parchmentE6d8b2; c.globalAlpha = .85;
    c.beginPath(); c.moveTo(-w / 2 + 2, -b.h); c.lineTo(w / 2 - 2, -b.h); c.lineTo(w / 2 - 1, -b.h - 7); c.lineTo(-w / 2 + 4, -b.h - 4); c.closePath(); c.fill();
  } else if (kind === 'ribbon') { // a long ribbon hanging past the foot of the spine
    c.fillStyle = PALETTE.brass60; c.fillRect(-1.5, -b.h + 2, 3, b.h * .55);
    c.beginPath(); c.moveTo(-1.5, -b.h * .45); c.lineTo(0, -b.h * .45 + 4); c.lineTo(1.5, -b.h * .45); c.fill();
  } else { // a brass clasp across the spine
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-w / 2, y - 1, w, 8);
    c.fillStyle = PALETTE.bronze8a6a22; c.fillRect(-w / 2 + 1, y, w - 2, 6);
    c.fillStyle = PALETTE.brass60; c.fillRect(-1.5, y + 1, 3, 4);
  }
  c.restore();
}

export {drawLoreGlow as drawCurioGlow};

/** Which curio is under the point (px, py) in a row? Same geometry as the lore hit test. */
export const hitCurio = (d, r, rh, W, cam, a, px, py, covered) => hitLoreBook(d, r, rh, W, cam, a, px, py, covered, isCurio);

/** Hover (or tap) reveals the curio's slip; anything else puts it back. */
export function initCurios({world, canvas, enabled, doc = document}) {
  const card = doc.createElement('div');
  card.id = 'curio'; card.setAttribute('role', 'note'); card.hidden = true;
  doc.body.appendChild(card);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  let shown = null;
  const hide = () => { shown = null; card.classList.remove('on'); card.hidden = true; };
  const reveal = (hit, x, y) => {
    if (shown === hit.book) return;
    const c = curioText(hit.row, hit.book);
    shown = hit.book;
    card.innerHTML = `<b>${esc(c.label)}</b><p>${esc(c.text)}</p>`;
    card.hidden = false; card.classList.remove('on');
    const r = card.getBoundingClientRect();
    card.style.left = Math.max(10, Math.min(innerWidth - r.width - 10, x - r.width / 2)) + 'px';
    card.style.top = Math.max(10, Math.min(innerHeight - r.height - 10, y - r.height - 24)) + 'px';
    void card.offsetWidth; card.classList.add('on');
  };
  canvas.addEventListener('pointermove', e => {
    if (e.buttons || !enabled()) { if (shown) hide(); return; }
    const hit = world.curioAt(e.clientX, e.clientY);
    if (hit) { canvas.style.cursor = 'help'; reveal(hit, e.clientX, e.clientY); return; }
    if (shown) hide();
  });
  canvas.addEventListener('pointerleave', hide);
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || !enabled()) return;
    const hit = world.curioAt(e.clientX, e.clientY);
    if (hit) reveal(hit, e.clientX, e.clientY); else hide();
  });
  addEventListener('pointerdown', e => { if (e.target !== canvas) hide(); }, true);
  addEventListener('keydown', hide, true);
  addEventListener('wheel', hide, {passive: true});
  addEventListener('resize', hide);
  return {close: hide};
}
