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
- `src/core/` tiers, word bank, adaptive level, seeded daily picker, `stats.js` (streaks and tier counts derived from saved dailies), `floors.js` (themed floors by depth)
- `src/scorer/` `judgeAnswer(text, word)` facade; `lexical.js` is the keyword/synonym stand-in
- `docs/PLAN.md` plan for Wiktionary word data and the in-browser embedding scorer

Saves live in `localStorage` under `deepstack.v1`. Fonts load from Google Fonts for now.

## Floors

The descent passes milestones that change the library: The Stacks (0 ft), The Archive (63 ft), The Catacombs (151 ft) and The Sunken Vault (260 ft). Each has its own palette, shelf dressing and lamp colour, and a banner announces the crossing. Edit `src/core/floors.js` to retune depths or looks; decay (cobwebs, missing and tilted books) never drops below a floor's `decay` value.
