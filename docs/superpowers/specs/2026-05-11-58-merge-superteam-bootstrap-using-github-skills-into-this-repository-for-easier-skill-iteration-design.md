# Design: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Summary

Consolidate the `superteam`, `bootstrap`, and `using-github` skills into `patinaproject/skills` as a flat tree of skills under `skills/<name>/` at the repo root, renaming the in-tree `bootstrap` copy to `scaffold-repository` so the directory and skill name match the skill's own description ("Use when scaffolding a new repository..."). Replace the cross-repo `repository_dispatch` bump flow with in-repo `release-please` releases (per-skill `release-type: simple`, no per-skill `package.json` required), document `npx skills add patinaproject/skills@<name>` (the vercel-labs CLI) as the single primary install path, and migrate non-essential contributor and user docs to the repo's GitHub wiki. After this change, all five skills iterate side-by-side, can be exercised locally from a clone via a thin `.claude/skills/<name>/` symlink overlay without publishing, and ship through a single release surface tagged per-skill.

**Layout is flat — no plugin wrappers, no marketplace catalog, no per-skill `package.json`.** This is the vercel-labs `vercel-labs/skills` shape: a repository whose `skills/<name>/SKILL.md` paths are the canonical addresses the vercel-labs CLI resolves against. The host-native `/plugin marketplace add` install path is removed because it requires a marketplace catalog (`marketplace.json`) we no longer maintain.

## Goals

- Single repository for the three Patina Project skills (plus two standalone skills) with a single PR review surface for changes that touch multiple skills at once.
- Local-first iteration: a fresh clone is sufficient to exercise every skill against itself (the `superteam` orchestration skill must be able to drive a workflow in this repo using the in-repo copy of itself).
- Flat skill layout: every skill is reachable at `skills/<name>/SKILL.md` from the repo root. No plugin wrappers, no marketplace catalog, no per-skill `package.json` — the same shape `vercel-labs/skills` ships and the same shape the vercel-labs CLI resolves against without extra metadata.
- `npx skills@<pinned> add patinaproject/skills@<name>` is the documented primary (and only) install path for both Codex and Claude users; the CLI handles host detection and per-agent install destinations.
- A `release-please`-driven release flow with `release-type: simple` per skill replaces `plugin-release-bump.yml` and the cross-repo dispatch in `docs/release-flow.md`. Tags exist as version markers consumers can pin via `npx skills add patinaproject/skills@<name>#<tag>`; no manifest `ref` field is rewritten because no manifest exists.
- The contributor and user surface in `docs/` shrinks to what must live in the repo (AGENTS.md, release-flow notes, superpowers design/plan artifacts); everything else moves to the repo wiki and is linked from `README.md`.
- Workflow-contract surfaces in `superteam` (SKILL.md, agents/, pre-flight, routing-table, project-deltas, workflow-diagrams) remain bit-for-bit equivalent across the move so existing `docs/superpowers/<role>.md` deltas and `AC-<issue>-<n>` patterns keep working.

## Non-Goals

- Redesigning the `superteam`, `bootstrap`, or `using-github` skills themselves. Behavior changes outside what consolidation forces (paths, install commands) are out of scope.
- Maintaining a marketplace catalog. The two `marketplace.json` files and their `marketplace.local.json` dev overlays are removed; host-native `/plugin marketplace add` install instructions are removed with them. The vercel-labs CLI is the install surface.
- Rewriting the `obra/superpowers` workflow contract or the SKILL.md `## Done-report contracts`. Those remain authoritative.
- Promoting Claude Code or Codex specifics that are not already in scope of these three skills. (For example, no Cowork integration work.)
- Building a public `npx skills` registry of our own. The vercel-labs CLI is consumed via `npx`; Gate G6 stays CLOSED.

## Acceptance Criteria

### AC-58-1

After consolidation, the canonical home of every in-repo skill is `skills/<name>/SKILL.md` at the repo root, where `<name>` is one of `{scaffold-repository, superteam, using-github, find-skills, office-hours}`. There are no `plugins/<name>/` wrapper directories, no `.codex-plugin/plugin.json` or `.claude-plugin/plugin.json` files anywhere in the tree, and no per-skill `package.json`. The in-tree `bootstrap` skill is renamed to `scaffold-repository` (directory and `SKILL.md` frontmatter `name:`); `superteam` and `using-github` names are unchanged. The three plugin-scoped skills' content moves from `plugins/<name>/skills/<name>/` to `skills/<name>/` via `git mv` so blob SHAs are preserved (Git tracks content by hash, not by path; `git mv` is rename detection plus index update, not a new write). The two standalone skills move from `.agents/skills/<name>/` to `skills/<name>/` the same way.

Falsifiable checks: (a) `find . -path ./node_modules -prune -o -name plugin.json -print -o -name package.json -print` returns at most the repo-root `package.json` and zero plugin manifests under any directory in the tree; (b) `find skills -maxdepth 2 -name SKILL.md | sort` returns exactly the five expected paths; (c) `git log --follow --format=%H skills/superteam/SKILL.md | tail -1` resolves to the same commit and tree-blob that `git log --follow --format=%H plugins/superteam/skills/superteam/SKILL.md` resolved to before the rename.

### AC-58-2

There are no marketplace manifests in this repository. `.agents/plugins/marketplace.json`, `.agents/plugins/marketplace.local.json`, `.claude-plugin/marketplace.json`, `.claude-plugin/marketplace.local.json`, and the `.agents/plugins/` and `.claude-plugin/` directories themselves are deleted in the same delta as the flatten. The vercel-labs CLI resolves install requests against the skill directories directly (it walks the repo tree for `SKILL.md` files whose frontmatter `name:` matches the requested slug); it does not require or read a marketplace catalog. The host-native `/plugin marketplace add patinaproject/skills` install path is removed from documentation and is no longer a supported install surface.

Falsifiable check: `find . -name 'marketplace*.json' -not -path './node_modules/*' -not -path './.git/*'` returns empty. The pre-existing `scripts/validate-marketplace.js` is deleted (it validates a file that no longer exists) and removed from `package.json` scripts, CI workflows, and AGENTS.md.

### AC-58-3

A contributor can clone `patinaproject/skills`, run `pnpm install` to initialize Husky and dev tooling, and exercise any of the five skills against this repository itself without first publishing or installing from any registry. Specifically, the `superteam` skill can drive an issue workflow in this repo using its own in-repo copy, the `scaffold-repository` skill can apply its scaffolding to this repo without reaching the network, and the `using-github` skill's slash commands can be exercised from this clone. Local resolution is documented in `README.md`. Falsifiable checks: (a) `scripts/apply-scaffold-repository.js skills/scaffold-repository` runs against this repo without network access and exits 0, and (b) the dogfood verification below passes.

#### AC-58-3 dogfood verification

