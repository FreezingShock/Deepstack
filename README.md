# Deepstack

Explain a hard word in your own words. Your answer is judged on accuracy, becomes a book, and drops you one step deeper into an endless library. Depth in feet is your score.

This repo currently contains **Daily mode** (7 seeded words, 45 s each, one attempt per day, persistent bookshelf, streak, share text). Unlimited mode is not ported yet.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173 (also reachable on your LAN)
npm run build    # static output in dist/
npm test         # scorer + daily-seed sanity tests
```

## Layout

- `src/main.js` UI, canvas library world, sound, result card, bookshelf (ported as-is from the mockup)
- `src/core/` tiers, word bank, adaptive level, seeded daily picker
- `src/scorer/` `judgeAnswer(text, word)` facade; `lexical.js` is the keyword/synonym stand-in
- `docs/PLAN.md` plan for Wiktionary word data and the in-browser embedding scorer

Saves live in `localStorage` under `deepstack.v1`. Fonts load from Google Fonts for now.
