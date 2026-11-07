# Unlimited walk, 2026-11-07 (audit brief 4)

Scripted Unlimited play in all seven rooms (Reading Room, Chronicle, Counting House, Observatory, Scriptorium, Gallery, Anatomy Theatre), at phone 375x667 (2x) and desktop 1280x800, with OS reduced motion on. Per room: open Unlimited, Find my rank (8 placement words, half answered with the room's own definition and half with a weak answer), the placed rank, back home, the placed book, then Descend (7 words), the run result and home again. Every screen is checked for NaN, undefined or null text, clipped text, sideways and vertical page scroll, stray scrollable panes, the Word n of N count, the depth readout and the saved rating (finite L, placed, n = 8 then 15, runs = 1 then 2).

Script: `scripts/unlimited-walk.mjs` (in the repo). Report and screenshots: `screenshots/unlimited-walk/` (96 MB, 141 files: `<room>-<phone|desk>-<step>.png` plus `report.json`).

## What failed and is fixed
- **Run stage scrolled (stray scrollbar), every room, both sizes.** A live combo line sat under the word count and pushed the stage 18 to 22 px past its height at 375x667 and 1280x800. A deep floor's rule line on top of that pushed it 12 to 32 px past. Fix: the combo now sits on the word-count row (`src/app/run.js`, `src/ui/comboLine.css`), and in windows 660 to 860 px tall a floor-rule run gives the answer slip 84 px (`src/ui/comboLine.css`). The word-count wrapper `.wl-n` is what the row hides at small heights, so a live combo never vanishes with it.
  - Guard: `scripts/run-stage-fit.mjs` (in CI) plays a combo and adds the floor rule at six sizes; it failed before the fix (375x667 by 32 px) and passes now. Static checks: `test/unlimited-stage.test.js`.
  - Also tried and dropped: a JS fit that shrank the answer slip by measuring. It did not hold (the slip's inline height did not take effect in this layout), so it is not in the PR.

## What passed
- No NaN, undefined or null in any screen of any room. Rank text ("Your rank · Lexicon N", "You are placed as a X", "Still a X" / "You rose or slipped") matches the saved rating in all seven rooms.
- Counts: placement shows "Word n of 8" and the saved rating reads n 8, runs 1; after a run n 15, runs 2. The Lexicon stays in 3 to 98 and the saved L stays in range.
- The depth readout is a whole number on every run word.
- Descend: after placing, the home Descend plaque still offers the unplayed Daily first (by design); the Unlimited book's button reads Descend and starts the 7-word run.
- Desktop: no sideways or vertical scroll, no scrollable panes, no clipped text beyond the items below.

## Reported, not changed
- **"You wrote" line** (the answer/results thread owns it): on desktop it is flagged as clipped on a few cards (about 1 in 8 cards in a run), and the line can show a doubled full stop when the typed answer ends with a period (for example "insect..").
- **Phone result card:** the clip check flags off-screen rarity labels in the card's cover ("Common | word | Pamphlet"). They are outside the viewport on purpose and are not visible; the card itself looks right in the screenshots. The check now ignores them (not yet in the script; noted here).
- **Phone result pane:** the placed and run results were flagged once as a scrollable pane (#final). Measured again after the fade-in, the pane fits, so this looks like a timing flake.
- **Phone home spine:** the Unlimited spine shows only "UNLIMITED" on phones; the "Lexicon N" line is hidden on that size (class `sub-off`). Rank is still on the book's first page. Left as is, since it looks deliberate.
