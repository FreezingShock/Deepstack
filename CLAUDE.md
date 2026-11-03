# Working on Deepstack (read this first)

Many Claude threads work in parallel here, each on its own feature, and every PR auto-merges into `main` when CI is green. `main` must always build and boot. Details in [CONTRIBUTING.md](CONTRIBUTING.md); the short version:

1. Start from the latest `origin/main`: `git fetch origin main && git rebase origin/main` (or branch from it) before you begin and again before you push.
2. One focused PR per feature. Small diffs merge cleanly; big ones conflict.
3. Before pushing run `npm test && npm run build`. CI runs the same plus a headless boot test (`scripts/smoke.mjs`).
4. Open the PR ready for review (not draft) so auto-merge turns on, and keep it that way. If it is a draft, run `gh pr ready` or mark it ready via the GitHub tool. If CI fails, fix it on your branch; never skip or delete a test to get green.
5. After a merge, later threads rebase onto it. Resolve conflicts by keeping both sides' intent; never discard another thread's work.

## Avoiding conflicts
- Put new code in new files under `src/` (e.g. `src/sound/`, `src/ui/stats.js`) and import it from `src/main.js` with a one-line hook. `src/main.js` and `src/styles.css` are the shared hot spots: touch them minimally, don't reformat or reorder, don't do drive-by cleanups.
- Don't edit `package.json` / lockfile unless you need a dependency. Don't rename or move files others use.
- Add tests in `test/` as new files named for your feature.
- Persistent state: saves live in `localStorage` key `deepstack.v1`. Add fields additively and tolerate missing ones; never change the shape of existing fields.
- Big refactors (splitting `main.js`, etc.) get their own PR, announced to the coordinator first, when no other threads are in flight.

## Commands
`npm run dev`, `npm test`, `npm run build`, `node scripts/smoke.mjs` (after build; set `CHROMIUM_PATH` to a Chromium binary if Playwright's own isn't installed).