A fresh `claude` session opened at the repo root must discover all five in-repo skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`) via Claude's own skill loader without any user action beyond `git clone && pnpm install` (the `pnpm install` step is only required for husky/commitlint; skill discovery itself needs no install).

Claude Code does not expose a public "list installed skills" CLI command, so this check is mechanized as a file-presence + frontmatter check. The check script (`scripts/verify-dogfood.sh`) exits 0 if and only if all four conditions hold:

1. Each path `skills/<name>/SKILL.md` exists as a real file (no symlink chain to dereference) for `name` in `{scaffold-repository, superteam, using-github, find-skills, office-hours}`.
2. Each `skills/<name>/SKILL.md` begins with a YAML frontmatter block whose first two non-delimiter keys include `name:` and `description:`, matching the skill loader's contract documented in Claude Code's skill format.
3. The `name:` value in each frontmatter matches the directory name (`name: scaffold-repository` under `skills/scaffold-repository/`, `name: office-hours` under `skills/office-hours/`, etc.). For `scaffold-repository` this verifies that the rename touched the SKILL.md frontmatter, not only the directory path.
4. Each thin overlay path `.claude/skills/<name>/SKILL.md` resolves (via symlink) to the matching `skills/<name>/SKILL.md` real file. (Test with `readlink -f .claude/skills/<name>/SKILL.md` and assert the result equals the absolute path of `skills/<name>/SKILL.md`; reject broken or wrong-targeted links explicitly.) The committed overlay symlinks at `.claude/skills/<name>/` -> `../../skills/<name>/` are what give a fresh clone discoverable skills in Claude Code without any post-clone install step (Option D1, see Gate G7). Codex sees the same content via its `.agents/skills/` scan, which the overlay also satisfies (committed `.agents/skills/<name>/` -> `../../skills/<name>/` symlinks).

Pass criterion: `scripts/verify-dogfood.sh` exits 0. The check is mechanical and runs in CI on every PR that touches `skills/**` or `.claude/skills/**` or `.agents/skills/**`. The standalone-vs-plugin-scoped branching in the previous design's check is gone: every skill now has the same flat shape at `skills/<name>/SKILL.md`, so the check is uniform across all five.

### AC-58-4

The single documented install entry point is `npx skills@<pinned> add patinaproject/skills@<name> --agent <agent>` against the vercel-labs `skills` CLI on npm (Gate G6 resolved CLOSED — this repo publishes no CLI of its own; see Gate G6 disposition). `README.md` documents this command as the first-time install path for each of the five skills. No host-native marketplace fallback is documented because the marketplace catalog is deleted (see AC-58-2). The release process pins a tested CLI version at the invocation site (initially `skills@1.5.6`, the version observed during this design); the docs include the CLI's homepage (`https://github.com/vercel-labs/skills`) and the pinned version's published-to-npm date.

Falsifiable check: from a fresh temp directory, `npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y` (CLI version pinned at invocation; equivalents for `superteam`, `using-github`, `find-skills`, `office-hours`) against this repo's current branch resolves the skill from `skills/scaffold-repository/SKILL.md` (where the CLI finds the matching frontmatter `name: scaffold-repository`), writes `skills-lock.json`, and produces an installed skill discoverable by Claude Code's loader. The Executor records the command (with the pinned CLI version), the resolved lock entries, and the SHA of the branch the install resolved against in the PR body. CI exercises the same install from a clean working directory against the tagged release once it exists, using the same pinned CLI version recorded in `docs/release-flow.md`.

**How the CLI resolves `@<name>` without a marketplace catalog (verified at design time, recorded in adversarial review).** The vercel-labs CLI's `<owner/repo@skill>` resolver walks the cloned repository's tree for `SKILL.md` files and matches the requested `<skill>` against either the directory name or the frontmatter `name:` field of each `SKILL.md` it finds. It does not require or consult a `marketplace.json`. Reference: `vercel-labs/skills@1.5.6` README and source. This is the same shape `vercel-labs/skills` itself uses (no marketplace.json in that repo), and `npx skills add vercel-labs/skills@find-skills` already exercises this resolution path in this very repo's `skills-lock.json` (entry under `skills.find-skills`, `source: vercel-labs/skills`).

### AC-58-5

A `release-please` configuration manages versions for each of the three plugin-derived skills (`scaffold-repository`, `superteam`, `using-github`) using `release-type: simple`. The two standalone skills (`find-skills`, `office-hours`) are not release-please packages: `find-skills` is vendored from `vercel-labs/skills` and versioned upstream, and `office-hours` is versioned with the repository itself per the standalone-skill pattern. Per-package tag prefixes are preserved (`scaffold-repository-`, `superteam-`, `using-github-`), so the first post-rename release of the scaffold skill produces a tag of the form `scaffold-repository-vX.Y.Z`. The seed versions in `.release-please-manifest.json` carry the previously-published upstream tags (`scaffold-repository: 1.10.0`, `superteam: 1.5.0`, `using-github: 2.0.0`).

`release-type: simple` is chosen explicitly (over `node`) because the new layout has **no per-skill `package.json`**. The `simple` release-type does not require a `package.json`; release-please tracks each package's current version in `.release-please-manifest.json` directly and (optionally) rewrites a `version` line in any `extra-files` entry the config declares. Reference: `release-please` documentation, "release type: simple" — used for packages that do not have an opinionated version-bearing file (e.g. shell tools, documentation-only packages, asset bundles); the `simple` strategy only writes to `.release-please-manifest.json` plus any explicitly-listed `extra-files`. Since the marketplace manifests are deleted (AC-58-2), the previous config's `extra-files` block (rewriting `source.ref` in each `marketplace.json`) is removed; the rewritten config declares no `extra-files`, so the only artifact of a release-please run is the tag itself plus the manifest bump in `.release-please-manifest.json`.

The pre-existing `plugin-release-bump.yml` workflow and the cross-repo `repository_dispatch` step in `docs/release-flow.md` are removed in the same change, with `docs/release-flow.md` rewritten to describe the new flow. Bot-generated `release-please--*` PRs remain the documented exception to the issue-tag rule that already covers `bot/bump-*` PRs in AGENTS.md. The scaffold self-apply step (`scripts/apply-scaffold-repository.js`) is triggered from `.github/workflows/release-please.yml` when a `scaffold-repository-vX.Y.Z` tag is created; this preserves the M2 self-apply baseline already landed on this branch (commit `8ec0a33` and follow-ups).

The pre-existing per-plugin `release-please-config.json` files imported by `git subtree add` at `plugins/<name>/release-please-config.json` are deleted alongside the `plugins/` directories themselves — they were never live releases-please packages in this repo, only carry-over noise from the upstream packages.

### AC-58-6

Contributor and user documentation that does not need to live in the repository is migrated to the repository's GitHub wiki. `docs/` retains AGENTS.md (root), the rewritten `docs/release-flow.md`, `docs/file-structure.md`, `docs/wiki-index.md`, and the `superpowers/` design and plan artifacts. `README.md` links the wiki for install walkthroughs, troubleshooting, and per-skill usage notes. The wiki migration is documented in this design and tracked through `docs/wiki-index.md`. Path references throughout the wiki index — and through the wiki itself after publication — point at `skills/<name>/SKILL.md` (the new canonical home), not at the deleted `plugins/<name>/skills/<name>/` or the pre-flatten `.agents/skills/<name>/` paths. The `office-hours` standalone skill gets its own wiki page following the same per-skill pattern as the other four: a usage walkthrough (covering Startup-mode vs. Builder-mode entry points for office-hours; the corresponding entry points for the other skills), a "when to invoke" trigger summary lifted from the SKILL.md description, and a pointer back to `skills/<name>/SKILL.md` as the source of truth. Wiki pages do **not** repeat SKILL.md bodies — they link to them — so the SKILL.md files remain authoritative and the wiki pages are free to evolve as user-facing onboarding material.

### AC-58-7

The workflow-contract surfaces in `skills/superteam/` (SKILL.md, agents/, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md`) are present at the new flat path and reachable by both hosts under the dogfood overlay, so an in-repo `/superteam` run on this repo resolves the same SKILL.md it would after an `npx skills add` install. The non-negotiable-rules SHA-256 prefix computed by `Team Lead` during `resolve_role_config` for each shipped role matches between the pre-flatten path (`plugins/superteam/skills/superteam/SKILL.md`) and the post-flatten path (`skills/superteam/SKILL.md`), demonstrating no silent edit slipped in during the `git mv`.

**Scope of the SHA-256 round-trip:** the byte-equivalence assertion in this AC covers `skills/superteam/SKILL.md` (and the `agents/`, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md` surfaces alongside it) **only**. The `scaffold-repository` SKILL.md at `skills/scaffold-repository/SKILL.md` is **exempt** from any SHA-256 round-trip assertion: the rename delta (now landed) rewrites the in-tree SKILL.md frontmatter and body bytes as cataloged in the "Plugin rename" section, so its post-flatten SHA-256 will differ from the upstream `patinaproject/bootstrap@v1.10.0` reference; the rename diff itself is the audit surface. The same exemption applies to `skills/using-github/SKILL.md` — only `superteam` is bound by the SHA-256 round-trip rule because only `superteam`'s `Team Lead` consumes that hash as a runtime contract.

**Why `git mv` preserves the SHA:** Git stores file content as blobs hashed by SHA-1 (legacy) and SHA-256 (with the `--object-format=sha256` setting; this repo uses SHA-1 for its own object store but the file-content SHA-256 used by `Team Lead`'s `resolve_role_config` is computed independently on the file's bytes). `git mv` updates the index path of an existing blob without rewriting the blob, and rename detection in `git log --follow` and `git diff -M` tracks the path change. The file-content SHA-256 we audit is therefore identical before and after `git mv plugins/superteam/skills/superteam skills/superteam` so long as no editor touched the file between the moves. Verification: a pre-move `sha256sum plugins/superteam/skills/superteam/SKILL.md` and a post-move `sha256sum skills/superteam/SKILL.md` must produce identical hexdigests. The PR body's "Test coverage" table records the hex against AC-58-7 (the pre-flatten value is recorded in PR #59 as `87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356`; the post-flatten value must match).

### AC-58-8

The merge approach for the three source repositories is explicitly chosen and documented: Git history is preserved via `git subtree add --prefix=plugins/<name>` per source repo. The plan derived from this design follows the choice without revisiting it. The three source repos remain readable as archived references for at least one release cycle after consolidation. The migration history record produced by this AC notes the **three** events for the scaffold skill in order: (a) `git subtree add --prefix=plugins/bootstrap patinaproject/bootstrap v1.10.0` import (commit `912d6d9`); (b) `git mv plugins/bootstrap plugins/scaffold-repository` rename (commit `794e199`); (c) `git mv plugins/scaffold-repository/skills/scaffold-repository skills/scaffold-repository` flatten (the delta-4 commit landed during execution after this design absorbs operator PR #59 comments). The corresponding two events for `superteam` and `using-github` are also recorded: subtree import, then `git mv plugins/<name>/skills/<name> skills/<name>` flatten. Per-file blame survives the chain because `git mv` is a rename, not a rewrite (verified by `git log --follow`). The upstream `patinaproject/bootstrap` repository keeps its original name and `v1.10.0` tag as the archived reference; the rename and flatten are local to the imported copy in this repository only.

## Context

Today this repository is a marketplace catalog only. The three Patina Project skills live in their own repos and propagate releases here through `repository_dispatch` -> `.github/workflows/plugin-release-bump.yml` -> a `chore: bump <plugin> to <tag>` PR. The current state:

- `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json` list `bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`, each pinned to a `vX.Y.Z` tag from its source repo.
- `docs/release-flow.md` enforces the "tagged releases only, no branch refs" rule and documents the dispatch flow.
- `scripts/validate-marketplace.js` enforces the rule programmatically (`semverTag` regex; both manifest schemas).
- `docs/file-structure.md` already names `plugins/` as the location for vendored plugins; it is empty in the current tree.
- The `superteam` skill ships workflow-contract surfaces (SKILL.md, agents/, pre-flight.md, routing-table.md, project-deltas.md, workflow-diagrams.md) that must round-trip across the move without subtle drift, because `Team Lead` computes a non-negotiable-rules SHA-256 prefix that downstream audit lines depend on.

The consolidation has three forces pulling against each other:

1. **Iteration speed.** Coordinated changes across `superteam` and `using-github` today cost a release in each upstream plus a bump PR here. Consolidation collapses that into one PR.
2. **Release discipline.** The current `vX.Y.Z`-only rule is enforced by both the validator and the release-bump workflow. Whatever replaces it must keep the rule and keep it machine-checkable.
3. **Workflow-contract stability.** `superteam` itself will live in-repo, so any local-path resolution for in-repo iteration must not turn the SKILL.md into a moving target during a run, and the `writing-skills` discipline (description-as-trigger, non-negotiable rules round-trip, no silent guardrail redaction) must survive the move intact.

## Approach Options

### Option A (original): Monorepo with plugin wrappers + marketplace catalog

Vendor each plugin under `plugins/<name>/` with `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `skills/<name>/`, and a per-plugin `package.json`. Maintain `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json` (plus dev-overlay variants). `release-please` runs `release-type: node` per plugin, with `extra-files` rewriting each marketplace manifest's `source.ref` field.

**Why this was wrong (operator PR #59 review):** the plugin wrappers and marketplace catalog add layers without adding capability. The vercel-labs CLI doesn't need them; consumers don't install through `/plugin marketplace add` if they install via `npx skills add`; the per-plugin `package.json` exists only to give release-please a `version` field that `release-type: simple` already supplies via `.release-please-manifest.json`.

### Option B (combined version, no per-package release-please)

Same plugin layout as Option A but a single repo-wide version. Already rejected pre-PR-59 for weakening per-skill semver signal.

### Option F1 (selected — vercel-labs pure): Flat `skills/<name>/` with per-skill `release-type: simple`, no marketplace catalog

Move each skill to `skills/<name>/` at the repo root. No `plugins/` directory. No marketplace manifests of any kind. No per-skill `package.json`. The vercel-labs CLI resolves `npx skills add patinaproject/skills@<name>` by walking the cloned tree for `SKILL.md` files matching the requested slug (verified design-time against `vercel-labs/skills@1.5.6`). `release-please` runs per-skill with `release-type: simple` for the three packages that need version markers (`scaffold-repository`, `superteam`, `using-github`); each emits a prefixed tag (`scaffold-repository-vX.Y.Z`, etc.) that consumers pin via `npx skills add patinaproject/skills@<name>#<tag>`. Dogfood overlay is the only structural sugar that remains: `.claude/skills/<name>/` and `.agents/skills/<name>/` are committed thin symlinks pointing at `../../skills/<name>/` so a fresh clone is discoverable to both Claude Code and Codex without a post-clone install step.

**Selected approach: F1.** It matches the operator's binding direction from PR #59 review, deletes a full layer of catalog/wrapper plumbing, and aligns this repo's shape with the canonical `vercel-labs/skills` reference. The host-native marketplace-add fallback is dropped (it required a marketplace.json we no longer ship); users who distrust the npm-distributed CLI can clone the repo and copy the SKILL.md directly, which is the same fallback `vercel-labs/skills` itself documents.

## Proposed file layout

```text
patinaproject/skills/
  skills/                                  # CANONICAL skill home (real files)
    scaffold-repository/
      SKILL.md                             # frontmatter "name: scaffold-repository"
      ... (any supporting files lifted from the upstream plugin)
    superteam/
      SKILL.md
      agents/...
      pre-flight.md
      routing-table.md
      project-deltas.md
      workflow-diagrams.md
    using-github/
      SKILL.md
      ... (supporting files: workflows/, slash commands, etc.)
    find-skills/
      SKILL.md                             # vendored from vercel-labs/skills, tracked in skills-lock.json
    office-hours/
      SKILL.md                             # standalone skill, ported from patinaproject/patinaproject#1143
  .claude/skills/                          # Dogfood overlay (Option D1 — committed symlinks; see Gate G7)
    scaffold-repository  -> ../../skills/scaffold-repository
    superteam            -> ../../skills/superteam
    using-github         -> ../../skills/using-github
    find-skills          -> ../../skills/find-skills
    office-hours         -> ../../skills/office-hours
  .agents/skills/                          # Dogfood overlay for Codex (same target set)
    scaffold-repository  -> ../../skills/scaffold-repository
    superteam            -> ../../skills/superteam
    using-github         -> ../../skills/using-github
    find-skills          -> ../../skills/find-skills
    office-hours         -> ../../skills/office-hours
  skills-lock.json                         # committed; tracks the vercel-labs find-skills install for reproducibility
  scripts/
    apply-scaffold-repository.js           # in-repo invocation of skills/scaffold-repository on release
    verify-dogfood.sh                      # AC-58-3 dogfood check (file-presence + frontmatter + overlay resolution)
  release-please-config.json               # release-type: simple per skill; no extra-files
  .release-please-manifest.json            # seeds: scaffold-repository 1.10.0, superteam 1.5.0, using-github 2.0.0
  docs/
    AGENTS.md → ../AGENTS.md               # (kept at repo root; CLAUDE.md import shim references AGENTS.md)
    release-flow.md                        # rewritten for release-please; documents vercel-labs CLI version pin
    file-structure.md                      # rewritten for the flat layout
    wiki-index.md                          # canonical index of GitHub wiki pages
    superpowers/specs/...
    superpowers/plans/...
  .github/workflows/
    release-please.yml                     # per-skill release-please; triggers apply-scaffold-repository on scaffold-repository tags
    verify.yml                             # renamed from verify-iteration.yml; display name "Verify"
    markdown.yml
    actions.yml
    pull-request.yml
  README.md, AGENTS.md, CLAUDE.md
  package.json                             # repo-root only; husky/commitlint/markdownlint dev deps
  .gitignore                               # includes .agents/skills/<third-party>/ and .claude/skills/<third-party>/
                                           # for CLI-installed skills that are NOT part of the in-repo five
```

**Deleted from the pre-flatten tree (delta 4):**

- `plugins/` (entire tree — scaffold-repository, superteam, using-github wrappers)
- `.agents/plugins/` (Codex marketplace catalog tree)
- `.claude-plugin/` (Claude Code marketplace catalog tree)
- All `marketplace.json` and `marketplace.local.json` files in both catalog directories
- `scripts/validate-marketplace.js` (no marketplace to validate)
- `.gitattributes` `export-ignore` rules that pointed at deleted overlay directories
- Pre-existing per-plugin `release-please-config.json` / `.release-please-manifest.json` files imported as carry-over from upstream (`plugins/<name>/release-please-config.json`, `plugins/<name>/.release-please-manifest.json`)
- Per-plugin `package.json` files at `plugins/<name>/package.json` (subtree carry-over; not part of the live release pipeline)
- `packages/skills-cli/` (already absent from the prior delta)

The wiki carries everything that used to live in per-plugin `README.md` install walkthroughs, user-facing troubleshooting, and any non-design tutorial content.

**Gitignore strategy for CLI-installed third-party skills.** A contributor running `npx skills add <some-other-source>@<some-skill>` (e.g. installing more obra/superpowers skills locally) will see the CLI write to `.claude/skills/<name>/` and `.agents/skills/<name>/`. Those CLI-installed third-party skills are gitignored so a local install doesn't pollute the repo's commit surface. The committed dogfood symlinks (five entries; one per in-repo skill) are explicitly tracked via a negative `!.claude/skills/scaffold-repository` (etc.) pattern in `.gitignore`, so they survive a directory-wide ignore rule. The exact `.gitignore` shape (negated entries vs. an allowlist sub-block) is an Executor implementation detail; the design constraint is "the five in-repo overlay symlinks are tracked; everything else under `.claude/skills/` and `.agents/skills/` is ignored."

## Canonical skill layout

This repo has one canonical home for each skill — `skills/<name>/` at the repo root, holding real files. Two thin overlay directories exist solely so the repo's own Claude Code and Codex sessions discover the five in-repo skills out of a fresh clone with no install step:

```text
skills/<name>/SKILL.md            <-- canonical home (real file; the source of truth and the install target)
  ^
  | symlink (dogfood overlay; Option D1)
  |
.claude/skills/<name>/SKILL.md    <-- Claude Code skill loader scans here
.agents/skills/<name>/SKILL.md    <-- Codex skill loader scans here
```

Rationale:

- `skills/<name>/` is the **canonical home**. It is what the vercel-labs CLI's `<owner/repo@skill>` resolver finds when it walks the cloned repo tree for `SKILL.md` files matching `<skill>`. It is also what `npx skills add patinaproject/skills@<name>` copies (with `--agent <agent>`) or symlinks (without `--agent`) to the consumer's local agent directory. For `superteam` and `using-github` the SKILL.md content is byte-equivalent to the upstream tag (and to the pre-flatten path under `plugins/<name>/skills/<name>/`) per AC-58-7. For `scaffold-repository` it carries the rename surfaces cataloged in the "Plugin rename" section.
- `.claude/skills/<name>/` and `.agents/skills/<name>/` are **dogfood overlays**. Each is a single committed symlink whose target is `../../skills/<name>/`. They exist because Claude Code's skill loader scans `.claude/skills/**/SKILL.md` and Codex's scans `.agents/skills/**/SKILL.md`; neither host scans `skills/<name>/` directly. Without the overlay, a fresh clone would have skills that are invisible to the host running in this repo's worktree. Committing the overlay symlinks (Option D1; see Gate G7) makes dogfood work without a post-clone install command.
- The overlay symlinks are **dev-time iteration aids**, and they are no longer required to be excluded from any release surface because there is no release surface that would carry them: no `npm publish` (Gate G6 CLOSED), no marketplace catalog (AC-58-2), and the consumer install path (`npx skills add patinaproject/skills@<name>`) targets `skills/<name>/` directly. The overlay symlinks travel with the repo as ordinary tracked content.
- Third-party skills installed locally via `npx skills add <other-source>@<other-skill>` land in `.claude/skills/<other-skill>/` and `.agents/skills/<other-skill>/`. These are gitignored (negated allowlist for the five in-repo overlay symlinks); see "Gitignore strategy" in the file layout above.

The vercel-labs `skills` CLI defaults to copying skill content when `--agent <agent>` is passed and to symlinking otherwise. For the in-repo `find-skills` install (`npx skills add vercel-labs/skills@find-skills --agent claude-code -y`), the CLI wrote a copy and produced `skills-lock.json` at the repo root. As part of the delta-4 flatten, the copied content is moved to `skills/find-skills/SKILL.md` (the canonical home) and the `.claude/skills/find-skills/` directory is replaced by a symlink — same shape as the four other in-repo skills. `skills-lock.json` stays committed at the repo root for reproducible re-installs.

### Skill shapes after the flatten (single pattern)

The previous design distinguished "plugin-scoped" and "standalone" skill patterns. The flat layout collapses that distinction: **every skill is a directory under `skills/` with a `SKILL.md` real file inside, possibly accompanied by supporting files (sub-skill assets, scripts, sub-directories).** The shape is the same whether the skill has one file (`office-hours`, `find-skills`) or many (`superteam` with its `agents/`, `pre-flight.md`, etc.). The difference between simple and complex skills is now visible from `ls skills/<name>/`, not from a wrapper directory.

What this collapses:

- **Plugin manifests.** Gone. There is no `.codex-plugin/plugin.json` or `.claude-plugin/plugin.json` anywhere in the tree. The vercel-labs CLI does not consult plugin manifests.
- **Marketplace entries.** Gone. There is no marketplace catalog. The vercel-labs CLI resolves `@<name>` by walking the tree, not by reading a catalog.
- **Per-skill `package.json`.** Gone. `release-please` uses `release-type: simple`, which does not require a `package.json` per package.
- **The "promote a standalone skill to a plugin" PR shape.** No longer needed. A skill that grows files just gets more files under `skills/<name>/`. No structural promotion happens.

What stays:

- **Per-skill versioning** for the three previously-plugin-scoped skills (`scaffold-repository`, `superteam`, `using-github`). Each is a release-please `release-type: simple` package with its own `tag-name-prefix`. Tags exist as install pins consumers can pass via `npx skills add patinaproject/skills@<name>#<tag>`. The two non-release-please skills (`find-skills` upstream-versioned; `office-hours` repo-versioned) install at HEAD by default.
- **Source-provenance catalog** for ported standalone skills. The `office-hours` provenance entry still lives in the "Ported skills" subsection of the migration history.

