# Plan: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Source design

- Approved design: [`docs/superpowers/specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md`](../specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md)
- Approved at commit `97e3f0d`
- Selected approach: Option A (per-package release-please monorepo with local-path dev overlay)
- ACs in scope: `AC-58-1` through `AC-58-8`

## Planner gates (resolve before Executor starts)

These are decisions the design left to the Planner. Each is committed below so the Executor follows them without revisiting.

### Gate G1: Per-plugin tag prefix mapping (open question 1)

`release-please` monorepo mode emits prefixed tags (`bootstrap-v1.11.0`). The existing manifest validator regex is `^v(\d+\.\d+\.\d+)$`.

**Decision:** Strip the prefix when writing manifest `ref` values; do **not** weaken the validator. The release-please workflow extracts the semver portion from each prefixed tag and writes `vX.Y.Z` into both marketplace manifests. This preserves the existing `vX.Y.Z` invariant and the regex stays unchanged. The CLI package uses the unprefixed `skills-v` tag for its own `npm publish`.

### Gate G2: Codex dev-overlay source mode (open question 2)

The dev overlay must use a manifest source mode Codex accepts. The Planner has not been able to run a live Codex against a path source from this worktree.

**Decision:** Use `"source": "path"` with a repo-relative `path` field for the Codex dev overlay (`marketplace.local.json`), mirroring the Claude convention. If Executor verification (Workstream 3, Task 3.4 below) shows Codex rejects `source: path`, fall back to `git+file://` URLs against the local clone, recorded in the same overlay file. Executor must record which fallback is in effect in `docs/file-structure.md` so it does not silently drift.

### Gate G3: Bootstrap self-apply ownership (open question 3, AC-58-5)

`scripts/apply-bootstrap.js` is introduced in Workstream 6 below. It is invoked from the release-please workflow **only when a release-please release manifest mutates `plugins/bootstrap/`** (detected by inspecting the release-please job output `paths_released`). The result of running it is committed onto the same release-please PR branch in the same workflow run, preserving the existing "bootstrap bump and scaffolding refresh land in one PR" property documented in `docs/release-flow.md`. On non-bootstrap releases the step is skipped. The TODO in `plugin-release-bump.yml` is therefore *implemented*, not deferred — AC-58-5's "explicit deferral with tracked follow-up" path is rejected.

### Gate G4: CLI host detection (open question 4)

`npx skills` does **not** attempt to auto-invoke host CLIs in this iteration. It prints the host-specific marketplace-add command to stdout for both Claude Code and Codex, copies it to clipboard when a clipboard utility is present, and exits 0. `npx skills --dev` does the same but with the registered absolute path. This is the documented primary install surface (satisfies AC-58-4) and avoids brittle host detection. Auto-invocation is tracked as a follow-up issue, not in scope here.

### Gate G5: Wiki ownership of record (open question 5)

The wiki is the canonical surface. The repo carries one file, `docs/wiki-index.md`, listing every wiki page name and its purpose. The Executor publishes wiki pages before deleting any source `README.md` content from the upstream packages; see Workstream 7.

### Gate G6: `npx skills` package name

The bare npm name `skills` is currently unverified by the Planner. Per the design, the gate must resolve before Executor publishes.

**Decision:** Executor verifies availability with `npm view skills` as the first step of Workstream 5. If the response is `404` (not published), use bare `skills`. If the response shows an existing package, fall back to `@patinaproject/skills` (scoped, under the Patina Project npm org). Whichever name resolves is then recorded in `packages/skills-cli/package.json` and propagated to `README.md`, `docs/wiki-index.md`, and the marketplace manifest descriptions. Workstream 5 is blocked from completing until this is resolved.

## Sequenced workstreams

The workstreams are ordered. Tasks within a workstream may be parallelized only when explicitly noted.

### Workstream 1 — Subtree-merge import (AC-58-1, AC-58-7, AC-58-8)

**Goal:** Bring `plugins/bootstrap/`, `plugins/superteam/`, `plugins/using-github/` into this repo from their tagged upstream releases, with history preserved and byte-equivalent content.

