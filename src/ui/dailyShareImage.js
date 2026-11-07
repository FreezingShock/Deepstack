/* The Daily share as a picture: a library card drawn on a canvas from the same run data as the text share.
   Spoiler-free like the text: the room, the Daily number, depth, floor, streak, one spine per book (its tier) and the
   tier names. No word and no answer is ever drawn.
   shareCardOps() is pure (tests and scripts/share-card.mjs use it). drawShareOps() is self-contained, so the CI guard can
   send its source to a page and draw there. shareCardBlob() is the browser entry point that makes the PNG for Share. */
import {COLORS, TIER_COLORS} from '../theme/colors.js';
import {TIERS} from '../core/tiers.js';
import {currentStreak, runDay} from '../core/streak.js';
import {fmtNum} from '../core/numFmt.js';

export const CARD_W = 1080, CARD_H = 1080;
/* Looks: 'stamp' (the shipped card: round date stamp in the room colour, spines on a shelf), 'plain' (no stamp, spines),
   'dots' (no stamp, one tier-coloured dot per book). Alternatives are logged in the refinement backlog. */
export const LOOKS = ['stamp', 'plain', 'dots'];
const FAMILY = '"Anthropic Serif", Georgia, serif';
const TEXT_MIN = 0.6;   // a line may shrink to 60% of its size to fit; below that the guard fails

/** Pure layout. o: {room, no, floorName, tierNames, keys, today, rgb ([r,g,b]), depth/avg read from d}. */
export function shareCardOps(d, o, look = 'stamp') {
  const day = runDay(d, o.today);
  const streak = currentStreak(o.keys || [], day);
  const rgb = `rgb(${o.rgb.join(',')})`;
  const brass = COLORS.brass, parch = COLORS.parchment, dim = COLORS['parchment-dim'], oak = COLORS['oak-24'];
  const stamp = look === 'stamp';
  const ops = [];
  const T = (t, x, y, px, o2 = {}) => ops.push({k: 'text', t, x, y, px, family: FAMILY, weight: o2.weight || 400, style: o2.style || 'normal', fill: o2.fill || parch, align: o2.align || 'left', max: o2.max, track: o2.track, a: o2.a});

  ops.push({k: 'radial', x: CARD_W / 2, y: CARD_H * .42, r: CARD_W * .75, c0: COLORS['oak-16'], c1: COLORS['oak-5'], w: CARD_W, h: CARD_H});
  ops.push({k: 'frame', x: 40, y: 40, w: CARD_W - 80, h: CARD_H - 80, stroke: brass, lw: 5});
  ops.push({k: 'frame', x: 56, y: 56, w: CARD_W - 112, h: CARD_H - 112, stroke: brass, lw: 1.5, a: .55});
  ops.push({k: 'rect', x: 40, y: 40, w: CARD_W - 80, h: 10, fill: rgb});

  // header: the wordmark, the room (in its colour) and the Daily line
  T('DEEPSTACK', 100, 128, 24, {fill: brass, weight: 600, track: 6, max: stamp ? 640 : 900});
  T(o.room, 100, 204, 66, {fill: rgb, weight: 500, max: stamp ? 640 : 900});
  T(`Daily No. ${o.no}`, 100, 254, 30, {fill: dim, max: stamp ? 640 : 900});
  ops.push({k: 'line', x1: 100, y1: 286, x2: CARD_W - 100, y2: 286, stroke: brass, lw: 2, a: .6});

  if (stamp) {
    // a round date stamp, tilted, in the room's colour
    ops.push({k: 'group', cx: 874, cy: 170, rot: -.14, ops: [
      {k: 'circle', x: 874, y: 160, r: 104, stroke: rgb, lw: 7, a: .9},
      {k: 'circle', x: 874, y: 160, r: 88, stroke: rgb, lw: 2, a: .8},
      {k: 'text', t: 'NO.', x: 874, y: 118, px: 22, family: FAMILY, weight: 600, style: 'normal', fill: rgb, align: 'center', track: 4, max: 150},
      {k: 'text', t: `${o.no}`, x: 874, y: 186, px: 74, family: FAMILY, weight: 600, style: 'normal', fill: rgb, align: 'center', max: 170},
      {k: 'text', t: 'DAILY', x: 874, y: 228, px: 22, family: FAMILY, weight: 500, style: 'normal', fill: rgb, align: 'center', track: 3, max: 150}
    ]});
  }

  // the depth: the hero numeral, then the run's facts beside it
  const depthY = 512;
  T(fmtNum(d.depth), 92, depthY, 210, {weight: 500, max: 480});
  T('feet deep', 102, depthY + 76, 26, {fill: brass, track: 3, max: 420});
  const fx = 600, fw = CARD_W - 100 - fx;
  if (o.floorName) T(o.floorName, fx, 392, 42, {max: fw});
  T(`Average closeness ${d.avg}`, fx, 440, 28, {fill: dim, max: fw});
  if (streak) T(`Streak ${streak} ${streak === 1 ? 'day' : 'days'} in a row`, fx, 482, 28, {fill: rgb, max: fw});

  // the shelf: one spine per book, its height and colour from the tier
  const books = d.books || [], shelfY = 850;
  const slot = (CARD_W - 200) / 7, x0 = 100;
  if (look === 'dots') {
    books.forEach((b, i) => {
      const cx = x0 + slot * i + slot / 2, c = TIER_COLORS[TIERS[b.tier].name.toLowerCase()].spine;
      ops.push({k: 'circle', x: cx, y: 680, r: 46, fill: c, stroke: parch, lw: 2, a: .95});
    });
  } else {
    books.forEach((b, i) => {
      const tc = TIER_COLORS[TIERS[b.tier].name.toLowerCase()];
      const h = 90 + b.tier * 20, w = slot * .72, x = x0 + slot * i + (slot - w) / 2;
      ops.push({k: 'rect', x, y: shelfY - h, w, h, fill: tc.spine, spine: true});
      ops.push({k: 'rect', x, y: shelfY - h, w, h: 14, fill: tc.ink, a: .8});
      ops.push({k: 'rect', x, y: shelfY - 22, w, h: 22, fill: tc.ink, a: .8});
    });
  }
  ops.push({k: 'rect', x: 100, y: shelfY, w: CARD_W - 200, h: 12, fill: oak});
  // the tier name under each book (same order as the text share)
  books.forEach((b, i) => {
    const cx = x0 + slot * i + slot / 2;
    T(o.tierNames[b.tier], cx, 904, 21, {fill: dim, align: 'center', max: slot - 8});
  });

  // footer
  ops.push({k: 'line', x1: 100, y1: 968, x2: CARD_W - 100, y2: 968, stroke: brass, lw: 1.5, a: .5});
  T('Seven words. One descent.', CARD_W / 2, 1012, 26, {fill: dim, align: 'center', max: 880});

  return {w: CARD_W, h: CARD_H, ops, look};
}

