# Deepstack refinement backlog

How to use: pick numbers, start one thread per number, paste the **Brief** as the thread's task. Every brief assumes the rules in CLAUDE.md (branch from `origin/main`, small PR, `npm test && npm run build`, ready for review, new code in new files, tests as new files).
Companion: [feature-inventory.md](feature-inventory.md) says what exists today. Snapshot 2026-11-04, after #80.
When your PR merges, tick your item here (change `[ ]` to `[x]` and add the PR number), and update its row in the inventory.

Status key: `[ ]` open, `[~]` in progress, `[x]` done.

## In progress (do not start; listed so briefs below do not overlap)
- [~] **Spacing and type pass** across home, run, results (fonts, sizes, rhythm).
- [~] **Run screen** polish (word presentation, candle timer, input).
- [~] **Floors** art and transitions (#81).
- [~] **Tactile feedback** (hover, press, hit-testing, cursor) (#82).
- [~] **Tier reveals** (the moment a book's tier is shown).
- [~] **Transitions** (Descend, leave run, return home).
- [~] **Keyboard and screen-reader accessibility.**
- [~] **Judge** accuracy work (antonyms, bare synonyms, reference quality).
- [~] **Difficulty and word pool** (ramp, hand-review of Daily slice).
- [~] **Hints and skip** behaviour.
- [~] **Daily fairness** (combo/set bonus in Daily, scoring determinism).
- [~] **Particles** (#83).
- [x] Done recently: Daily book (#72), fonts (#73), results screen (#74), page-corner flips (#77), smooth camera glide (#76, #79), color tokens (#49-#62), judge in a worker (#61), phone layout (#60, #64), canvas throttling (#51), smoke clicks every menu book (#52).

## Conflict map (read before picking several)
Items that touch the same hot file should not run at the same time, or should be sequenced. Tags used below:
- **MAIN** = `src/main.js`. **CSS** = `src/styles.css`. **FEEL** = `src/feel.js`. **HOME** = `src/ui/home.js`, `home.css`, `bookMenus.js`. **JUDGE** = `src/scorer/*`. **CORE** = `src/core/*`. **WORLD** = canvas `World` in `main.js` plus `lanterns.js`, `floorArt.js`.
- Every item lists `Touches` and `Conflicts with`. Items with only new files and a one-line hook in `main.js` are safe to run in parallel with anything.
- Safest parallel batch (disjoint files): 7 + 9 + 14 + 21 + 25 + 31 + 41 + 44.

---

## A. Look and feel (UI)

### 1. Candle timer overhaul
**Pitch:** The 45 s timer becomes a candle that visibly burns down, flickers faster in the last 10 s, and gutters out at zero.
**Brief:** Goal: replace the numeric/bar timer with a drawn candle whose flame height and flicker reflect time left, with a calm warning pulse under 10 s (no red flashing). Files: new `src/ui/candle.js` + `candle.css`; one-line hook in `main.js` timer code. Done when: a test pins the flame-height function (full, half, last 10 s, zero), reduced motion swaps flicker for a steady flame, smoke test still passes, screenshot of gameplay updated.
**Touches:** MAIN (hook), new files. **Conflicts with:** in-progress Run screen; sequence after it.

### 2. Alcove word lettering
**Pitch:** The word is carved/lettered on the alcove wall with proper kerning, a part-of-speech plaque, and a soft lamp-lit reveal instead of plain canvas text.
**Brief:** Goal: improve the canvas word drawing: size-to-fit for long words (up to 14 letters), letter-by-letter lamp reveal, subtle engraved shadow, part of speech on a small brass plate. Files: new `src/ui/wordArt.js` (pure fit/size function + draw), hook in `World` draw. Done when: fit function tested for 3, 9 and 14 letter words at 375 and 1280 px, no overflow in snapshots.
**Touches:** WORLD (small). **Conflicts with:** 1, Run screen thread.

### 3. Result card rarity styling
**Pitch:** Each tier's book card gets its own frame, foil and spine treatment so a Codex *looks* different from a Paperback.
**Brief:** Goal: per-tier card dressing (border ornament, foil sheen, spine emboss) driven by tokens in `colors.js`. Files: new `src/ui/tierFrames.js` + `tierFrames.css`; read tiers from `core/tiers.js`. Done when: a test asserts every tier has a frame definition and unique accent token; seven-tier screenshot strip attached to PR.
**Touches:** new files, `card.css` (small). **Conflicts with:** Tier reveals thread; coordinate or sequence after it.

### 4. Home: living background
**Pitch:** The home screen shows a slow, quiet library behind the menu: drifting dust, distant lantern sway, an occasional book shelved by an unseen hand.
**Brief:** Goal: ambient motion on home that never distracts and costs under 2 ms/frame. Files: new `src/ui/homeAmbience.js`; one hook in HOME. Done when: pauses when the tab is hidden or a book spread is open, disabled for reduced motion, frame-time check in `scripts/` documented.
**Touches:** HOME (hook). **Conflicts with:** Spacing and type, 17.

### 5. Iconography set
**Pitch:** One consistent hand-drawn icon set (sound, settings, credits, hint, skip, share, shelf, stats) replacing the mix of inline paths.
**Brief:** Goal: a single `icons.js` of SVG strings in one stroke style; swap usages. Files: new `src/ui/icons.js`, `topbar.js`, `bookMenus.js`. Done when: no inline `<path` strings remain outside `icons.js` (test greps), all icons legible at 20 px.
**Touches:** `topbar.js`, HOME. **Conflicts with:** HOME items (4, 17).

### 6. Button and hover vocabulary unification
**Pitch:** Finish what #48 started: every pressable thing shares one press depth, one hover glow, one focus ring.
**Brief:** Goal: audit the three UI vocabularies (top bar, carved plaque, brass pill), define shared hover/active/focus tokens, apply. Files: `buttons.css`, `topbar.css`, `home.css`, `tracker` styles. Done when: a CSS test fails on any new `filter:brightness` hover, documented in CONTRIBUTING colors section.
**Touches:** CSS, HOME. **Conflicts with:** Tactile thread (#82) — wait for it.

### 7. Parchment and ink texture pass
**Pitch:** Book pages, cards and plaques get a subtle paper grain, ink bleed and edge wear so they feel handled.
**Brief:** Goal: generated (not image-file) paper texture via CSS gradients/SVG filter, one shared class. Files: new `src/ui/paper.css`. Done when: under 5 KB added, contrast of body text unchanged (test with token contrast helper), high-contrast setting turns it off.
**Touches:** new CSS. **Conflicts with:** none.

### 8. Depth-dependent mood
**Pitch:** Each floor shifts vignette, fog, lamp warmth and dust so the Abyss feels different without reading the feet counter.
**Brief:** Goal: per-floor post-process layer on the canvas (vignette, fog band, colour grade) interpolated across floor boundaries. Files: `floors.js` data fields (additive), new `src/ui/mood.js`, hook in `World`. Done when: interpolation tested at boundaries, no pop at crossings, throttled with the cover logic.
**Touches:** WORLD, CORE floors. **Conflicts with:** Floors thread (#81) — start after it merges.

### 9. Credits and about book
**Pitch:** Credits become a proper last page: Wiktionary attribution, model credit, fonts, version, and "what's new".
**Brief:** Goal: structured credits panel with a short changelog (`src/data/changelog.js`) shown once after updates. Files: `topbar.js` credits block, new `changelog.js`. Done when: changelog entry shown once per version (stored additively), license texts present, test for once-only display.
**Touches:** `topbar.js`. **Conflicts with:** none significant.

### 10. Dark-mode contrast and text scaling audit
**Pitch:** Verify every text colour against its background at all three text sizes and in high-contrast mode, and fix failures.
**Brief:** Goal: a script that renders key screens and checks WCAG contrast of text tokens; fix offenders in `colors.js`. Files: new `scripts/contrast.mjs`, `colors.js`. Done when: AA for body text on every surface, report committed, CI step optional.
**Touches:** `colors.js`. **Conflicts with:** Accessibility thread.

## B. Experience (UX)

### 11. First-run welcome
**Pitch:** A 20-second wordless introduction the first time: a hand writes the rules in a book, then Descend lights up.
**Brief:** Goal: onboarding that shows the loop (read word, write, tier, descend) without a tutorial wall; skippable, never repeats (additive `S.seen.welcome`). Files: new `src/ui/welcome.js` + css; one hook. Done when: skipped by keyboard, reduced-motion version is static pages, test for once-only.
**Touches:** HOME (hook), MAIN (hook). **Conflicts with:** 4, 12.

### 12. Practice round (no stakes)
**Pitch:** A 3-word warm-up that doesn't touch the Lexicon, shelf or streak, for new players and for trying phrasing.
**Brief:** Goal: a "Practice" book option that runs 3 easy words and shows results without saving. Files: new `src/core/practice.js`, small hook in run start. Done when: a test proves no write to `deepstack.v1`, scoring identical to normal.
**Touches:** MAIN, CORE. **Conflicts with:** Hints and skip thread, 11.

### 13. Pause and resume
**Pitch:** Escape pauses the candle and blurs the word (so you can't think for free), and switching tabs pauses automatically.
**Brief:** Goal: pause overlay, visibility-change pause, resume on key. Done when: a timer test shows no drift across a pause, pausing is not recorded anywhere (purely local), keyboard path documented.
**Touches:** MAIN. **Conflicts with:** Run screen thread, Keyboard/a11y thread.

### 14. Save export, import and reset
**Pitch:** Download your library as a file, restore it elsewhere, and reset with a clear confirmation.
**Brief:** Goal: Settings buttons for Export (JSON), Import (validated, additive merge) and Reset (typed confirmation). Files: new `src/core/saveIO.js`, `settings` panel hook. Done when: round-trip test, corrupt file rejected without data loss, import never lowers streak or deletes shelf entries.
**Touches:** `topbar.js`/settings, new files. **Conflicts with:** none.

### 15. Streak and calendar
**Pitch:** A Daily calendar page showing which days you played, tier of each, and streak freeze rules.
**Brief:** Goal: month grid in the Daily book from existing saves; no new fields. Files: `dailyBook.js`, new `calendar.js`. Done when: timezone edge test (UTC day key), empty days shown, phone layout checked.
**Touches:** `dailyBook.js`. **Conflicts with:** Daily fairness thread.

### 16. Better share
**Pitch:** Share text plus a generated image card (canvas) of your run: tiers as books on a shelf, depth, Daily number.
**Brief:** Goal: "Copy text" and "Save image" on the results screen; image drawn on an offscreen canvas, no emojis in text. Files: new `src/ui/shareImage.js`. Done when: deterministic render test (hash of pixel data for seeded run), fallback when clipboard blocked.
**Touches:** results screen (small hook). **Conflicts with:** none.

### 17. Home menu rework for returning players
**Pitch:** Home surfaces what matters now: today's Daily state, current streak, last depth, Resume if a run was interrupted.
**Brief:** Goal: contextual line on the Daily book and a small "Pick up where you left off" when a run was abandoned (store run progress additively). Files: HOME, new `src/core/resume.js`. Done when: resume restores words and timer fairly (Daily cannot be replayed), tested.
**Touches:** HOME, MAIN. **Conflicts with:** 4, 11, 13, Spacing and type.

### 18. Result feedback that teaches
**Pitch:** After each word show what a Codex answer would have said and which ideas yours caught, so players improve.
**Brief:** Goal: expand the result card with "What you caught / what was missing" using lexical hits plus the reference definition, collapsed by default. Files: `src/core/feedback.js`, card hook. Done when: never reveals the word spelling for hints already used, test with fixtures.
**Touches:** card, JUDGE (read only). **Conflicts with:** Tier reveals, Judge threads.

### 19. Word history and favourites
**Pitch:** Mark words you want to revisit; a "Words to retry" shelf resurfaces them in Unlimited.
**Brief:** Goal: star on result card and shelf book; additive `S.starred`. Files: new `src/core/starred.js`, `browse.js` filter. Done when: Unlimited picker mixes starred words at a capped rate, tests for cap and missing field.
**Touches:** `browse.js`, `level.js`. **Conflicts with:** Difficulty thread.

### 20. Stats book depth
**Pitch:** The Stats spread shows trends (Lexicon over time, tier distribution, best depth per floor, streak history) in the book's own visual language.
**Brief:** Goal: three pages of hand-drawn style charts from existing `S.rating.hist` and dailies. Files: `src/ui/statsPages.js`. Done when: empty-state pages, 60-point history handled, phone layout verified.
**Touches:** `sets/ui.js`/bookpages. **Conflicts with:** none.

## C. Mechanics

### 21. Achievements (ledger plaques)
**Pitch:** Brass plaques for milestones: first Folio, 5-chain, reach the Abyss, 30-day streak, complete all sets.
**Brief:** Goal: pure `achievements.js` evaluating saves, toast on unlock, a Records page. Additive `S.ach`. Done when: each rule unit tested, retroactive unlock on load without duplicate toasts.
**Touches:** new files, Records page hook. **Conflicts with:** none.

### 22. Word rarity and daily "Rare find"
**Pitch:** Occasionally an exceptionally rare word appears with a bonus, announced by a distinct lantern colour.
**Brief:** Goal: seeded (so Daily-fair) rare-slot logic and bonus rows. Files: `core/rare.js`, `daily.js` hook. Done when: seeded determinism test across dates, bonus capped.
**Touches:** CORE. **Conflicts with:** Daily fairness, Difficulty threads.

### 23. Risk/reward: Double-down
**Pitch:** Before submitting you may "stake" half your hint-free bonus for a chance at extra depth if you reach Folio+.
**Brief:** Goal: optional stake toggle, resolved purely from tier. Never in Daily unless Daily fairness thread rules otherwise. Done when: pure function with property tests, no negative depth.
**Touches:** CORE combo, MAIN. **Conflicts with:** Daily fairness, Hints.

### 24. Set progression and completion moment
**Pitch:** Completing a set plays a small ceremony (book slides into place, plaque lights) and unlocks a themed lore line.
**Brief:** Files: `src/sets/ui.js`, new `ceremony.js`. Done when: fires once per set (stored in `S.sets.done`), reduced-motion variant.
**Touches:** sets, results. **Conflicts with:** Particles thread.

### 25. More collectible sets
**Pitch:** Eight more sets (emotions, body, law, sea, craft II, science, myth, food) so collecting lasts.
**Brief:** Goal: add sets whose words exist in `words.json` (test checks each word present). Files: `sets/sets.js` only. Done when: ids unique, bonuses balanced against floor spacing in `floors.js` comments.
**Touches:** `sets.js`. **Conflicts with:** none.

### 26. Topic decks (foundation)
**Pitch:** The plumbing for themed word pools (Science, Law, Nature...) so "different topics" later is content, not code.
**Brief:** Goal: tag words by topic in the build script, a `deck` parameter on the picker, a Deck chooser in the Unlimited book. Done when: default deck unchanged, picker tested per deck, words without topic stay in "General".
**Touches:** CORE, `build-words.mjs`, HOME. **Conflicts with:** Difficulty and word pool thread.

## D. Sound and feel

### 27. Per-floor ambience
**Pitch:** Each floor has its own room tone: Archive paper hush, Catacombs distant stone drips, Vault water, Hollow wind, Abyss low drone.
**Brief:** Goal: ambience layers synthesised in WebAudio crossfading with depth. Files: new `src/sound/ambience.js`, one hook in FEEL. Done when: volume scales with settings, silent when sound off, no click on start/stop, node-count cap tested via a fake AudioContext.
**Touches:** FEEL (hook). **Conflicts with:** Tactile thread if it edits `feel.js`.

### 28. Typing sounds and word-complete flourish
**Pitch:** Keys sound like a quill/typewriter on paper with slight pitch variance; submitting plays a seal-press.
**Brief:** Files: `src/sound/typing.js`. Done when: rate-limited, mute respected, no sound on reduced-sound setting.
**Touches:** FEEL. **Conflicts with:** 27.

### 29. Sound design test harness
**Pitch:** Sfx has zero tests; add a fake AudioContext so regressions in volume routing are caught.
**Brief:** Goal: `test/sfx.test.js` with mock AudioContext verifying master gain follows settings, `set(false)` silences, no throw without AudioContext. Done when: tests pass in Node.
**Touches:** tests only (maybe export seam in FEEL). **Conflicts with:** 27, 28.

### 30. Haptics (phone)
**Pitch:** Light vibration on tier reveals and combo, off by default if reduced motion.
**Brief:** Files: new `src/ui/haptics.js`; Settings toggle (additive field). Done when: guarded by `navigator.vibrate`, patterns per tier in a table, tested with a stub.
**Touches:** settings. **Conflicts with:** Tier reveals thread.

## E. Performance

### 31. Frame-time telemetry (local only)
**Pitch:** A hidden `?perf` overlay shows frame time, dropped frames and canvas cost so regressions are measurable.
**Brief:** Files: `src/ui/perf.js`. Done when: zero cost when off, `scripts/perf.mjs` records a 10 s headless run and prints p95 frame time; document baseline in the PR.
**Touches:** new files. **Conflicts with:** none.

### 32. Canvas draw budget
**Pitch:** Cut per-frame cost: cache gradients, batch dust, cap DPR on very large screens, pause when covered.
**Brief:** Files: WORLD. Done when: p95 frame time improved vs baseline from item 31, no visual diff in snapshots.
**Touches:** WORLD. **Conflicts with:** Floors, Particles, 8. Run alone or after them.

### 33. Load path: model and words
**Pitch:** First load feels instant: gzip hosting notes, words.json split by difficulty, model fetch starts after first paint with resume.
**Brief:** Files: `vite.config.js`, `model.js` loader, build script. Done when: first-load transfer measured before/after, words.json lazy by band, tests for loader fallback.
**Touches:** JUDGE loader, CORE words. **Conflicts with:** Judge thread (loader file), Difficulty/word pool thread.

### 34. Memory and long-session soak
**Pitch:** Play 100 runs headlessly and prove memory and listener counts stay flat.
**Brief:** Files: `scripts/soak.mjs`. Done when: reports heap growth and listener counts, fixes any leaks found (timers, canvas bitmaps, audio nodes).
**Touches:** wherever leaks are. **Conflicts with:** depends on what is found.

### 35. Mobile performance mode
**Pitch:** Detect low-end phones and lower particle counts, DPR and canvas fps automatically.
**Brief:** Files: new `src/ui/quality.js` + settings "Visual quality: auto/high/low". Done when: quality tiers tested via a mock, particles thread respects it.
**Touches:** settings, WORLD (read only). **Conflicts with:** Particles thread, 32.

## F. Overhauls

### 36. Split `main.js` into modules
**Pitch:** Break the 650-line dense file into `world.js`, `run.js`, `card.js`, `final.js`, `boot.js` with no behaviour change.
**Brief:** Goal: pure refactor, announced first, run only when no other thread touches `main.js`. Files: `main.js` → new modules. Done when: all tests, smoke and snapshots unchanged (pixel diff zero), line lengths normal, a public map added to `docs/`.
**Touches:** MAIN entirely. **Conflicts with:** everything tagged MAIN or WORLD. Schedule alone.

### 37. CSS split by screen
**Pitch:** Move `styles.css` rules into per-screen files so threads stop colliding.
**Brief:** Same rule as 36: pure move, zero visual diff. Done when: css-sanity and snapshots pass untouched, `styles.css` under 100 lines of true globals.
**Touches:** CSS. **Conflicts with:** all CSS-tagged items. Schedule alone, ideally with 36.

### 38. Save format v2 with migrations
**Pitch:** Versioned save with a migration table so future features never break old saves.
**Brief:** Files: new `src/core/save.js`; wrap `store`. Done when: v1 fixtures load, round trip, unknown fields preserved, corrupt save quarantined not deleted.
**Touches:** MAIN `store` (small). **Conflicts with:** 14, 36.

### 39. Judge v2: reference sentences
**Pitch:** Embed several paraphrased senses per word at build time and ship vectors, improving accuracy and speed.
**Brief:** Files: `scripts/`, `src/scorer/`. Done when: calibration report beats 97/103, bundle growth documented, worker parity test passes.
**Touches:** JUDGE. **Conflicts with:** Judge thread — start after it.

### 40. Content engine: curated tiers of words
**Pitch:** A reviewed list of 300 Daily-worthy words with clean definitions, examples and sets, replacing raw glosses.
**Brief:** Files: `data/curated.json`, build script merge. Done when: no "alternative form of" glosses, every word has an example or flagged, tests on schema.
**Touches:** CORE data. **Conflicts with:** Difficulty/word pool thread.

## G. Health, quality, process

### 41. Mobile and a11y snapshots in CI
**Pitch:** Add 375x667 snapshots and an axe-core check so phone regressions and obvious a11y errors fail CI.
**Brief:** Files: `scripts/snapshots.mjs`, test fixtures. Done when: three new phone snapshots, axe run with zero serious violations (or listed exceptions).
**Touches:** scripts only. **Conflicts with:** Accessibility thread (fixing what axe finds).

### 42. Lint for dense code
**Pitch:** A tiny line-length and statements-per-line check on new files so the codebase stops getting denser.
**Brief:** Files: `scripts/lint-lite.mjs`, new-file-only rule list. Done when: existing files exempted via a list, CI step added in a separate small PR.
**Touches:** scripts, CI. **Conflicts with:** none.

### 43. Behaviour pins for sound and motion
**Pitch:** Tests that fail when reduced motion is ignored or sound plays while muted.
**Brief:** Files: new test files. Done when: tests cover `Feel.slowmo`, `Sfx.set(false)`, and the CSS `prefers-reduced-motion` blocks.
**Touches:** tests. **Conflicts with:** 29.

### 44. PR template: "What did this reverse?"
**Pitch:** Stop silent reversals between threads (#40 vs #21) by prompting for it.
**Brief:** Files: `.github/pull_request_template.md`. Done when: template asks for "earlier PRs this changes" and "test that pins the new behaviour".
**Touches:** template only. **Conflicts with:** none.

### 45. Release tag and `stable` pointer
**Pitch:** Tag known-good `main` states and keep a `stable` branch nate tests before it reaches hosting.
**Brief:** Files: workflow `release.yml`. Done when: weekly or manual tag, release notes from merged PR titles.
**Touches:** `.github/workflows`. **Conflicts with:** none.

### 46. Hosting and PWA
**Pitch:** Deploy preview per PR, installable PWA with offline play once the model is cached.
**Brief:** Files: manifest, service worker, deploy workflow. Done when: Lighthouse PWA check, offline Daily works after first load, cache version pinned to model version.
**Touches:** `index.html`, `vite.config.js`. **Conflicts with:** 33.

---

## Suggested batches
- **Quick polish (parallel-safe):** 7, 9, 14, 21, 25, 44.
- **Feel:** 27, 28, 29, 30 (sequence 29 first).
- **Foundation for growth:** 38, 26, 40, then 36 + 37 together when quiet.
- **Health:** 41, 42, 43, 31.
- **Big experience upgrades:** 11, 12, 15, 17, 18, 20.
