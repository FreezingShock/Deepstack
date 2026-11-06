# Sound palette

One set of recipes so nothing sounds like a different game. All synthesis, no files. Code: `src/sound/materials.js` (cues), reached as `Sfx.cue(name, arg)`.

| Material | Character | Cues |
|---|---|---|
| Paper | broad band-passed rustle, a few high fibres | `turn` (heavier with page count), `slip` |
| Leather | low lowpassed breath + soft body thump | `lift` (cover up), `shut` (cover down) |
| Wood | triangle knock with a short dry tap; dry sawtooth creak | `hatch`, `rung`, `knock` |
| Stone | slow narrow band of noise, cold | `scrape`; floor doors in `thresholdSting.js` |
| Brass | tiny bright triangle tick | `tick` (button press), `hover` (mouse only) |
| Fire | very short filtered cracks, sometimes doubled | `crackle` (hearth, every ~1 to 4 s) |

Existing voices stay: quill/seal/land/paper in `scribe.js`, ambience beds, score, tier chimes and stings.

Rules: every cue is rate limited, voice capped, silent when Sound is off, and the master volume slider scales all of it. `hover` and `crackle` are optional layers and drop out at low quality. Hatch and rungs are silent under reduced motion. Mapped motions: book lift/shut/turn (`bookSound`), attic hatch and ladder (`atticHome.js`), hearth (`hearth.js`), every button (`uiHooks.js`).
