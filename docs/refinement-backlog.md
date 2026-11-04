# Deepstack refinement backlog

How to use: pick numbers, start one thread per number, paste the item's **Brief** plus the **Standard preamble** below. Companion files: [feature-inventory.md](feature-inventory.md) (what exists) and [nate-preferences.md](nate-preferences.md) (what nate asks for). Snapshot 2026-11-04, after #80. Numbers were reassigned on 2026-11-04 when this list was reworked; ticks in later PRs keep them stable.

Status key: `[ ]` open, `[~]` in progress, `[x]` done (add the PR number).

**Keeping this alive (every thread):** when your PR merges, (1) tick your item here and update your row in the inventory, (2) append any new taste nate expressed in your thread to `nate-preferences.md` (one dated line under the matching pattern), (3) add 2 to 3 fresh items to the end of this file that follow from what he asked, in his wording and in the same format. Keep edits to a few lines so threads do not conflict.

## Standard preamble (add to every brief)
- Serves nate's patterns: overhaul not tweak, everything is a book/shelf/page, handwritten and sectioned, words fully readable, dark and mysterious, rarity is the hero, integrated not bolted on, physical and smooth motion.
- New code in new files under `src/`, one-line hooks in `main.js`/`styles.css`. Colors from `src/theme/colors.js` tokens only (hex ratchet tests).
- Verify at 375x667 and 1280x800, with a 14-letter word, with reduced motion on. Attach before/after screenshots of the exact screen to the PR. Repeat complaints from nate usually mean the first fix was not checked on the real screen.
- Respect existing decisions (see inventory); if you change something an earlier PR chose on purpose, say so in the PR body and add a test pinning the new behaviour.
- If the look is new, ask nate at most 3-5 styling questions with a recommended default, then start on the default.

