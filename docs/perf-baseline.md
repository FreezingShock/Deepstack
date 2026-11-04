# Frame-time baseline (item 37)

Overlay: open the game with `?perf` (zero cost without it). Recorder: `npm run build && CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/perf.mjs --secs 6`.

Baseline on main at 95e6aba, 2026-11-04, headless Chromium with software rendering, 1280x800 at 1x, 6 s per scenario. Use these only for before/after comparison on the same machine; absolute fps is capped near 30 by the software renderer.

| scenario | frames | fps | p50 ms | p95 ms | p99 ms | max ms | work avg ms | work p95 ms |
|---|---|---|---|---|---|---|---|---|
| home | 173 | 29 | 33.3 | 66.6 | 100.0 | 116.6 | 3.99 | 9.80 |
| run | 152 | 25 | 33.4 | 66.7 | 66.7 | 83.4 | 3.06 | 5.80 |
| descent | 157 | 26 | 33.4 | 66.7 | 83.4 | 116.6 | 2.09 | 4.10 |

"work" (time inside the rAF callback) is the steadier number to compare for canvas changes; interval p95 is quantised by the renderer.

## Light map (item 2, PR #141), deep floors
Same machine and renderer. Alcove open on each floor, cursor on the shelf, 5 s each, "work avg / p95" in ms inside the rAF callback. Before = main at e2427ce plus #135.

| floor | 1280 before | 1280 after | 375 before | 375 after |
|---|---|---|---|---|
| stacks | 2.48 / 8.0 | 1.81 / 4.2 (no pass) | 1.47 / 5.5 | 1.94 / 6.4 (no pass) |
| catacombs | 1.18 / 1.6 | 2.59 / 3.7 | 1.32 / 1.7 | 1.94 / 2.7 |
| vault | 1.59 / 2.1 | 2.36 / 3.4 | 1.49 / 1.9 | 1.91 / 2.6 |
| hollow | 1.07 / 1.5 | 1.78 / 2.4 | 1.29 / 1.6 | 1.67 / 2.1 |
| abyss | 1.04 / 1.5 | 1.73 / 2.5 | 1.18 / 1.5 | 1.73 / 2.0 |

Cost of the pass is about 0.5 to 1.4 ms per frame under software rendering, well inside a 16 ms frame. Stacks rows are noise (no pass runs there).