**Tag bases at time of merge:** `bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0` (matches the current marketplace pins).

**Command sequence (run on this branch):**

```sh
# Bootstrap
git remote add upstream-bootstrap https://github.com/patinaproject/bootstrap.git
git fetch upstream-bootstrap --tags
git subtree add --prefix=plugins/bootstrap upstream-bootstrap v1.10.0

# Superteam
git remote add upstream-superteam https://github.com/patinaproject/superteam.git
git fetch upstream-superteam --tags
git subtree add --prefix=plugins/superteam upstream-superteam v1.5.0

# Using-github
git remote add upstream-using-github https://github.com/patinaproject/using-github.git
git fetch upstream-using-github --tags
git subtree add --prefix=plugins/using-github upstream-using-github v2.0.0
```

**Tasks:**

- 1.1 Capture pre-merge SHA-256 of the upstream `superteam@v1.5.0` SKILL.md and the non-negotiable-rules block (the same prefix `Team Lead`'s `resolve_role_config` computes). Save to `docs/superpowers/plans/.artifacts/sha256-pre.txt` for round-trip verification. (AC-58-7)
- 1.2 Run the three `git subtree add` commands in order. Each produces a merge commit; do not rebase or squash them. Subtree merges are exempt from the conventional-commit rule (treat them like bot bump PRs).
- 1.3 After all three subtree adds land, recompute the same SHA-256 against `plugins/superteam/skills/superteam/SKILL.md` and the same non-negotiable-rules block. Save to `.artifacts/sha256-post.txt`. Assert byte-equal. (AC-58-7)
- 1.4 Verify each `plugins/<name>/` contains both `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json` and the `skills/<name>/` tree. (AC-58-1)
- 1.5 Remove the three temporary git remotes (`git remote remove upstream-<name>`).

**Files touched:** new tree under `plugins/{bootstrap,superteam,using-github}/`, plus `.artifacts/` for SHA-256 receipts (gitignored; the receipts are recorded in the PR body instead).

**Verification:** `find plugins -maxdepth 3 -type f | sort` shows all three manifests per plugin; SHA-256 diff exits 0.

**Definition of done:** Three subtree merges committed; SHA round-trip green; no commits squashed.

**Risks/rollback:** If a subtree merge corrupts content, `git reset --hard` to the pre-merge sha (recorded as the head of this branch before Workstream 1 starts). Upstream repos remain archived per the design, so re-running is safe.

### Workstream 2 — Marketplace manifests and validator extension (AC-58-2, AC-58-3 check b)

**Goal:** Manifests in released form continue to pin `vX.Y.Z` against `patinaproject/skills` itself; dev overlays declare path-based sources for in-repo iteration; validator gains a dev-mode that accepts the overlay and rejects it in release mode.

**Tasks:**

- 2.1 Update `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json` so all three plugin entries point at `repo: patinaproject/skills` (Claude) / `url: https://github.com/patinaproject/skills.git` (Codex). The `ref` for each entry is `vX.Y.Z` taken from the most recent per-plugin release-please tag (initially the same as the upstream tags: `v1.10.0`, `v1.5.0`, `v2.0.0`). (AC-58-2)
- 2.2 Create `.agents/plugins/marketplace.local.json` and `.claude-plugin/marketplace.local.json` declaring each plugin entry with a path source per Gate G2:
  - Claude: `"source": { "source": "path", "path": "../../plugins/<name>" }`
  - Codex: `"source": { "source": "path", "path": "../../plugins/<name>" }` (with Gate G2 fallback if needed).
- 2.3 Extend `scripts/validate-marketplace.js`:
  - Default (release) mode: existing `vX.Y.Z` regex check. Additionally fail if either `marketplace.local.json` is present at the released-artifact paths covered by the `release-please` extra-files / npm `files` allowlist (defense in depth against the leak risk in the design).
  - `--dev` mode: validate the two `marketplace.local.json` files instead of the released manifests; assert each `path` resolves to a directory containing `.codex-plugin/plugin.json` (for the Codex overlay) or `.claude-plugin/plugin.json` (for the Claude overlay); skip the `vX.Y.Z` rule.
  - Preserve the existing `--remote` mode but update it to consult `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json` *at the tagged ref on this repo* rather than at the upstream repo.
- 2.4 Add npm script entries: `validate:marketplace`, `validate:marketplace:dev`, `validate:marketplace:remote`.

**Files touched:** `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.local.json`, `.claude-plugin/marketplace.local.json`, `scripts/validate-marketplace.js`, `package.json`.

**Verification:**

- `node scripts/validate-marketplace.js` exits 0 against the released manifests.
- `node scripts/validate-marketplace.js --dev` exits 0 against the overlays.
- `node scripts/validate-marketplace.js` exits non-zero if a `marketplace.local.json` is moved into the would-be-released payload (smoke this by temporarily placing it in a release-eligible spot).

**Definition of done:** All three validator modes exit as expected; conventional commit `feat: #58 wire marketplace to in-repo plugins and dev overlay`.

### Workstream 3 — Verification harness for AC-58-3 (depends on Workstreams 1, 2; partially blocks 5)

**Goal:** Three falsifiable exit-0 invocations exist and are documented in `README.md`.

**Tasks:**

- 3.1 Implement `scripts/apply-bootstrap.js` (skeleton): a node script that, given an argument like `plugins/bootstrap`, runs the bootstrap skill's documented self-apply against this repository without network access. The script reads the in-repo bootstrap skill's `SKILL.md` to determine apply steps and shells out to the necessary local commands. Exits 0 on success. (AC-58-3 check c, AC-58-5)
- 3.2 Add `--dev` mode to `packages/skills-cli/bin/skills.mjs` (full implementation comes in Workstream 5; for AC-58-3 we need only the registration-prints-and-exits-0 path). For now, stub it to print the host commands and exit 0; flesh out in Workstream 5.
- 3.3 Document the three checks in `README.md` under "Local iteration":
  - `npx skills --dev` (or the in-repo equivalent until the package is published): exit 0.
  - `node scripts/validate-marketplace.js --dev` (accept) and `node scripts/validate-marketplace.js` with the overlay misplaced (reject): exit 0 / non-zero.
  - `node scripts/apply-bootstrap.js plugins/bootstrap`: exit 0 with no network calls.
- 3.4 **Gate G2 verification.** Executor manually exercises the Codex CLI's `marketplace add` against the path overlay from a fresh clone of this branch. If Codex rejects `source: path`, switch to `git+file://` URLs and update `marketplace.local.json` accordingly. Record the result in `docs/file-structure.md`.

**Files touched:** `scripts/apply-bootstrap.js`, `packages/skills-cli/bin/skills.mjs`, `README.md`, `docs/file-structure.md`.

**Verification:** Three exit-0 invocations all succeed on a fresh clone. CI runs the validator modes; Executor runs `apply-bootstrap.js` and CLI `--dev` locally and records output in PR body.

**Definition of done:** AC-58-3 checks a/b/c all green.

### Workstream 4 — `release-please` configuration (AC-58-5; depends on Workstreams 1, 2)

**Goal:** Replace `plugin-release-bump.yml` with `release-please`-driven releases. The release-please config is the single source of truth for what `vX.Y.Z` lands in both marketplace manifests.

**Tasks:**

- 4.1 Create `release-please-config.json` describing four packages:
  - `plugins/bootstrap` — release-type `node`, tag prefix `bootstrap-`, initial version `1.10.0`.
  - `plugins/superteam` — release-type `node`, tag prefix `superteam-`, initial version `1.5.0`.
  - `plugins/using-github` — release-type `node`, tag prefix `using-github-`, initial version `2.0.0`.
  - `packages/skills-cli` — release-type `node`, tag prefix `skills-`, initial version `1.0.0`.

  Top-level options: `"separate-pull-requests": true`, `"plugins": ["node-workspace"]` is not required (no workspace deps). Each package declares `extra-files` for the two marketplace manifests so a release for `plugins/<name>` rewrites the matching plugin entry's `ref` to the new `vX.Y.Z` (with the prefix stripped per Gate G1). Use release-please's `json` extra-files schema with a JSONPath like `$.plugins[?(@.name == "<name>")].source.ref`.
- 4.2 Create `.release-please-manifest.json` with the four packages and their initial versions.
- 4.3 Create `.github/workflows/release-please.yml`:
  - Trigger: `push` on `main`.
  - Step 1: `googleapis/release-please-action` with the manifest config. Sign commits as `github-actions[bot]`.
  - Step 2 (only when `bootstrap` is among `paths_released`): checkout the release PR branch, run `node scripts/apply-bootstrap.js plugins/bootstrap`, commit any resulting scaffolding changes onto the same release PR branch with a `chore: #<skip> apply bootstrap scaffolding refresh` message (or equivalent under release-please conventions). Push back. (AC-58-5, Gate G3)
  - Step 3: enable auto-merge with `gh pr merge --auto --squash` on each open release-please PR.
  - Step 4: run `node scripts/validate-marketplace.js` after release-please mutates manifests and before auto-merge enables.
- 4.4 Delete `.github/workflows/plugin-release-bump.yml`.
- 4.5 Rewrite `docs/release-flow.md`:
  - New lifecycle: release-please opens standing per-package PRs; merging publishes the tag and updates the manifest `ref` via release-please's extra-files step; the bootstrap scaffolding refresh continues to land in the same PR for bootstrap releases.
  - Document Gate G1 (tag prefix stripping for manifest writes).
  - Remove the cross-repo dispatch section and the "required setup in each member plugin repo" section entirely.
  - Add `release-please--*` to the no-issue-tag exemption list alongside `bot/bump-*`.
- 4.6 Update `AGENTS.md`:
  - Add `release-please--*` to the no-issue PR exemption list.
  - Update the "Plugin Releases" section to describe release-please as the mechanism (replace the `repository_dispatch` paragraph).
  - Update the source-of-truth boundary to "this repo's `plugins/<name>/` owns the package."

**Files touched:** `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release-please.yml`, `.github/workflows/plugin-release-bump.yml` (deleted), `docs/release-flow.md`, `AGENTS.md`.

**Verification:**

- `actionlint` passes on the new workflow.
- Dry-run release-please locally: `npx release-please --dry-run release-pr --config-file release-please-config.json --manifest-file .release-please-manifest.json` lists the expected per-package PRs.
- The validator runs at the right step and the workflow is pinned with SHA + comment per AGENTS.md GitHub-Actions-pinning rule.

**Definition of done:** New workflow file landed with SHA-pinned actions, old workflow removed, docs updated, conventional commit `feat: #58 replace dispatch workflow with release-please releases`.

**Risks/rollback:** If release-please mis-rewrites a `ref`, manifests are caught by `validate-marketplace.js` in CI. Manual rollback: revert the workflow change commit and restore `plugin-release-bump.yml` from `e97f4eb` (the most recent main commit that has it).

### Workstream 5 — `npx skills` CLI package (AC-58-4; depends on Gate G6 resolution)

**Goal:** Publish a CLI under `packages/skills-cli/` that is the documented primary install path.

**Tasks:**

- 5.1 **Resolve Gate G6.** Run `npm view skills`. Record result. Set the published name to `skills` or `@patinaproject/skills` accordingly. The plan does not proceed past this task until name is fixed.
- 5.2 Create `packages/skills-cli/package.json` with:
  - `name`: resolved per Gate G6.
  - `version`: `1.0.0`.
  - `bin`: `{ "skills": "./bin/skills.mjs" }`.
  - `type`: `module`.
  - `files`: `["bin", "README.md"]` (explicitly excludes `*.local.json`).
  - `engines`: `node >= 18`.
  - No runtime dependencies.
- 5.3 Implement `packages/skills-cli/bin/skills.mjs`:
  - Detect `--dev` flag.
  - Read the CLI's own `package.json` to get its version string. The marketplace `ref` printed equals `v<version>` for the marketplace itself; per-plugin pinning is in the manifest files, not in the CLI.
  - Default mode: print the two host-specific marketplace-add commands (Claude Code `/plugin marketplace add patinaproject/skills`; Codex `codex plugin marketplace add patinaproject/skills`). Per Gate G4, no auto-invocation. Copy to clipboard when `pbcopy`/`xclip`/`clip` is available. Exit 0.
  - `--dev` mode: same, but commands point at the absolute path of the working tree, derived from `process.cwd()` resolved up to the repo root (look for `release-please-config.json` to anchor). Exit 0.
- 5.4 Add `packages/skills-cli/README.md` describing both modes.
- 5.5 Update root `README.md` so `npx <resolved-name>` is the first install step. Keep `/plugin marketplace add` and `codex plugin marketplace add` as documented fallbacks. (AC-58-4)
- 5.6 Update both marketplace manifests' descriptions to point at `npx <resolved-name>` for first-time install.
- 5.7 Set up npm publish from the release-please workflow on a `skills-v*` tag:
  - In `release-please.yml`, when `paths_released` includes `packages/skills-cli`, run `npm publish` from `packages/skills-cli` with `NODE_AUTH_TOKEN` from a repo secret (`NPM_TOKEN`).
  - Use the `--provenance` flag (npm provenance requires `id-token: write` permission on the job).

**Files touched:** `packages/skills-cli/` (new), `README.md`, `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.github/workflows/release-please.yml`.

**Verification:**

- `node packages/skills-cli/bin/skills.mjs` prints both host commands and exits 0.
- `node packages/skills-cli/bin/skills.mjs --dev` prints commands with the absolute working-tree path and exits 0.
- `npm pack` from the package directory produces a tarball that does *not* contain `*.local.json`.

**Definition of done:** CLI runs locally; package metadata correct; release pipeline wired; conventional commit `feat: #58 add npx skills installer`.

### Workstream 6 — `scripts/apply-bootstrap.js` (AC-58-3 check c, AC-58-5; depends on Workstream 1)

The skeleton from Workstream 3 is fleshed out here into the production version invoked by release-please.

**Tasks:**

- 6.1 Read `plugins/bootstrap/skills/bootstrap/SKILL.md` to derive the apply steps the bootstrap skill itself defines.
- 6.2 Implement each apply step against the current repo (commitlint config, husky hooks, issue/PR templates, etc.) without making outbound network calls. Use only local file operations and `pnpm` invocations that hit the local store.
- 6.3 Add a `--check` mode that diffs the apply result against the current tree and exits non-zero if there are changes (useful for CI assertion that bootstrap is in sync).
- 6.4 Add `pnpm` script: `apply:bootstrap` and `apply:bootstrap:check`.

**Files touched:** `scripts/apply-bootstrap.js`, `package.json`.

**Verification:** `node scripts/apply-bootstrap.js plugins/bootstrap` exits 0 with no network calls (run with `--no-network` via offline sandbox if available; otherwise the script asserts it never spawns `git`/`curl`/`fetch`). `--check` exits 0 when scaffolding is in sync.

**Definition of done:** Script works locally and from CI; release-please workflow invokes it on bootstrap releases; conventional commit `feat: #58 implement bootstrap self-apply script`.

### Workstream 7 — Wiki migration and docs trim (AC-58-6; depends on Workstreams 4, 5)

**Goal:** Publish wiki pages first, then trim repo docs. Provide redirects via links so no content disappears.

**Order is load-bearing — publish before delete.**

**Tasks:**

- 7.1 Inventory content slated to move (from the upstream `README.md`s for each plugin, plus install walkthroughs and troubleshooting). List in `docs/wiki-index.md` with target wiki page names.
- 7.2 Publish each wiki page on `patinaproject/skills.wiki` with the content from the upstream `README.md`s and the design's "Move to wiki" list:
  - `Install-Claude-Code`
  - `Install-Codex`
  - `Skill-bootstrap-usage`
  - `Skill-superteam-usage`
  - `Skill-using-github-usage`
  - `Troubleshooting`
  - `How-Superteam-Runs-End-To-End`
- 7.3 Update `README.md` to point at the wiki pages.
- 7.4 Update both marketplace manifest descriptions to link to the relevant wiki page per plugin.
- 7.5 Trim `docs/` to: `AGENTS.md`-related content stays in root (`AGENTS.md`, `CLAUDE.md`), `docs/release-flow.md` (rewritten in Workstream 4), `docs/file-structure.md` (rewritten — new layout, Gate G2 result), `docs/wiki-index.md`, `docs/superpowers/specs/`, `docs/superpowers/plans/`.
- 7.6 Update each `plugins/<name>/README.md` so it is a thin pointer to the relevant wiki page rather than carrying duplicate content. Keep the file present so npm/codex marketplace listings don't 404 on README lookups.

**Files touched:** `README.md`, `docs/wiki-index.md` (new), `docs/file-structure.md`, `docs/release-flow.md`, `plugins/*/README.md`, marketplace manifests.

**Verification:**

- `markdownlint-cli2` passes (`pnpm lint:md`).
- Every wiki page named in `docs/wiki-index.md` exists on the published wiki (manual check by Executor; record URLs in PR body).
- `README.md` links to the wiki and to `npx <resolved-name>`.

**Definition of done:** Wiki published, repo docs trimmed, conventional commit `docs: #58 migrate user docs to wiki and trim docs/`.

### Workstream 8 — Document Workstream 8 / migration record (AC-58-8)

**Goal:** Record the merge choice and upstream-archive plan in-repo so future contributors can recover the source history.

**Tasks:**

- 8.1 Add a `Migration history` section to `docs/file-structure.md` recording:
  - The `git subtree add` command sequence used (Workstream 1).
  - The three upstream tags imported (`bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`).
  - The decision to archive (not delete) the upstream repos.
  - The expected archival timeline ("at least one release cycle after consolidation," per design).
- 8.2 Open a tracking issue (or annotate the existing #58) noting which upstream repos still need to be archived and when. Executor does this *after* the PR for #58 merges; do not pre-archive.

**Files touched:** `docs/file-structure.md`.

**Verification:** Section present, lists the three tags, names the merge mechanism.

**Definition of done:** Conventional commit `docs: #58 record subtree-merge migration history`.

## Workstream dependency graph

```text
W1 (subtree merge) ──┬─> W2 (manifests + validator) ──┬─> W3 (AC-58-3 harness) ──> W5 (CLI)
                     │                                 │
                     └─> W6 (apply-bootstrap)          └─> W4 (release-please) ──> W7 (wiki migration)
                                                                                   │
                                                                                   └─> W8 (migration record)
```

W3 and W4 can run in parallel after W2. W5 depends on W3 (uses the CLI skeleton). W6 can run in parallel with W3, but W4 wires the release-please workflow to call W6's script — both must land before W4 ships.

## AC traceability

| AC | Workstreams |
| --- | --- |
| AC-58-1 | W1.4, W1.2 |
| AC-58-2 | W2.1, W2.2 |
| AC-58-3 | W3.1, W3.2, W3.3 (three exit-0 checks) |
| AC-58-4 | W5.1–W5.7 |
| AC-58-5 | W4.1–W4.6, W6.1–W6.4 (Gate G3 path) |
| AC-58-6 | W7.1–W7.6, Gate G5 |
| AC-58-7 | W1.1, W1.3 (SHA-256 round-trip) |
| AC-58-8 | W1 mechanism choice + W8.1 record |

## ATDD verification (AC-58-3 falsifiable checks)

The Executor must include the following commands in CI (`.github/workflows/lint-md.yml` is not the right home; add a new job in a new or existing workflow under `.github/workflows/verify-iteration.yml`):

### Check a — overlay registration exits 0

```sh
node packages/skills-cli/bin/skills.mjs --dev
echo "exit=$?"
```

Pass criterion: exit code 0.

### Check b — validator accepts dev overlay and rejects it in release mode

```sh
node scripts/validate-marketplace.js --dev    # must exit 0
# then temporarily simulate overlay leak:
cp .claude-plugin/marketplace.local.json /tmp/leak.json
node scripts/validate-marketplace.js          # must still exit 0 (file is at dev path)
# Move overlay to a release-eligible path and assert non-zero:
cp .claude-plugin/marketplace.local.json packages/skills-cli/marketplace.local.json
! node scripts/validate-marketplace.js        # expect non-zero
rm packages/skills-cli/marketplace.local.json
```

Pass criterion: first two commands exit 0; the third exits non-zero (negated with `!`).

### Check c — bootstrap apply against this repo without network

```sh
node scripts/apply-bootstrap.js plugins/bootstrap
echo "exit=$?"
```

Pass criterion: exit code 0; the script must not call `git fetch`, `npm install` against the remote registry, or any `curl`/`fetch`. Enforced by the script's own outbound-call guard.

All three checks must run in CI on every PR that touches `plugins/`, `packages/`, `scripts/`, or the manifest files.

## Risks and blockers (cross-workstream)

- **G6 unresolved** blocks Workstream 5.7 (npm publish) and the final `README.md` install line. Executor resolves it as the first step of W5.
- **G2 unresolved** at runtime against the live Codex CLI could force a manifest schema change late in the flow. Mitigation: W3.4 verifies before W7's wiki content references the path-source convention.
- **SHA-256 round-trip failure** in W1.3 indicates `git subtree add` produced non-byte-equivalent content (line endings, etc.). Recovery: rerun the subtree add with `--strategy=ours` is not safe; instead, use `git subtree add --prefix=plugins/superteam upstream-superteam v1.5.0 --squash=false` and inspect; if still drifting, switch to a direct `git read-tree --prefix` from the tag tree object. Document the chosen recovery in W8.
- **release-please tag-prefix interaction with the validator regex.** Gate G1's choice (strip prefix when writing manifests) means a misconfigured release-please `extra-files` JSONPath could write `bootstrap-v1.11.0` into a `ref` field, which the validator would catch. Treat this as fail-fast, not silent.
- **Wiki link rot.** Per Gate G5, the wiki is canonical and `docs/wiki-index.md` is the in-repo index. A future reviewer can run a link-check against the wiki index as a follow-up; not in scope here.

## Rollback approach per workstream

- **W1:** `git reset --hard` to the pre-merge SHA, recorded in the PR body.
- **W2:** revert the manifest + validator commit; both marketplace manifests still resolve against upstream tags from the previous main commit if the W1 commit is also reverted, or against `patinaproject/skills` tags otherwise.
- **W3:** revert commit; AC-58-3 checks revert with it.
- **W4:** revert the workflow commit and restore `plugin-release-bump.yml` from commit `e97f4eb`. The cross-repo dispatch in the three upstream repos continues to function until those repos are archived.
- **W5:** unpublish the CLI from npm within the 72-hour window if needed; otherwise deprecate and re-release. Repo-side: revert the `packages/skills-cli/` commit.
- **W6:** revert the script commit; the release-please workflow's bootstrap-apply step becomes a no-op (the conditional fails the file-exists check).
- **W7:** wiki content is recoverable from wiki history; repo docs are recoverable via `git revert`. Order is enforced (publish before delete) so a partial rollback never leaves users without docs.
- **W8:** trivial revert.

## Out of scope (called out so Executor does not gold-plate)

- Rewriting any plugin's `SKILL.md` content. The migration is byte-equivalent. Any SKILL.md edit is its own issue with its own `AC-<issue>-<n>` IDs.
- Auto-invoking host CLIs from `npx skills` (Gate G4 — tracked as follow-up).
- Building a public registry beyond what GitHub Releases + `package.json` provide.
- Archiving the upstream repos. Recorded in W8.2 as a post-merge action.

## Done-report mapping

The Finisher will reference this plan's workstream IDs (`W1`–`W8`) and Gate IDs (`G1`–`G6`) in the eventual PR body's `Acceptance Criteria` section so each `AC-58-<n>` heading has verification steps anchored to specific tasks.
