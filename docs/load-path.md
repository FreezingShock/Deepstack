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
- Word list is not split by difficulty band: the Daily's seeded picks need the full pool in a fixed order, so every run needs every band before it can start. Shrinking the file is backlog item 64.
- Gzip/brotli is the host's job (the script measures with gzip: 2.2 MB json becomes 691 KB). Vite's dev server does not compress; any static host (GitHub Pages, Netlify, Vercel, Cloudflare) does by default. Hashed `assets/*` can be cached for a year; `data/words.json` and `fonts/*` are not hashed, so give them a short cache or version their URLs if the host caches aggressively.
