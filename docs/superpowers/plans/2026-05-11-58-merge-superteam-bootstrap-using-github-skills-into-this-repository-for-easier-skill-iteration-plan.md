# Plan: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Source design

- Approved design: [`docs/superpowers/specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md`](../specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md)
- Approved-design head: `1d9b8ea` (post Gate-1 delta-final; includes the canonical-layout / vercel-labs CLI / scaffold-repository rename / office-hours port deltas)
- Selected approach: Option A (per-package release-please monorepo with canonical workspace overlay, local-path dev overlay, and vercel-labs CLI integration — no in-repo CLI)
- ACs in scope: `AC-58-1` through `AC-58-8`

## Plan revision history

The previous plan (`d74e236`) was written against the pre-delta design. It has been **rewritten in place** rather than carried forward as a delta, because three deltas substantively re-shaped the implementation surface:

1. **Canonical workspace overlay** (`.agents/skills/<name>/` and `.claude/skills/<name>/` symlinked into `plugins/<name>/skills/<name>/`) replaces the original "in-repo skills live only under `plugins/`" mental model. New workstream **W10** owns this layout.
2. **vercel-labs CLI adoption** (Gate G6 closed) removes the original Workstream 5 (build a CLI under `packages/skills-cli/`). The replacement W5 is documentation/integration work pointing at `npx skills@1.5.6 add patinaproject/skills@<plugin>`.
3. **`bootstrap` → `scaffold-repository` rename** (the in-tree copy only; upstream repo unchanged). New workstream **W9** owns the rename, sequenced after W1 (subtree import) and before W2 (manifests) so manifest edits land against the renamed slug once.
4. **office-hours standalone-skill port** (new file at `.agents/skills/office-hours/SKILL.md`, byte-for-byte from `patinaproject/patinaproject` PR #1143 head `02e6ebbdbef123bbeb211fad06aa86bd5e33528a`) is folded into W10 (canonical-layout setup) and W7 (wiki migration).
5. **AC-58-3 dogfood verification** is mechanized as `scripts/verify-dogfood.sh` covering five skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`). New workstream **W11** owns the script and the CI wiring.

Gate decisions that survive from the pre-delta plan (Gates G1, G2, G3, G5) are reaffirmed below; Gate G4 is dispositioned as "out of scope (delegated to vercel-labs CLI)"; Gate G6 is closed with the design's resolution.

### Pending W2 stash disposition

`git stash list` shows `wip-w2-pre-brainstormer-delta` from the prior Executor batch. The stashed diff edits both marketplace manifests to repoint `bootstrap` / `superteam` / `using-github` entries at `patinaproject/skills` and extends `scripts/validate-marketplace.js`. **All three plugin-entry edits target the pre-rename slug `bootstrap`**, which W9 renames to `scaffold-repository`. **Recommendation: discard the stash and redo W2 from scratch.** The stashed validator extension may also be obsolete because W2 below changes which fields the dev-mode validator asserts (renamed surfaces in `marketplace.local.json`, plus the new W11 dogfood symlink invariants the release-mode validator must also gate). Re-deriving W2 against the renamed plugin and the canonical-layout requirements is faster than rebasing the stashed diff. Executor's first action in W2: `git stash drop stash@{0}` after confirming no other in-flight stashes are queued.

## Planner gates (resolve before Executor starts)

These are decisions the design left to the Planner. Each is committed below so the Executor follows them without revisiting.

### Gate G1: Per-plugin tag prefix mapping (open question 1) — REAFFIRMED

`release-please` monorepo mode emits prefixed tags (`scaffold-repository-v1.11.0`, `superteam-v1.6.0`, `using-github-v2.1.0`). The existing manifest validator regex is `^v(\d+\.\d+\.\d+)$`.

**Decision (unchanged from previous plan, retargeted at renamed plugin):** Strip the per-package prefix when writing manifest `ref` values; do **not** weaken the validator. The release-please workflow extracts the semver portion from each prefixed tag and writes `vX.Y.Z` into both marketplace manifests' `source.ref` fields. The longest-match strip rule against the alternation `^(scaffold-repository|superteam|using-github)-v(\d+\.\d+\.\d+)$` (per design's tag-prefix-collision-check bullet) keeps each prefix unambiguous. No `packages/skills-cli` row exists in this regex because the CLI is consumed via `npx`, not republished from this repo (Gate G6).

### Gate G2: Codex dev-overlay source mode (open question 2) — REAFFIRMED

The dev overlay must use a manifest source mode Codex accepts. The Planner has not been able to run a live Codex against a path source from this worktree.

**Decision (unchanged):** Use `"source": "path"` with a repo-relative `path` field for the Codex dev overlay (`marketplace.local.json`), mirroring the Claude convention. If Executor verification (W11 / W3) shows Codex rejects `source: path`, fall back to `git+file://` URLs against the local clone, recorded in the same overlay file. Executor must record which fallback is in effect in `docs/file-structure.md` so it does not silently drift.

### Gate G3: Scaffold-repository self-apply ownership (open question 3, AC-58-5) — REAFFIRMED AND RENAMED

The script formerly named `apply-bootstrap.js` is renamed to `apply-scaffold-repository.js` (per the rename delta).

**Decision (substance unchanged, retargeted):** `scripts/apply-scaffold-repository.js` is invoked from the release-please workflow **only when a release-please release manifest mutates `plugins/scaffold-repository/`** (detected by inspecting the release-please job output `paths_released`). The result of running it is committed onto the same release-please PR branch in the same workflow run, preserving the existing "scaffold bump and scaffolding refresh land in one PR" property documented in `docs/release-flow.md`. On non-scaffold-repository releases the step is skipped. The TODO in the legacy `plugin-release-bump.yml` is therefore *implemented*, not deferred — AC-58-5's "explicit deferral with tracked follow-up" path is rejected.

### Gate G4: CLI host detection (open question 4) — DISPOSITIONED (delegated to upstream CLI)

Per the design's closing line on this question: "Host detection / auto-invocation: out of scope here (Planner's Gate G4 carried this; with the vercel-labs CLI doing the heavy lifting, host detection is the CLI's concern, not ours)."

**Decision:** This repo does not implement host detection. `npx skills@1.5.6 add patinaproject/skills@<plugin> --agent <agent> -y` requires the user to pass `--agent claude-code` or `--agent codex` explicitly per the vercel-labs CLI's documented interface. `README.md` documents both invocations side-by-side. No work product in this plan ships a host-detection capability; if a future contributor wants one, it is a follow-up issue against the upstream CLI, not this repo.

### Gate G5: Wiki ownership of record (open question 5) — REAFFIRMED, OFFICE-HOURS EXTENDS THE PAGE LIST

The wiki is the canonical surface. The repo carries one file, `docs/wiki-index.md`, listing every wiki page name and its purpose. The Executor publishes wiki pages before deleting any source `README.md` content from the upstream packages.

The wiki page list is extended by one entry for `office-hours` (per the design's AC-58-6 amendment); see W7 below.

### Gate G6: `npx skills` package name — CLOSED (adopt vercel-labs)

**Resolution (per design):** The bare npm name `skills` is owned by `vercel-labs/skills`. This repo does **not** author or publish its own `skills` CLI. The primary documented install path is `npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@<plugin> --agent <agent> -y` against the upstream CLI (CLI version pinned at invocation, `--ignore-scripts` defense-in-depth as the default form).

**Consequence:** Workstream 5 in the previous plan (build/publish our own CLI) is **replaced** by W5 below (CLI integration: install commands, README, marketplace manifest descriptions; no new package directory, no `npm publish` step, no `bin`).

## Sequenced workstreams

The workstreams are ordered. Tasks within a workstream may be parallelized only when explicitly noted.

Ordering: **W1 → W9 → W2 → (W3 ‖ W4 ‖ W6 ‖ W10 ‖ W11) → W5 → W7 → W8.** The rename (W9) lands after the subtree imports (W1) and before manifest edits (W2) so the marketplace, scripts, release-please config, and dev overlays are written against the renamed slug once. Canonical-overlay setup (W10) depends on W9 because the symlinks reference `plugins/scaffold-repository/skills/scaffold-repository/`.

### Workstream 1 — Subtree-merge import (AC-58-1, AC-58-7, AC-58-8) — ALREADY ON BRANCH

**Goal:** Bring `plugins/bootstrap/`, `plugins/superteam/`, `plugins/using-github/` into this repo from their tagged upstream releases, with history preserved and byte-equivalent content.

**Status:** The three subtree merges already exist on this branch as commits `912d6d9` (`bootstrap@v1.10.0`), `028165e` (`superteam@v1.5.0`), `54157bc` (`using-github@v2.0.0`). The byte-equivalence SHA-256 receipts already live under `docs/superpowers/plans/.artifacts/` (`sha256-pre.txt`, `sha256-pre-skillmd.txt`, `sha256-pre-nonneg.txt`, `sha256-post.txt`). No further import work is needed.

**Tag bases imported:** `bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0` (matches the current marketplace pins; see the migration record commit `89d8f1c`).

**Verification already done (do not re-run unless rolling back):**

- 1.1 (DONE) SHA-256 of upstream `superteam@v1.5.0` SKILL.md + non-negotiable-rules block captured pre-merge. (AC-58-7)
- 1.2 (DONE) Three `git subtree add` commands ran in order; each produced a merge commit; none was rebased or squashed.
- 1.3 (DONE) SHA-256 recomputed against `plugins/superteam/skills/superteam/SKILL.md` post-merge; receipts are byte-equal. (AC-58-7)
- 1.4 (DONE) Each `plugins/<name>/` contains both `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json` and the `skills/<name>/` tree. (AC-58-1)
- 1.5 (DONE) Temporary upstream remotes are no longer in `git remote`.

**Risks/rollback:** If a downstream workstream finds that subtree content drifted, `git reset --hard 54157bc` (or `028165e` / `912d6d9`) recovers earlier import state. Upstream repos remain archived per the design.

### Workstream 9 — Rename `plugins/bootstrap/` to `plugins/scaffold-repository/` (AC-58-1, AC-58-7 exemption, AC-58-8; depends on W1)

**Goal:** Rename the in-tree copy of the `bootstrap` plugin to `scaffold-repository` in a single reviewable diff. Upstream `patinaproject/bootstrap` repository keeps its name and `v1.10.0` tag; only the in-tree copy and its consumer-visible surfaces in this repo are renamed.

**Order rationale:** W9 lands **after W1** (so the rename happens against imported content, preserving per-file blame across the `git mv`) and **before W2** (so marketplace manifests are edited once against the renamed slug, not twice). All downstream workstreams (W4 release-please config, W6 apply script, W10 canonical overlay, W11 dogfood script) reference the renamed slug.

**Tasks:**

- 9.1 Run `git mv plugins/bootstrap plugins/scaffold-repository` and `git mv plugins/scaffold-repository/skills/bootstrap plugins/scaffold-repository/skills/scaffold-repository`. Git's rename detection preserves per-file blame; do not delete-and-recreate.
- 9.2 Edit `plugins/scaffold-repository/skills/scaffold-repository/SKILL.md`:
  - Frontmatter `name: bootstrap` → `name: scaffold-repository`.
  - Frontmatter `description:` trigger phrase rewrite: `"bootstrap this repo"` → `"scaffold this repo"`. The upstream phrase `"scaffold a Patina plugin"` stays. Other trigger phrases (`"realign with the baseline"`, `"audit our repo conventions"`, `"set up commitlint and husky"`, `"add Codex/Cursor/Windsurf surfaces"`) are unchanged.
  - H1 heading `# bootstrap` → `# scaffold-repository`.
  - Body references to the plugin name (e.g. opening sentence `` `bootstrap` scaffolds a repository... `` → `` `scaffold-repository` scaffolds a repository... ``). Use `rg -F 'bootstrap'` over the SKILL.md to enumerate occurrences, then triage each per the design's "Out of scope for the rename" subsection (preserve generic English usage like "bootstrap command" or "bootstrap hook").
  - References to the upstream repo URL `https://github.com/patinaproject/bootstrap` are **preserved** (still resolves to the archived upstream).
- 9.3 Edit `plugins/scaffold-repository/.claude-plugin/plugin.json`:
  - `name: "bootstrap"` → `"scaffold-repository"`.
  - `keywords`: drop the `bootstrap` keyword in favor of `scaffold-repository`; the existing `scaffold` keyword stays.
  - `homepage` / `repository`: preserved (continue to point at `patinaproject/bootstrap` while it exists as the archived upstream).
- 9.4 Edit `plugins/scaffold-repository/.codex-plugin/plugin.json`:
  - `name`, `keywords`: same edits as 9.3.
  - `interface.displayName`: `Bootstrap` → `Scaffold Repository`.
  - `interface.shortDescription`, `interface.longDescription`: rewrite the plugin-name occurrences; preserve generic English.
  - `interface.defaultPrompt`: rewrite `$bootstrap` → `$scaffold-repository` in each prompt string.
  - `homepage` / `repository`: preserved.
- 9.5 If `plugins/scaffold-repository/package.json` exists, edit `name` to `scaffold-repository`. (Verify presence at execution time — the upstream `bootstrap` package may not ship a top-level `package.json` separate from the marketplace's.)
- 9.6 Search-and-replace blast-radius triage: run `rg -F 'bootstrap'` over the renamed plugin directory and over the repo root files that W2/W4/W6 will touch (marketplace manifests, release-please config, AGENTS.md, README, docs/release-flow.md, docs/file-structure.md). For each hit, decide: is this a plugin-name reference (rename) or generic English (preserve)? The design's "Out of scope for the rename" subsection lists the canonical preserved-English cases (`pnpm install` as a "bootstrap command", Husky bootstrap hooks, `chore: bootstrap commit hooks` commit-message examples). **Do not use `sed -i 's/bootstrap/scaffold-repository/g'`** — the renames are listed in the design's Plugin rename catalog and must be applied surface-by-surface.
- 9.7 Commit with: `refactor: #58 rename bootstrap plugin to scaffold-repository`. This is the rename commit referenced in AC-58-8's migration history entry.

**Files touched in W9:** `plugins/scaffold-repository/**` (whole directory via `git mv`), `plugins/scaffold-repository/skills/scaffold-repository/SKILL.md`, `plugins/scaffold-repository/.claude-plugin/plugin.json`, `plugins/scaffold-repository/.codex-plugin/plugin.json`, `plugins/scaffold-repository/package.json` (if present).

**Files NOT touched in W9** (deferred to the workstream that owns each surface): marketplace manifests (W2), release-please config (W4), `scripts/apply-scaffold-repository.js` (W6), AGENTS.md / README / docs (W2 / W4 / W7), canonical overlay symlinks (W10), dogfood script (W11). W9 is scoped to the renamed plugin's interior plus the `git mv` itself.

**Verification:**

- `test -d plugins/scaffold-repository && ! test -d plugins/bootstrap` confirms the directory rename.
- `grep -l '"name": "scaffold-repository"' plugins/scaffold-repository/.{codex,claude}-plugin/plugin.json` returns both manifest paths.
- `head -10 plugins/scaffold-repository/skills/scaffold-repository/SKILL.md` shows `name: scaffold-repository` in the frontmatter.
- `rg -F 'bootstrap' plugins/scaffold-repository/` reveals only surviving English-as-generic-verb uses (acceptable) and `https://github.com/patinaproject/bootstrap` URL references (acceptable per design).

**Definition of done:** Renamed plugin is internally consistent; the renamed-plugin SKILL.md `name:` matches the directory name; conventional commit landed.

**Risks/rollback:** If the rename diff turns out to be larger than expected (e.g. a body-text rewrite slipped beyond the rename surface), revert the commit and re-do with a tighter scope. The `git mv` is reversible.

### Workstream 2 — Marketplace manifests, dev overlay, and validator extension (AC-58-2, AC-58-3 check b; depends on W9)

**Goal:** Manifests in released form pin `vX.Y.Z` against `patinaproject/skills` itself with the renamed `scaffold-repository` slug; dev overlays declare path-based sources for in-repo iteration; validator gains a dev-mode that accepts the overlay and a release-mode that rejects both overlay leaks and canonical-overlay symlink leaks.

**W2 stash disposition:** Drop `stash@{0}` (`wip-w2-pre-brainstormer-delta`) before starting. Its diff is stale relative to the renamed plugin and the new release-mode invariants. Executor's first command: `git stash drop stash@{0}` after `git stash show --name-only stash@{0}` to confirm it is the pre-delta W2 stash and not something else queued in the meantime.

**Tasks:**

- 2.1 Update `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`:
  - All three plugin entries' `source` field points at this repo: Claude `repo: patinaproject/skills`; Codex `url: https://github.com/patinaproject/skills.git`.
  - The Bootstrap entry's `slug` / `name` / `displayName` is `scaffold-repository`; the entry's `description` removes the standalone word "Bootstrap" as plugin label (English elsewhere preserved).
  - The `ref` for each entry is `vX.Y.Z` taken from the most recent per-plugin release-please tag (initially the same as the upstream tags: `v1.10.0` for scaffold-repository, `v1.5.0` for superteam, `v2.0.0` for using-github). (AC-58-2)
- 2.2 Create `.agents/plugins/marketplace.local.json` and `.claude-plugin/marketplace.local.json` declaring each plugin entry with a path source per Gate G2:
  - Claude: `"source": { "source": "path", "path": "../../plugins/<slug>" }`.
  - Codex: `"source": { "source": "path", "path": "../../plugins/<slug>" }` (with Gate G2 fallback recorded in `docs/file-structure.md` if verification rejects).
  - Slugs are `scaffold-repository`, `superteam`, `using-github`. The dev overlay does **not** carry an `office-hours` entry (standalone skill — design's "Standalone skills" subsection: standalone skills are not marketplace entries).
- 2.3 Extend `scripts/validate-marketplace.js`:
  - Default (release) mode: existing `vX.Y.Z` regex check. Additionally fail if either `marketplace.local.json` is present at release-eligible paths covered by the `release-please` extra-files / `git archive` `export-ignore` allowlist (defense-in-depth against the leak risk in the design's Risks section).
  - Release mode also fails if any of the three plugin entries' `slug` / `name` is `bootstrap` (defense-in-depth against an accidental revert that re-introduces the pre-rename slug into a released manifest). The check is a literal-string deny on `"name": "bootstrap"` and `"slug": "bootstrap"` in the published manifest files.
  - Release mode also fails if the marketplace manifests carry an entry whose slug or name is one of the known standalone skills (`office-hours`). The deny list is a small literal-string array, expandable as new standalone skills are added. Defense-in-depth: the design explicitly states standalone skills are **not** marketplace entries; this check prevents an accidental promotion that would leak the standalone skill into a release.
  - `--dev` mode: validate the two `marketplace.local.json` files instead of the released manifests; assert each `path` resolves to a directory containing `.codex-plugin/plugin.json` (for the Codex overlay) or `.claude-plugin/plugin.json` (for the Claude overlay); skip the `vX.Y.Z` rule.
  - Preserve the existing `--remote` mode but update it to consult `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json` *at the tagged ref on this repo* rather than at the upstream repo. (Network-free: read the in-tree files at the current branch HEAD and assert their `version` fields match the manifest `ref` semver.)
- 2.4 Add npm script entries: `validate:marketplace`, `validate:marketplace:dev`, `validate:marketplace:remote`.

**Files touched:** `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.local.json` (new), `.claude-plugin/marketplace.local.json` (new), `scripts/validate-marketplace.js`, `package.json`.

**Verification:**

- `node scripts/validate-marketplace.js` exits 0 against the released manifests.
- `node scripts/validate-marketplace.js --dev` exits 0 against the overlays.
- `node scripts/validate-marketplace.js` exits non-zero if a `marketplace.local.json` is moved into the would-be-released payload (smoke this by temporarily placing it in a release-eligible spot).
- `node scripts/validate-marketplace.js` exits non-zero if a manifest entry's `name` is reverted to `bootstrap` (smoke by temporary edit + revert).
- `node scripts/validate-marketplace.js` exits non-zero if a standalone-skill slug (`office-hours`) is injected into either manifest (smoke by temporary edit + revert).

**Definition of done:** All validator modes exit as expected; conventional commit `feat: #58 wire marketplace to in-repo scaffold-repository plugin and dev overlay`.

### Workstream 10 — Canonical workspace overlay (AC-58-1, AC-58-3 dogfood preconditions; depends on W9)

**Goal:** Establish `.agents/skills/<name>/` as the canonical workspace overlay surface and `.claude/skills/<name>/` as the Claude Code skill-loader symlink layer pointing into it. All five in-repo skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`) are reachable through the canonical layout by the end of this workstream.

**Order rationale:** W10 lands **after W9** so all symlinks reference the renamed `plugins/scaffold-repository/skills/scaffold-repository/` path. W10 can run in parallel with W2 / W3 / W4 / W6 / W11 because none of those workstreams touch `.agents/skills/` or `.claude/skills/` directly (W11 reads but does not write them).

**Tasks:**

- 10.1 Create `.agents/skills/` directory at the repo root.
- 10.2 Create plugin-scoped symlinks (relative symlinks for portability across clones):
  - `.agents/skills/scaffold-repository` → `../../plugins/scaffold-repository/skills/scaffold-repository`
  - `.agents/skills/superteam` → `../../plugins/superteam/skills/superteam`
  - `.agents/skills/using-github` → `../../plugins/using-github/skills/using-github`
  - Use `ln -s ../../plugins/<name>/skills/<name> .agents/skills/<name>` from the `.agents/skills/` directory so the symlink target is a relative path (works on every clone regardless of clone location).
- 10.3 Install `find-skills` if not already present in this worktree, then reconcile to canonical layout. The operator prompt notes the install already happened in another context; if this worktree lacks `.claude/skills/find-skills/SKILL.md` and `skills-lock.json`, run the command `npm_config_ignore_scripts=true npx skills@1.5.6 add vercel-labs/skills@find-skills --agent claude-code -y`. Then reconcile (whether the install happened just now or previously):
  - Create directory `.agents/skills/find-skills/`.
  - Move the real file: `git mv .claude/skills/find-skills/SKILL.md .agents/skills/find-skills/SKILL.md` (preserves blame; the CLI wrote a real file or a symlink into a copied tree depending on `--agent`; if it is itself a symlink, dereference and commit the real file content under `.agents/skills/find-skills/`).
  - Replace `.claude/skills/find-skills/` (if present) with a relative symlink: `.claude/skills/find-skills` → `../../.agents/skills/find-skills`.
  - Confirm `skills-lock.json` at the repo root is committed (its CLI-chosen location; do not move it).
- 10.4 Port `office-hours` standalone skill from `patinaproject/patinaproject` PR #1143 at head SHA `02e6ebbdbef123bbeb211fad06aa86bd5e33528a`. Source path in the upstream PR: `office-hours/SKILL.md` (or wherever the PR places the file; Executor fetches the PR head and records the exact source path in the commit message). Target path in this repo: `.agents/skills/office-hours/SKILL.md` (real file, not a symlink). The port is byte-for-byte. Sequence:
  - `mkdir .agents/skills/office-hours/`.
  - Fetch the upstream file content via `gh api` against the PR head SHA (so the port is reproducible). Record the URL fetched in the commit message body.
  - Write the file content verbatim. Verify `sha256sum` of the local file matches the upstream PR head SHA's blob.
  - Commit with: `feat: #58 port office-hours standalone skill from patinaproject/patinaproject PR #1143 @ 02e6ebbd`. This commit SHA is the value Executor records in the design's Ported skills catalog (AC-58-8).
- 10.5 Create the Claude Code skill-loader symlinks for all five skills (one hop each per design, no two-hop chains for the Claude layer):
  - `.claude/skills/scaffold-repository` → `../../.agents/skills/scaffold-repository`
  - `.claude/skills/superteam` → `../../.agents/skills/superteam`
  - `.claude/skills/using-github` → `../../.agents/skills/using-github`
  - `.claude/skills/find-skills` → `../../.agents/skills/find-skills`
  - `.claude/skills/office-hours` → `../../.agents/skills/office-hours`
  Use `ln -s` from `.claude/skills/` so each link target is a relative path.
- 10.6 Confirm `git` tracks symlinks. macOS and Linux track symlinks by default; if `git config --get core.symlinks` returns `false` on a contributor machine, document the override in `docs/file-structure.md` (`git config core.symlinks true`). The Executor's verification step `git ls-files -s .claude/skills/ .agents/skills/` should show mode `120000` for each symlink entry. Add to `docs/file-structure.md` a "Symlink hygiene" subsection covering the `core.symlinks` requirement, the relative-target convention, and the rule that symlinks are workspace-only and must not leak into a release.
- 10.7 Update `.gitignore` if necessary so the canonical overlay is **tracked** (the current `.gitignore` only excludes `node_modules/` and `docs/superpowers/plans/.artifacts/`; no change should be required, but Executor verifies). Add `.gitattributes` rules to set `.agents/skills/** export-ignore` and `.claude/skills/** export-ignore` so `git archive` produces release tarballs without the overlay surface. The design's Risks bullet on "Canonical-layout symlinks leaking into a release" requires this defense-in-depth.
- 10.8 Commit the canonical-layout work in two commits to keep review surface small:
  - `feat: #58 establish canonical skill overlay layout under .agents/skills`
  - `feat: #58 port office-hours standalone skill ...` (the W10.4 commit above)

**Files touched:** `.agents/skills/{scaffold-repository,superteam,using-github,find-skills,office-hours}/` (new entries; some symlinks, some real files), `.claude/skills/{scaffold-repository,superteam,using-github,find-skills,office-hours}` (new symlinks), `.gitattributes`, `docs/file-structure.md` (Symlink-hygiene subsection).

**Verification:**

- All five `.claude/skills/<name>/SKILL.md` resolve to a real file via `test -e .claude/skills/<name>/SKILL.md`.
- For the three plugin-scoped skills, the symlink chain follows `.claude/skills/<name> -> .agents/skills/<name> -> plugins/<name>/skills/<name>` (`readlink` shows the expected target at each hop).
- For `find-skills`, the chain follows `.claude/skills/find-skills -> .agents/skills/find-skills`, and `.agents/skills/find-skills/SKILL.md` is a real file.
- For `office-hours`, the chain follows `.claude/skills/office-hours -> .agents/skills/office-hours`, and `.agents/skills/office-hours/SKILL.md` is a real file whose SHA-256 matches the upstream PR head SHA's blob.
- `git ls-files -s .claude/skills/ .agents/skills/` shows mode `120000` for every symlink entry and `100644` for real-file entries (`find-skills/SKILL.md` and `office-hours/SKILL.md`).
- `git archive HEAD --format=tar | tar -tf - | grep -E '^.agents/skills/|^.claude/skills/'` returns empty (confirming `export-ignore` is in effect).

**Definition of done:** All five skills are discoverable via the canonical overlay; `git archive` excludes the overlay paths; two commits landed.

**Risks/rollback:** If a contributor's `core.symlinks` is `false` on Windows or a misconfigured WSL, symlinks materialize as plain files containing the target path string. Mitigation: `docs/file-structure.md` Symlink-hygiene subsection documents the `git config core.symlinks true` override; the dogfood script (W11) catches the breakage in CI.

### Workstream 3 — Verification harness for AC-58-3 checks a/b/c/d (depends on W2, W6, W11)

**Goal:** Four falsifiable exit-0 invocations exist and are documented in `README.md`. The dogfood check (new check d) is split into W11 below; W3 is the integration / documentation layer.

**Tasks:**

- 3.1 (DEFERRED to W6) `scripts/apply-scaffold-repository.js` (skeleton invoked by AC-58-3 check c) is implemented in W6 below. W3 references the W6 deliverable.
- 3.2 (REMOVED) The previous plan's W3.2 ("`--dev` mode in `packages/skills-cli/bin/skills.mjs`") is removed. Gate G6 closed; no in-repo CLI exists. AC-58-3 check a's new form is below.
- 3.3 Document the four checks in `README.md` under "Local iteration":
  - **Check a** (replaces overlay-registration): `npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code --dry-run` (or the closest falsifiable equivalent the CLI supports — Executor inspects `skills --help` against the pinned `1.5.6` version and picks the most deterministic falsifiable form. If `--dry-run` is unavailable, the documented form becomes the actual install against a scratch `--prefix /tmp/skills-dryrun` so it does not mutate the working tree.). The CLI must resolve `scaffold-repository` and exit 0. Executor records the chosen command form in `README.md` and `docs/release-flow.md`. The same pattern is exercisable against `superteam`, `using-github`, `find-skills`, and (because standalone-skill resolution is the same CLI surface per the design's "Standalone skills" section) `office-hours`.
  - **Check b** (unchanged from previous plan): `node scripts/validate-marketplace.js --dev` (accept) and `node scripts/validate-marketplace.js` with the overlay misplaced (reject): exit 0 / non-zero.
  - **Check c** (renamed): `node scripts/apply-scaffold-repository.js plugins/scaffold-repository`: exit 0 with no network calls.
  - **Check d** (new): `bash scripts/verify-dogfood.sh`: exit 0 (per AC-58-3 dogfood verification; full implementation in W11).
- 3.4 **Gate G2 verification.** Executor manually exercises the Codex CLI's `marketplace add` against the path overlay from a fresh clone of this branch. If Codex rejects `source: path`, switch to `git+file://` URLs and update `marketplace.local.json` accordingly. Record the result in `docs/file-structure.md`.

**Files touched:** `README.md`, `docs/file-structure.md`.

**Verification:** Four exit-0 invocations all succeed on a fresh clone. CI runs the validator modes, the apply script, the CLI install dry-run, and the dogfood script. Executor records exit codes in the PR body.

**Definition of done:** AC-58-3 checks a/b/c/d all green; conventional commit `docs: #58 document AC-58-3 falsifiable checks`.

### Workstream 4 — `release-please` configuration (AC-58-5; depends on W1, W2, W9)

**Goal:** Replace `plugin-release-bump.yml` with `release-please`-driven releases. The release-please config is the single source of truth for what `vX.Y.Z` lands in both marketplace manifests.

**Tasks:**

- 4.1 Create `release-please-config.json` describing **three** packages (down from four in the previous plan — no `packages/skills-cli`):
  - `plugins/scaffold-repository` — release-type `node`, tag prefix `scaffold-repository-`, initial version `1.10.0`.
  - `plugins/superteam` — release-type `node`, tag prefix `superteam-`, initial version `1.5.0`.
  - `plugins/using-github` — release-type `node`, tag prefix `using-github-`, initial version `2.0.0`.

  Top-level options: `"separate-pull-requests": true`, `"plugins": ["node-workspace"]` is **not** required (no workspace deps). Each package declares `extra-files` for the two marketplace manifests so a release for `plugins/<name>` rewrites the matching plugin entry's `ref` to the new `vX.Y.Z` (with the per-package prefix stripped per Gate G1). Use release-please's `json` extra-files schema with a JSONPath like `$.plugins[?(@.name == "<name>")].source.ref`.
- 4.2 Create `.release-please-manifest.json` with the three packages and their initial versions.
- 4.3 Create `.github/workflows/release-please.yml`:
  - Trigger: `push` on `main`.
  - Step 1: `googleapis/release-please-action` (SHA-pinned per AGENTS.md GitHub-Actions-pinning rule) with the manifest config. Sign commits as `github-actions[bot]`.
  - Step 2 (only when `scaffold-repository` is among `paths_released`): checkout the release PR branch, run `node scripts/apply-scaffold-repository.js plugins/scaffold-repository`, commit any resulting scaffolding changes onto the same release PR branch with a `chore: #<skip> apply scaffold-repository scaffolding refresh` message (or equivalent under release-please conventions). Push back. (AC-58-5, Gate G3)
  - Step 3: enable auto-merge with `gh pr merge --auto --squash` on each open release-please PR.
  - Step 4: run `node scripts/validate-marketplace.js` after release-please mutates manifests and before auto-merge enables.
- 4.4 Delete `.github/workflows/plugin-release-bump.yml`.
- 4.5 Rewrite `docs/release-flow.md`:
  - New lifecycle: release-please opens standing per-package PRs; merging publishes the tag and updates the manifest `ref` via release-please's extra-files step; the scaffold-repository scaffolding refresh continues to land in the same PR for scaffold-repository releases.
  - Document Gate G1 (tag prefix stripping for manifest writes).
  - Remove the cross-repo dispatch section and the "required setup in each member plugin repo" section entirely.
  - Add `release-please--*` to the no-issue-tag exemption list alongside `bot/bump-*`.
  - Document the vercel-labs CLI version pin (`skills@1.5.6` at the time of this revision) and the rule that bumping the CLI version requires re-running `scripts/verify-dogfood.sh` and the W3 check-a `npx skills` install before merging.
  - Document the standalone-skill resolution behavior per design's "Standalone skills" subsection: `npx skills add patinaproject/skills@<name>` (no `@<ref>` qualifier) resolves to default-branch HEAD; consumers wanting a pinned version pass `#<git-ref>`.
- 4.6 Update `AGENTS.md`:
  - Add `release-please--*` to the no-issue PR exemption list.
  - Update the "Plugin Releases" section to describe release-please as the mechanism (replace the `repository_dispatch` paragraph) and to enumerate the renamed plugin (`scaffold-repository`, not `bootstrap`).
  - Update the source-of-truth boundary to "this repo's `plugins/<name>/` owns the package for `name ∈ {scaffold-repository, superteam, using-github}`; standalone skills (currently `office-hours`) own themselves at `.agents/skills/<name>/`."

**Files touched:** `release-please-config.json` (new), `.release-please-manifest.json` (new), `.github/workflows/release-please.yml` (new), `.github/workflows/plugin-release-bump.yml` (deleted), `docs/release-flow.md` (rewritten), `AGENTS.md` (updated).

**Verification:**

- `actionlint` passes on the new workflow.
- Dry-run release-please locally: `npx release-please --dry-run release-pr --config-file release-please-config.json --manifest-file .release-please-manifest.json` lists the expected three per-package PRs (no `packages/skills-cli` row).
- The validator runs at the right step and the workflow is pinned with SHA + comment per AGENTS.md GitHub-Actions-pinning rule.

**Definition of done:** New workflow file landed with SHA-pinned actions, old workflow removed, docs updated, conventional commit `feat: #58 replace dispatch workflow with release-please releases`.

**Risks/rollback:** If release-please mis-rewrites a `ref`, manifests are caught by `validate-marketplace.js` in CI. Manual rollback: revert the workflow change commit and restore `plugin-release-bump.yml` from `e97f4eb` (the most recent main commit that has it).

### Workstream 5 — vercel-labs `skills` CLI integration (AC-58-4; depends on W2, W10)

**Goal:** Document `npx skills@1.5.6 add patinaproject/skills@<plugin>` as the primary install entry point for each of the four marketplace-distributed skills (`scaffold-repository`, `superteam`, `using-github`, plus `find-skills` which uses the same CLI against `vercel-labs/skills`) and for the standalone `office-hours` skill. Update README and both marketplace manifest descriptions. **No new package, no `bin`, no `npm publish` step.**

**Gate G6 is closed** (per design's resolution). No `npm view skills` check is required; the vercel-labs CLI is already adopted by name.

**Tasks:**

- 5.1 Update root `README.md`:
  - "Install" section: list the pinned `npx skills@1.5.6 add patinaproject/skills@<plugin> --agent <agent> -y` invocation as the primary path, with `--ignore-scripts` via env var (`npm_config_ignore_scripts=true`) as the default form per design's supply-chain bullet (b). Show one command per plugin and one for `office-hours` standalone.
  - Keep host-native fallbacks documented (`/plugin marketplace add patinaproject/skills` for Claude, `codex plugin marketplace add patinaproject/skills --ref vX.Y.Z` for Codex).
  - Add a "Local iteration" subsection pointing at W3's check a (CLI dry-run / install-to-scratch), check b (validator dev mode), check c (`apply-scaffold-repository.js`), check d (dogfood script).
  - Document the vercel-labs CLI upstream URL (`https://github.com/vercel-labs/skills`) and the pinned version (`1.5.6`) per the supply-chain notes.
  - Document the standalone-skill resolution behavior (no `@<ref>` → default-branch HEAD; `#<git-ref>` → pinned).
- 5.2 Update both marketplace manifest descriptions (the three plugin-entry `description` fields in each manifest) to point at `npx skills@1.5.6 add patinaproject/skills@<slug>` for first-time install and to link the wiki page (W7) for the per-plugin usage walkthrough. Match the slug exactly: `scaffold-repository` / `superteam` / `using-github`.
- 5.3 No `packages/skills-cli/` directory is created. No `bin` is added. No `npm publish` step is added to the release-please workflow. The release-please config in W4 has three packages; this workstream does not modify it.
- 5.4 Record the CLI version pin in `docs/release-flow.md` (covered by W4.5 above; W5 references that as the source of truth so the README and the release-flow doc do not drift). The release-flow doc gates a CLI-version bump on re-running W3 check a and W11's dogfood script.

**Files touched:** `README.md`, `.agents/plugins/marketplace.json` (description-field edits only), `.claude-plugin/marketplace.json` (description-field edits only).

**Verification:**

- `npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code --dry-run` (or the chosen falsifiable form from W3.3 check a) exits 0 against this branch.
- The same against `superteam`, `using-github`, `find-skills`, and `office-hours` all exit 0. (For `find-skills`, the source repo is `vercel-labs/skills`, not `patinaproject/skills` — Executor verifies the README command line is correct for that case.)
- README's install snippet copy-pastes cleanly into a fresh shell (no broken backticks, correct env-var prefix order).

**Definition of done:** Install docs match the design; conventional commit `docs: #58 adopt vercel-labs skills CLI as primary install path`.

### Workstream 6 — `scripts/apply-scaffold-repository.js` (AC-58-3 check c, AC-58-5; depends on W9)

The skeleton from Workstream 3 (previous plan W3.1) is fleshed out here into the production version invoked by release-please. **Renamed throughout** from `apply-bootstrap.js`.

**Tasks:**

- 6.1 Read `plugins/scaffold-repository/skills/scaffold-repository/SKILL.md` to derive the apply steps the scaffold-repository skill itself defines.
- 6.2 Implement each apply step against the current repo (commitlint config, husky hooks, issue/PR templates, etc.) without making outbound network calls. Use only local file operations and `pnpm` invocations that hit the local store.
- 6.3 Add a `--check` mode that diffs the apply result against the current tree and exits non-zero if there are changes (useful for CI assertion that scaffolding is in sync).
- 6.4 Add `pnpm` script: `apply:scaffold-repository` and `apply:scaffold-repository:check`. **Do not preserve** the prior `apply:bootstrap` / `apply:bootstrap:check` shorthands; the rename is complete.

**Files touched:** `scripts/apply-scaffold-repository.js` (new), `package.json`.

**Verification:** `node scripts/apply-scaffold-repository.js plugins/scaffold-repository` exits 0 with no network calls (the script asserts it never spawns `git`/`curl`/`fetch` / network-bound `npm install`). `--check` exits 0 when scaffolding is in sync.

**Definition of done:** Script works locally and from CI; release-please workflow invokes it on scaffold-repository releases; conventional commit `feat: #58 implement scaffold-repository self-apply script`.

### Workstream 11 — `scripts/verify-dogfood.sh` and CI wiring (AC-58-3 check d; depends on W10)

**Goal:** Implement the AC-58-3 dogfood verification as a deterministic bash script covering all five in-repo skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`) with a branch on plugin-scoped (symlink-traversed) versus standalone (real-file) shape.

**Order rationale:** W11 depends on W10 (the canonical overlay must exist before the script can verify it). W11 is wired into the CI workflow added in W4 (`release-please.yml` runs the validator; the dogfood script joins the same verification surface).

**Tasks:**

- 11.1 Implement `scripts/verify-dogfood.sh` with a POSIX-shell-compatible body (use `#!/usr/bin/env bash` and rely on bash 4+ for arrays). Algorithm:
  - Define the five skill names in an array: `SKILLS=(scaffold-repository superteam using-github find-skills office-hours)`.
  - For each skill `<name>`:
    1. Assert `.claude/skills/<name>/SKILL.md` exists and resolves through symlinks: `test -e .claude/skills/<name>/SKILL.md || fail`. Reject broken symlinks explicitly: `if [ -L "$f" ] && [ ! -e "$f" ]; then fail; fi`.
    2. Read the first ~20 lines of the resolved file and assert the YAML frontmatter has `name:` and `description:` keys among the first two non-delimiter keys. Use `awk` or `sed` to parse — no Python/Node dependency.
    3. Assert the `name:` value matches `<name>` (so `name: scaffold-repository` under `.claude/skills/scaffold-repository/`, etc.). This catches the rename-correctness end-to-end.
    4. Branch on shape:
       - For `name ∈ {scaffold-repository, superteam, using-github}` (plugin-scoped): assert the symlink chain `.claude/skills/<name>` → `.agents/skills/<name>` → `plugins/<name>/skills/<name>` resolves at each hop. Use `readlink` for the per-hop target and `realpath` for the final resolution.
       - For `name == find-skills`: assert `.claude/skills/find-skills` → `.agents/skills/find-skills` and `.agents/skills/find-skills/SKILL.md` is a real file (not a symlink). Use `test -L` on the canonical entry and assert the negation: `! test -L .agents/skills/find-skills/SKILL.md`.
       - For `name == office-hours`: same as `find-skills` — one symlink hop at the Claude layer, real file at the canonical layer. Use `! test -L .agents/skills/office-hours/SKILL.md`.
  - On any assertion failure, print a clear `FAIL: <reason>` line and exit non-zero. On full success, print `OK: all five skills discoverable` and exit 0.
- 11.2 Make the script executable (`chmod +x scripts/verify-dogfood.sh`).
- 11.3 Add a `pnpm` script alias: `verify:dogfood` → `bash scripts/verify-dogfood.sh`.
- 11.4 Wire into CI alongside the other AC-58-3 checks. The most natural home is a new workflow `.github/workflows/verify-iteration.yml` (referenced in the design's "Proposed file layout") that runs on PRs touching `.claude/skills/**`, `.agents/skills/**`, or `plugins/*/skills/**`. The workflow runs:
  1. `node scripts/validate-marketplace.js` (release mode).
  2. `node scripts/validate-marketplace.js --dev`.
  3. `node scripts/apply-scaffold-repository.js plugins/scaffold-repository` (smoke).
  4. `bash scripts/verify-dogfood.sh`.
  5. The W3 check-a CLI install dry-run for one representative skill (`scaffold-repository`) and one standalone (`office-hours`), as a budget-conscious sample of the install surface. (Running the dry-run against all five every PR is unnecessary churn; the dogfood script already proves discoverability of all five.)
- 11.5 SHA-pin every action `uses:` line in `verify-iteration.yml` per AGENTS.md.

**Files touched:** `scripts/verify-dogfood.sh` (new), `package.json` (script alias), `.github/workflows/verify-iteration.yml` (new).

**Verification:**

- `bash scripts/verify-dogfood.sh` exits 0 against the post-W10 tree.
- Temporarily break a symlink (e.g. `rm .claude/skills/scaffold-repository && ln -s /nonexistent .claude/skills/scaffold-repository`) and assert the script exits non-zero. Restore.
- Temporarily edit `.agents/skills/office-hours/SKILL.md` frontmatter `name: office-hours` → `name: wrong-name` and assert non-zero exit. Restore.
- `actionlint` passes on the new workflow.

**Definition of done:** Script handles plugin-scoped and standalone cases; CI workflow exercises all four AC-58-3 checks; conventional commit `feat: #58 add dogfood verification script and CI wiring`.

### Workstream 7 — Wiki migration and docs trim (AC-58-6; depends on W4, W5, W10)

**Goal:** Publish wiki pages first, then trim repo docs. Provide redirects via links so no content disappears.

**Order is load-bearing — publish before delete.**

**Tasks:**

- 7.1 Inventory content slated to move (from the upstream `README.md`s for each plugin, plus install walkthroughs and troubleshooting). List in `docs/wiki-index.md` with target wiki page names.
- 7.2 Publish each wiki page on `patinaproject/skills.wiki` with the content from the upstream `README.md`s and the design's "Move to wiki" list:
  - `Install-Claude-Code`
  - `Install-Codex`
  - `Skill-scaffold-repository-usage` (renamed from the pre-delta plan's `Skill-bootstrap-usage`)
  - `Skill-superteam-usage`
  - `Skill-using-github-usage`
  - `Skill-office-hours-usage` (new — standalone skill; per AC-58-6 amendment, this page covers Startup-mode vs. Builder-mode entry points, lifts the trigger summary from the SKILL.md description, and links to `.agents/skills/office-hours/SKILL.md` as the source of truth. The wiki page does **not** repeat the SKILL.md body.)
  - `Troubleshooting`
  - `How-Superteam-Runs-End-To-End`
- 7.3 Update `README.md` to point at the wiki pages.
- 7.4 Update both marketplace manifest descriptions to link to the relevant wiki page per plugin. Standalone-skill pages (office-hours) are linked from `README.md` only — marketplace manifests don't carry an office-hours entry per W2.
- 7.5 Trim `docs/` to: `AGENTS.md`-related content stays in root (`AGENTS.md`, `CLAUDE.md`), `docs/release-flow.md` (rewritten in W4), `docs/file-structure.md` (rewritten — new layout, canonical overlay, symlink hygiene, Gate G2 result), `docs/wiki-index.md`, `docs/superpowers/specs/`, `docs/superpowers/plans/`.
- 7.6 Update each `plugins/<name>/README.md` so it is a thin pointer to the relevant wiki page rather than carrying duplicate content. Keep the file present so npm/codex marketplace listings don't 404 on README lookups. For `scaffold-repository`, the pointer references the renamed wiki page.

**Files touched:** `README.md`, `docs/wiki-index.md` (new), `docs/file-structure.md`, `docs/release-flow.md`, `plugins/*/README.md`, marketplace manifests.

**Verification:**

- `markdownlint-cli2` passes (`pnpm lint:md`).
- Every wiki page named in `docs/wiki-index.md` exists on the published wiki (manual check by Executor; record URLs in PR body).
- `README.md` links to the wiki and to the pinned `npx skills@1.5.6` install commands.
- The office-hours wiki page links to `.agents/skills/office-hours/SKILL.md` rather than duplicating its body.

**Definition of done:** Wiki published, repo docs trimmed, conventional commit `docs: #58 migrate user docs to wiki and trim docs/`.

### Workstream 8 — Migration history record (AC-58-8; depends on W1, W9, W10)

**Goal:** Record the merge choice and upstream-archive plan in-repo so future contributors can recover the source history. Cover **both** the subtree imports and the in-tree rename / standalone-skill port events.

**Tasks:**

- 8.1 Add (or update — commit `89d8f1c` already added some content) a `Migration history` section in `docs/file-structure.md` recording:
  - The `git subtree add` command sequence used (W1).
  - The three upstream tags imported (`bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`) and the three import commit SHAs (`912d6d9`, `028165e`, `54157bc`).
  - **The bootstrap → scaffold-repository rename event**: the `git mv plugins/bootstrap plugins/scaffold-repository` commit (W9.7) recorded with its SHA. Note that upstream `patinaproject/bootstrap` is unchanged and remains the byte-for-byte reference for pre-rename audits.
  - **The office-hours port event**: source repo `patinaproject/patinaproject`, source PR #1143, source head SHA `02e6ebbdbef123bbeb211fad06aa86bd5e33528a`, target path `.agents/skills/office-hours/SKILL.md`, port commit SHA (recorded by Executor at W10.4 land). Mirror the design's "Ported skills" catalog table for in-repo cross-reference.
  - The decision to archive (not delete) the upstream repos.
  - The expected archival timeline ("at least one release cycle after consolidation," per design).
- 8.2 Open a tracking issue (or annotate the existing #58) noting which upstream repos still need to be archived and when. Executor does this *after* the PR for #58 merges; do not pre-archive.

**Files touched:** `docs/file-structure.md`.

**Verification:** Migration history section present; lists three subtree-import commits + one rename commit + one port commit; names the merge mechanism per source.

**Definition of done:** Conventional commit `docs: #58 record subtree-merge, rename, and office-hours port migration history`.

## Workstream dependency graph

```text
W1 (subtree merge; DONE)
   │
   v
W9 (rename bootstrap -> scaffold-repository)
   │
   v
W2 (manifests + validator)
   │
   ├──> W3 (AC-58-3 docs)
   │
   ├──> W4 (release-please) ──> W7 (wiki migration)
   │       (uses W6)               │
   │                               v
   ├──> W6 (apply-scaffold-repository)   W8 (migration record)
   │
   ├──> W10 (canonical overlay) ──> W11 (verify-dogfood + CI)
   │       (uses W9; ports office-hours)
   │
   └──> W5 (vercel-labs CLI integration; uses W10)
```

W3, W4, W6, W10, W11 may proceed in parallel once W2 lands (W9 is a hard prerequisite for W2). W5 depends on W10 because the install commands assume the canonical overlay exists for fresh-clone dogfood. W7 depends on W4 (release-please publishes the renamed slug; wiki must mirror) and on W5 (README install commands referenced from the wiki).

## AC traceability

| AC | Workstreams |
| --- | --- |
| AC-58-1 | W1 (DONE; subtree imports), W9 (rename), W10 (canonical overlay + office-hours port) |
| AC-58-2 | W2.1, W2.2 |
| AC-58-3 | W3.3, W3.4 (check b Codex verification), W6 (check c), W11 (check d dogfood); check a is documented in W3.3 and verified in W11's CI wiring (W11.4 step 5) |
| AC-58-4 | W5.1–W5.4 |
| AC-58-5 | W4.1–W4.6, W6.1–W6.4 (Gate G3 path) |
| AC-58-6 | W7.1–W7.6, Gate G5 (extended with the office-hours wiki page) |
| AC-58-7 | W1 (DONE; SHA-256 round-trip for `superteam` already recorded under `docs/superpowers/plans/.artifacts/`); W9 explicit exemption for `scaffold-repository` SKILL.md |
| AC-58-8 | W1 mechanism choice (DONE), W9.7 rename commit recorded, W10.4 office-hours port commit recorded, W8.1 narrative |

## ATDD verification (AC-58-3 falsifiable checks)

The Executor must include the following commands in CI (`.github/workflows/verify-iteration.yml`, established by W11.4):

### Check a — vercel-labs CLI resolves an in-repo skill (exit 0)

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code --dry-run
echo "exit=$?"
```

Pass criterion: exit code 0. The chosen falsifiable form (`--dry-run`, or `--prefix /tmp/scratch`, or whichever the pinned CLI version actually supports) is documented in `README.md`; Executor selects the most deterministic form during W3.3 and locks it into both the README and the CI workflow.

### Check b — validator accepts dev overlay and rejects it in release mode

```sh
node scripts/validate-marketplace.js --dev    # must exit 0
# Move overlay to a release-eligible path and assert non-zero:
cp .claude-plugin/marketplace.local.json plugins/scaffold-repository/marketplace.local.json
! node scripts/validate-marketplace.js        # expect non-zero
rm plugins/scaffold-repository/marketplace.local.json
```

Pass criterion: first command exits 0; the second exits non-zero (negated with `!`).

### Check c — scaffold-repository apply against this repo without network

```sh
node scripts/apply-scaffold-repository.js plugins/scaffold-repository
echo "exit=$?"
```

Pass criterion: exit code 0; the script must not call `git fetch`, `npm install` against the remote registry, or any `curl`/`fetch`. Enforced by the script's own outbound-call guard.

### Check d — dogfood verification (five skills, branch on shape)

```sh
bash scripts/verify-dogfood.sh
echo "exit=$?"
```

Pass criterion: exit code 0. All five skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`) must satisfy the four dogfood conditions (file presence, frontmatter shape, name match, target-path correctness for plugin-scoped vs. standalone).

All four checks must run in CI on every PR that touches `plugins/`, `scripts/`, `.agents/skills/`, `.claude/skills/`, or the manifest files.

## Risks and blockers (cross-workstream)

- **G6 closed — supply-chain on vercel-labs CLI.** Adopting an upstream CLI for the primary install path means an unpublish or compromise upstream affects our docs. Mitigations (from design): pin CLI version at invocation; `npm_config_ignore_scripts=true` default; marketplace-add fallback documented; upstream URL recorded in `docs/release-flow.md`. The fallback is an open contractual surface — Executor verifies it works during W3 / W7.
- **G2 unresolved at runtime against the live Codex CLI.** Could force a manifest schema change late in the flow. Mitigation: W3.4 verifies before W7's wiki content references the path-source convention.
- **SHA-256 round-trip already passed.** W1.3's check is recorded under `docs/superpowers/plans/.artifacts/` from the prior Executor batch. If a future commit on this branch perturbs `plugins/superteam/skills/superteam/SKILL.md`, the AC-58-7 round-trip would need to be re-asserted. The byte-equivalence guarantee binds `superteam` only; `scaffold-repository`'s SKILL.md is explicitly exempt per the rename (design's AC-58-7 rewrite).
- **release-please tag-prefix interaction with the validator regex.** Gate G1's choice (strip prefix when writing manifests) means a misconfigured release-please `extra-files` JSONPath could write `scaffold-repository-v1.11.0` into a `ref` field, which the validator would catch. Treat this as fail-fast, not silent.
- **Canonical-overlay symlinks leaking into a release.** Mitigated by `.gitattributes` `export-ignore` (W10.7), by the release-mode validator's negative check (W2.3), and by the absence of `npm publish` from this repo (Gate G6). Triple defense in depth.
- **Wiki link rot.** Per Gate G5, the wiki is canonical and `docs/wiki-index.md` is the in-repo index. A future reviewer can run a link-check against the wiki index as a follow-up; not in scope here.
- **office-hours upstream PR mutation.** The port (W10.4) is byte-for-byte against PR head SHA `02e6ebbdbef123bbeb211fad06aa86bd5e33528a`. If that PR is rebased or force-pushed upstream, the SHA pin survives because Executor records it in the commit message and in W8.1's history record. Re-port (if ever needed) would compare against a new upstream SHA.
- **Pending W2 stash staleness.** Resolved by the "Pending W2 stash disposition" section above: discard `stash@{0}`, redo W2 from scratch against the renamed plugin.

## Rollback approach per workstream

- **W1:** (DONE) `git reset --hard` to the pre-merge SHA, recorded in commit `89d8f1c`'s history. Subtree adds remain on the branch; this is the rollback target if any downstream workstream reveals subtree corruption.
- **W9 (rename):** `git revert` the rename commit. The directory returns to `plugins/bootstrap/`; all downstream workstreams that landed against the renamed slug also revert. Order-sensitive: if W2/W4/W6/W10/W11 have landed, revert them first in reverse order.
- **W2:** revert the manifest + validator commit; both marketplace manifests still resolve against the upstream tags from the previous main commit if W1 is also reverted, or against `patinaproject/skills` tags (with the renamed slug) if only W2 is reverted.
- **W3:** revert commit; AC-58-3 doc references revert with it.
- **W4:** revert the workflow commit and restore `plugin-release-bump.yml` from commit `e97f4eb`. The cross-repo dispatch in the three upstream repos continues to function until those repos are archived.
- **W5:** revert README and marketplace-description edits. The `npx skills@1.5.6 add patinaproject/skills@<plugin>` command still works against the repo (it is the upstream CLI; we are only the docs vendor) — rollback is purely a docs revert.
- **W6:** revert the script commit; the release-please workflow's scaffold-apply step becomes a no-op (the conditional fails the file-exists check).
- **W7:** wiki content is recoverable from wiki history; repo docs are recoverable via `git revert`. Order is enforced (publish before delete) so a partial rollback never leaves users without docs.
- **W8:** trivial revert.
- **W10 (canonical overlay):** revert the symlink commits. The office-hours port commit reverts as a separate revert (W10.4 is its own commit). `git ls-files -s` after revert shows no entries under `.agents/skills/` or `.claude/skills/`.
- **W11:** revert the script + CI commit; AC-58-3 check d falls back to manual verification.

## Out of scope (called out so Executor does not gold-plate)

- Rewriting any plugin's `SKILL.md` content beyond the rename surface enumerated in W9. The `superteam` and `using-github` SKILL.md files are byte-equivalent to the upstream tags. Any behavioral edit to any SKILL.md is its own issue with its own `AC-<issue>-<n>` IDs.
- Authoring a Patina Project `skills` CLI (Gate G6 — closed; vercel-labs CLI is adopted).
- Auto-invoking host CLIs from the install command (Gate G4 — out of scope, delegated to the upstream CLI).
- Building a public registry beyond what GitHub Releases provide.
- Archiving the upstream repos. Recorded in W8.2 as a post-merge action.
- Promoting `office-hours` to a plugin-scoped skill. The design explicitly permits the standalone shape; promotion is documented as reversible but not part of this issue's scope.

## Done-report mapping

The Finisher will reference this plan's workstream IDs (`W1`–`W11`) and Gate IDs (`G1`–`G6`) in the eventual PR body's `Acceptance Criteria` section so each `AC-58-<n>` heading has verification steps anchored to specific tasks.
