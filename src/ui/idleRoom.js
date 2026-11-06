/* The room breathes when left alone. After ~40 s with no input on home, a small director fires one-shot events at
   random 6 to 15 s spacing: an ember pops, a log settles, a mantel candle drips, a moth circles the candles, the
   brass bell rings once. Any input stops everything at once. Costs nothing at rest: one timer, a few passive
   listeners, no frame loop (events are CSS animations or the hearth's own loop). Off under reduced motion and at
   low quality. Sounds come from the sound palette (`crackle` cue, bell chime). Nothing here takes pointer events. */
import {reducedMotion} from './settings.js';
import {Quality} from './quality.js';

export const IDLE_MS = 40000, GAP_MIN = 6000, GAP_MAX = 15000;

/* Pure scheduler (testable): events = [{id, run(), stop()}]. `input()` stamps activity and halts any running show. */
export function createIdleDirector({events, idleMs = IDLE_MS, gapMin = GAP_MIN, gapMax = GAP_MAX, rand = Math.random,
  now = () => performance.now(), setTimer = setTimeout, clearTimer = clearTimeout, ok = () => true}) {
  let stamp = now(), active = false, timer = 0, dead = false, lastId = '';
  const arm = ms => { clearTimer(timer); if (!dead) timer = setTimer(tick, Math.max(50, ms)); };
  const halt = () => { clearTimer(timer); timer = 0; if (active) { active = false; for (const e of events) { try { e.stop && e.stop(); } catch (err) {} } } };
  function tick() {
    timer = 0; if (dead) return;
    const idle = now() - stamp;
    if (idle < idleMs) return arm(idleMs - idle);
    if (!ok()) { active = false; return arm(idleMs / 4); }
    active = true;
    const can = e => { try { return !e.can || e.can(); } catch (err) { return false; } };
    const pool = events.filter(e => e.id !== lastId && can(e)), e = pool[Math.floor(rand() * pool.length)] || events.find(can);
    if (!e) return arm(gapMin + (gapMax - gapMin) * rand());
    lastId = e.id;
    try { e.run(); } catch (err) {}
    arm(gapMin + (gapMax - gapMin) * rand());
  }
  return {
    start() { stamp = now(); arm(idleMs); },
    input() { stamp = now(); if (active) { halt(); arm(idleMs); } },
    destroy() { dead = true; halt(); },
    get active() { return active; },
  };
}

const visible = el => !!(el && el.isConnected && el.getClientRects().length);

/* home: #home. opts: {sfx, hearth} (hearth handle from mountHearth). Returns a teardown. */
let current = null;
export function mountIdleRoom(home, {sfx = {}, hearth = null, idleMs, gapMin, gapMax, rand} = {}) {
  if (current) current();
  current = null;
  if (!home || typeof document === 'undefined') return () => {};
  const doc = document, made = new Set(), timers = new Set();
  const cue = n => { try { if (sfx.cue && !doc.hidden) sfx.cue(n); } catch (e) {} };
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const drop = el => { made.delete(el); el.remove(); };
  const litCandles = () => [...home.querySelectorAll('.mantel-row .mc-lit')].filter(visible);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const events = [
    {id: 'ember', run() { if (hearth && hearth.pop) hearth.pop(6, 0); cue('crackle'); }},
    {id: 'settle', run() { if (hearth && hearth.pop) hearth.pop(18, .35); cue('crackle'); later(() => cue('crackle'), 140); }},
    {id: 'drip', can: () => litCandles().length > 0, run() {
      const c = litCandles();
      const d = doc.createElement('b'); d.className = 'idle-drip'; d.setAttribute('aria-hidden', 'true');
      pick(c).appendChild(d); made.add(d); later(() => drop(d), 4200);
    }},
    {id: 'moth', can: () => visible(home.querySelector('.mantel-row')) && litCandles().length > 0, run() {
      const row = home.querySelector('.mantel-row');
      const m = doc.createElement('i'); m.className = 'idle-moth'; m.setAttribute('aria-hidden', 'true'); m.innerHTML = '<b></b>';
      row.appendChild(m); made.add(m); later(() => drop(m), 7200);
    }},
    {id: 'bell', can: () => { const b = doc.getElementById('dp-bell'); return visible(b) && home.contains(b); }, run() {
      const b = doc.getElementById('dp-bell');
      b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); later(() => b.classList.remove('ring'), 1400);
      try { sfx.chime && sfx.chime(1); } catch (e) {}
    }},
  ];
  for (const e of events) e.stop = () => {
    for (const el of [...made]) drop(el);
    const b = doc.getElementById('dp-bell'); if (b) b.classList.remove('ring');
  };

  const ok = () => !doc.hidden && home.isConnected && !home.hidden && !reducedMotion() && Quality.params().ambient
    && !home.classList.contains('book-opening') && !home.classList.contains('attic-away');
  const dir = createIdleDirector({events, idleMs, gapMin, gapMax, rand, ok});
  const input = () => dir.input();
  const keys = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
  for (const k of keys) addEventListener(k, input, {passive: true, capture: true});
  const onVis = () => { if (doc.hidden) dir.input(); };
  doc.addEventListener('visibilitychange', onVis);
  dir.start();

  current = () => {
    dir.destroy(); for (const e of events) e.stop();
    for (const t of timers) clearTimeout(t); timers.clear();
    for (const k of keys) removeEventListener(k, input, {capture: true});
    doc.removeEventListener('visibilitychange', onVis);
  };
  return current;
}
