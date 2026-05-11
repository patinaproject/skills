# Plan: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Source design

- Approved design: [`docs/superpowers/specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md`](../specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md)
- Approved-design head: `0b000f9` (Brainstormer delta 4 — flat `skills/<name>/` layout, no marketplace catalog, `release-type: simple` per skill, dogfood overlay D1 with committed symlinks, `verify-iteration.yml` → `verify.yml`)
- Selected approach: Option F1 (flat `skills/<name>/` at the repo root, vercel-labs `vercel-labs/skills` shape, per-skill `release-type: simple`, dogfood overlay symlinks committed)
- ACs in scope: `AC-58-1` through `AC-58-8`

## Plan revision history

This plan was previously revised twice on top of the original Gate-1 approval:

1. **Revision @ `d74e236`** (pre-canonical-layout / pre-CLI-adoption / pre-rename plan): assumed marketplace catalog + per-plugin `package.json` + an in-repo CLI under `packages/skills-cli/`. Obsolete.
2. **Revision @ `794e199`** (current `main`-ward HEAD until this rewrite): added W9 (rename), W10 (canonical workspace overlay with two-hop symlink chain), W11 (dogfood verification harness branching on plugin-scoped vs. standalone shape); kept the plugin-wrappers + marketplace-catalog + per-plugin `package.json` layout. Mostly obsolete after delta 4.

Delta 4 (Brainstormer commit `0b000f9` against design HEAD) is the binding restructure: flat `skills/<name>/` at the repo root, marketplace catalog deleted, plugin wrappers deleted, per-plugin `package.json` deleted, dogfood overlay collapsed to one-hop symlinks, `release-type: simple` everywhere. This plan rewrites in place rather than carrying forward as deltas because the structural surface is materially different from `794e199`.

Workstream IDs continue from the prior `W1`–`W11`. The new workstreams are `W12`–`W19`. Prior workstreams are dispositioned at the top of "Sequenced workstreams" below.

## Disposition of prior workstreams (W1–W11)

- **W1 (subtree imports):** DONE on this branch. Commits `912d6d9` (bootstrap), `028165e` (superteam), `54157bc` (using-github). Recorded as historical context; no rework. Verification artifacts under `docs/superpowers/plans/.artifacts/` survive intact (`sha256-pre.txt` records the `superteam/SKILL.md` SHA-256 `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356` — the post-flatten value at `skills/superteam/SKILL.md` must match).
- **W2 (marketplace + validator):** OBSOLETE. Both marketplace manifests and the validator are deleted in W12.6. Nothing carries forward.
- **W3 (AC-58-3 docs):** PARTIALLY ABSORBED. Check b (validator dev mode) is gone. Check a (CLI install dry-run), check c (apply script), check d (dogfood script) are documented in W18 (README sweep) and verified in W19 (final pass).
- **W4 (release-please node):** OBSOLETE. Replaced by W15 (release-please simple).
- **W5 (vercel-labs CLI integration):** OBSOLETE as a standalone workstream. Folded into W18 (README install commands) and W12.6 (validator deletion).
- **W6 (`apply-scaffold-repository.js`):** PARTIALLY DONE. The script exists at `scripts/apply-scaffold-repository.js` (commit `4a69ef3`, plus follow-ups). W17 updates the script's internal path references from `plugins/scaffold-repository/` to `skills/scaffold-repository/`.
- **W7 (wiki migration):** DEFERRED. Wiki publication remains a post-merge action per Gate G5. W18's documentation sweep updates the in-repo `docs/wiki-index.md` and `README.md` so they reference the new flat paths; actually publishing wiki content is out of this PR's scope (recorded in AC-58-6 as a post-merge step).
- **W8 (migration history record):** ABSORBED into W18 (migration history entry under `docs/file-structure.md`).
- **W9 (bootstrap → scaffold-repository rename):** DONE on this branch. Commit `794e199` (rename `git mv` + plugin manifest edits) and follow-up `fix:` commits (`adb0505`, `392a7b5`) that adjusted README references.
- **W10 (canonical workspace overlay):** OBSOLETE. The two-hop chain (`.claude/skills/<name>` → `.agents/skills/<name>` → `plugins/<name>/skills/<name>`) is replaced by one-hop symlinks from both overlay directories into `skills/<name>/` (W13). The office-hours port (W10.4, commit `fab5458`) is kept and is re-routed: `git mv .agents/skills/office-hours skills/office-hours` (W12.5).
- **W11 (verify-dogfood script + CI wiring):** PARTIALLY ABSORBED. The script exists at `scripts/verify-dogfood.sh` (commit `bdc390d`) and CI wiring exists at `.github/workflows/verify-iteration.yml` (commit `eee1df4`). W14 rewrites the script for the flat layout (drop the plugin-scoped vs. standalone branching). W16 renames the workflow file and display name.

## Target layout (binding, from design delta 4)

```text
skills/
  scaffold-repository/    # git mv from plugins/scaffold-repository/skills/scaffold-repository/
    SKILL.md
    (templates/, scripts/, audit-checklist.md, README.md as needed)
  superteam/              # git mv from plugins/superteam/skills/superteam/
    SKILL.md
    (agents/, pre-flight.md, routing-table.md, project-deltas.md, workflow-diagrams.md)
  using-github/           # git mv from plugins/using-github/skills/using-github/
    SKILL.md
    (workflows/, agents/, etc.)
  find-skills/            # git mv from .agents/skills/find-skills/
    SKILL.md
  office-hours/           # git mv from .agents/skills/office-hours/
    SKILL.md
.claude/skills/<name>/    # symlinks to ../../skills/<name>/ (5 entries, dogfood overlay)
.agents/skills/<name>/    # symlinks to ../../skills/<name>/ (5 entries, dogfood overlay)
.gitignore                # ignores .claude/skills/* and .agents/skills/* EXCEPT the 5 in-repo overlay symlinks
scripts/
  apply-scaffold-repository.js  # path-updated for skills/ layout (W17)
  verify-dogfood.sh             # simplified: 5 skills × skills/<name>/SKILL.md + overlay resolve (W14)
release-please-config.json      # rewritten: release-type: simple per skill (W15)
.release-please-manifest.json   # rewritten: 3 packages keyed by skills/<name> (W15)
.github/workflows/
  verify.yml                    # renamed from verify-iteration.yml; display name "Verify" (W16)
  release-please.yml            # updated: no marketplace.json rewrites; manifest-only bumps (W15)
  markdown.yml, actions.yml, pull-request.yml  # mostly unchanged (markdown.yml glob excludes updated in W18)
docs/
  release-flow.md, file-structure.md, wiki-index.md  # rewritten in W18
  superpowers/specs/, plans/
AGENTS.md, README.md, CLAUDE.md  # rewritten in W18
```

**Deleted entirely:**

