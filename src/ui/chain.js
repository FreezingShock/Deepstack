// The run's story on the alcove ledge, read from the books already earned (no new run data, no rule changes):
//  - a brass chain: every Folio-or-better answer in a row hangs one link on its book, links are joined by a sagging chain
//    (link count === the combo chain that applyCombo reports; the x2 cap glows)
//  - a break: when a chain of two or more ends, the chain slides off and lies on the desk (it falls, with a clunk, when fresh)
//  - a close call: a crimson ribbon tab pokes from a book that missed the next rarity by a few points
// Skipped words keep their dashed slot (ledge.js). Pure story rules first, canvas after.
import {extendsCombo, comboMultiplier, COMBO_MAX} from '../core/combo.js';
import {TIERS} from '../core/tiers.js';
import {PALETTE} from '../theme/colors.js';
import {reducedMotion} from './settings.js';

export const CLOSE_GAP = 3;   // points short of the next rarity that count as a close call
export const STORY_PAD = 6;   // px a link or ribbon may stand above the tallest book (phones reserve it)
export const FALL_MS = 760;   // a broken chain falls and settles
export const LINK_MS = 320;   // a new link drops onto its book

/** Points a finished book fell short of the next rarity, or 0 when it is not a close call. */
export function closeGap(b) {
  if (!b || b.skipped || !(b.tier >= 0) || b.tier >= TIERS.length - 1) return 0;
  const gap = TIERS[b.tier + 1].min - b.score;
  return gap > 0 && gap <= CLOSE_GAP ? gap : 0;
}

/** Per-book story in word order. `chain` mirrors core/combo.applyCombo: consecutive Folio+ answers, a skip or miss resets. */
export function runStory(books) {
  let chain = 0;
  return books.map(b => {
    const was = chain, ext = extendsCombo(b.tier, !!b.skipped);
    chain = ext ? chain + 1 : 0;
    const gap = closeGap(b);
    return {chain, mult: comboMultiplier(chain), linked: ext, capped: ext && comboMultiplier(chain) >= COMBO_MAX,
      broke: !ext && was >= 2, brokeLen: was, gap, next: gap ? TIERS[b.tier + 1].name : ''};
  });
}

/** Words for the ledge button and tooltip: chain length and close call. */
export function storyNote(s) {
  if (!s) return '';
  const out = [];
  if (s.linked) out.push(s.chain >= 2 ? `chain of ${s.chain}` : 'starts a chain');
  if (s.broke) out.push(`chain of ${s.brokeLen} broken`);
  if (s.gap) out.push(`${s.gap} short of ${s.next}`);
  return out.join(', ');
}

// ---- fresh events: which book was just added, so its link drops or the chain falls once ----
let track = new WeakMap(); // keyed by a run's first book: its object survives every re-slice of the results
let rmCache = null;        // the same switch main.js reads once at load
const keyOf = b => b.w + '|' + (b.skipped ? '!' : b.score);
function freshOf(books, now) {
  if (!books.length) return null;
  const keys = books.map(keyOf), t = track.get(books[0]) || {keys: [], fresh: null};
  const grew = keys.length === t.keys.length + 1 && t.keys.every((k, i) => k === keys[i]);
  if (grew) t.fresh = {i: keys.length - 1, t0: now};
  else if (keys.length !== t.keys.length || keys.some((k, i) => k !== t.keys[i])) t.fresh = null;
  t.keys = keys; track.set(books[0], t);
  return t.fresh;
}
export const resetStoryTrack = () => { track = new WeakMap(); };

// ---- drawing ----
const clamp01 = v => Math.max(0, Math.min(1, v));
const easeOut = u => 1 - Math.pow(1 - u, 3);

function link(c, x, y, r, rot, lit) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.lineWidth = Math.max(1, r * .55);
  c.strokeStyle = PALETTE.blackAlpha99; c.beginPath(); c.ellipse(0, .6, r * 1.3, r * .8, 0, 0, 6.3); c.stroke();
  c.strokeStyle = lit ? PALETTE.brassF6d98a : PALETTE.brass; c.beginPath(); c.ellipse(0, 0, r * 1.3, r * .8, 0, 0, 6.3); c.stroke();
  c.restore();
}