## In progress (do not start)
- [~] Spacing and type pass on every screen
- [~] Run screen overhaul (alcove, wall lettering, candle timer, input)
- [~] Floors: distinct look per floor (#81)
- [~] Tactile hover/press/focus everywhere (#82)
- [~] Rare tier reveals
- [~] Screen-to-screen transitions
- [~] Keyboard controls and accessibility
- [~] Judge accuracy on tricky answers
- [~] Difficulty ramp and word pool
- [x] Hints and skip (#86)
- [~] Daily fairness and streaks
- [~] Particles off panels and text (#83)
- [~] Home button from Today's Result (bug)
- [x] Shelf as a library section (item 11, #111)
- [x] Results screen fits one view, no scroll (this PR)
- [x] Done: Daily book (#72), fonts (#73), results screen (#74), tagline (#75), smooth glides (#76, #79), page-corner flips (#77), replay descent (#78), top shelves and planks (#68, #80), shelf duplicates (#70), readable recent spines (#71), lore books hover and halo (#45, #57, #67), chained lanterns (#41), top bar (#31), floors and tracker (#33), menu books (#35-#39, #46), tokens (#49-#62), judge worker (#61), phone layout (#60, #64), canvas throttling (#51).

## Conflict map
Tags: **MAIN** `src/main.js`, **CSS** `src/styles.css`, **FEEL** `src/feel.js`, **HOME** `src/ui/home.js`/`home.css`/`bookMenus.js`, **BOOK** `bookpages.js`/`browse.js`/`dailyBook.js`/`sets/ui.js`, **WORLD** the canvas `World` plus `lanterns.js`/`floorArt.js`, **JUDGE** `src/scorer/*`, **CORE** `src/core/*`. Each item lists `Touches` and `Conflicts`. New-file-only items run in parallel with anything.
Safest parallel batch: 4, 9, 15, 24, 33, 37, 48, 50.

---

## A. The library as a place (WORLD, dark and mysterious)

### 1. Floor sections as chapters
**Serves:** dark/mysterious, sections for each floor, integrated.
**Pitch:** Each of the six floors reads as a chapter: a carved door or archway you pass through, a name plate, and its own wall material (paper stacks, bone, flooded stone, hollow wood, black glass), not just a tint.
**Brief:** Goal: threshold art drawn at each floor boundary (arch, hanging sign, a few distinct props per floor such as ledgers, ossuary niches, water drips, roots, a single candle in the Abyss). Files: new `src/ui/thresholds.js`, data fields added to `floors.js`, hook in `World`. Done when: each floor is identifiable in a screenshot with the HUD hidden, a test lists a threshold def for every floor, performance within 1 ms/frame of baseline (item 33).
**Touches:** WORLD, CORE floors. **Conflicts:** floors thread (#81), 2, 3.

### 2. Light as the mystery
**Serves:** dark/mysterious, performant.
**Pitch:** The deeper you go the less you see: lantern pools of light with real falloff, the dark between them hiding shelf detail, flickers that shift with the floor.
**Brief:** Goal: a lighting pass where lit radius shrinks with depth and unlit shelves fade to silhouette; lantern/alcove light cast on nearby books. Files: new `src/ui/lighting.js`; hook in `World`. Done when: Abyss is legible only near lights but the word and alcove stay readable (contrast test on the alcove), cached offscreen light map, reduced motion removes flicker.
**Touches:** WORLD. **Conflicts:** 1, 3, 33, floors thread.

### 3. [x] Things that live down here (this PR)
**Serves:** immersion, physical realism.
**Pitch:** Small ambient life per floor: moths round the lantern, a rat on the Catacombs shelf, a book that slides itself shut, drips, bubbles in the Vault, drifting ash in the Hollow.
**Brief:** Goal: 2 or 3 ambient creatures/events per floor, each rare and quiet, never over text or panels (respect the particles rules). Files: new `src/ui/ambient.js`. Done when: spawn rates capped, none covers the alcove or HUD (test via exclusion rects), off in reduced motion and low quality mode (35).
**Touches:** WORLD. **Conflicts:** Particles thread (#83), 2.

### 4. Hidden things to find [x] shipped as curios
**Serves:** immersion, lore books.
**Pitch:** More than words hide on the shelves: a loose page, a bookmark ribbon, a locked book that opens at a depth, a marginal note someone left.
**Brief:** Goal: 3 new rare shelf curiosities revealed on hover, seeded per row like lore books (pure function of the row seed, no storage). Files: new `src/ui/curios.js`. Done when: hover reveals with the same halo rules as lore books (tight, never near the alcove or pillars), determinism test, touch alternative.
**Touches:** new files, WORLD hook. **Conflicts:** none significant.

### 5. [x] Alcove as a reading nook (#112)
**Serves:** integrated, rarity hero.
**Pitch:** The alcove looks lived-in: lamp, a desk edge, an open book under the word, with your earned books lined on the ledge at believable scale.
**Brief:** Goal: redraw the alcove frame and ledge props, keep the word lettering area clear for the run screen thread. Files: new `src/ui/alcoveArt.js`. Done when: the ledge fits 7 books plus the skipped slot at 375 px, no overlap with the word at 14 letters.
**Touches:** WORLD. **Conflicts:** run screen thread; sequence after it.

### 6. Realistic hanging and physical sanity audit — [x] (PR #113, report: docs/physical-sanity-audit.md)
**Serves:** "why are the lanterns hanging from nothing", "floating book".
**Pitch:** Sweep the world for things that float, clip or lack support: lanterns, banners, plaques, ledge books, pulled books, lore halos.
**Brief:** Goal: a screenshot audit of every floor at several scroll positions listing physics/logic glitches, then fix them (chains reach a ceiling, books rest on planks). Files: WORLD files. Done when: report in `docs/` with before/after crops, a test for any new geometry helper.
**Touches:** WORLD. **Conflicts:** floors thread, 1.

## B. Books, shelves and pages (everything is a book)

### 7. [x] Book object library (#122)
**Status:** [~] panel half landed as the shared book style (`src/ui/bookStyle.css`: `--bs-*` tokens, `.bookbox`); Sets and Daily book now read the same tokens (PR follow-up to #101); the per-tier `bookArt` half is still open.
**Serves:** book objects, rarity hero.
**Pitch:** One shared way to draw a book (spine, cover, edge, ribbon, emboss) used by the menu, shelf, recents, results and share image, with per-tier cover materials: Pamphlet card, Paperback cloth, Hardbound board, Folio vellum, Codex gilt, Grimoire runed leather, Apocrypha glowing.
**Brief:** Goal: extract a `bookArt` module (spine height variation, wear, title kerning that fits any word without clipping or stretching) and apply per tier. Files: new `src/ui/bookArt.js`, minimal edits where `bookArt` lives in `main.js`. Done when: 14-letter and 3-letter words both fit, a seven-tier strip screenshot, no stretched text test (glyph aspect ratio check).
**Touches:** MAIN (`bookArt`), BOOK, results. **Conflicts:** tier reveals thread; run alone for the MAIN edit or sequence after 36.

### 7a. Per-tier material on the DOM book objects
**Serves:** rarity is the hero, book objects.
**Pitch:** The canvas spines now have seven materials (card, cloth, board, vellum, gilt, runed leather, glow). Give the CSS books (menu spines, Shelf stacks, the mini-book result card) the same seven materials so a Codex looks gilt everywhere.
**Brief:** Goal: a `tierMaterial.css` set of per-tier backgrounds matching `bookArt.js` (tokens only). Files: new css, light edits in `bookCard.css`, `browse.css`. Done when: seven-tier strip of the card at 375 and 1280 px, reduced motion static.
**Touches:** card, BOOK. **Conflicts:** 17, 64.

### 7b. Wear that follows the book
**Serves:** persistent world, variety over repetition.
**Pitch:** Older books on the Shelf look handled: scuffed corners, a creased spine, dust on top, while a book found today is crisp.
**Brief:** Goal: `bookArt` takes an `age` (from the saved date) that scales scuffs, dust and crease. Files: `src/ui/bookArt.js`, shelf spine call. Done when: same book at age 0 and age 30 days side by side, no-stretched-text test still passes.
**Touches:** BOOK. **Conflicts:** 11.

### 7c. Spine height and thickness from the answer
**Serves:** words fully readable, rarity is the hero.
**Pitch:** A fuller answer makes a thicker book and a better score a taller one, so the shelf reads like a record of how you did.
**Brief:** Goal: derive spine width from answer length and height from score inside `shelfDims`, bounded so a 14-letter word still fits. Files: `bookArt.js`, `spineLabel.js`. Done when: 3-letter and 14-letter words fit at both extremes.
**Touches:** BOOK, MAIN (`shelfDims`). **Conflicts:** 7b, 42.

### 8. Book opening v3 (cover, endpapers, ribbon)
**Serves:** overhaul, motion.
**Pitch:** Opening a menu book shows the cover, boards swing, endpapers and a bookmark ribbon appear, then the pages settle, all in under 600 ms.
**Brief:** Goal: refine the open and close choreography (cover lift with perspective, page block thickness, ribbon drop, closing thud with sound). Files: `bookMenus.js`, new `bookOpenFx.js`. Done when: open under 600 ms, close on outside click swings the cover shut, timing test via the transitions helper, reduced motion uses a fade.
**Touches:** HOME. **Conflicts:** transitions thread, 9.

### 9. Page content that feels written [x] (PR #105)
**Serves:** handwritten, sectioned.
**Pitch:** Every book page has margin notes, underlines, ink blots, a drawn divider, and small doodles keyed to the section.
**Brief:** Goal: a decorations helper that adds hand-drawn dividers/underlines (SVG stroke-draw animation) to page headings across Shelf, Sets, Stats and Daily. Files: new `src/ui/ink.js` + `ink.css`; light edits in BOOK files. Done when: stroke-draw respects reduced motion, text contrast unchanged, one headings test.
**Touches:** new files, BOOK. **Conflicts:** 8, 10.

### 10. Tabs and filters as handwriting (finish it) [x] (#127)
**Serves:** handwritten, pen underline.
**Pitch:** Every filter, tab and toggle in every book is a written word with a pen-drawn underline that animates between choices; the search field is handwriting and only repaints results.
**Brief:** Goal: audit all remaining pill/button-style controls inside book pages and convert them; keep focus rings visible. Files: BOOK css/js. Done when: no `.bbtn` or pill inside `.bookpage` (css test), keyboard focus visible, typing in search does not rebuild the page (existing test extended).
**Touches:** BOOK. **Conflicts:** 9, a11y thread.

### 11. Shelf as a real library section
**Serves:** shelves, sectioned, themed.
**Pitch:** The Shelf book is organised into labelled bays (by tier, by floor found, by set, by Daily date) with brass labels, a ladder, and lie-flat stacks, with a "pull a book" detail card.
**Brief:** Goal: add bays and sort modes beyond tier; stack height reflects count; selecting a stack lifts the top book to a detail card above the book (never behind). Files: new `src/ui/shelfBays.js`, `browse.js` hooks. Done when: 200-book shelf stays under 16 ms to render a page, duplicates collapse with a handwritten x N, 14-letter titles fit.
**Touches:** BOOK. **Conflicts:** 7, 10.

### 12. [x] Stats as an almanac (#127)
**Serves:** handwritten, sectioned, multiple pages.
**Pitch:** Stats become hand-drawn charts: Lexicon rising over runs, a tier histogram drawn as stacked book spines, depth per floor as a cross-section, streak ink-tally marks.
**Brief:** Goal: three to four stats pages from existing saves (`S.rating.hist`, dailies, shelf). Files: new `src/ui/statsPages.js`. Done when: empty states are written ("Nothing shelved yet."), 60-point history tested, tally marks match streak, phone layout verified.
**Touches:** BOOK. **Conflicts:** 10.

### 13. [x] Daily book calendar and margins (#127)
**Serves:** Daily book, handwritten.
**Pitch:** The Daily book gains a month calendar page (circled days you played, tier ink colours), a "this week" spread, and a margin note with your streak.
**Brief:** Goal: calendar page from existing saves, no new fields. Files: `dailyBook.js`, new `dailyCalendar.js`. Done when: UTC day-key edge test, Daily No. numbering shown, handwriting font loads (smoke test checks the face is in the document).
**Touches:** BOOK. **Conflicts:** Daily fairness thread.

### 14. Sets as a collector's case
**Serves:** collecting, rarity.
**Pitch:** Each set is a glass-front case with empty slots for missing books and a plaque; completing it plays a short ceremony (book slides in, brass plate lights).
**Brief:** Goal: redo the Sets pages and add the completion moment, once per set. Files: `sets/ui.js`, new `ceremony.js`. Done when: fires once (stored in `S.sets.done`), reduced-motion variant, set progress readable at 375 px.
**Touches:** BOOK. **Conflicts:** Particles thread, 10.

### 15. More sets (content)
**Serves:** collecting.
**Pitch:** Eight more themed sets (emotions, body, law, sea, craft II, science, myth, food) so collecting lasts.
**Brief:** Goal: add sets whose words exist in `words.json`. Files: `sets/sets.js` only. Done when: test checks every word present, ids unique, bonuses balanced in comments.
**Touches:** `sets.js`. **Conflicts:** none.

## C. The run and the reveal (rarity is the hero)

### 16. Result card as a reveal ceremony
**Serves:** rarity hero, less info, hierarchy.
**Pitch:** The card is just: tier name huge in its colour, rarity word, the book, one line of feedback. Everything else (closeness, feet, combo) folds under a small "details" corner.
**Brief:** Goal: strip the card to one focal point per tier, details behind a tap. Files: `card.css`, new `cardDetails.js`. Done when: a test asserts at most 3 visible text elements by default, details reachable by keyboard, Folio and above visibly grander than Hardbound.
**Touches:** card, MAIN hook. **Conflicts:** tier reveals thread; sequence after it.

### [x] 17. Tier-specific book dressing on the card (tierFrames.css, CSS-only, no shared book library yet)
**Serves:** rarity hero, book objects.
**Pitch:** The book on the card looks like its tier: foil sheen on Codex, rune glow on Grimoire, shimmer on Apocrypha.
**Brief:** Goal: pure CSS/canvas treatments driven by the book object library (7). Files: new `tierFrames.js` + css. Done when: seven-tier strip screenshot, tokens only, reduced motion static.
**Touches:** card. **Conflicts:** 7, 16, tier reveals thread.

### 18. [x] Feedback that teaches (spoiler-safe) (PR pending)
**Serves:** honest answers, hierarchy.
**Pitch:** After an answer, tap the book to see "what you caught / what was missing" and the dictionary line, collapsed by default.
**Brief:** Goal: details view using lexical hits and the reference gloss, never spelling the word if hints were used. Files: new `src/core/feedback.js`, small hook. Done when: fixture tests, no new on-screen clutter by default.
**Touches:** new, card hook. **Conflicts:** 16, judge thread.

### 19. Candle timer
**Serves:** physical, mysterious.
**Pitch:** The 45 s timer is a candle burning down with a flame that flickers faster in the last 10 s and gutters out at zero, no red flashing.
**Brief:** Goal: drawn candle with flame height tied to time left. Files: new `src/ui/candle.js` + css; hook. Done when: flame function tested (full, half, last 10 s, zero), reduced motion steady flame.
**Touches:** MAIN hook. **Conflicts:** run screen thread (it may already include this; check before starting).

### 20. Quill and ink input — [x] done (PR pending)
**Serves:** handwritten, tactile.
**Pitch:** The answer box looks like writing on parchment: a quill cursor, ink settling on each letter, a blotter on Enter (Enter still submits, no word count).
**Brief:** Goal: restyle the input only, keep behaviour. Files: new `src/ui/inkInput.js` + css. Done when: IME and mobile keyboard work, long answers scroll, typing sound still rate-limited.
**Touches:** run screen. **Conflicts:** run screen thread, a11y thread.

### 21. [x] Skipped and cleared books in the ledge (#127)
**Serves:** integrated.
**Pitch:** Skipped words leave a dashed slot, close calls get a ribbon, a streak of Folios gets a chain link, all visible on the alcove ledge.
**Brief:** Goal: richer ledge states using existing run data. Files: `ledge.js`. Done when: states tested, books fit at 375 px.
**Touches:** `ledge.js`. **Conflicts:** 5.

## D. Motion, sound and feel (smooth, physical)

### 22. [x] Motion language (#127)
**Serves:** smooth motion.
**Pitch:** One set of durations and easings (accelerate, cruise, settle) for every move: page flips, book opens, camera glides, modal enters.
**Brief:** Goal: a `motion.js` of named presets used by new code, with an audit of existing hard-coded durations. Files: new `src/ui/motion.js`, tests. Done when: preset table documented, no animation over 1.2 s except the long glides (clamped 1.2-2.5 s), reduced-motion branch in one place.
**Done:** `src/ui/motion.js` + `motion.css` (tokens `--m-*` durations, `--e-*` easings), 112 CSS declarations migrated, `test/motion.test.js` bans raw easings. Presets: press 80, quick 160, base 240, smooth 360, page 560, linger 1000 ms; accelerate / cruise / settle / spring / press / ink; glides stay in `camMotion.js` (1.2-2.5 s). Exempt: infinite ambient loops, keyframe-timed banners, `animation-duration` overrides. Reduced motion collapses all tokens in `motion.css`.
**Touches:** new files. **Conflicts:** transitions thread.

### 23. Typing, page and seal sounds [x] (#127)
**Serves:** tactile, immersive.
**Pitch:** Quill scratch on typing, paper on page flips, a wax-seal press on submit, a heavy thud when a book lands on the ledge.
**Brief:** Goal: new synthesised sounds with a fake-AudioContext test. Files: new `src/sound/*.js`, one hook in FEEL. Done when: mute and volume respected, rate limits, `test/sfx.test.js` covers routing.
**Touches:** FEEL hook. **Conflicts:** 24.

### 24. Per-floor ambience
**Serves:** dark, immersive.
**Pitch:** Each floor has its own room tone that crossfades with depth.
**Brief:** Goal: layered ambience (paper hush, stone drips, water, hollow wind, abyss drone). Files: new `src/sound/ambience.js`. Done when: silent when sound off, no clicks on start/stop, node cap tested.
**Touches:** FEEL hook. **Conflicts:** 23.

### 25. Haptics
**Serves:** tactile on phones.
**Pitch:** Light vibration on tier reveals, combo links and page flips.
**Brief:** Files: new `src/ui/haptics.js`, Settings toggle (additive). Done when: guarded by `navigator.vibrate`, pattern table per tier, stubbed test.
**Touches:** settings. **Conflicts:** tier reveals thread.

### 26. Cursor as a hand [x] (candle cursor, PR pending)
**Serves:** tactile, interactive.
**Pitch:** The cursor becomes a small candle or hand that lights nearby spines, swings lanterns (existing) and changes over hoverable books.
**Brief:** Goal: custom cursor and a soft pointer light, only on fine pointers. Files: new `src/ui/cursorLight.js`. Done when: off on touch, off in reduced motion, under 0.5 ms/frame.
**Touches:** WORLD hook. **Conflicts:** tactile thread (#82), 2.

## E. Home and onboarding

### 27. [x] Home as one cohesive scene (PR pending)
**Serves:** overhaul, integrated, spacing.
**Pitch:** The home screen is one lit reading room: title, tagline, the Daily book on top of Unlimited, stacks at the bottom, shelves behind, nothing floating.
**Brief:** Goal: composition pass defining a layout grid (title zone, plaque zone, stacks zone) with fixed rhythm tokens for every viewport height from 560 to 1000 px. Files: `home.css`, new `homeLayout.js`. Done when: snapshots at 5 heights, no overlap, stacks sit on the ledge.
**Touches:** HOME. **Conflicts:** spacing thread; sequence after it.

### 28. Daily line and resume
**Serves:** Daily is its own thing.
**Pitch:** The Daily book spine says what matters now: today's number and date, your streak, "played: Folio" or "unplayed", and a Resume tab if a run was interrupted.
**Brief:** Goal: contextual spine text and a stored run checkpoint (additive `S.resume`). Files: HOME, new `src/core/resume.js`. Done when: Daily cannot be replayed through resume, tested.
**Touches:** HOME, MAIN. **Conflicts:** Daily fairness thread, 27.

### 29. First-run welcome in the library's voice
**Serves:** mysterious, concise copy.
**Pitch:** A short, wordless-first intro: a hand writes the rules in a book, Descend lights up. Skippable and never repeated.
**Brief:** Goal: onboarding in 20 s or less, static in reduced motion, flag in `S.seen.welcome`. Files: new `src/ui/welcome.js`. Done when: skip by keyboard, once-only test.
**Touches:** HOME hook. **Conflicts:** 27.

### 30. Practice book
**Serves:** books as menu, low stakes.
**Pitch:** A third menu book, Practice: three easy words, no stakes, never touches rating, shelf or streak.
**Brief:** Files: new `src/core/practice.js`, menu data. Done when: test proves no write to `deepstack.v1`, scoring identical.
**Touches:** HOME, MAIN hook. **Conflicts:** hints thread.

### 31. Copy pass in one voice
**Serves:** concise, mysterious.
**Pitch:** Every label, button, tooltip, empty state and error reads as the library: short, odd, never corporate.
**Brief:** Goal: a `copy.js` of strings with a voice guide, replace inline strings where cheap. Files: new `src/ui/copy.js`, edits across UI. Done when: guide in `docs/`, no "Click here", empty states written, all strings under 40 chars unless prose.
**Touches:** many small edits. **Conflicts:** any thread touching text; run when quiet.

## F. Mechanics and progression

### 32. [x] Chain feedback you can feel (#127)
**Serves:** rarity, tactile.
**Pitch:** A combo is visible in the world: a brass chain climbs the ledge, each Folio+ adds a link, a break clunks and the chain falls.
**Brief:** Goal: surface the existing combo chain (cap x2) with art and sound, no rule changes. Files: new `src/ui/chain.js`. Done when: link count matches `applyCombo`, break animation, reduced motion.
**Touches:** ledge/WORLD hook. **Conflicts:** 21, particles thread.

### 33. Achievements as brass plaques
**Serves:** collecting, records.
**Pitch:** Plaques for milestones (first Folio, 5-chain, reach the Abyss, 30-day streak, complete all sets) displayed on a wall in Records.
**Brief:** Goal: pure rules in `achievements.js`, plaque art, toast on unlock, additive `S.ach`. Done when: each rule tested, retro-unlock without duplicate toasts.
**Touches:** new files, Records page. **Conflicts:** none.

### 34. Rare find
**Serves:** variety.
**Pitch:** Occasionally an exceptionally rare word appears, announced by a lantern of a new colour, with a small bonus.
**Brief:** Goal: seeded (Daily-fair) rare-slot logic. Files: new `src/core/rare.js`. Done when: determinism across dates, bonus capped.
**Touches:** CORE. **Conflicts:** Daily fairness, difficulty threads.

### 35. Topic decks (plumbing)
**Serves:** planned topics and levels.
**Pitch:** Word pools tagged by topic and a deck chooser in the Unlimited book, so topics become content, not code.
**Brief:** Goal: topic tags in the build script, a `deck` parameter on the picker, chooser UI. Done when: default deck unchanged, picker tested per deck.
**Touches:** CORE, `build-words.mjs`, HOME. **Conflicts:** difficulty/word pool thread.

### 36. Close but not quite: one rewrite
**Serves:** mechanics, risk and reward.
**Pitch:** An answer just under a tier boundary offers a single rewrite for a depth cost.
**Brief:** Goal: optional retry with cost, off in Daily unless the fairness thread allows it. Files: new `src/core/retry.js`. Done when: property tests, never negative depth.
**Touches:** CORE, MAIN hook. **Conflicts:** Daily fairness, hints threads.

## G. Performance

### 37. Frame-time telemetry (done, PR #104)
**Pitch:** `?perf` overlay shows frame time and dropped frames, and `scripts/perf.mjs` records a 10 s headless p95.
**Brief:** Files: new `src/ui/perf.js`, `scripts/perf.mjs`. Done when: zero cost when off, baseline in the PR.
**Touches:** new files. **Conflicts:** none.

### 38. Canvas draw budget (done, this PR)
**Pitch:** Cut per-frame cost: cached gradients, batched dust, DPR cap on huge screens.
**Brief:** Files: WORLD. Done when: p95 improved vs item 37, snapshots unchanged.
**Touches:** WORLD. **Conflicts:** floors, particles, 1-3 (run last).

### 39. Load path
**Status:** [x] done in this PR (fonts self-hosted, word list and judge model start after first paint in sequence; band split deliberately not done, see `docs/load-path.md`).
**Pitch:** First load feels instant: gzip notes, `words.json` split by difficulty band, model fetch resumes after first paint, self-host the three Google fonts.
**Brief:** Files: `vite.config.js`, loader, fonts. Done when: transfer measured before/after, fonts committed so no third-party request.
**Touches:** JUDGE loader, CORE words, fonts. **Conflicts:** judge and word pool threads.

### 40. Low-end mode
**Pitch:** Detect slow devices and lower particles, DPR and canvas fps automatically, with a manual setting.
**Brief:** Files: new `src/ui/quality.js`, settings. Done when: quality tiers tested via a mock, other items respect it.
**Touches:** settings, WORLD (read). **Conflicts:** particles, 38.

### 41. Memory soak
**Pitch:** 100 headless runs prove memory and listener counts stay flat.
**Brief:** Files: `scripts/soak.mjs`. Done when: heap and listener report, any leak fixed.
**Touches:** wherever leaks are. **Conflicts:** depends.

## H. Overhauls of foundations

### 42. Split `main.js`
**Pitch:** The 650-line dense file becomes `world.js`, `run.js`, `card.js`, `final.js`, `boot.js`, no behaviour change.
**Brief:** Pure refactor, announced first, run only when no other thread touches `main.js`. Done when: tests, smoke and snapshots pixel-identical.
**Touches:** MAIN entirely. **Conflicts:** everything tagged MAIN or WORLD; schedule alone.

### 43. Split `styles.css`
**Pitch:** Per-screen CSS files so threads stop colliding.
**Brief:** Pure move, zero visual diff. Done when: css-sanity and snapshots pass untouched.
**Touches:** CSS. **Conflicts:** all CSS items; schedule with 42.

### 44. Save v2 with migrations, export and import
**Pitch:** Versioned saves, a migration table, plus Export/Import/Reset (typed confirmation) in Settings.
**Brief:** Files: new `src/core/save.js`, `saveIO.js`. Done when: v1 fixtures load, round trip, unknown fields preserved, corrupt save quarantined, import never lowers streak.
**Touches:** MAIN `store`, settings. **Conflicts:** 42.

### 45. Judge v2 reference senses
**Pitch:** Several paraphrased senses per word embedded at build time and shipped as vectors.
**Brief:** Files: `scripts/`, `src/scorer/`. Done when: calibration beats 97/103, worker parity test passes.
**Touches:** JUDGE. **Conflicts:** judge thread; start after it.

### 46. Curated Daily slice
**Pitch:** 300 hand-reviewed words with clean definitions and examples for Daily, no "alternative form of" glosses.
**Brief:** Files: `data/curated.json`, build merge. Done when: schema tests, every word has an example or is flagged.
**Touches:** CORE data. **Conflicts:** word pool thread.

## I. Health and process

### 47. Mobile and a11y snapshots in CI
**Pitch:** 375x667 snapshots and an axe-core check fail CI on phone regressions.
**Brief:** Files: `scripts/snapshots.mjs`. Done when: three phone snapshots, axe has no serious violations (or listed exceptions).
**Touches:** scripts. **Conflicts:** a11y thread.

### 48. "Looks right" checklist in CI
**Pitch:** Cheap visual tests for nate's repeat complaints: no clipped spine text, no stretched glyphs, top shelves have planks, lore halos clear of the alcove.
**Brief:** Goal: DOM/canvas measurements (text scrollWidth vs clientWidth, glyph aspect, plank rows present, exclusion rects) as tests. Files: new `test/looks-right.test.js` plus a Playwright check in `scripts/`. Done when: each earlier complaint has a failing-then-passing test.
**Touches:** tests. **Conflicts:** none.

### 49. Lint for dense code
**Pitch:** A tiny line-length and statements-per-line check on new files only.
**Brief:** Files: `scripts/lint-lite.mjs`. Done when: legacy files exempted, CI step added in its own small PR.
**Touches:** scripts, CI. **Conflicts:** none.

### 50. PR template: "What did this reverse?"
**Pitch:** Stop silent reversals (#40 vs #21).
**Brief:** Files: `.github/pull_request_template.md`. Done when: asks for earlier PRs changed and the test pinning new behaviour.
**Touches:** template. **Conflicts:** none.

### 51. Release tags and a `stable` branch
**Pitch:** Tag known-good main; nate tests `stable` before hosting.
**Brief:** Files: `release.yml`. Done when: manual or weekly tag with notes from merged PR titles.
**Touches:** workflows. **Conflicts:** none.

### 52. PWA and deploy previews
**Pitch:** Installable, offline Daily after first load, a preview URL per PR so nate can test from his phone.
**Brief:** Files: manifest, service worker, deploy workflow. Done when: Lighthouse PWA check, cache version pinned to model version.
**Touches:** `index.html`, `vite.config.js`. **Conflicts:** 39.

### 53. Credits and changelog book page
**Pitch:** Credits list Wiktionary, model, fonts and a short "what's new" shown once per version.
**Brief:** Files: `topbar.js` credits, new `changelog.js`. Done when: once-per-version test, licences present.
**Touches:** `topbar.js`. **Conflicts:** none.
### 54. Pen-written page titles and counts
**Serves:** handwritten, pages that feel written.
**Pitch:** Book headings, "8 books · showing 1" and the tier counts are written in with the same pen stroke when a page opens, so no page appears printed.
**Brief:** Goal: reuse `--pen-stroke` and `penInk.js` to draw page titles and counters in on open. Files: new `src/ui/penWrite.js`. Done when: reduced motion shows them at rest, 14-letter titles fit at 375.
**Touches:** BOOK. **Conflicts:** 9, 12.

### 55. Written settings and credits panels
**Serves:** one shared book style, integrated.
**Pitch:** Settings and Credits stop being button panels: toggles become handwritten words that cross themselves out when off, sliders become pen ticks.
**Brief:** Goal: apply the pen-ink controls to the pop-up panels. Files: `settings.js`, `topbar.js`, new css. Done when: keyboard focus visible, no filled pill inside panels (css test).
**Touches:** HOME. **Conflicts:** 7, a11y thread.

### 60. More secrets in the stacks
**Serves:** immersion, things that live down there.
**Pitch:** "things that live down there": curios that react to depth, such as eyes in the gaps below the Hollow, a book that is warm only in the Abyss.
**Brief:** Goal: add 2 to 3 depth-gated curio kinds beside the shelf curios. Files: `src/ui/curios.js`. Done when: per-floor determinism test, same halo rules.
**Touches:** new files, WORLD hook. **Conflicts:** ambient life (3).

### 61. Collect the curios
**Serves:** persistent shelf, lore.
**Pitch:** Curios you have found are listed in a handwritten page of the Collection, so hunting feels like it counts.
**Brief:** Goal: record found curios additively in the save and show them in a book page. Files: new `src/ui/curioLog.js`. Done when: save tolerates missing field, page readable at 375 px.
**Touches:** BOOK, new files. **Conflicts:** none.

### 62. Calendar that fills in as you play
**Status:** [~] circles and today's underline animate (#115); the "rarest this month" margin line is still open.
**Serves:** Daily book, handwritten, rarity is the hero.
**Pitch:** Played days get a pen-drawn circle that finishes itself (animated stroke) in the tier ink, and the month page shows a small tally of rarest books that month.
**Brief:** Goal: animate the circles on open (reduced-motion: drawn instantly) and add a "rarest this month" margin line. Files: `dailyCalendar.js`, `dailyCalendar.css`. Done when: reduced-motion test, 375 px screenshot.
**Touches:** BOOK. **Conflicts:** 10.

### 63. Daily book: this week as a spread
**Serves:** Daily book, one entry per day.
**Pitch:** A weekly page of seven small tabs (Mon to Sun) with each day's words as ghost text and your best book circled, so the week reads like a diary.
**Brief:** Goal: replace the "This week" strip with a full leaf reachable from the calendar. Files: `dailyCalendar.js`, `dailyBook.js`. Done when: week boundary (UTC Monday) test, tap a tab opens that day.
**Touches:** BOOK. **Conflicts:** 10.

### 80. Smaller word list
**Pitch:** The word list is 691 KB gzipped and the biggest download after first paint; make it smaller without losing words.
**Brief:** Files: `scripts/build-words.mjs`, `src/core/wordPool.js`. Done when: gzipped transfer measured with `node scripts/loadpath.mjs dist`, same pool and same Daily picks (determinism test), shorter definitions only where the judge reference text is unchanged.
**Touches:** CORE words, build script. **Conflicts:** judge and word pool threads.

### 81. Offline Daily
**Pitch:** Cache the word list and judge model so the Daily works with no connection after the first visit.
**Brief:** Files: a service worker plus a precache list. Done when: airplane-mode Daily plays through, cache version pinned to the model revision, `loadpath.mjs` shows zero requests on the second load.
**Touches:** `index.html`, `vite.config.js`. **Conflicts:** 52.

### 70. Ink that reacts to the page
**Serves:** handwritten, everything is a book.
**Pitch:** The margin notes and doodles stop being generic: a note appears because of something true on the page ("one word short of the set", "your longest streak"), and a pressed pen mark circles the number you just beat.
**Brief:** Goal: data-keyed margin notes in `ink.js` (pure function of the leaf data, no new save fields) plus a hand-drawn circle around a record. Files: `src/ui/ink.js`, `ink.css`. Done when: notes are tested against fixture saves, text stays readable at 375 px.
**Touches:** new files, BOOK. **Conflicts:** 10, 12.

### 71. Ink on the run screen and result card
**Serves:** handwritten, integrated not bolted on.
**Pitch:** The pen underline and stroke-draw reach the notebook slip and result card, so the answer you typed is underlined as you submit and the verdict is signed off in ink.
**Brief:** Goal: reuse `ink.js` strokes on the run slip and results leaf. Files: `ink.js`, `runScreen.css`, `results.css`. Done when: reduced motion respected, no layout shift at 14 letters.
**Touches:** run screen, results. **Conflicts:** run screen and results threads.

### 82. Shelf: pulled book stays on the shelf
**Pitch:** The pulled book leans out of its stack and its detail card is a slip tucked into the shelf, not a centred popup.
**Brief:** Goal: anchor the shelf card to the pulled book. Files: `shelfBays.js`, `card.css`. Done when: slip never covers the book, 375 px verified, reduced motion static.
**Touches:** BOOK, card. **Conflicts:** 7, 16.

### 83. Backfill floor found for old books
**Pitch:** Books shelved before floors were logged sit in "Earlier finds"; derive their floor so the floor bays are complete (skip if the attic thread covers it).
**Brief:** Goal: derive `fl` additively from old Daily results. Files: new `src/core/shelfFloors.js`. Done when: tolerates missing data, tested.
**Touches:** core. **Conflicts:** attic (#126).

### 100. Wall-hung things get a visible mount
**Pitch:** Plaques, banners and lantern plates show their screws, brackets and a cast shadow on the wall, so nothing hangs from nothing.
**Brief:** Goal: a mount helper (bolt, bracket, shadow) used by the numeral plaque, floor banner, tracker plaques and lanterns. Files: new `src/ui/mounts.js`, one-line hooks. Done when: mounts visible at 375 and 1280, a geometry test that every hung object's anchor lies on a surface.
**Touches:** WORLD, tracker. **Conflicts:** 5 (alcove).

### 101. The held book rests on something
**Pitch:** The pulled book is presented on a reading stand or in a gloved hand of light instead of hovering mid-shelf.
**Brief:** Goal: replace the hover pose with a lectern or lit cradle that rises with the pull, shadow on the shelves behind. Files: `src/main.js` pulled-target block (small), new `src/ui/lectern.js`. Done when: pose looks supported at 375 and 1280, reduced motion shows it already raised.
**Touches:** MAIN (pull block), results. **Conflicts:** tier reveals thread.

### 102. Fallen books on the shelf floor
**Pitch:** Where a leaning book has no support it should have fallen: tumbled books and loose pages lie in front of gaps on deep floors.
**Brief:** Goal: scatter fallen books (flat, rotated, resting on the plank) in front of wide gaps from `settleBooks`. Files: `src/ui/physics.js`, row generation. Done when: no fallen book overlaps a standing one, seeded and stable per row, a test pinning it.
**Touches:** WORLD. **Conflicts:** 3, 4.

---

### 54. Almanac pages for Unlimited and Sets
**Serves:** everything is a book, sectioned.
**Pitch:** The almanac only charts Daily depth and the shelf; give Unlimited its own spread (runs, placement, best Lexicon) and a sets-progress page with the completed cases.
**Brief:** Goal: two more leaves in `statsPages.js` from `S.rating` and `S.sets`. Done when: empty states written, 375 px verified. **Touches:** BOOK. **Conflicts:** 10, 14.

### 55. Almanac tap-through
**Serves:** immersion through interaction.
**Pitch:** Tap a spine column, a day bar or a floor stratum in the almanac to open the shelf filtered to it, or the Daily book page for that day.
**Brief:** Goal: hooks from `statsPages.js` into shelf filters and the Daily book. Done when: keyboard reachable, reduced motion safe. **Touches:** BOOK. **Conflicts:** 10, 11, 13.

### 56. Almanac notes in the margin
**Serves:** pages that feel written.
**Pitch:** Margin notes that read the numbers back in a hand ("Deepest yet. The Vault is close.") with a pen-drawn arrow to the marker.
**Brief:** Goal: a small pure `almanacNotes(st)` picking one line per page. Done when: a test per note rule. **Touches:** new file. **Conflicts:** 9.

### 66. Motion in JS: one timer for everything
**Serves:** smooth, uniform.
**Pitch:** Replace the remaining hard-coded `setTimeout(..., 400/700/1400)` waits with `after('page')` etc. so JS and CSS can never drift apart.
**Brief:** Goal: migrate JS timing in `home.js`, `descend.js`, `reveal.js`, `transitions.js`, `main.js` to `motion.js` helpers. Done when: a test greps for raw ms waits. **Touches:** hooks in `main.js`. **Conflicts:** 42.

### 67. Transform-only audit
**Serves:** performant.
**Pitch:** Find transitions on width, top, left, box-shadow and filter and move them to transform/opacity, measured with `?perf`.
**Brief:** Goal: list and fix layout-triggering animations (`.meter`, `#tracker .you`, `.track i`). Done when: before/after p95 frame times in the PR. **Touches:** css. **Conflicts:** 43.

### 68. Per-element stagger preset
**Serves:** physical motion.
**Pitch:** A shared stagger step so lists of books, rows and chips rise in one rhythm instead of hand-set delays.
**Brief:** Goal: `stagger(i)` in `motion.js` plus `--m-stagger`. Files: `motion.js`, css delays. Done when: delay literals removed from `home.css`. **Touches:** css. **Conflicts:** 66.

### 69. Per-word results as a shelf you can open
**Serves:** "it shouldnt be like that" (results must not scroll); "everything is a book".
**Pitch:** The results word list becomes the spines strip itself: hover a spine for tier and score, click to open its card, so the list can shrink further on phones.
**Brief:** Goal: merge the spine strip and the word list on `src/ui/results.js`. Done when: phone keeps one view with spines visible, 14-letter word unclipped.
**Touches:** results only. **Conflicts:** mini-book result card thread.

### 70. Phone results keeps the share note
**Serves:** "share note cut off", "words must be fully readable".
**Pitch:** On phones the share note and stat tiles are hidden to fit one view. Bring the note back as a pull-up slip from the Copy button.
**Brief:** Goal: a tap on Copy result lifts the torn note over the list, then drops it. Files: `src/ui/results.js`, `results.css`. Done when: no scroll at 375x667 and the note shows complete.
**Touches:** results only. **Conflicts:** none.

### 94. Home shelves reach the ledge
**Pitch:** The stacks stand on the ledge, and the walls either side of the room carry the same shelves so the whole home reads as one lit room.
**Brief:** Goal: expose the niche floor y as a CSS var from `setNicheVars` and let the stacks drop onto it exactly at every height; add a soft lamp pool under the plaque. Files: `homeLayout.js`, `home.css`. Done when: `scripts/home-heights.mjs` also checks against the canvas ledge.
**Touches:** HOME, MAIN hook. **Conflicts:** 7.

### 95. Home that fits any phone
**Pitch:** Phones in landscape and small heights get a dedicated tight room instead of scrolling.
**Brief:** Goal: tiers for height under 340 px and landscape, with the stacks beside the plaque. Files: `homeLayout.js`, `home.css`. Done when: no scroll at 320x568 and 667x375.
**Touches:** HOME. **Conflicts:** none.


## Suggested batches
- **Overhaul wave 1 (his favourite kind):** 7, 8, 11, 12, 16 (book objects, opening, shelf bays, almanac, reveal card). Run 7 first; 8 and 11 after.
- **Make the library darker:** 1, 2, 3, 6 (sections, light, life, physical audit). Sequence after floors #81.
- **Handwritten pass:** 9, 10, 13, 20, 31.
- **Feel:** 22 first, then 23, 24, 26.
- **Parallel-safe quick wins:** 4, 9, 15, 24, 33, 37, 48, 50.
- **Foundations (alone):** 42 + 43 together, then 44.

### 62. Perf budget in CI
**Pitch:** CI runs `scripts/perf.mjs` and warns when work-per-frame p95 regresses past a stored baseline.
**Brief:** Files: new `scripts/perfCheck.mjs`, CI step. Done when: tolerant threshold (software rendering is noisy), baseline file committed. **Touches:** CI. **Conflicts:** none.

### 63. Page-turn between result cards
**Serves:** everything is a book, motion.
**Pitch:** "Next word" turns the page of the same little book instead of closing and reopening it, so a run feels like writing one volume.
**Brief:** Goal: reuse the corner-flip from book pages on the card. Files: new `src/ui/cardFlip.js`, `bookCard.css`. Done when: reduced motion cuts, Enter still advances, 14-letter word fits.
**Touches:** card, MAIN hook. **Conflicts:** 16, 17.

### 64. Wax seal and foil for rare covers
**Serves:** rarity is the hero.
**Pitch:** Folio and up get a pressed wax seal on the ribbon, Codex gilt corners that catch light, Apocrypha a glowing edge.
**Brief:** Goal: per-tier dressing on the new book card. Files: `bookCard.css`. Done when: seven-tier strip screenshot, tokens only.
**Touches:** card. **Conflicts:** 17.

### 65. Ribbon bookmark everywhere
**Serves:** integrated, not bolted on.
**Pitch:** Primary buttons on book pages (Descend, Close, Continue) become the same swallow-tailed ribbon instead of boxes.
**Brief:** Goal: shared `.ribbon` class. Files: new `src/ui/ribbon.css`. Done when: focus is visible, buttons tests pass.
**Touches:** buttons. **Conflicts:** 7.

### 72. Caught and missed on old books
**Serves:** honest answers.
**Pitch:** Books answered before "What it caught" existed still teach: tap one on the shelf and it shows what it caught.
**Brief:** Goal: recompute `fb` from the saved answer with the lexical judge when a book has none. Files: `src/core/feedback.js`, `openCard` hook. Done when: fixture test on a pre-feedback save.
**Touches:** card. **Conflicts:** judge thread.

### 73. Judge relations in the caught list
**Serves:** honest answers.
**Pitch:** When Judge v2 lands, show near-miss ideas ("you said 'leave', it wanted 'abandon completely'") instead of only caught and missing.
**Brief:** Goal: extend `feedbackData` with relation hits from Judge v2. Files: `src/core/feedback.js`. Done when: tests per relation kind, still no spelling.
**Touches:** card, JUDGE. **Conflicts:** judge thread.
### 66. Sound per tier on the seal
**Serves:** rarity is the hero, tactile.
**Pitch:** The wax-seal press changes with the tier it earns: a dull press for Pamphlet, a deeper, longer press with a faint ring for Codex and up.
**Brief:** Goal: pass the judged tier to the seal sound after the judge returns. Files: `src/sound/scribe.js`, one line in `submit`. Done when: tier 0-6 variants tested with the fake context.
**Touches:** FEEL hook. **Conflicts:** 24.

### 67. Quill follows the hand
**Serves:** immersive, physical.
**Pitch:** The scratch speeds up when typing fast, softens on pauses, and gives a small flourish when the answer is sent.
**Brief:** Goal: scale quill level and length by keystroke rate. Files: `src/sound/scribe.js`. Done when: rate-limit test still passes, no more nodes than the voice cap.
**Touches:** FEEL hook. **Conflicts:** 23 follow-ups.
### 92. Candle light that spines answer
**Serves:** tactile, immersive, physical.
**Pitch:** The candle cursor's pool of light is a real light source: spines and brass inside it brighten and show a little more grain, and shelf books under the flame tilt a hair toward it.
**Brief:** Goal: feed the cursor position into the World draw as a small radial lift (cached, one gradient per frame) instead of a screen-blend overlay. Files: new `src/ui/candleLift.js`, one WORLD hook. Done when: under 0.5 ms/frame, off with the candle.
**Touches:** WORLD. **Conflicts:** 2.

### 93. Candle that goes with the game
**Serves:** integrated, not bolted on.
**Pitch:** The cursor flame flares on a good score, gutters when the 45 s candle is nearly out and turns the tier colour over a revealed book.
**Brief:** Goal: tiny event hooks that set a data attribute on `#candleCursor`. Files: `cursorLight.css`, `cursorLight.js`. Done when: three states screenshotted, tokens only.
**Touches:** new files. **Conflicts:** none.


### 90. Things that live in the nook
**Serves:** immersive, integrated. **Pitch:** "things that live down there": a moth, a mouse or a spider that wander the desk, and a quill that scratches while you type, each floor with its own resident.
**Brief:** Goal: tiny animated creatures and a writing quill on the nook desk (`alcoveArt.js` hook), off with reduced motion. Done when: costs measured, no overlap with controls at 375 px.
**Touches:** new file + `alcoveArt.js`. **Conflicts:** none.

### 91. Hidden curios on the shelves (overlaps 61, merge the two)
**Serves:** variety, discovery. **Pitch:** "hidden curios on the shelves": rare tiny objects (a key, a skull, a folded map) tucked between books that glow on hover and reveal a line of lore.
**Brief:** Goal: seeded rare curios per floor on shelf rows, hover tooltip, a collection page. Files: new `src/ui/curios.js`. Done when: never under an alcove, tests for seeding.
**Touches:** WORLD hook. **Conflicts:** 6, lore books.
### L1. Chain climbs the wall
**Serves:** rarity, integrated.
**Pitch:** A long chain should be seen from across the room: past 3 links the brass chain lifts off the ledge and loops up to the alcove lantern, and the lantern burns warmer at the x2 cap.
**Brief:** Goal: extend `chain.js` with a taller chain art for chains of 4+, same `runStory` data, no rule changes. Files: `chain.js`, `lanterns.js` hook. Done when: reduced motion static, books still fit at 375 px.
**Touches:** `chain.js`, lanterns. **Conflicts:** particles thread.

### L2. Close-call ribbon on the shelf and the card
**Serves:** everything is a book, rarity.
**Pitch:** A book that missed a rarity by a few points keeps its crimson ribbon tab on the shelf and on its result card ("3 short of Codex"), so near misses are collectable stories.
**Brief:** Goal: reuse `closeGap` from `chain.js` on the shelf spines and the book card. Files: shelf draw hook, `bookCard.css`. Done when: tokens only, 14-letter spine still readable at 375 px.
**Touches:** shelf, card. **Conflicts:** 7, 16.


### 78. Ink the typed answer on the result card
**Serves:** handwritten, integrated.
**Pitch:** The player's own answer reappears on the result card and book page in the same wet-to-dry ink, as if they had just written it.
**Brief:** Goal: reuse `inkRuns` from `src/ui/inkInput.js` to show the answer in handwriting. Files: new `src/ui/inkAnswer.js`, card hook. Done when: long answer wraps at 375 px, reduced motion static.
**Touches:** card. **Conflicts:** 17.

### 79. Ink colour that follows the floor
**Serves:** dark and mysterious.
**Pitch:** Deeper slips get darker, older ink: iron-gall black in the Archive, sepia and then faded violet below the Hollow.
**Brief:** Goal: one ink token per floor on the answer slip. Files: `inkInput.css`, `colors.js`. Done when: tokens only, contrast still readable.
**Touches:** colors. **Conflicts:** 81.



### 74. Ink the circles by hand on the day you play
**Serves:** Daily book, handwritten, immersive.
**Pitch:** After you finish a Daily and return to the calendar, today's circle is drawn live in your book's tier ink, so finishing feels like the pen signing your day.
**Brief:** Goal: on first calendar open after a Daily result, play the ring draw only for the new day (others static). Files: `dailyCalendar.js`, `dailyBook.js`. Done when: no re-animation on later opens, reduced-motion static.
**Touches:** BOOK. **Conflicts:** 62, 63.

### 75. Pen sound for ink strokes
**Serves:** integrated, motion should be physical.
**Pitch:** A faint scratch of nib on paper while rings, underlines and tab strokes draw, quiet and optional.
**Brief:** Goal: tiny shared `penScratch()` hooked to the draw-in animations, off when sound is off. Files: new `src/sound/pen.js`. Done when: respects settings, no audio before first gesture.
**Touches:** new files. **Conflicts:** none.

### 94. Creatures react to the lamp and to you
**Serves:** immersion, physical realism. **Pitch:** The silverfish scatters when a lantern swings past, the rat freezes if you scroll fast, eyes in the Hollow close when the cursor nears.
**Brief:** Goal: pointer and camera speed feed `updateAmbient` as a `scare` input, one reaction per creature. Files: `src/ui/ambient.js` only. Done when: a test pins a reaction per kind, still off in reduced motion.
**Touches:** WORLD. **Conflicts:** 2, 4.

### 95. Sounds of the things down here
**Serves:** immersion. **Pitch:** A far scuttle, a drip with the right reverb per floor, a low bubble, matched to what is on screen.
**Brief:** Goal: each ambient item can emit a quiet cue through `Sfx`. Files: new `src/ui/ambientSfx.js`. Done when: volume setting respected, rate-capped, silent in reduced motion.
**Touches:** FEEL hook. **Conflicts:** 23.
