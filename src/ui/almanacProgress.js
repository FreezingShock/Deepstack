/* Progress page for the Almanac (option B of the layout pick): a spread of two leaves after the Depths.
   Left: words met by room and the longest chain. Right: average closeness over the last month and the hardest words.
   Pure string builders over src/core/almanacProgress.js (no DOM), styles in almanacProgress.css under .alm.pg. */
import {esc} from './bookpages.js';
import {ROOMS, rgbOf} from '../core/rooms.js';
import {TIERS} from '../core/tiers.js';
import {progressFigures, TREND_DAYS} from '../core/almanacProgress.js';

export const HARDEST_SHOWN = 3;
const fmtDay = k => new Date(k + 'T00:00:00Z').toLocaleDateString(undefined, {month: 'short', day: 'numeric', timeZone: 'UTC'});
const r1 = n => Math.round(n * 10) / 10;

/** A pen line of average closeness per day, 0 to 100, oldest on the left. Empty when there is nothing to plot. */
export function closenessChart(trend) {
  if (!trend.length) return '<p class="empty hand">No answers in the last month yet.</p>';
  const W = 300, H = 120, L = 26, R = 6, T = 8, B = 18;
  const x = i => (trend.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (trend.length - 1));
  const y = v => T + (1 - v / 100) * (H - T - B);
  const pts = trend.map((p, i) => [r1(x(i)), r1(y(p.avg))]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  const grid = [0, 50, 100].map(v => `<line class="gr" x1="${L}" x2="${W - R}" y1="${r1(y(v))}" y2="${r1(y(v))}"/><text class="ax" x="${L - 4}" y="${r1(y(v) + 3)}" text-anchor="end">${v}</text>`).join('');
  const dots = pts.map(p => `<circle class="dt" cx="${p[0]}" cy="${p[1]}" r="${trend.length > 14 ? 1.8 : 2.6}"/>`).join('');
  const first = trend[0], last = trend[trend.length - 1];
  return `<svg class="pg-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Average closeness on ${trend.length} days, from ${first.avg} on ${fmtDay(first.day)} to ${last.avg} on ${fmtDay(last.day)}">${grid}<path class="ln" pathLength="1" d="${d}"/>${dots}<text class="ax" x="${L}" y="${H - 3}">${fmtDay(first.day)}</text><text class="ax" x="${W - R}" y="${H - 3}" text-anchor="end">${fmtDay(last.day)}</text></svg>`;
}

/** One ruled bar per room, tinted by the room's colour and scaled to the room with most words. */
export function roomBars(rooms) {
  const mx = Math.max(1, ...rooms.map(r => r.met));
  return `<ul class="pg-bars">${rooms.map(r => `<li style="--c:${rgbOf(ROOMS.find(x => x.id === r.id))}"><span class="pg-n"><i></i>${esc(r.short)}</span><span class="pg-track"><i style="width:${Math.round(r.met / mx * 100)}%"></i></span><b>${r.met}</b></li>`).join('')}</ul>`;
}

/** Hardest words: word, tier in its ink colour, average closeness, and how many tries. */
export function hardestList(list) {
  if (!list.length) return '<p class="empty hand">Nothing answered yet.</p>';
  return `<ul class="pg-hard">${list.map(h => {
    const t = TIERS[h.tier] || TIERS[0];
    return `<li><span class="pg-w">${esc(h.w)}</span><span class="pg-tier" style="color:${t.ink}">${esc(t.name)}</span><b>${h.avg}</b><small>${h.n} ${h.n === 1 ? 'try' : 'tries'}</small></li>`;
  }).join('')}</ul>`;
}

export function chainLine(f) {
  if (!f.chain) return 'No chain yet. Two Folio-or-better answers in a row start one.';
  const when = f.chain.day ? ` on ${fmtDay(f.chain.day)}` : '';
  return `Longest chain: ${f.chain.n} Folio-or-better answers in a row${when}, ending on ${esc(f.chain.w)}.`;
}

/** The two Progress leaves for one save, or [] when nothing has been answered yet. */
export function progressLeaves(S) {
  const f = progressFigures(S);
  if (!f.answered) return [];
  const named = f.rooms.filter(r => r.met).length;
  const left = `<div class="alm pg pg-b"><h1>Words met</h1><div class="kicker">${f.distinct} ${f.distinct === 1 ? 'word' : 'words'} across ${named} ${named === 1 ? 'room' : 'rooms'}</div>
    <ul class="pg-figs"><li><b>${f.distinct}</b><span>words met</span></li><li><b>${f.answered}</b><span>answers</span></li><li><b>${f.avg}</b><span>avg closeness</span></li><li><b>${f.chain ? f.chain.n : 0}</b><span>best chain</span></li></ul>
    <h2>By room</h2>${roomBars(f.rooms)}
    <h2>Chains</h2><p class="note">${chainLine(f)}</p></div>`;
  const right = `<div class="alm pg pg-b"><h1>Closeness</h1><div class="kicker">Average over the last ${Math.min(TREND_DAYS, f.trend.length)} ${f.trend.length === 1 ? 'day' : 'days'} you answered</div>
    <h2>Over time</h2>${closenessChart(f.trend)}
    <h2>Hardest words</h2>${hardestList(f.hardest.slice(0, HARDEST_SHOWN))}</div>`;
  return [left, right];
}
