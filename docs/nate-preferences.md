# What nate asks for and likes (Deepstack)

Mined from the whole project chat, 2026-11-03 to 2026-11-04 (about 60 of nate's messages). Use it to write briefs, judge finished work, and shape every menu. Append new patterns when a thread finishes (see the last section).

## 1. The ten patterns that repeat

1. **Overhaul, not tweak.** His verbs are "completely overhaul", "completely renovate", "completely rework", "it looks horrible and needs a complete polishing". Small nudges are rarely what he wants. Offer rebuilds with a clear new idea, not 2-pixel fixes.
2. **Everything is a book, a shelf or a page.** (2026-11-04 shelf: "a real library section: all those details" -> bays, brass labels, ladder, pull-a-book.) (2026-11-04 result card: "visual hierarchy is WONDERFUL" but "too boxy? should this be a mini book?" -> keep the hierarchy, change the object: leather boards, deckled page, ribbon button; no rectangles with outlines.) The menu is horizontal books in stacks. Shelf, Sets, Stats and Daily are book spreads with sections and multiple pages. Tabs are written words with a pen underline. Search is handwritten. Arrows became page-corner flips. If a new feature can be an object in the library, make it one.
3. **Handwritten, themed, sectioned.** The Daily book should "look handwritten", have sections and several pages. He asked for handwriting fonts and a type specimen. Duplicates show once with a handwritten x N. Labels are Cinzel, handwriting Fuzzy Bubbles, fine print Special Elite, body Anthropic Serif (his own font). (2026-11-04) "Daily book calendar page (this is how to select days)": the calendar is the way into a day, so tapping a day must open its entry.
4. **Words must be fully readable.** Repeated complaints: words clipped on spines ("too short"), a stretched word, the share note cut off, a judge % clipping the books. Never clip, never stretch, always check long words.
5. **Dark, mysterious, deeper is darker.** "Feel more dark and mysterious the further you get down and have sections for each." Floors need distinct identities and title banners with their own gradient backdrop. Copy should be concise and mysterious ("Descend to the depths of the library").
6. **Rarity is the hero.** (2026-11-05 audit Q6: the result ribbon and frame should show the tier material, not grey.) (2026-11-04 book art: each tier gets its own material in its true Minecraft hue; value varies, hue does not.) Result card: tier and rarity (Epic/Folio) lead, closeness shrinks to a chip, "way too much info", fix visual hierarchy. Rare tiers should feel special. 2026-11-04 reveal: \"completely overhaul the particle system on book reveal and have it load before so it doesnt have a laggy loading screen, make it much more stylized and polished while keeping it performant\" -> prewarm everything before the reveal; each tier gets its own distinct particle style.
7. **Integrated, not bolted on.** Depth tracker became part of the library (oak upright, brass plaques, lantern). Recent guesses and skipped words live in the alcove ledge. The top bar holds only Sound, Credits and Settings, library-themed, with judge status in it. Overlays should not sit on top of or behind the wrong layer (a book's menu opened behind it; fixed).
8. **Immersion through interaction.** He asked to make books clickable (then hover-only) to reveal definitions, lanterns hang from chains and react to the cursor, glow is a tight halo that doesn't clip or crowd the alcove. Hover must work during a run too. 2026-11-04 nook: "effects of the level (like the water mostly) should be separate and not affect the alcove just to maintain visual" -> clip floor effects around the alcove; he also asked for "things that live down there" and "hidden curios on the shelves". Objects must make physical sense ("why are the lanterns hanging from nothing", "floating book"). 2026-11-04 cursor: "get rid of the candle cursor and just make it light up dark spots when needed, keep normal cursor" -> never replace the system cursor; light is an effect only. (2026-11-05 fireplace: "make this a fireplace in the back and have it be a much cozier home page, with books around the fireplace and a grate, and interactive flames"; a Minecraft fireplace scene was only a lighting reference, never to copy. From three mockups he chose "B with a C background": the fire as the room's main light with lamps down, on a brick back wall. Wants mockups and a difficulty estimate before big visual builds.) (2026-11-05: while a menu book opens, nothing behind it may show through; every home thread keeps that.)
   - 2026-11-05 (candle glow): "why is there that sharp glow line where it doesn't really affect the actual structures and looks pretty unrealistic". Light must fall off softly and land on real things (frame, shelves, books, ledge); a clipped halo with a hard edge reads as fake. Check every glow for hard edges.
9. **Motion should be fast, smooth and physical.** "Open faster and more animated", "accelerate, not too fast, not sluggish", corner page flips with a bigger hit area, animated Descend plaque into the run, swing-shut close on outside click, no squeezing or sideways page peeks, no jumps between screens. (2026-11-04: wants the closing animated too, not just the opening.) (2026-11-04: asked for a candle-light cursor.) (2026-11-05 run screen: "going from this to this page should have a transition with all of the elements writing in and being a lot more smooth, not a snap" -> coming back to the alcove must write its elements in, never pop.) (2026-11-05 page flip: "the triangle in the bottom right looks pretty bad and it should be pretty obvious you can change pages" -> a flat two-tone triangle reads as a bug; corners must be soft shaded paper, and a turnable page needs visible cues. (2026-11-05 follow-up: page curls floated off and sat on the cover while the book was closed -> page furniture appears only on open pages, never during opening or closing.))
10. **Spacing and polish, said in two words.** "Fix the spacing" was asked three times (menu, caption, every screen). Balanced vertical rhythm, consistent gaps, centred layouts.

## 2. Other consistent preferences

- **Persistent world.** Scroll back through the descent. Past alcoves show word, answer and result. Today's Result replays the whole descent through its floors and ends at the result.
- **Variety over repetition.** The pulled book should come from a random shelf spot (not always the bottom middle, not floating). He dislikes duplicate rows.
- **Hints help meaning, never spelling.** "Why would it give me the first letter? I'm literally given the word." Sentence, related word, definition start.
- **Shelves everywhere.** He asked three times why the top shelves were bare. Full shelves and wall detail from the very first screen, including behind the menu.
- **Daily is its own thing.** Daily No. 1 = 2026-11-03, shown with today's date, one entry per day with 7 words, definitions and results. Reactive difficulty is Unlimited only.
- **Performance is a feature.** "Performant" appears with lanterns and scrolling. He wants costs measured before building ("determine the performance cost").
  - 2026-11-04: asked for the canvas draw budget (38) to run last, after floors, lighting and fallen books. Report measured numbers honestly, including when a change is within noise.
- **Honest answers.** He asks "is this on purpose?", "why does it look like this?", "should duplicates show?". Give the real cause and the fix, not a defence.
- **Say it once, expect it done.** When he sends a screenshot with "fix this", he expects the thread to find the cause. Repeat complaints (shelves at the top, hover on lore books) mean the first fix was not checked in the real screen. Verify with a screenshot of the exact screen he showed.
- 2026-11-04 motion: "the motion language should be for all animations and changes, make sure it's smooth and performant and all uniform" (sounds should line up with it, thread: desk sounds)

- 2026-11-04 results screen: "not spanning the whole vertical page and having to scroll, it shouldnt be like that" -> every screen must fit one view at 1280x720 and 375x667, compact instead of scrolling (pattern 10)
- Alcove vs level effects (2026-11-04): the water and other floor effects should be drawn separately from the alcove so the alcove stays a clean reading nook; "physical sanity audit" confirmed as a wanted pass.
- 2026-11-05 shelf drawers: a repeating grid of semi-transparent drawers behind the books read as repetitive and see-through. Wants such things rare, opaque and structurally integral (one solid card-catalogue cabinet now and then), never see-through layers.

- 2026-11-04 Judge: "be more forgiving based on the words, try to find relations from the input words to the definition, if so then its close" (synonym, related or definition-linked words count as close). Asked for rigorous work with before/after numbers.
- 2026-11-04 reveal recipes: "One recipe per tier reveal" -> every part of a tier's reveal (rays, rune, flash, cover, sound) should come from one table, like the particles.

- 2026-11-05 home books: items behind an opening menu book (other books, desk props) must never show through mid-animation; the alcove behind it stays empty at every frame.
- 2026-11-05 open menu book: "why is there a black box for the alcove when a book is open?" -> behind an open book the room stays lit (fire, brick, shelves); only items that would overlap the book hide, never a solid veil.

## 3. How he works

- Starts many threads at once (picked 11 menu numbers in one message) and wants them "all working in conjunction". Wants independence checked between threads.
- Gives short, bundled answers to styling questions (a numbered list of choices answered in one line). Ask 3-5 concrete questions with a recommended default, then proceed on the default.
- Likes a numbered menu he can answer with numbers, and wants it "common" and easy. Says "be extensive and expansive" for health/process work.
- Windows PowerShell user. Gives pull commands as: `git checkout main`, `git pull`, `npm run dev`.
- Reviews by playing after merge, then sends screenshots. Auto-merge is on, `check` CI required.

## 4. What he did not pick from the last menu (lower priority for now)

First-run tutorial, phone pass on new screens, sound/ambience pass (done earlier), load-time performance, save robustness, lore text, test expansion, code-structure cleanup. He chose UI, UX, mechanics and feel items. Keep those on the menu but lead with the kinds of things in sections 1 and 2.

## 5. Rules for turning this into briefs

Every brief should state: which pattern(s) above it serves, the physical object or scene metaphor, the exact screens to verify at 375 and 1280 px, a long-word case (14 letters), reduced motion, and a screenshot of the finished screen in the PR. When a brief changes a look, ask at most 3-5 styling questions with defaults, then start.

## 6. Append protocol (every thread)

When your PR merges, if nate said anything new about taste in your thread (a correction, a "don't", a "love this"), append one dated line under the matching pattern here (or add a pattern), and add 2-3 fresh backlog items implied by what he asked, using his wording. Keep entries to one line. Example: `2026-11-05 hover glow: "outline clips" -> glow must be a halo fitted to the spine (thread: lore books)`.

- Hidden things (2026-11-04): nate asked for "things that live down there" and "hidden curios on the shelves": discovery that rewards looking, tied to depth.
- 2026-11-04 curios: "i thought this was added, make it interactive and fun" -> hover-only is not enough; discoveries should respond to a click and be collected.
- 2026-11-04 handwriting (answer box): asked for quill and ink; Enter still submits, no word count (thread: quill and ink)
- 2026-11-04 handwriting: "every tab and filter as handwriting with animated pen underline" -> no pill or button chrome on book pages; Start and Close are written words too (thread: tabs and filters)
- 2026-11-04 candle timer: asked for a candle that flickers faster at the end and gutters out -> urgency is shown by the object (flame), never red flashing (thread: candle timer)

- 2026-11-04 attic: "i want the back fill to make you scroll up and for it to be an attic" -> a backfill is a place, not a silent migration: scroll up past the top of the Shelf into a dusty attic of crates (thread: attic)
- 2026-11-04 world: asked for wall mounts and a reading stand (backlog E, via 'physically makes sense') -> every hung or held object needs a visible support; nate also wants threads to keep the backlog, his to-do list and preferences updated automatically.

## Changelog
- 2026-11-04 initial version from project chat history.

- Colors (2026-11-04): nate likes Minecraft color codes as the color reference (use the actual hues: dark blue, dark red, dark green, dark aqua, dark purple, gold/orange). Variety comes from values within each item (darker edges, stripes), not muted/aged versions of the hue. Home menu books: Daily blue, Unlimited red, Practice green, Shelf aqua, Sets purple, Stats orange-brown.
- 2026-11-04 stats: wants "stats as an almanac" -> hand-drawn charts (tally marks, spines, cross-section) not UI bars (thread: almanac)
- 2026-11-04 motion: the motion language should cover all animations and changes, smooth, performant and "all uniform" -> every transition goes through the shared presets (thread: motion language)

- 2026-11-04 notes: "keep updating the refinements list, what i need to work on, and my preferences" -> every thread/audit appends to backlog, inventory and preferences automatically (thread: floor ambience)
- 2026-11-04 floors: "make each floor a chapter", "make sure to spend time on these 1 and 2, they are important" -> floors must be unmistakable with the HUD hidden: a door, sign and wall material each, not a tint (thread: floors as chapters)
- 2026-11-04 process: nate wants every thread/audit to automatically update the refinement list, his to-do list and these preferences when it finishes (thread: low-end mode)
- 2026-11-04 attic: "have that be reserved to the attic, it just shows recent guesses, while the Shelf book shows all words" -> nothing shows recent books on the main screen; the attic is the home of recent guesses, the Shelf is the complete collection (thread: attic recents)



- 2026-11-04 welcome: item 29 "no voice but ykwim, a complete overhaul of the welcome screen to be much more library like" -> UI furniture becomes library objects (index card, borrower's slip), not boxes (thread: welcome screen)
- 2026-11-04 attic: "it should be separate from the Shelf book and instead be a scrollupable room thats above the shelfs that has cobwebs, supports / beams, and look like an actual attic where books are stacked" -> the attic is a place in the world, not a panel or book page: a scroll-up room above the shelves with roof, beams, cobwebs and books lying in piles (thread: attic room)

- 2026-11-04 welcome v2: "note cards on each side should be more readable, todays result more centralized", "stylize the word Deepstack" -> pinned cards must be legible at normal size and vertically centred on the Descend/Result block; the title is a gilt wordmark, not plain serif (thread: welcome screen)
- 2026-11-04 attic: "Earlier finds should go in the attic" -> no "Earlier finds" bay on the Shelf's floor view; floorless books live in the attic (thread: attic room)
- 2026-11-04 attic climb: home clipped when going between home and attic, "refine that transition to make sure the elements stay in the alcove and the animation feels intuitive" -> DOM that lives in the world (home panel) must ride the same camera motion frame for frame, never run its own transition (pattern 9, 7; attic climb thread)
- 2026-11-04 home furniture: "fix this completely and make both the drawer and note card way more integrated and structural, have better animations, and less cluttered. complete overhaul." -> pieces on the home screen must be built into the room (wall-mounted, symmetric, visibly supported), not floating cards; fewer props; motion from the shared presets (thread: home drawer and record overhaul)
- 2026-11-04 fallen books: wants them "either way for variety" -> add physical variety broadly (leaning, toppled, stacked, open) rather than one rare gag (thread: fallen books)
- 2026-11-04 attic: "Earlier finds should go in the attic" -> floorless books live in the attic, not the Shelf; the way back to a bay is dusting them off with a pen-written floor.
- 2026-11-04 attic: asked for "all attic and home refinements" to start, so the attic should read as a lived-in room (trunks, sheeted dress form, rug, ladder hatch, swaying lantern), not an empty box.
- 2026-11-04 library rules card: "refine this note page that appears for RULES OF THE HOUSE and instead be LIBRARY RULES" -> the card is titled LIBRARY RULES and should read as a printed library catalogue card (frame, rod hole, serif type), not lined notebook paper (thread: home drawer and record overhaul)
- 2026-11-04 attic piles: "it shouldnt be as uniform, add some variety to the locations" and "weird shadow" -> no per-book shadows; vary pile height, shape and base (crates, trunks) across the attic floor.
- 2026-11-04 streak candles: picked N11 "objects not numbers" -> the streak is shown as lit candles on a mantel beside the cabinet, a break as one cold stub with a wax ring; no new number on screen (thread: streak candles)
- 2026-11-04 sigils: picked S1 + S2 -> the mark should be big on covers and a set should read as a family (shared ring, unique centre); same word, same mark everywhere.
- 2026-11-05 zero answers: a 0/100 answer keeps its book and 13 ft, "just because of the spacing the alcove" -> depth gain is alcove spacing, not a reward; do not punish misses (thread: audit Q11)
- 2026-11-05 calls to action: a handwritten button label must fit on one line; shorten the words rather than let one wrap ("Start the Riddles").
- 2026-11-04 final screen: "no outlined boxes, no empty lower half" -> results are a ledger page: tallies in ink, books on a ledge, Copy/Back as handwritten words with a pen underline (thread: Q5).
- 2026-11-05: phone run screen: words fully readable, controls must never sit under the depth rail (Q2).
- 2026-11-05 riddle hints: "it just gives the word" -> a riddle hint must never contain the answer, another form of it, or a spelling clue; sideways clues only (blanked sentence, kin, kind, opposite, near synonym). Syllable count not added: it is a length clue (#18).
- 2026-11-05 spine labels: clipped words on Shelf spines ("CONDOMI...", "ADMINISTRA...") -> no clipped or ellipsized words anywhere; shrink the type or wrap, and keep the ×N count off the label (thread: spine labels).
- 2026-11-05 attic books: flat, cartoonish, repeating piles are not acceptable -> attic books get the same detail as the Shelf (material, sigil, ageing), one book per word, clear grouping, and more rooms to scroll back through with perspective/parallax. Words are never clipped or ellipsized.
- 2026-11-05 N20: keep the also-accepted line a quiet handwritten caption under the definition; rarity stays the hero.
- 2026-11-05 menu books: "combine riddle shelf into Unlimited, making it sectioned off but still on the same two pages, it should also be Daily and Daily Riddle" -> fewer menu books; related modes are sections of one book, same two pages, not extra books.
- 2026-11-05 menu spines: "less saturation and more book spine colors, look up some and use it" -> muted, varied, real antique book-cloth/leather colours (navy buckram, oxblood, bottle green, tan calf, ochre, slate); no two menu books alike (thread: recolor home books).
- 2026-11-05 Librarian's Card: "add some more color hierarchy / variation here, also it should be Librarian's Card" -> a card of values must not be all one ink: give each row its own colour (streak ember, books tier, floor floor-colour), one dominant stat, quieter labels. The home record is "Librarian's Card" everywhere.
- 2026-11-05 scrollbars: no stray or default browser scrollbars ("it doesnt need it here and its a discrepancy"): fix the overflow so the surface fits, and where scrolling is truly needed use the slim dark one (thread: scrollbars)
- 2026-11-05 attic redo: the panoramic doorway/parallax attic and the "Found in the dust" floor pop-up were rejected as "really bad" -> scrolling up must go further into the attic through distinct sections; no pop-ups for small choices (put them on the book's own page); books should look and lie far better.
- 2026-11-05 judge leniency: "very lenient, accept general ideas, close concepts, words that relate to words in the definition, but not rewarding as much points" -> synonyms and other senses count, broad ideas earn a small score; show other definitions in the book and resize it if needed.
- 2026-11-05 text size: "fix the text size messing up all ui and not applying to a lot of things" -> the setting must reach every screen's text and layouts must adapt (no overlaps or clipping) at every size; never fix it with a page-wide zoom.
- 2026-11-05 menu spines: "make the stack read as old" -> wear (rubbed corners, faded gilt) is painted per book and static, never animated; plaque and mantel oak should match the muted cloth tones.
- 2026-11-05 polish menu: "more vague", "polished, fun, and easy to understand", "new things will be added soon, like zones and rooms with specific topics" -> prefer goal-level items (a first run that explains itself, a score that explains itself) over pixel fixes, and leave a registry/door for zones and topic rooms without building them (thread: polish refinements)
- 2026-11-05 judge leniency: "is convince really just 10 points" for tempt -> close concepts of a word (persuade-like verbs for entice-like words) must not land in Pamphlet; check these by hand after judge changes.
- 2026-11-05 hints and skip (G4): "make them much more on theme and satisfying to press", "maybe they should be notes on the notecard" -> controls are objects (pressable tabs with pips, not capital-letter sentences); hints are handwriting on the card itself, not floating popups.
- 2026-11-05 empty pages (Q7, from the audit): a new player's books should look finished, not blank: one hand-drawn sketch and one written line per book, never the same note twice.
- 2026-11-04 reveal: picked 'cover materials' with 15, 18, 14 and asked for 'more polished recommendations': each tier's cover must open in its own physical way, rarity is the hero (thread: reveal cover openings)
