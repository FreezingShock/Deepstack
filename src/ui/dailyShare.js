/* Shareable Daily result (per topic room). The text is spoiler-free: the room, the Daily number, depth, the floor,
   the streak that run belongs to, one symbol per book (its tier) and the tier names. No word or answer is in it.
   Pure text builder plus one share helper: navigator.share where the browser has it, the clipboard otherwise. */
import {currentStreak, runDay} from '../core/streak.js';

export const BARS = '▁▂▃▄▅▆▇';

/** The copied / shared text for a finished Daily. o: {room (name), no (Daily number), floorName, tierNames, keys (the room's saved Daily keys), today}. */
export function dailyShareText(d, o) {
  const day = runDay(d, o.today);
  const n = currentStreak(o.keys || [], day);
  const head = `Deepstack · ${o.room} · No. ${o.no}`;
  const facts = [`Depth ${d.depth} ft`, o.floorName, `average closeness ${d.avg}`].filter(Boolean).join(' · ');
  const streak = n ? `Streak ${n} ${n === 1 ? 'day' : 'days'} in a row` : '';
  const grid = d.books.map(b => BARS[b.tier]).join('');
  const names = d.books.map(b => o.tierNames[b.tier]).join(' · ');
  return [head, facts, streak, grid, names].filter(Boolean).join('\n');
}

/** Opens the system share sheet when there is one, otherwise copies. Resolves to 'shared', 'copied', 'cancelled' or 'failed'. */
export async function shareDaily(txt, title = 'Deepstack') {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try { await navigator.share({title, text: txt}); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; /* other failures fall through to the clipboard */ }
  }
  try { await navigator.clipboard.writeText(txt); return 'copied'; }
  catch (e) { return 'failed'; }
}