/** Self-contained: draws a card's ops on a 2D context (in card units, the caller scales). Returns the report:
    {over: [text still wider than its slot], shrunk: [{t, from, to}], boxes: [{t, l, r, top, bot}] for each line on the
    card (not the rotated stamp), in card units, so the guard can check the frame and overlaps}.
    Keep it free of outer references: it is sent to a page. */
export function drawShareOps(ctx, card) {
  const report = {over: [], shrunk: [], boxes: []};
  const font = (style, weight, px, family) => `${style} ${weight} ${px}px ${family}`;
  const run = (list, grouped) => {
    for (const o of list) {
      ctx.save();
      if (o.a != null) ctx.globalAlpha = o.a;
      if (o.k === 'group') {
        ctx.translate(o.cx, o.cy); ctx.rotate(o.rot || 0); ctx.translate(-o.cx, -o.cy); run(o.ops, true);
      } else if (o.k === 'radial') {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, o.c0); g.addColorStop(1, o.c1);
        ctx.fillStyle = g; ctx.fillRect(0, 0, o.w, o.h);
      } else if (o.k === 'rect') {
        ctx.fillStyle = o.fill; ctx.fillRect(o.x, o.y, o.w, o.h);
      } else if (o.k === 'frame') {
        ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw; ctx.strokeRect(o.x, o.y, o.w, o.h);
      } else if (o.k === 'line') {
        ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw; ctx.beginPath(); ctx.moveTo(o.x1, o.y1); ctx.lineTo(o.x2, o.y2); ctx.stroke();
      } else if (o.k === 'circle') {
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
        if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 2; ctx.stroke(); }
      } else if (o.k === 'text') {
        let px = o.px;
        ctx.letterSpacing = (o.track || 0) + 'px';
        ctx.font = font(o.style, o.weight, px, o.family);
        if (o.max) {
          let w = ctx.measureText(o.t).width;
          while (w > o.max && px > o.px * 0.6) { px -= 1; ctx.font = font(o.style, o.weight, px, o.family); w = ctx.measureText(o.t).width; }
          if (px < o.px) report.shrunk.push({t: o.t, from: o.px, to: px});
          if (w > o.max + 0.5) report.over.push({t: o.t, width: Math.round(w), max: o.max});
        }
        ctx.fillStyle = o.fill; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(o.t, o.x, o.y);
        if (!grouped) {
          const w = ctx.measureText(o.t).width, al = o.align || 'left';
          const l = al === 'center' ? o.x - w / 2 : al === 'right' ? o.x - w : o.x;
          report.boxes.push({t: o.t, l, r: l + w, top: o.y - px * .75, bot: o.y + px * .25});
        }
      }
      ctx.restore();
    }
  };
  ctx.clearRect(0, 0, card.w, card.h);
  run(card.ops, false);
  return report;
}

/** Browser only: the card as a PNG Blob (2x for a sharp image). Waits for the serif faces so the layout measures them. */
export async function shareCardBlob(d, o, look = 'stamp') {
  const card = shareCardOps(d, o, look);
  try { if (document.fonts) await document.fonts.load(`400 40px ${FAMILY}`); } catch (e) { /* the fallback serif still lays out */ }
  const c = document.createElement('canvas');
  c.width = card.w * 2; c.height = card.h * 2;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  drawShareOps(ctx, card);
  return new Promise(res => c.toBlob(res, 'image/png'));
}

export const cardFileName = no => `deepstack-daily-${no}.png`;
