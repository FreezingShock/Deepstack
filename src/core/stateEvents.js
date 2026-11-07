/* Problems the player should hear about (a word list that will not download, a save the browser will not keep, and so on).
   Data modules report here as plain events; src/ui/stateNotices.js shows them. Pure: no DOM, no storage.
   A late subscriber is handed every problem still open, so a report made before the notice layer boots is not lost. */
const open = new Map(); // kind -> detail object
const subs = new Set();

/** Records that `kind` is happening now. `detail` may carry `retry` (a function that tries the thing again). */
export function reportState(kind, detail = {}) {
  const entry = {kind, ...detail};
  open.set(kind, entry);
  subs.forEach(f => f(entry));
}

/** The problem is over (the thing worked on a later try). Quiet when it was never reported. */
export function clearState(kind) {
  if (!open.delete(kind)) return;
  subs.forEach(f => f({kind, cleared: true}));
}

/** Calls `f` for every open problem now, then for each change. Returns the unsubscribe function. */
export function onState(f) {
  subs.add(f);
  for (const entry of open.values()) f(entry);
  return () => subs.delete(f);
}

export const openStates = () => [...open.values()];
