# What nate asks for and likes (Deepstack)

Mined from the whole project chat, 2026-11-03 to 2026-11-04 (about 60 of nate's messages). Use it to write briefs, judge finished work, and shape every menu. Append new patterns when a thread finishes (see the last section).

## 1. The ten patterns that repeat

1. **Overhaul, not tweak.** His verbs are "completely overhaul", "completely renovate", "completely rework", "it looks horrible and needs a complete polishing". Small nudges are rarely what he wants. Offer rebuilds with a clear new idea, not 2-pixel fixes.
2. **Everything is a book, a shelf or a page.** (2026-11-04 shelf: "a real library section: all those details" -> bays, brass labels, ladder, pull-a-book.) (2026-11-04 result card: "visual hierarchy is WONDERFUL" but "too boxy? should this be a mini book?" -> keep the hierarchy, change the object: leather boards, deckled page, ribbon button; no rectangles with outlines.) The menu is horizontal books in stacks. Shelf, Sets, Stats and Daily are book spreads with sections and multiple pages. Tabs are written words with a pen underline. Search is handwritten. Arrows became page-corner flips. If a new feature can be an object in the library, make it one.
3. **Handwritten, themed, sectioned.** The Daily book should "look handwritten", have sections and several pages. He asked for handwriting fonts and a type specimen. Duplicates show once with a handwritten x N. Labels are Cinzel, handwriting Fuzzy Bubbles, fine print Special Elite, body Anthropic Serif (his own font). (2026-11-04) "Daily book calendar page (this is how to select days)": the calendar is the way into a day, so tapping a day must open its entry.
4. **Words must be fully readable.** Repeated complaints: words clipped on spines ("too short"), a stretched word, the share note cut off, a judge % clipping the books. Never clip, never stretch, always check long words.
5. **Dark, mysterious, deeper is darker.** "Feel more dark and mysterious the further you get down and have sections for each." Floors need distinct identities and title banners with their own gradient backdrop. Copy should be concise and mysterious ("Descend to the depths of the library").
6. **Rarity is the hero.** Result card: tier and rarity (Epic/Folio) lead, closeness shrinks to a chip, "way too much info", fix visual hierarchy. Rare tiers should feel special.
7. **Integrated, not bolted on.** Depth tracker became part of the library (oak upright, brass plaques, lantern). Recent guesses and skipped words live in the alcove ledge. The top bar holds only Sound, Credits and Settings, library-themed, with judge status in it. Overlays should not sit on top of or behind the wrong layer (a book's menu opened behind it; fixed).
8. **Immersion through interaction.** He asked to make books clickable (then hover-only) to reveal definitions, lanterns hang from chains and react to the cursor, glow is a tight halo that doesn't clip or crowd the alcove. Hover must work during a run too. 2026-11-04 nook: "effects of the level (like the water mostly) should be separate and not affect the alcove just to maintain visual" -> clip floor effects around the alcove; he also asked for "things that live down there" and "hidden curios on the shelves". Objects must make physical sense ("why are the lanterns hanging from nothing", "floating book").
9. **Motion should be fast, smooth and physical.** "Open faster and more animated", "accelerate, not too fast, not sluggish", corner page flips with a bigger hit area, animated Descend plaque into the run, swing-shut close on outside click, no squeezing or sideways page peeks, no jumps between screens. (2026-11-04: asked for a candle-light cursor.)
10. **Spacing and polish, said in two words.** "Fix the spacing" was asked three times (menu, caption, every screen). Balanced vertical rhythm, consistent gaps, centred layouts.

## 2. Other consistent preferences

- **Persistent world.** Scroll back through the descent. Past alcoves show word, answer and result. Today's Result replays the whole descent through its floors and ends at the result.
- **Variety over repetition.** The pulled book should come from a random shelf spot (not always the bottom middle, not floating). He dislikes duplicate rows.
- **Hints help meaning, never spelling.** "Why would it give me the first letter? I'm literally given the word." Sentence, related word, definition start.
- **Shelves everywhere.** He asked three times why the top shelves were bare. Full shelves and wall detail from the very first screen, including behind the menu.
- **Daily is its own thing.** Daily No. 1 = 2026-11-03, shown with today's date, one entry per day with 7 words, definitions and results. Reactive difficulty is Unlimited only.
- **Performance is a feature.** "Performant" appears with lanterns and scrolling. He wants costs measured before building ("determine the performance cost").
- **Honest answers.** He asks "is this on purpose?", "why does it look like this?", "should duplicates show?". Give the real cause and the fix, not a defence.
- **Say it once, expect it done.** When he sends a screenshot with "fix this", he expects the thread to find the cause. Repeat complaints (shelves at the top, hover on lore books) mean the first fix was not checked in the real screen. Verify with a screenshot of the exact screen he showed.
- 2026-11-04 motion: "the motion language should be for all animations and changes, make sure it's smooth and performant and all uniform" (sounds should line up with it, thread: desk sounds)

- 2026-11-04 results screen: "not spanning the whole vertical page and having to scroll, it shouldnt be like that" -> every screen must fit one view at 1280x720 and 375x667, compact instead of scrolling (pattern 10)

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
- 2026-11-04 handwriting (answer box): asked for quill and ink; Enter still submits, no word count (thread: quill and ink)
- 2026-11-04 handwriting: "every tab and filter as handwriting with animated pen underline" -> no pill or button chrome on book pages; Start and Close are written words too (thread: tabs and filters)

- 2026-11-04 attic: "i want the back fill to make you scroll up and for it to be an attic" -> a backfill is a place, not a silent migration: scroll up past the top of the Shelf into a dusty attic of crates (thread: attic)

## Changelog
- 2026-11-04 initial version from project chat history.

- Colors (2026-11-04): nate likes Minecraft color codes as the color reference (use the actual hues: dark blue, dark red, dark green, dark aqua, dark purple, gold/orange). Variety comes from values within each item (darker edges, stripes), not muted/aged versions of the hue. Home menu books: Daily blue, Unlimited red, Practice green, Shelf aqua, Sets purple, Stats orange-brown.
- 2026-11-04 stats: wants "stats as an almanac" -> hand-drawn charts (tally marks, spines, cross-section) not UI bars (thread: almanac)
- 2026-11-04 motion: the motion language should cover all animations and changes, smooth, performant and "all uniform" -> every transition goes through the shared presets (thread: motion language)
