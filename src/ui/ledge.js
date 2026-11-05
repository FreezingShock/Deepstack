// The alcove ledge: this run's books stand on it in word order, a skipped word leaves an empty slot,
// and each spot has a real button on top so hover, focus and screen readers get word, tier and answer.
import {drawStory, runStory, storyNote, STORY_PAD} from './chain.js';
export const MAX_SCALE = 0.8;

// Pure layout. Returns {s, items:[{i, dx, w, skipped}]} with dx measured from the alcove's left edge.
export function ledgeLayout(books, w, dims, maxH = 0) {
  const raw = books.map(b => (b.skipped ? 20 : dims(b).w));
  const sum = raw.reduce((a, v) => a + v + 6, 0);
  // wide alcoves: books gather in the right corner, clear of the answer controls (the candle holds the left)
  const zone = w >= 640 ? Math.max(100, Math.min(w * 0.27, w / 2 - 250)) : w - 90;
  let s = Math.min(MAX_SCALE, Math.max(0.3, zone / Math.max(1, sum)));
  // narrow alcoves keep the books in a strip below the answer controls: never taller than it
  if (maxH > 0) { const tall = Math.max(1, ...books.map(b => (b.skipped ? 0 : dims(b).h))); s = Math.min(s, maxH / tall); }
  let x = w >= 640 ? w - 34 - sum * s : (w - sum * s) / 2;
  return {s, items: raw.map((rw, i) => { const it = {i, dx: x, w: rw * s, skipped: !!books[i].skipped}; x += (rw + 6) * s; return it; })};
}

// `story` is this book's entry from runStory (chain, close call); both strings stay unchanged without it.
export function ledgeLabel(b, tiers, story) {
  if (b.skipped) return `${b.w}, skipped${story && story.broke ? `, ${storyNote(story)}` : ''}`;
  const t = tiers[b.tier].name, n = storyNote(story);
  return `${b.w}, ${t}, ${b.score}${n ? `, ${n}` : ''}${b.answer ? `. You wrote: ${b.answer}` : ''}`;
}

export function ledgeTip(b, tiers, story) {
  const n = storyNote(story);
  if (b.skipped) return `${b.w} · Skipped${story && story.broke ? ` · ${n}` : ''}`;
  const a = (b.answer || '').trim();
  return `${b.w} · ${tiers[b.tier].name} · ${b.score}${n ? ` · ${n}` : ''}${a ? ` — “${a.length > 70 ? a.slice(0, 69) + '…' : a}”` : ''}`;
}

// Canvas drawing. Returns screen-space hit rects.
export function drawLedge(ctx, o) {
  const {books, x, y, w, h, now, dims, bookArt, ribbons, hash} = o;
  const L = ledgeLayout(books, w, dims, o.maxH ? o.maxH - STORY_PAD : 0), base = y + h - (o.inset || 0), hits = [];
  for (const it of L.items) {
    const b = books[it.i], cx = x + it.dx + it.w / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(cx, base + 1, it.w * .6, 3, 0, 0, 6.3); ctx.fill();
    if (it.skipped) {
      const sh = (o.RH * .5) * L.s;
      ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(cx - it.w / 2, base - sh, it.w, sh);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(176,138,86,.55)'; ctx.lineWidth = 1; ctx.strokeRect(cx - it.w / 2 + .5, base - sh + .5, it.w - 1, sh - 1); ctx.setLineDash([]);
      ctx.restore(); hits.push({x: cx - it.w / 2, y: base - sh, w: it.w, h: sh, i: it.i}); continue;
    }
    const dm = dims(b);
    ctx.translate(cx, base); ctx.scale(L.s, L.s);
    bookArt(ctx, {w: dm.w, h: dm.h, fit: dm.fit, tier: b.tier, seed: hash(b.w) & 0xffff, word: b.w, ribbon: b.tier >= 1 ? ribbons[b.tier % 5] : null}, now / 1000);
    ctx.restore();
    hits.push({x: cx - it.w / 2, y: base - dm.h * L.s, w: it.w, h: dm.h * L.s, i: it.i});
  }
  drawStory(ctx, {L, books, base, x, dims, now}); // chain links, close-call ribbons, a fallen chain
  return hits;
}

// DOM layer of transparent buttons over the canvas hit rects.
export function initLedge({tiers, canActivate, onOpen, showTip, hideTip}) {
  const box = document.createElement('div');
  box.id = 'ledgeHits'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Books from this descent'); box.hidden = true;
  document.body.appendChild(box);
  let key = '', btns = [], story = [];
  const show = (b, el, i) => { const r = el.getBoundingClientRect(); showTip(ledgeTip(b, tiers, story[i]), r.left, r.top + 20); };
  return function update(hits, books) {
    if (!hits || !hits.length) { if (!box.hidden) { box.hidden = true; box.innerHTML = ''; key = ''; btns = []; hideTip(); } return; }
    const k = books.map(b => b.w + (b.skipped ? '!' : b.score)).join('|');
    if (k !== key) {
      key = k; box.innerHTML = ''; story = runStory(books);
      btns = hits.map(h => {
        const b = books[h.i], el = document.createElement('button');
        el.type = 'button'; el.className = 'ledgebook'; el.setAttribute('aria-label', ledgeLabel(b, tiers, story[h.i]));
        el.onmouseenter = el.onfocus = () => show(b, el, h.i); el.onmouseleave = el.onblur = hideTip;
        el.onclick = () => { if (canActivate()) { hideTip(); onOpen(b); } };
        box.appendChild(el); return el;
      });
    }
    box.hidden = false;
    hits.forEach((h, n) => { const s = btns[n].style; s.left = h.x - 3 + 'px'; s.top = h.y - 3 + 'px'; s.width = h.w + 6 + 'px'; s.height = h.h + 6 + 'px'; });
  };
}
