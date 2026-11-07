/* Phone back gesture (Android's back button, the browser's back arrow, iOS's edge swipe in a browser): while a book,
   a result card or the key sheet is open, going back closes that overlay instead of leaving the game.

   Each overlay pushes one history entry when it opens and removes it when it closes by any other route (the close
   button, Esc, a tap outside), so a single back press never needs a second one. An overlay that must not close on Back
   (a fresh run result, a book that stays open on Esc) answers keep(): the press is absorbed and the overlay stays.
   With nothing of ours open, Back behaves exactly as before. Overlays call pushBack / popBack; nothing else changes. */

export function createBackStack(win) {
  const stack = [];   // {id, close, keep}, oldest first
  let absorb = 0;     // history.back() calls we made ourselves: their popstate is not a press of the user's
  let popping = false; // inside a Back-triggered close: do not walk the history again
  let listening = false;
  const hist = () => (win && win.history) || null;

  function onPop() {
    if (absorb > 0) { absorb--; return; }
    const top = stack[stack.length - 1];
    if (!top) return;
    if (top.keep && top.keep()) { try { hist().pushState({ds: top.id}, ''); } catch {} return; }
    popping = true;
    try { top.close(); } finally { popping = false; }
    const i = stack.indexOf(top);
    if (i >= 0) stack.splice(i, 1);
  }

  return {
    /** An overlay opened. Pushes one history entry; a second push with the same id does nothing (stepping through cards). */
    push(id, {close, keep} = {}) {
      if (!win || !hist() || stack.some(s => s.id === id)) return false;
      if (!listening) { listening = true; win.addEventListener('popstate', onPop); }
      stack.push({id, close, keep});
      try { hist().pushState({ds: id}, ''); } catch {}
      return true;
    },
    /** The overlay closed by itself. Removes it; if it was on top, its history entry is taken back too. */
    pop(id) {
      const i = stack.findIndex(s => s.id === id);
      if (i < 0) return;
      const wasTop = i === stack.length - 1;
      stack.splice(i, 1);
      const h = hist();
      if (wasTop && !popping && h && h.state && h.state.ds === id) {
        absorb++;
        try { h.back(); } catch { absorb--; }
      }
    },
    get depth() { return stack.length; },
  };
}

const backStack = createBackStack(typeof window !== 'undefined' ? window : null);
export const pushBack = (id, opts) => backStack.push(id, opts);
export const popBack = id => backStack.pop(id);
