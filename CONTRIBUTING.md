# Contributing / parallel development

## Flow
1. `git fetch origin main`, branch from `origin/main`.
2. Make a small, focused change. Add or update tests.
3. `npm test && npm run build` locally.
4. Rebase on `origin/main`, push, open a PR **ready for review**.
5. The `Auto-merge` workflow enables squash auto-merge. When the required `check` job passes, GitHub merges it. Branch is deleted automatically.
6. If a conflict or red CI blocks it, fix on your branch and push; auto-merge stays armed.

## CI
`.github/workflows/ci.yml` job `check`: `npm ci`, `npm test`, `npm run build`, headless boot of the built app (fails on any uncaught page error). It runs on the PR merged with current `main`, so a PR that would break `main` fails before merging. It also runs on every push to `main`.

## Screenshot snapshots
`node scripts/snapshots.mjs` (after `npm run build`) renders home, an open book, gameplay, a result card and the home screen after a run, with a fixed clock, date and random seed, and compares them with `test/snapshots/*.png` using a tolerant diff (fails above 10% changed pixels). If you change the look on purpose, run `node scripts/snapshots.mjs --update` and commit the new PNGs so reviewers can see them. A failing CI run uploads the actual images as the `snapshot-diffs` artifact.

## Repo settings (one-time, by the owner)
- Settings > General > Pull Requests: allow auto-merge, allow squash merging, automatically delete head branches.
- Settings > Branches > add rule for `main` (or a ruleset): require status check `check`, require a pull request, no required approvals (so auto-merge isn't blocked on reviewers). Leave "require branches to be up to date" off so parallel PRs don't each need a re-run; CI already tests against current `main`.
- Settings > Actions > General > Workflow permissions: Read and write.

## Module boundaries
`src/core/` game rules, `src/scorer/` judging, `src/main.js` UI/world (shared hot spot), `scripts/` data tooling. Prefer adding new modules over editing `main.js`.

## Colors
Colors live in `src/theme/colors.js` (single source of truth). `npm run gen:tokens` writes `src/theme/tokens.css` (`--c-*`, `--tier-*`, `--floor-*` custom properties); canvas/JS code imports `colors.js` directly. In CSS use `var(--c-parchment)` etc. instead of raw hex. Files listed in `test/fixtures/hex-budget*.json` may not gain raw hex.
