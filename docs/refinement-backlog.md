# Deepstack refinement backlog

How to use: pick numbers, start one thread per number, paste the item's **Brief** plus the **Standard preamble** below. Companion files: [feature-inventory.md](feature-inventory.md) (what exists) and [nate-preferences.md](nate-preferences.md) (what nate asks for). Snapshot 2026-11-04, after #80. Numbers were reassigned on 2026-11-04 when this list was reworked; ticks in later PRs keep them stable.

## What nate needs to do
- Pick from the V1 to V14 audit menu (end of this file, 2026-11-06). V8 (streak ribbon) softens the streak, so it needs your yes or no before it ships.
- Pull `main` and look at the fire: it now burns low on a 0 streak and roars after a few weeks, and its sparks take the colour of your last book's tier (aqua after an Apocrypha, red after a Grimoire). At 375x667 and 800x900 the fireplace now shows, with the Daily and Unlimited spines still on screen. Say if the low 0-streak fire feels too dim.
- Open the Unlimited book at your window size and on your phone: a big Descend button (Find my rank before you are placed) now sits under your rank, with "Place me again" quietly beneath. Say if it reads clearly. (Unlimited pages, UB1)
- Look at the top centre of home: the "↑ The attic · 36" pill is now a trapdoor in the ceiling beam with a swaying pull cord and a brass tag holding the count. Hover or Tab to it, press Enter, and say if it reads as an entrance and not a button (thread: attic entrance).


- Open and close each menu book (Shelf, Sets, Stats, Daily, Unlimited, Practice), and click a second book while the first is still flying home: the pages should already be written when the cover swings, nothing should pop in afterwards, the room should fade back as the book flies home, and the second book should open as soon as the first lands. Say if it still stutters on your machine and which book. (book switching thread)
- Pick from the new G1 to G10 goal-level menu (section G near the end of this file). (polish menu thread)
- Pull `main` and look at the home screen: a stone fireplace now burns between the book stacks on a brick back wall, and the fire lights the room (lamps down). Move the cursor near it (flames lean away) and click it to stoke. Check your window size and phone, and say if the room is too dark. It was hidden once today's Daily was played and on phones under ~800 tall; both fixed in the fireplace-visibility PR, so look again on your phone, before and after playing the Daily. (fireside home, FH1)
- Open the Unlimited book: the left page is Unlimited, the right page is Riddle, each with its own Start link. Open the Daily book: its first page now has Daily and Daily Riddle with Descend / Open today's riddle. Say if the sections read clearly or if the Riddle half needs more weight. (merged modes)
- Play a run and answer with general ideas, close concepts and words that relate to the definition ("money" for frugal, "related to time" for ephemeral): they should now earn a small score (Pamphlet to Paperback), never as much as a precise answer. Open any book: other meanings and the meanings of close synonyms appear under "Also means". Tell me any wrong answer that scores well or any book that looks too tall. (judge leniency, backlog J1)
- Pick from the Q1 to Q16 audit menu (end of this file). Q11 is decided (a 0 keeps its book and 13 ft).
- Descend past a floor door (Archive 101 ft, Catacombs 252 ft and deeper) and say if the half-speed hold at the door, the one-time swing of the sign and the quiet floor sound feel right or too subtle; also check Settings reduced motion removes the hold and swing. (door walk-through thread)
- Play a run and answer with plain synonyms of rare words ("curt" for laconic, "blunt" or "forthright" for candid, "conscientious" for diligent): they should now land in Paperback or better. Tell me any everyday word that still scores 0 or any wrong word that scores well. (judge thesaurus, backlog 90)
- Open `?perf` on your own machine at home, mid-run and during a descent and tell me the p95 and whether it feels smoother or the same: the headless box can only see JS cost, and your GPU is the real test for the glow-cache change (item 38).
- Scroll up into the attic and tap an earlier find that has no floor: a slip asks which floor it was found on, the pen underlines your pick and the book leaves the attic for that floor's bay on the Shelf. Check the slip reads at your screen size. (dust-off thread, PR #156)
- Pull `main` and look at the home screen at your window size: the card-catalogue cabinet on the left and the Borrower's ledger on the right should mirror each other. Pull the top drawer (click, or Tab and Enter), turn the card, close with Esc or by clicking the dark; ring the bell and stamp the ledger. Say if the card gliding over Descend feels right or should sit elsewhere. (home drawer and record overhaul)
- Scroll up into the attic, then keep scrolling up (or ArrowUp / swipe down): you should climb through separate sections (recent guesses, then each month) with no doorway or parallax. (superseded wording follows) you should move back through a doorway into further rooms with parallax, and the books should look as detailed as on the Shelf. Check it at your screen size, and say if the fade between rooms feels too long. (attic layers thread)
- Pull `main` and look at the home screen at your window size: the card-catalogue cabinet on the left and the Librarian’s Card on the right should mirror each other. Pull the top drawer (click, or Tab and Enter), turn the card, close with Esc or by clicking the dark; ring the bell and stamp the ledger. Say if the card gliding over Descend feels right or should sit elsewhere. (home drawer and record overhaul)
- Scroll up into the attic and back a few times (also Escape, swipe, with reduced motion): a ladder now slides in from the left and its rungs pass you as you rise, and the room brightens as the skylight comes overhead. Say if it is too long or too dark at the start. (attic climb thread)
- Play a few books at every tier and say if the ceremony feels right: Codex gets a faint flash, Grimoire a rune and sting, Apocrypha waits for its implosion, then flash and cover swing. Also try Settings > Graphics low (no rune, fewer rays). (reveal recipes)
- Play down to 252 ft (Catacombs), 454 ft (Sunken Vault), 706 ft (Hollow) and 1008 ft (Abyss) and say which door still feels like "just a tint": each floor's first row now has a sign, a doorway scene and its own wall (item 1).
- Scroll up into the attic and look at the piles at your screen size: they should now vary (trunk, crate, slumped, heap) with no dark band under each book. Say what is still too uniform. (attic piles)

Status key: `[ ]` open, `[~]` in progress, `[x]` done (add the PR number).

**Keeping this alive (every thread):** when your PR merges, (1) tick your item here and update your row in the inventory, (2) append any new taste nate expressed in your thread to `nate-preferences.md` (one dated line under the matching pattern), (3) add 2 to 3 fresh items to the end of this file that follow from what he asked, in his wording and in the same format. Keep edits to a few lines so threads do not conflict.

## What nate needs to do
- Home screen: scroll up (or pull the cord on the ceiling hatch, top centre) to climb into the attic room and see recent guesses in piles. Check the look at your screen size and say what is missing (lantern, trunks, more clutter?). (attic thread)
- Pull `main` and look at the held book (Descend, any run) and the alcove numeral plaque: does the stand and the bolts read right at your screen size? (PR 137, backlog 100/101)

- Pull `main` and play an Unlimited run, answering well enough for a Folio or better: depth should now count up (it was NaN with an empty world). (hotfix, Unlimited descent)

## Standard preamble (add to every brief)
- Serves nate's patterns: overhaul not tweak, everything is a book/shelf/page, handwritten and sectioned, words fully readable, dark and mysterious, rarity is the hero, integrated not bolted on, physical and smooth motion.
- New code in new files under `src/`, one-line hooks in `main.js`/`styles.css`. Colors from `src/theme/colors.js` tokens only (hex ratchet tests).
- Verify at 375x667 and 1280x800, with a 14-letter word, with reduced motion on. Attach before/after screenshots of the exact screen to the PR. Repeat complaints from nate usually mean the first fix was not checked on the real screen.
- Respect existing decisions (see inventory); if you change something an earlier PR chose on purpose, say so in the PR body and add a test pinning the new behaviour.
- If the look is new, ask nate at most 3-5 styling questions with a recommended default, then start on the default.

