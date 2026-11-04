// Lore books: a few thick books on the background shelves of the descent can be clicked to
// reveal a word and its definition. Nothing is stored per book: which books are marked, and
// which word each holds, are pure functions of the row seed, so shelves stay identical when a
// row is rebuilt and the already-loaded word pool is the only data used (no fetch, no memory).

const MIN_WIDTH = 24;      // only the thick spines (rows draw widths of 10-32)
const EVERY = 5;           // about one in five of those

/** Is this background book (an entry of a generated row) a lore book? */
export const isLore = b => !!b && !b.lying && b.w >= MIN_WIDTH && b.seed % EVERY === 0;

/** Small brass tag near the head of a marked spine; drawn in book-local space (origin: bottom centre). */
export function drawLoreMark(c, b) {
  const y = -b.h * .8, w = Math.min(b.w - 8, 12);
  c.save();
  c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-w / 2 - 1, y - 1, w + 2, 11);
  const g = c.createLinearGradient(0, y, 0, y + 9);
  g.addColorStop(0, '#d9b85a'); g.addColorStop(1, '#8a6a22');
  c.fillStyle = g; c.fillRect(-w / 2, y, w, 9);
  c.fillStyle = 'rgba(30,18,4,.65)'; c.fillRect(-1, y + 2, 2, 5);
  c.restore();
}

/** Pulsing glow, outline and sparkle around a lore book; drawn in book-local space, after the alcoves. */
export function drawLoreGlow(c, b, t) {
  const pulse = .5 + .5 * Math.sin(t * 2.4 + b.seed), h = b.h, w = b.w;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, -h * .55, 0, 0, -h * .55, h * .75 + 14);
  g.addColorStop(0, `rgba(255,214,120,${.30 + .22 * pulse})`); g.addColorStop(1, 'rgba(255,190,80,0)');
  c.fillStyle = g; c.fillRect(-h, -h * 1.4, h * 2, h * 1.6);
  c.globalCompositeOperation = 'source-over';
  c.lineWidth = 1.5; c.strokeStyle = `rgba(255,224,140,${.55 + .35 * pulse})`;
  c.strokeRect(-w / 2 - .5, -h - .5, w + 1, h + 1);
  const sy = -h - 7 - 3 * pulse, sr = 3.5 + 1.5 * pulse; // small four-point sparkle above the spine
  c.fillStyle = `rgba(255,240,180,${.7 + .3 * pulse})`;
  c.beginPath(); c.moveTo(0, sy - sr * 1.6); c.lineTo(sr * .4, sy - sr * .4); c.lineTo(sr * 1.6, sy); c.lineTo(sr * .4, sy + sr * .4);
  c.lineTo(0, sy + sr * 1.6); c.lineTo(-sr * .4, sy + sr * .4); c.lineTo(-sr * 1.6, sy); c.lineTo(-sr * .4, sy - sr * .4); c.fill();
  c.restore();
}

/**
 * Which lore book is under the point (px, py) in a row?
 * @param d row data from the world ({bs}); r row index; rh row height; W canvas width;
 * cam camera offset; a decay (rows lean and tilt with it, mirroring drawRowLive).
 */
export function hitLoreBook(d, r, rh, W, cam, a, px, py, covered = () => false) {
  if (!d || r === 0) return null;
  const y = r * rh - cam, base = y + rh - 12;
  if (py < y - 40 || py > base + 4) return null;
  const seen = y + rh - 40; // the next shelf's wall hides the last 28px of every book
  if (a > .03) { // the row is drawn as three leaning thirds: undo the lean of the one under the point
    const i = Math.min(2, Math.max(0, Math.floor(px / (W / 3))));
    const th = (i === 0 ? 1 : i === 2 ? -1 : 0) * .085 * a;
    if (th) {
      const cx = (i + .5) * W / 3, cy = y + rh / 2, dx = px - cx, dy = py - cy, s = Math.sin(-th), k = Math.cos(-th);
      px = cx + dx * k - dy * s; py = cy + dx * s + dy * k;
    }
  }
  for (const b of d.bs) {
    if (!isLore(b) || px < b.x - 4 || px > b.x + b.w + 4 || covered(b, base)) continue;
    let lx = px - (b.x + b.w / 2), ly = py - base;
    if (b.tilt) { // books lean about the middle of their foot
      const ox = b.w / 2, dx = lx - ox, s = Math.sin(-b.tilt), k = Math.cos(-b.tilt);
      lx = ox + dx * k - ly * s; ly = dx * s + ly * k;
    }
    if (lx >= -b.w / 2 && lx <= b.w / 2 && ly >= -b.h && ly <= 2 && py <= seen) return b;
  }
  return null;
}

/**
 * The word a book holds: deterministic in (row, seed), nudged toward harder words with depth,
 * and never one of the `exclude`d words (today's daily words, the current run).
 */
export function loreWord(pool, row, seed, hash, exclude = new Set()) {
  if (!pool.length) return null;
  const target = Math.min(7.5, 4 + row / 50); // niche from the first shelf, rarer further down
  let best = null, bestGap = Infinity;
  for (let k = 0; k < 16; k++) {
    const w = pool[hash(`lore:${row}:${seed}:${k}`) % pool.length];
    if (exclude.has(w.w)) continue;
    const gap = Math.abs((w.d ?? target) - target);
    if (gap < bestGap) { best = w; bestGap = gap; }
    if (gap < 1.2) break;
  }
  return best;
}

/** Wires hover, click and the popup. Only active when no word is being answered. */
export function initLore({world, canvas, pool, hash, exclude, enabled, doc = document}) {
  const card = doc.createElement('div');
  card.id = 'lore'; card.setAttribute('role', 'note'); card.hidden = true;
  doc.body.appendChild(card);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const close = () => { card.classList.remove('on'); card.hidden = true; };

  // Hovering a lore book reveals its word (a tap does the same on touch screens); nothing needs a click.
  let shown = null;
  const reveal = (hit, x, y) => {
    if (shown === hit.book) return;
    const w = loreWord(pool, hit.row, hit.book.seed, hash, new Set(exclude()));
    if (!w) return;
    shown = hit.book;
    card.innerHTML = `<b>${esc(w.w)}</b> <i>${esc(w.pos)}</i><p>${esc(w.def)}</p>`;
    card.hidden = false; card.classList.remove('on');
    const r = card.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    card.style.left = Math.max(10, Math.min(vw - r.width - 10, x - r.width / 2)) + 'px';
    card.style.top = Math.max(10, Math.min(vh - r.height - 10, y - r.height - 24)) + 'px';
    void card.offsetWidth; card.classList.add('on');
  };
  const hide = () => { shown = null; close(); };
  canvas.addEventListener('pointermove', e => {
    if (e.buttons || !enabled()) { if (shown) hide(); return; }
    const hit = world.loreAt(e.clientX, e.clientY);
    if (hit) { canvas.style.cursor = 'help'; reveal(hit, e.clientX, e.clientY); return; }
    if (shown) hide();
    if (canvas.style.cursor === 'help') canvas.style.cursor = '';
  });
  canvas.addEventListener('pointerleave', hide);
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || !enabled()) return;
    const hit = world.loreAt(e.clientX, e.clientY);
    if (hit) reveal(hit, e.clientX, e.clientY); else hide();
  });
  // Anything else the player does puts the book back: typing, clicking, scrolling, resizing.
  addEventListener('pointerdown', e => { if (e.target !== canvas) hide(); }, true);
  addEventListener('keydown', hide, true);
  addEventListener('wheel', hide, {passive: true});
  addEventListener('resize', hide);
  return {close: hide};
}
