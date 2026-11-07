# Load path (backlog 39)

Measure any build with `npm run build && node scripts/loadpath.mjs dist` (add `--throttle` for slow 4G: 1.6 Mbps, 150 ms latency; set `CHROMIUM_PATH` if Playwright's browser is missing). The script gzips text assets like a real host does.

## What changed
- The six Google fonts (Cinzel, Fuzzy Bubbles, IM Fell English, Newsreader, Source Sans 3, Special Elite) are committed in `public/fonts/google/` (latin subset, 9 files, 480 KB, variable files shared across weights) and declared in `src/ui/googleFonts.css`. Regenerate with `node scripts/fetch-fonts.mjs` only when the font list changes. No request leaves the site any more.
- `words.json` and the judge model start after the first paint (`src/core/boot.js`): two frames, then idle, then words, then the model, one after another instead of fighting each other and the home screen for bandwidth.

## Measured (headless Chromium, slow 4G, home screen)
| | before | after |
|---|---|---|
| third-party requests | 7 | 0 |
| first contentful paint | 652 ms | 652 ms |
| fonts finished | 4.9 s | 3.9 s |
| word list ready | 9.0 s | 7.1 s |

Unthrottled: first paint 444 ms to 352 ms, 10 third-party requests to 0.

## Decisions
- Font preloads made first paint worse on slow links (they queue ahead of the JS), so there are none. Fonts use `font-display: swap`.
- Word list is not split by difficulty band: the Daily's seeded picks need the full pool in a fixed order, so every run needs every band before it can start. Shrinking the file is backlog item 80.
- Gzip/brotli is the host's job (the script measures with gzip: 2.2 MB json becomes 691 KB). Vite's dev server does not compress; any static host (GitHub Pages, Netlify, Vercel, Cloudflare) does by default. Hashed `assets/*` can be cached for a year; `data/words.json` and `fonts/*` are not hashed, so give them a short cache or version their URLs if the host caches aggressively.

## First visit to the judge (2026-11-07, `scripts/first-load.mjs`)
`scripts/first-load.mjs` loads the built app like a player who has never been here (no service worker, empty storage) on Slow 4G (150 ms RTT, 1.6 Mbps) with the CPU at 4x, a 390x844 phone at 2x, then again as a returning visit. It times the home screen, the first word and the first answer scored by the embedding model, and counts the bytes each step waited for. Gzip is applied to text assets, as a host does. `loadpath.mjs` measures the home screen only.

| cold visit | origin/main | this PR |
|---|---|---|
| home usable | 4.1 to 4.3 s | 4.4 s |
| first word on screen | 11.4 to 11.6 s | 11.5 s |
| judge model ready (first embedding score) | 359 s | 133 s |
| bytes fetched before the judge | 67.9 MB | 23.7 MB |
| model file fetches | 3 (21.9 MB each, at once) | 1 |

| repeat visit | origin/main | this PR |
|---|---|---|
| home usable | not measured | 2.9 s |
| first word on screen | not measured | 9.9 s |
| judge model ready | not measured | 10.1 s |
| bytes fetched | not measured | 0 |

The cold judge time is still dominated by the model itself: 22 MB of quantized weights plus 3.5 MB of runtime, which a 1.6 Mbps link takes about two minutes to carry. The first word on a slow phone is CPU-bound (boot, word pool and the Descend animation at 4x CPU), not network-bound: on a repeat visit the bytes are already cached and it still takes about 10 s.

## What changed
- `src/scorer/fileShare.js`: transformers.js asked for the model file three times while it built the session, and each ask was a full download, so the judge waited on three copies sharing the link. Every GET of a model file is now one download; each caller reads its own copy of the same stream, so progress still streams. Ranged reads, HEAD, POST and failed responses are untouched.
- `vite.config.js`: the service worker precaches the 14 font faces the home screen and the idle prewarm draw, not all 33. The rest are cached the first time a screen uses them. About 0.7 MB less downloaded during the first visit, while the model is loading.
- `scripts/perf-budget.mjs`: counts model fetches. A cold visit may fetch each model file once; a repeat visit may fetch none.

## Tried and dropped
- `<link rel="preload">` for `words.json` in `index.html`: the first word came about 0.9 s sooner, but home came about 0.8 s later, because the list was parsed while the page was still booting. `fetchpriority="low"` on the same preload did not help (home still late, first word later). Dropped to keep the home screen where it was.

## Next (backlog PF11 to PF15)
- The remaining bytes are the model (22 MB), the runtime (3.5 MB, fetched after the model), the word list (0.7 MB gzip, PF3), relations and senses (2.2 MB gzip, PF8) and the Ledger's room lists (about 120 KB, fetched three seconds after boot, PF13).
- The first word is CPU-bound on a slow phone (PF14).
