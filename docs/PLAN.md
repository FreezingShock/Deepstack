# Replacing the stand-ins

## 1. Word data from Wiktionary

Today: 38 hand-written words in `src/core/words.js`, each with hand-written concept lists and synonyms for the lexical scorer.

Plan (offline build step, output committed or generated in CI, never fetched at play time):
1. Take a Wiktionary dump via kaikki.org's pre-parsed JSONL (CC BY-SA, so we must credit Wiktionary in the UI and keep the data attribution file).
2. Filter to English entries with a definition, part of speech, and no "obsolete/rare/dialect/offensive" tags. Join with a frequency list (e.g. wordfreq) and keep a rarity band.
3. Difficulty `d` (0-10) comes from log frequency, with word length as a minor term, calibrated so the existing 38 words keep roughly their current values.
4. Per word store: word, pos, first 1-3 senses, a cleaned primary definition, and an example sentence with the word blanked (the hint). Examples are often missing, so fall back to a templated hint or hide the hint power-up for that word.
5. Output `public/data/words.json` (a few thousand words) plus a small index by difficulty. The daily picker and Elo placement stay as they are but read this file.
6. Hand-review the top slice that Daily can draw from, since the first release should not ship raw Wiktionary glosses like "alternative form of ...".

## 2. Embedding scorer (local, no API)

Replace the body of `judgeAnswer()` in `src/scorer/index.js`; the rest of the app already awaits it.

- Model: a small sentence-embedding model run in the browser with transformers.js (ONNX/WASM, WebGPU when available). Candidates: `all-MiniLM-L6-v2` (about 23 MB quantised) or `bge-small`. Lazy-load after the home screen renders and cache in IndexedDB/Cache Storage; fall back to the lexical scorer until it is ready or if loading fails.
- Reference vectors: embed each word's definition (and optionally 2-3 paraphrased senses) once at build time and ship them with the word data, so only the player's answer is embedded at runtime.
- Score: cosine similarity between the answer and the reference vectors (max over senses), mapped to 0-100 by a calibrated curve. Calibrate on a labelled set of real answers per tier (the tier thresholds in `src/core/tiers.js` are the targets), not on guesswork.
- Guards: answers that contain the target word, that are too short, or that merely copy the definition get adjusted; opposite-meaning answers score high in embedding space, so keep a negation/antonym check from the lexical scorer as a penalty. Keep the "caught / missed concepts" feedback by falling back to lexical concept hits where available.
- Daily fairness: scoring must be deterministic across devices, so pin the model version and run it in fp32/quantised consistently; scores are local-only so small float drift is acceptable but the model file must be version-pinned.
- Tests: a fixed fixture of (word, answer, expected tier band) run in Node via onnxruntime so regressions are caught in CI.

## Decisions (nate, 2026-11-03)
- A ~25 MB model download is acceptable. Download once, cache in Cache Storage / IndexedDB, request `navigator.storage.persist()`, and never re-download unless the pinned model version changes.
- Show download progress: a small, non-blocking indicator on the home screen ("Preparing the judge, 40%") using the fetch stream's byte count. Daily can start with the lexical fallback only if the model is not ready, but prefer waiting briefly so scoring is consistent.
- Difficulty: derive from Wiktionary/frequency data and use the 38 hand-tuned values as calibration anchors (both replace and seed).

## Word data pipeline (scripts/)
`npm run build:words -- --kaikki <kaikki.jsonl> --freq <en_full.txt>` writes `public/data/words.json`.
Inputs are not committed. Difficulty is a least-squares fit of log frequency to the 38 hand-tuned difficulties; frequency alone is a rough signal (rare-but-easy words like "zzyzx" slip through), so the Daily pool should come from a hand-reviewed slice. Generated words have no concept lists, so they are not wired into the game until the embedding scorer lands.

## Status (embedding scorer branch)
- Done: words.json wired into Daily (`src/core/wordPool.js`, with quality filters), embedding judge (`src/scorer/`), lazy model load with cache + progress on the home screen, self-hosting via `npm run fetch:model`, `npm run calibrate` with labelled answers in `test/fixtures/answers.json`.
- Calibrated (2026-11-03): `src/scorer/calibration.json` is fitted to the real MiniLM q8 model on 103 labelled answers (`npm run calibrate -- --write`). Medians: exact 0.91 cosine, good 0.57, vague 0.31, wrong 0.38, unrelated 0.11. Embeddings cannot separate topical-but-wrong answers from vague ones, so the curve pools them at score ~16. Known weak spots: antonym-style wrong answers ("lasting forever" for ephemeral reaches Codex) and one-word synonyms ("thrifty" ~12), plus poor Wiktionary glosses as reference ("infinite").
- Reference vectors are embedded at play time (the day's definitions only), not shipped at build time.
- Download size: model ~23 MB plus the ONNX runtime wasm (~14-27 MB, self-hosted when `fetch:model` has run).

## Scoring guards (2026-11-03)
- Antonym guard: `src/scorer/antonyms.js` is a lexicon of opposed term groups. An answer on the opposite side from the definition (negations such as "without", "lacking" flip sides) is multiplied by 0.35 and flagged as pointing the other way. 0 false positives on the 103 labelled answers; it only knows the groups listed, so extend the lexicon when real answers slip through.
- Bare synonyms: an answer of at most two content words is also compared with the target word's own embedding (floor 0.42, capped at 0.55 similarity), so "thrifty" for frugal reaches Folio. Skipped for contrary answers.
- Pool quality: generated words need at least 25 translations, a gloss that is not a bare synonym list or "(see usage)" leftover, and no software jargon. Removes churl, seadog and the programming sense of dialect; pool is about 5.8k words.
- Calibration report: 97/103 answers inside their expected bands.