## In progress (do not start)
- [x] S3 + S4. Sigil watermark behind the open card's definition; set crests and wax seal on the Sets book (`stampPage`, `setCrest`)
- [x] S1 + S2. Big sigils on result-card covers, set books share a ring (`src/ui/coverSigil.js`, PR #174)
- [x] F / 102. Fallen books in front of shelf gaps (toppled, stacked, open face-down; `src/ui/fallenBooks.js`, PR #140)
- [x] Q7. Empty pages for a new player: Almanac, Sets and Riddle books get a faint pen sketch plus one written line (`src/ui/emptyPages.js`); Shelf left to Q4 (#181); margin notes no longer repeat on a spread (PR #254)
- [x] C. Attic for earlier Shelf finds (backfill floors from Daily history, scroll-up attic)
- [x] Recent guesses move to the attic (#145), then the attic becomes a real scroll-up room above the shelves in the world canvas: beams, cobwebs, window light, book piles (PR pending)
- [x] Smooth book switching: pages painted before the first frame, cover dissolves instead of popping, room returns during the fly-home, clicks mid-close queue (`src/ui/home.js`, `bookOpenFx.css`, `test/book-switch.test.js`)
- [~] Spacing and type pass on every screen
- [~] Run screen overhaul (alcove, wall lettering, candle timer, input)
- [x] Text size applies to all text and keeps layouts intact (`--ts` on every font size, `src/ui/textScale.css`, PR #206)
- [~] Floors: distinct look per floor (#81)
- [~] Tactile hover/press/focus everywhere (#82)
- [x] Rare tier reveals: particle overhaul (pooled sprite engine, prewarmed, per-tier recipes; this PR)
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

### 1. [x] Floor sections as chapters (this PR)
**Serves:** dark/mysterious, sections for each floor, integrated.
**Pitch:** Each of the six floors reads as a chapter: a carved door or archway you pass through, a name plate, and its own wall material (paper stacks, bone, flooded stone, hollow wood, black glass), not just a tint.
**Brief:** Goal: threshold art drawn at each floor boundary (arch, hanging sign, a few distinct props per floor such as ledgers, ossuary niches, water drips, roots, a single candle in the Abyss). Files: new `src/ui/thresholds.js`, data fields added to `floors.js`, hook in `World`. Done when: each floor is identifiable in a screenshot with the HUD hidden, a test lists a threshold def for every floor, performance within 1 ms/frame of baseline (item 33).
**Touches:** WORLD, CORE floors. **Conflicts:** floors thread (#81), 2, 3.

### 2. [x] Light as the mystery (PR #141)
**Serves:** dark/mysterious, performant.
**Pitch:** The deeper you go the less you see: lantern pools of light with real falloff, the dark between them hiding shelf detail, flickers that shift with the floor.
**Brief:** Goal: a lighting pass where lit radius shrinks with depth and unlit shelves fade to silhouette; lantern/alcove light cast on nearby books. Files: new `src/ui/lighting.js`; hook in `World`. Done when: Abyss is legible only near lights but the word and alcove stay readable (contrast test on the alcove), cached offscreen light map, reduced motion removes flicker.
**Touches:** WORLD. **Conflicts:** 1, 3, 33, floors thread.

### LM1. [x] (this PR) Candles and braziers cast light on the shelves
**Serves:** dark and mysterious, physical.
**Pitch:** Wall mounts, candle stubs on ledges and the odd brazier become real light sources, so the Abyss has a few warm islands to head for and the Hollow has cold ones.
**Brief:** Goal: any new lit prop calls `addLight(x, y, r, k)` from `src/ui/lighting.js` and gets a pool in the dark for free. Files: the prop's own file. Done when: it stays lit at Abyss depth, 375 and 1280 screenshots.
**Touches:** WORLD. **Conflicts:** E (wall mounts), 3.

### LM2. [x] (this PR) The dark has something in it
**Serves:** immersion, rarity.
**Pitch:** Out past the lantern pools a pair of eyes or a moving shape shows only while the cursor light is nowhere near, and flees when it arrives.
**Brief:** Goal: one rare silhouette per deep floor, driven by `pointerLightState` in `cursorLight.js`. Done when: never over the alcove or HUD, off in reduced motion and saver mode.
**Touches:** WORLD. **Conflicts:** 3.


### LM3. Embers that warm what they light
**Serves:** physical, dark and mysterious.
**Pitch:** Braziers throw a few drifting sparks, and books in a brazier's pool show their real colours instead of grey silhouette.
**Brief:** Goal: tint the pool by the light's colour and add 6 to 10 sparks per brazier. Files: `litProps.js`, `lighting.js`. Done when: no extra cost on Low. **Touches:** WORLD. **Conflicts:** LM1.

### LM4. Something that follows at a distance
**Serves:** immersion, rarity.
**Pitch:** The eyes sometimes drift a shelf closer between sightings, and a very rare second pair opens beside the first.
**Brief:** Goal: persist a small tension counter per run so sightings escalate. Files: `eyes.js`. Done when: still rare, never in reduced motion. **Touches:** WORLD. **Conflicts:** none.

### 3. [x] Things that live down here (this PR)
**Serves:** immersion, physical realism.
**Pitch:** Small ambient life per floor: moths round the lantern, a rat on the Catacombs shelf, a book that slides itself shut, drips, bubbles in the Vault, drifting ash in the Hollow.
**Brief:** Goal: 2 or 3 ambient creatures/events per floor, each rare and quiet, never over text or panels (respect the particles rules). Files: new `src/ui/ambient.js`. Done when: spawn rates capped, none covers the alcove or HUD (test via exclusion rects), off in reduced motion and low quality mode (35).
**Touches:** WORLD. **Conflicts:** Particles thread (#83), 2.

### 4. Hidden things to find [x] shipped as curios; made clickable and collectible (PR pending)
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

### 8. [x] Book opening v3 (cover, endpapers, ribbon) (PR #103)
**Serves:** overhaul, motion.
**Pitch:** Opening a menu book shows the cover, boards swing, endpapers and a bookmark ribbon appear, then the pages settle, all in under 600 ms.
**Brief:** Goal: refine the open and close choreography (cover lift with perspective, page block thickness, ribbon drop, closing thud with sound). Files: `bookMenus.js`, new `bookOpenFx.js`. Done when: open under 600 ms, close on outside click swings the cover shut, timing test via the transitions helper, reduced motion uses a fade.
**Touches:** HOME. **Conflicts:** transitions thread, 9.

### 103. Book open/close sounds (paper, leather, thud)
**Serves:** physical, immersion.
**Pitch:** Opening a book rustles paper and creaks leather; closing lands a heavy leather thud, deeper for thicker books.
**Brief:** Goal: replace the borrowed `whoosh`/`flip`/`thud` in `bookSound` with dedicated Sfx voices, pitched by page count. Files: `feel.js` (additive), `bookOpenFx.js`. Done when: respects volume and mute.
**Touches:** FEEL. **Conflicts:** audio threads.

### 104. Every panel opens as a book [x] (this PR)
**Serves:** overhaul, integrated.
**Pitch:** Card, Settings and Credits panels also grow out of a book on the shelf instead of fading in.
**Brief:** Goal: reuse `openBook`/`dressBook` for the remaining panels. Files: `bookOpenFx.js`, panel openers. Done when: no panel fades in bare, close swings shut, reduced motion fades.
**Touches:** HOME, MAIN. **Conflicts:** 7, 9.

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

### 19. [x] Candle timer (PR pending)
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

### 22a. [x] Run screen writes in smoothly (this PR)
Coming back from looking up the descent no longer snaps: the candle, pips, word, part of speech, clock, answer slip and hint row now rise in staggered on the motion language, for new words and for "Back to N ft". Reduced motion shows it at once, low graphics fades the stage once. `src/ui/runWriteIn.js`.

### 22b. Candle and alcove light up with the write-in
**Pitch:** as the word writes in, the candle flame should catch and the alcove glow rise with it, so the room wakes up too.
**Brief:** Goal: ease the candle flame and alcove lamp in alongside `writeInRun`. Files: `src/ui/runWriteIn.js`, `src/ui/candle.css`. Done when: no light pops on at full strength.
**Touches:** UI. **Conflicts:** `src/ui/runWriteIn.js`.

### 22c. The same write-in for the result card and riddle
**Pitch:** the riddle screen and result card should arrive with the same staggered write-in.
**Brief:** Goal: reuse `writeInRun` (or a sibling) for `src/app/riddle.js` and the card. Done when: no screen pops in whole.
**Touches:** UI. **Conflicts:** `src/app/riddle.js`.

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

### 24. Per-floor ambience [x] (this PR)
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

### 29. [x] Welcome screen as a reading room (reinterpreted by nate: not a narrated intro; #139)
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

### 38. [x] Canvas draw budget (PR pending)
**Status:** the three full-screen radial glows (lamp vignette, flame glow, tier glow) are now cached sprites (`src/ui/glowSprite.js`). Dust batching, the DPR cap and the low-light map already existed. Headless software rendering spends ~84% in raster ("program"), not JS, so p95 does not move there; see the PR for numbers. Real-GPU confirmation is R5 and new item P1.
**Pitch:** Cut per-frame cost: cached gradients, batched dust, DPR cap on huge screens.
**Brief:** Files: WORLD. Done when: p95 improved vs item 37, snapshots unchanged.
**Touches:** WORLD. **Conflicts:** floors, particles, 1-3 (run last).

### 39. Load path
**Status:** [x] done in this PR (fonts self-hosted, word list and judge model start after first paint in sequence; band split deliberately not done, see `docs/load-path.md`).
**Pitch:** First load feels instant: gzip notes, `words.json` split by difficulty band, model fetch resumes after first paint, self-host the three Google fonts.
**Brief:** Files: `vite.config.js`, loader, fonts. Done when: transfer measured before/after, fonts committed so no third-party request.
**Touches:** JUDGE loader, CORE words, fonts. **Conflicts:** judge and word pool threads.

### 40. [x] Low-end mode (#138)
**Pitch:** Detect slow devices and lower particles, DPR and canvas fps automatically, with a manual setting.
**Brief:** Files: new `src/ui/quality.js`, settings. Done when: quality tiers tested via a mock, other items respect it.
**Touches:** settings, WORLD (read). **Conflicts:** particles, 38.
**Done:** `src/ui/quality.js` (`Quality.params()` / `.scale(n)` / `.subscribe()`, tiers high/medium/low, auto from device memory, cores, data saver, then steps down if the first ~90 frames median over 28 ms). Settings panel has a Graphics row (Auto/High/Medium/Low), stored in `deepstack.quality.v1`. Wired: world DPR, 30 fps cap and dust count on low, FX particle count/cap/DPR, ambient creatures off on low. New effects (floors, lighting, fallen books, curios, ambience) should read `Quality.params()` (`glow`, `ambient`, `particles`, `dust`) instead of adding their own checks.

### QA. Wire new effects into Quality
**Pitch:** Make sure every effect landed after low-end mode obeys the Graphics setting.
**Brief:** Goal: audit lighting, fallen books, curios, ambience and floor effects for `Quality.params()` use (glow off on low, counts scaled). Files: those effects, `test/quality.test.js`. Done when: a test fails if a new rAF effect ignores Quality.
**Touches:** each effect file. **Conflicts:** run after 1, 2, F, 4, 24 land.

### QB. Graphics preview in settings
**Pitch:** Switching Graphics should show what changes without leaving the panel.
**Brief:** Goal: live FPS readout (from `?perf` stats) beside the Graphics row. Files: `src/ui/topbar.js`, `src/ui/perfStats.js`. Done when: readout updates at 2 Hz only while the panel is open.
**Touches:** topbar. **Conflicts:** none.

### 41. Memory soak
**Pitch:** 100 headless runs prove memory and listener counts stay flat.
**Brief:** Files: `scripts/soak.mjs`. Done when: heap and listener report, any leak fixed.
**Touches:** wherever leaks are. **Conflicts:** depends.

## H. Overhauls of foundations

### 42. [x] Split `main.js` (PR split-main)
**Pitch:** The 650-line dense file becomes `world.js`, `run.js`, `card.js`, `final.js`, `boot.js`, no behaviour change.
**Brief:** Pure refactor, announced first, run only when no other thread touches `main.js`. Done when: tests, smoke and snapshots pixel-identical.
**Touches:** MAIN entirely. **Conflicts:** everything tagged MAIN or WORLD; schedule alone.

### 43. [x] Split `styles.css` (PR split-main)
**Pitch:** Per-screen CSS files so threads stop colliding.
**Brief:** Pure move, zero visual diff. Done when: css-sanity and snapshots pass untouched.
**Touches:** CSS. **Conflicts:** all CSS items; schedule with 42.

### 44. Save v2 with migrations, export and import
**Pitch:** Versioned saves, a migration table, plus Export/Import/Reset (typed confirmation) in Settings.
**Brief:** Files: new `src/core/save.js`, `saveIO.js`. Done when: v1 fixtures load, round trip, unknown fields preserved, corrupt save quarantined, import never lowers streak.
**Touches:** MAIN `store`, settings. **Conflicts:** 42.

### 45. [x] Judge v2: Wiktionary relations (this PR)
_Shipped as word relations (synonyms, near synonyms, related, antonyms, definition links in `public/data/relations.json`) instead of paraphrase vectors; see PLAN.md. Follow-ups: 90, 91, 92._

### 90. [x] Judge knows common synonyms of rare words (PR pending)
**Pitch:** Bare synonyms still miss when Wiktionary has no list ("curt" for laconic, "friction" for discord). Add a small frequency-filtered thesaurus of everyday words and score answers against it.
**Brief:** Files: `scripts/build-relations.mjs`, `public/data/relations.json`. Done when: `npm run judge:eval` good/synonym in band beats 79% on `relation-answers.json` without wrong answers rising.
**Touches:** JUDGE. **Conflicts:** none.

### J1. [x] Judge accepts other meanings and broad ideas, books show them (PR #214)
**Pitch:** A word's other senses and its synonyms' senses count as targets; general ideas and words related to the definition earn a low score; the book lists the other meanings.
**Brief:** Files: `scripts/build-senses.mjs`, `public/data/senses.json`, `src/scorer/senses.js`, `src/ui/alsoMeans.{js,css}`. Done: `npm run judge:eval` good 79% to 85%, AUC 0.899 to 0.916.
**Touches:** JUDGE, card hook. **Conflicts:** none.

### J2. Judge explains broad matches
**Pitch:** When an answer scored on a general idea or another meaning, the card says so in one handwritten line ("that is another meaning of frugal").
**Brief:** Files: new `src/ui/judgeNote.js`; `judgeAnswer` returns `rel` hits and which reference won. Done when: line shows for lenient hits only, never clips at 375px.
**Touches:** JUDGE return shape, card. **Conflicts:** 91, 93.

### J3. Tune leniency from real play
**Pitch:** Log (locally, never sent) answers that scored 10 to 30 and let nate mark them fair or too generous, then refit the floors in `RELATION`.
**Brief:** Files: new `src/core/judgeLog.js`, Settings export. Done when: export file feeds `scripts/judge-eval.mjs` as a fixture.
**Touches:** Settings, JUDGE. **Conflicts:** J1.

### 91. Why this score (judge explains itself)
**Pitch:** The result card says in one handwritten line what the judge noticed: "Reticent is a synonym of taciturn", "you reached the idea through 'miserly'".
**Brief:** Files: new `src/ui/judgeNote.js`; `judgeAnswer` already returns relation hits. Done when: card line appears for relation hits only, never clips at 375px, test pins the wording.
**Touches:** MAIN card hook. **Conflicts:** 16.

### 92. Bad Wiktionary glosses out of the pool
**Pitch:** Words like callous ("Having calluses") and brazen ("Brass-like in appearance") are asked with the wrong sense, so right answers score 0. Prefer the sense that has synonyms and a figurative gloss.
**Brief:** Files: `scripts/build-words.mjs`, `src/core/wordPool.js`. Done when: listed words use their common sense and a test pins five examples.
**Touches:** CORE data. **Conflicts:** 46, word pool thread.

### 45-old. Judge v2 reference senses (superseded)
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

### 61. [x] Collect the curios (curio thread: Curios pages at the end of the Stats book)
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
**Pitch:** Done by the attic (#126): old books get a recovered floor, the rest live in the attic and the floor bay no longer has an "Earlier finds" group.
**Brief:** Goal: derive `fl` additively from old Daily results. Files: new `src/core/shelfFloors.js`. Done when: tolerates missing data, tested.
**Touches:** core. **Conflicts:** attic (#126).

### 100. [x] Wall-hung things get a visible mount (PR pending)
**Pitch:** Plaques, banners and lantern plates show their screws, brackets and a cast shadow on the wall, so nothing hangs from nothing.
**Brief:** Goal: a mount helper (bolt, bracket, shadow) used by the numeral plaque, floor banner, tracker plaques and lanterns. Files: new `src/ui/mounts.js`, one-line hooks. Done when: mounts visible at 375 and 1280, a geometry test that every hung object's anchor lies on a surface.
**Touches:** WORLD, tracker. **Conflicts:** 5 (alcove).

### 101. [x] The held book rests on something (PR pending)
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
### 74. [x] Attic: ladder, rafters and a real climb (PR pending)
**Serves:** immersion through interaction, physical motion.
**Pitch:** The attic lowers like a hatch today. Make the climb physical: the book tilts up, a ladder slides in, the skylight light grows as you rise.
**Brief:** Goal: a short climb transition into the attic and back. Files: `src/ui/attic.css`, `attic.js`. Done when: reduced motion cuts, wheel and swipe still work.
**Touches:** BOOK. **Conflicts:** 11.

### 75. Attic finds you can restore
**Serves:** everything is a book; rarity is the hero.
**Pitch:** Tap a dusty book in the attic and "Dust it off" writes its floor with a pen stroke and carries it down to its bay.
**Brief:** Goal: let nate choose a floor for floorless books. Files: `src/ui/attic.js`, `src/core/attic.js`. Done when: `fl` saved additively, book leaves the attic, tested.
**Touches:** BOOK, CORE. **Conflicts:** 11.
**Status:** [x] done (dust-off slip, `src/ui/atticDust.js`; PR #156).

### 76. [x] Cobwebs and dust on attic books (PR #152)
**Serves:** dark and mysterious; deeper is darker.
**Pitch:** The older the book, the more dust, webs and faded gilding on its spine.
**Brief:** Goal: age-based spine dressing in the attic. Files: `src/ui/attic.css`. Done when: tokens only, 14-letter word still readable.
**Touches:** BOOK. **Conflicts:** none.
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

### C1. Wax pooling and drips
**Serves:** physical, mysterious.
**Pitch:** The candle timer leaves wax pooling on the plate and a drip that runs down as the minutes pass, so a finished run leaves a stub on the desk.
**Brief:** Goal: persist a little wax build-up per run on the candle plate. Files: `src/ui/candle.css`. Done when: reduced motion static, 14-letter word unaffected.
**Touches:** run screen. **Conflicts:** none.

### C2. Candle light on the word
**Serves:** dark and mysterious, integrated.
**Pitch:** The wall lettering and the paper slip are lit from the candle's side and dim as the flame lowers, so time reads in the room, not only the corner.
**Brief:** Goal: drive the existing `--fr` light through flame height. Files: `src/ui/candle.css`. Done when: legible at the last second, 375 and 1280 screenshots.
**Touches:** run screen. **Conflicts:** 20.

### F1. Floor-change cue
**Serves:** dark and mysterious, immersive.
**Pitch:** Crossing into a new floor gets a single low sound (a door, a breath of colder air) so you hear the floor change, not just the tone.
**Brief:** Goal: one-shot cue on floor boundary, tied to the floor banner. Files: new `src/sound/floorcue.js`. Done when: once per crossing, silent when sound off.
**Touches:** FEEL hook. **Conflicts:** none.

### F2. Room tone reacts to the alcove
**Serves:** integrated, physical.
**Pitch:** Inside the reading nook the room tone ducks and muffles a little, as if the alcove shields you from the hall.
**Brief:** Goal: lowpass and duck the ambience bed while an alcove is open. Files: `src/sound/ambience.js`. Done when: smooth ramp, tested.
**Touches:** FEEL hook. **Conflicts:** 95.

### 140. Lectern per floor
**Pitch:** The reading stand takes the floor's wood and metal: pale oak in the Archive, rusted iron in the Hollow, wet and swollen in the Sunken Vault.
**Brief:** Goal: pass a floor palette into `lecternGeom`/draw helpers in `src/ui/lectern.js`. Done when: five floors distinct at 375 and 1280, reduced motion static. **Touches:** WORLD (held block). **Conflicts:** 2 (lighting).

### 141. The stand holds a lit candle and dropped page
**Pitch:** A stub of candle burns on the lectern lip and a loose page lies beside the held book, so the stand feels used.
**Brief:** Goal: small props on the lip drawn by `lectern.js`, lit by the existing candle light. Done when: no overlap with the book at any width, tested. **Touches:** WORLD. **Conflicts:** 4 (curios).

### 142. Mounts for the alcove numeral on phones
**Pitch:** Check every hung thing at 375 px for bolts that crowd the text and give the narrow plaques a one-bolt variant.
**Brief:** Goal: audit `plaqueBolts` at phone widths with 14-letter labels. Files: `src/ui/mounts.js`. Done when: screenshots attached. **Touches:** WORLD. **Conflicts:** 5.

### CI1. [x] Shard the browser checks (PR pending)
**Pitch:** Smoke and snapshots are about 35 to 55 s of a 75 to 120 s run; splitting snapshots into two parallel jobs would cut the wait further.
**Brief:** Goal: run `snapshots.mjs` per viewport/screen group in a matrix, keeping one required `check` job that depends on them. Files: `.github/workflows/ci.yml`, `scripts/snapshots.mjs`. Done when: median green time drops and `check` is still the only required context. **Result:** separate smoke/snapshots jobs took 2m16s end to end (snapshots job 63 s, smoke 83 s, build 28 s, plus scope/check overhead) versus 75 to 120 s before, because each job repeats checkout, npm ci and Chromium setup. Kept only the parallel `npm test` and the aggregating `check`. **Touches:** TOOLING. **Conflicts:** none.

### CI3. Shard snapshots per screen
**Pitch:** Snapshots is one sequential flow in one browser, so it is now the longest browser job; splitting its screens into independent jobs would shorten it further.
**Brief:** Goal: make each screen in `scripts/snapshots.mjs` reachable without replaying the earlier ones (seeded localStorage), then run them as parallel processes in the build job (separate jobs measured slower, see CI1). Done when: snapshots job time drops and `check` stays the only required context. **Touches:** TOOLING. **Conflicts:** none.

### CI2. Merge queue for bursts of PRs
**Pitch:** If strict up-to-date is ever turned on, a merge queue tests PRs together instead of making each one re-run after every merge.
**Brief:** Goal: only relevant if main starts breaking from semantic conflicts between parallel PRs. Needs nate to enable it in repo settings and add a `merge_group` trigger to CI. **Touches:** TOOLING. **Conflicts:** none.

### R1. [x] Reveal ceremony beats per tier (reveal-recipes PR; table in `revealRecipes.js` `revealCeremony`)
**Serves:** rarity is the hero, overhaul.
**Pitch:** "completely overhaul the particle system on book reveal ... more stylized and polished": the particles are done, now the rest of the reveal (backdrop rays, cover, sound) should share the same per-tier recipe.
**Brief:** Goal: drive rays, rune and screen flash from `src/ui/revealRecipes.js` so one table defines a tier's whole reveal. Files: `src/ui/reveal.js`, `revealRecipes.js`. Done when: tests pin it, frame time measured on a real GPU.
**Touches:** card, reveal. **Conflicts:** 16.

### R2. Quality hook for particles
**Serves:** performance.
**Pitch:** Particles scale with the Graphics setting instead of guessing.
**Brief:** Goal: once `src/ui/quality.js` is on main, make `qualityScale()` in `revealFx.js` read `Quality.params()` instead of `data-quality`. Done when: low mode throws about a third of the particles, tested.
**Touches:** reveal. **Conflicts:** 40.

### R3. Ceremony sound recipes
**Serves:** rarity is the hero, sounds line up with the motion language.
**Pitch:** "one recipe per tier reveal": the flash, rays and cover now come from one table, but the audio cues (paper, chime, sting) are still picked in `feel.js` by tier number.
**Brief:** Goal: add per-tier cue lists (timing, layers) to `revealCeremony` and let `Sfx` play them, so the sting lands on the flash and the cover creak matches the cover time. Files: `src/ui/revealRecipes.js`, `src/feel.js`. Done when: tests pin cue timing against `flash.at` and `cover.delay`.
**Touches:** reveal, sound. **Conflicts:** 24.

### R4. [x] Reveal cover materials (PR pending)
**Serves:** rarity is the hero, everything is a book.
**Pitch:** the cover only changes speed per tier; each tier's cover could crack, unlatch, unseal or burn open in its own way.
**Brief:** Goal: add a `cover.style` field to the ceremony table (wax seal snap, clasp, chain, glow seam) with CSS in `reveal.css`. Done when: all seven covers differ at a glance in a screenshot strip at 1280 and 375.
**Touches:** card, reveal. **Conflicts:** 16.

### R5. Measure the ceremony on a real GPU
**Serves:** performance.
**Pitch:** frame cost of rays, rune and flash was only checked under software rendering.
**Brief:** Goal: run `scripts/perf.mjs` with Apocrypha reveals on a real GPU (or nate's machine) and record the frame time per tier in `docs/perf-baseline.md`. Done when: numbers per tier at high, medium and low are in the doc.
**Touches:** TOOLING. **Conflicts:** none.

### D1. [x] Walk through the door (PR pending)
**Serves:** immersion, motion.
**Pitch:** Descending past a floor door should feel like passing through it: a short slow-down at the threshold, the sign swinging a little, a one-line floor sound.
**Brief:** Goal: a threshold moment while the camera crosses a floor start (sign sway, brief ease, optional room-tone sting). Files: new `src/ui/thresholdPass.js`, hook in `World` camera. Done when: uses the shared motion presets, off in reduced motion.
**Touches:** WORLD, FEEL. **Conflicts:** 2, 38.

### D1a. Doors you can feel on the way back up
**Serves:** immersion, motion.
**Pitch:** The threshold slow-down and sign swing now work in both directions; add a faint draught of the floor above on the way up (dust motes or a cold puff drifting through the doorway) so leaving a floor reads as clearly as entering one.
**Brief:** Goal: a short particle drift at the doorway when the camera crosses a floor start going up, using the pooled sprite engine. Files: `src/ui/thresholdPass.js`, hook in `src/world/world.js`. Done when: 1280 and 375 screenshots, off in reduced motion. **Touches:** WORLD, FEEL. **Conflicts:** 2, 38.

### D1b. Each floor's door sting you can set apart by ear
**Serves:** immersion, sound.
**Pitch:** The one-line door sound is quiet on purpose; give each floor a second, slightly different voice (card flutter, stone knock, drips, root creak, abyss swell) tuned by a listening pass.
**Brief:** Goal: audition and tune `STINGS` in `src/sound/thresholdSting.js` with nate listening. Done when: nate picks levels he likes. **Touches:** SOUND. **Conflicts:** 24.

### D2. Floor doors in the almanac and on the tracker
**Serves:** integrated, sections for each floor.
**Pitch:** The depth tracker and the Stats cross-section show each floor's door sign and wall swatch, so the same identity appears everywhere.
**Brief:** Goal: reuse `THRESHOLDS`/wall materials to paint small swatches. Files: `tracker.js`, `statsPages.js`. Done when: 375 and 1280 screenshots, long floor name readable.
**Touches:** HOME, tracker. **Conflicts:** 2.

### AT1. [x] Attic clutter and props (PR #153)
**Pitch:** The attic reads as a room now; fill it with trunks, a dress form under a sheet, a rolled rug, a ladder hatch, hanging lantern sway.
**Brief:** Goal: add static props to `buildRoom` in `src/world/atticRoom.js` without covering the book piles. Done when: screenshots at 1280 and 375. **Touches:** WORLD. **Conflicts:** 74.

### AT2. Attic crates you can rearrange
**Pitch:** Let recent guesses sit in the attic as loose books on the beams with how many you want to keep up there (5, 12, 30).
**Brief:** Goal: setting for how many recent guesses the attic holds (`RECENT_N` in `src/core/attic.js`), saved additively. Done when: tested, default stays 12. **Touches:** core. **Conflicts:** 75.

### W1. Rules card you can pull out
**Serves:** everything is a book/shelf/page, immersion through interaction.
**Pitch:** The pinned "Rules of the house" card slides out of a card-catalogue drawer on the niche ledge when you click it, and flips to a second card with the combo and tier rules.
**Brief:** Goal: make the welcome rules card interactive. Files: `src/ui/welcome.css`, new `src/ui/welcome.js`. Done when: keyboard operable, reduced motion static, 375 and 1280 screenshots.
**Touches:** HOME. **Conflicts:** 27.

### W2. [x] A librarian's desk on the ledge (#157; props moved onto the wall furniture by H1)
**Serves:** "things that live down there", hidden curios, physical sanity.
**Pitch:** A small brass bell, an inkwell and a stamp sit on the niche ledge; the bell chimes, the stamp thumps a due date onto the borrower's slip.
**Brief:** Goal: ledge props with one sound each. Files: new `src/ui/deskProps.js`. Done when: nothing floats, props hidden under 560 px.
**Touches:** HOME, ledge. **Conflicts:** 4.

### K1. Curio you can carry
**Serves:** discovery, reward for looking.
**Pitch:** A curio, once kept, can be pinned to the reading stand or the nook desk, so what you found is visible in the world.
**Brief:** Goal: show up to 3 kept curios on the nook ledge. Files: new `src/ui/curioDesk.js`, `alcoveArt.js` hook. Done when: nothing overlaps the word at 375 px.
**Touches:** HOME. **Conflicts:** 90, E.

### K2. Depth-gated curios (60) with sound
**Serves:** things that live down there.
**Pitch:** Eyes in the gaps below the Hollow, a book that is warm only in the Abyss, each with a small sound when opened.
**Brief:** Goal: add 2 kinds to `curios.js` plus the cabinet rows. Done when: per-floor determinism test.
**Touches:** `curios.js`. **Conflicts:** 95.

### K3. The last curio
**Serves:** lore, discovery.
**Pitch:** The letter ends on a curio that is not on any shelf you can find by looking; finishing the letter should lead somewhere.
**Brief:** Goal: a reward for the 30th find (seeded hidden place). Files: `curioLog.js`. Done when: tested, no storage shape change.
**Touches:** new files. **Conflicts:** none.

### K4. Smoke every mode with a strong answer
**Serves:** health.
**Pitch:** The smoke test only plays Daily and now one Unlimited word; Practice and a full seven-word run to the Finis screen are untested.
**Brief:** Goal: extend `scripts/smoke.mjs` to finish a whole run in each mode and check the final screen. Done when: CI stays under its current time.
**Touches:** `scripts/smoke.mjs`. **Conflicts:** none.

### W5. The bell calls the librarian
**Serves:** things that live down there, discovery.
**Pitch:** Ring the brass bell enough times (or at 3 a.m. by the clock) and something answers from the dark: a note slid across the ledge, a book that was not there before.
**Brief:** Goal: a hidden reaction to repeated bell rings. Files: `src/ui/deskProps.js`, `curioLog.js` hook. Done when: seeded and tested, no storage shape change, nothing covers the books at 375 px.
**Touches:** HOME. **Conflicts:** W2 follow-ups, K3.

### W6. The stamp remembers
**Serves:** physical sanity, library furniture you can touch.
**Pitch:** The due date stamped on the Borrower's slip stays on it between visits, and a played Daily stamps the slip by itself with that day's date.
**Brief:** Goal: persist the last stamp additively (`deepstack.v1` field `stamp`, tolerate missing). Files: `src/ui/deskProps.js`. Done when: tested, reload keeps the mark, old saves load.
**Touches:** HOME, saves. **Conflicts:** W2 follow-ups.
### W1. Rules card you can pull out
**Serves:** everything is a book/shelf/page, immersion through interaction.
**Status:** [x] done (PR pending): the rules sit in a card-catalogue drawer on the niche ledge; pulling it slides the card out, a second face holds the combo and tier rules (`src/ui/welcome.js`, `welcome.css`).

### W3. A card for every floor
**Serves:** everything is a book/shelf/page, dark and mysterious with depth.
**Pitch:** Each floor's drawer card tells you its own rule of the house once you reach it: the Hollow's lamps burn lower, the Abyss asks for silence.
**Brief:** Goal: a third face on the rules card per unlocked floor, flipping through faces (`src/ui/welcome.js`, `nextState`). Done when: keyboard operable, reduced motion static, tested.
**Touches:** HOME. **Conflicts:** none.

### W4. Drawer you can hear
**Serves:** physical and smooth motion.
**Pitch:** The catalogue drawer rumbles out on wooden runners, the card flips with a paper flick, and the drawer shuts with a soft thud.
**Brief:** Goal: three small sounds hooked to open, turn and close. Files: `src/ui/welcome.js`, `src/sound/`. Done when: respects volume and reduced motion, tested.
**Touches:** HOME, sound. **Conflicts:** 4.

### 76a. Attic books that creak open dusty
**Serves:** tactile; the attic feels lived in.
**Pitch:** Opening a very old attic book puffs a little dust off it and wipes its cover clean as it goes.
**Brief:** Goal: tie the card-open particles to `bookAge`. Files: `src/world/atticRoom.js`, card open hook. Done when: puff only for age over .5, reduced motion cuts it.
**Touches:** BOOK. **Conflicts:** 75.

### 76b. Dust sheet over the whole attic pile
**Serves:** dark and mysterious.
**Pitch:** A faint dust sheet drapes the oldest pile in the back row and lifts when you hover it.
**Brief:** Goal: pile-level dust layer. Files: `src/world/atticRoom.js`. Done when: tokens only, titles readable.
**Touches:** WORLD. **Conflicts:** 74.

### AT3. Ladder rungs you can hear
**Serves:** tactile, immersive, physical.
**Pitch:** Each rung that passes on the climb gives a soft wooden tap, and the ladder creaks as it settles; quieter when you come down.
**Brief:** Goal: tie one tick per rung to `ladderGeom` rung crossings in `src/world/atticClimb.js`. Files: `src/world/atticClimb.js`, `src/sound/`. Done when: respects the sound toggle and the voice cap, silent under reduced motion.
**Touches:** FEEL hook, WORLD. **Conflicts:** none.

### AT4. Climb the ladder by hand
**Serves:** physical, integrated not bolted on.
**Pitch:** Drag the ladder (or the whole room) up and down so you climb at your own pace instead of a fixed climb, and the light follows your finger.
**Brief:** Goal: map pointer drag to the attic climb progress with a snap to open or closed on release. Files: `src/ui/atticHome.js`, `src/world/world.js`. Done when: wheel, swipe and Escape still work, reduced motion stays instant.
**Touches:** WORLD. **Conflicts:** 75, 76.

### H1. [x] Home drawer and record overhaul: built-in cabinet and ledger (this PR)
**Serves:** integrated not bolted on, less cluttered, physical and smooth motion.
**Pitch:** The rules drawer and Borrower's record stop floating: a card-catalogue cabinet is built into the left wall and a framed ledger into the right, balanced either side of Descend, with the ledge left for the books.
**Brief:** Done. Reverses parts of #149 (floating record), #155 (flat drawer) and #157 (ledge props: inkwell dropped, bell and stamp moved onto the furniture).
**Touches:** HOME. **Conflicts:** W1, W2.

### H2. Cabinet drawers that hold more
**Serves:** everything is a book, hidden curios.
**Pitch:** The two spare drawers of the cabinet open too: one holds the tier chart as index cards, one a "lost property" card with a line of lore that changes by floor.
**Brief:** Goal: make `.cc-fake` drawers real (Enter/Space, aria-expanded), reusing the card glide. Files: `src/ui/welcome.js`, `welcome.css`. Done when: one card open at a time, reduced motion static, 1280 and 375 shots.
**Touches:** HOME. **Conflicts:** H1 follow-ups.

### H3. Ledger that remembers the last descent
**Serves:** handwritten, themed, sectioned.
**Pitch:** The ledger gets a second page you turn to: last descent's seven words struck through in pen with the tier ink beside each.
**Brief:** Goal: a page-turn on the ledger frame showing the latest run from saves (read-only). Files: new `src/ui/ledgerPages.js`, `welcome.css`. Done when: tolerates empty saves, keyboard turn, reduced motion static.
**Touches:** HOME, saves (read). **Conflicts:** H1.

### F1. Books that fall when you pull one
**Serves:** physical, immersive, interaction.
**Pitch:** Pulling a book from a tight row sometimes knocks its neighbour over; it tips onto the plank and joins the fallen books.
**Brief:** Goal: on pull, the book beside the slot leans into the gap, then lies down using `fallenBooks.js` poses. Files: new `src/ui/fallenReact.js`, hook in the pull block. Done when: seeded, no overlap, reduced motion skips the tip.
**Touches:** WORLD, pull. **Conflicts:** 101.

### F2. Loose pages and dust where books fell
**Serves:** dark and mysterious, deeper is darker.
**Pitch:** Deep floors scatter torn pages and a dust puff around fallen books, thicker below the Hollow.
**Brief:** Goal: add a `pages` kind and dust specks to `placeFallen`. Files: `src/ui/fallenBooks.js`, `test/fallen-books.test.js`. Done when: still seeded and non-overlapping.
**Touches:** WORLD. **Conflicts:** 4.

### AT5. Dust-off carries the book down
**Serves:** physical, integrated not bolted on.
**Pitch:** After you write the floor, the book lifts off the pile, drops through the hatch and you see it settle into its bay on that floor instead of the slip just fading.
**Brief:** Goal: a short carry animation from the attic pile to the Shelf bay it joined, then a one-line "Shelved in The Catacombs". Files: new `src/ui/atticCarry.js`, light hook in `atticDust.js`. Done when: reduced motion cuts, 375 px screenshot. **Touches:** WORLD, BOOK. **Conflicts:** 76, AT4.

### AT6. Dust off a whole crate
**Serves:** less fiddly, everything is a book.
**Pitch:** Earlier finds in a month's crate often came from one run; let me dust a whole crate off with one floor choice, then fix single books after.
**Brief:** Goal: "Dust the crate" on the slip, writing one floor to every floorless book of that month via `dustOff`. Files: `src/ui/atticDust.js`, `src/core/attic.js`. Done when: tested. **Touches:** CORE. **Conflicts:** 75.

### AT9. Open the trunks
**Serves:** immersion through interaction.
**Pitch:** Tap an attic trunk and its lid creaks open to show a few old books or a curio, then closes again.
**Brief:** Goal: hit rects for the trunks from `src/world/atticProps.js`, a lid-open draw state, reduced-motion static. Done when: 375 and 1280 screenshots. **Touches:** WORLD. **Conflicts:** 74, 75.

### AT10. Moths round the attic lantern
**Serves:** living world, performance as a feature.
**Pitch:** A few moths orbit the swaying lantern and the window shaft; none on low quality.
**Brief:** Goal: draw 3 to 5 moths from `lanternPos()` using `Quality.params()` counts. Done when: no cost on low, reduced motion static. **Touches:** WORLD. **Conflicts:** none.

### AT11. Sheet that stirs
**Serves:** atmosphere.
**Pitch:** The dress-form sheet shifts slightly when you climb in, as if disturbed by the draught.
**Brief:** Goal: one-off settle animation for the sheet when the attic opens, in the shared motion language. **Touches:** WORLD. **Conflicts:** none.

### P1. Per-pass timers in the ?perf overlay
**Serves:** performance.
**Pitch:** show which canvas pass (rows, niches, lighting, glows, dust) costs what, so I can fix the slowest one instead of guessing.
**Brief:** Goal: optional timers around each pass in `frame()` shown as a bar list under `?perf`, zero cost when off. Files: `src/ui/perf.js`, one-line hooks in `world.js`. Done when: timers sum to the frame work and nothing is measured without `?perf`.
**Touches:** WORLD (hooks), TOOLING. **Conflicts:** none.

### P2. Cache the wall gradient per floor
**Serves:** performance.
**Pitch:** every shelf row still builds its own wall gradient each time it is redrawn; one cached strip per floor would do.
**Brief:** Goal: reuse a per-floor wall sprite in `drawRowLive` instead of `createLinearGradient`. Files: `src/world/world.js`. Done when: p95 not worse and snapshots unchanged.
**Touches:** WORLD. **Conflicts:** floors threads.

### AT12. Books lean on the beams and crates
**Pitch:** the piles now differ (trunk, crate, slumped, heap) but nothing rests on the roof beams or leans against the posts and ladder.
**Brief:** Goal: a few books wedged on the low beams and propped against the side posts, hit rects still tappable. Files: new `src/world/atticLean.js`, one hook in `atticRoom.js`. Done when: titles readable at 375/1280/1640.
**Touches:** WORLD. **Conflicts:** other attic threads.

### AT13. Pile layout remembers its shape
**Pitch:** a new book re-chunks the piles so shapes shuffle; each pile should keep its look as books are added.
**Brief:** Goal: derive pile kind from the oldest book in it, not its order. Files: `src/world/atticRoom.js` layoutPiles + test. Done when: adding a book changes at most the newest pile.
**Touches:** WORLD. **Conflicts:** none.

- [x] N8. A sigil for every book (sigils thread): `src/ui/sigil.js`, one call in `bookArt.js`.

### S1b+S1c. [x] Menu spine wear and muted plaque/mantel oak (this PR)
- Follow-ups: S1d chip and stain marks that persist per save (a book you open often looks more thumbed); S1e dust on top edge of the stack that wipes on hover.

### S1. Sigils on the book cover and the result card
**Pitch:** stamp the sigil big on the opened/DOM book covers too.
**Brief:** Goal: reuse `drawSigil`. Files: `src/ui/bookOpenFx.js`, `src/ui/bookCard.css`. Done when: same word, same sigil everywhere.
**Touches:** BOOK. **Conflicts:** 7a.
### 93. Judge says what it noticed in the thesaurus
**Pitch:** The `c` lists are separate, so the result card can name where a hit came from ("curt is an everyday word for laconic").
**Brief:** Goal: expose which list matched in `relate()` so item 91's handwritten line can phrase it. Files: `src/scorer/relations.js`, `src/ui/judgeNote.js`. Done when: test pins wording per list.
**Touches:** JUDGE. **Conflicts:** 91, 93.

### 94. Phrases and two-word synonyms
**Pitch:** "show-off", "drive away" and "cast out" still miss because the frequency filter and the matcher stay with single words.
**Brief:** Goal: admit common two-word synonyms from WordNet into `c`, match them in `terms()`. Files: `scripts/lib/wordnet.mjs`, `src/scorer/relations.js`. Done when: judge:eval good/synonym passes 88% with wrong answers not rising.
**Touches:** JUDGE. **Conflicts:** none.
- [x] N11. Streak candles on the mantel (`src/ui/mantel.js`, this PR). New ideas: N16 candles burn down through the day, N17 hover a candle for its day and word, N18 milestone candlesticks at 7/30/100 (briefs in the project notes).
### N13a. Back stacks catch the lamp
**Pitch:** the far shelves should pick up a faint glow when a lantern or the candle is near, so the depth reads even on dark floors.
**Brief:** Goal: tint back-stack bands near `addLight()` sources. Files: `src/world/backStacks.js`, `src/ui/lighting.js` hook. Done when: within 1 ms of the N13 baseline, off on low quality.
**Touches:** WORLD. **Conflicts:** 2 (lighting).

### N13b. Things in the far stacks
**Pitch:** a ladder, a hanging lamp or a distant reader's lit window now and then in the back row, never in the way.
**Brief:** Goal: seeded rare props baked into the per-floor back tile. Files: `src/world/backStacks.js`. Done when: at most one per floor tile, none on the Hollow and Abyss except a single faint light.
**Touches:** WORLD. **Conflicts:** none.

### S3. [x] Stamp the sigil into the open pages (this PR)
**Pitch:** the sigil is on every cover but the opened card still shows only words; press a faint watermark of it into the vellum behind the definition so the mark follows the book inside.
**Brief:** Goal: draw `drawSigil` at ~6% alpha large behind `.book .page .inner`. Files: `src/ui/coverSigil.js`, `src/ui/bookCard.css`. Done when: text stays fully readable at 14 letters, reduced motion unchanged. **Touches:** BOOK. **Conflicts:** none.

### S4. [x] A set's ring on its Sets page and complete-set seal (this PR)
**Pitch:** the Sets book should show each set's ring as its crest, and completing a set stamps the ring in wax.
**Brief:** Goal: render `setRing(i)` via a ring-only sigil on each set leaf; wax-seal state when `done`. Files: `src/sets/ui.js`, `src/ui/sigil.js`. Done when: six distinct crests, a test pins set to crest. **Touches:** SETS. **Conflicts:** none.

## Q. Audit 2026-11-04 (fresh walk of main at 1640, 1280 and 375; screenshots in `screenshots/audit/`)

### Q1. [x] Open books hide the home scene behind them (this PR: wordmark and plaque fade out while a book is open)
**Serves:** integrated not bolted on, dark and mysterious.
**Pitch:** Every menu book opens over the home screen but the gilt "Deepstack" wordmark, chains and plaque still peek out above its top edge, half-cut, which reads as a glitch.
**Brief:** Goal: while a book is open, dim and lower the home hero (wordmark, lanterns, No. plaque, mantel) so only shelves show behind the book. Files: `src/ui/bookOpen.css` (or a new `bookBackdrop.css`), hook where `#home.book-opening` is set. Done when: no wordmark pixels above the book at 1280 and 1640, close restores it with the existing motion language, reduced motion has no fade.
**Touches:** HOME, books. **Conflicts:** 104, N-series home threads.

### Q2. [x] Phone run screen: the answer slip is a sliver (this PR)
**Serves:** words fully readable, overhaul not tweak.
**Pitch:** At 375x667 the pinned slip shows two lines ("your / own / wor…" is cut off), the Hint button runs under the depth rail, and the bottom third of the screen is empty shelf.
**Brief:** Goal: give the slip the free space (taller, text starts level with the quill), move the depth rail to a slim strip that never overlaps controls, keep Hint and Skip inside the alcove. Files: `src/styles/responsive.css` or new `src/styles/phone-run.css`. Done when: a 14-letter word, the longest hint label and the on-screen keyboard open all fit at 375x667 and 360x640, Riddle Shelf included.
**Touches:** RUN, phone. **Conflicts:** Spacing and type pass, 95.
**Done:** `src/styles/phone-run.css`: slip height scales with the viewport (135px at 375x667, 107px at 360x640, was 97/80), text indents 46px; hint and skip share one row inside the alcove, clear of the 32px rail (hint label wraps). Not yet verified: on-screen keyboard open, Riddle shelf.

### Q3. [x] Settings: Graphics "Low" clipped on phones (this PR)
**Pitch:** The four Graphics choices ran past the panel at 375 so Low was half off-screen. Now the legend takes its own line and the buttons share the width (test pins the rule).
**Touches:** settings. **Conflicts:** 55 (written settings).

### Q4. [x] Filter page overflows the book page with no way to tell
**Serves:** words fully readable, everything is a page.
**Pitch:** On the Shelf book the Sort, Bay, Show and Rarity lists run past the bottom of page 1 ("Hardbound / Folio" cut mid-line at 1640, "Paperback" cut at 375) and the right page is empty for a new player.
**Brief:** Goal: fit the filters (two rows of handwritten words, rarity as one row of tier-coloured ticks) or let the page scroll under a deckled fade, and use the empty right page for something useful (the first tier shelf, or a hand-drawn "your first answer goes here"). Files: `src/ui/bookMenus.js`, `src/ui/bookStyle.css`. Done when: nothing is clipped at 375x667 or 1280x720 with 0 and 60 books.
**Touches:** SHELF book. **Conflicts:** 11, 82. Done: filters in a compact two-column written layout with a foot fade (`src/ui/shelfFilters.css`); empty Shelf shows a sketched empty shelf on the right page.

### Q5. [x] (PR: Q5 final ledger) Descent complete is still boxes and a half-empty alcove
**Serves:** everything is a book/page, no outlined rectangles, rarity is the hero.
**Pitch:** The final screen has outlined stat tiles (Answered / Best book / Combo), outlined Copy and Back buttons, and a small column of text in the upper half with the lower 40% of the alcove empty.
**Brief:** Goal: rebuild as the closing page of a ledger: tallies written in ink, the seven books lined on the ledge as the hero, Copy and Back as handwritten words with the pen underline, depth numeral large. Files: `src/app/final.js`, `src/styles/result.css` or new `src/ui/finalPage.css`. Done when: fits one view at 1280x720 and 375x667, 14-letter word does not clip, share note unchanged.
**Touches:** RESULT. **Conflicts:** 16, 70, Q16.

### Q6. [x] "Next word" ribbon takes the tier material (PR pending)
**Serves:** rarity is the hero, tier material.
**Pitch:** The ribbon button under the result card stays plain grey whether the book is a Pamphlet or an Apocrypha, and the frame around the card is grey too, so the card looks the same dull colour for every tier; "0 /100" also has a stray space.
**Brief:** Goal: tint ribbon, frame and Enter key from the tier's own material (silk for Folio, wax red for Grimoire, aqua thread for Apocrypha), keep Pamphlet grey. Fix the "0 /100" spacing. Files: `src/ui/tierFrames.css`, `src/app/card.js`. Done when: seven tiers screenshot side by side, contrast of the label passes on each.
**Touches:** RESULT. **Conflicts:** 17, 64, R4.

### Q7. Empty pages for a new player
**Serves:** persistent world, handwritten.
**Pitch:** A fresh save shows an Almanac that is two-thirds blank, a Shelf with an empty right page, the Riddle book with half a page of nothing, and "one at a time" written twice on the Sets spread.
**Brief:** Goal: one empty-state pass: a hand-drawn faint outline or sketch per book (an empty shelf, a sealed ledger, a riddle slip), one line of written invitation, no repeated notes. Files: `src/ui/bookPages.js` and the almanac/sets files, new `src/ui/emptyPages.css`. Done when: every menu book at 0 played looks finished at 1280 and 375.
**Touches:** books. **Conflicts:** 54, 55, 56.

### Q8. [x] Home: loose air between Descend and the book stacks (PR pending)
**Serves:** spacing and polish, dark and mysterious.
**Pitch:** At 1280 and 1640 there is about 100 px of dead space between "Daily No. 2" and the first book, the mantel shelf holds one candle, and floating dust specks sit on the caption like stray marks.
**Brief:** Goal: tighten the vertical rhythm (move the stacks up or give the gap a purpose: the streak candles, a hanging sign), keep dust away from text. Files: `src/styles/home-base.css`, `src/ui/mantel.css`. Done when: balanced at 1000x700, 1280x800, 1640x900 and nothing overlaps the cabinet or ledger.
**Touches:** HOME. **Conflicts:** 94, 95, N16 to N18.

### Q9. [x] "Preparing the judge, 100%" lingers in the top bar (PR pending)
**Serves:** honest answers, integrated.
**Pitch:** The status shows "Preparing the judge, 100%" on home even when nothing is loading; at 375 it also squeezes the bar.
**Brief:** Goal: when the model is ready show nothing (or a small brass "Judge ready" lamp that fades after 3 s); when it fails say so plainly and that the simpler judge is in use. Files: `src/ui/topbar.js`. Done when: tests pin the three states, no layout shift on phone.
**Touches:** top bar, JUDGE. **Conflicts:** none.

### Q10. The quill sits on the first letter of the placeholder  [x] (this PR)
**Serves:** words fully readable, handwritten.
**Pitch:** In the answer slip the quill icon overlaps "your own words…" (it reads "I your") and on the Riddle slip it covers the "T" of "The word…".
**Brief:** Goal: indent the placeholder and text start past the quill, or draw the quill in the margin beside the red rule. Files: `src/ui/quill.css`. Done when: placeholder and typed text start clear of the quill at 375 and 1640.
**Touches:** RUN. **Conflicts:** 20, 67.

### Q11. [x] Decided: a 0/100 answer keeps its book and 13 ft (nate, 2026-11-05)
**Serves:** rarity is the hero, variety over repetition.
**Pitch:** Typing something unrelated gives a Pamphlet and +13 ft just like an honest try, so rarity at the bottom means nothing; nate decides whether a miss should cost something.
**Brief:** Goal: pick one (needs nate): a 0 becomes a "damp, unreadable" pamphlet that stays off the shelf, or the descent stalls at the same depth, or leave as is. Files: `src/core/scoring.js`, `src/app/card.js`. Done when: Daily score rules unchanged, test pins the choice.
**Touches:** CORE, RESULT. **Conflicts:** Judge accuracy, Daily fairness.

### [x] Q12. Open books on a phone cover the top bar and clip the ribbon (fixed, PR pending: book sits below the bar at 375 and 360)
**Serves:** integrated not bolted on, spacing.
**Pitch:** At 375 the open Shelf and Almanac books slide over the Sound, Credits and Settings buttons and the bookmark ribbon is cut off at the right edge as an unreadable stub.
**Brief:** Goal: start the book below the top bar, keep the ribbon fully inside the cover, keep Close reachable without scrolling. Files: `src/ui/bookOpen.css`. Done when: all six menu books screenshot clean at 375x667 and 360x640.
**Touches:** books, phone. **Conflicts:** 104, 95.

### Q13. Written calls to action never wrap [x] (Riddle Shelf CTA shortened to "Start the Riddles")
**Serves:** words fully readable, handwritten.
**Pitch:** "Start the Riddle Shelf" wraps to "Shelf" alone on its own line while "Start Unlimited" fits; Close the book sits tight beneath it.
**Brief:** Goal: shorten or scale the handwritten CTA so it stays on one line ("Start the Riddles"), give the pen underline and Close a consistent gap. Files: `src/ui/bookMenus.js`, `src/ui/bookStyle.css`. Done when: all six books' CTAs on one line at 1280 and 375.
**Touches:** books. **Conflicts:** Q7.

### Q12b. Daily page date is clipped at the right edge on phones
**Serves:** words fully readable, spacing.
**Pitch:** On the open Daily book at 375, "Thursday, 5 November 2026" runs past the page and the last digit of the year is cut off.
**Brief:** Goal: let the date wrap or scale to fit inside the page margin. Files: `src/ui/dailyBook.css`. Done when: full date visible at 375x667 and 360x640.
**Touches:** Daily book, phone. **Conflicts:** Q14.

### Q14. [x] Daily calendar header has stray marks (done in this PR: hand-drawn SVG prev/next arrows, 44 px, no text-decoration underline)
**Serves:** spacing and polish, handwritten.
**Pitch:** The "‹ November 2026" header has a tiny back arrow, a blue underline that runs off the right edge of the page, and small dash ornaments on the margin of page 1.
**Brief:** Goal: a clear hand-drawn previous and next arrow pair, the underline kept inside the text block, the corner dashes removed or made a real page-curl. Files: `src/ui/dailyBook.js`, its css. Done when: screenshot at 1280 and 375, arrows hit 44 px.
**Touches:** Daily book. **Conflicts:** 13, 62, 63.

### [x] Q15. (PR #187) Fine print is too dim on dark
**Serves:** words fully readable.
**Pitch:** Floor ranges in the depth rail ("101 to 252 ft"), locked floor names, the key hints under the slip ("Enter to submit, Alt+H hint") and the share note are small grey on dark and hard to read.
**Brief:** Goal: audit every small label on dark surfaces for 4.5:1 contrast and 12 px minimum, lift values in tokens. Files: `src/theme/colors.js`, `src/ui/depthRail.css`, `src/styles/run.css`. Done when: a test lists the pairs and passes, no screenshot differences beyond text.
**Touches:** RUN, tokens. **Conflicts:** Keyboard controls and accessibility.

### Q16. [x] Share note wraps in an awkward place (done: tier pairs and bar line never break; copied text unchanged)
**Serves:** words fully readable, handwritten.
**Pitch:** The pinned note on the final screen ends lines with a dot ("Pamphlet · Pamphlet · Paperback ·") and shows a stray dash under line two.
**Brief:** Goal: lay out the tier row as seven small stamps or break after the fourth, remove the dash, keep the plain text copy exactly as is. Files: `src/app/final.js`, `src/styles/result.css`. Done when: row never wraps mid-pair at 375 and 1280.
**Touches:** RESULT. **Conflicts:** Q5.

- [x] N9. A score that follows the descent (`src/sound/score.js`, this PR)

### N9b. A music slider of its own
**Pitch:** let me turn the score up or down apart from the room tone and effects, or off while keeping the room tone.
**Brief:** Goal: a `Music` slider/toggle in Settings feeding `score.setLevel`. Files: new `src/ui/musicSetting.js`, one hook in `topbar.js`, `score.js` level multiplier. Done when: saved additively, 0 equals off, test with a fake context.
**Touches:** SETTINGS, FEEL. **Conflicts:** F1, F2.

### N9c. The score answers the reveal
**Pitch:** each book tier gets its own two-bar cadence in the floor's key, so a Codex found in the Vault sounds different from one in the Stacks.
**Brief:** Goal: tier-specific motifs transposed to the current floor mood, replacing the generic swell. Files: `src/sound/score.js` (`swell`). Done when: a test pins each tier's motif in the floor scale, voices stay capped.
**Touches:** FEEL. **Conflicts:** reveal recipes.

### N9d. Silence in the Hollow
**Pitch:** let the score drop out entirely for a few seconds when you cross into the Hollow or Abyss, so the first notes back feel like a held breath.
**Brief:** Goal: a door hook that mutes the score for 6 to 10 s then fades it in on the new mood. Files: `src/sound/score.js`, hook in `thresholdPass.js`. Done when: reduced-motion and sound-off unaffected, tested with a fake clock.
**Touches:** FEEL. **Conflicts:** none.

### R2. Etymology and era clue for riddles
**Pitch:** a last-resort riddle hint that says where the word comes from ("from Latin", "old sailor slang") without spelling it.
**Brief:** Goal: an optional `origin` hint after the synonym, from Wiktionary etymology language only (never the etymon). Files: `scripts/build-words.mjs`, `src/core/riddleHints.js`. Done when: the no-leak test covers it and words without data simply skip it.
**Touches:** CORE, DATA. **Conflicts:** none.

### R3. [x] Hints that fade in on the slip (PR pending)
**Pitch:** riddle hints pin onto the slip one at a time with the blank in the sentence slowly pulsing like a held breath.
**Brief:** Goal: polish the gap mark and slip entrance using the shared motion tokens. Files: `src/ui/hintSlips.css`. Done when: reduced-motion shows no animation.
**Touches:** UI. **Conflicts:** none.
- [x] Shelf spine labels never clipped: type shrinks to fit, ×N/star hang off the spine as tags, other one-line words wrap (spine-labels thread).
- [x] (clip-sweep PR) Sweep the remaining ellipsis uses (plaques, daily-book titles) for words that can clip. Pitch: nate wants no clipped words anywhere. Conflicts: shelfBays.css, home.css.
- [x] (clip-sweep PR) Attic and ledge spine labels: apply the same fit helper. Conflicts: src/world/bookArt.js.


- [x] Page flip overhaul (PR #199; curl, page-edge thickness, handwritten cue, tug hint, lifted leaf)

### P1. [x] Ribbon markers that jump pages (this PR)
**Pitch:** each menu book has a ribbon; tug it to jump to the contents page, and let a pen-ink bookmark remember where you stopped.
**Brief:** Goal: a clickable ribbon on open books that returns to page 1, plus the last page remembered per book for the session. Files: new `src/ui/bookRibbon.js`, hook in `home.js` paint. Done when: keys and swipe unaffected, tested with a fake spread. **Touches:** BOOKS. **Conflicts:** page flip.

### P2. Drag the corner to turn
**Pitch:** grab the curled corner and drag it across the page; letting go early lays it back, past halfway it turns.
**Brief:** Goal: pointer-drag on `.bs-corner` drives the leaf's rotate with spring settle. Files: `src/ui/pageFlip.js`, `pageFlip.css`. Done when: click still turns, reduced motion falls back to a click. **Touches:** BOOKS. **Conflicts:** none.

### P3. Paper sound that follows the hand
**Pitch:** a soft rustle as the corner lifts and a different settle when the page lands, quieter for short flips.
**Brief:** Goal: two synthesised paper cues in `feel.js` tied to hover-lift and turn end. Files: `src/feel.js`, `pageFlip.js`. Done when: off with sound off. **Touches:** FEEL. **Conflicts:** F1.

### M1. [x] Merge riddle modes into Unlimited and Daily (this PR)
**Pitch:** "combine riddle shelf into Unlimited, making it sectioned off but still on the same two pages, it should also be Daily and Daily Riddle".
**Done:** the Riddle Shelf and Today's Riddle menu books are removed; Unlimited's spread holds Unlimited and Riddle, the Daily cover holds Daily and Daily Riddle; renamed everywhere; saves untouched.
**Touches:** UI. **Conflicts:** `src/ui/home.js`, `src/ui/dailyBook.js`.

### M2. Riddle history inside the Daily book
**Pitch:** each Daily day spread should show that day's seven riddle definitions and your answers, like the words, not just a solved count.
**Brief:** Goal: a "Daily Riddle" block on every day's pages (sealed until played, open once the day passes). Files: `src/ui/dailyBook.js`, `src/core/riddleDaily.js`. Done when: today's riddle stays sealed until played and tests cover it.
**Touches:** UI. **Conflicts:** `src/ui/dailyBook.js`.

### M3. Unlimited stats that count both halves
**Pitch:** the Unlimited book should show your Lexicon and your riddle solved count side by side, since they share a book now.
**Brief:** Goal: a one-line tally under each section's Start link. Files: `src/ui/home.js`. Done when: fresh saves show a written empty line, not zeros.
**Touches:** UI. **Conflicts:** `src/ui/home.js`.

### M4. Fewer books on the home stack, audit the rest
**Pitch:** same idea again: could Practice live inside the Daily book as a third section, and Shelf/Sets/Stats share one book?
**Brief:** Goal: audit which home books are related modes and propose merges before building. Files: `src/ui/home.js`. Done when: a short plan in this file.
**Touches:** UI. **Conflicts:** `src/ui/home.js`.
### S1. [x] Menu spines in real book-cloth colours (done: navy, oxblood, bottle green, tan calf, ochre, slate; muted, tier colours untouched)
- Follow-ups: S1a recolour the Riddle/merged-riddle spines once the riddle-merge thread lands (muted aubergine/verdigris from `HOME_BOOK_COLORS`); S1b per-book spine wear (rubbed corners, faded titles) so the stack reads as old; S1c let the Descend plaque and mantel wood take a matching muted tone.
### R1. Librarian's Card colour hierarchy (done, thread "Restyle the Librarian's Card")
- [x] Renamed Borrower's record to Librarian's Card; per-row ink (ember streak, deep ink depth, best-tier Books, floor-coloured Floor), quiet labels, underlines.
### R2. Stamps on the Librarian's Card
**Pitch:** a milestone stamp (e.g. "100 BOOKS", "7-DAY STREAK") thumps onto the card the first time you pass it, in the row's own ink.
**Brief:** Goal: tiny rotated ink stamps layered on `.lg-page`, saved additively. Files: `src/ui/welcome.js`, `welcome.css`. **Conflicts:** home stamp prop.
### R3. [x] Card ink follows the lamp (PR pending)
**Pitch:** the card's ink and parchment warm or cool with the time-of-day light in the nook, so the card reads as part of the room.
**Brief:** Goal: tint `--lg-ink` mixes by the existing time-of-day variable. Files: `welcome.css`. **Conflicts:** none.
### S1. Scrollbars gone (done, PR pending)
**Pitch:** no default browser scrollbars anywhere; surfaces fit, long pages use a slim dark bar. Shipped: cardFit.js, pageFit.js, scrollbars.css.
**Brief:** Goal: audit the remaining panels (Settings, Credits, keys help, topbar panel, final-screen ledger) for scrollbars once #189/#191/#193 land. Files: `src/styles/scrollbars.css`. Done when: `node /tmp` style audit shows none at 1640, 1280, 375.
**Touches:** UI. **Conflicts:** none.
### S2. Daily book pages that fit
**Pitch:** the Daily book entry pages (about 1000px tall at 1280) still scroll; split long entries across pages like the Shelf does.
**Brief:** Goal: paginate `src/ui/dailyBook.js` entries so no page needs a bar. Done when: no scroll on any Daily spread at 1280x800 and 375x667.
**Touches:** UI. **Conflicts:** #189.
### S3. Short-window layouts
**Pitch:** phone landscape (667x375) still scrolls on Shelf/Stats pages; give those a compact layout.
**Brief:** Goal: a max-height:420px compact mode for menu book pages. Files: new css. Done when: no bar at 667x375.
**Touches:** UI. **Conflicts:** none.

### T1. Text size preview
**Pitch:** show the real library change as nate taps A, A+, A++ in Settings, with a one-line sample under the buttons, so he can see a size before leaving the panel.
**Brief:** Goal: a live sample line in the Settings panel that grows with `--ts`. Files: `src/ui/topbar.js`, `src/ui/textScale.css`. Done when: the sample matches the real text at each size, tested at 375 and 1280.
**Touches:** UI. **Conflicts:** `src/ui/topbar.js`.

### T2. [x] Text-size sweep in CI (PR pending)
**Pitch:** catch overlaps and clipped text at every size before nate does.
**Brief:** Goal: a smoke step that opens home, run, Shelf and Settings at normal/large/xlarge in 375 and 1280 and fails on text overflowing its box. Files: `scripts/`, `test/`. Done when: it fails on a deliberately broken label.
**Touches:** HEALTH. **Conflicts:** `scripts/smoke.mjs`.
**Shipped:** `scripts/text-fit.mjs` (+ `scripts/lib/textFit.mjs`) runs beside smoke in CI: home, Settings, Shelf and run at normal/large/xlarge in 375 and 1280, failing on clipped or off-screen text; `--selftest` proves it fires on a broken label (`test/text-fit.test.js`).
### T3. Sweep more screens for text fit
**Pitch:** extend the text-fit sweep to the result card, Stats, Sets, Daily book, Credits and the attic.
**Brief:** Goal: add scenes to `scripts/text-fit.mjs`. Done when: each fails on a broken label. **Touches:** HEALTH. **Conflicts:** none.
### T4. Text-fit sweep also catches overlapping text
**Pitch:** flag two text boxes that overlap, not just clipped text.
**Brief:** Goal: pairwise rect overlap check in `scripts/lib/textFit.mjs`. **Touches:** HEALTH. **Conflicts:** none.

### FH1. Fireside home [x] (PR pending)
**Done:** nate picked "B with a C background": stone fireplace between the stacks with grate, logs, live flames (lean from the cursor, click to stoke), book piles, streak candles on its mantel, brick back wall, firelit room light on the shelves (`src/ui/hearth.{js,css}`). Mockups: `screenshots/fireplace-home/`.
**Follow-ups:** FH2 fire sounds, FH3 a fire that remembers you, FH4 room for the hearth on short phones and portrait tablets. **Conflicts:** `src/ui/home.css`, `mantel.css`.

### FH2. Fire sounds
**Pitch:** a soft crackle loop that swells when you stoke the fire, an ember pop now and then, silent when sound is off or the tab is hidden.
**Brief:** Goal: `src/sound/hearth.js` on the existing sound bus, gain tied to the fire's intensity (`fireIntensity`). Done when: stoke is audible, the loop is seamless, mute works.
**Touches:** FEEL. **Conflicts:** `src/ui/hearth.js` (one hook).

### FH3. A fire that remembers you [x] (PR #254)
**Pitch:** the hearth reflects your play: it burns higher with your streak, and the sparks take your last book's tier colour (aqua after an Apocrypha).
**Brief:** Goal: read streak and last tier from the save (no new fields), map them to flame height and spark tint. Done when: a 0 streak shows a low fire, a long streak a roaring one.
**Touches:** MECHANICS, UI. **Conflicts:** `src/ui/hearth.js`.

### FH4. Hearth on short phones and portrait tablets [x] (PR #254) (compact room: stacks, gaps and title a size down so the fire and the Daily and Unlimited spines fit at 375x667 and 800x900)
**Pitch:** at 375x667 and around 800 wide the home has no spare height, so the fireplace is skipped; give it a compact form there (a low fire under the mantel, stacks a size down).
**Brief:** Goal: a compact `planFlow` that fits 80-100 px by shrinking the mantel's headroom and the stack books. Done when: a fire shows at 375x667 and 800x900 with nothing overlapping or sinking behind the ledge.
**Touches:** UI. **Conflicts:** `src/ui/hearth.js`, `homeLayout.js`.

### FH5. Fire that remembers the day
**Pitch:** the fire also reads the time of your last play: banked embers and a lower glow when you return after days away, a fresh flare the first visit of a new Daily.
**Brief:** Goal: use the last Daily key in the save (no new fields) to drive a "banked" start (low flames, ember glow) that builds to the streak height over a few seconds. Done when: a 5-day absence shows banked embers and a streak of 0 stays low. **Touches:** MECHANICS, UI. **Conflicts:** `src/ui/hearthMood.js`, `src/ui/hearth.js`.

### FH6. Tier-tinted room glow
**Pitch:** after a Grimoire or Apocrypha the room light carries a faint tier tint along the hearth edge, not only the sparks.
**Brief:** Goal: tint the `hl-glow` edge layer with the last tier colour at low strength, never washing the shelves. Done when: aqua after an Apocrypha is visible but subtle at 1280 and 375. **Touches:** UI. **Conflicts:** `src/ui/hearth.css`, `src/ui/hearth.js`.


## G. Goal-level polish menu (2026-11-05, from a play-through at 1280 and 375 plus nate's repeated asks)

- [x] Attic floorboards and first-row room (nate 2026-11-05): fixed floorboard pattern, row 0 pulled back, one-row-per-step settle. Conflicts: atticRoom.js, world.js.
Broader than pixel fixes: each item is a goal to make the base game clearer, more fun and more finished. Nothing here builds zones or topic rooms; G10 only leaves a door for them. Play-through note: the sandbox could not download the full judge, so scores seen were the quick judge's (a decent answer for "tempt" scored 0).

### G1. A first run that explains itself
**Serves:** easy to understand, concise and mysterious copy, integrated not bolted on.
**Pitch:** A new player meets the timer, Enter, hints, skip and tiers with no word of explanation; Descend, Daily, Unlimited and Practice all look like "play". Teach inside the world, once: a single handwritten margin line appears the first time each thing matters (the candle the first time it burns low, "Enter" under the slip, the hint slip the first time you tap it), then never again.
**Brief:** Goal: contextual first-time notes, not a tutorial screen or pop-up. Flag each in additive `S.seen.*`. Files: new `src/ui/firstNotes.js` plus css, one hook in `showWord`. Done when: each note shows once, reduced motion shows it static, Daily timing is not changed by it, 14-letter word and 375 checked.
**Touches:** RUN, HOME. **Conflicts:** run screen thread, 29 (welcome).

### G2. A score that explains itself
**Serves:** scoring clarity, rarity is the hero, words fully readable, lenient judging.
**Pitch:** The card says "Pamphlet, 0/100" and a vague line like "Nothing here points at the meaning yet", but not why. Show it: in "You wrote" underline the words the judge counted, and add one quiet handwritten caption saying what a stronger answer would have named. A long answer must never be cut with an ellipsis ("somethin…" today).
**Brief:** Goal: surface the judge's matched concepts/relations in the card, no scoring change. Files: `src/ui/alsoAccepted.js`, `src/app/card.js`, judge result already carries hits. Done when: matched words are underlined, caption is under 12 words, "You wrote" wraps fully or scrolls under a fade (never ellipsis), rarity stays the hero.
**Touches:** RESULT, JUDGE. **Conflicts:** N20 follow-ups, 104.

### G3. [x] The judge never decides your Daily unfairly (done, PR pending)
**Serves:** honest answers, lenient judging, Daily is its own thing.
**Pitch:** When the full judge cannot load the "quick judge" quietly scores sensible answers 0 and those scores still write to the Daily, the streak and the Shelf. A bad connection should not cost a streak or a permanent Pamphlet.
**Brief:** Goal: decide and pin one policy (recommend: Daily waits for the full judge with a written "the librarian is still arriving" line and Unlimited/Practice may use the quick judge, marked in the book as rough). Also the first-visit download (about 23 MB) should read as part of the world, not a grey status line, and never block typing. Files: `src/ui/judgeLabel.js`, `src/scorer/*` facade, `src/app/daily.js`. Done when: tests pin the policy, Daily cannot be scored by the fallback.
**Touches:** JUDGE, DAILY. **Conflicts:** Daily fairness, judge accuracy threads.

### G4. Hints and skip as one understandable object
**Serves:** easy to understand, handwritten, integrated.
**Pitch:** The button reads "HINT: IN A SENTENCE (FREE, ONCE PER RUN) · 3 LEFT", then "NO MORE HINTS" and "SKIP (HINTS WASTED)", and the hint slip ends with "keep (something, such as…". Too many rules in capitals. Make it one thing: a written "Hint" word with three small pips for what is left, the free one drawn differently, skip as a written word whose cost is shown by the object, and hint text never ellipsized.
**Brief:** Goal: collapse hint/skip labelling into a pips-and-handwriting control; the rules live in the Library Rules card. Files: `src/ui/hintSlips.js/.css`, run hooks. Done when: no label over 3 words, hint slip fits its full text at 375 and 1280, keyboard hints unchanged.
**Touches:** RUN. **Conflicts:** hints thread, Q2 phone run.

### G5. Time you can feel at a glance
**Serves:** objects not numbers, spacing, smooth and physical.
**Pitch:** Time is shown three ways: a small "0:43" under the word, the candle far left, and the candle's flicker. Pick the object. Keep the candle as the clock, put it where the eye already is (beside the slip), and keep the numeral only when text size or accessibility needs it.
**Brief:** Goal: one time source with a clear read from 2 m away. Files: `src/ui/candle.js`, run css. Done when: seconds are readable without the numeral, last 10 s unmistakable without red, phone layout keeps the candle beside the slip.
**Touches:** RUN. **Conflicts:** run screen thread, candle timer.

### G6. A run that builds a story (DONE, see PR)
**Serves:** persistent world, rarity is the hero, fun.
**Pitch:** Seven words are seven separate events, and the progress diamonds are plain. Let each finished word leave its book as a spine on a small ledge in the alcove (its tier colour) so by word 7 you can see how the run went, and so the final ledger already has its cast. The combo chain sits on the same ledge.
**Brief:** Goal: replace the diamonds with a growing row of earned spines; no new numbers. Files: new `src/ui/runLedge.js`, hooks in `showWord`/`finishRun`. Done when: row matches the finished books, skipped words show a gap, reduced motion drops the slide-in, no overlap with the depth rail on phones.
**Touches:** RUN, RESULT. **Conflicts:** 32 chain, Q5 final ledger.

### G7. The way on after a run
**Serves:** fun, easy to understand, fewer menu books.
**Pitch:** After a descent the player lands on a ledger and a Back word. The next step (one more run, today's Daily, or look at the books I missed) should be one written choice on the page, not a trip home. Missed words become a short "to read again" page with their definitions.
**Brief:** Goal: two or three handwritten next-step words on the final page, chosen by state (Daily unplayed, Daily played, streak at risk). Files: `src/app/final.js`, `src/ui/finalPage.css`. Done when: each state is tested, nothing outlined, Copy and Back unchanged.
**Touches:** RESULT, HOME. **Conflicts:** Q5, 28.

### G8. [x] Home knows what you should do next (this PR)
**Serves:** easy to understand, fewer menu books, spacing.
**Pitch:** Descend always means today's Daily, even after it is played, and "Unlimited Placement" on a spine is unexplained. Make the plaque honest: unplayed Daily says so, played Daily turns Descend into your Unlimited level. Fold Practice into the Daily book as a section on the same two pages, as the riddle already was.
**Brief:** Goal: contextual plaque and spine text (backlog 28 covers resume), and one fewer menu book (Practice as a Daily section, same pages). Files: `src/ui/home.js`, `src/ui/dailyBook.js`, `src/app/home.js`. Done when: five books on the stacks, plaque tested in unplayed/played/mid-run states, no spine text clipped at 375.
**Touches:** HOME. **Conflicts:** 28, merged-modes follow-ups, any home thread.

### G9. [x] A level you can see and trust (PR pending)
**Serves:** objects not numbers, mechanics clarity.
**Pitch:** Unlimited promises words "matched to your level" but the 8-word placement feels abrupt and the Lexicon number is hidden. Make the level an object (a rank on the Librarian's Card, a bookmark that moves) and the placement a short interview at the desk, with a visible "your level changed" moment after a run.
**Brief:** Goal: show the Lexicon as one hand-lettered rank, explain placement in one line before it starts, add a re-placement option, and a quiet level-change line on the final page. Files: `src/core/unlimited.js` (read only), `src/ui/home.js`, final page. Done when: rank text is tested for each band, no new numbers beyond the existing Lexicon.
**Touches:** HOME, RESULT, MECHANICS. **Conflicts:** difficulty thread, G7, G8.

### [x] G10. Leave a door for zones and topic rooms
**Serves:** planned zones, topics and levels; integrated not bolted on.
**Pitch:** Floors, decks and rooms will all be "a place with its own words". Give them one registry now so a new zone is data, not code, and decide where its door lives (a doorway in the niche, a section of the Unlimited book) so nothing is retrofitted. Content is out of scope.
**Brief:** Goal: a single `places` registry (id, name, floor art key, word filter, unlock rule) read by the picker, floors, shelf bays and Almanac; default place unchanged. Files: new `src/core/places.js`, picker and floors read it. Done when: output with only the default place is byte-identical in tests, saves untouched, one test adds a fake place and sees it in picker and bays.
**Touches:** CORE, WORLD. **Conflicts:** 35 topic decks (do together), word pool thread.

**Done (PR pending):** `src/core/places.js` registry (default place `deepstack` owns the six floors; `registerPlace` appends a place's floors to FLOORS so bays, Almanac, tracker and ambience see them; word filter and unlock rule fields; door location not yet decided, see G11). Test `test/places.test.js`. Nothing visible changes.

### G11. Pick where a zone's door lives
**Serves:** planned zones; integrated not bolted on.
**Pitch:** G10 left the registry; now choose and build the door: a doorway in the niche or a Zones page in the Unlimited book listing `unlockedPlaces`, with locked ones shown as unlit.
**Brief:** Goal: UI for `places()` with unlock hints. Files: new `src/ui/zonesDoor.js` plus css, one hook in home. Done when: only the default place shows no door.
**Touches:** HOME. **Conflicts:** 35 topic decks, home threads.

### G12. Run words from a place's filter
**Pitch:** Make Unlimited and Practice draw from `placeWords(place, WORDS)` so a topic room is only data.
**Brief:** Goal: pass the active place into `pickWord` callers; default unchanged. Files: `src/core/level.js`, `unlimited.js`. Done when: tests prove the default pool is untouched.
**Touches:** CORE. **Conflicts:** word pool thread.

### G9a. Rank on the Librarian's Card
**Pitch:** The rank now lives in the Unlimited book; put the same hand-lettered rank on the Librarian's Card so it follows you home.
**Brief:** Goal: show `rankFor(lexicon)` on the card via `src/ui/lexiconRank.js`. Done when: tested per band. **Conflicts:** welcome.js, G7.

### G9b. Rank-up moment
**Pitch:** When a run crosses a band, give the final page one small ink-stamp beat instead of only a line.
**Brief:** Goal: stamp animation on `.lx-change` when `rankIndex` rises, reduced-motion safe. **Conflicts:** results.js.

### G6a. Ledge spines open the book
**Pitch:** The spines in the run row are only for show; tapping one could peek its answer, like the alcove ledge does.
**Brief:** Goal: make `.runledge .spine` focusable with the same tip as `ledgeTip`. Files: `src/ui/runLedge.js`. Done when: keyboard and hover show word, tier and score.
**Touches:** RUN. **Conflicts:** G4, G5.
### G5. Time you can feel at a glance [x] (candle is the one run clock, PR pending)
**Follow-ups:** G5a. Let the candle's wax drip a bead at each 10 s ring so crossing a ring is a small physical event (reduced motion: no bead). Conflicts: `src/ui/candle.css`. G5b. A "show the seconds" toggle in Settings for people who want the numeral back (the screen-reader text is already there). Conflicts: settings, `src/ui/candle.js`.
### R6. Cover sounds per closure
**Serves:** rarity is the hero, sound lines up with motion.
**Pitch:** each cover now comes undone its own way (tape, twine, strap, clasp, seal, chain, seam) but the audio is still one paper sound.
**Brief:** Goal: one cue per closure (tape rip, cord slip, buckle, brass click, wax crack, chain rattle, shimmer) timed from `cover.lock`/`cover.delay`. Files: `src/ui/revealRecipes.js`, `src/feel.js`. Done when: tests pin cue time against `cover.delay`. **Touches:** reveal, sound. **Conflicts:** R3.

### R7. Covers on the shelf and in the almanac
**Serves:** everything is a book, integrated.
**Pitch:** the seven closures could also show on closed books you tap on the shelf and as the tier key in the almanac, so a book's rarity is readable before it opens.
**Brief:** Goal: reuse `coverLockHTML(style)` on shelf cards and almanac tier swatches. Files: `src/ui/coverLock.js`, shelf and almanac modules. Done when: 375 and 1280 screenshots. **Touches:** HOME, card. **Conflicts:** 16.

### R8. Reopen a book you already have with its cover
**Serves:** physical, rarity is the hero.
**Pitch:** opening an old book from the shelf skips the closure; let it play a short, quiet version of its tier closure instead.
**Brief:** Goal: in `openCard` non-fresh path, play the lock at half speed without particles. Done when: reduced motion shows no closure. **Touches:** card. **Conflicts:** 16.
### G5. Time you can feel at a glance [x] (candle is the one run clock, PR pending)
**Follow-ups:** G5a. Let the candle's wax drip a bead at each 10 s ring so crossing a ring is a small physical event (reduced motion: no bead). Conflicts: `src/ui/candle.css`. G5b. A "show the seconds" toggle in Settings for people who want the numeral back (the screen-reader text is already there). Conflicts: settings, `src/ui/candle.js`.
### LM4. [x] (this PR) The run candle really lights the room
**Serves:** pattern 8 (immersion), pattern 5 (mysterious, believable light).
**Pitch:** The candle's glow was a gradient inside the answer box and ended in a hard line at the alcove edge. It is now a canvas light that spills over the frame, ledge, shelves and books, fading with distance, and registers with the dark pass.
**Brief:** Done: `src/ui/candleLight.js`, hooks in `world.js` and `runScreen.js`, DOM halo removed in `candle.css`. Test: `test/candle-light.test.js`.
**Touches:** WORLD, UI. **Conflicts:** G5 (candle as run clock).

### LM5. Shadows for the candle
**Pitch:** The light should be blocked by things: the slip, the open book and the hanging lanterns throw soft shadows across the wall.
**Brief:** Goal: darken a few soft shapes on the glow using the slip and lantern rects. Files: `candleLight.js`. Done when: moving the slip changes nothing visible but the wall shows a faint shadow, no extra cost. **Touches:** UI. **Conflicts:** G5.

### LM6. Lantern light spills out of the alcove too
**Pitch:** Same treatment for the two alcove lanterns: their glow should reach the frame and the shelves beside the alcove, not stop at the alcove edge.
**Brief:** Goal: audit `lanterns.js` glow radius against the frame and widen with falloff. Files: `lanterns.js`. Done when: no visible edge at 1280 and 1640. **Touches:** UI. **Conflicts:** none.

### UB1. [x] (this PR) Unlimited book: one clear way in
**Pitch:** The Unlimited page now leads with a big Descend button (Find my rank the first time), the rank above it, and "Place me again" as a quiet second choice.
**Brief:** Goal: keep the main action visible on every sectioned page at 1280, 1640 and 375. Files: `src/ui/home.js`, `src/ui/lexiconRank.css`. Done when: no `.bs-start` sits below `.pg-in`. **Touches:** UI. **Conflicts:** none.

### UB2. [x] Unlimited book: show the Lexicon climbing (PR pending; `src/ui/lexiconTrend.js`, pen line under the rank, last 12 runs)
**Pitch:** The right-hand page of the Unlimited book could draw the last few runs as a small pen line so the rank feels earned.
**Brief:** Goal: sparkline from `S.rating.hist` on a notebook page, no new numbers. Files: new `src/ui/lexiconTrend.js`. Done when: it reads at 375. **Touches:** UI. **Conflicts:** none.

### UB3. Riddle half gets its own weight
**Pitch:** The Riddle section is a plain twin of Unlimited; give it a small sketch and a best-streak line.
**Brief:** Goal: one hand-drawn sketch plus a stat line on the Riddle page. Files: `src/ui/home.js`, new css. Done when: both pages feel balanced. **Touches:** UI. **Conflicts:** UB2.
### AE1. [x] (attic entrance PR) The attic entrance is a ceiling hatch, not a pill
**Pitch:** Centred trapdoor with a pull cord; the brass tag carries the book count.
**Brief:** Done in `src/ui/atticHome.js` + `attic.css`.

### AE2. [x] (PR pending) The hatch creaks open and the room lights up as you climb
**Pitch:** On click the lid swings down, a shaft of warm light falls onto the home panel and the cord is pulled for real, then the climb starts.
**Brief:** Goal: sequence lid, light shaft and cord tug (motion tokens) before `World.setAttic(true)`. Files: `atticHome.js`, `attic.css`, a short sound hook. Done when: reduced motion skips straight to the climb. **Touches:** UI. **Conflicts:** attic climb threads.

### AE3. [x] (PR pending) A matching way down: the ladder drops from the same hatch
**Pitch:** Replace the "Down the ladder ↓" plaque with a rope ladder hanging from the hatch you came up through, so exit and entrance are one object.
**Brief:** Goal: draw the ladder at top centre while up there, click or Escape to descend. Files: `atticHome.js`, `attic.css`. Done when: keyboard and swipe paths unchanged. **Touches:** UI. **Conflicts:** attic floor/rows thread.



### AE4. The hatch closes behind you and the cord settles
**Pitch:** Coming back down, the lid swings shut on its hinge and the cord swings to rest as the home panel returns. **Files:** `atticHome.js`, `attic.css`. **Conflicts:** attic climb threads.

### AE5. Creak and rope sounds for the hatch and ladder
**Pitch:** A soft wood creak as the lid opens and a rope rustle as the ladder drops, on the shared sound bus. **Files:** new `src/sound/atticSounds.js`, hook in `atticHome.js`. **Conflicts:** sound threads.

### BS1. Page-turn sound and paper shadow that follow the leaf
**Pitch:** The leaf already flips smoothly; make it feel like paper by shading the page beneath as it lifts and adding a soft rustle that follows the turn speed.
**Brief:** Goal: tie a moving shade on the pages under `.bs-flip` to the same keyframes (opacity only) and call the existing flip sound at the lift, not the end. Files: `src/ui/pageFlip.css`, `src/ui/home.js` (turn). Done when: filmstrip at 375 and 1280 shows the shade tracking the leaf. **Touches:** UI. **Conflicts:** `home.js` (book thread).

### BS2. Switch books without going home
**Pitch:** Today you close a book and pick another from the stack. A bookmark tab on the open book's edge for each sibling would swap one book for the next in a single turn.
**Brief:** Goal: ribbons or tabs on the spread that cross-fade pages (pre-built like the open) and re-colour the board. Files: `src/ui/home.js`, new `src/ui/bookTabs.js`. Done when: switching Shelf to Sets never shows the room. **Touches:** UI, UX. **Conflicts:** `home.js`, Unlimited pages thread.


### PF1. [x] (PR pending: Shelf, Daily and Stats books lazy; first-paint JS 407 to 383 KB, CSS 249 to 228 KB; more screens to follow) Split the CSS and JS that only some screens need
**Pitch:** Home loads 248 KB of CSS (49 KB gzip) of which only about a fifth is used on the first screen, plus the whole app JS (407 KB). Load attic, sets, almanac and book-page styles and code only when you first go there, so the first paint arrives sooner.
**Brief:** Goal: dynamic-import per-screen modules and their CSS from a thin hook, keeping cascade order (append, do not reorder `src/styles/index.css`); prewarm in idle after first paint so opening never waits. Files: new `src/ui/lazyScreens.js`, small hooks in `src/main.js`. Done when: `scripts/loadpath.mjs` shows fewer bytes before first paint and every screen still opens instantly. **Touches:** Performance. **Conflicts:** `main.js` imports (do when few threads are in flight).

### [x] PF2. Pre-draw particles, sprites and fonts before first use (PR TBD: `src/ui/prewarm.js`, glow defs shared in `glowDefs.js`)
**Pitch:** The first time a candle, dust or reveal burst appears it builds its sprites then. Draw them into small offscreen bitmaps during idle after first paint so the first burst is as smooth as the hundredth.
**Brief:** Goal: audit sprite and gradient creation inside frame callbacks (`world.js`, `revealFx.js`, `ambient.js`, `lanterns.js`) and move it to a one-time idle prewarm; also `document.fonts.load` for the Anthropic Serif weights the alcove uses. Done when: `?perf` shows no long frame in the first 3 s after Descend. **Touches:** Performance. **Conflicts:** `world.js` owners.

### PF2b. Prewarm the per-frame gradients that are not sprites
**Pitch:** The wall, row and settle-glow gradients in `world.js` are still rebuilt every frame; PF2 only covered the cached glow sprites, lighting map and fonts.
**Brief:** Goal: cache the remaining per-frame `createRadialGradient`/`createLinearGradient` calls (world.js settle glow, floorAtmosphere, thresholds) as small sprites, prewarmed in `prewarm.js`. Done when: `?perf` p95 drops on a real GPU. **Touches:** Performance. **Conflicts:** `world.js` owners.

### PF2c. First-descent frame report
**Pitch:** Nobody can see whether the first 3 s after Descend are smooth without a trace; add a tiny `?perf` line that reports the longest frame in the first 3 s.
**Brief:** Goal: extend `src/ui/perfStats.js` to track max frame time for 3 s after Descend and show it in the `?perf` panel. Done when: panel shows it and a test pins the maths. **Touches:** Performance. **Conflicts:** `perf.js`.

### PF3. Smaller word list
**Pitch:** `words.json` is 2.2 MB (691 KB gzip) and loads on every visit before the Daily can start. A compact columnar format, or dropping fields the game never reads, would cut it a lot.
**Brief:** Goal: shrink the file (see backlog item 80) and keep `loadWords()` output identical; the service worker (#243) then caches it. Done when: tests pass unchanged and gzip size drops. **Touches:** Performance, data. **Conflicts:** `scripts/build-words.mjs`.


### UB4. Mark the rank bands on the Lexicon pen line
**Pitch:** The pen line under the rank shows direction but not what a rise means; faint ticks where Bookworm, Wordsmith and so on begin would let a player see the next rank approaching.
**Brief:** Goal: up to two faint hand-lettered band ticks on `lexiconTrend.js`, no new numbers. Files: `src/ui/lexiconTrend.js`, `lexiconTrend.css`. Done when: still reads at 375. **Touches:** UI. **Conflicts:** none.

### UB5. Tap the pen line to see a run
**Pitch:** Let each dot on the Lexicon line open the run it came from (date, words, books), so the climb is a trail back through the shelf.
**Brief:** Goal: tappable points showing date and Lexicon, link to Almanac page. Files: `lexiconTrend.js`, `statsPages.js`. **Touches:** UI. **Conflicts:** Almanac tap-through (B).

### PF4. Lazy attic, curios and lore code
**Pitch:** PF1 moved the three menu books out of the first-paint bundle; the attic room, lore books and curios (and their CSS) are the next biggest chunks nobody needs before scrolling or opening a book.
**Brief:** Goal: same pattern as `src/ui/lazyScreens.js` for the attic climb/room and `initLore`/`initCurios`, prewarmed in idle. Done when: `scripts/loadpath.mjs` shows fewer bytes before first paint and the attic still opens without a wait. **Touches:** Performance. **Conflicts:** `main.js` imports, attic threads.

### P1. Settings book gets a page of its own for each topic
**Pitch:** Settings and Credits now open as books; the right page of Settings is half empty. Give Sound, Display and Accessibility a written page each, with the Almanac-style margin notes.
**Brief:** Goal: split `settings` body into themed spreads in `src/ui/panelBook.js`/`topbar.js`, add page-specific margin notes. Done when: phones step page by page, reduced motion unchanged. **Touches:** topbar. **Conflicts:** 7, 9.

### P2. Keys and Help as a book on the desk
**Pitch:** The keyboard-help panel (and any future confirm dialogs) should also grow out of a book, not a bare box.
**Brief:** Goal: reuse `openPanelBook` for the keys panel and the Export/Reset dialogs. Files: `panelBook.js`. Done when: no panel fades in bare. **Conflicts:** 104 follow-ups, save-manager threads.

### G8a. Mid-run Continue shows the word on the plaque
**Pitch:** Home now says "Continue · word 4 of 7" on the Descend plaque when a Daily is in progress; the answer you already wrote could show too, as a faint pen line, so resuming feels like picking up a pen.
**Brief:** Goal: after backlog 28, show your last written answer under the Continue plaque. Files: `src/ui/homePlaque.js`, `src/app/home.js`. Done when: tested for 0, 3 and 6 results. **Touches:** HOME. **Conflicts:** 28, home threads.

### G8b. Phones show the menu books [x] (PR #254)
**Pitch:** At 375x667 the hearth plus plaque push the Daily/Unlimited spines below the fold; only Shelf peeks in, so the Practice section and the spine badges (done / resume / Lexicon) are easy to miss on a phone.
**Brief:** Goal: a phone layout that keeps the two play spines visible under the plaque. Files: `src/ui/hearth.js`, `src/styles/home-plaque.css`. Done when: 375x667 screenshot shows Daily and Unlimited spines. **Touches:** HOME. **Conflicts:** FH4 (no hearth at small sizes), any home thread.

## V. Audit menu 2026-11-06 (fresh run of main at 375x667, 1280x800, 1640x900; screenshots in screenshots/audit/r2-*.png)

### V1. [x] Small visual bugs from the audit (one PR, fixed in this PR)
**Pitch:** Five rough edges a player sees in the first minute. (a) Result card foot reads "+21 FT · 21 FT" (the same number twice) and ends "6/100•" with a dangling bar. (b) On the Shelf book at 1280 the "turn the page" note overlaps the bottom of the Hardbound bay. (c) On the 375 run screen the slip placeholder "In your own words…" wraps to three lines. (d) In the attic the "Down the ladder" label sits to the right of the two cords. (e) Placeholder grey on the cream slip is low contrast.
**Brief:** Files: `src/app/card.js`, shelf book css, `src/ui/atticHome.js`, run slip css. Done when: 375/1280 screenshots show each fixed, text-fit sweep still passes. **Touches:** card, shelf, attic, run. **Conflicts:** 16, 91, G14.

### V2. Phone run screen that uses the width
**Pitch:** At 375x667 the slip is narrow with the candle squeezed beside it, the depth pill crowds the top bar, and the floor rail hugs the left edge with its cap clipped. The run screen is the game; on a phone it should feel as roomy as the desktop alcove.
**Brief:** Goal: slip full width, candle moves to the alcove ledge below or beside the Hint/Skip row, depth pill sits clear of the top bar, floor rail becomes a slim tab that expands on tap. Files: run/alcove css, `src/ui/floorRail.js`. Done when: 375x667 and 360x640 screenshots, keyboard open still leaves the slip visible. **Touches:** RUN, MAIN css. **Conflicts:** 142, 22b, LM4.

### V3. Floor rail that gets out of the way
**Pitch:** On desktop the Stacks-to-Abyss rail sits on top of the left shelves at all times and its first dot is cut by the window edge. It should be a slim brass tab that unfolds when you hover it or when you cross a floor.
**Brief:** Files: floor rail css/js. Done when: closed it is a 28px tab fully inside the window, opens with the shared motion curve, reduced motion shows it static. **Conflicts:** V2, D2, F1.

### V4. A new save's home says nothing yet, in the world's voice
**Pitch:** A fresh Librarian's Card shows rings that read as the letter O ("Deepest O ft") and the Daily book says "0 of 4 played" and "0 day streak". First impressions should read as an empty ledger waiting for ink.
**Brief:** Goal: zero states in handwriting ("not yet", "no descents", "the first line is yours"), ring glyphs only for real zeros after play. Files: `src/ui/ledger*.js`, daily book page 1. Done when: fresh-save screenshots at 375/1280. **Touches:** HOME, DAILY. **Conflicts:** Q7, G1, H3.

### V5. Shelf book: search first, controls second
**Pitch:** The left page packs Sort (6 options), Bay (6), Show and Rarity under the search line. It is a settings form on paper. Keep "Find a word" and the rarity dots; fold Sort and Bay into one pen-written "arrange by..." line that opens a small slip.
**Brief:** Files: shelf book page builder. Done when: left page has at most two rows of controls at rest, every current option still reachable by keyboard, tests updated not deleted. **Conflicts:** 11, 82, 83.

### V6. A bookplate to share
**Pitch:** The share text is fine (no emojis, nate's rule) but the Daily deserves a shareable picture: a pen-written bookplate with the date, the seven tier spines and the depth, rendered on a canvas.
**Brief:** Goal: "Copy bookplate" next to "Copy result" on the Daily final screen; text stays the default. Files: new `src/ui/bookplate.js`. Done when: PNG at 1080x1350, no emojis, works offline, test checks the canvas size. **Touches:** final screen. **Conflicts:** G7, 28.

### V7. [x] Floors that change how a word feels (not just how it looks)
**Pitch:** Floors already change the room. Let each one also change one small rule so descending feels different, ready for the topic zones: Catacombs candle burns a little faster, the Sunken Vault smears the ink of the word's first letters until you type, the Hollow whispers an extra hint after skipping.
**Brief:** Goal: one optional modifier per floor, shown as a line on the floor door, off for the Daily so it stays fair. Files: new `src/core/floorRules.js`, hook in `run.js`. Done when: tests pin each modifier, Daily unaffected, Settings can turn them off. **Conflicts:** G10, G11, F1, 142.

### V8. Streak ribbon (one save per week)
**Pitch:** A missed day deletes a long streak, which punishes a casual player. A ribbon bookmark you earn after seven straight days lets one miss slide, and it is shown on the Card.
**Brief:** Files: `src/core/streak.js`, Card. Done when: tests for miss with and without ribbon, additive save field `ribbon`, wording on the Card. nate decides whether to ship it (it softens the streak). **Conflicts:** R2 stamps, H3.

### V9. One sound language
**Pitch:** Sound is off by default and the open sound items are many small threads (door stings, hatch creak, ladder rungs, page turns, fire, cover thuds). One pass would give them a single set of recipes so nothing sounds like a different game.
**Brief:** Goal: a sound palette doc (materials: paper, leather, wood, stone, brass) and every open sound item built from it. Files: `src/sound/`. Done when: every UI motion has a sound mapped, mute and quality settings respected. **Conflicts:** FH2, AE5, AT3, D1a, D1b, 103, BS1, R6, N9b.

### V10. Keyboard and screen reader pass (done: #258 shortcuts, K1/K2 follow-up)
**Pitch:** The world is rich but tiers are told mainly by colour, pen text sits on cream at low contrast, and focus rings are not checked across the books and the attic.
**Brief:** Goal: audit with the a11y test plus a manual keyboard walk: visible focus ring everywhere, tier name always in text, contrast at 4.5:1 for handwritten body text on paper. Files: styles, `test/a11y.test.js` additions. Done when: report of findings fixed. **Conflicts:** T-series, any css thread.

### V11. [x] Duplicate model code in the build (PR pending: one transformers.js copy, warning silenced on purpose; first-paint bytes were already lazy for the model, so the win is deploy size; main chunk 392 KB is spread thin, see V15 below)
**Pitch:** `dist/assets` holds two identical-size copies of transformers.web (579 KB each) next to a 392 KB main chunk and 235 KB css. The first load is heavier than it needs to be, and the Vite chunk-size warning is on every build.
**Brief:** Goal: share one chunk between the worker and the main thread or load the judge only when a run starts; add manualChunks. Files: `vite.config.js`, `src/scorer/*`. Done when: build warning gone or silenced on purpose, `?perf` first-load numbers before and after. **Conflicts:** PF1, PF2, 39.

### V12. Three hundred books
**Pitch:** The shelf caps at 300 books but every test seeds a handful. Shelf, attic and Sets with a full save are the place a polished game can quietly stutter.
**Brief:** Goal: a seeded 300-book save in the snapshot and perf scripts, fix whatever is slow (shelf render, attic piles, search). Files: `scripts/perf.mjs`, `test/`. Done when: numbers in the PR, no jank over 50 ms. **Conflicts:** PF1, AT13.

### V13. [x] (PR #262, narrow fix: a synonym that is part of another listed synonym is hidden; part-of-speech formatting untouched) Judge shows an unrelated sense of a related word
**Pitch:** For "cabaret" the card's "Also means" lists "club: a heavy object, often a stick..." because nightclub contains "club". That is a bad look on a screen that is supposed to teach.
**Brief:** Goal: only show related-word senses that share a relation with the target (synonym or hypernym link), cap at two, and give every line the same part-of-speech format ("noun" tag on all or none). Files: `src/scorer/`, card block. Done when: test with cabaret, bank, bark. **Conflicts:** J2, 91, 92, 93.

### V14. A judge fairness report
**Pitch:** The judge is the heart of the game and nate cannot see its mistakes. A script that runs 300 wrong, vague and right answers across the Daily pool and writes a table of surprises (wrong word scores 40+, good answer under 20).
**Brief:** Files: extend `scripts/judge-bench.mjs`, output to `notes/judge-report.md`. Done when: runs offline in under a minute, top 20 surprises listed with words. **Conflicts:** J3, G3.

### X1. Librarian's Card floor line overflows the card (bug)
**Pitch:** With a saved depth the Card's "Floor" line wraps "The Sunken Vault" onto three handwritten lines that run past the bottom of the card at 1640 (screenshot audit/r3-s-home-1640.png).
**Brief:** Goal: floor names fit the card at every width: shorter pen size or a two-line cap with the article dropped ("Sunken Vault"). Files: Card ledger css/js. Done when: all six floors fit at 1280, 1640 and 375. **Touches:** HOME. **Conflicts:** V4, H3, R2.

### X2. Touch-aware copy and the attic hint on phones
**Pitch:** At 375 the attic footer says "scroll up to go further in" (phones swipe) and wraps to three lines on a dark band, while the "Down the ladder" label touches the lantern tag. Copy that names an input (scroll, click, Enter) should follow the device.
**Brief:** Goal: one helper that picks scroll/swipe, click/tap, and hides key hints on touch; use it in the attic hint and run hints; keep the label clear of the lantern at 375. Files: new `src/ui/inputCopy.js`, attic hint. Done when: 375 screenshot, test pins wording per input type. **Conflicts:** V10 (shortcuts), AE4.

### X3. "Close the book" belongs to the whole book
**Pitch:** In the Unlimited book the handwritten "Close the book" sits under the Riddle button on the right page, so it reads as part of Riddle. It closes both halves.
**Brief:** Goal: move it to the spread's bottom edge (or a ribbon) in every menu book so it is always in the same place. Files: book page builders, `bookpages.css`. Done when: all menu books at 1280 and 375. **Conflicts:** P1, 104 follow-ups.

### X4. A name for the ring on the Sets page
**Pitch:** The right page of Book Sets shows an empty pink ring above the set title with no label or meaning.
**Brief:** Goal: it becomes the set's sigil: empty until you finish the set, then inked in the colour of your best tier in it, with a pen caption. Files: sets book page. Done when: tested for 0, partial and complete. **Conflicts:** S1, 14.
### V15. Trim the main chunk
**Pitch:** The first paint still ships a 392 KB (151 KB gzip) main chunk and 235 KB css, spread over hundreds of small modules; the biggest are hearth.js, world.js, thresholds.js and atticRoom.js.
**Brief:** Goal: lazy-load the attic room drawing and other below-the-fold canvas code behind idle time, and split rarely used css, without changing any animation. Files: `src/world/atticRoom.js`, `src/world/world.js`, `src/ui/lazyScreens.js`. Done when: `?perf` first-load numbers drop and the smoke test passes. **Conflicts:** PF1, PF2, AT13.

### K1. Shortcuts inside the books [x] (`/` search, `?` in books; O/G/R/F chips, [ ] months, T today, Home/End and PageUp/Down pages)
**Pitch:** Home keys now open every book, but inside a book you can only turn pages and close it.
**Brief:** Goal: in the Shelf, Stats and Daily books add keys for search focus (`/`), filter chips and jumping to a date. Files: `src/ui/bookMenus.js`, `src/ui/keysCore.js`. Done when: listed in the `?` page. **Conflicts:** V10, T-series.

### K2. Contrast and focus-ring audit [x] (book muted ink 4.5:1, focus rings on books, calendar, home books, attic; real screen reader untested)
**Pitch:** Finish the rest of V10: handwriting-on-paper contrast at 4.5:1 and focus rings across the attic and books.
**Brief:** Goal: a manual keyboard walk plus `test/a11y.test.js` additions. Files: `src/ui/a11y.css`. **Conflicts:** any css thread.

### AT6. Attic and home transition overhaul (done, thread: attic transition)
- [x] Rows locked until the attic is fully in; one notch is one row; a down scroll turns round mid-pull or mid-climb and returns home from the first row; slim ladder (canvas and the "Down the ladder" hatch); home book rims and an eased sibling fade when a book opens. PR: attic transition overhaul.

### AT7. Sound for the hatch and ladder
**Pitch:** The cord creak, lid knock and rungs creaking as you climb, so the way in feels as physical as it looks.
**Brief:** Goal: three short Sfx hooks fired from `atticHome.js` (pull, arrive, descend). Files: `src/sound/`, `src/ui/atticHome.js`. **Conflicts:** sound threads.

### AT8. Books return to the stack
**Pitch:** After a menu book closes it should slide back into its exact slot on the stack, with the others easing forward rather than popping.
**Brief:** Goal: shared-element return flight and sibling stagger in `bookOpenFx`. Files: `src/ui/bookOpenFx.css`, `src/ui/homeBookEdges.css`. **Conflicts:** home book threads.
### V17. Floor rule on the door sign
**Pitch:** Floors now bend one rule each in Unlimited, but the line only shows once you are on the word. Let the hanging sign on each floor door say it as you walk through.
**Brief:** Goal: draw the rule's short name under the floor name on the threshold sign. Files: `src/ui/thresholds.js`, `src/core/floorRules.js`. Done when: sign shows the name only when rules are on and the mode is Unlimited. **Conflicts:** G10, F1, 142.

### V18. More floor rules for topic zones
**Pitch:** When the topic zones arrive each one should carry its own small rule, same as the floors, so a zone feels different to play and not only to look at.
**Brief:** Goal: let `FLOOR_RULES` take a zone key, plus two spare rules (a slower first letter fade, a bonus second hint). Files: `src/core/floorRules.js`. Done when: tests pin each new rule, Daily unaffected. **Conflicts:** V7 follow-ups, G11.
