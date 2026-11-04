// Pure frame-time statistics, shared by the ?perf overlay and scripts/perf.mjs.
export function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i];
}

// intervals: ms between frame starts. work: ms spent inside the frame callback (optional, same length or shorter).
// A frame is "dropped" when its interval exceeds 1.5x the refresh budget.
export function summarize(intervals, work = [], budget = 1000 / 60) {
  const iv = intervals.filter(Number.isFinite).slice().sort((a, b) => a - b);
  const wk = work.filter(Number.isFinite).slice().sort((a, b) => a - b);
  const n = iv.length;
  const sum = a => a.reduce((s, v) => s + v, 0);
  const dropped = iv.filter(v => v > budget * 1.5).length;
  return {
    frames: n,
    fps: n ? 1000 / (sum(iv) / n) : 0,
    p50: percentile(iv, .5), p95: percentile(iv, .95), p99: percentile(iv, .99), max: n ? iv[n - 1] : 0,
    dropped, droppedPct: n ? dropped / n * 100 : 0,
    workAvg: wk.length ? sum(wk) / wk.length : 0, workP95: percentile(wk, .95), workMax: wk.length ? wk[wk.length - 1] : 0,
  };
}

export const fmt = (v, d = 1) => (+v).toFixed(d);
