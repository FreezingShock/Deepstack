// Frame-time telemetry. Zero cost unless the URL has ?perf: when off, importing this file does nothing.
// When on, requestAnimationFrame is wrapped so every callback is timed (interval between frames and time spent
// inside the callback), and a small overlay shows live p50/p95, dropped frames and per-frame work.
// window.__perf exposes the raw samples for scripts/perf.mjs.
import {summarize, fmt} from './perfStats.js';

const on = typeof location !== 'undefined' && /[?&]perf(=|&|$)/.test(location.search) && !/[?&]perf=0/.test(location.search);
const MAX = 3000;

if (on) {
  const iv = [], wk = [];
  const raf = window.requestAnimationFrame.bind(window);
  // wrap only the callbacks of the main world loop and the like; every rAF callback counts as one "tick",
  // but intervals are measured per displayed frame (first callback after a new timestamp).
  let lastTs = -1;
  window.requestAnimationFrame = cb => raf(ts => {
    const t0 = performance.now();
    if (ts !== lastTs) { if (lastTs >= 0) { iv.push(ts - lastTs); if (iv.length > MAX) iv.shift(); } lastTs = ts; }
    cb(ts);
    wk.push(performance.now() - t0); if (wk.length > MAX * 4) wk.shift();
  });
  const snap = () => summarize(iv, wk);
  window.__perf = {snap, reset() { iv.length = 0; wk.length = 0; }, intervals: iv, work: wk};

  const el = document.createElement('pre');
  el.id = 'perfHud';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;left:6px;top:6px;z-index:99999;margin:0;padding:6px 8px;pointer-events:none;font:11px/1.35 monospace;color:#9f9;background:rgba(0,0,0,.72);border:1px solid #365;white-space:pre';
  const mount = () => document.body.appendChild(el);
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  setInterval(() => {
    const s = snap();
    el.textContent = `fps ${fmt(s.fps, 0)}  frames ${s.frames}\ninterval p50 ${fmt(s.p50)} p95 ${fmt(s.p95)} max ${fmt(s.max)} ms\nwork avg ${fmt(s.workAvg)} p95 ${fmt(s.workP95)} ms\ndropped ${s.dropped} (${fmt(s.droppedPct)}%)`;
  }, 500);
}
export const perfOn = on;