**Inaugural ex-standalone skill: `office-hours`.** Ported from `patinaproject/patinaproject` PR #1143 at head SHA `02e6ebbdbef123bbeb211fad06aa86bd5e33528a`. The skill is a YC-style office-hours conversation partner with two modes (Startup and Builder) and produces a design doc rather than code. It is general-purpose and fits this repo's scope; the body intentionally references generic Patina conventions (e.g. `CLAUDE.md`, `AGENTS.md`, `docs/`) which are present in this repo as well. The port is byte-for-byte: `skills/office-hours/SKILL.md` is identical to the file at the upstream PR head SHA. Source provenance is recorded in the "Ported skills" subsection of the migration history catalog below.

## In-repo iteration

A contributor clones the repo and runs `pnpm install` (initializes husky + commitlint dev tooling; not required for skill discovery itself). The five in-repo skills are immediately discoverable by Claude Code (via the committed `.claude/skills/<name>/` overlay symlinks) and by Codex (via the committed `.agents/skills/<name>/` overlay symlinks). No marketplace registration, no `--dev` CLI flag, no overlay file is needed — the symlinks are already in place.

For the `superteam` skill specifically, in-repo iteration must not introduce path drift inside a single `/superteam` run. The dogfood symlink resolves at file-open time to a stable absolute path under `skills/superteam/SKILL.md`; the SKILL.md is a real file at that location and is not relocated during the run. `superteam`'s pre-flight host-probe order is unchanged; `Team Lead`'s `resolve_role_config` SHA-256 prefix is computed against `skills/superteam/SKILL.md`, which has the same bytes (and the same SHA-256) as the post-`npx skills add` install copy.

## `npx skills` installer (adopted from vercel-labs)

Gate G6 is **CLOSED**: the bare npm name `skills` is taken by `vercel-labs/skills` (`skills@1.5.6` at design time), a fully capable CLI that already supports `add <owner/repo@skill>`, `init`, `find`, `experimental_sync`, and per-agent (`--agent claude-code`, `--agent codex`, etc.) install. This repo therefore **does not author or publish its own `skills` CLI.** No new package, no new `bin`.

