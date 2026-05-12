# Plan: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Source design

- Approved design: [`docs/superpowers/specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md`](../specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md)
- Approved-design head: `918ae16` (Brainstormer delta 6 — mattpocock/skills hybrid shape; `skills/<category>/<name>/` with `engineering/` + `productivity/` subdirs; `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` re-introduced; per-skill READMEs imported byte-for-byte from upstream tags for the three ex-plugin skills; root README rewritten in mattpocock format; release-please `extra-files` rewrites `metadata.version` in `.claude-plugin/marketplace.json`)
- Earlier accepted heads on this branch: `5b751ef` (delta 5, single-version release-please) and the original Gate-1 head (delta 0 / pre-delta-4 baseline).
- Selected approach: Option F2 (mattpocock hybrid — category-organized `skills/<category>/<name>/` with one `.claude-plugin/` catalog, per-skill READMEs for the three ex-plugin skills, host-native Claude Code install path re-enabled). F1 (delta 4) is preserved in the design's history section as the prior selection that delta 6 supersedes.
- ACs in scope: `AC-58-1` through `AC-58-9` (`AC-58-9` is new in delta 6 — README rewrites + per-skill imports).

## Plan revision history

This plan was previously revised twice on top of the original Gate-1 approval, then rewritten for delta 4, then extended for delta 5, and is now extended again for delta 6:

1. **Revision @ `d74e236`** (pre-canonical-layout / pre-CLI-adoption / pre-rename plan): assumed marketplace catalog + per-plugin `package.json` + an in-repo CLI under `packages/skills-cli/`. Obsolete.
2. **Revision @ `794e199`** (current `main`-ward HEAD until the delta-4 rewrite): added W9 (rename), W10 (canonical workspace overlay with two-hop symlink chain), W11 (dogfood verification harness branching on plugin-scoped vs. standalone shape); kept the plugin-wrappers + marketplace-catalog + per-plugin `package.json` layout. Mostly obsolete after delta 4.
3. **Delta 4 rewrite** (Brainstormer commit `0b000f9` against design HEAD): flat `skills/<name>/` at the repo root, marketplace catalog deleted, plugin wrappers deleted, per-plugin `package.json` deleted, dogfood overlay collapsed to one-hop symlinks, `release-type: simple` everywhere. Captured as W12–W19 below. **Landed on this branch.**
4. **Delta 5 amendment** (single marketplace version): collapsed three release-please packages to one root `"."` entry; `v<X.Y.Z>` tags; seed `1.0.0`; Gate G1 obsolete. Absorbed into W15 below. **Landed on this branch.**
5. **Delta 6 amendment** (this revision, against design head `918ae16`): adopt mattpocock/skills hybrid structure. Categorize skills under `skills/<category>/<name>/`; re-introduce `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` (mattpocock shape, plugin slug `patinaproject-skills`); import per-skill READMEs byte-for-byte from upstream tags for the three ex-plugin skills with three categories of mechanical edit per file; rewrite the root README in mattpocock format with two install paths; update overlay symlink targets, scripts, and docs for the new category paths. Adds AC-58-9. **NOT YET LANDED — Executor's W20–W25 below.**

Workstream IDs continue from the prior `W1`–`W19`. The new delta-6 workstreams are `W20`–`W25`. Prior workstreams W12–W19 are now dispositioned as historical (all landed on this branch); their content is preserved in this plan as reference for the Executor and Reviewer who will read the per-workstream commit chain.

**Disposition of W12–W19 (delta-4 / delta-5 workstreams) as of delta 6:**

- **W12** (flat-mv chain): DONE. The five `skills/<name>/` real-file directories exist on the branch. Delta 6's W20 performs another `git mv` chain to move each of them into `skills/<category>/<name>/`.
- **W13** (overlay symlinks + `.gitignore`): DONE. Ten symlinks at `.claude/skills/<name>` and `.agents/skills/<name>` currently point at `../../skills/<name>` (delta-4 target depth). Delta 6's W20 retargets them to `../../skills/<category>/<name>` (same `../..` segment count; the category segment is added downstream of the `skills/` root, not upstream of the overlay).
- **W14** (verify-dogfood.sh for flat layout): DONE. Delta 6's W20 updates the script to walk `skills/<category>/<name>/SKILL.md` paths and adds the design-deferred condition 5 (validate `.claude-plugin/plugin.json` `skills[]` matches canonical-home paths).
- **W15** (release-please single-root simple): DONE. The config is already `release-type: simple` with `package-name: patinaproject-skills` and the manifest is `{ ".": "1.0.0" }`. Delta 6's W21 adds an `extra-files` block to rewrite `metadata.version` in `.claude-plugin/marketplace.json` on each release.
- **W16** (verify.yml rename): DONE. Delta 6 leaves the workflow file name unchanged; the workflow's body picks up the new verify-dogfood and verify-marketplace checks via the scripts' new behavior, not via a workflow rewrite.
- **W17** (apply-scaffold path updates): DONE for the flat-layout path (`scripts/apply-scaffold-repository.js skills/scaffold-repository`). Delta 6's W20 updates the path argument and pnpm aliases to `skills/engineering/scaffold-repository`.
- **W18** (docs sweep for flat layout): DONE for delta-4 / delta-5 surfaces. Delta 6's W24 performs a follow-on sweep for the category layout, the re-introduced host-native install path, and the plugin slug `patinaproject-skills`.
- **W19** (final verification pass): DONE for delta 4 / delta 5. Delta 6's W25 reruns the same suite plus the new delta-6 checks (marketplace JSON shape, `plugin.json` `skills[]` match, README provenance lines, root README headings).

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

## Target layout — delta 4 (historical, landed on this branch)

The block below was the delta-4 target layout. Delta 6 supersedes it; see "Target layout (binding, from design delta 6)" further below. The delta-4 layout is preserved here so the Executor and Reviewer can correlate the W12–W19 commit chain with what landed at each step.

## Target layout (delta-4, historical)

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
release-please-config.json      # rewritten: single root package "." release-type: simple (W15)
.release-please-manifest.json   # rewritten: single entry ".": "1.0.0" (W15)
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

## Target layout (binding, from design delta 6)

```text
.claude-plugin/                        # NEW in delta 6 (re-introduced; partial reversal of delta 4 deletion, Claude-side only)
  marketplace.json                     # mattpocock shape; { name, owner, metadata: { description, version, repository }, plugins: [{ name, description, source: "./" }] }
  plugin.json                          # { name: "patinaproject-skills", skills: [<5 relative paths: engineering/ first, then productivity/>] }
skills/
  engineering/                         # NEW in delta 6 (category subdir)
    scaffold-repository/               # git mv from skills/scaffold-repository
      SKILL.md
      README.md                        # NEW: byte-for-byte from patinaproject/bootstrap@v1.10.0/README.md with three mechanical edits
      (supporting files moved with the directory: templates/, scripts/, audit-checklist.md, etc.)
    superteam/                         # git mv from skills/superteam
      SKILL.md                         # SHA-256 round-trip target: 87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356
      README.md                        # NEW: byte-for-byte from patinaproject/superteam@v1.5.0/README.md with three mechanical edits
      agents/, pre-flight.md, routing-table.md, project-deltas.md, workflow-diagrams.md
    using-github/                      # git mv from skills/using-github
      SKILL.md
      README.md                        # NEW: byte-for-byte from patinaproject/using-github@v2.0.0/README.md with three mechanical edits
      (supporting files: workflows/, agents/, etc.)
  productivity/                        # NEW in delta 6 (category subdir)
    office-hours/                      # git mv from skills/office-hours
      SKILL.md                         # no README (SKILL.md is comprehensive — mattpocock pattern for per-skill folders without imported README)
    find-skills/                       # git mv from skills/find-skills
      SKILL.md                         # no README (matches vercel-labs upstream pattern)
.claude/skills/<name>/                 # 5 symlinks, retargeted to ../../skills/<category>/<name>
.agents/skills/<name>/                 # 5 symlinks, retargeted to ../../skills/<category>/<name>
scripts/
  apply-scaffold-repository.js         # path argument updates to skills/engineering/scaffold-repository
  verify-dogfood.sh                    # rewritten to walk skills/<category>/<name>/SKILL.md and validate plugin.json skills[] matches
  verify-marketplace.sh                # NEW: light marketplace-shape sanity check (one plugin entry, name matches plugin.json, source === "./")
release-please-config.json             # adds extra-files block to rewrite metadata.version in .claude-plugin/marketplace.json
.github/workflows/
  verify.yml                           # wires verify-marketplace.sh into the existing dogfood checks
  release-please.yml                   # unchanged from W15; scaffold-apply step's input path updated to skills/engineering/scaffold-repository
  markdown.yml, actions.yml, pull-request.yml  # markdown.yml glob excludes adjusted in W24
README.md                              # rewritten in mattpocock format (delta 6, AC-58-9)
docs/
  release-flow.md, file-structure.md, wiki-index.md  # swept for category paths and host-native install path in W24
AGENTS.md                              # swept for plugin-marketplace + plugin-name + category-layout language in W24
package.json                           # pnpm script aliases (apply:scaffold-repository, apply:scaffold-repository:check) updated for engineering/ subdir
```

**Newly introduced in delta 6:**

- `.claude-plugin/` directory with two files (`marketplace.json`, `plugin.json`) — partial reversal of delta 4's deletion, Claude-side only; Codex catalog stays deleted.
- `skills/engineering/` and `skills/productivity/` category subdirs.
- `skills/engineering/scaffold-repository/README.md`, `skills/engineering/superteam/README.md`, `skills/engineering/using-github/README.md` — byte-for-byte upstream imports with three mechanical edits each.
- `scripts/verify-marketplace.sh` — light sanity check for the marketplace JSON shape.
- `release-please-config.json` `extra-files` block to rewrite the marketplace catalog's `metadata.version` field.

**Deltas to existing files (not new artifacts):**

- The 5 directories under `skills/<name>/` (delta 4) are `git mv`d into `skills/<category>/<name>/`.
- The 10 overlay symlinks at `.claude/skills/<name>` and `.agents/skills/<name>` retarget their relative paths from `../../skills/<name>` to `../../skills/<category>/<name>` (the `../..` segment count is unchanged; the category segment is appended **after** `skills/`, not added as another `..`).
- `scripts/verify-dogfood.sh` and `scripts/apply-scaffold-repository.js` and `package.json` script aliases switch their input paths to the category-prefixed form.
- `README.md` is rewritten end-to-end (the delta-4 version targeted vercel-labs-pure install; delta 6 documents two install paths in mattpocock format).

