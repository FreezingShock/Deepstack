/* Swipes for touch screens. A quick, mostly straight drag reads as one of four directions. Taps, slow drags, diagonal
   drags, mouse and pen input read as nothing, and a drag that starts on a control is ignored, so swipes never fight a
   button or a page's own scroll. swipeDir() is pure (unit tested); attachSwipe() wires it to an element. */

export function swipeDir(dx, dy, {min = 56, ratio = 1.6} = {}) {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax >= min && ax >= ay * ratio) return dx < 0 ? 'left' : 'right';
  if (ay >= min && ay >= ax * ratio) return dy < 0 ? 'up' : 'down';
  return null;
}

export const SWIPE_IGNORE = 'button,a,input,textarea,select,label,[contenteditable="true"],.rm-door,.rm-dot,.hbook';

/** Calls onSwipe(direction, event) on a quick touch swipe that starts inside el. Returns a function that detaches it. */
export function attachSwipe(el, onSwipe, {ignore = SWIPE_IGNORE, maxMs = 900} = {}) {
  let s = null;
  const down = e => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen' || !e.isPrimary) { s = null; return; }
    if (ignore && e.target && e.target.closest && e.target.closest(ignore)) { s = null; return; }
    s = {id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp};
  };
  const up = e => {
    if (!s || e.pointerId !== s.id) return;
    const from = s; s = null;
    if (e.timeStamp - from.t > maxMs) return;
    const dir = swipeDir(e.clientX - from.x, e.clientY - from.y);
    if (dir) onSwipe(dir, e);
  };
  const cancel = e => { if (s && e.pointerId === s.id) s = null; };
  el.addEventListener('pointerdown', down, {passive: true});
  document.addEventListener('pointerup', up, true);
  document.addEventListener('pointercancel', cancel, true);
  return () => {
    el.removeEventListener('pointerdown', down);
    document.removeEventListener('pointerup', up, true);
    document.removeEventListener('pointercancel', cancel, true);
  };
}