- `plugins/` (the entire tree — three wrapper directories with their `.codex-plugin/`, `.claude-plugin/`, `package.json`, `README.md`, `audit-checklist.md`, scaffolding files)
- `.agents/plugins/` (Codex marketplace tree, including `marketplace.json` and `marketplace.local.json`)
- `.claude-plugin/` (Claude Code marketplace tree, including `marketplace.json` and `marketplace.local.json`)
- `scripts/validate-marketplace.js` (no marketplace to validate)
- `.gitattributes` `export-ignore` rules for now-deleted overlay paths
- Carry-over per-plugin `release-please-config.json` and `.release-please-manifest.json` files under `plugins/<name>/` (subtree-import noise — never live)
- The previous `release-please-config.json` and `.release-please-manifest.json` at the repo root (replaced by W15's rewrites)

## Sequenced workstreams

Ordering: **W12 (flat-mv) is the foundation.** Everything else depends on it. W13 (overlay symlinks + .gitignore), W17 (apply-scaffold paths), and W15 (release-please) each depend only on W12 and may run in parallel. W14 (verify-dogfood rewrite) depends on W12 + W13. W16 (workflow rename) is independent of W12. W18 (docs sweep) depends on W12–W17 because it references their final shapes. W19 (final verification) depends on everything.

### Workstream 12 — Flat-skills restructure (`git mv` chain) (AC-58-1, AC-58-2, AC-58-7, AC-58-8)

**Goal:** Move every skill to `skills/<name>/` at the repo root and delete the plugin-wrapper, marketplace-catalog, and per-plugin-`package.json` scaffolding in the same commit. `git mv` preserves blob SHAs and per-file blame.

**Order rationale:** W12 is foundational. Every other delta-4 workstream depends on the flat layout being in place. The single commit lands as one reviewable diff so reviewers see the structural change atomically and `git mv` rename detection keeps the diff readable on GitHub's PR UI.

**Tasks:**

- 12.1 `git mv plugins/scaffold-repository/skills/scaffold-repository skills/scaffold-repository`. The directory's interior (SKILL.md plus any supporting files like `templates/`, `scripts/`, `audit-checklist.md`, `README.md`) moves with rename detection.
- 12.2 `git mv plugins/superteam/skills/superteam skills/superteam`. Carries `SKILL.md`, `agents/`, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md`.
- 12.3 `git mv plugins/using-github/skills/using-github skills/using-github`. Carries `SKILL.md`, any `workflows/`, `agents/`, slash-command surfaces.
- 12.4 `git mv .agents/skills/find-skills skills/find-skills`. The committed real-file `SKILL.md` plus any sub-content moves; rename detection preserves blame.
- 12.5 `git mv .agents/skills/office-hours skills/office-hours`. Single `SKILL.md` real file (the port that landed at commit `fab5458`) moves into the canonical home.
- 12.6 **Deletions** (all in the same commit as 12.1–12.5):
  - `rm -r plugins/` — the three wrapper directories and everything inside them (including `.codex-plugin/`, `.claude-plugin/`, `package.json`, `README.md`, `audit-checklist.md`, scaffold-managed files, and the carry-over `release-please-config.json` / `.release-please-manifest.json` at `plugins/<name>/`).
  - `rm -r .agents/plugins/` — Codex marketplace tree and both `marketplace.json` / `marketplace.local.json`.
  - `rm -r .claude-plugin/` — Claude Code marketplace tree and both `marketplace.json` / `marketplace.local.json`.
  - `rm scripts/validate-marketplace.js` — validator targets a file that no longer exists.
  - Edit `.gitattributes` — remove any `export-ignore` rules that referenced `plugins/`, `.agents/plugins/`, `.claude-plugin/`, the prior `.claude/skills/<name>` two-hop overlay, or the pre-flatten `.agents/skills/<name>` overlay paths. Keep unrelated rules.
- 12.7 **AC-58-7 SHA round-trip verification.** Compute `sha256sum skills/superteam/SKILL.md` and confirm the digest equals `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356` (recorded in `docs/superpowers/plans/.artifacts/sha256-pre.txt` and in the PR #59 body). Record the post-flatten value at `docs/superpowers/plans/.artifacts/sha256-post.txt` (update the existing file — it currently records the post-subtree-add value, which equals the post-flatten value because `git mv` preserves blobs). If the digests do not match, halt: an editor touched the file between the moves and the design's GREEN baseline is broken.
- 12.8 **Internal-link sweep within moved files.** Run `rg -F 'plugins/scaffold-repository' skills/scaffold-repository/`, `rg -F 'plugins/superteam' skills/superteam/`, `rg -F 'plugins/using-github' skills/using-github/`. For each match, decide: is this a path reference (rewrite to `skills/<name>/`) or generic English / a URL pointing at the archived upstream `patinaproject/bootstrap` repo (preserve)? The upstream URL references stay. Do **not** use `sed -i` blast-radius rewrites — triage surface-by-surface.
- 12.9 Commit with: `refactor: #58 flatten skills layout to skills/<name>/ per PR comments`. Single commit covering 12.1–12.8.

**Files touched in W12:** `plugins/**` (deleted via the `git mv`s and the `rm -r`), `.agents/plugins/**` (deleted), `.claude-plugin/**` (deleted), `scripts/validate-marketplace.js` (deleted), `.gitattributes` (edited), `skills/scaffold-repository/**` (new path from `git mv`), `skills/superteam/**` (new path), `skills/using-github/**` (new path), `skills/find-skills/SKILL.md` (new path), `skills/office-hours/SKILL.md` (new path), `docs/superpowers/plans/.artifacts/sha256-post.txt` (verification receipt).

**Verification:**

- `find . -name plugin.json -not -path './node_modules/*' -not -path './.git/*'` returns empty (AC-58-1 falsifiable check a).
- `find skills -maxdepth 2 -name SKILL.md | sort` returns exactly five paths (AC-58-1 check b).
- `git log --follow --format=%H skills/superteam/SKILL.md | tail -1` resolves to the same commit and blob as the pre-flatten path (AC-58-1 check c — verify per-file blame survives).
- `find . -name 'marketplace*.json' -not -path './node_modules/*' -not -path './.git/*'` returns empty (AC-58-2 falsifiable check).
- `sha256sum skills/superteam/SKILL.md` equals `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356` (AC-58-7).
- `test ! -d plugins && test ! -d .agents/plugins && test ! -d .claude-plugin && test ! -f scripts/validate-marketplace.js` exits 0.

**Definition of done:** All deletions and moves landed in one commit; SHA round-trip verified; conventional commit message references issue #58.

**Risks/rollback:** If an internal-link sweep miss surfaces post-commit, follow up with a focused `fix:` commit. The `git mv` chain itself is reversible (revert the commit); no destructive operation occurs against the archived upstream repos.

### Workstream 13 — Dogfood overlay symlinks + `.gitignore` allowlist (AC-58-3 dogfood preconditions)

**Goal:** Create five committed symlinks at `.claude/skills/<name>/` → `../../skills/<name>/` and the parallel five at `.agents/skills/<name>/` → `../../skills/<name>/`. Update `.gitignore` so CLI-installed third-party skills (the 14 superpowers skills currently sitting untracked under `.agents/skills/<name>/` and `.claude/skills/<name>/` from the prior `npx skills add` invocation) are ignored while the five in-repo overlay symlinks remain tracked.

**Order rationale:** W13 depends on W12 because the symlink targets reference `../../skills/<name>/`. The 14 third-party superpowers skills currently sit at `.agents/skills/<name>/` (real files) and `.claude/skills/<name>` (symlinks into the real files); after W12 the `.agents/skills/{find-skills,office-hours}` real files are gone (moved to `skills/`), so there is no name collision when W13 introduces overlay symlinks for the five in-repo skills. Confirmed no name overlap: the 14 third-party skills are `brainstorming`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `receiving-code-review`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `using-superpowers`, `verification-before-completion`, `writing-plans`, `writing-skills`; the five in-repo overlay names are `scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`. No collision.

**Tasks:**

- 13.1 Create five relative symlinks at `.claude/skills/`:
  - `ln -sf ../../skills/scaffold-repository .claude/skills/scaffold-repository`
  - `ln -sf ../../skills/superteam .claude/skills/superteam`
  - `ln -sf ../../skills/using-github .claude/skills/using-github`
  - `ln -sf ../../skills/find-skills .claude/skills/find-skills`
  - `ln -sf ../../skills/office-hours .claude/skills/office-hours`
  - The pre-existing `.claude/skills/find-skills` and `.claude/skills/office-hours` symlinks under the prior two-hop layout pointed at `.agents/skills/<name>`; the `ln -sf` retargets them to the new canonical `../../skills/<name>` path. The other three `.claude/skills/<name>` directories do not exist pre-W13 (those were two-hop symlinks pointing into `plugins/<name>/skills/<name>/` and the `plugins/` tree is gone after W12), so `ln -sf` creates fresh.
- 13.2 Create five relative symlinks at `.agents/skills/`:
  - `ln -sf ../../skills/scaffold-repository .agents/skills/scaffold-repository`
  - `ln -sf ../../skills/superteam .agents/skills/superteam`
  - `ln -sf ../../skills/using-github .agents/skills/using-github`
  - `ln -sf ../../skills/find-skills .agents/skills/find-skills`
  - `ln -sf ../../skills/office-hours .agents/skills/office-hours`
  - Pre-existing real-file directories `.agents/skills/find-skills/` and `.agents/skills/office-hours/` are gone after W12.4 / W12.5; the `ln -sf` creates fresh symlinks. The other three `.agents/skills/<name>` entries did not exist pre-W12.
- 13.3 Update `.gitignore` to allow the five in-repo overlay symlinks while ignoring everything else under `.claude/skills/` and `.agents/skills/`. Insert the following block (replacing any prior overlay-related rules):

  ```gitignore
  # Dogfood overlay: track the 5 in-repo skill symlinks; ignore third-party CLI installs.
  .claude/skills/*
  !.claude/skills/scaffold-repository
  !.claude/skills/superteam
  !.claude/skills/using-github
  !.claude/skills/find-skills
  !.claude/skills/office-hours
  .agents/skills/*
  !.agents/skills/scaffold-repository
  !.agents/skills/superteam
  !.agents/skills/using-github
  !.agents/skills/find-skills
  !.agents/skills/office-hours
  ```

  Note: `*` matches direct children; the negated `!.claude/skills/<name>` entries cover the symlink children we want tracked. The 14 third-party superpowers skills (currently untracked) become explicitly gitignored, which is the desired end state.

- 13.4 Verify gitignore behavior:
  - `git check-ignore -v .agents/skills/brainstorming` reports a hit on the `.agents/skills/*` rule.
  - `git check-ignore -v .agents/skills/scaffold-repository` reports no match (the negated allowlist entry shadows the `*` rule).
  - `git status --ignored | grep '\.agents/skills/'` lists the 14 third-party skills under "Ignored files" and none of the five overlay symlinks.
- 13.5 Confirm symlinks are tracked as symlinks (mode `120000`) in the Git index: `git ls-files -s .claude/skills/ .agents/skills/` should show ten entries (5 + 5) all with mode `120000`.
- 13.6 Commit with: `feat: #58 add dogfood overlay symlinks for in-repo skills`.

**Files touched in W13:** `.claude/skills/{scaffold-repository,superteam,using-github,find-skills,office-hours}` (new symlinks), `.agents/skills/{scaffold-repository,superteam,using-github,find-skills,office-hours}` (new symlinks), `.gitignore`.

**Verification:**

- Ten symlink entries in `git ls-files -s .claude/skills/ .agents/skills/`, all mode `120000`.
- For each of the ten symlinks, `readlink <link>` returns `../../skills/<name>`.
- For each of the ten symlinks, `test -e <link>/SKILL.md` exits 0 (target resolves through the symlink).
- 14 third-party skills appear under `git status --ignored`'s ignored-files section.

**Definition of done:** Five overlay symlinks at each of `.claude/skills/` and `.agents/skills/`; `.gitignore` allowlist shape correct; third-party skills are ignored; conventional commit landed.

**Risks/rollback:** Revert the commit to remove all ten symlinks and the `.gitignore` block. Symlinks not committed before revert do not require cleanup beyond what `git revert` already does.

### Workstream 14 — `verify-dogfood.sh` simplified for flat layout (AC-58-3 dogfood check)

**Goal:** Rewrite `scripts/verify-dogfood.sh` for the flat layout. The prior script branched on plugin-scoped (two-hop symlink chain) vs. standalone (real file at `.agents/skills/<name>/`); after the flatten every skill is a real file at `skills/<name>/SKILL.md` and the overlay paths are one-hop symlinks. The check becomes uniform across all five.

**Order rationale:** W14 depends on W12 (real files at `skills/<name>/SKILL.md` must exist) and W13 (overlay symlinks must exist). Independent of W15, W16, W17.

**Tasks:**

- 14.1 Rewrite `scripts/verify-dogfood.sh`. Algorithm (bash 4+, no Python/Node dependency):
  - Define `SKILLS=(scaffold-repository superteam using-github find-skills office-hours)`.
  - For each `name` in `SKILLS`:
    1. Assert `skills/<name>/SKILL.md` exists and is a regular file (not a symlink): `test -f skills/<name>/SKILL.md && ! test -L skills/<name>/SKILL.md`. If false, print `FAIL: skills/<name>/SKILL.md missing or is a symlink` and exit non-zero.
    2. Parse the YAML frontmatter (between the first two `---` delimiter lines). Use `awk` / `sed` to extract `name:` and `description:` values from the first ten or so non-delimiter lines. Assert both keys are present and `name:` value equals `<name>`. (For `scaffold-repository`, this catches a regression that ports the post-flatten file but leaves the frontmatter `name:` as `bootstrap`.)
    3. Assert `.claude/skills/<name>/SKILL.md` resolves through the symlink to the same underlying blob as `skills/<name>/SKILL.md`: `[ "$(readlink -f .claude/skills/<name>/SKILL.md)" = "$(readlink -f skills/<name>/SKILL.md)" ]`. (Note: `readlink -f` is GNU; on macOS the equivalent is `realpath` from coreutils or a portable pattern. The script must handle both — fall back to `realpath` if `readlink -f` is unavailable, or use `python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' <path>` as a portable third-party fallback if neither is present. Document the dependency in the script header.)
    4. Same assertion for `.agents/skills/<name>/SKILL.md`.
  - On all assertions passing, print `OK: all five skills discoverable via flat layout` and exit 0. On any failure, print the failing condition and exit non-zero.
- 14.2 Drop the previous script's plugin-scoped vs. standalone branching, the `plugins/<name>/skills/<name>/` target-path assertion, and the symlink-chain readlink dance. Replace with the simple shape above.
- 14.3 `chmod +x scripts/verify-dogfood.sh` (the file is already executable from the prior commit; verify and re-set if needed).
- 14.4 Smoke-test from the command line: `bash scripts/verify-dogfood.sh && echo OK`. Exit code 0.
- 14.5 Smoke-test negative-path: temporarily edit `skills/office-hours/SKILL.md` frontmatter `name: office-hours` → `name: wrong-name`, run the script, confirm non-zero exit; revert.
- 14.6 Update the pnpm script alias in `package.json` — confirm `verify:dogfood` points at `bash scripts/verify-dogfood.sh` (this alias already exists from commit `bdc390d`; no edit needed unless the path moved).
- 14.7 Commit with: `feat: #58 simplify verify-dogfood for flat skills layout`.

**Files touched in W14:** `scripts/verify-dogfood.sh` (rewritten).

**Verification:**

- `bash scripts/verify-dogfood.sh` exits 0 against the post-W12 + post-W13 tree.
- Negative-path smoke (described in 14.5) confirms non-zero exit.

**Definition of done:** Script returns 0 for the five flat-layout skills; uniform shape per skill; conventional commit landed.

**Risks/rollback:** Revert the script commit to restore the prior plugin-scoped/standalone branching script (which would then fail because it points at deleted paths). Effective rollback requires reverting W12 first, so the rollback chain is W14 → W13 → W12.

### Workstream 15 — Release-please reconfigure (`release-type: simple`) (AC-58-5)

**Goal:** Rewrite `release-please-config.json` and `.release-please-manifest.json` for three packages at `skills/scaffold-repository`, `skills/superteam`, `skills/using-github` with `release-type: simple`. No `extra-files` block (no marketplace.json to rewrite). Tag shape `<component>-v<X.Y.Z>` matching the prior shape (`scaffold-repository-v1.10.0`, etc.). Update `.github/workflows/release-please.yml` so it drops the marketplace-rewrite step, keeps the scaffold-repository self-apply step (Gate G3), and keeps auto-merge.

**Order rationale:** W15 depends on W12 (the package directories must be at their new flat paths). Independent of W13, W14, W16, W17. The release-please config rewrite is mechanical once the paths are settled.

**Tasks:**

- 15.1 Rewrite `release-please-config.json` to the following exact shape:

  ```json
  {
    "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
    "packages": {
      "skills/scaffold-repository": {
        "release-type": "simple",
        "tag-separator": "-v",
        "include-component-in-tag": true,
        "component": "scaffold-repository"
      },
      "skills/superteam": {
        "release-type": "simple",
        "tag-separator": "-v",
        "include-component-in-tag": true,
        "component": "superteam"
      },
      "skills/using-github": {
        "release-type": "simple",
        "tag-separator": "-v",
        "include-component-in-tag": true,
        "component": "using-github"
      }
    },
    "separate-pull-requests": true,
    "include-v-in-tag": true
  }
  ```

  **Tag shape verification.** With `"include-component-in-tag": true`, `"component": "scaffold-repository"`, `"tag-separator": "-v"`, and `"include-v-in-tag": true`, release-please produces tags of the form `<component><tag-separator><version>`, i.e. `scaffold-repository-v1.10.1`. This matches the prior `release-type: node` config's `tag-name-prefix: scaffold-repository-` shape exactly. Verify by dry-run (15.4 below). If the tag shape comes out different from `<component>-v<X.Y.Z>`, **halt and report**: the design's Gate G1 disposition (full prefixed tag passed to `npx skills add patinaproject/skills@<name>#<full-tag>`) assumes this exact shape, and the operator must redirect.

- 15.2 Rewrite `.release-please-manifest.json` to:

  ```json
  {
    "skills/scaffold-repository": "1.10.0",
    "skills/superteam": "1.5.0",
    "skills/using-github": "2.0.0"
  }
  ```

  These seeds match the upstream tags imported via `git subtree add` in W1 and the version that the prior marketplace manifests pinned. The next conventional `feat:` / `fix:` commit under `skills/<name>/**` will bump the matching package's version to `1.10.1` (or `1.11.0`, etc.) on the next release-please run.

- 15.3 Update `.github/workflows/release-please.yml`:
  - Remove any step that rewrote `marketplace.json` `source.ref` fields (the previous workflow had a post-step like this; with the catalog gone, the step must be deleted).
  - Keep the scaffold-repository self-apply step (Gate G3): `node scripts/apply-scaffold-repository.js skills/scaffold-repository` (path-updated by W17). The step's trigger condition is "`paths_released` from the release-please-action output contains `skills/scaffold-repository`." Adjust the conditional path-check from `plugins/scaffold-repository` to `skills/scaffold-repository`.
  - Preserve the existing auto-merge logic (`gh pr merge --auto --squash` against each open release-please PR) and the existing `github-actions[bot]` signing config.
  - Verify every `uses:` line remains pinned to a full-length commit SHA with the action+version comment above (AGENTS.md GitHub-Actions-pinning rule).
- 15.4 Dry-run release-please locally to validate the rewritten config:

  ```sh
  npx -y release-please@16 release-pr --dry-run \
    --token "$(gh auth token)" \
    --repo-url=https://github.com/patinaproject/skills \
    --config-file release-please-config.json \
    --manifest-file .release-please-manifest.json
  ```

  Expected output: three per-package PR plans (one per package), each producing a tag of the form `<component>-v<X.Y.Z>` (`scaffold-repository-v1.10.1`, etc., assuming there's a `feat:`/`fix:` commit under each path; otherwise the dry-run reports "no release needed" for each, which is also acceptable as a config-validation pass). Record the dry-run output. **If any package's projected tag shape deviates from `<component>-v<X.Y.Z>`, halt and report.**

- 15.5 Commit with: `feat: #58 reconfigure release-please for simple release-type per skill`.

**Files touched in W15:** `release-please-config.json` (rewritten), `.release-please-manifest.json` (rewritten), `.github/workflows/release-please.yml` (edited).

**Verification:**

- `actionlint .github/workflows/release-please.yml` passes.
- Dry-run output (recorded in W19's verification log) shows three packages, all `release-type: simple`, projected tag shape `<component>-v<X.Y.Z>`.
- Grep confirms no marketplace.json reference remains in the workflow: `rg -F 'marketplace' .github/workflows/release-please.yml` returns empty.

**Definition of done:** Three-package release-please config in place; manifest seeded; workflow path-updated; dry-run validates; commit landed.

**Risks/rollback:** If the dry-run reveals the tag shape is wrong (e.g. `scaffold-repository-1.10.1` without the `v`, or `scaffold-repository/v1.10.1` instead of the dash), reconfigure the four config knobs until the shape matches. The supplied combination (`tag-separator: "-v"` + `include-component-in-tag: true` + `include-v-in-tag: true` + `component: "<name>"`) is the documented combination that produces `<component>-v<X.Y.Z>`; if release-please's behavior changed between version 16 and a later release, pin the action to an earlier version that emits the expected shape. Rollback: revert the W15 commit to restore the prior `release-type: node` config; the release-please workflow will then fail because `plugins/<name>/package.json` paths no longer exist, so the rollback is effectively chained with W12 revert.

### Workstream 16 — Verify workflow rename (AC-58-3 CI surface; Comment 3220071994)

**Goal:** Rename `.github/workflows/verify-iteration.yml` to `.github/workflows/verify.yml` and update the workflow's top-level `name:` field to `Verify`. The operator's PR #59 comment requested the simpler display name.

**Order rationale:** W16 is independent of W12–W15 (the workflow file location is unrelated to the skills-tree restructure). Runs in parallel.

**Tasks:**

- 16.1 `git mv .github/workflows/verify-iteration.yml .github/workflows/verify.yml`. Rename detection is automatic.
- 16.2 Edit the workflow's top-level `name:` field. Current value is likely `Verify iteration` (from commit `eee1df4`); rewrite to `Verify`.
- 16.3 If the workflow body has any internal job names or display strings referencing "verify iteration", clean those up to match. Triage via `rg -F 'verify-iteration' .github/workflows/verify.yml` and `rg -F 'Verify iteration' .github/workflows/verify.yml`.
- 16.4 Confirm `actionlint .github/workflows/verify.yml` passes.
- 16.5 If any other workflow references `verify-iteration.yml` by name (e.g. as a `workflow_run` trigger or in a comment), update those references. Check via `rg -F 'verify-iteration' .github/`.
- 16.6 Update branch-protection settings if applicable: the new workflow's check name may differ from the old one, which can affect required-check rules. Recording this as a post-merge follow-up note (not in scope of the PR itself; the maintainer adjusts branch protection after the rename lands).
- 16.7 Commit with: `refactor: #58 rename verify-iteration workflow to verify`.

**Files touched in W16:** `.github/workflows/verify-iteration.yml` (renamed to `verify.yml`), possibly other files under `.github/` that referenced the old name.

**Verification:**

- `test -f .github/workflows/verify.yml && test ! -f .github/workflows/verify-iteration.yml` exits 0.
- `actionlint` passes on the renamed file.
- `head -5 .github/workflows/verify.yml` shows `name: Verify`.
- `rg -F 'verify-iteration' .github/` returns empty (or only matches benign comments that survived).

**Definition of done:** Workflow renamed; display name `Verify`; actionlint clean; commit landed.

**Risks/rollback:** Branch-protection rules pinned to the old check name may temporarily flag the new check as unrecognized; this is a configuration-only follow-up and does not block the PR. Rollback: revert the commit, restoring `verify-iteration.yml`.

### Workstream 17 — scaffold-repository apply script path updates (AC-58-3 check c, AC-58-5 Gate G3)

**Goal:** Update `scripts/apply-scaffold-repository.js` so internal path references switch from `plugins/scaffold-repository/` to `skills/scaffold-repository/`. The script's logic is unchanged; only the source path it reads from updates.

**Order rationale:** W17 depends on W12 (the new path must exist). Independent of W13, W14, W15, W16. Can run in parallel with the others.

**Tasks:**

- 17.1 Inspect `scripts/apply-scaffold-repository.js` for any string literal referencing `plugins/scaffold-repository` or `plugins/scaffold-repository/skills/scaffold-repository`. Use `rg -F 'plugins/scaffold-repository' scripts/apply-scaffold-repository.js`.
- 17.2 For each match, decide: is this the source-of-truth path the script reads (rewrite to `skills/scaffold-repository`) or a generic reference for documentation purposes (preserve only if explicitly historical)? Replace each path literal with `skills/scaffold-repository`.
- 17.3 If the script accepts a CLI argument for the package directory (e.g. `node apply-scaffold-repository.js <path>`), confirm the default value updates from `plugins/scaffold-repository` to `skills/scaffold-repository`. Update the `--help` text accordingly.
- 17.4 Update pnpm scripts in root `package.json` if they hard-code the old path. The relevant scripts are `apply:scaffold-repository` and `apply:scaffold-repository:check`. Rewrite each from `node scripts/apply-scaffold-repository.js plugins/scaffold-repository` (or similar) to `node scripts/apply-scaffold-repository.js skills/scaffold-repository`.
- 17.5 Verify by running: `node scripts/apply-scaffold-repository.js skills/scaffold-repository --check`. Exit 0 means the apply is idempotent against the current tree (which has already absorbed the prior self-apply baseline in commit `8ec0a33` plus follow-ups). If the exit is non-zero, the script may have legitimate scaffolding drift to land — read the script output and decide whether to apply (re-run without `--check`) or to investigate. In normal cases the `--check` exits 0.
- 17.6 Update `.github/workflows/release-please.yml` reference to the script's input path. This was started in W15.3 but is the executor's natural co-edit with W17: confirm the workflow's invocation reads `node scripts/apply-scaffold-repository.js skills/scaffold-repository` (matching the pnpm script).
- 17.7 Commit with: `fix: #58 update scaffold-repository apply paths for flat layout`.

**Files touched in W17:** `scripts/apply-scaffold-repository.js`, `package.json` (script aliases), `.github/workflows/release-please.yml` (if not already covered by W15).

**Verification:**

- `node scripts/apply-scaffold-repository.js skills/scaffold-repository --check` exits 0.
- `pnpm apply:scaffold-repository:check` exits 0 (same effect via the alias).
- `rg -F 'plugins/scaffold-repository' scripts/apply-scaffold-repository.js package.json .github/workflows/release-please.yml` returns empty.

**Definition of done:** Script accepts the new path; `--check` mode exits 0; pnpm aliases updated; commit landed.

**Risks/rollback:** If `--check` reveals drift, the script may want to write to the new path with content that differs from what the prior self-apply baseline (against the old path) committed. Triage on a case-by-case basis. The expected case is that the scaffold-managed files moved with the directory (W12) and the script sees them as identical post-rewrite. Rollback: revert the commit to restore the old path references; the release-please workflow then fails on the path-check (chain rollback with W15 and W12).

### Workstream 18 — Documentation sweep (AC-58-1, AC-58-2, AC-58-4, AC-58-6, AC-58-8)

**Goal:** Rewrite `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/release-flow.md`, `docs/file-structure.md`, and `docs/wiki-index.md` for the flat layout. Update markdownlint glob excludes if any pointed at deleted paths. Remove all references to plugin wrappers, marketplace catalogs, per-skill `package.json`, and the host-native marketplace-add install path. Add a migration history entry under `docs/file-structure.md` recording delta 4.

**Order rationale:** W18 depends on W12–W17 because it references the final shapes those workstreams establish. Sequencing W18 last in the per-workstream commit chain keeps each prior workstream commit reviewable in isolation; W18 then sweeps the docs in one coherent pass.

**Tasks:**

- 18.1 Rewrite `README.md`:
  - Install section: only documented install path is `npx skills@1.5.6 add patinaproject/skills@<name> --agent <agent> -y`. Show one command per skill (five total). Use the `npm_config_ignore_scripts=true` env-var prefix as the default form. Document the pinned vercel-labs CLI version (`1.5.6`) and the upstream URL (`https://github.com/vercel-labs/skills`).
  - Remove the host-native marketplace fallback section entirely (the `/plugin marketplace add patinaproject/skills` and `codex plugin marketplace add` paths). The marketplace catalog is gone.
  - Document the clone-and-copy fallback for users who distrust the npm-distributed CLI: clone the repo, copy `skills/<name>/SKILL.md` (plus any supporting files) into the agent's skill directory. This is the supply-chain rollback recorded in the design's Risks section.
  - Document the `#<git-ref>` tag-pin syntax: `npx skills@1.5.6 add patinaproject/skills@scaffold-repository#scaffold-repository-v1.10.1 ...` for users who want a pinned version. Note that consumers pass the full prefixed tag (per Gate G1's removal — no stripping).
  - Add a "Local iteration" subsection pointing at `scripts/verify-dogfood.sh` and `scripts/apply-scaffold-repository.js --check` as the contributor verification commands.
- 18.2 Rewrite `AGENTS.md` "Plugin Releases" section (currently it documents the marketplace + dispatch flow):
  - Rename the section to "Skill Releases" (the term "plugin" is obsolete here since we don't carry plugin wrappers anymore).
  - Describe release-please with `release-type: simple` per skill, tag shape `<component>-v<X.Y.Z>`, three packaged skills (`scaffold-repository`, `superteam`, `using-github`), two standalone skills (`find-skills`, `office-hours`) that are versioned outside release-please. Reference the rewritten `docs/release-flow.md` for the full detail.
  - Remove references to plugin wrappers, marketplace.json, plugin manifests (`.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`).
  - Update the "source-of-truth boundary" line to: "This repo's `skills/<name>/` owns each skill for `name ∈ {scaffold-repository, superteam, using-github, find-skills, office-hours}`. Standalone skills (`find-skills`, `office-hours`) are not release-please packages."
  - Update the "Plugin folder lowercase names" rule if any text in AGENTS.md is now wrong (we removed plugin wrappers, so this rule is moot — but the related rule about "Use lowercase names for skill folders" should remain, just rephrased).
  - Keep the GitHub Actions pinning rule, the issue-tag rule, the commitlint rule, the labels rule, the `.github/` templates rule, the testing-guidelines rule.
- 18.3 Update `CLAUDE.md`:
  - Confirm it still imports `AGENTS.md` correctly. The current `CLAUDE.md` reads `@AGENTS.md` plus project-Claude-specific guidance below. Verify the import line survives any prior delta.
  - Update any path references (e.g. `.claude/skills/` references to in-repo skill locations) if present.
- 18.4 Rewrite `docs/release-flow.md` for the new release model:
  - Replace the prior content (release-please node + marketplace rewrites + dispatch workflow) with:
    1. Release model: per-skill release-please with `release-type: simple`.
    2. Tag shape: `<component>-v<X.Y.Z>` for the three packaged skills.
    3. Consumer pin syntax: `npx skills@1.5.6 add patinaproject/skills@<name>#<full-tag>`.
    4. Standalone-skill resolution: `npx skills add patinaproject/skills@<name>` (no `@<ref>` qualifier) resolves to default-branch HEAD; consumers wanting a pinned version pass `#<git-ref>`. This applies to `find-skills` and `office-hours`.
    5. The vercel-labs CLI version pin (`1.5.6` at time of writing); bumping the CLI version requires re-running `bash scripts/verify-dogfood.sh` plus a representative `npx skills add` smoke before the bump merges.
    6. Auto-merge: release-please PRs auto-merge after required CI checks pass; preserve the existing `github-actions[bot]` signing and the AGENTS.md `release-please--*` no-issue exemption (already in place).
    7. Scaffold self-apply (Gate G3): the release-please workflow invokes `node scripts/apply-scaffold-repository.js skills/scaffold-repository` when `paths_released` contains `skills/scaffold-repository`; the resulting scaffolding refresh lands on the same release-please PR branch in the same workflow run.
    8. Supply-chain fallback: clone-and-copy from `skills/<name>/SKILL.md` if the upstream CLI is unavailable or distrusted.
  - Remove the cross-repo dispatch section and the "required setup in each member plugin repo" section entirely.
- 18.5 Rewrite `docs/file-structure.md` for the flat layout:
  - Top-level layout diagram matches the design's "Proposed file layout" section.
  - Document the dogfood overlay: `.claude/skills/<name>/` and `.agents/skills/<name>/` are committed symlinks pointing at `../../skills/<name>/`; the five overlay symlinks are tracked via the `.gitignore` allowlist pattern.
  - Document the clone-time symlink requirement on Windows: `git config core.symlinks true` (admin shell required); fall back to WSL for contributors who can't enable it. Note that POSIX hosts (Linux, macOS) handle this transparently.
  - Add a "Migration history" section recording the three events for `scaffold-repository`, the two events for `superteam` and `using-github`, and the two events for `office-hours`:
    - Subtree imports (commits `912d6d9`, `028165e`, `54157bc`).
    - Rename for the scaffold skill (commit `794e199`).
    - Flatten for the three packaged skills + the two standalone skills (the W12.9 commit SHA, recorded by Executor at the time the commit lands).
    - office-hours port (commit `fab5458`, source `patinaproject/patinaproject` PR #1143 head SHA `02e6ebbdbef123bbeb211fad06aa86bd5e33528a`, post-flatten path `skills/office-hours/SKILL.md`).
    - Note that the upstream `patinaproject/bootstrap`, `patinaproject/superteam`, and `patinaproject/using-github` repos remain archived as the byte-for-byte references for pre-flatten audits.
- 18.6 Rewrite `docs/wiki-index.md` for the flat layout:
  - Update path references from `plugins/<name>/skills/<name>/SKILL.md` (and from pre-flatten `.agents/skills/<name>/SKILL.md`) to `skills/<name>/SKILL.md` throughout.
  - Remove any "plugin marketplace add" install instructions; replace with `npx skills` invocations.
  - Add the `Skill-office-hours-usage` page entry if it isn't already there from prior deltas (commit `cc77a14` added the initial wiki-index; verify the office-hours row is present, add if missing).
  - The actual wiki publication is deferred to post-merge (per Gate G5). The in-repo `wiki-index.md` documents the wiki's canonical surface.
- 18.7 Update `.github/workflows/markdown.yml` if its glob excludes reference deleted paths. Commit `2291f02` restored vendor-ignore patterns for the prior plugin scaffolding; review and trim any patterns that now point at deleted paths (`plugins/*/.husky`, `plugins/*/node_modules`, etc.). Add patterns for any new ignored locations if needed.
- 18.8 Commit with: `docs: #58 sweep documentation for flat-skills layout`.

**Files touched in W18:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/release-flow.md`, `docs/file-structure.md`, `docs/wiki-index.md`, `.github/workflows/markdown.yml`.

**Verification:**

- `pnpm lint:md` passes against the rewritten docs.
- `rg -F 'plugins/scaffold-repository' README.md AGENTS.md CLAUDE.md docs/` returns empty (or only matches historical migration-history rows, which is intended).
- `rg -F 'marketplace.json' README.md AGENTS.md docs/` returns empty.
- `rg -F '/plugin marketplace add' README.md AGENTS.md docs/` returns empty (host-native install path removed).
- The migration history section in `docs/file-structure.md` lists all the commits referenced in the design's "Migration approach" section.

**Definition of done:** Docs sweep covers all six files; markdownlint clean; commit landed.

**Risks/rollback:** Docs drift is a soft failure (CI lint catches it). Rollback: revert the commit; prior versions of these docs remain on `main` history.

### Workstream 19 — Final verification pass (cross-AC verification + final commit)

**Goal:** Run the canonical pre-publish verification suite against the post-W12-through-W18 tree and record evidence. Cover every AC's falsifiable check.

**Order rationale:** W19 depends on every prior workstream. The final commit (if any work product is produced beyond verification logs) is small and documentary.

**Tasks:**

- 19.1 `pnpm install` — exits 0; Husky hooks initialized.
- 19.2 `pnpm lint:md` — exits 0; markdownlint clean against the rewritten docs.
- 19.3 `actionlint .github/workflows/*.yml` — exits 0; every workflow valid.
- 19.4 `bash scripts/verify-dogfood.sh` — exits 0; AC-58-3 dogfood check passes for all five skills.
- 19.5 `node scripts/apply-scaffold-repository.js skills/scaffold-repository --check` — exits 0; AC-58-3 falsifiable check (a) (scaffold idempotent against current tree).
- 19.6 SHA round-trip evidence: `sha256sum skills/superteam/SKILL.md` equals `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356` (AC-58-7). Confirm `docs/superpowers/plans/.artifacts/sha256-post.txt` records the same value (W12.7 should have already updated this).
- 19.7 AC-58-1 falsifiable checks: `find . -name plugin.json -not -path './node_modules/*' -not -path './.git/*'` returns empty; `find skills -maxdepth 2 -name SKILL.md | sort` returns exactly five paths; `git log --follow skills/superteam/SKILL.md` shows blame survives.
- 19.8 AC-58-2 falsifiable check: `find . -name 'marketplace*.json' -not -path './node_modules/*' -not -path './.git/*'` returns empty.
- 19.9 AC-58-4 falsifiable check: dry-run an `npx skills add` against the current branch from a temporary directory. This requires the repo's branch to be either pushed to the remote, or the CLI's `git+file://` source mode to be used; document the chosen form. If the CLI doesn't support a falsifiable dry-run for unreleased branches, defer the live install verification to post-merge (when the tag exists) and record this in the PR body. The pre-merge confidence comes from W14's dogfood script proving the canonical-home `SKILL.md` files exist with the right frontmatter — which is exactly what the CLI's `<owner/repo@skill>` resolver consults.
- 19.10 AC-58-5 falsifiable check: re-run W15.4's release-please dry-run; confirm it lists three packages and projected tag shapes `<component>-v<X.Y.Z>`.
- 19.11 If any verification step reveals a missed edit (e.g. a stray plugin-wrapper reference in a doc, a path mismatch in `package.json`, a markdownlint failure), land the fix as part of this workstream's commit. Examples of edits the executor may need to land here:
  - Re-running `pnpm install` to refresh `pnpm-lock.yaml` if the package.json script edits in W17 perturbed it (no-op in the common case).
  - Adjusting any test or CI step that referenced the deleted `validate-marketplace.js` script (verify CI on the renamed `verify.yml` doesn't try to invoke it).
- 19.12 Commit any needed fixes plus the verification-log artifact (if Executor wants to record the dry-run output for posterity) with: `chore: #58 final verification pass for flat-skills restructure`. If no fixes are needed, the verification log alone is the commit body (referenced from the PR body).

**Files touched in W19:** Whatever the verification surfaces. In the no-issue case, only the verification log is added (Executor's discretion whether to commit it as an artifact under `docs/superpowers/plans/.artifacts/` or to record output in the PR body).

**Verification:** Itself — the entire workstream is verification. Pass criterion: every command above exits 0 (or the deferred-verification path is documented for AC-58-4's live-install case).

**Definition of done:** All pre-publish checks pass; any incidental fixes committed; PR is ready for Reviewer → Finisher.

**Risks/rollback:** A failure in W19 indicates a missed edit earlier in the chain. Rollback the offending workstream, fix, re-run W19. If a failure is structural (e.g. release-please dry-run reveals the tag shape is wrong), halt and escalate — the design's Gate G1 assumption is broken and the operator must redirect.

## Workstream dependency graph

```text
W12 (flat-mv, deletions, SHA round-trip) ─┬─> W13 (overlay symlinks + .gitignore) ─┬─> W14 (verify-dogfood rewrite) ─┐
                                          │                                         │                                  │
                                          ├─> W17 (apply-scaffold path updates) ────┤                                  │
                                          │                                         │                                  │
                                          └─> W15 (release-please simple) ──────────┤                                  ├─> W19 (final verify)
                                                                                    │                                  │
            W16 (verify.yml rename) ──────────────────────────────────────────────  │                                  │
                                                                                    │                                  │
            W18 (docs sweep) ───────────────────────────────────────────────────────┘                                  │
                                                                                                                       │
                                                                                                                       └─> Reviewer → Finisher
```

W13, W15, W16, W17 can proceed in parallel once W12 lands. W14 depends on W13 (overlay symlinks must exist). W18 sweeps last among the per-workstream commits because it references every prior shape. W19 is the cross-cutting verification.

## AC traceability

| AC | Workstreams (post-delta-4) |
| --- | --- |
| AC-58-1 | W12.1–W12.6 (flat `skills/`, plugin wrappers + marketplace catalog + per-plugin `package.json` deleted) |
| AC-58-2 | W12.6 (marketplace catalog + validator deletion) |
| AC-58-3 | W13 (overlay symlinks) + W14 (verify-dogfood rewrite); AC-58-3 check (a) ATDD live-install is W18 README documentation + W19.9 falsifiable check |
| AC-58-4 | W18.1 (README rewrite — `npx skills` only, no marketplace fallback) |
| AC-58-5 | W15 (release-please `release-type: simple`); W17 (scaffold apply path updates); W19.10 (release-please dry-run) |
| AC-58-6 | W18.5 (`docs/file-structure.md` rewrite) + W18.6 (`docs/wiki-index.md` rewrite); actual wiki publication remains post-merge per Gate G5 |
| AC-58-7 | W12.7 (SHA-256 round-trip; pre-flatten value `87867b66...` must equal post-flatten value) |
| AC-58-8 | W12.1–W12.5 (`git mv` chain preserves blame and SHA) + W18.5 (migration history entry under `docs/file-structure.md`) |

## ATDD verification (AC-58-3 falsifiable checks, post-delta-4 shape)

The four AC-58-3 falsifiable checks collapse to two after delta 4 (the validator dev/release modes go away with the marketplace catalog). Recorded in `README.md` and exercised in CI via the renamed `verify.yml` workflow.

### Check a — vercel-labs CLI install (live, deferred to post-merge for the published tag)

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y
echo "exit=$?"
```

Pass criterion: exit code 0. The chosen falsifiable form (`-y` against a tag; or `--dry-run` if the pinned CLI version supports it; or against `--prefix /tmp/skills-dryrun` to avoid mutating the host's skill dir) is documented in `README.md`. Pre-merge, the W14 dogfood script provides indirect confidence: the canonical-home `SKILL.md` files exist with the right frontmatter, which is exactly what the CLI's resolver consults.

### Check b — scaffold-repository apply idempotent (CI on every PR via verify.yml)

```sh
node scripts/apply-scaffold-repository.js skills/scaffold-repository --check
echo "exit=$?"
```

Pass criterion: exit code 0. The script asserts no outbound network calls (no `git fetch`, no remote `npm install`, no `curl`/`fetch`). Enforced by the script's outbound-call guard.

### Check c — dogfood verification (CI on every PR via verify.yml)

```sh
bash scripts/verify-dogfood.sh
echo "exit=$?"
```

Pass criterion: exit code 0. All five skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`) satisfy the uniform shape: real file at `skills/<name>/SKILL.md`, well-formed YAML frontmatter with `name:` matching `<name>`, and the symlinks at `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md` resolve to the same blob.

## Risks and blockers (cross-workstream, delta-4 shape)

- **Release-please `release-type: simple` tag-shape assumption.** The plan assumes the four config knobs (`tag-separator: "-v"` + `include-component-in-tag: true` + `include-v-in-tag: true` + `component: "<name>"`) produce `<component>-v<X.Y.Z>` tags. If release-please version 16 (or whichever version the workflow pins) emits a different shape, halt at W15.4 and report — the design's Gate G1 disposition (consumers pass the full prefixed tag) depends on this exact shape.
- **SHA-256 round-trip integrity.** W12.7's check is the AC-58-7 GREEN gate. If any editor touched `skills/superteam/SKILL.md` between the `git mv` and the post-flatten SHA check, the round-trip fails and the writing-skills baseline is broken. Mitigation: W12.2 is a pure `git mv` with no follow-on edits; W12.8's internal-link sweep operates on the other two skills' files.
- **Dogfood symlink portability on Windows.** Committed symlinks require `git config core.symlinks true` on Windows clones. POSIX hosts handle this transparently. Documented in `docs/file-structure.md` (W18.5).
- **Vercel-labs CLI supply chain.** With the marketplace-add fallback removed (AC-58-2), the npm-distributed CLI is the only documented install path. Mitigations: pin the CLI version at invocation (`skills@1.5.6`); document `npm_config_ignore_scripts=true` as the default; document the clone-and-copy fallback in `README.md` (W18.1).
- **CI check-name drift after `verify-iteration.yml` → `verify.yml` rename.** Branch-protection rules pinned to the old check name may flag the new check as unrecognized. Recorded in W16.6 as a post-merge configuration follow-up; not in scope of the PR itself.
- **Third-party skill installs polluting the overlay directories.** The 14 superpowers skills currently sitting untracked become explicitly gitignored after W13.3's allowlist pattern. A future contributor who installs additional third-party skills (e.g. more obra/superpowers entries) sees the CLI write to `.claude/skills/<name>/` and `.agents/skills/<name>/`; those become gitignored by the same pattern automatically. The five in-repo overlay symlinks are explicitly tracked via the negated allowlist entries.
- **`skills-lock.json` state.** The working tree shows `M skills-lock.json` — the CLI bumped the lockfile during the most recent superpowers install batch. Executor should stage this lockfile update as part of W13's commit (or as a separate small `chore:` commit) so the committed state matches the CLI's expectations after the dogfood overlays are in place. Confirm via `git diff skills-lock.json` what changed before committing.

## Rollback approach per workstream

- **W12 (flat-mv chain):** revert the single commit. `plugins/`, `.agents/plugins/`, `.claude-plugin/`, the marketplace files, and the validator are all restored. Every downstream workstream (W13–W19) is broken without W12 in place; their reverts must chain.
- **W13 (overlay symlinks + `.gitignore`):** revert the commit. The ten symlinks disappear; `.gitignore` returns to the pre-W13 state. The 14 third-party superpowers skills become untracked again.
- **W14 (verify-dogfood rewrite):** revert restores the prior plugin-scoped/standalone branching script, which then fails because it points at deleted paths. Effective rollback requires reverting W12 first.
- **W15 (release-please simple):** revert restores the `release-type: node` config; release-please then fails on missing `plugins/<name>/package.json` paths. Chain rollback with W12.
- **W16 (verify.yml rename):** revert restores `verify-iteration.yml`. Branch-protection rules return to recognizing the old check name automatically.
- **W17 (apply-scaffold paths):** revert restores the prior path. Script then fails on missing `plugins/scaffold-repository/`. Chain rollback with W12.
- **W18 (docs sweep):** revert restores prior docs. CI lint may complain about path references; manually retrim if needed.
- **W19 (final verification):** if W19 is its own commit (verification log artifact), revert removes the artifact. No structural rollback effect.

## Out of scope (called out so Executor does not gold-plate)

- Behavioral edits to any `SKILL.md`. The `superteam` and `using-github` `SKILL.md` content is byte-equivalent to the upstream tags (preserved across the flatten by `git mv`). The `scaffold-repository` SKILL.md edits already landed in commit `794e199` (W9 — the rename); no further edits in this delta. The `office-hours` SKILL.md is byte-for-byte from the upstream PR head SHA (port commit `fab5458`); no edits in this delta. Any behavioral edit to any SKILL.md is its own issue with its own AC-IDs.
- Authoring a Patina Project `skills` CLI. Gate G6 closed; vercel-labs CLI adopted.
- Auto-invoking host CLIs from the install command. Gate G4 closed; the vercel-labs CLI handles host detection via `--agent`.
- Wiki publication. Gate G5 stays; the wiki pages are published post-merge as a separate operator action against `patinaproject/skills.wiki`. The in-repo `docs/wiki-index.md` documents the canonical wiki surface.
- Archiving the upstream `patinaproject/bootstrap`, `patinaproject/superteam`, `patinaproject/using-github` repos. Recorded in the design as a post-merge action with a one-release-cycle delay; not in scope of this PR.
- Promoting `office-hours` or `find-skills` to release-please packages. Standalone skills resolve to default-branch HEAD by default; consumers wanting a pinned version pass `#<git-ref>`. Promotion would be a future issue.
- Building a public skills registry beyond what GitHub Releases provide via release-please.
- Updating branch-protection rules for the renamed CI check. Operator-managed post-merge action.

## Done-report mapping

The Finisher references this plan's workstream IDs (`W12`–`W19`) plus the historical IDs (`W1`–`W11`) in the eventual PR body's `Acceptance Criteria` section so each `AC-58-<n>` heading has verification steps anchored to specific tasks. The PR template's section ordering is preserved (per AGENTS.md's `.github/` templates rule).