**Deleted in delta 6:** Nothing (delta 4 already deleted the plugin wrappers and the catalogs; delta 6's `.claude-plugin/` reintroduction is a partial reversal, not a new deletion).

## Sequenced workstreams

**Workstreams W12–W19 (delta-4 / delta-5) are historical and have all landed on this branch.** They are preserved below verbatim as reference for the Executor and Reviewer who read the per-workstream commit chain. The active workstreams for the Executor to land are W20–W25 (delta 6); they are appended after W19.

Ordering for the historical chain: **W12 (flat-mv) was the foundation.** Everything else depended on it. W13 (overlay symlinks + .gitignore), W17 (apply-scaffold paths), and W15 (release-please) each depended only on W12 and ran in parallel. W14 (verify-dogfood rewrite) depended on W12 + W13. W16 (workflow rename) was independent of W12. W18 (docs sweep) depended on W12–W17 because it referenced their final shapes. W19 (final verification) depended on everything.

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

### Workstream 15 — Release-please reconfigure (single root `release-type: simple`) (AC-58-5)

**Goal:** Rewrite `release-please-config.json` and `.release-please-manifest.json` to a **single root package** — one entry at `"."` with `release-type: simple`, seeded at `1.0.0`. Tag form is plain `v<X.Y.Z>` (no component prefix). Update `.github/workflows/release-please.yml` so the scaffold-repository self-apply step runs **unconditionally** on every release-please run (the script is idempotent — exits 0 when there is no diff). Drop any `paths_released` filtering logic that gated the step on a per-skill release.

**Delta from prior W15 (Brainstormer delta 4 → delta 5):** The prior plan called for three packages keyed by `skills/scaffold-repository`, `skills/superteam`, `skills/using-github`, producing `<component>-v<X.Y.Z>` tags. Delta 5 collapses this to one root package (`"."`), seeded at `1.0.0`, with plain `v<X.Y.Z>` tags. Gate G1 (consumer strips component prefix when passing `#<git-ref>` to `npx skills add`) is now **OBSOLETE** — there is no component prefix to strip. The per-skill seeds (`scaffold-repository: 1.10.0`, `superteam: 1.5.0`, `using-github: 2.0.0`) are dropped; migration history records the upstream version provenance instead.

**Order rationale:** W15 depends on W12 (the package directories must be at their new flat paths). Independent of W13, W14, W16, W17. Mechanical once the layout is settled.

**Tasks:**

- 15.1 Rewrite `release-please-config.json` to the following exact shape:

  ```json
  {
    "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
    "packages": {
      ".": {
        "release-type": "simple",
        "package-name": "patinaproject-skills"
      }
    }
  }
  ```

  No `separate-pull-requests`, no `tag-separator`, no `include-component-in-tag`, no `component` fields. Release-please with `release-type: simple` and a root package produces tags of the form `v<X.Y.Z>` by default.

- 15.2 Rewrite `.release-please-manifest.json` to:

  ```json
  {
    ".": "1.0.0"
  }
  ```

  One entry. The seed version `1.0.0` is the canonical "first stable release of this surface" per the design's rationale (upstream per-skill versions are preserved in the migration history, not encoded in the repo-wide initial version).

- 15.3 Update `.github/workflows/release-please.yml`:
  - Drop the `scaffold-repository--release_created` and `scaffold-repository--pr` outputs from the `release-please` job (they were keyed to the per-skill package path; they do not exist in the root-package shape).
  - Rewrite the `apply-scaffold-repository` job's `if:` condition from `needs.release-please.outputs['scaffold-repository--release_created'] == 'true'` to `needs.release-please.outputs.releases_created == 'true'`. The step now runs unconditionally on every release. The apply script is idempotent — it writes nothing and exits 0 when there is no scaffolding diff (the existing "No scaffolding changes to commit" branch already handles this).
  - Remove the `ref:` and `fetch-depth:` checkout overrides that pointed at the scaffold-repository release PR branch. With a single root release, the release-please action's default behaviour (checking out the release commit on `main` after tagging) is the correct target. The checkout should use the default branch ref.
  - Preserve the existing auto-merge logic and action SHA pins.
  - Verify every `uses:` line remains pinned to a full 40-character SHA with the action+version comment above it (AGENTS.md GitHub Actions pinning rule).

- 15.4 Verification step W15.5 (dry-run):

  ```sh
  npx -y release-please@16 release-pr --dry-run \
    --token "$(gh auth token)" \
    --repo-url=https://github.com/patinaproject/skills \
    --config-file release-please-config.json \
    --manifest-file .release-please-manifest.json 2>&1 | head -50
  ```

  Confirm the proposed tag matches `^v\d+\.\d+\.\d+$` (no component prefix). If the dry-run produces a tag like `scaffold-repository-v...` or any other prefixed form, **halt and report** — the config is wrong.

- 15.5 Commit with: `feat: #58 switch release-please to single marketplace version`.

**Files touched in W15:** `release-please-config.json` (rewritten), `.release-please-manifest.json` (rewritten), `.github/workflows/release-please.yml` (edited).

**Verification:**

- `actionlint .github/workflows/release-please.yml` passes.
- `release-please-config.json` has exactly one key under `packages` and that key is `"."`.
- `.release-please-manifest.json` has exactly one entry: `".": "1.0.0"`.
- Dry-run output shows proposed tag matching `^v\d+\.\d+\.\d+$` with no component prefix.
- `rg -F 'scaffold-repository--release_created' .github/workflows/release-please.yml` returns empty.

**Gate G1: OBSOLETE.** Per-skill tag prefixes (`<component>-v<X.Y.Z>`) do not exist in the single-version model. No stripping logic is required. Consumers pin via `patinaproject/skills@<name>#v<X.Y.Z>` and the `<ref>` is the plain `v<X.Y.Z>` tag.

**Definition of done:** Single-root config in place; manifest seeded at `1.0.0`; workflow updated with unconditional scaffold apply; dry-run confirms `v<X.Y.Z>` tag shape; commit landed.

**Risks/rollback:** If the dry-run reveals release-please does not support the single-root shape or emits a wrong tag, reconfigure and re-run. Rollback: revert the W15 commit; the three-package config is restored (though it will fail on the flat layout paths until W12 is also reverted).

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

---

## Active workstreams (delta 6 — to be landed by Executor)

The six workstreams below are the binding execution surface for delta 6. They land on top of the delta-4 / delta-5 state already on this branch (HEAD `918ae16` at plan time). W20 is foundational; W21–W23 each depend only on W20 and can run in parallel; W24 (docs sweep) follows the per-workstream commits; W25 is the final cross-cutting verification.

### Workstream 20 — Category restructure (`git mv` chain + symlink retarget + script paths) (AC-58-1, AC-58-3, AC-58-7, AC-58-8)

**Goal:** Move every skill directory from `skills/<name>/` to `skills/<category>/<name>/` (category `engineering/` for `scaffold-repository`, `superteam`, `using-github`; category `productivity/` for `office-hours`, `find-skills`). Retarget the ten overlay symlinks at `.claude/skills/<name>` and `.agents/skills/<name>` from `../../skills/<name>` to `../../skills/<category>/<name>`. Update `scripts/verify-dogfood.sh`, `scripts/apply-scaffold-repository.js`, and the pnpm script aliases in `package.json` to read the new category-prefixed paths.

**Order rationale:** W20 is the structural foundation for delta 6. W21 (`.claude-plugin/` catalog) references the category paths in `plugin.json.skills[]`; W22 (per-skill READMEs) writes into the category-prefixed directories; W23 (root README) links to the category folders. All three depend on W20. The `git mv` chain plus overlay retarget land in **one commit** so the working tree never has a half-moved state where the SKILL.md files exist at the new path but the overlay symlinks still point at the old (broken) target. The script-path edits land in the **same commit** so `bash scripts/verify-dogfood.sh` exits 0 immediately after the commit, satisfying the AC-58-3 dogfood check at commit time.

**Tasks:**

- 20.1 `git mv skills/scaffold-repository skills/engineering/scaffold-repository`. The directory's interior (SKILL.md, `templates/`, `scripts/`, `audit-checklist.md`, any other supporting files) moves with rename detection.
- 20.2 `git mv skills/superteam skills/engineering/superteam`. Carries `SKILL.md` plus `agents/`, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md`.
- 20.3 `git mv skills/using-github skills/engineering/using-github`. Carries `SKILL.md`, `workflows/`, `agents/`, slash-command surfaces.
- 20.4 `git mv skills/office-hours skills/productivity/office-hours`. Single `SKILL.md` real file moves into the canonical home.
- 20.5 `git mv skills/find-skills skills/productivity/find-skills`. The committed real-file `SKILL.md` plus any sub-content moves; rename detection preserves blame.
- 20.6 Retarget the ten overlay symlinks (use `ln -snf` so the existing symlink is overwritten without spurious "file exists" errors). Note: the `../..` segment count stays at exactly two — `.claude/skills/<name>/` is two segments deep, `skills/<category>/<name>/` is also two segments deep from the repo root, so `../../skills/engineering/superteam` is the correct relative path. **Do not** use `../../../skills/...` (three segments) — that ascends one level above the repo root.
  - `.claude/skills/`:
    - `ln -snf ../../skills/engineering/scaffold-repository .claude/skills/scaffold-repository`
    - `ln -snf ../../skills/engineering/superteam .claude/skills/superteam`
    - `ln -snf ../../skills/engineering/using-github .claude/skills/using-github`
    - `ln -snf ../../skills/productivity/office-hours .claude/skills/office-hours`
    - `ln -snf ../../skills/productivity/find-skills .claude/skills/find-skills`
  - `.agents/skills/`:
    - `ln -snf ../../skills/engineering/scaffold-repository .agents/skills/scaffold-repository`
    - `ln -snf ../../skills/engineering/superteam .agents/skills/superteam`
    - `ln -snf ../../skills/engineering/using-github .agents/skills/using-github`
    - `ln -snf ../../skills/productivity/office-hours .agents/skills/office-hours`
    - `ln -snf ../../skills/productivity/find-skills .agents/skills/find-skills`
  - Verify each: `readlink .claude/skills/superteam` returns `../../skills/engineering/superteam`; `test -e .claude/skills/superteam/SKILL.md` exits 0 (target resolves through the link).
- 20.7 **Path edits in supporting scripts and config.** Triage each location independently:
  - `scripts/apply-scaffold-repository.js`: search for `skills/scaffold-repository` literal references (`rg -F 'skills/scaffold-repository' scripts/apply-scaffold-repository.js`). Rewrite each to `skills/engineering/scaffold-repository`. The script's logic does not change; only the source path it reads from updates.
  - `package.json`: rewrite the two pnpm script aliases:
    - `"apply:scaffold-repository": "node scripts/apply-scaffold-repository.js skills/scaffold-repository"` → `"apply:scaffold-repository": "node scripts/apply-scaffold-repository.js skills/engineering/scaffold-repository"`
    - `"apply:scaffold-repository:check": "node scripts/apply-scaffold-repository.js skills/scaffold-repository --check"` → `"apply:scaffold-repository:check": "node scripts/apply-scaffold-repository.js skills/engineering/scaffold-repository --check"`
  - `.github/workflows/release-please.yml`: search for `skills/scaffold-repository` (`rg -F 'skills/scaffold-repository' .github/workflows/release-please.yml`). Rewrite the script invocation to `skills/engineering/scaffold-repository`. Preserve every `uses:` SHA pin and the action+version comment line above each.
- 20.8 **Rewrite `scripts/verify-dogfood.sh` for the category layout.** The script must:
  - Define a `SKILLS` array of `(category, name)` pairs: `engineering/scaffold-repository`, `engineering/superteam`, `engineering/using-github`, `productivity/office-hours`, `productivity/find-skills`.
  - For each pair, assert `skills/<category>/<name>/SKILL.md` exists as a real file (not a symlink): `test -f "skills/$pair/SKILL.md" && ! test -L "skills/$pair/SKILL.md"`.
  - Parse the YAML frontmatter and assert `name:` value equals the **leaf** name (the part after the slash), not the `category/name` pair.
  - Assert `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md` resolve through their symlinks to the same underlying blob as `skills/<category>/<name>/SKILL.md` (use the portable `readlink -f` fallback pattern documented in W14's script header — try `readlink -f`, fall back to `realpath`, fall back to `python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))'`).
  - **Add design-deferred condition 5** (per design AC-58-3, "A new condition 5 is deferred to a Planner follow-up"): validate that `.claude-plugin/plugin.json`'s `skills[]` array matches the canonical-home paths exactly. The validation parses `.claude-plugin/plugin.json` (use `jq -r '.skills[]'` if `jq` is available; fall back to `python3 -c 'import json,sys; [print(s) for s in json.load(open(".claude-plugin/plugin.json"))["skills"]]'`), sorts the result, and compares it against the sorted list `./skills/engineering/scaffold-repository`, `./skills/engineering/superteam`, `./skills/engineering/using-github`, `./skills/productivity/office-hours`, `./skills/productivity/find-skills`. Any mismatch (extra entry, missing entry, wrong path form) fails the check with an explicit error message. **Note:** condition 5 is skipped (with a soft warning) on the commit that adds W20 if `.claude-plugin/plugin.json` does not yet exist — it is created in W21. The check is hard-mandatory at W25's final-verification time once W21 has landed.
  - On all assertions passing, print `OK: all five skills discoverable via category layout` and exit 0.
