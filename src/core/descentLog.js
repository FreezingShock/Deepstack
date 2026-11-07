// The descent's memory: every finished Unlimited descent is written down in the additive field S.descent
// = {runs, best, relics}. Pure (no DOM, no storage) so the Almanac pages and the tests share one source.
// It only reads a run's final state (core/descent.js); it never changes a descent's rules or its feet.
import {currentRoom} from './roomStore.js';

export const RUN_KEEP = 30; // recent runs kept; older ones fall off the end of the history

/** The saved memory, tolerant of a missing or older save. */
export function descentStore(S) {
  const d = S && S.descent;
  const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  return {runs: Array.isArray(d && d.runs) ? d.runs : [], best: obj(d && d.best), relics: obj(d && d.relics)};
}

/**
 * Writes a finished descent into S.descent. `dsc` is the run's descent state as the run left it:
 * path = the doors taken (ids), relics = the relics carried (ids), ended / endedAt (1-based word) / spent.
 * Relics are written the first time they are carried, with the day, room and depth. Personal bests are per room.
 * Returns the saved run record, or null when there was nothing to write. The caller saves S.
 */
export function recordDescent(S, dsc, {day = '', ft = 0, words = 7, room = currentRoom(S)} = {}) {
  if (!S || !dsc) return null;
  const st = descentStore(S);
  const run = {
    day, room, ft: Math.max(0, Math.round(ft)), of: words,
    doors: [...(dsc.path || [])], relics: [...(dsc.relics || [])],
    ended: !!dsc.ended, endedAt: dsc.ended ? dsc.endedAt | 0 : 0, spent: dsc.spent | 0
  };
  st.runs = [...st.runs, run].slice(-RUN_KEEP);
  const b = st.best[room];
  if (!b || run.ft > b.ft) st.best[room] = {ft: run.ft, day};
  for (const id of run.relics) if (!st.relics[id]) st.relics[id] = {day, room, ft: run.ft};
  S.descent = st;
  return run;
}

/** How many descents have been kept in all, for the history's kicker. */
export const runCount = S => descentStore(S).runs.length;
