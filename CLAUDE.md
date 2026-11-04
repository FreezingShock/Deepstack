# Working on Deepstack (read this first)

Many Claude threads work in parallel here, each on its own feature, and every PR auto-merges into `main` when CI is green. `main` must always build and boot. Details in [CONTRIBUTING.md](CONTRIBUTING.md); the short version:

1. Start from the latest `origin/main`: `git fetch origin main && git rebase origin/main` (or branch from it) before you begin and again before you push.
2. One focused PR per feature. Small diffs merge cleanly; big ones conflict.
3. Before pushing run `npm test && npm run build`. CI runs the same plus a headless boot test (`scripts/smoke.mjs`).
4. Open the PR ready for review (not draft) so auto-merge turns on, and keep it that way. If it is a draft, run `gh pr ready` or mark it ready via the GitHub tool. If CI fails, fix it on your branch; never skip or delete a test to get green.
5. After a merge, later threads rebase onto it. Resolve conflicts by keeping both sides' intent; never discard another thread's work.

## Avoiding conflicts
- Put new code in new files under `src/` (e.g. `src/sound/`, `src/ui/stats.js`) and import it from `src/main.js` with a one-line hook. `src/main.js` (now thin boot wiring) is the shared hot spot; game code is in `src/app/` and `src/world/`. Global CSS is split into `src/styles/*.css` (ordered by `src/styles/index.css`; order is the cascade, so append, don't reorder). Prefer your own new css file: touch them minimally, don't reformat or reorder, don't do drive-by cleanups.
- Don't edit `package.json` / lockfile unless you need a dependency. Don't rename or move files others use.
- Add tests in `test/` as new files named for your feature.
- Persistent state: saves live in `localStorage` key `deepstack.v1`. Add fields additively and tolerate missing ones; never change the shape of existing fields.
- Big refactors (splitting `main.js`, etc.) get their own PR, announced to the coordinator first, when no other threads are in flight.

## Commands
`npm run dev`, `npm test`, `npm run build`, `node scripts/smoke.mjs` (after build; set `CHROMIUM_PATH` to a Chromium binary if Playwright's own isn't installed).

## Keep the maps current
`docs/feature-inventory.md` (what exists, quality, gaps), `docs/refinement-backlog.md` (numbered ideas and in-flight work) and `docs/nate-preferences.md` (what nate repeatedly asks for) are how the coordinator offers the next round of work. Read the preferences before you design anything. In your PR, when your work is finished:
1. Tick your backlog item (`[x]` + PR number) and update your row in the inventory. `node scripts/inventory.mjs` refreshes the generated file map.
2. If nate said anything new about taste in your thread (a correction, a "don't", a "love this"), append one dated line under the matching pattern in `docs/nate-preferences.md`.
3. Add 2 to 3 fresh backlog items that follow from what he asked, in his wording and in the same format (title, pitch, brief, conflicts).
Keep each edit to a few lines so these files don't conflict. After the PR merges, the coordinator copies them to the project notes folder.
