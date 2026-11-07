/* Runs fn once, on the first press, tap or key the page gets. Sound uses it for a returning visitor who left Sound on:
   browsers can let an AudioContext run on a return visit with no gesture at all, so the room tone would start on load.
   Instead the switch shows on and the audio waits for the first real gesture. target is injectable for tests.
   Returns a cancel function. Without an event target (no DOM) fn never runs: nothing may play unprompted. */
export const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchend'];

export function onFirstGesture(fn, target = globalThis) {
  if (!target || typeof target.addEventListener !== 'function') return () => {};
  let done = false;
  const off = () => { for (const e of GESTURE_EVENTS) target.removeEventListener(e, go, true); };
  const go = () => { if (done) return; done = true; off(); fn(); };
  for (const e of GESTURE_EVENTS) target.addEventListener(e, go, {capture: true, passive: true});
  return () => { done = true; off(); };
}
