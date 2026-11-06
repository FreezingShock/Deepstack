/* Typewriter for text that is already in the DOM, revealed from the middle of the line outwards. The full text stays in place (hidden letters still take their space),
   so nothing around it reflows while it types. Time-based, so a slow frame skips letters instead of stretching the line.
   Under reduced motion, or with no animation frames, the text simply stands there. */
const CPS = 70, MIN = 240, MAX = 620; // letters per second, and the bounds on how long one line may take
const live = new WeakMap();

/** Types out `el`'s text (every text node in order). Returns a function that finishes it at once. */
export function typewrite(el, {still = false, delay = 0} = {}) {
  if (!el) return () => {};
  if (live.has(el)) live.get(el)();
  const nodes = [];
  const walk = n => { for (const c of [...n.childNodes]) c.nodeType === 3 ? c.nodeValue && nodes.push(c) : walk(c); };
  walk(el);
  const total = nodes.reduce((n, t) => n + t.nodeValue.length, 0);
  if (still || !total || typeof requestAnimationFrame === 'undefined') return () => {};
  let at = 0;
  const parts = nodes.map(t => {
    const full = t.nodeValue, mk = hid => { const x = document.createElement('span'); if (hid) x.style.visibility = 'hidden'; return x; };
    const p = {pre: mk(true), mid: mk(false), post: mk(true), full, t, s: at, e: at + full.length};
    at += full.length; t.replaceWith(p.pre, p.mid, p.post); return p;
  });
  const dur = Math.min(MAX, Math.max(MIN, total / CPS * 1000));
  let raf = 0, done = false, t0 = 0;
  const show = k => {
    const lo = Math.round(total / 2 - k / 2), hi = Math.round(total / 2 + k / 2); // the letters showing: a window growing out of the centre
    for (const p of parts) {
      const a = Math.min(p.full.length, Math.max(0, lo - p.s)), b = Math.max(a, Math.min(p.full.length, hi - p.s));
      p.pre.textContent = p.full.slice(0, a); p.mid.textContent = p.full.slice(a, b); p.post.textContent = p.full.slice(b);
    }
  };
  const finish = () => {
    if (done) return; done = true; cancelAnimationFrame(raf); live.delete(el);
    for (const p of parts) if (p.mid.isConnected) { p.pre.replaceWith(p.t); p.mid.remove(); p.post.remove(); }
  };
  const step = now => {
    if (done) return;
    if (!t0) t0 = now + delay;
    const k = Math.floor(Math.min(1, Math.max(0, (now - t0) / dur)) * total);
    show(k);
    if (now - t0 >= dur) finish(); else raf = requestAnimationFrame(step);
  };
  show(0); live.set(el, finish); raf = requestAnimationFrame(step);
  return finish;
}
