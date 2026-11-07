// Layout options for the Almanac progress page (design source, not shipped). Each option returns two leaves
// (left, right) of Almanac markup built from src/core/almanacProgress.js. shoot.mjs drops them into the real Stats book.
import {progressFigures, answeredBooks, hardestWords} from '../../src/core/almanacProgress.js';
import {ROOMS, HALL} from '../../src/core/rooms.js';
import {TIERS} from '../../src/core/tiers.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmtDay = k => new Date(k + 'T00:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'});
const roomOf = id => ROOMS.find(r => r.id === id) || ROOMS[0];
const tierOf = id => TIERS[id] || TIERS[0];

/** A pen line of average closeness per day, 0 to 100, oldest on the left. */
export function trendChart(trend) {
  if (!trend.length) return '<p class="empty hand">No answers in the last month.</p>';
  const W = 300, H = 120, L = 26, R = 6, T = 8, B = 18;
  const x = i => (trend.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (trend.length - 1));
  const y = v => T + (1 - v / 100) * (H - T - B);
  const pts = trend.map((p, i) => [x(i).toFixed(1), y(p.avg).toFixed(1)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  const grid = [0, 50, 100].map(v => `<line class="gr" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ax" x="${L - 4}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
  const dots = pts.map(p => `<circle class="dt" cx="${p[0]}" cy="${p[1]}" r="${trend.length > 14 ? 1.8 : 2.6}"/>`).join('');
  return `<svg class="pg-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Average closeness on ${trend.length} days, from ${trend[0].avg} to ${trend[trend.length - 1].avg}">${grid}<path class="ln" d="${d}"/>${dots}<text class="ax" x="${L}" y="${H - 3}">${fmtDay(trend[0].day)}</text><text class="ax" x="${W - R}" y="${H - 3}" text-anchor="end">${fmtDay(trend[trend.length - 1].day)}</text></svg>`;
}

const bars = rooms => {
  const mx = Math.max(1, ...rooms.map(r => r.met));
  return `<ul class="pg-bars">${rooms.map(r => `<li style="--c:${roomOf(r.id).rgb.join(',')}"><span class="pg-n"><i></i>${esc(r.short)}</span><span class="pg-track"><i style="width:${Math.round(r.met / mx * 100)}%"></i></span><b>${r.met}</b></li>`).join('')}</ul>`;
};
const hardRows = list => list.length
  ? `<ul class="pg-hard">${list.map(h => `<li><span class="pg-w">${esc(h.w)}</span><span class="pg-tier" style="color:${tierOf(h.tier).spine}">${esc(tierOf(h.tier).name)}</span><b>${h.avg}</b><small>${h.n} ${h.n === 1 ? 'try' : 'tries'}</small></li>`).join('')}</ul>`
  : '<p class="empty hand">Nothing answered yet.</p>';
const figs = f => `<ul class="pg-figs"><li><b>${f.distinct}</b><span>words met</span></li><li><b>${f.answered}</b><span>answers</span></li><li><b>${f.avg}</b><span>avg closeness</span></li><li><b>${f.chain ? f.chain.n : 0}</b><span>best chain</span></li></ul>`;
const chainLine = f => (f.chain ? `Longest chain: ${f.chain.n} Folio-or-better answers in a row${f.chain.day ? ' on ' + fmtDay(f.chain.day) : ''}, ending on ${esc(f.chain.w)}.` : 'No chain yet. Two Folio-or-better answers in a row start one.');

/** A: one long leaf. Figures, words by room, closeness line, hardest words. */
export function optionA(S) {
  const f = progressFigures(S);
  return [`<div class="alm pg pg-a"><h1>The Progress</h1><div class="kicker">Every room, kept by hand</div>${figs(f)}
    <h2>Words met by room</h2>${bars(f.rooms)}
    <h2>Closeness, last ${f.trend.length} days</h2>${trendChart(f.trend)}
    <h2>Hardest words</h2>${hardRows(f.hardest)}</div>`, ''];
}

/** B: a spread. Left: words by room and the chain. Right: closeness over time and hardest words. */
export function optionB(S) {
  const f = progressFigures(S);
  const left = `<div class="alm pg pg-b"><h1>Words met</h1><div class="kicker">${f.distinct} words across ${f.rooms.filter(r => r.met).length} rooms</div>
    <h2>By room</h2>${bars(f.rooms)}
    <h2>Chains</h2><p class="note">${chainLine(f)}</p>${figs(f)}</div>`;
  const right = `<div class="alm pg pg-b"><h1>Closeness</h1><div class="kicker">Average over the last ${f.trend.length} days you answered</div>
    <h2>Over time</h2>${trendChart(f.trend)}
    <h2>Hardest words</h2>${hardRows(f.hardest.slice(0, 3))}</div>`;
  return [left, right];
}

/** C: one leaf as a ledger. Each room is a row with words met, average closeness and its hardest word. */
export function optionC(S) {
  const f = progressFigures(S), books = answeredBooks(S);
  const rows = ROOMS.map(r => {
    const mine = books.filter(b => b.room === r.id), met = f.rooms.find(x => x.id === r.id).met;
    const avg = mine.length ? Math.round(mine.reduce((a, b) => a + b.score, 0) / mine.length) : null;
    const hard = hardestWords(mine, 1)[0];
    return `<tr class="${met ? '' : 'none'}"><td><i class="pg-dot" style="--c:${r.rgb.join(',')}"></i>${esc(r.short)}</td><td>${met}</td><td>${avg ?? '–'}</td><td>${hard ? esc(hard.w) : '–'}</td></tr>`;
  }).join('');
  const table = `<table class="pg-t"><thead><tr><th>Room</th><th>Met</th><th>Avg</th><th>Hardest</th></tr></thead><tbody>${rows}</tbody></table>`;
  const strip = f.trend.slice(-14).map(p => `<div class="rc" title="${fmtDay(p.day)}: ${p.avg}"><i style="height:${Math.max(6, p.avg)}%"></i><span>${p.day.slice(8)}</span></div>`).join('');
  return [`<div class="alm pg pg-c"><h1>The Progress</h1><div class="kicker">${f.answered} answers · ${f.distinct} words</div>
    ${figs(f)}${table}
    <h2>Closeness, last 14 days</h2><div class="pg-strip" role="img" aria-label="Average closeness per day">${strip}</div>
    <p class="note">${chainLine(f)}</p></div>`, ''];
}

export const OPTIONS = {A: optionA, B: optionB, C: optionC};

/** A three-week save: Daily books in several rooms plus Unlimited books on the shelf. Deterministic. */
export function fixtureSave() {
  const words = ['ephemeral', 'sesquipedalian', 'lucid', 'tempest', 'alacrity', 'obstinate', 'serendipity', 'pragmatic', 'mellifluous', 'taciturn', 'ubiquitous', 'vestige', 'laconic', 'ardent', 'cadence', 'erudite', 'fastidious', 'gregarious', 'halcyon', 'insidious', 'lugubrious', 'meticulous', 'nebulous', 'ostensible', 'parsimonious', 'quixotic', 'recondite', 'sanguine', 'tenacious', 'ineffable', 'zealous', 'ponderous', 'vicarious', 'wistful', 'arcane', 'bellicose', 'candid'];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tierFor = s => { let t = 0; TIERS.forEach(x => { if (s >= x.min) t = x.id; }); return t; };
  const hall = {}, roomDaily = Object.fromEntries(ROOMS.filter(r => r.id !== HALL).map(r => [r.id, {}]));
  const end = Date.UTC(2026, 10, 6, 12);
  for (let d = 20; d >= 0; d--) {
    const day = new Date(end - d * 864e5).toISOString().slice(0, 10);
    for (const r of ROOMS) {
      if (d > 0 && rnd() < 0.35) continue; // some days have no Daily in a room
      const books = []; let chain = 0;
      for (let i = 0; i < 7; i++) {
        const score = Math.max(0, Math.min(100, Math.round(30 + (20 - d) * 1.1 + rnd() * 45)));
        const tier = tierFor(score), w = words[Math.floor(rnd() * words.length)];
        chain = tier >= 3 ? chain + 1 : 0;
        const b = {w, score, tier, answer: 'x', room: r.id === HALL ? undefined : r.id, t: end - d * 864e5 + i * 6e4, no: i + 1, mode: 'daily', ft: 40};
        if (chain >= 2) b.combo = {n: chain, mult: 1.25, ft: 8};
        books.push(b);
      }
      const target = r.id === HALL ? hall : roomDaily[r.id];
      target[day] = {depth: 300, avg: 50, best: 3, books};
    }
  }
  const shelf = [];
  for (let i = 0; i < 24; i++) {
    const score = Math.round(20 + rnd() * 75);
    shelf.push({w: words[Math.floor(rnd() * words.length)], score, tier: tierFor(score), answer: 'x', room: ROOMS[1 + (i % (ROOMS.length - 1))].id, t: end - Math.floor(rnd() * 19) * 864e5, mode: 'unlimited', ft: 30});
  }
  return {shelf, daily: hall, streak: {last: Object.keys(hall).sort().pop(), n: 4}, bestFloor: 3, bestDepth: 300, sound: false, room: HALL,
    rooms: Object.fromEntries(Object.entries(roomDaily).map(([id, daily]) => [id, {daily, streak: {last: '', n: 2}}]))};
}
