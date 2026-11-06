/* Typewriter for text that is already in the DOM. The full text stays in place (hidden letters still take their space),
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
  const parts = nodes.map(t => {
    const full = t.nodeValue, a = document.createElement('span'), b = document.createElement('span');
    b.style.visibility = 'hidden'; b.textContent = full;
    t.replaceWith(a, b); return {a, b, full, t};
  });
  const dur = Math.min(MAX, Math.max(MIN, total / CPS * 1000));
  let raf = 0, done = false, t0 = 0;
  const show = k => { let left = k; for (const p of parts) { const n = Math.max(0, Math.min(p.full.length, left)); left -= n; p.a.textContent = p.full.slice(0, n); p.b.textContent = p.full.slice(n); } };
  const finish = () => {
    if (done) return; done = true; cancelAnimationFrame(raf); live.delete(el);
    for (const p of parts) if (p.a.isConnected) { p.a.replaceWith(p.t); p.b.remove(); }
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
