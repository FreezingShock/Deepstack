# Frame-time baseline (item 37)

Overlay: open the game with `?perf` (zero cost without it). Recorder: `npm run build && CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/perf.mjs --secs 6`.

Baseline on main at 95e6aba, 2026-11-04, headless Chromium with software rendering, 1280x800 at 1x, 6 s per scenario. Use these only for before/after comparison on the same machine; absolute fps is capped near 30 by the software renderer.

| scenario | frames | fps | p50 ms | p95 ms | p99 ms | max ms | work avg ms | work p95 ms |
|---|---|---|---|---|---|---|---|---|
| home | 173 | 29 | 33.3 | 66.6 | 100.0 | 116.6 | 3.99 | 9.80 |
| run | 152 | 25 | 33.4 | 66.7 | 66.7 | 83.4 | 3.06 | 5.80 |
| descent | 157 | 26 | 33.4 | 66.7 | 83.4 | 116.6 | 2.09 | 4.10 |

"work" (time inside the rAF callback) is the steadier number to compare for canvas changes; interval p95 is quantised by the renderer.