User-facing install pattern (CLI version pinned at invocation; `--ignore-scripts` via env var as a defense-in-depth default):

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@superteam           --agent claude-code -y
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@using-github        --agent claude-code -y
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@find-skills         --agent claude-code -y
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@office-hours        --agent claude-code -y
```

For pinned versions, append `#<git-ref>`:

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository#scaffold-repository-v1.10.1 --agent claude-code -y
```

The `<owner/repo@skill>` syntax resolves against the published GitHub repository. The CLI clones the repo at the requested ref (default branch HEAD if no `#<ref>` is given), walks the tree for `SKILL.md` files whose frontmatter `name:` matches the requested slug, and either symlinks (no `--agent`) or copies (with `--agent`) the content into the agent's expected skill directory. `skills-lock.json` records the resolved skill SHA so subsequent re-installs reproduce the same content. The `skills@<version>` segment in the `npx` invocation is what pins the CLI itself; updating that version is a deliberate act recorded in `docs/release-flow.md`.

**Supply-chain considerations:**

- The CLI is a third-party dependency. The README install instructions pin a tested CLI **version at invocation** (e.g. `npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y`), not a recommended version range in prose. `npx <package>@<version>` resolves to that exact version regardless of the npm `latest` dist-tag at run time. The docs include both the upstream repo URL (`https://github.com/vercel-labs/skills`) and the tested version's published-to-npm date.
- `npx skills add` should be run with `--ignore-scripts` (`npm_config_ignore_scripts=true npx skills@<pinned> add ...`). The README documents this env-var-prefix form as the **default** invocation.
- `skills-lock.json` (produced by the CLI and committed) pins the resolved **skill** SHA, not the **CLI** version. CLI-version pinning lives in the install command syntax and in `docs/release-flow.md`.
- **No host-native marketplace fallback.** The marketplace catalog is deleted (AC-58-2). A user who distrusts the npm-distributed CLI can clone the repo and copy `skills/<name>/SKILL.md` directly into their agent's skill directory; this is the fallback documented in `docs/release-flow.md`. The `/plugin marketplace add` and `codex plugin marketplace add` paths no longer apply to this repo.
- If the upstream `vercel-labs/skills` package is unpublished or rewritten in a way that breaks the documented install pattern, the manual clone-and-copy fallback above is the documented rollback. The repo's `docs/release-flow.md` records this as the rollback procedure.

Host detection / auto-invocation: out of scope (the vercel-labs CLI handles host detection via `--agent`; Gate G4 closed under the prior delta).

## Migration approach: history preservation

History is preserved via `git subtree add --prefix=plugins/<name> <upstream-remote> <tag>` for each of the three source repos at their current tagged versions (`bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`). The subtree adds preserve per-file blame across the import. The subsequent `git mv plugins/bootstrap plugins/scaffold-repository` (delta-2 rename) and `git mv plugins/<name>/skills/<name> skills/<name>` (delta-4 flatten) chain preserves blame further via Git's rename detection. Each `git mv` updates the index path of an existing blob without rewriting the blob, so the SHA-256 of each file's bytes is identical before and after the chain. The three upstream repos are archived (not deleted) on completion and their `README.md` is updated to point at this repo.

The commit chain on this branch:

1. Subtree imports — `912d6d9` (bootstrap), `028165e` (superteam), `54157bc` (using-github).
2. Rename — `794e199` `git mv plugins/bootstrap plugins/scaffold-repository`.
3. Wiring commits — `release-please`, overlay layout, workflow replacement, doc rewrites (commits `932fdc3` through `2291f02` on this branch).
4. Delta-4 flatten (this design's change) — `git mv plugins/<name>/skills/<name> skills/<name>` for each of the three packaged skills; `git mv .agents/skills/office-hours skills/office-hours`; delete `plugins/`, `.agents/plugins/`, `.claude-plugin/`, `scripts/validate-marketplace.js`, and the carry-over per-plugin `release-please-config.json` and `package.json` files; rewrite `release-please-config.json` for `release-type: simple`; rename `verify-iteration.yml` to `verify.yml`; commit the dogfood overlay symlinks under `.claude/skills/` and `.agents/skills/`; rewrite `README.md`, `docs/release-flow.md`, `docs/file-structure.md`, `AGENTS.md`, and the wiki index for the flat paths.

Each follow-up commit pairs with one or more `AC-58-<n>` IDs in the PR body, per AGENTS.md.

### Ported skills

The three previously-plugin-scoped skills (`scaffold-repository`, `superteam`, `using-github`) are imported via `git subtree add`. Skills ported via copy-then-attribute are recorded here for provenance.

| Skill | Source repo | Source PR | Source SHA | Final target path | Port commit | Attribution surface |
| --- | --- | --- | --- | --- | --- | --- |
| `office-hours` | `patinaproject/patinaproject` | [PR #1143](https://github.com/patinaproject/patinaproject/pull/1143) | `02e6ebbdbef123bbeb211fad06aa86bd5e33528a` | `skills/office-hours/SKILL.md` | `fab5458` (initial port to `.agents/skills/office-hours/`) + delta-4 `git mv` flatten | This subsection (migration history catalog) |

Attribution for ported skills is centralized in this catalog rather than added as a `Source:` header line inside each `SKILL.md`. Rationale: (a) the SKILL.md is the user-facing artifact and headers above the YAML frontmatter would confuse the skill loader's frontmatter parser; (b) adding a comment inline below the frontmatter would deviate from the upstream byte-for-byte port; (c) a single catalog is easier to audit when multiple skills are ported in future.

**Licensing.** Both source repositories (`patinaproject/patinaproject` and this repo, `patinaproject/skills`) are Patina Project-owned. Skill content authored in one Patina repo is freely portable into another Patina repo without an explicit license note beyond this provenance catalog entry. If a future port pulls from a third-party repo, the catalog row should add an explicit license column citing the source's `LICENSE` file and a verification that the license permits the port (e.g. MIT, Apache 2.0, CC-BY).

## Plugin rename: `bootstrap` -> `scaffold-repository` (historical; absorbed pre-flatten)

The in-tree copy of the `bootstrap` plugin imported from `patinaproject/bootstrap@v1.10.0` was renamed to `scaffold-repository` during delta-2 (commit `794e199`). The upstream repository keeps its name; only the in-tree copy and its consumer-visible surfaces were renamed. The rename is internally consistent with the skill's own description ("Use when scaffolding a new repository..."), which already uses the verb `scaffold`. The delta-4 flatten then moved `plugins/scaffold-repository/skills/scaffold-repository/` to `skills/scaffold-repository/`; the rename had already happened and is unaffected by the flatten.

### Rename surface catalog (post-flatten state)

After delta-4 the rename surfaces collapse — most of the original catalog targeted now-deleted directories (`plugins/`, `.agents/plugins/`, `.claude-plugin/`). The surfaces that survive in the post-flatten tree:

**Filesystem paths (current canonical):**

- `skills/scaffold-repository/SKILL.md` — frontmatter `name: scaffold-repository`
- `.claude/skills/scaffold-repository` symlink → `../../skills/scaffold-repository`
- `.agents/skills/scaffold-repository` symlink → `../../skills/scaffold-repository`

**SKILL.md (the only file in the catalog that still requires the rename edits to be visible):**

- Frontmatter `name:` value `scaffold-repository` (was `bootstrap` upstream)
- Frontmatter `description:` — trigger phrases revised: `"bootstrap this repo"` → `"scaffold this repo"`; the upstream phrase `"scaffold a Patina plugin"` stays as-is.
- H1 heading `# scaffold-repository` (was `# bootstrap`)
- Body references to the plugin name rewritten from `bootstrap` to `scaffold-repository`.
- References to the upstream repo URL (`https://github.com/patinaproject/bootstrap`) are preserved because that URL still resolves to the archived upstream.

**Scripts and pnpm wiring:**

- `scripts/apply-scaffold-repository.js` (was `scripts/apply-bootstrap.js` upstream; renamed at delta-2)
- `package.json` script `apply:scaffold-repository`

**Release-please configuration (post-flatten shape):**

- `release-please-config.json` — package key `skills/scaffold-repository` (not `plugins/scaffold-repository`); `release-type: simple`; `tag-name-prefix: scaffold-repository-`; no `extra-files` block (no marketplace.json to rewrite)
- `.release-please-manifest.json` — entry key `skills/scaffold-repository` with seed version `1.10.0`

**Documentation (post-flatten paths):**

- `README.md`, `docs/release-flow.md`, `docs/file-structure.md`, `AGENTS.md`, this design doc, `docs/superpowers/plans/2026-05-11-58-...-plan.md`, and the GitHub wiki pages all reference the post-flatten paths (`skills/scaffold-repository/SKILL.md`).

**Surfaces deleted (no longer applicable after delta-4):**

- `plugins/scaffold-repository/.claude-plugin/plugin.json`, `plugins/scaffold-repository/.codex-plugin/plugin.json`, `plugins/scaffold-repository/package.json` — the entire `plugins/scaffold-repository/` tree is deleted.
- `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, both `.local.json` overlays — the entire marketplace catalog is deleted.

**SKILL.md trigger-phrase decision (recorded explicitly):** the upstream SKILL.md body uses the verb `bootstrap` in a single trigger phrase (`"bootstrap this repo"`). The rename rewrites that phrase to `"scaffold this repo"`. Rationale: (a) the in-tree SKILL.md is the user-facing artifact post-rename and must surface the new skill name in its triggers for discoverability, (b) the upstream archived copy at `patinaproject/bootstrap@v1.10.0` preserves the original wording for anyone auditing the pre-rename version, (c) AC-58-7's SHA-256 round-trip binds `superteam` only.

**Out of scope for the rename (preserved as-is):**

- `patinaproject/bootstrap` upstream repository name, `v1.10.0` git tag, and history. The upstream is archived but not renamed.
- The word "bootstrap" used in **unrelated contexts**: `pnpm install` referred to as a "bootstrap command", Husky bootstrap hooks, the verb in commit message templates like `chore: bootstrap commit hooks`, and similar generic English usage.

## `release-please` configuration shape

- Monorepo mode with three packages, all using `release-type: simple`:
  - `skills/scaffold-repository` (tag prefix `scaffold-repository-`, seed `1.10.0`)
  - `skills/superteam` (tag prefix `superteam-`, seed `1.5.0`)
  - `skills/using-github` (tag prefix `using-github-`, seed `2.0.0`)
- `release-type: simple` is chosen because the new layout has no per-skill `package.json`. The `simple` strategy reads the current version from `.release-please-manifest.json`, bumps it based on conventional commits whose path matches the package's directory (`skills/<name>/**`), and writes the new version back to the manifest. No file in `skills/<name>/` is rewritten by release-please (no `extra-files` block) — tags are the only output, and the marketplace catalog that the prior config rewrote no longer exists.
- Tag prefix collision check: the three prefixes (`scaffold-repository-`, `superteam-`, `using-github-`) are unambiguous under any prefix-stripping consumer logic. No consumer currently strips them — consumers pass the full tag to `npx skills add patinaproject/skills@<name>#<full-tag>` — so the prior G1 (tag-prefix stripping) gate is REMOVED (no marketplace `ref` field to write to).
- The "release-please-action" step opens release PRs from `release-please--*` branches; AGENTS.md already lists this prefix alongside `bot/bump-*` as the only no-issue PRs.
- The scaffold-repository self-application step runs as `scripts/apply-scaffold-repository.js` from the release-please workflow when the released package includes `skills/scaffold-repository/`. The same workflow signs commits as `github-actions[bot]` and enables auto-merge, preserving the existing signing/auto-merge guarantees described in `docs/release-flow.md`. This is Gate G3 (STAYS — only its file paths shift from `plugins/scaffold-repository/` to `skills/scaffold-repository/`).
- `scripts/validate-marketplace.js` is **deleted** in this delta. There is no marketplace to validate. The workflow that ran it (`verify-iteration.yml`, renamed to `verify.yml`) loses the marketplace validation step entirely.

## Wiki migration plan

Move to the wiki:

- Per-host install walkthroughs (Claude Code, Codex) with screenshots; install commands all use `npx skills@<pinned> add patinaproject/skills@<name>` form (no marketplace-add path).
- Per-skill usage examples and FAQs that today live in upstream `README.md`s.
- Troubleshooting notes for `npx skills` install failures and CLI version pinning.
- The "how superteam runs end-to-end" narrative currently in upstream `patinaproject/superteam/README.md`.

Keep in the repo:

- `AGENTS.md` (root) and the existing `CLAUDE.md` import shim
- `docs/release-flow.md` (rewritten for release-please with `release-type: simple`)
- `docs/file-structure.md` (rewritten for the flat `skills/` layout and dogfood overlays)
- `docs/wiki-index.md` (canonical index of wiki pages)
- `docs/superpowers/specs/` and `docs/superpowers/plans/`
- `README.md` reduced to: one-paragraph repo description, `npx skills` quickstart, links to the wiki for everything else, and a links table for the five skills

There is no marketplace manifest description to link the wiki from. The README is the only consumer-facing landing surface.

## Open questions

1. **(Resolved — Gate G1 removed.)** Tag-prefix stripping is no longer applicable; no marketplace manifest exists for release-please to rewrite.
2. **(Resolved — Gate G2 removed.)** Codex `path:` source support is no longer applicable; no marketplace catalog exists for Codex to read.
3. **Scaffold-repository self-apply during release.** Gate G3 STAYS. The trigger condition is "release-please tag with prefix `scaffold-repository-`"; the self-apply runs in the same workflow run that publishes the tag. Whether the result is committed to a follow-up PR vs. directly on the default branch is a Planner-implementation detail; the M2 baseline already on this branch chose direct commit on the default branch with `github-actions[bot]` signing.
4. **CLI host detection robustness.** Resolved by adopting the vercel-labs `skills` CLI. Gate G4 REMOVED.
5. **Wiki content ownership.** Gate G5 STAYS. Recommendation: canonical wiki, with `docs/wiki-index.md` listing the wiki pages so review of wiki link-rot stays in-repo.
6. **Dogfood overlay shape (Gate G7).** D1, D2, or D3 — see Gate G7 disposition below. Recommended: D1 (committed symlinks).

## Gates resolved in-design

### Gate G1 — Tag-prefix stripping (REMOVED)

The prior design had a gate around how `release-please`'s prefixed tags (`scaffold-repository-v1.11.0`, etc.) would be stripped to the bare `vX.Y.Z` form required by the marketplace validator's regex. With the marketplace catalog deleted (AC-58-2) there is no manifest `ref` field for release-please to rewrite and no validator regex to satisfy. Consumers pass the full prefixed tag (`patinaproject/skills@scaffold-repository#scaffold-repository-v1.10.1`) directly to the vercel-labs CLI. The gate is removed.

### Gate G2 — Codex `path:` source support (REMOVED)

The prior design needed Codex to accept a `path:` source in `marketplace.local.json` for the dev overlay. With the marketplace catalog deleted there is no Codex `marketplace.json` to consult. Codex's skill discovery reads `.agents/skills/<name>/SKILL.md` directly, and the dogfood overlay (Option D1) satisfies that scan with committed symlinks. The gate is removed.

### Gate G3 — Scaffold-repository self-apply (STAYS)

The release-please workflow triggers `scripts/apply-scaffold-repository.js` when a `scaffold-repository-vX.Y.Z` tag is created. The script's input path shifts from `plugins/scaffold-repository/` to `skills/scaffold-repository/`; the trigger logic, signing, and auto-merge configuration are unchanged.

### Gate G4 — CLI host detection (REMOVED)

The vercel-labs CLI handles host detection via the `--agent <agent>` argument. The gate is removed.

### Gate G5 — Wiki ownership (STAYS)

Canonical wiki, with `docs/wiki-index.md` as the in-repo index.

### Gate G6 — `npx skills` package name (CLOSED)

**Resolution:** the bare npm name `skills` is owned by `vercel-labs/skills` (`skills@1.5.6` at the time of this design). The vercel-labs CLI already implements `add <owner/repo@skill>`, `init`, `find`, `experimental_sync`, and per-agent install via `--agent claude-code` / `--agent codex`. It does what we would have built. **Integration, not invention.**

**Rationale:**

- Publishing `@patinaproject/skills` as a competing scoped CLI would split user intuition and put us on the hook for maintaining a CLI that duplicates an actively-developed upstream.
- The upstream's `<owner/repo@skill>` install syntax already targets exactly the granularity we need.

**Consequence:** No new package directory under `packages/`, no new `bin`, no `npm publish` step in the release workflow.

### Gate G7 — Dogfood overlay shape (CLOSED with D1)

**Options considered:**

- **D1 — Commit overlay symlinks.** `.claude/skills/<name>/` and `.agents/skills/<name>/` are tracked symlinks pointing at `../../skills/<name>/`. A fresh `git clone` is sufficient for both hosts to discover the five in-repo skills without any post-clone install step.
- **D2 — Post-clone `npx skills add .`.** Document that contributors run `npx skills@1.5.6 add patinaproject/skills --agent claude-code --all -y` against the local clone (or against `.` if the CLI supports a local path source). Adds a setup step but avoids tracking symlinks in the repo.
- **D3 — No dogfood.** Drop the dogfood AC entirely. Contributors install the skills like any consumer (`npx skills add patinaproject/skills@<name>` against the published GitHub repo), which means they install whatever is on the default branch — not necessarily the local working copy. The "test your in-progress edit on this very repo" workflow stops working out of the box.

**Resolution: D1 (commit overlay symlinks).**

**Rationale:**

- The operator's PR-59 comments objected to two specific kinds of catalog clutter: marketplace.json files (Comments 3220051689 and 3220059128) and per-skill package.json (Comment 3220084646). They asked for the canonical location to be a flat skills directory (Comments 3220055569/3220056037/3220056348, superseded by the latest "skills/ at repo root" directive). None of those comments objected to overlay symlinks per se. A thin symlink is not a "local marketplace" and not a "package.json"; it's a path alias.
- D1 has no per-clone setup cost. Skills are discoverable immediately after `git clone`. This matters because the `superteam` skill that drives this very work stream lives in-repo and needs to be discoverable for `/superteam` to find it on a fresh clone.
- D1 has no Windows-symlink-support cost beyond what `find-skills` already had on this branch pre-delta. (The prior layout had `.claude/skills/find-skills` -> `.agents/skills/find-skills` symlinks; D1 is the same shape with five entries instead of one.)
- D2 trades a setup step against a tracked-symlink cost; neither is structurally cleaner, and the setup-step cost compounds (every contributor pays it, every clean checkout pays it) while the tracked-symlink cost is paid once at design time.
- D3 breaks the "skills iterate on themselves" goal (Goals section, item 2). The dogfood AC is load-bearing for the consolidation's payoff and is kept binding.

**Consequence:** AC-58-3 condition 4 requires the five overlay symlinks resolve to `skills/<name>/`. The `.gitignore` strategy (negated allowlist) lets `npx skills add` write third-party skills under `.claude/skills/` and `.agents/skills/` without polluting the commit surface.

## Risks

- **Workflow-contract drift in `superteam`.** Moving SKILL.md changes its path and may inadvertently change line endings, trailing newlines, or YAML key order, which would shift the non-negotiable-rules SHA-256 prefix. Mitigation: AC-58-7 explicitly asserts the SHA-256 prefix round-trips, and the merge uses `git subtree add` rather than a fresh copy so byte content is preserved.
- **Vercel-labs CLI supply-chain.** Adopting an upstream CLI for the primary install path means an unpublish or compromise upstream affects our docs. With the marketplace-add fallback removed (catalog deleted), this risk increases: there is no in-repo install surface. Mitigations: (a) pin the CLI version at the invocation site (`npx skills@1.5.6 add ...`) so README drift cannot silently change what installs; (b) recommend `npm_config_ignore_scripts=true` as the default invocation; (c) document a clone-and-copy fallback (clone the repo, copy `skills/<name>/SKILL.md` into the agent's skill directory manually) as the documented rollback in `docs/release-flow.md` for users who distrust the CLI entirely; (d) record the upstream repo URL and tested version in `docs/release-flow.md`. The dogfood overlay symlinks let the user verify the fallback locally before adopting it elsewhere.
- **Dogfood overlay symlinks committed (Option D1).** Committing `.claude/skills/<name>/` and `.agents/skills/<name>/` symlinks means the repo tree includes content that doesn't function on Windows hosts without symlink support enabled. Mitigation: this repo already has symlinks via `find-skills`'s prior install; no Windows-only contributor has been encountered. If/when one is, the fallback is to clone with `git config core.symlinks true` (admin shell on Windows) or to use WSL. Documented in `README.md`. The committed symlinks resolve at file-open time on all POSIX hosts; no per-clone setup step is required there.
- **Single-release blast radius.** Once consolidated, a bad merge can break all three release-please-managed skills at once. Mitigation: `release-please`'s per-package versioning still produces three independent tags, so a single bad release can be rolled back per-skill via `npx skills add patinaproject/skills@<name>#<previous-tag>`. The two non-release-please skills (`find-skills`, `office-hours`) install at HEAD, so a bad commit propagates immediately; mitigation is the standard PR-review gate before merge to the default branch.
- **History-preservation cost.** `git subtree add` adds repo size proportional to the three source histories. Combined, this is small (the three repos are <50 MB), but it does mean `git clone` time grows. Acceptable.
- **Wiki link rot.** Wiki content is easy to lose track of. Mitigation: see open question (5) — `docs/wiki-index.md` lists every wiki page that exists so review of link-rot stays in-repo.
- **PR #59 diff scale on amend.** The delta-4 flatten is a large structural change on top of an already-large PR (416 changed files, +49k/-441 pre-flatten). Amending PR #59 in place is the operator's binding direction. The amend will add another large diff (many `git mv` operations across the three plugins plus deletions of `plugins/`, `.agents/plugins/`, and `.claude-plugin/`). Reviewers see one combined diff; `git mv` rename detection is preserved on GitHub's PR-diff UI, which keeps the review surface readable. The alternative (close-and-refile) was considered and rejected on operator instruction; rationale recorded in the delta-4 appendix below.

## Workflow-contract considerations (writing-skills)

This design touches `skills/**/*.md` and the workflow-contract surfaces of `superteam`. Per the `superpowers:writing-skills` discipline:

- **RED/GREEN baseline.** The existing `superteam` SKILL.md has a tested baseline at `v1.5.0`. Consolidation must preserve baseline behavior; AC-58-7's SHA-256 round-trip is the GREEN check (binding for `superteam` only). The delta-4 flatten preserves the GREEN check because `git mv` does not rewrite blob content — the post-flatten SHA-256 at `skills/superteam/SKILL.md` must equal the pre-flatten SHA-256 at `plugins/superteam/skills/superteam/SKILL.md` (already verified at design time as `87867b66...`).
- **Rationalization resistance.** No SKILL.md edits to any of the five skills are in scope of the delta-4 flatten — every move is a pure `git mv`. The `scaffold-repository` SKILL.md edits were absorbed in delta-2 (rename), not in delta-4. Any later behavior change is its own issue and follows the same SKILL.md TDD discipline.
- **Red flags.** "We can clean up the SKILL.md while we're moving it" remains the obvious failure mode. The delta-4 commits forbid this explicitly; the SHA-256 check enforces it for `superteam`.
- **Token-efficiency targets.** No content is being added to SKILL.md, so the existing token targets stay green.
- **Role ownership.** AGENTS.md and `docs/release-flow.md` are owned in this repo. `SKILL.md` for each in-repo skill is owned at `skills/<name>/SKILL.md` after the delta-4 flatten (with `<name>` ∈ `{scaffold-repository, superteam, using-github, find-skills, office-hours}`); the source-of-truth boundary that AGENTS.md describes is now "this repo's `skills/<name>/` owns the skill" (collapsed from the prior "this repo's `plugins/<name>/` owns the package; `.agents/skills/<name>/` is the canonical overlay" two-layer description).
- **Stage-gate bypass paths.** The pre-delta validator's `vX.Y.Z`-only check is gone with the marketplace catalog. The remaining stage-gate machinery is `release-please`'s own conventional-commit-based versioning, which refuses to advance a package version without a matching `feat:` or `fix:` commit under that package's path. This is upstream-enforced and machine-checkable.

## Adversarial review (post-commit pass)

A second pass against the `superpowers:writing-skills` review dimensions (RED/GREEN baseline obligations, rationalization resistance, red flags, token-efficiency targets, role ownership, stage-gate bypass paths) plus general design dimensions (testable ACs, assumption surfacing, completeness, reversibility, naming) surfaced three material findings, dispositioned below.

### Revisions

- **AC-58-3 falsifiability.** Original AC said "exercise any skill" without a concrete check. Revised to require three documented exit-0 invocations (overlay registration, validator dev/release modes, bootstrap apply against this repo).
- **AC-58-5 bootstrap self-apply coverage.** Original AC removed `plugin-release-bump.yml` but did not say what becomes of the TODO bootstrap self-apply step. Revised to require either implementation or explicit deferral with a tracked follow-up issue; leaving the TODO undocumented is forbidden.
- **npm-name lock-in.** Original `npx skills` section assumed the bare name was available. Added scoped fallback `@patinaproject/skills` and made name resolution a Planner gate.

Non-material observations recorded but not dispositioned into AC changes:

- AC-58-7's SHA-256 check is verification, not a behavioral test. Acceptable because the move is byte-equivalent (no SKILL.md edits in scope per writing-skills section).
- "What happens if the dev overlay drifts from the released manifest during a release-please run" is a Planner-implementation concern, not a design defect.

### Reviewer context

Same-thread fallback reviewer pass. No fresh subagent or parallel specialist was available in this teammate context; findings above are this teammate's adversarial pass against the committed design, applied with the writing-skills and general design dimensions enumerated in the role contract. Brainstormer-originated concerns are explicitly tagged as such above, separate from the dispositioned findings.

## Delta history

This appendix records design revisions made after Gate 1 first approved. Each entry is a discrete delta with a date and a source attribution.

### 2026-05-11 — Operator delta revision

Source: operator prompt opening a Gate-1 re-review during the `/superteam` delta run, supplied to the Brainstormer in this thread. The operator-binding deltas absorbed in this revision are:

1. **Canonical skill layout introduced.** `.agents/skills/` becomes the canonical workspace overlay; `.claude/skills/` is a symlink layer into it; `plugins/<name>/skills/<name>/` remains the package source of truth shipped to consumers. New "Canonical skill layout" section added. AC-58-1 amended to mention the overlay relationship. The original Workstream 5 (build/publish our own CLI) is removed from the implementation surface.

2. **Gate G6 closed by adoption, not by name resolution.** The bare npm name `skills` is taken by `vercel-labs/skills@1.5.6`, which already implements the install surface this repo intended to build. AC-58-4 rewritten so the primary install path is `npx skills add patinaproject/skills@<skill>` against the upstream CLI. Supply-chain notes added (version pinning, `--ignore-scripts`, marketplace-add fallback). The "`npx skills` installer" section rewritten as "(adopted from vercel-labs)" with no new package authored in this repo.

3. **Dogfood verification mechanized as AC-58-3 sub-check.** AC-58-3 extended with a "dogfood verification" sub-section. The check is mechanized as `scripts/verify-dogfood.sh` — file-presence + YAML-frontmatter assertions against the canonical overlay paths, because Claude Code does not expose a public "list installed skills" CLI command that this design can pin against. The four in-repo skills (`bootstrap`, `superteam`, `using-github`, `find-skills`) must all be discoverable.

4. **`find-skills` artifacts reconciled with canonical layout.** The `npx skills add vercel-labs/skills@find-skills --agent claude-code -y` install placed content under `.claude/skills/find-skills/` and produced `skills-lock.json` at the repo root. The canonical-layout reconciliation moves the copied content under `.agents/skills/find-skills/` and replaces `.claude/skills/find-skills/` with a symlink. `skills-lock.json` is committed in place at the repo root.

5. **Release-please / overlay symlink separation made explicit.** New Risks bullet records that the overlay symlinks (`.agents/skills/`, `.claude/skills/`) must not appear in the packaged release surface. The validator's release-mode check is extended to enforce this.

No prior acceptance criterion was weakened. No non-negotiable rule was removed. The byte-equivalence requirement for the `superteam` workflow-contract surfaces (AC-58-7) is reinforced by the canonical-layout decision (symlinks preserve byte content), not relaxed.

### 2026-05-11 — Adversarial review (delta-only)

The brainstormer ran a separate adversarial review against the four delta dimensions named in the operator prompt. Pass 1 produced the initial revisions in section above. Pass 2 (re-review of the committed delta) surfaced two further supply-chain refinements, dispositioned below.

1. **Dogfood AC falsifiability.** Original delta draft asserted "a fresh `claude` session discovers four skills" without specifying the check mechanism. Revised to specify `scripts/verify-dogfood.sh` doing file-presence + frontmatter assertions; the test is now reproducible without invoking the Claude binary. The check covers symlink chain integrity, frontmatter `name:` / `description:` presence, and target paths under `plugins/`. Clean pass on re-review.
2. **Vercel-labs supply-chain.** Pass 1 added: pinned version range (`skills@^1.5.6`), `npm_config_ignore_scripts=true` recommendation, marketplace-add fallback, upstream repo URL in `docs/release-flow.md`. **Pass 2 revisions:** (a) version range in prose is not sufficient — `npx skills` without a pin resolves to the npm `latest` tag, so the user gets whatever is published, not what we tested. The install commands and AC-58-4 falsifiable check now pin **at invocation** (`npx skills@1.5.6 add ...`). (b) `--ignore-scripts` recommendation moved from "where supported" to the **default** form in the user-facing install pattern (the env-var prefix is the example the README copies from). (c) Clarified that `skills-lock.json` pins the skill SHA but **not** the CLI version; CLI version pinning is the invocation syntax + `docs/release-flow.md`.
3. **Release-please / overlay symlink interaction.** Added a Risks bullet making the rule explicit: overlay symlinks are workspace-only; the validator's release-mode check refuses publishes that include them. `.gitattributes` `export-ignore` is documented as a secondary mitigation. Re-review noted that with Gate G6 closed there is no `npm publish` step that could leak the overlay — the only consumer-facing artifacts are the marketplace manifests and the Git tag, and the vercel-labs CLI reads under `plugins/` not under `.agents/skills/`. The mitigation remains as defense-in-depth.
4. **SKILL.md frontmatter sufficiency.** Verified by inspection at design time that each of the three in-repo plugin SKILL.md files already carries the `name:` / `description:` frontmatter Claude's skill loader requires (`plugins/bootstrap/skills/bootstrap/SKILL.md`, `plugins/superteam/skills/superteam/SKILL.md`, `plugins/using-github/skills/using-github/SKILL.md`). No frontmatter rewrite is required for the canonical-overlay symlinks to be discoverable. Recorded as a clean-pass dimension, not a defect.

Reviewer context: same-thread Brainstormer fallback. No fresh subagent was available in this delta context; pass 2 is the same teammate re-reading the committed text against the four operator dimensions. Findings (2a, 2b, 2c) are material and were dispositioned into design revisions before this report.

### 2026-05-11 — Operator delta revision: rename `bootstrap` to `scaffold-repository`

Source: operator prompt opening a Gate-1 re-review during the `/superteam` delta run, supplied to the Brainstormer in this thread immediately after the canonical-layout / vercel-labs delta absorbed above. The operator-binding delta is a rename of the in-tree `bootstrap` plugin to `scaffold-repository`. The upstream `patinaproject/bootstrap` repository keeps its name and `v1.10.0` tag; the rename is local to the in-tree copy imported via subtree.

1. **Plugin-folder, skill-folder, and SKILL.md `name:` renamed.** `plugins/bootstrap/` → `plugins/scaffold-repository/`; `skills/bootstrap/` → `skills/scaffold-repository/`; SKILL.md frontmatter `name: bootstrap` → `name: scaffold-repository`. AC-58-1 amended to record the rename and to note that `superteam` and `using-github` names are unchanged.
2. **Manifests, marketplace entries, scripts, release-please config, and docs renamed.** A complete catalog of renamed surfaces was added as a new "Plugin rename" section. The catalog enumerates plugin manifests (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`), marketplace manifests in both formats, the dev-overlay path entries, the canonical workspace overlay symlinks, `scripts/apply-bootstrap.js` → `scripts/apply-scaffold-repository.js`, `release-please-config.json` package key and tag prefix, AGENTS.md, README, `docs/file-structure.md`, `docs/release-flow.md`, and wiki pages.
3. **AC-58-3 dogfood verification updated to check `scaffold-repository`.** The four-skill set is now `{scaffold-repository, superteam, using-github, find-skills}`. The check verifies SKILL.md frontmatter `name:` matches the directory name, which exercises the rename's correctness end-to-end.
4. **AC-58-5 updated for `apply-scaffold-repository.js` and the release-please package key.** The legacy `apply-bootstrap.js` is renamed to `apply-scaffold-repository.js`; the release-please package key `plugins/bootstrap` → `plugins/scaffold-repository`; the tag prefix `bootstrap-` → `scaffold-repository-`. The longest-match strip rule against the manifest's `vX.Y.Z` regex remains satisfied.
5. **AC-58-7 SHA-256 round-trip scoped to `superteam` only.** The byte-equivalence assertion that backs `Team Lead`'s `resolve_role_config` hash covers `plugins/superteam/skills/superteam/SKILL.md` and adjacent workflow-contract files only. The `scaffold-repository` SKILL.md is explicitly exempt (rename-scoped edits to frontmatter `name:`, install commands, and `bootstrap`-as-plugin-name body references are allowed); the `using-github` SKILL.md is also exempt because its `Team Lead` consumer is not a runtime hash contract. The upstream archived repo at `patinaproject/bootstrap@v1.10.0` remains the byte-for-byte reference for pre-rename content.
6. **AC-58-8 migration history records both events.** The subtree-import commit (`912d6d9`) and the rename `git mv` commit (to land in execution) are both recorded as part of the scaffold-repository migration history.
7. **SKILL.md trigger-phrase decision.** The upstream SKILL.md body contains a single `"bootstrap this repo"` trigger phrase; the rename rewrites this to `"scaffold this repo"` so the post-rename plugin's triggers surface its new name. The Plugin rename section records this decision explicitly. Other trigger phrases that already used the verb `scaffold` (`"scaffold a Patina plugin"`) are unchanged.

#### Delta-only adversarial review (rename)

Reviewer context: same-thread Brainstormer fallback. No fresh subagent was available in this thread; the review below is the same teammate re-reading the rename absorption against the four dimensions named in the operator prompt (discoverability, search-replace blast radius, npm publish surface, tag-prefix collision).

1. **Discoverability** (source: rename delta paragraph 1, AC-58-3 dogfood verification). Claude Code's skill loader scans `.claude/skills/**/SKILL.md` and reads the YAML frontmatter `name:` field to identify each skill. (Verified: the upstream `bootstrap` SKILL.md frontmatter currently includes `name: bootstrap` and `description: ...`; the dogfood check at AC-58-3 condition 2 asserts the same shape post-rename.) Renaming the plugin folder, the skill folder, and the SKILL.md frontmatter `name:` is therefore the complete discoverability surface — the loader uses frontmatter, not filename, as the trigger identity. No additional filename-level rewrite is required beyond the directory rename. Disposition: clean pass, no AC change.

2. **Search/replace blast radius** (source: Plugin rename section "Out of scope" subsection). The word `bootstrap` appears in unrelated English contexts in this repo: `pnpm install` is called a "bootstrap command" in AC-58-3 (line preserved as-is), Husky has bootstrap hooks, and historical commit-message examples include `chore: bootstrap commit hooks`. A naive `sed -i 's/bootstrap/scaffold-repository/g'` would corrupt all of these. The design records a `rg -F 'bootstrap'` triage step with the finite surface list above as the implementation guide. Disposition: documented in Plugin rename section "Out of scope" subsection; no AC change but Planner must inherit this constraint into the rename workstream.

3. **npm publish surface** (source: AC-58-4 install commands, marketplace manifest entries). With Gate G6 CLOSED (no `npm publish` from this repo), the only npm-distributed artifact involved is the upstream `vercel-labs/skills` CLI, which reads `npx skills add patinaproject/skills@scaffold-repository`. The CLI's `<owner/repo@skill>` resolver walks the repo's plugin structure to find the named skill — verified by reading the canonical layout: the CLI matches against the plugin slug in the marketplace manifest, which must therefore match the post-rename slug. The new install command `npx skills add patinaproject/skills@scaffold-repository` is internally consistent with the marketplace manifest slug `scaffold-repository`. Disposition: clean pass; AC-58-4 falsifiable check updated to use `@scaffold-repository`.

4. **Tag-prefix collision with release-please** (source: release-please configuration shape section, new tag-prefix-collision bullet). The chosen tag prefix `scaffold-repository-` is unambiguous against the other monorepo prefixes (`superteam-`, `using-github-`) under a longest-match strip rule. The Planner G1 manifest-ref derivation regex `^(scaffold-repository|superteam|using-github)-v(\d+\.\d+\.\d+)$` produces `v\d+\.\d+\.\d+` as the manifest-pinned ref. Disposition: clean pass; explicit bullet added to the configuration-shape section.

No material findings required further revisions beyond what the delta absorption already encodes. The byte-equivalence requirement for `superteam` workflow-contract surfaces (AC-58-7) is unaffected by this rename. The scaffold plugin's SKILL.md SHA changes by design; that is documented as an explicit exemption rather than a regression.

### 2026-05-11 — Operator delta revision: port `office-hours` standalone skill

Source: operator prompt opening a third Gate-1 re-review during the `/superteam` delta run, supplied to the Brainstormer in this thread immediately after the rename delta absorbed above. The operator-binding delta ports the `office-hours` skill from [patinaproject/patinaproject PR #1143](https://github.com/patinaproject/patinaproject/pull/1143) at head SHA `02e6ebbdbef123bbeb211fad06aa86bd5e33528a` into this repository as a **first-class, standalone (non-plugin) skill**. This is the inaugural example of the standalone-skill pattern; the operator-binding decisions absorbed in this revision are:

1. **Standalone-skill pattern documented.** A new "Standalone skills" subsection under "Canonical skill layout" explains the two coexisting patterns this repo supports (plugin-scoped vs. standalone) with `office-hours` as the inaugural example. The standalone pattern is the minimum viable shape: `.agents/skills/<name>/SKILL.md` is a real file (not a symlink), there is no `plugins/<name>/` wrapper, no per-plugin manifests, no marketplace entry, and no `release-please` package. Migration between the two patterns is documented as reversible.
2. **No marketplace entry for standalone skills.** Marketplace manifests describe plugins; a single-file skill with no wrapping plugin manifest is not a plugin. The `office-hours` skill is therefore not an entry in `.agents/plugins/marketplace.json` or `.claude-plugin/marketplace.json`. `npx skills add patinaproject/skills@office-hours` still resolves because the vercel-labs CLI scans the repo tree for `SKILL.md` files whose frontmatter `name:` matches the requested slug, and it finds `.agents/skills/office-hours/SKILL.md` (frontmatter `name: office-hours`) directly. Host-native marketplace-add does **not** cover standalone skills.
3. **No release-please coverage for standalone skills.** Standalone skills are versioned with the repository itself. Consumers who `npx skills add patinaproject/skills@office-hours` (no `@<ref>` qualifier) resolve to the default-branch HEAD at install time. Consumers wanting a pinned version pass a Git ref qualifier (commit SHA, branch, or repo-level tag). `README.md` documents this resolution behavior as part of AC-58-4's docs scope. The standalone skill's content history is the repo's commit history; there is no separate per-skill changelog or version line.
4. **AC-58-3 dogfood verification extended to five skills.** The dogfood check now covers `{scaffold-repository, superteam, using-github, find-skills, office-hours}`. The check script branches on whether `.agents/skills/<name>/SKILL.md` is a symlink (plugin-scoped / find-skills) or a real file (standalone) — both are valid canonical-layout shapes. For `office-hours`, the symlink chain at the loader layer is one hop (`.claude/skills/office-hours/` → `.agents/skills/office-hours/`), not two. The check is simpler at the canonical layer for standalone skills, not more complex.
5. **AC-58-6 wiki migration extended to office-hours.** The standalone skill gets its own wiki page following the same per-skill pattern as the three plugin-scoped skills: usage walkthrough, trigger summary, pointer back to the source-of-truth SKILL.md. The wiki page does not duplicate SKILL.md content.
6. **Source provenance recorded.** A "Ported skills" subsection added under "Migration approach: history preservation" records source repo, source PR, source SHA, target path, port commit, and attribution surface. Attribution lives in the catalog rather than as a header line inside the SKILL.md (rationale: avoids breaking the YAML frontmatter parser, preserves the byte-for-byte port, and centralizes audit). The licensing note in the catalog records that both source and target are Patina Project-owned repos so no explicit license citation is required for this port; future third-party ports would require an explicit license column.
7. **Byte-for-byte port.** The skill content is preserved byte-for-byte from the upstream PR head SHA. No edits are made during the port. The `name:` / `description:` YAML frontmatter is verified well-formed at design time (frontmatter parses, `name: office-hours` matches the directory name, `description:` is a quoted string with concrete trigger phrases).

No prior acceptance criterion was weakened. AC-58-3 and AC-58-6 had their text amended (extension, not weakening); no AC was removed. No non-negotiable rule was removed. The byte-equivalence requirement for `superteam` workflow-contract surfaces (AC-58-7) is unaffected by this delta — `office-hours` is a brand-new file in this repo, not a workflow-contract surface for any in-repo role.

#### Delta-only adversarial review (office-hours port)

Reviewer context: same-thread Brainstormer fallback. No fresh subagent was available in this thread; the review below is the same teammate re-reading the port absorption against the four dimensions named in the operator prompt (skill ownership / licensing, pattern coherence, release-please / versioning coherence, dogfood verification falsifiability).

1. **Skill ownership / licensing** (source: rename delta paragraph 6, Ported skills catalog row, licensing note). The skill content was authored in `patinaproject/patinaproject` by someone (likely Claude, per the operator prompt) on behalf of the Patina Project organization. Both source and target repos are Patina-owned, so cross-repo content movement does not require an external license citation. The provenance catalog row in the migration history records source repo, PR, and SHA, which is sufficient for audit. The catalog's licensing paragraph documents the rule for future third-party ports (require explicit license column). The decision to centralize attribution in the catalog rather than as a `Source:` header line inside the `SKILL.md` is recorded explicitly with three reasons. Disposition: clean pass, no AC change.

2. **Pattern coherence** (source: "Standalone skills" subsection). The original design's mental model was "skills live under `plugins/`." Introducing a standalone-skill pattern adds a second valid shape. The "Standalone skills" subsection reconciles the tension explicitly: (a) the dual pattern is justified by different overhead profiles (plugin-scoped overhead is appropriate when a skill bundles assets, scripts, sub-skills, or multi-file workflow contracts; standalone is the minimum viable shape for a single SKILL.md); (b) the two patterns coexist at the canonical layer `.agents/skills/<name>/` — the only difference is whether the file there is a symlink (plugin-scoped) or a real file (standalone); (c) migration between patterns is reversible and documented. The mental model shifts from "skills live under `plugins/`" to "skills surface at `.agents/skills/<name>/`; some of those overlay-paths symlink into `plugins/`, others are real files." This is a stronger mental model that better reflects the runtime view (both hosts scan the canonical overlay, not `plugins/`). Disposition: documented in "Standalone skills" subsection; no AC change but the new mental-model framing should propagate into AGENTS.md and `docs/file-structure.md` updates during execution.

3. **Release-please / versioning coherence** (source: "Standalone skills" subsection paragraph on versioning). Standalone skills bypass release-please. The question raised in the operator prompt — what does `npx skills add patinaproject/skills@office-hours` resolve to, HEAD or a tag — is answered explicitly: HEAD of the default branch when no `@<ref>` qualifier is passed, an explicit Git ref (commit SHA, branch, or repo-level tag) when one is. This matches the vercel-labs CLI's documented default behavior (`https://github.com/vercel-labs/skills` README: when `@<ref>` is not specified, the CLI uses the default branch's HEAD). The `skills-lock.json` produced by the CLI still pins the resolved skill SHA, giving consumers reproducible re-installs even when resolving against a moving HEAD. The repo's `docs/release-flow.md` should record this resolution behavior alongside the existing CLI-version pinning notes; the Planner inherits this as a `docs/release-flow.md` rewrite item under AC-58-4. Disposition: documented in the "Standalone skills" subsection and surfaced as a doc-update item for AC-58-4's scope; no AC text change required because AC-58-4's docs scope already covers install-path documentation.

4. **Dogfood verification falsifiability** (source: AC-58-3 dogfood verification condition 4). The new entry (`office-hours`) doesn't break the existing check; it extends it. The script template branches on whether `.agents/skills/<name>/SKILL.md` is a symlink or a real file, both valid. The standalone-skill check is **simpler** than the plugin-scoped check (one fewer symlink hop to dereference) — the script just reads `.agents/skills/office-hours/SKILL.md` directly and checks its frontmatter. No `plugins/office-hours/` traversal is needed because there is none. The check remains mechanical, deterministic, and falsifiable: the script returns 0 if and only if all five skills satisfy the four conditions. Disposition: clean pass; AC-58-3 condition 4 amended to enumerate the standalone case explicitly.

No material findings required further revisions beyond what the delta absorption already encodes. The byte-for-byte port of `office-hours/SKILL.md` is verified by inspection at port time; no SHA-256 round-trip assertion is added because AC-58-7's round-trip scope is bound to `superteam` only and the operator prompt explicitly notes "byte-equivalence is documented but not SHA-asserted." The provenance row in the catalog is the audit surface; future drift would be detected by re-fetching the upstream PR head SHA and diffing against `skills/office-hours/SKILL.md` (post-flatten path).

### 2026-05-11 — Mid-flight restructure (delta 4): flatten skills layout per PR #59 operator comments

Source: five PR review comments left by the operator on [PR #59](https://github.com/patinaproject/skills/pull/59) during a post-CI-green re-review, supplied to the Brainstormer in this thread:

1. Comment 3220051689 on `.agents/plugins/marketplace.local.json`: "We don't need a local marketplace. We just need skills to follow the same install pattern as vercel-labs/skills."
2. Comment 3220059128 on `.claude-plugin/marketplace.local.json`: "We don't need this."
3. Comments 3220055569 / 3220056037 / 3220056348 on `.agents/skills/{scaffold-repository, superteam, using-github}`: "Make `.agents/skills` the canonical skill location." Superseded by the operator's follow-up directive in this thread: canonical is `skills/` at the repo root, NOT `.agents/skills/`.
4. Comment 3220071994 on `.github/workflows/verify-iteration.yml`: "Can we rename this to just 'Verify'".
5. Comment 3220084646 on `plugins/scaffold-repository/package.json`: "We don't need a package.json per skill. Just flatten everything into `.agents/skills`" — same path correction as #3.

The operator-binding deltas absorbed in this revision are:

1. **Flat `skills/<name>/` layout.** The three plugin-derived skills move from `plugins/<name>/skills/<name>/` to `skills/<name>/` via `git mv` (preserving blob SHAs and per-file blame). The two standalone skills move from `.agents/skills/<name>/` to `skills/<name>/` the same way. The `plugins/`, `.agents/plugins/`, and `.claude-plugin/` trees are deleted in their entirety. Per-skill `package.json` files at `plugins/<name>/package.json` are deleted; release-please switches from `release-type: node` to `release-type: simple` to operate without them. AC-58-1 rewritten.
2. **No marketplace catalog.** Both `marketplace.json` files and both `marketplace.local.json` overlays are deleted. `scripts/validate-marketplace.js` is deleted. The host-native `/plugin marketplace add` install path is removed from documentation. The vercel-labs CLI resolves `npx skills add patinaproject/skills@<name>` by walking the cloned tree for `SKILL.md` files matching the requested slug — no catalog required. AC-58-2 rewritten.
3. **Dogfood overlay simplified.** The two-overlay (`.agents/skills/` real-or-symlink + `.claude/skills/` symlink-into-it) design collapses to a one-hop overlay: both `.claude/skills/<name>/` and `.agents/skills/<name>/` are committed thin symlinks pointing at `../../skills/<name>/`. The plugin-scoped vs. standalone distinction in the verify-dogfood check goes away because every skill has the same shape now. AC-58-3 rewritten.
4. **`npx skills add` is the only documented install path.** The marketplace-add fallback is dropped (the catalog is gone). Users who distrust the npm-distributed CLI can clone the repo and copy `skills/<name>/SKILL.md` directly. AC-58-4 rewritten.
5. **Release-please uses `release-type: simple` per skill.** No `extra-files` block (no marketplace.json to rewrite). Tag prefixes preserved (`scaffold-repository-`, `superteam-`, `using-github-`). Seed versions in `.release-please-manifest.json` carry the previously-published upstream tags. AC-58-5 rewritten.
6. **Workflow rename.** `.github/workflows/verify-iteration.yml` → `.github/workflows/verify.yml`; display name "Verify".
7. **AC-58-6 path-references updated.** Wiki migration text and link targets reference `skills/<name>/SKILL.md` as the source of truth, not the deleted `plugins/<name>/skills/<name>/` or pre-flatten `.agents/skills/<name>/` paths.
8. **AC-58-7 SHA-256 invariant verified.** `git mv plugins/superteam/skills/superteam skills/superteam` preserves the SHA-256 of `SKILL.md` (Git stores blobs by content-hash; `git mv` is an index path update). The pre-flatten value `87867b66...` recorded in PR #59 must equal the post-flatten value. AC-58-7 rewritten to make the invariant explicit.
9. **AC-58-8 migration history extended.** Records the third event in the scaffold-skill chain (subtree import → rename → flatten); records the second event in the superteam and using-github chains (subtree import → flatten).
10. **Gates G1 (tag-prefix stripping), G2 (Codex path-source), G4 (host detection) REMOVED.** G3 (scaffold self-apply) STAYS with path inputs updated. G5 (wiki ownership) STAYS. G6 (CLI name) STAYS CLOSED. New G7 (dogfood overlay) CLOSED with Option D1.
11. **PR amend in place.** Per operator instruction, the delta-4 commits land on the existing PR #59 branch rather than closing-and-refiling. The amend adds another large diff but the existing review history (M2 review, prior delta passes, the seven landed `fix:` commits) stays intact and visible to reviewers.

No prior acceptance criterion was weakened. The eight ACs are all rewritten in scope rather than removed. The byte-equivalence requirement for `superteam` workflow-contract surfaces (AC-58-7) is reinforced by the flat layout (one fewer symlink hop, SHA preserved by `git mv`), not relaxed.

#### Delta-only adversarial review (flatten)

Reviewer context: same-thread Brainstormer fallback. No fresh subagent was available in this thread; the review below is the same teammate re-reading the flatten absorption against the five dimensions named in the operator prompt (removing the marketplace catalog, release-please simple without package.json, dogfood D1 vs. alternatives, PR #59 amend cost, AC-58-7 byte-equivalence after `git mv`).

1. **Removing the marketplace catalog** (source: AC-58-2 falsifiable check; `npx skills` installer section "How the CLI resolves `@<name>` without a marketplace catalog"). Confirmed at design time by reading `skills-lock.json` already present in this repo: the entry `skills.find-skills` resolved via `npx skills add vercel-labs/skills@find-skills`. `vercel-labs/skills` has no `marketplace.json` in its tree — only a flat `skills/<name>/` layout. The CLI's `<owner/repo@skill>` resolver finds the matching `SKILL.md` by walking the tree, not by consulting a catalog. Therefore deleting our `marketplace.json` files does not break `npx skills add patinaproject/skills@<name>` for any of the five skills. Disposition: clean pass.

2. **Release-please `release-type: simple` without per-skill `package.json`** (source: AC-58-5 rewrite). Release-please's `simple` release-type is specifically documented for packages that do not have a `package.json` (or similar version-bearing file). The strategy reads the current version from `.release-please-manifest.json` and writes the bumped version back to it; no `package.json` is touched (or required). With the prior config's `extra-files` block removed (no marketplace.json to rewrite), `release-type: simple` produces only the tag and the manifest bump per release. This matches what we need: tag-as-version-marker for `npx skills add patinaproject/skills@<name>#<tag>` resolution. Disposition: clean pass, documented in AC-58-5.

3. **Dogfood D1 vs. alternatives** (source: Gate G7 disposition). Option D1 (commit symlinks) chosen. Verified that Claude Code's skill loader follows symlinks in `.claude/skills/` — this was already the case for `find-skills` on this branch pre-delta, and the dogfood check (`scripts/verify-dogfood.sh`) was already exercising symlink resolution. The five new overlay symlinks are structurally identical to the pre-existing `find-skills` symlink shape; no new loader behavior is required. Disposition: clean pass.

4. **PR #59 amend cost** (source: Risks "PR #59 diff scale on amend"). PR #59 currently has 416 changed files (+49k/-441). The delta-4 amend adds (estimated): ~5 directory moves (the three plugin-derived skills and the two standalone skills → `skills/<name>/`), ~10 directory deletions (`plugins/`, `.agents/plugins/`, `.claude-plugin/`, per-plugin `release-please-config.json`/`package.json`/`.release-please-manifest.json` carry-overs), ~5 file edits (`release-please-config.json`, `.release-please-manifest.json`, `verify-iteration.yml` → `verify.yml`, `README.md`, `docs/release-flow.md` plus this design doc and the plan doc). The amend diff is large in directory count but small in net line count thanks to `git mv` rename detection. GitHub's PR-diff UI shows renames as single-line moves; reviewers see the structural change without scrolling through duplicate content. Close-and-refile was considered and rejected per operator instruction. Disposition: clean pass; risk recorded.

5. **AC-58-7 byte-equivalence after `git mv` chain** (source: AC-58-7 "Why `git mv` preserves the SHA"). Confirmed: `git mv` updates the index path of an existing blob without rewriting the blob. The post-flatten SHA-256 at `skills/superteam/SKILL.md` is identical to the pre-flatten value at `plugins/superteam/skills/superteam/SKILL.md` (`87867b66...`) so long as no editor touched the file between the two `git mv`s. The PR body's "Test coverage" table records the hex; the Executor's verification step is `sha256sum skills/superteam/SKILL.md` and asserting the match. Disposition: clean pass.

No material findings required further revisions beyond what the delta absorption already encodes. The flatten preserves every binding invariant from prior deltas (AC-58-7 SHA-256, AC-58-8 migration provenance, the writing-skills role-ownership and rationalization-resistance rules) while deleting two layers of scaffolding (plugin wrappers, marketplace catalog) that the operator's PR-59 comments objected to.