function swag(c, x0, y0, x1, y1, r, alpha) {
  const dx = x1 - x0, dist = Math.hypot(dx, y1 - y0), n = Math.max(2, Math.round(dist / (r * 2.3))), sag = Math.min(4, dist * .12);
  c.save(); c.globalAlpha *= alpha;
  for (let k = 1; k < n; k++) {
    const u = k / n, x = x0 + dx * u, y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag;
    link(c, x, y, r * .62, k % 2 ? 0 : 1.57, false);
  }
  c.restore();
}

// a broken chain: `n` links hang from the last ring, then fall and lie along the desk (u = 0 hanging .. 1 lying)
function brokenChain(c, cx, ringY, base, r, u) {
  const n = 3, g = u * u;
  for (let k = 1; k <= n; k++) {
    const hang = {x: cx, y: ringY + k * r * 1.7, rot: 1.57};
    const lie = {x: cx + (k - 1) * r * 2.5 + r * 1.5, y: base - r * .5, rot: 0};
    const bounce = u >= 1 ? 0 : (u > .8 ? -Math.sin((u - .8) / .2 * Math.PI) * 1.4 : 0);
    link(c, hang.x + (lie.x - hang.x) * g, hang.y + (lie.y - hang.y) * g + bounce, r * .75, hang.rot + (lie.rot - hang.rot) * g, false);
  }
}

/** Draws links, chain, ribbons and broken chains over the books. `L` is the ledge layout. */
export function drawStory(ctx, o) {
  const {L, books, base, x, dims, now} = o, st = runStory(books), fr = freshOf(books, now);
  const RM = o.RM != null ? o.RM : (rmCache == null ? (rmCache = !!reducedMotion()) : rmCache);
  const geo = L.items.map(it => {
    if (it.skipped) return null;
    const dm = dims(books[it.i]);
    return {cx: x + it.dx + it.w / 2, top: base - dm.h * L.s, w: it.w};
  });
  const r = Math.max(1.6, 3.2 * L.s);
  const live = fr && !RM ? now - fr.t0 : Infinity;
  ctx.save();
  L.items.forEach(it => {
    const g = geo[it.i], s = st[it.i];
    if (!g) return;
    // ribbon tab: a close call pokes out of the top of the book
    if (s.gap) {
      const rw = Math.max(1.8, 2.8 * L.s), rx = g.cx + g.w * .24, sway = RM ? 0 : Math.sin(now / 900 + it.i) * .7;
      ctx.fillStyle = PALETTE.bloodA3202a; ctx.beginPath();
      ctx.moveTo(rx, g.top + 3); ctx.lineTo(rx + sway, g.top - 5); ctx.lineTo(rx + rw + sway, g.top - 5); ctx.lineTo(rx + rw, g.top + 3);
      ctx.lineTo(rx + rw / 2, g.top + 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = PALETTE.blackAlpha66; ctx.fillRect(rx + rw - .8, g.top - 4, .8, 6);
    }
    if (!s.linked) return;
    // the new link drops onto its book, then the chain to its neighbour fades in
    const mine = fr && fr.i === it.i, age = mine ? live : Infinity, drop = mine && !RM ? (1 - easeOut(clamp01(age / LINK_MS))) * -7 : 0;
    const prev = it.i > 0 ? geo[it.i - 1] : null, ps = it.i > 0 ? st[it.i - 1] : null;
    if (prev && ps.linked) swag(ctx, prev.cx, prev.top - 1, g.cx, g.top - 1, r, mine && !RM ? clamp01((age - LINK_MS * .5) / (LINK_MS * .8)) : 1);
    ctx.save(); ctx.globalAlpha *= mine && !RM ? clamp01(age / (LINK_MS * .5)) : 1;
    if (s.capped) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PALETTE.lamplightAlpha1a; ctx.beginPath(); ctx.arc(g.cx, g.top - 1, r * 2.6, 0, 6.3); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    link(ctx, g.cx, g.top - 1 + drop, r, 0, s.capped);
    ctx.restore();
  });
  // broken chains: the chain that ended here lies on the desk beside the last book it hung on
  st.forEach((s, i) => {
    if (!s.broke || !geo[i - 1]) return;
    const g = geo[i - 1], mine = fr && fr.i === i, u = mine && !RM ? clamp01((live - 80) / FALL_MS) : 1;
    if (mine && !RM && live < 80) return;
    ctx.save(); ctx.globalAlpha *= .95; brokenChain(ctx, g.cx, g.top - 1, base, r, u); ctx.restore();
  });
  ctx.restore();
}
