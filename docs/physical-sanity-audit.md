# Physical sanity audit (backlog 6)

Method: built the app, drove `window.__deepstack.World` to rows on every floor (Stacks 3, Archive 30-40, Catacombs 70-75, Sunken Vault 120-130, Hollow 175-180, Abyss 250), at 1280x800 and 375x667, in three states: browsing bare shelves, an alcove with a full ledge, and a book pulled out and held. Looked at each for things that float, clip or lack support. Crops are in `docs/physical-sanity/` (`before-*` / `after-*`).

## Found and fixed

| # | Glitch | Cause | Fix |
|---|---|---|---|
| 1 | Books leaning left sank into the plank (up to ~8 px at deep floors) | Every lean pivoted about the book's right foot, so a leftward lean drove the left corner down | A book now rests on the foot corner of the side it leans toward (`footPivot`, `tiltAboutFoot`). The lore hit test uses the same helper, so hover follows the drawn book. See `physical-sanity/pivot-before-after.png`. |
| 2 | Books leaned into empty air | Random tilt had no regard for neighbours | A slumping book keeps its lean only up to the angle where it touches a neighbour that is tall enough to hold it. With none, it flips toward the neighbour it has, else stands upright (`settleBooks`, `leanAllowance`). The shelf-wide inward lean of deep floors is a design choice and is kept. |
| 3 | Lying books overlapped the standing books beside them, and were tipped so one end floated or sank | Drawn up to 0.7 x height wide in a slot 10-32 px wide, and rotated 0.04 rad | Lying books reserve their drawn width of shelf (`lyingFootprint`) and lie flat on the plank. |
| 4 | Skulls, bones, ledger plates and paper stacks stood half on a pillar, and over cracked planks | Prop x was random with no knowledge of the pillars (W/3 apart) or the row's crack | `placeProp` slides each prop clear of pillars and cracks. |
| 5 | The pulled-out book hung in front of the shelves with nothing to place it in depth | The held pose is lifted and scaled 2.3x with no shadow | A soft shadow falls on the books behind it as it lifts. |

## Checked and fine
- Lanterns: chain bolts to the arch frame at every width (the anchor follows the arch curve), links reach the cap, the cap hangs from the last link, and the swing is limited to 0.85 rad so it never passes through the frame.
- Numeral plaque sits on the arch crown, under the top bar.
- Ledge books stand on the alcove ledge with a contact shadow; skipped slots are drawn as dashed outlines on the ledge.
- Lore halos follow the leaning third of the row and, with fix 1, the book's real foot.
- Hollow chains hang from the shelf plank above; abyss tendrils grow from the plank.
- Row bitmaps are cached, so none of the above costs per-frame work.

## Not fixed here (belongs to other threads)
- Water lines of the Sunken Vault draw across the alcove and ledge books (alcove thread, backlog 5).
- Lanterns and ledge books are nearly invisible on The Hollow and The Abyss; that is the darkness, not a physics fault.

## Tests
`test/physics.test.js`: resting corner never below the plank for any lean, inverse transform, support and flip rules, lying footprint, props clear of every pillar and crack across the full width.