- 20.9 **AC-58-7 SHA round-trip verification** (the binding write-skills test, extended to the four-step chain per design AC-58-7). Compute `sha256sum skills/engineering/superteam/SKILL.md` and confirm the digest equals `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356` (pre-flatten value recorded in PR #59; post-delta-4 value recorded in `docs/superpowers/plans/.artifacts/sha256-post.txt`; the post-delta-6 value must equal both). Update `docs/superpowers/plans/.artifacts/sha256-post.txt` with the post-categorize digest and a note recording the three-step round-trip (subtree → flatten → categorize). If the digest does not match, halt: an editor touched the file between the moves and the design's GREEN baseline is broken. **The `git mv` chain is index-only — no editor invocation should touch any SKILL.md byte in this workstream.**
- 20.10 **Internal-link sweep within moved files.** Run `rg -F 'skills/scaffold-repository' skills/engineering/scaffold-repository/` (and analogous greps for the other four directories). For each match decide: is this a path reference that should rewrite to `skills/engineering/scaffold-repository/` (or `skills/productivity/<name>/` for the productivity pair), or generic English / a URL pointing at an archived upstream repo (preserve)? Do **not** use `sed -i` blast-radius rewrites — triage surface-by-surface. Note that the imported per-skill READMEs in W22 will introduce more cross-references; W22 handles its own sweep.
- 20.11 **`.gitignore` review.** The delta-4 allowlist pattern (`.claude/skills/*` with negated `!.claude/skills/<name>` entries for the five overlay symlinks; same for `.agents/skills/*`) still works after retargeting because the symlinks keep their names. Verify with `git status --ignored | grep '\.agents/skills/'` after the symlink retarget — the 14 third-party superpowers skills still appear under "Ignored", and none of the five overlay symlinks appear there. No `.gitignore` edit needed unless verification surfaces a regression.
- 20.12 Commit with: `refactor: #58 categorize skills into engineering/ and productivity/ subdirs`. Single commit covering 20.1–20.11. Conventional commit format; issue-tag rule satisfied.

**Files touched in W20:** `skills/scaffold-repository/**` (renamed to `skills/engineering/scaffold-repository/**`), `skills/superteam/**` (renamed to `skills/engineering/superteam/**`), `skills/using-github/**` (renamed to `skills/engineering/using-github/**`), `skills/office-hours/**` (renamed to `skills/productivity/office-hours/**`), `skills/find-skills/**` (renamed to `skills/productivity/find-skills/**`), `.claude/skills/*` (ten symlinks retargeted), `.agents/skills/*` (ten symlinks retargeted), `scripts/apply-scaffold-repository.js` (path-literal edits), `scripts/verify-dogfood.sh` (rewritten for category layout + new condition 5), `package.json` (pnpm script aliases), `.github/workflows/release-please.yml` (scaffold-apply input path), `docs/superpowers/plans/.artifacts/sha256-post.txt` (verification receipt).

**Verification (Executor runs each command and confirms exit code / output):**

- `find skills -mindepth 3 -maxdepth 3 -name SKILL.md | sort` returns exactly the five paths listed in AC-58-1 falsifiable check (b).
- `git log --follow --format=%H skills/engineering/superteam/SKILL.md | tail -1` resolves to the same commit and blob as the pre-categorize path (AC-58-1 falsifiable check c — verify per-file blame survives the four-step chain).
- `sha256sum skills/engineering/superteam/SKILL.md` equals `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356` (AC-58-7).
- For each of the ten overlay symlinks: `readlink .claude/skills/<name>` returns `../../skills/<category>/<name>` (or analogously for `.agents/skills/<name>`); `test -e <link>/SKILL.md` exits 0.
- `bash scripts/verify-dogfood.sh` exits 0 (condition 5 emits a soft skip-warning at this point because `.claude-plugin/plugin.json` does not exist yet; that is expected — W21 will create it and W25 will re-verify).
- `node scripts/apply-scaffold-repository.js skills/engineering/scaffold-repository --check` exits 0 (the scaffold-apply is idempotent against the new tree).
- `rg -F 'skills/scaffold-repository' scripts/apply-scaffold-repository.js package.json .github/workflows/release-please.yml` returns empty (no stray flat-layout references).

**Definition of done:** Five skills at category-prefixed canonical homes; ten overlay symlinks retargeted; script + workflow + package.json paths updated; SHA round-trip verified; conventional commit landed.

**Risks/rollback:** If the SHA round-trip fails (digest does not match `87867b66...`), halt and report — an editor touched the file between moves. Rollback: revert the single commit; the delta-4 flat layout is restored. The `.claude-plugin/` and per-skill READMEs do not exist yet so there is no cross-workstream dependency to chain-rollback.

### Workstream 21 — `.claude-plugin/marketplace.json` + `plugin.json` (mattpocock catalog re-introduction) + release-please `extra-files` (AC-58-2, AC-58-4, AC-58-5)

**Goal:** Create `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` per the design's binding shape (AC-58-2). Add a `scripts/verify-marketplace.sh` light sanity check. Wire it into `.github/workflows/verify.yml`. Add an `extra-files` block to `release-please-config.json` so each release bumps `metadata.version` in `.claude-plugin/marketplace.json` to match the new tag.

**Order rationale:** W21 depends on W20 (the `plugin.json` `skills[]` array references the category-prefixed paths). Independent of W22 and W23. Once W20 lands, W21–W23 can proceed in any order; W21 is sequenced first among them because the marketplace catalog is the smallest reviewable change and unblocks W23 (the root README references the host-native install path that depends on the catalog existing).

**Tasks:**

- 21.1 Create `.claude-plugin/marketplace.json` with **exactly** the design's binding shape (AC-58-2). The shape:

  ```json
  {
    "name": "patinaproject-skills",
    "owner": {
      "name": "Patina Project",
      "url": "https://github.com/patinaproject"
    },
    "metadata": {
      "description": "Skills used by the Patina Project team",
      "version": "1.0.0",
      "repository": "https://github.com/patinaproject/skills"
    },
    "plugins": [
      {
        "name": "patinaproject-skills",
        "description": "Skills used by the Patina Project team — scaffold-repository, superteam, using-github, office-hours, find-skills",
        "source": "./"
      }
    ]
  }
  ```

  The plugin slug `patinaproject-skills` appears at top-level `name` and at `plugins[0].name`. Both must match. The `metadata.version` value is seeded at `1.0.0`, matching `.release-please-manifest.json`. The `plugins[0].source` is the literal string `"./"` (the source is the repo itself; no `ref` or `path` qualifier).

- 21.2 Create `.claude-plugin/plugin.json` with **exactly** the design's binding shape (AC-58-2). The shape:

  ```json
  {
    "name": "patinaproject-skills",
    "skills": [
      "./skills/engineering/scaffold-repository",
      "./skills/engineering/superteam",
      "./skills/engineering/using-github",
      "./skills/productivity/office-hours",
      "./skills/productivity/find-skills"
    ]
  }
  ```

  Top-level `name` matches `marketplace.json`'s `name` and `plugins[0].name` (all three are `patinaproject-skills`). The `skills[]` array order is **engineering/ first, then productivity/**, matching the design's binding order in AC-58-2 and AC-58-1. Each path is a relative path starting with `./` and pointing at the skill's canonical home directory (not the `SKILL.md` file inside it — Claude Code's plugin loader expects directory paths in `plugin.json.skills[]`, per the plugin-structure skill's reference).

- 21.3 **JSON schema sanity check.** Claude Code's marketplace JSON schema URL is not publicly stable enough at design time to embed as a `$schema` field, so the script-level sanity check is the executor-side validation:
  - Validate both files are well-formed JSON: `jq . .claude-plugin/marketplace.json > /dev/null` and `jq . .claude-plugin/plugin.json > /dev/null`.
  - Validate the three required slug-match invariants: `[ "$(jq -r .name .claude-plugin/marketplace.json)" = "patinaproject-skills" ]`; `[ "$(jq -r '.plugins[0].name' .claude-plugin/marketplace.json)" = "patinaproject-skills" ]`; `[ "$(jq -r .name .claude-plugin/plugin.json)" = "patinaproject-skills" ]`.
  - Validate the `plugins[0].source` value: `[ "$(jq -r '.plugins[0].source' .claude-plugin/marketplace.json)" = "./" ]`.
  - Validate the `skills[]` count and shape: `[ "$(jq -r '.skills | length' .claude-plugin/plugin.json)" = "5" ]` and each entry matches `^\./skills/(engineering|productivity)/[a-z-]+$` (no trailing slash, no `SKILL.md` suffix, no upward path traversal).
  - If a publicly-cached Claude Code marketplace schema becomes available before Executor runs (URL form `https://docs.anthropic.com/.../marketplace.schema.json` or similar), Executor can run a structural validation via `ajv` or equivalent — optional confidence-builder, not a blocker.

- 21.4 Create `scripts/verify-marketplace.sh` mechanizing the W21.3 checks plus the script-level invariants in AC-58-2 falsifiable checks. The script's contract:
  - Exit 0 if and only if `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` exist, are well-formed JSON, and satisfy every invariant above.
  - Exit non-zero with a clear error message naming the failing condition otherwise.
  - Use the same `jq`/`python3` fallback pattern as `scripts/verify-dogfood.sh` for portability.
  - `chmod +x scripts/verify-marketplace.sh` — make the script executable.
  - Add a header comment recording: AC-58-2 falsifiable checks, design head `918ae16`, and a one-line "what this validates" summary.

- 21.5 Wire `scripts/verify-marketplace.sh` into `.github/workflows/verify.yml`. The workflow currently runs `scripts/verify-dogfood.sh` as one of its steps; add a new step (or extend the existing one) to invoke `scripts/verify-marketplace.sh` after the dogfood check. Preserve every existing `uses:` SHA pin and the action+version comment above each. Verify with `actionlint .github/workflows/verify.yml` — exits 0.

- 21.6 **Release-please `extra-files` block.** Update `release-please-config.json` to add an `extra-files` array under the `"."` package, configured to rewrite the `metadata.version` field in `.claude-plugin/marketplace.json` on each release. The shape:

  ```json
  {
    "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
    "packages": {
      ".": {
        "release-type": "simple",
        "package-name": "patinaproject-skills",
        "extra-files": [
          {
            "type": "json",
            "path": ".claude-plugin/marketplace.json",
            "jsonpath": "$.metadata.version"
          }
        ]
      }
    }
  }
  ```

  Note: release-please's `extra-files` with `type: json` and `jsonpath` rewrites the matched field to the new release version (plain SemVer, no `v` prefix; the file gets `"version": "1.1.0"` not `"version": "v1.1.0"`). This matches the design's Gate G1 disposition (no per-skill prefix to strip; plain SemVer in the marketplace catalog field) recorded in AC-58-5.

- 21.7 Verify the `extra-files` configuration with a release-please dry-run:

  ```sh
  npx -y release-please@16 release-pr --dry-run \
    --token "$(gh auth token)" \
    --repo-url=https://github.com/patinaproject/skills \
    --config-file release-please-config.json \
    --manifest-file .release-please-manifest.json 2>&1 | head -80
  ```

  Confirm the dry-run output references `.claude-plugin/marketplace.json` as a file release-please would rewrite. If the dry-run rejects the `extra-files` shape (e.g. because `jsonpath` is not supported by release-please@16 for `type: json`), halt and consult the design — AC-58-5 specifies "the `extra-files` block does a single-field rewrite; no regex stripping needed." If release-please@16 requires a different shape (e.g. an array of paths, or a custom rewriter), document the actual shape in W21.6 and adjust. The release-please docs at design time confirm `extra-files` supports `type: json` with `jsonpath`; if the runtime behavior diverges, that is a real blocker.

- 21.8 Commit with: `feat: #58 reintroduce mattpocock-style marketplace catalog`. Single commit covering 21.1–21.7. Conventional commit format; issue-tag rule satisfied.

**Files touched in W21:** `.claude-plugin/marketplace.json` (new file), `.claude-plugin/plugin.json` (new file), `scripts/verify-marketplace.sh` (new file), `.github/workflows/verify.yml` (extended), `release-please-config.json` (extended with `extra-files`).

**Verification:**

- `bash scripts/verify-marketplace.sh` exits 0 against the post-W21 tree.
- `actionlint .github/workflows/verify.yml` exits 0.
- All AC-58-2 falsifiable checks pass:
  - `find . -path ./node_modules -prune -o -name 'marketplace*.json' -print` returns exactly `./.claude-plugin/marketplace.json`.
  - `jq -r '.name, .plugins[0].name' .claude-plugin/marketplace.json` returns `patinaproject-skills` twice.
  - `jq -r '.name' .claude-plugin/plugin.json` returns `patinaproject-skills`.
  - `jq -r '.plugins[0].source' .claude-plugin/marketplace.json` returns `./`.
  - `jq -r '.skills[]' .claude-plugin/plugin.json | sort` matches the five canonical paths.
- `bash scripts/verify-dogfood.sh` exits 0 with condition 5 now passing (it was a soft skip-warning in W20).
- Release-please dry-run (W21.7) succeeds and references `.claude-plugin/marketplace.json` in its output.

**Definition of done:** Catalog files exist with the design's binding shape; sanity script wired into CI; release-please `extra-files` configured to bump `metadata.version` on each release; conventional commit landed.

**Risks/rollback:** If the release-please dry-run rejects the `extra-files` shape, halt — this is the only design-level blocker for W21. Rollback: revert the commit; the two catalog files and the verify-marketplace script disappear; release-please-config returns to the W15 shape. No cross-workstream dependency unless W23 has already documented the host-native install path; if so, chain-rollback W23 alongside.

### Workstream 22 — Per-skill `README.md` imports (mattpocock pattern, AC-58-9) (AC-58-6, AC-58-8, AC-58-9)

**Goal:** Import `README.md` byte-for-byte from upstream tagged releases into each of the three ex-plugin skill directories (`skills/engineering/scaffold-repository/README.md` ← `patinaproject/bootstrap@v1.10.0/README.md`; `skills/engineering/superteam/README.md` ← `patinaproject/superteam@v1.5.0/README.md`; `skills/engineering/using-github/README.md` ← `patinaproject/using-github@v2.0.0/README.md`). Apply three categories of mechanical edit per imported file (title rename, install-block reframe, `Source:` line addition) per design AC-58-9. Do not import a README for the two standalone skills (matching mattpocock's pattern for per-skill folders without imported README content).

**Order rationale:** W22 depends on W20 (the destination directories must be at their category-prefixed paths). Independent of W21 (the catalog) and W23 (the root README). Sequenced after W21 in the dependency graph for review-clarity reasons — the catalog is the smaller change, the README imports are the larger one — but can run in parallel with W21 once W20 lands.

**Tasks:**

- 22.1 Verify upstream README accessibility (one-time precheck):
  - `gh api 'repos/patinaproject/bootstrap/contents/README.md?ref=v1.10.0' --jq '.size'` returns a positive integer (design-time verified: 11272 bytes).
  - `gh api 'repos/patinaproject/superteam/contents/README.md?ref=v1.5.0' --jq '.size'` returns a positive integer (design-time verified: 10987 bytes).
  - `gh api 'repos/patinaproject/using-github/contents/README.md?ref=v2.0.0' --jq '.size'` returns a positive integer (design-time verified: 7177 bytes).
  - If any of the three is no longer reachable (the upstream repos are archived but their tags should remain), halt and report — this is a real blocker for W22.

- 22.2 Import `skills/engineering/scaffold-repository/README.md`:

  ```sh
  gh api 'repos/patinaproject/bootstrap/contents/README.md?ref=v1.10.0' \
    --jq '.content' | base64 -d > skills/engineering/scaffold-repository/README.md
  ```

  Verify the imported file is non-empty (`test -s skills/engineering/scaffold-repository/README.md`) and is valid UTF-8 (`file skills/engineering/scaffold-repository/README.md` reports "UTF-8 Unicode text" or similar).

- 22.3 Apply the three mechanical edits to `skills/engineering/scaffold-repository/README.md`:
  - **(a) Title rename.** The upstream H1 is `# Bootstrap` (or close to it; verify with `head -3 skills/engineering/scaffold-repository/README.md`). Rewrite to `# scaffold-repository` (lowercase, matching the skill's frontmatter `name:` — the design AC-58-9 specifies lowercase per the upstream-rename established in delta 0).
  - **(b) Install-block reframe.** Locate any install block in the upstream content. Likely patterns to strip: `/plugin marketplace add patinaproject/bootstrap`, `/plugin install bootstrap@patinaproject-bootstrap`, any `npx skills add patinaproject/bootstrap@bootstrap` example. Replace the whole install section with a short pointer:

    ```markdown
    ## Install

    See [the root README](../../../README.md) for install instructions.
    ```

    The `../../../README.md` relative path resolves from `skills/engineering/scaffold-repository/README.md` up three segments to the repo root, then to the root `README.md`. Confirm with `realpath skills/engineering/scaffold-repository/../../../README.md` after W23 lands; for now the link target is a forward reference to W23's deliverable.
  - **(c) `Source:` line.** Immediately below the H1 (line 2 or line 3, depending on whether there is a leading blank line), insert:

    ```markdown
    Source: imported from [patinaproject/bootstrap@v1.10.0](https://github.com/patinaproject/bootstrap/tree/v1.10.0)
    ```

    The link target is the upstream's tag tree URL; the visible text is the human-readable provenance.

- 22.4 Repeat the import + three-category edit for `skills/engineering/superteam/README.md`:
  - `gh api 'repos/patinaproject/superteam/contents/README.md?ref=v1.5.0' --jq '.content' | base64 -d > skills/engineering/superteam/README.md`
  - (a) Title rename: `# Superteam` → `# superteam` (lowercase).
  - (b) Install-block reframe: replace any install section with the pointer to `../../../README.md`.
  - (c) `Source:` line: `Source: imported from [patinaproject/superteam@v1.5.0](https://github.com/patinaproject/superteam/tree/v1.5.0)`.

- 22.5 Repeat the import + three-category edit for `skills/engineering/using-github/README.md`:
  - `gh api 'repos/patinaproject/using-github/contents/README.md?ref=v2.0.0' --jq '.content' | base64 -d > skills/engineering/using-github/README.md`
  - (a) Title rename: the upstream is already `# using-github` (lowercase) per the design's note in AC-58-9 — verify and skip the rename if already lowercase.
  - (b) Install-block reframe: replace any install section with the pointer to `../../../README.md`.
  - (c) `Source:` line: `Source: imported from [patinaproject/using-github@v2.0.0](https://github.com/patinaproject/using-github/tree/v2.0.0)`.

- 22.6 **Internal-link triage within the three imported READMEs.** Each upstream README may contain links to its own repo's files (`./SKILL.md`, `./templates/`, `./.github/`, etc.). The post-import locations of these targets:
  - Links to `SKILL.md` resolve relative to the README's directory — `skills/engineering/<name>/SKILL.md` — which is the same depth as the upstream had (`<upstream-repo>/SKILL.md`). These links survive verbatim.
  - Links to upstream-only assets (e.g. links to GitHub Actions in the upstream repo) should remain pointing at the upstream URL via absolute URL; they are not local-repo references. The `Source:` line provides the context.
  - Links to in-repo files that **don't** exist in this consolidated repo (e.g. references to scripts the upstream had but we deleted in delta 4) should be rewritten to the upstream's GitHub URL or removed if the reference is purely historical.
  - Triage via `rg -F '](.\)' skills/engineering/<name>/README.md` for each imported README; decide per match. Do not blast-rewrite.

- 22.7 **Do NOT create READMEs for the two standalone skills.** Confirm `skills/productivity/office-hours/README.md` and `skills/productivity/find-skills/README.md` do NOT exist. Per AC-58-9 falsifiable check (e): `test ! -f skills/productivity/office-hours/README.md && test ! -f skills/productivity/find-skills/README.md` exits 0.

- 22.8 `pnpm lint:md` runs against the three new READMEs and passes. If markdownlint flags rules the upstream content violates (long lines, missing blank lines around code fences, etc.), record the failing rules and either (a) suppress the rule for the imported file via `<!-- markdownlint-disable RULE -->` blocks at the top (preserves byte-for-byte-as-much-as-possible while accommodating local lint config), or (b) update `.markdownlint.json` / `.markdownlintignore` for the new paths if the lint config legitimately should not enforce those rules on imported content. Document the chosen approach in the commit body.

- 22.9 Commit with: `docs: #58 import per-skill READMEs from upstream tags`. Single commit covering 22.1–22.8. Conventional commit format; issue-tag rule satisfied.

**Files touched in W22:** `skills/engineering/scaffold-repository/README.md` (new file), `skills/engineering/superteam/README.md` (new file), `skills/engineering/using-github/README.md` (new file), possibly `.markdownlint.json` or `.markdownlintignore` (only if 22.8 surfaces lint adjustments).

**Verification:**

- All three `README.md` files exist at their canonical homes (AC-58-9 falsifiable check (d)).
- Each H1 starts with the lowercase skill name (`# scaffold-repository`, `# superteam`, `# using-github`).
- Each has a `Source:` line referencing the correct upstream tag (regex `patinaproject/(bootstrap|superteam|using-github).*v(1\.10\.0|1\.5\.0|2\.0\.0)`).
- Each install section points back to `../../../README.md` rather than referencing a deleted marketplace install path. `rg -F '/plugin marketplace add' skills/engineering/*/README.md` returns empty (any marketplace-install-block remnants from the upstream READMEs have been stripped).
- `test ! -f skills/productivity/office-hours/README.md && test ! -f skills/productivity/find-skills/README.md` exits 0 (AC-58-9 falsifiable check (e)).
- `pnpm lint:md` exits 0.

**Definition of done:** Three READMEs imported byte-for-byte modulo the three categories of mechanical edit; standalone skills have no README; markdownlint clean; conventional commit landed.

**Risks/rollback:** If an upstream README is unreachable (W22.1's precheck fails), halt and report — this is a real blocker. If the markdownlint config requires changes that pull in significant rule changes, prefer the per-file disable-block approach (22.8 option (a)) to keep `.markdownlint.json` focused. Rollback: revert the commit; the three READMEs disappear. No cross-workstream dependency unless W23 has already linked to them; if W23 already landed, chain-rollback W23 alongside.

### Workstream 23 — Root `README.md` rewrite in mattpocock format (AC-58-4, AC-58-6, AC-58-9)

**Goal:** Replace the delta-4 root `README.md` (which documented only the vercel-labs CLI install path against the flat layout) with a mattpocock-format rewrite that documents both install paths (CLI + host-native marketplace), introduces a "Why these skills exist" narrative section, and links the five skills via a no-version table to their canonical-home folders or `SKILL.md` files.

**Order rationale:** W23 depends on W20 (for the category-prefixed paths in the skills table), W21 (for the host-native install path the README documents), and W22 (the per-skill READMEs the table links to). Sequenced last among the per-workstream commits in delta 6 because it references every prior shape.

**Tasks:**

- 23.1 Rewrite `README.md` end-to-end in mattpocock format. The exact sections (per AC-58-9):
  - **Title (H1):** `# Skills used by the Patina Project team` (Patina-equivalent of mattpocock's "Skills For Real Engineers"; the design notes "or a verbally equivalent phrasing the operator approves" — Executor uses the design's recommended phrasing).
  - **Optional skills.sh badge** (line 2): include `[![skills.sh](https://skills.sh/b/patinaproject/skills)](https://skills.sh/patinaproject/skills)` if the badge endpoint resolves at execution time (`curl -sI https://skills.sh/b/patinaproject/skills` returns HTTP 200 or a redirect); otherwise omit and record the decision in the commit body.
  - **One-paragraph tagline:** one or two sentences framing the repo as a curated set used in practice by the Patina Project team, not a generic marketplace.
  - **`## Quickstart` section** documenting both install paths:
    - **Primary** (vercel-labs CLI, per-skill granular):

      ```sh
      npm_config_ignore_scripts=true npx skills@1.5.6 \
        add patinaproject/skills@<name> --agent <agent> -y
      ```

      For Claude Code use `--agent claude-code`; for Codex use `--agent codex`. List the five skill names (`scaffold-repository`, `superteam`, `using-github`, `office-hours`, `find-skills`) so a user can copy-paste any of them. Footnote the `@1.5.6` pin with a one-line rationale: "we pin the CLI version at the invocation site for supply-chain reasons; see [docs/release-flow.md](docs/release-flow.md)."

    - **Secondary** (Claude Code host-native marketplace, all-five-skills install):

      ```text
      /plugin marketplace add patinaproject/skills
      /plugin install patinaproject-skills@patinaproject-skills
      ```

      Note that this path installs all five skills as one plugin (`patinaproject-skills`); users who want per-skill granular install use the primary path. Codex has no equivalent host-native path for this catalog; Codex users always use the primary CLI path.

  - **`## Why these skills exist` section.** A one-paragraph problem-narrative per skill, mirroring mattpocock's "Why These Skills Exist" structure. For each of the five skills, lift the narrative from either the upstream README's intro paragraph (for the three ex-plugin skills) or the SKILL.md's `description:` frontmatter field (for the two standalones). Each paragraph is one to three sentences; the section is not exhaustive — it answers "why this skill exists" not "how this skill works."
  - **`## Skills` table.** A markdown table with columns `Skill`, `Description`, `Category`. **No version column** (release-please publishes one tag per repo per AC-58-5; per-skill versions are not meaningful). The five rows in the order the design specifies (engineering/ first, then productivity/), each linking via the first cell:
    - `[scaffold-repository](skills/engineering/scaffold-repository/)` (folder link — falls through to the imported README via GitHub's auto-render)
    - `[superteam](skills/engineering/superteam/)` (folder link)
    - `[using-github](skills/engineering/using-github/)` (folder link)
    - `[office-hours](skills/productivity/office-hours/SKILL.md)` (direct `SKILL.md` link — no README at this leaf)
    - `[find-skills](skills/productivity/find-skills/SKILL.md)` (direct `SKILL.md` link — no README at this leaf)
  - **`## License` / `## Contributing` / Patina Project org link** at the bottom. Keep these short; the canonical references live in `AGENTS.md` and the linked Patina Project org page (`https://github.com/patinaproject`).
  - **Omissions** (deliberate, per AC-58-9):
    - No newsletter signup (we don't have one).
    - No logo/banner (no Patina branding asset prepared for this delta).

  Length target: 100–200 lines (mattpocock's HEAD README is ~155 lines; the design notes this as the model).

- 23.2 Verify the rewritten README passes the AC-58-9 falsifiable checks:
  - (a) H1 reads `# Skills used by the Patina Project team` (or a verbally equivalent phrasing if the operator amends at Gate 2 — design recommends the verbatim form).
  - (b) Contains a section heading `## Why these skills exist` (case-insensitive) and a section heading `## Quickstart` (or `## Quick start`).
  - (c) Skills table has exactly five rows, each row's first cell linking via Markdown to the correct folder/file per the design — folder link for the three ex-plugin skills, `SKILL.md` direct link for the two standalones; **no** column carrying a version string.

- 23.3 Verify the rewritten README passes the AC-58-4 falsifiable checks:
  - Both install paths are documented in the Quickstart section.
  - The primary path's command line pins `skills@1.5.6` (regex `skills@1\.5\.6` matches at least once in the README body).
  - The secondary path's commands reference `patinaproject/skills` and `patinaproject-skills@patinaproject-skills`.

- 23.4 `pnpm lint:md` runs against the rewritten README and passes. The README is authored fresh (not byte-for-byte from upstream), so it must satisfy local markdownlint rules without requiring per-file disable blocks.

- 23.5 Commit with: `docs: #58 rewrite root README in mattpocock format`. Single commit covering 23.1–23.4. Conventional commit format; issue-tag rule satisfied.

**Files touched in W23:** `README.md` (rewritten end-to-end).

**Verification:**

- AC-58-9 falsifiable checks (a), (b), (c) all pass.
- AC-58-4 install-path falsifiable checks pass (both paths documented; CLI version pinned at `1.5.6`; host-native command sequence matches `/plugin marketplace add patinaproject/skills` then `/plugin install patinaproject-skills@patinaproject-skills`).
- `pnpm lint:md` exits 0.
- README length is in the 100–200 line target range (`wc -l README.md` reports a value in `[100, 200]`).

**Definition of done:** Root README rewritten in mattpocock format with two install paths and a no-version skills table; markdownlint clean; conventional commit landed.

**Risks/rollback:** If markdownlint flags rules the rewritten content violates, fix the README content (do not add per-file disable blocks for an authored-fresh file). Rollback: revert the commit; the delta-4 README is restored.

### Workstream 24 — Documentation sweep for category layout + plugin name + both install paths (AC-58-1, AC-58-2, AC-58-4, AC-58-6, AC-58-8)

**Goal:** Update `AGENTS.md`, `docs/release-flow.md`, `docs/file-structure.md`, `docs/wiki-index.md`, and `.github/workflows/markdown.yml` for the delta-6 state. Specifically: category-prefixed paths everywhere; the re-introduced host-native install path; the plugin slug `patinaproject-skills`; the delta-6 entry in `docs/file-structure.md`'s migration history.

**Order rationale:** W24 depends on W20–W23 because every doc surface it touches references one of those workstreams' final shapes. Sequenced after the per-workstream content commits so each prior commit reviews cleanly in isolation; W24 then sweeps the docs in one coherent pass.

**Tasks:**

- 24.1 Update `AGENTS.md`:
  - Add or update the "Plugin Releases" / "Skill Releases" section to mention the plugin slug `patinaproject-skills` and the host-native install path that was lost in delta 4 and restored in delta 6.
  - Update the "source-of-truth boundary" line. Current delta-4 form reads "This repo's `skills/<name>/` owns each skill...". Delta-6 form: "This repo's `skills/<category>/<name>/` owns each skill for `name ∈ {scaffold-repository, superteam, using-github, office-hours, find-skills}` with `category ∈ {engineering, productivity}` per AC-58-1."
  - Update or add a "Plugin slug" subsection: the marketplace catalog at `.claude-plugin/marketplace.json` declares one plugin named `patinaproject-skills` whose source is the repo itself (`./`). The same slug appears in `.claude-plugin/plugin.json`.
  - Preserve every GitHub Actions pinning rule, the issue-tag rule, the commitlint rule, the labels rule, the `.github/` templates rule, the testing-guidelines rule. None of these change in delta 6.

- 24.2 Update `docs/release-flow.md`:
  - Document the `extra-files` block added in W21.6: each release rewrites `metadata.version` in `.claude-plugin/marketplace.json` so host-native install consumers see the same version the Git tag advertises.
  - Document the two install paths (both already covered in W23's README rewrite; cross-reference rather than duplicate).
  - Update the scaffold-apply trigger description: the script's input path is now `skills/engineering/scaffold-repository` (delta-6 category subdir), not `skills/scaffold-repository` (delta 4).
  - Confirm the "auto-merge" and "RELEASE_PLEASE_TOKEN" sections survive intact from the prior revision (commit `6d945df`).

- 24.3 Update `docs/file-structure.md`:
  - Replace the delta-4 flat-layout diagram with the delta-6 category-organized diagram (mirroring the "Proposed file layout" block from the design spec).
  - Add a `## Migration history` entry recording delta 6:

    ```markdown
    ### Delta 6 (mattpocock structure)

    - 2026-05-12 — Categorize: `git mv skills/<name> skills/<category>/<name>` for all five skills.
    - 2026-05-12 — Reintroduce mattpocock-style Claude Code marketplace catalog at `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` (partial reversal of delta 4's catalog deletion, Claude side only).
    - 2026-05-12 — Import per-skill READMEs byte-for-byte from upstream tags: `bootstrap@v1.10.0` → `skills/engineering/scaffold-repository/README.md`; `superteam@v1.5.0` → `skills/engineering/superteam/README.md`; `using-github@v2.0.0` → `skills/engineering/using-github/README.md`. Three categories of mechanical edit per file: title rename, install-block reframe, `Source:` line.
    - 2026-05-12 — Rewrite root `README.md` in mattpocock format with both install paths and a no-version skills table.
    ```

    The exact commit SHAs land at execution time (Executor records them after the W20–W23 commits land).
  - Preserve every prior migration history entry (delta 1 subtree imports, delta 0 rename, delta 4 flatten, delta 5 single-version release-please). Per-file blame survives the four-step `git mv` chain (subtree → rename → flatten → categorize) for all five skills.

- 24.4 Update `docs/wiki-index.md`:
  - Update path references from `skills/<name>/SKILL.md` (delta 4) to `skills/<category>/<name>/SKILL.md` (delta 6) throughout.
  - Document the wiki-scope reduction (per AC-58-6): per-skill walkthroughs that were planned to live on the wiki are now imported in-repo as per-skill READMEs; the wiki keeps only the longer-form troubleshooting, the CLI version-pinning rationale, the Cowork install walkthroughs, and the end-to-end superteam narrative. The wiki entries for the three ex-plugin skills are replaced by "moved to in-repo README" lines.
  - Standalone skills (`office-hours`, `find-skills`) have no per-skill README; their wiki entries are dropped entirely in favor of `SKILL.md` being self-contained.

- 24.5 Update `.github/workflows/markdown.yml`:
  - Review the glob excludes patterns (`!plugins/*/.husky`, `!plugins/*/node_modules`, etc., from commit `2291f02`). Most of those patterns referenced the deleted `plugins/` tree from delta 4; they should already be cleaned up but verify with `rg -F 'plugins/' .github/workflows/markdown.yml`.
  - Add patterns for the new `.claude-plugin/` directory if markdownlint should not scan its JSON files (it shouldn't — JSON is not markdown).
  - Verify with `actionlint .github/workflows/markdown.yml` — exits 0.

- 24.6 Spot-check the rest of the docs surface for stale references:
  - `rg -F 'skills/scaffold-repository' README.md AGENTS.md CLAUDE.md docs/` should return empty (or only match historical migration-history rows, which is intended).
  - `rg -F 'skills/superteam[^/]' README.md AGENTS.md docs/` (the trailing `[^/]` excludes `skills/superteam/` references) — same expectation.
  - `rg -F '/plugin marketplace add' README.md AGENTS.md docs/` — should return matches in `README.md` (W23's Quickstart) and possibly `docs/release-flow.md`, but **not** in `AGENTS.md` (where the marketplace catalog is described structurally, not as an end-user install path).

- 24.7 Commit with: `docs: #58 sweep docs for mattpocock structure and dual install paths`. Single commit covering 24.1–24.6. Conventional commit format; issue-tag rule satisfied.

**Files touched in W24:** `AGENTS.md`, `docs/release-flow.md`, `docs/file-structure.md`, `docs/wiki-index.md`, `.github/workflows/markdown.yml`.

**Verification:**

- `pnpm lint:md` passes against the rewritten docs.
- `actionlint .github/workflows/markdown.yml` passes.
- `rg -F 'skills/scaffold-repository' README.md AGENTS.md docs/release-flow.md docs/file-structure.md docs/wiki-index.md` returns empty (or only matches the migration-history rows in `docs/file-structure.md`).
- The migration-history section in `docs/file-structure.md` includes the delta-6 entry with all four bullets (categorize, catalog reintroduction, README imports, root README rewrite).

**Definition of done:** Docs sweep covers all five files; markdownlint and actionlint clean; conventional commit landed.

**Risks/rollback:** Docs drift is a soft failure (CI lint catches it). Rollback: revert the commit; prior versions of these docs remain on `main` history. No cross-workstream dependency.

### Workstream 25 — Final verification pass (cross-AC verification + final commit)

**Goal:** Run the canonical pre-publish verification suite against the post-W20–W24 tree, with delta-6 additions (marketplace JSON shape, README provenance lines, root README headings). Record evidence for each AC's falsifiable check. Land any incidental fixes surfaced by the verification.

**Order rationale:** W25 depends on every prior workstream (W20–W24). The final commit, if any, is small and documentary (verification log artifact or a fix for a missed edit).

**Tasks:**

- 25.1 `pnpm install` — exits 0; Husky hooks initialized.
- 25.2 `pnpm lint:md` — exits 0; markdownlint clean against the rewritten root README, the three imported per-skill READMEs, and the swept docs.
- 25.3 `actionlint .github/workflows/*.yml` — exits 0; every workflow valid (including the verify.yml extension from W21.5).
- 25.4 `bash scripts/verify-dogfood.sh` — exits 0; AC-58-3 dogfood check passes for all five skills, **including condition 5** (the `plugin.json.skills[]` array matches the canonical-home paths). Condition 5 was a soft skip in W20 (file didn't exist yet); it must be hard-passing at W25.
- 25.5 `bash scripts/verify-marketplace.sh` — exits 0; AC-58-2 falsifiable checks pass.
- 25.6 `node scripts/apply-scaffold-repository.js skills/engineering/scaffold-repository --check` — exits 0; AC-58-3 falsifiable check (a) (scaffold idempotent against current tree).
- 25.7 `pnpm apply:scaffold-repository:check` — same exit-0 expectation via the pnpm alias.
- 25.8 SHA round-trip evidence: `sha256sum skills/engineering/superteam/SKILL.md` equals `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356` (AC-58-7). Confirm `docs/superpowers/plans/.artifacts/sha256-post.txt` records the same value (W20.9 should have already updated this).
- 25.9 AC-58-1 falsifiable checks:
  - `find . -path ./node_modules -prune -o -name plugin.json -print -o -name package.json -print -o -name marketplace.json -print` returns at most three results: the repo-root `package.json`, `./.claude-plugin/plugin.json`, and `./.claude-plugin/marketplace.json` (no rogue plugin manifests anywhere else in the tree).
  - `find skills -mindepth 3 -maxdepth 3 -name SKILL.md | sort` returns exactly the five canonical paths.
  - `git log --follow --format=%H skills/engineering/superteam/SKILL.md | tail -1` resolves to the same commit and blob the pre-flatten path did before the four-step chain.
- 25.10 AC-58-2 falsifiable checks:
  - `find . -path ./node_modules -prune -o -name 'marketplace*.json' -print` returns exactly `./.claude-plugin/marketplace.json`.
  - `jq -r '.name, .plugins[0].name' .claude-plugin/marketplace.json` returns `patinaproject-skills` twice.
  - `jq -r '.name' .claude-plugin/plugin.json` returns `patinaproject-skills`.
  - `jq -r '.plugins[0].source' .claude-plugin/marketplace.json` returns `./`.
  - `jq -r '.skills[]' .claude-plugin/plugin.json | sort` matches the five `./skills/<category>/<name>` paths.
- 25.11 AC-58-4 falsifiable checks:
  - **Primary path.** Documented in `README.md`. Live install verification (`npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y` against this branch) is deferred to post-merge when the tag exists, per delta-4 W19.9's deferred-verification approach. Pre-merge confidence: W20.8's verify-dogfood script confirms each skill's canonical home is reachable with the right frontmatter (which is what the CLI's resolver consults).
  - **Secondary path.** Documented in `README.md`. Live install (`/plugin marketplace add patinaproject/skills`) is a manual smoke test in a Claude Code session against the post-merge tag; recorded in the PR body as a post-merge verification step.
- 25.12 AC-58-5 falsifiable checks:
  - `release-please-config.json` has exactly one key under `packages` and that key is `"."`.
  - `.release-please-manifest.json` has exactly one entry: `".": "1.0.0"`.
  - `find . -name "CHANGELOG.md" -not -path "./node_modules/*" -not -path "./.git/*"` returns at most one path (the repo-root `CHANGELOG.md` once release-please has run, or zero before the first release).
  - Re-run W21.7's release-please dry-run; confirm the proposed tag matches `^v\d+\.\d+\.\d+$` (no component prefix; Gate G1 stays obsolete) and the dry-run output references `.claude-plugin/marketplace.json` as a file release-please would rewrite (W21's `extra-files` wiring is live).
- 25.13 AC-58-9 falsifiable checks:
  - (a) Root `README.md` H1 reads `# Skills used by the Patina Project team`.
  - (b) Root `README.md` contains `## Why these skills exist` and `## Quickstart` (case-insensitive).
  - (c) Root `README.md` skills table has exactly five rows, each row's first cell linking to the correct folder/file per AC-58-9; no version column. `grep -E '^\|.*\|$' README.md | wc -l` should report `>= 6` (header row plus separator row plus five data rows). Manual visual confirmation of link targets.
  - (d) Each of `skills/engineering/{scaffold-repository,superteam,using-github}/README.md` exists, has a `Source:` line referencing the correct upstream tag (regex per design: `patinaproject/(bootstrap|superteam|using-github).*v(1\.10\.0|1\.5\.0|2\.0\.0)`), and starts with the lowercase skill name as H1.
  - (e) `skills/productivity/office-hours/README.md` and `skills/productivity/find-skills/README.md` do **not** exist as separate files.
- 25.14 If any verification step reveals a missed edit (a stray flat-layout reference in a doc, a path mismatch in a script, a markdownlint failure), land the fix as part of this workstream's commit. Examples of edits the Executor may need to land here:
  - Re-running `pnpm install` to refresh `pnpm-lock.yaml` if the package.json script edits in W20.7 perturbed it (no-op in the common case).
  - Adjusting any test or CI step that referenced the delta-4 path `skills/scaffold-repository` (verify CI on `verify.yml` doesn't try to invoke a stale path).
  - Fixing markdownlint complaints surfaced by the imported READMEs that weren't caught in W22.8.
- 25.15 Commit any needed fixes plus the verification-log artifact (Executor records the dry-run output and the falsifiable-check evidence under `docs/superpowers/plans/.artifacts/` or in the PR body) with: `chore: #58 final verification pass for mattpocock structure`. If no fixes are needed, the verification log alone is the commit body (referenced from the PR body).

**Files touched in W25:** Whatever the verification surfaces. In the no-issue case, only verification-log artifacts (Executor's discretion whether to commit them under `docs/superpowers/plans/.artifacts/` or to record output in the PR body).

**Verification:** Itself — the entire workstream is verification. Pass criterion: every command above exits 0 (or the deferred-verification path is documented for AC-58-4's live-install case).

**Definition of done:** All pre-publish checks pass; any incidental fixes committed; PR is ready for Reviewer → Finisher.

**Risks/rollback:** A failure in W25 indicates a missed edit earlier in the chain. Rollback the offending workstream, fix, re-run W25. If a failure is structural (release-please dry-run rejects the `extra-files` shape; AC-58-7 SHA round-trip fails; upstream README import returns garbled bytes), halt and escalate — one of the design's binding assumptions is broken and the operator must redirect.

---

## Workstream dependency graph

### Historical (delta-4 / delta-5, landed)

```text
W12 (flat-mv, deletions, SHA round-trip) ─┬─> W13 (overlay symlinks + .gitignore) ─┬─> W14 (verify-dogfood rewrite) ─┐
                                          │                                         │                                  │
                                          ├─> W17 (apply-scaffold path updates) ────┤                                  │
                                          │                                         │                                  │
                                          └─> W15 (release-please simple) ──────────┤                                  ├─> W19 (final verify)
                                                                                    │                                  │
            W16 (verify.yml rename) ──────────────────────────────────────────────  │                                  │
                                                                                    │                                  │
            W18 (docs sweep) ───────────────────────────────────────────────────────┘
```

### Active (delta 6, to land)

```text
W20 (categorize git-mv chain + symlink retarget + script paths + SHA round-trip)
  ├─> W21 (.claude-plugin/ catalog + verify-marketplace.sh + release-please extra-files)
  ├─> W22 (per-skill README imports for the 3 ex-plugin skills + 3 categories of edit each)
  └─> W23 (root README rewrite in mattpocock format)
      └─> W24 (docs sweep for category paths + plugin name + host-native install)
          └─> W25 (final verification: dogfood + marketplace + release-please dry-run + AC-58-9 checks)
              └─> Reviewer → Finisher
```

W21, W22, W23 can proceed in parallel once W20 lands; the dependency graph sequences W23 after W22 for review-clarity reasons (W23's skills table links to the W22 READMEs) but the commits can land in either order without breaking anything. W24 sweeps last among per-workstream commits because it references every prior shape. W25 is the cross-cutting verification.

## AC traceability

The full traceability table maps every AC (including the new AC-58-9 introduced in delta 6) to its workstreams across both the historical and active phases:

| AC | Delta-4 / delta-5 workstreams (historical, landed) | Delta-6 workstreams (active, to land) |
| --- | --- | --- |
| AC-58-1 | W12.1–W12.6 (flat `skills/<name>/`, plugin wrappers + marketplace catalog + per-plugin `package.json` deleted) | W20.1–W20.5 (`git mv skills/<name> skills/<category>/<name>` chain); W20.9 (SHA round-trip extended to four-step chain) |
| AC-58-2 | W12.6 (marketplace catalog + validator deletion) | W21.1, W21.2 (`.claude-plugin/marketplace.json` + `plugin.json` re-introduced in mattpocock shape); W21.4 (verify-marketplace.sh) |
| AC-58-3 | W13 (overlay symlinks) + W14 (verify-dogfood rewrite); check (a) ATDD live-install is W18 README + W19.9 | W20.6 (overlay symlink retarget to category paths); W20.8 (verify-dogfood.sh extended for category layout + design-deferred condition 5); W25.4 (final verification) |
| AC-58-4 | W18.1 (README rewrite — `npx skills` only, no marketplace fallback) | W23 (root README rewrite documents both install paths); W21.3 (verify-marketplace.sh confirms the catalog the secondary path references); W25.11 (live-install deferred to post-merge with documented pre-merge proxy) |
| AC-58-5 | W15 (single-root release-please `release-type: simple`, `v<X.Y.Z>` tags, seed `1.0.0`); W19.10 (dry-run) | W21.6 (release-please `extra-files` block to rewrite `metadata.version` in `.claude-plugin/marketplace.json`); W20.7 (scaffold-apply input path updated to `skills/engineering/scaffold-repository`); W25.12 (dry-run confirms `^v\d+\.\d+\.\d+$` tag and `extra-files` wiring is live) |
| AC-58-6 | W18.5 (`docs/file-structure.md` rewrite) + W18.6 (`docs/wiki-index.md` rewrite); wiki publication post-merge | W22 (per-skill READMEs reduce wiki scope); W24.3 (`docs/file-structure.md` updated with delta-6 migration history); W24.4 (`docs/wiki-index.md` updated for category paths and "moved to in-repo README" entries) |
| AC-58-7 | W12.7 (SHA-256 round-trip; pre-flatten value `87867b66...` must equal post-flatten value) | W20.9 (SHA round-trip extended to the four-step chain — subtree → rename → flatten → categorize; the same digest survives all three `git mv` steps) |
| AC-58-8 | W12.1–W12.5 (`git mv` chain preserves blame and SHA) + W18.5 (migration history entry under `docs/file-structure.md`) | W20.1–W20.5 (the four-step chain culminates here); W22 (per-skill READMEs imported as new file creation, not as `git mv` — their git history starts at the import commit); W24.3 (delta-6 entry in migration history) |
| **AC-58-9 (new in delta 6)** | (n/a — AC-58-9 does not exist pre-delta-6) | W22 (per-skill READMEs imported byte-for-byte with three categories of mechanical edit each); W23 (root README rewritten in mattpocock format with both install paths and a no-version skills table); W25.13 (falsifiable checks (a)–(e)) |

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

## Risks and blockers (delta 6 — active workstreams)

- **Upstream README accessibility for W22.** Three READMEs are imported byte-for-byte from `patinaproject/bootstrap@v1.10.0`, `patinaproject/superteam@v1.5.0`, and `patinaproject/using-github@v2.0.0`. Design-time verification confirms all three are reachable via `gh api` (`11272`, `10987`, `7177` bytes respectively). If any upstream tag has been deleted or repointed by execution time, W22.1 halts and reports. Mitigation: the upstream repos are archived but tags are immutable on GitHub; the only realistic failure mode is repo deletion, which is operator-recoverable.
- **Release-please `extra-files` shape compatibility.** W21.6's `extra-files` block uses `type: json` with `jsonpath: $.metadata.version`. The design (AC-58-5) records this as a "single-field rewrite; no regex stripping needed" against release-please-action v16. If the runtime release-please version doesn't accept `jsonpath`, W21.7's dry-run rejects the config. Mitigation: release-please's `extra-files` documentation at design time confirms `type: json` + `jsonpath` is supported; the fallback (if needed) is a `type: generic` rewriter with a regex, which is more brittle but still works. Halt and escalate if neither shape applies.
- **Overlay symlink retarget portability on Windows.** W20.6 retargets ten symlinks. The relative-path form `../../skills/<category>/<name>` is two ascents — same as the delta-4 form `../../skills/<name>`. Windows clones need `git config core.symlinks true` (admin shell required, or fall back to WSL). This is the same constraint as delta 4; no new risk from delta 6.
- **SHA round-trip across the four-step chain.** W20.9's AC-58-7 check is the writing-skills GREEN gate, extended from delta 4's three-step chain to delta 6's four-step chain. Each `git mv` is index-only, so the digest survives. The risk is an editor invocation between any pair of `git mv`s — particularly between W20.2 (the superteam mv) and W20.10 (the internal-link sweep). Mitigation: W20.2 is a pure `git mv` with no follow-on edits; the link sweep at W20.10 operates on the other two skills' files (scaffold-repository and using-github), not superteam.
- **Markdownlint vs. upstream README content (W22.8).** The three imported READMEs originate from independently-linted upstream repos. Their lint configs may differ from this repo's. If significant local-rule violations surface, the executor's chosen mitigation (per-file disable blocks vs. `.markdownlint.json` edits) affects the imported-content fidelity. Mitigation: prefer per-file disable blocks (option (a) in W22.8) to preserve byte-for-byte intent without expanding the local lint-rule surface.
- **README link target validity from per-skill READMEs to root README.** Each per-skill README's install pointer (`See [the root README](../../../README.md) for install instructions`) uses three-segment upward path resolution. Verify post-W23 with `realpath skills/engineering/scaffold-repository/../../../README.md` resolves to the repo-root README's absolute path.
- **Plugin slug consistency.** The slug `patinaproject-skills` appears in `marketplace.json` (top-level `name`, `plugins[0].name`), `plugin.json` (`name`), and the secondary install command (`/plugin install patinaproject-skills@patinaproject-skills`). All five mentions must agree. Mitigation: `scripts/verify-marketplace.sh` enforces the JSON-side invariants programmatically; the README references are reviewed by the Reviewer agent against AC-58-4's falsifiable check.
- **`.claude-plugin/plugin.json` skills array path form.** W21.2 specifies `"./skills/engineering/scaffold-repository"` with a leading `./`, no trailing slash, no `SKILL.md` suffix. Claude Code's plugin loader interprets these as directory paths (per the plugin-structure skill's reference); a mistakenly-included `SKILL.md` suffix or trailing slash would silently break discovery. Mitigation: `scripts/verify-marketplace.sh` regex-checks each entry against `^\./skills/(engineering|productivity)/[a-z-]+$`.

## Risks and blockers (delta 4 — historical, already mitigated)

- **Release-please `release-type: simple` tag-shape assumption.** The plan assumes the four config knobs (`tag-separator: "-v"` + `include-component-in-tag: true` + `include-v-in-tag: true` + `component: "<name>"`) produce `<component>-v<X.Y.Z>` tags. If release-please version 16 (or whichever version the workflow pins) emits a different shape, halt at W15.4 and report — the design's Gate G1 disposition (consumers pass the full prefixed tag) depends on this exact shape.
- **SHA-256 round-trip integrity.** W12.7's check is the AC-58-7 GREEN gate. If any editor touched `skills/superteam/SKILL.md` between the `git mv` and the post-flatten SHA check, the round-trip fails and the writing-skills baseline is broken. Mitigation: W12.2 is a pure `git mv` with no follow-on edits; W12.8's internal-link sweep operates on the other two skills' files.
- **Dogfood symlink portability on Windows.** Committed symlinks require `git config core.symlinks true` on Windows clones. POSIX hosts handle this transparently. Documented in `docs/file-structure.md` (W18.5).
- **Vercel-labs CLI supply chain.** With the marketplace-add fallback removed (AC-58-2), the npm-distributed CLI is the only documented install path. Mitigations: pin the CLI version at invocation (`skills@1.5.6`); document `npm_config_ignore_scripts=true` as the default; document the clone-and-copy fallback in `README.md` (W18.1).
- **CI check-name drift after `verify-iteration.yml` → `verify.yml` rename.** Branch-protection rules pinned to the old check name may flag the new check as unrecognized. Recorded in W16.6 as a post-merge configuration follow-up; not in scope of the PR itself.
- **Third-party skill installs polluting the overlay directories.** The 14 superpowers skills currently sitting untracked become explicitly gitignored after W13.3's allowlist pattern. A future contributor who installs additional third-party skills (e.g. more obra/superpowers entries) sees the CLI write to `.claude/skills/<name>/` and `.agents/skills/<name>/`; those become gitignored by the same pattern automatically. The five in-repo overlay symlinks are explicitly tracked via the negated allowlist entries.
- **`skills-lock.json` state.** The working tree shows `M skills-lock.json` — the CLI bumped the lockfile during the most recent superpowers install batch. Executor should stage this lockfile update as part of W13's commit (or as a separate small `chore:` commit) so the committed state matches the CLI's expectations after the dogfood overlays are in place. Confirm via `git diff skills-lock.json` what changed before committing.

## Rollback approach per workstream (delta 6 — active)

- **W20 (categorize chain + symlink retarget + script paths):** revert the single commit. The five `skills/<name>/` directories return, the ten overlay symlinks revert their targets to `../../skills/<name>`, and the script paths revert. Every downstream delta-6 workstream (W21–W25) is broken without W20 in place; their reverts must chain.
- **W21 (`.claude-plugin/` catalog + release-please `extra-files`):** revert the commit. Both `.claude-plugin/` files disappear; `scripts/verify-marketplace.sh` disappears; `release-please-config.json` returns to the W15 shape (no `extra-files`); `.github/workflows/verify.yml` returns to invoking only `verify-dogfood.sh`. The host-native install path documented in W23's README no longer works, so W23 must also revert if W21 reverts.
- **W22 (per-skill READMEs):** revert the commit. The three imported READMEs disappear; `pnpm lint:md` returns to pre-delta-6 markdownlint clean. The root README's table links still resolve to the skill folders (which exist post-W20), so W23 doesn't necessarily need to chain-revert — but the folder-link click-through goes to a directory listing instead of a rendered README.
- **W23 (root README rewrite):** revert the commit. The delta-4 README is restored. If `.claude-plugin/` (W21) is still present, the delta-4 README is incomplete (doesn't document the host-native install path); if `.claude-plugin/` was also reverted, the delta-4 README's vercel-labs-only documentation matches the tree state.
- **W24 (docs sweep):** revert the commit. The delta-5 / delta-4 doc surfaces are restored. May surface lint failures if W20–W23's content shapes are still present (the docs now under-document them); chain-revert with W20 if the lint failures block CI.
- **W25 (final verification):** if W25 is its own commit (verification log artifact), revert removes the artifact. No structural rollback effect.

## Rollback approach per workstream (delta 4 — historical)

- **W12 (flat-mv chain):** revert the single commit. `plugins/`, `.agents/plugins/`, `.claude-plugin/`, the marketplace files, and the validator are all restored. Every downstream workstream (W13–W19) is broken without W12 in place; their reverts must chain.
- **W13 (overlay symlinks + `.gitignore`):** revert the commit. The ten symlinks disappear; `.gitignore` returns to the pre-W13 state. The 14 third-party superpowers skills become untracked again.
- **W14 (verify-dogfood rewrite):** revert restores the prior plugin-scoped/standalone branching script, which then fails because it points at deleted paths. Effective rollback requires reverting W12 first.
- **W15 (release-please simple):** revert restores the `release-type: node` config; release-please then fails on missing `plugins/<name>/package.json` paths. Chain rollback with W12.
- **W16 (verify.yml rename):** revert restores `verify-iteration.yml`. Branch-protection rules return to recognizing the old check name automatically.
- **W17 (apply-scaffold paths):** revert restores the prior path. Script then fails on missing `plugins/scaffold-repository/`. Chain rollback with W12.
- **W18 (docs sweep):** revert restores prior docs. CI lint may complain about path references; manually retrim if needed.
- **W19 (final verification):** if W19 is its own commit (verification log artifact), revert removes the artifact. No structural rollback effect.

## Out of scope (called out so Executor does not gold-plate)

**Delta 6 additions:**

- **Behavioral edits to any imported per-skill README beyond the three categories.** W22 specifies exactly three categories of mechanical edit per file (title rename, install-block reframe, `Source:` line). Content edits beyond those three categories (re-flowing prose, adding sections, removing sections, updating internal references that the original author intentionally included) are out of scope. The imported READMEs preserve upstream content modulo the three categories; behavioral improvements are future issues.
- **Re-introducing a Codex marketplace catalog at `.agents/plugins/`.** AC-58-2 explicitly keeps the Codex catalog deleted; the mattpocock reference is Claude-Code-specific. Codex users install via the vercel-labs CLI with `--agent codex`. Re-introducing a Codex catalog is a separate future issue if the operator decides to.
- **Branding assets for the root README (logo, banner, newsletter signup).** AC-58-9 omissions are deliberate. Adding a Patina logo, banner, or newsletter signup is a separate future issue.
- **A version column in the skills table.** AC-58-9 falsifiable check (c) explicitly forbids a version column. Per-skill versions are not meaningful under the single-version release model.
- **Live `npx skills add` verification against an unmerged branch.** AC-58-4 falsifiable check defers live install verification to post-merge when the tag exists; W25.11 documents this and provides the pre-merge proxy (verify-dogfood + verify-marketplace).
- **JSON schema validation against an external Claude Code marketplace schema.** W21.3 lists this as optional / confidence-builder; if no publicly-cached schema is available at execution time, the script-level invariants in `scripts/verify-marketplace.sh` are the binding validation.

**Delta 4 / delta 5 (historical, still in effect):**

- Behavioral edits to any `SKILL.md`. The `superteam` and `using-github` `SKILL.md` content is byte-equivalent to the upstream tags (preserved across the flatten and categorize by `git mv`). The `scaffold-repository` SKILL.md edits already landed in commit `794e199` (W9 — the rename); no further edits in this delta. The `office-hours` SKILL.md is byte-for-byte from the upstream PR head SHA (port commit `fab5458`); no edits in this delta. Any behavioral edit to any SKILL.md is its own issue with its own AC-IDs.
- Authoring a Patina Project `skills` CLI. Gate G6 closed; vercel-labs CLI adopted.
- Auto-invoking host CLIs from the install command. Gate G4 closed; the vercel-labs CLI handles host detection via `--agent`.
- Wiki publication. Gate G5 stays; the wiki pages are published post-merge as a separate operator action against `patinaproject/skills.wiki`. The in-repo `docs/wiki-index.md` documents the canonical wiki surface.
- Archiving the upstream `patinaproject/bootstrap`, `patinaproject/superteam`, `patinaproject/using-github` repos. Recorded in the design as a post-merge action with a one-release-cycle delay; not in scope of this PR.
- Promoting `office-hours` or `find-skills` to release-please packages. Standalone skills resolve to default-branch HEAD by default; consumers wanting a pinned version pass `#<git-ref>`. Promotion would be a future issue.
- Building a public skills registry beyond what GitHub Releases provide via release-please.
- Updating branch-protection rules for the renamed CI check. Operator-managed post-merge action.

## Done-report mapping

The Finisher references this plan's workstream IDs (`W12`–`W19`) plus the historical IDs (`W1`–`W11`) in the eventual PR body's `Acceptance Criteria` section so each `AC-58-<n>` heading has verification steps anchored to specific tasks. The PR template's section ordering is preserved (per AGENTS.md's `.github/` templates rule).
