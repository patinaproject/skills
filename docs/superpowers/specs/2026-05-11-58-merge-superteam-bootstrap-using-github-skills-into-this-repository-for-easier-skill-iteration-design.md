# Design: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Summary

Consolidate the `superteam`, `bootstrap`, and `using-github` skills into `patinaproject/skills` as a monorepo of vendored plugins under `plugins/`, renaming the in-tree `bootstrap` copy to `scaffold-repository` so the plugin and skill name match the skill's own description ("Use when scaffolding a new repository..."). Replace the cross-repo `repository_dispatch` bump flow with in-repo `release-please` releases, expose a first-party `npx skills` installer that resolves the marketplace from a published artifact, and migrate non-essential contributor and user docs to the repo's GitHub wiki. After this change, all three skills iterate side-by-side, can be exercised locally from a clone without publishing, and ship through a single release surface that still honors the existing `vX.Y.Z` `ref` pinning rule in both marketplace manifests.

## Goals

- Single repository for the three Patina Project skills with a single PR review surface for changes that touch multiple skills at once.
- Local-first iteration: a fresh clone is sufficient to exercise every skill against itself (the `superteam` orchestration skill must be able to drive a workflow in this repo using the in-repo copy of itself).
- Both marketplace manifests resolve in-repo skills via local paths for development and via the published tag for end users, with no `main`-branch refs leaking into release artifacts.
- `npx skills` is the documented primary install path for both Codex and Claude users, and it resolves to a tagged marketplace artifact, not a moving target.
- A `release-please`-driven release flow replaces `plugin-release-bump.yml` and the cross-repo dispatch in `docs/release-flow.md`, while preserving the existing invariant that every plugin entry in both manifests pins an explicit `vX.Y.Z` tag.
- The contributor and user surface in `docs/` shrinks to what must live in the repo (AGENTS.md, release-flow notes, superpowers design/plan artifacts); everything else moves to the repo wiki and is linked from `README.md` and the marketplace plugin descriptions.
- Workflow-contract surfaces in `superteam` (SKILL.md, agents/, pre-flight, routing-table, project-deltas, workflow-diagrams) remain bit-for-bit equivalent across the move so existing `docs/superpowers/<role>.md` deltas and `AC-<issue>-<n>` patterns keep working.

## Non-Goals

- Redesigning the `superteam`, `bootstrap`, or `using-github` skills themselves. Behavior changes outside what consolidation forces (paths, install commands) are out of scope.
- Adding new skills to the marketplace, or removing any existing entry beyond what the merge requires.
- Rewriting the `obra/superpowers` workflow contract or the SKILL.md `## Done-report contracts`. Those remain authoritative.
- Promoting Claude Code or Codex specifics that are not already in scope of these three skills. (For example, no Cowork integration work.)
- Building a public `npx skills` registry beyond what GitHub Releases and the repo's `package.json` already support.

## Acceptance Criteria

### AC-58-1

After consolidation, `plugins/scaffold-repository/`, `plugins/superteam/`, and `plugins/using-github/` exist in this repository, each containing a complete plugin package equivalent to the corresponding tagged upstream release at the time of merge. The in-tree `bootstrap` plugin is renamed to `scaffold-repository` (plugin folder, skill folder, manifest `name:` fields, and `SKILL.md` frontmatter `name:`); the `superteam` and `using-github` plugin names are unchanged. Each package retains both manifest surfaces (`.codex-plugin/plugin.json` and `.claude-plugin/plugin.json`) and its `skills/<plugin-name>/` directory, so existing consumers (after one tag bump that publishes the renamed plugin under the new slug) see no semantic change in skill content beyond the rename. The canonical workspace overlay at `.agents/skills/<name>/` (see "Canonical skill layout" below) points at the in-package `plugins/<name>/skills/<name>/` tree so the package directory remains the byte-for-byte source of truth.

### AC-58-2

Both marketplace manifests (`.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`) reference the three in-repo plugins through a source mode that resolves to a path inside this repository for in-repo iteration and to a tagged GitHub release artifact for installed users. Manifest entries published in any tagged release pin an explicit `vX.Y.Z` ref consistent with the existing rule in AGENTS.md and `docs/release-flow.md`. No branch refs (`main`, etc.) appear in released manifests.

### AC-58-3

A contributor can clone `patinaproject/skills`, run a documented bootstrap command (e.g. `pnpm install`), and exercise any of the three skills against this repository itself without first publishing or installing from the marketplace. Specifically, the `superteam` skill can drive an issue workflow in this repo using its own in-repo copy, the `scaffold-repository` skill can apply its scaffolding to this repo without reaching the network, and the `using-github` skill's slash commands can be exercised from this clone. Local resolution is documented in `README.md` or `docs/`. Falsifiable checks: (a) `node scripts/validate-marketplace.js` accepts the dev overlay and rejects it in release mode, (b) `scripts/apply-scaffold-repository.js plugins/scaffold-repository` runs against this repo without network access and exits 0, and (c) the dogfood verification below passes.

#### AC-58-3 dogfood verification

A fresh `claude` session opened at the repo root must discover all five in-repo skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`, `office-hours`) via Claude's own skill loader without any user action beyond `git clone`.

Claude Code does not expose a public "list installed skills" CLI command, so this check is mechanized as a file-presence + frontmatter check against the canonical workspace overlay that the loader scans. The check script (`scripts/verify-dogfood.sh`) exits 0 if and only if all four conditions hold:

1. Each path `.claude/skills/<name>/SKILL.md` exists for `name` in `{scaffold-repository, superteam, using-github, find-skills, office-hours}` and resolves (via symlink chain) to a real file. (Test with `test -e` which follows symlinks; reject broken links with `test -L && ! test -e` returning true.)
2. Each resolved file begins with a YAML frontmatter block whose first two non-delimiter keys include `name:` and `description:`, matching the skill loader's contract documented in Claude Code's skill format.
3. The `name:` value in each frontmatter matches the directory name (`name: scaffold-repository` under `.claude/skills/scaffold-repository/`, `name: office-hours` under `.claude/skills/office-hours/`, etc.). For `scaffold-repository` this verifies that the rename touched the SKILL.md frontmatter, not only the directory path.
4. Per-skill target-path expectations differ by skill pattern (see "Canonical skill layout" — plugin-scoped vs. standalone):
   - For the three in-repo **plugin-scoped** skills (`scaffold-repository`, `superteam`, `using-github`), the symlink target resolves under `.agents/skills/<name>/SKILL.md`, which itself resolves under `plugins/<name>/skills/<name>/SKILL.md`.
   - For `find-skills` (vendored via the vercel-labs CLI), the symlink target resolves under `.agents/skills/find-skills/SKILL.md` (where the CLI copied or symlinked it).
   - For `office-hours` (the inaugural **standalone** skill, ported from `patinaproject/patinaproject` PR #1143), the `.claude/skills/office-hours/SKILL.md` symlink target resolves directly to `.agents/skills/office-hours/SKILL.md`, which is itself a **real file**, not a symlink into `plugins/`. The standalone pattern terminates at the canonical workspace overlay; there is no `plugins/office-hours/` wrapper to traverse.

Pass criterion: `scripts/verify-dogfood.sh` exits 0. The check is mechanical and runs in CI on every PR that touches `.claude/skills/**`, `.agents/skills/**`, or `plugins/*/skills/**`. The check is simpler for standalone skills than for plugin-scoped skills (one fewer symlink hop to dereference), and the script branches on whether `.agents/skills/<name>/SKILL.md` is a symlink (plugin-scoped) or a real file (standalone) — both are valid canonical layouts.

### AC-58-4

The primary documented install entry point is `npx skills add patinaproject/skills@<skill>` against the vercel-labs `skills` CLI on npm (Gate G6 resolved CLOSED — this repo publishes no CLI of its own; see Gate G6 disposition). `README.md` and both marketplace manifest descriptions document `npx skills add` as the first-time install path for each of the three skills, alongside the existing `/plugin marketplace add` and `codex plugin marketplace add` paths kept as host-specific fallbacks. The release process pins a tested version range of the upstream `skills` CLI in install instructions (initially `skills@^1.5.6`, the version observed during this design); the docs include the CLI's homepage (`https://github.com/vercel-labs/skills`) and a `package.json` `engines` or equivalent record so install commands remain reproducible.

Falsifiable check: from a fresh temp directory, `npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y` (CLI version pinned at invocation; equivalents for `superteam`, `using-github`, `find-skills`) against this repo's current branch resolves the skill, writes `skills-lock.json`, and produces an installed skill discoverable by Claude Code's loader. The Executor records the command (with the pinned CLI version), the resolved lock entries, and the SHA of the branch the install resolved against in the PR body. CI exercises the same install from a clean working directory against the tagged release once it exists, using the same pinned CLI version recorded in `docs/release-flow.md`.

### AC-58-5

A `release-please` configuration manages versions for the marketplace itself and for each vendored plugin. The configuration is the single source of truth for what `vX.Y.Z` ends up in both marketplace manifests' `ref` fields, and merging the standing release PR is the only path that publishes a new tag. The pre-existing `plugin-release-bump.yml` workflow and the cross-repo `repository_dispatch` step in `docs/release-flow.md` are removed in the same change, with `docs/release-flow.md` rewritten to describe the new flow. Bot-generated `release-please--*` PRs are the documented exception to the issue-tag rule that already covers `bot/bump-*` PRs in AGENTS.md. The release-please package key for the scaffold plugin is `plugins/scaffold-repository` (not `plugins/bootstrap`), and the per-package tag prefix is `scaffold-repository-` (not `bootstrap-`), so the first post-merge release of that plugin will produce a tag of the form `scaffold-repository-vX.Y.Z`. The scaffold self-apply step that previously existed as a TODO in `plugin-release-bump.yml` (and was named after `bootstrap`) is either implemented as `scripts/apply-scaffold-repository.js` invoked from the new release workflow when `plugins/scaffold-repository/` is part of the release, or explicitly deferred in `docs/release-flow.md` with a tracked follow-up issue — the design forbids leaving it as an undocumented TODO. The corresponding `package.json` script name in the marketplace repo follows: `apply:scaffold-repository` (the prior shorthand `apply:bootstrap` is removed).

### AC-58-6

Contributor and user documentation that does not need to live in the repository is migrated to the repository's GitHub wiki. `docs/` retains AGENTS.md, the rewritten release-flow notes, and the `superpowers/` design and plan artifacts. `README.md` and the marketplace manifest descriptions link the wiki for install walkthroughs, troubleshooting, and per-skill usage notes. The wiki migration is documented in this design and recorded as part of the issue's plan handoff, not done implicitly. The `office-hours` standalone skill gets its own wiki page following the same per-skill pattern as the three plugin-scoped skills: a usage walkthrough (covering Startup-mode vs. Builder-mode entry points), a "when to invoke" trigger summary lifted from the SKILL.md description, and a pointer back to `.agents/skills/office-hours/SKILL.md` as the source of truth. The wiki page does **not** repeat the SKILL.md body — it links to it — so the SKILL.md remains the byte-for-byte port from the upstream PR and the wiki page is free to evolve as user-facing onboarding material.

### AC-58-7

The workflow-contract surfaces in `plugins/superteam/skills/superteam/` (SKILL.md, agents/, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md`) are present at the new path and reachable by both hosts under the documented local resolution scheme, so an in-repo `/superteam` run on this repo resolves the same SKILL.md it would after a marketplace install. The non-negotiable-rules SHA-256 prefix computed by `Team Lead` during `resolve_role_config` for each shipped role matches between the pre-consolidation tag and the post-consolidation `plugins/superteam` copy, demonstrating no silent edit slipped in during the move.

**Scope of the SHA-256 round-trip:** the byte-equivalence assertion in this AC covers `plugins/superteam/skills/superteam/SKILL.md` (and the `agents/`, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md` surfaces alongside it) **only**. The `scaffold-repository` plugin's `SKILL.md` is **exempt** from any SHA-256 round-trip assertion: the rename delta deliberately rewrites the in-tree SKILL.md frontmatter (`name: bootstrap` → `name: scaffold-repository`), the plugin manifests' `name:` and keyword fields, the install commands documented in the body, and any `bootstrap`-as-plugin-name references inside the file. The upstream archived repo at `patinaproject/bootstrap@v1.10.0` remains the byte-for-byte reference for anyone who needs to audit pre-rename content; the rename is auditable as a single review of the diff between that tag and the renamed in-tree copy. The same exemption applies to `plugins/using-github/skills/using-github/SKILL.md` — only `superteam` is bound by the SHA-256 round-trip rule because only `superteam`'s `Team Lead` consumes that hash as a runtime contract.

### AC-58-8

The merge approach for the three source repositories is explicitly chosen and documented: whether Git history is preserved (e.g. `git subtree add` per source repo, or `git filter-repo` + merge) or whether the merge is a content-only import with a single conventional commit. The choice is recorded in this design with rationale, and the plan derived from this design follows the choice without revisiting it. Either way, the three source repos remain readable as archived references for at least one release cycle after consolidation. The migration history record produced by this AC notes **both** events for the scaffold plugin: (a) the `git subtree add --prefix=plugins/bootstrap patinaproject/bootstrap v1.10.0` import (already on the branch as commit `912d6d9`), and (b) the follow-up `git mv plugins/bootstrap plugins/scaffold-repository` rename commit landed during execution. The upstream `patinaproject/bootstrap` repository keeps its original name and `v1.10.0` tag as the archived reference; the rename is local to the imported copy in this repository only.

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

### Option A: Monorepo with `release-please` per-package, local marketplace via JSON `path` source

Vendor each plugin under `plugins/<name>/` exactly as the upstream package is laid out today (`.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `skills/<name>/`). Add a `release-please-config.json` and `.release-please-manifest.json` that treat each `plugins/<name>/` as its own release-please package, plus a top-level package for the marketplace itself. Both manifest files gain a development-only resolution rule: when present, the marketplace validator reads a sibling `marketplace.local.json` overlay that points each `source` at `plugins/<name>` relative to the repo root. The published `marketplace.json` always pins `vX.Y.Z` tags. `npx skills` is a tiny CLI published from `package.json` that calls the host's marketplace-add command with the latest `vX.Y.Z` release of this repo. History is preserved via `git subtree add --prefix=plugins/<name>` for each source repo so per-file blame still resolves.

### Option B: Monorepo with a single combined version, no per-package release-please

Vendor under `plugins/<name>/` the same way, but version the whole repository on a single `vX.Y.Z` line and bump all three plugin entries' refs in lockstep on every release. Simpler tooling, but it forces every release to claim all three skills changed, which weakens semver signal for downstream consumers and conflicts with the existing per-plugin release history.

### Option C: Content-only merge, drop manifests

Inline the three skills directly under a top-level `skills/` directory and drop the per-plugin `.codex-plugin` / `.claude-plugin` manifests in favor of a single repo-level plugin manifest. Fastest to implement, but it breaks the marketplace's per-plugin install surface, forces users into an all-or-nothing install, and loses the upstream package identity that the validator and ecosystem rely on.

**Selected approach: Option A.** It preserves per-plugin identity and per-plugin semver, it keeps the existing validator's `vX.Y.Z` rule machine-checkable, and it gives `Team Lead`'s SHA-256 audit a clean round-trip target. The marketplace manifests in released artifacts still pin tags; the local-path overlay only exists during development.

## Proposed file layout

```text
patinaproject/skills/
  .agents/plugins/marketplace.json         # released: vX.Y.Z refs (unchanged schema)
  .claude-plugin/marketplace.json          # released: vX.Y.Z refs (unchanged schema)
  .agents/plugins/marketplace.local.json   # dev overlay: path-based, excluded from packaged releases
  .claude-plugin/marketplace.local.json    # dev overlay: path-based, excluded from packaged releases
  .agents/skills/                          # CANONICAL workspace overlay (symlink targets; not packaged)
    scaffold-repository  -> ../../plugins/scaffold-repository/skills/scaffold-repository
    superteam            -> ../../plugins/superteam/skills/superteam
    using-github         -> ../../plugins/using-github/skills/using-github
    find-skills/                           # installed via `npx skills add vercel-labs/skills@find-skills`
      SKILL.md
  .claude/skills/                          # Claude Code skill loader path (symlinks into .agents/skills/)
    scaffold-repository  -> ../../.agents/skills/scaffold-repository
    superteam            -> ../../.agents/skills/superteam
    using-github         -> ../../.agents/skills/using-github
    find-skills          -> ../../.agents/skills/find-skills
  skills-lock.json                         # committed; produced by vercel-labs skills CLI for reproducible re-installs
  plugins/
    scaffold-repository/                   # renamed from `bootstrap` per Plugin rename section below
      .codex-plugin/plugin.json            # "name": "scaffold-repository"
      .claude-plugin/plugin.json           # "name": "scaffold-repository"
      skills/scaffold-repository/...       # PACKAGE SOURCE OF TRUTH (shipped to consumers); SKILL.md frontmatter "name: scaffold-repository"
      package.json                         # name: scaffold-repository, version: managed by release-please
      CHANGELOG.md                         # managed by release-please
    superteam/
      .codex-plugin/plugin.json
      .claude-plugin/plugin.json
      skills/superteam/
        SKILL.md
        agents/...
        pre-flight.md
        routing-table.md
        project-deltas.md
        workflow-diagrams.md
      package.json
      CHANGELOG.md
    using-github/
      .codex-plugin/plugin.json
      .claude-plugin/plugin.json
      skills/using-github/...
      package.json
      CHANGELOG.md
  release-please-config.json
  .release-please-manifest.json
  scripts/
    validate-marketplace.js                # extended: also lints marketplace.local.json schema when present and
                                           # asserts overlay symlinks are absent from release-mode publish paths
    apply-scaffold-repository.js           # replaces the TODO step in plugin-release-bump.yml; in-repo invocation of plugins/scaffold-repository
                                           # (renamed from apply-bootstrap.js per Plugin rename section below)
    verify-dogfood.sh                      # AC-58-3 dogfood check (file-presence + frontmatter)
  docs/
    AGENTS.md
    release-flow.md                        # rewritten for release-please; documents vercel-labs CLI version pin
    file-structure.md                      # rewritten for the new layout and canonical overlay
    superpowers/specs/...
    superpowers/plans/...
  .github/workflows/
    release-please.yml                     # replaces plugin-release-bump.yml
    lint-md.yml                            # unchanged
    lint-pr.yml                            # unchanged
    lint-actions.yml                       # unchanged
    verify-iteration.yml                   # runs validator (--dev / release), apply-scaffold-repository, verify-dogfood.sh
```

Note the absence of a `packages/skills-cli/` directory: Gate G6 (CLOSED) removed it. The vercel-labs CLI is consumed via `npx`, not republished.

The wiki carries everything that used to live in per-plugin `README.md` install walkthroughs, user-facing troubleshooting, and any non-design tutorial content.

## Canonical skill layout

This repo has three concentric surfaces for skill content. The package source of truth lives inside each plugin. Two top-level overlays project it onto the surfaces this repo's own Claude and Codex sessions actually scan:

```text
plugins/<name>/skills/<name>/SKILL.md   <-- package source of truth (shipped to consumers)
  ^
  | symlink (workspace overlay; not packaged)
  |
.agents/skills/<name>/SKILL.md          <-- canonical workspace overlay (single source for both hosts)
  ^
  | symlink
  |
.claude/skills/<name>/SKILL.md          <-- Claude Code skill loader path (local-iteration only)
```

Rationale:

- `plugins/<name>/skills/<name>/` is what marketplace consumers receive when they install via `npx skills add patinaproject/skills@<name>` or via either host's `/plugin marketplace add` command. For `superteam` and `using-github` it remains byte-equivalent to the upstream tag content per AC-58-7. For `scaffold-repository` it is byte-equivalent to the upstream `patinaproject/bootstrap@v1.10.0` import **except for the rename surfaces** documented in the Plugin rename section below (folder names, manifest `name:` fields, SKILL.md `name:` frontmatter, and `bootstrap`-as-plugin-name references inside the SKILL.md body); the SHA-256 round-trip in AC-58-7 does not bind the scaffold plugin.
- `.agents/skills/<name>/` is the **canonical workspace overlay**. The directory name uses `.agents` with the `s` (matching `.agents/plugins/marketplace.json` already in the repo). This is the layer the design treats as the single overlay surface; Codex stays under `.agents/` per repo convention. Each of `scaffold-repository`, `superteam`, `using-github`, and `find-skills` gets an entry here.
- `.claude/skills/<name>/` is a thin symlink layer pointing into `.agents/skills/<name>/`. Claude Code's skill loader scans `.claude/skills/**/SKILL.md`, so this layer exists solely so this repo's own Claude sessions discover the four in-repo skills without any user action beyond `git clone`. Codex's loader does not require a parallel `.codex/skills/` directory because `.agents/skills/` already lives under a Codex-prefixed root.
- Symlinks are **dev-time iteration aids only**. They are excluded from the packaged release surface (see Risks; see Workstream 4 in the plan). The `release-please` `extra-files` rewrites and the `npm` `files` allowlists must not include these overlay paths.

The vercel-labs `skills` CLI defaults to copying skill content when `--agent <agent>` is passed and to symlinking otherwise. For the dogfood overlay we want the symlink behavior because it keeps `plugins/<name>/skills/<name>/SKILL.md` as the sole edit target. The `find-skills` skill installed via `npx skills add vercel-labs/skills@find-skills --agent claude-code -y` produced a copy plus a `skills-lock.json`; the canonical-layout reconciliation step (Plan W2.x) moves the copied content into `.agents/skills/find-skills/` and replaces the CLI-created `.claude/skills/find-skills/` directory with a symlink into the canonical path. `skills-lock.json` stays at the repo root (its CLI-chosen location) and is committed so subsequent `npx skills` operations are reproducible.

For Codex the overlay is consumed in two ways:

1. As a marketplace dev overlay (`marketplace.local.json`) declaring `path:` sources pointing at `plugins/<name>` (per Gate G2). This is the install-equivalent path.
2. As a directory `.agents/skills/<name>/` containing the same SKILL.md, so Codex's skill discovery sees the in-repo content without going through the marketplace at all.

### Standalone skills

This repo supports **two** skill patterns side-by-side. The plugin-scoped pattern documented above is one. The other — **standalone skills** — was introduced during the office-hours port and is documented here so future contributors choose the right shape for new content.

**Plugin-scoped skill** (the default; example: `scaffold-repository`, `superteam`, `using-github`):

- Lives at `plugins/<name>/skills/<name>/SKILL.md` (the package source of truth).
- Ships inside a plugin package that carries both `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json` manifests, plus a `package.json` managed by `release-please`.
- Has an entry in both marketplace manifests (`.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`), pinned to a per-package `vX.Y.Z` tag via the `release-please` per-package tag prefix.
- Reachable via `npx skills add patinaproject/skills@<name>` (the vercel-labs CLI walks the marketplace manifest to resolve `<name>` to the plugin's slug).
- Reachable via host-native marketplace-add (`/plugin marketplace add patinaproject/skills` for Claude, `codex plugin marketplace add patinaproject/skills --ref vX.Y.Z` for Codex).
- The canonical workspace overlay `.agents/skills/<name>/` is a **symlink** into `plugins/<name>/skills/<name>/`.

**Standalone skill** (introduced by office-hours; example: `office-hours`):

- Lives at `.agents/skills/<name>/SKILL.md` as a **real file**, not a symlink. The canonical workspace overlay path is itself the source of truth.
- Has no `plugins/<name>/` wrapper directory, no per-plugin manifests, no `package.json`.
- Is **not** an entry in either marketplace manifest. Marketplace manifests describe plugins; a single-file skill with no wrapping plugin manifest is not a plugin. This is intentional: a standalone skill is too lightweight to warrant the per-package release-please machinery, and the vercel-labs CLI's `<owner/repo@skill>` resolver works against `SKILL.md` files discovered by scanning the repo, not exclusively against marketplace-manifest plugin slugs.
- Reachable via `npx skills add patinaproject/skills@<name>` — the vercel-labs CLI scans the repo tree for `SKILL.md` files whose frontmatter `name:` matches `<name>` and resolves to the first match. For `office-hours`, the CLI finds `.agents/skills/office-hours/SKILL.md` (frontmatter `name: office-hours`) and installs from there. Host-native marketplace-add does **not** cover standalone skills — those users must use the vercel-labs CLI or copy the SKILL.md manually.
- Is **not** a `release-please` package. It is versioned with the repository itself: the SKILL.md content moves only when a commit on the default branch changes it, and consumers who install via `npx skills add patinaproject/skills@<name>` (no `@<ref>` qualifier) resolve to the default-branch HEAD at install time. Consumers wanting a pinned version pass `npx skills add patinaproject/skills@<name>#<git-ref>` where `<git-ref>` is a commit SHA, branch, or repo-level tag. Documenting this resolution behavior in `README.md` is part of AC-58-4's docs scope.
- The Claude Code symlink layer `.claude/skills/<name>/` points directly at `.agents/skills/<name>/` (one symlink hop, not two), and Codex sees the same content via its `.agents/skills/` scan.

**Why the dual pattern is acceptable rather than a smell:** the plugin-scoped pattern carries non-trivial overhead — two manifests, a release-please package, a marketplace entry, a per-plugin tag prefix — justified for skills that bundle assets, scripts, sub-skills, or multi-file workflow contracts (the three plugins we already vendor all qualify). The standalone pattern is the minimum viable shape for a single-file `SKILL.md` that has none of those needs. Forcing every new skill through the plugin wrapper would discourage small contributions and inflate release-please churn. Forcing every existing plugin to flatten into a standalone skill would lose the marketplace install surface and the per-plugin tagged release history. Each new skill picks the shape that fits its content; the decision is recorded in the skill's introductory commit message.

**Migration between patterns is reversible.** A standalone skill that grows assets or sub-skills can be promoted to a plugin-scoped skill in a follow-up PR: `git mv .agents/skills/<name>/SKILL.md plugins/<name>/skills/<name>/SKILL.md`, add the two plugin manifests + `package.json`, add the marketplace entries, replace `.agents/skills/<name>/SKILL.md` with a symlink into `plugins/<name>/`. The reverse promotion (plugin → standalone) is similarly mechanical if a plugin shrinks to a single file. No data is lost in either direction.

**Inaugural standalone skill: `office-hours`.** Ported from `patinaproject/patinaproject` PR #1143 at head SHA `02e6ebbdbef123bbeb211fad06aa86bd5e33528a`. The skill is a YC-style office-hours conversation partner with two modes (Startup and Builder) and produces a design doc rather than code. It is general-purpose and fits this repo's scope (it is not Patina-app-specific despite the upstream attribution); the body intentionally references generic Patina conventions (e.g. `CLAUDE.md`, `AGENTS.md`, `docs/`) which are present in this repo as well. The port is byte-for-byte: the `SKILL.md` in this repo at `.agents/skills/office-hours/SKILL.md` is identical to the file at the upstream PR head SHA. Source provenance is recorded in the "Ported skills" subsection of the migration history catalog below.

## In-repo iteration: local-path marketplace resolution

The two manifests in their released form continue to declare `vX.Y.Z` refs against this repository. For local development, a contributor runs the host's marketplace-add command pointed at the working tree instead. Two surfaces support this:

1. A development overlay file (`marketplace.local.json` in each marketplace directory) declares a `path:` source for each plugin entry, e.g. `"source": { "source": "path", "path": "../../plugins/superteam" }` for Codex and the Claude analogue. The overlay is gitignored from packaged releases but tracked in-repo so contributors get it on clone. The validator gains an explicit mode for the overlay that skips the `vX.Y.Z` rule and instead asserts each `path` resolves to a `plugins/<name>/` directory with both per-plugin manifests present.
2. `npx skills --dev` (added under `packages/skills-cli/`) registers the local overlay against the active host so a clone is sufficient. The default `npx skills` (no `--dev`) targets the published tag. The CLI's two modes are documented in `README.md` and in the wiki install walkthrough.

For the `superteam` skill specifically, in-repo iteration must not introduce path drift inside a single `/superteam` run. The CLI's `--dev` mode registers a stable absolute path resolved at registration time, and `superteam`'s pre-flight host-probe order is unchanged: probing remains a runtime aid, not a substitute for the locked SKILL.md at the registered path. `Team Lead`'s `resolve_role_config` SHA-256 prefix is computed against the SKILL.md at that path, identical to a marketplace-installed copy.

## `npx skills` installer (adopted from vercel-labs)

Gate G6 is **CLOSED**: the bare npm name `skills` is taken by `vercel-labs/skills` (`skills@1.5.6` at design time), a fully capable CLI that already supports `add <owner/repo@skill>`, `init`, `find`, `experimental_sync`, and per-agent (`--agent claude-code`, `--agent codex`, etc.) install. This repo therefore **does not author or publish its own `skills` CLI.** Workstream 5 in the prior plan is replaced by an integration workstream covering manifest descriptions, README, and documentation updates — no new package, no new `bin`.

User-facing install pattern (CLI version pinned at invocation; `--ignore-scripts` via env var as a defense-in-depth default):

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@superteam           --agent claude-code -y
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@using-github        --agent claude-code -y
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@find-skills         --agent claude-code -y   # already installed pre-delta; documented for fresh clones
```

The `<owner/repo@skill>` syntax resolves against the published GitHub repository. The CLI walks the repo's plugin structure, finds the named skill, and either symlinks (no `--agent`) or copies (with `--agent`) the content into the agent's expected skill directory. `skills-lock.json` records the resolved skill SHA so subsequent re-installs reproduce the same content. The `skills@<version>` segment in the `npx` invocation is what pins the CLI itself; updating that version is a deliberate act recorded in `docs/release-flow.md`.

**Supply-chain considerations (raised during delta review):**

- The CLI is a third-party dependency. The README install instructions pin a tested CLI **version at invocation** (e.g. `npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y`), not just a recommended version range in prose. `npx <package>@<version>` resolves to that exact version regardless of the npm `latest` dist-tag at run time; this is the only way to prevent silent CLI drift between the README and the user's actual install. The docs include both the upstream repo URL (`https://github.com/vercel-labs/skills`) and the tested version's published-to-npm date so a contributor verifying the install can confirm they're pulling the same artifact this design exercised. Updates to the pinned CLI version are a deliberate act: bump the README's `skills@<version>` and re-run the dogfood check (`scripts/verify-dogfood.sh`) before merging.
- `npx skills add` should be run with `--ignore-scripts` where the host shell supports it (`npm_config_ignore_scripts=true npx skills@<pinned> add ...`). The README documents this env-var-prefix form as the **default** invocation (not a footnote), so users copy-paste the safer form by default. The trade-off is that postinstall scripts are disabled; the vercel-labs CLI currently has none, but this is defense-in-depth against a future compromise.
- `skills-lock.json` (produced by the CLI and committed) pins the resolved **skill** SHA, not the **CLI** version. CLI-version pinning lives in the install command syntax (above) and in `docs/release-flow.md`. The two pins together are what make the install reproducible.
- The marketplace manifests continue to pin `vX.Y.Z` refs for the repo itself. A user who distrusts the npm-distributed CLI can fall back entirely to `/plugin marketplace add patinaproject/skills` (Claude Code) or `codex plugin marketplace add patinaproject/skills --ref vX.Y.Z` (Codex). The vercel-labs CLI is the **primary** documented path, not the only one.
- If the upstream `vercel-labs/skills` package is unpublished or rewritten in a way that breaks the documented install pattern, the fallback is the marketplace-add path above. The repo's `docs/release-flow.md` records this as the documented rollback.

Host detection / auto-invocation: out of scope here (Planner's Gate G4 carried this; with the vercel-labs CLI doing the heavy lifting, host detection is the CLI's concern, not ours).

## Migration approach: history preservation

History is preserved via `git subtree add --prefix=plugins/<name> <upstream-remote> <tag>` for each of the three source repos at their current tagged versions (`bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`). This keeps per-file blame intact across the move and gives the SHA-256 round-trip check a defensible base. The three upstream repos are archived (not deleted) on completion and their `README.md` is updated to point at this repo. Archiving rather than deleting protects against link-rot from older marketplace consumers and lets the issue's plan recover from a botched merge if needed.

The first consolidation commit is a single non-conventional merge introducing all three `plugins/<name>/` trees from their archived tags. The `plugins/bootstrap/` subtree (commit `912d6d9`) is then renamed to `plugins/scaffold-repository/` in a dedicated `git mv` commit before any follow-up edits land; this ordering preserves per-file blame across the rename via Git's rename detection. The upstream `patinaproject/bootstrap` repo keeps its name and `v1.10.0` tag — the rename lives in this repository only. Conventional commits that follow wire up `release-please`, the dev overlay, the workflow replacement, and the doc rewrites. Each follow-up commit pairs with one or more `AC-58-<n>` IDs in the PR body, per AGENTS.md.

### Ported skills

The plugin-scoped skills (`scaffold-repository`, `superteam`, `using-github`) are imported via `git subtree add` as documented in the previous paragraph. Standalone skills are ported via copy-then-attribute and recorded here for provenance. Byte-equivalence is **documented** but only `superteam` is **SHA-asserted** in CI (per AC-58-7's round-trip scope); standalone-skill byte-equivalence is verified at port time by inspection and recorded for future audit.

| Skill | Source repo | Source PR | Source SHA | Target path | Port commit | Attribution surface |
| --- | --- | --- | --- | --- | --- | --- |
| `office-hours` | `patinaproject/patinaproject` | [PR #1143](https://github.com/patinaproject/patinaproject/pull/1143) | `02e6ebbdbef123bbeb211fad06aa86bd5e33528a` | `.agents/skills/office-hours/SKILL.md` | TBD (Executor records the absorbed commit SHA here on land) | This subsection (migration history catalog) |

Attribution for ported standalone skills is centralized in this catalog rather than added as a `Source:` header line inside each `SKILL.md`. Rationale: (a) the SKILL.md is the user-facing artifact and headers above the YAML frontmatter would confuse the skill loader's frontmatter parser; (b) adding a comment inline below the frontmatter would deviate from the upstream byte-for-byte port; (c) a single catalog is easier to audit when multiple standalone skills are ported in future. The decision can be revisited if catalog drift becomes a problem in practice.

**Licensing.** Both source repositories (`patinaproject/patinaproject` and this repo, `patinaproject/skills`) are Patina Project-owned. Skill content authored in one Patina repo is freely portable into another Patina repo without an explicit license note beyond this provenance catalog entry. If a future port pulls from a third-party repo, the catalog row should add an explicit license column citing the source's `LICENSE` file and a verification that the license permits the port (e.g. MIT, Apache 2.0, CC-BY).

## Plugin rename: `bootstrap` -> `scaffold-repository`

The in-tree copy of the `bootstrap` plugin imported from `patinaproject/bootstrap@v1.10.0` is renamed to `scaffold-repository` as part of this consolidation. The upstream repository keeps its name; only the in-tree copy and its consumer-visible surfaces are renamed. The rename is internally consistent with the skill's own description ("Use when scaffolding a new repository..."), which already uses the verb `scaffold`.

### Rename surface catalog

The Planner and Executor must touch each of the following surfaces. Items marked "byte-equivalent except rename" mean the file content is preserved verbatim from the upstream `v1.10.0` import; only the listed strings are edited.

**Filesystem paths:**

- `plugins/bootstrap/` → `plugins/scaffold-repository/`
- `plugins/bootstrap/skills/bootstrap/` → `plugins/scaffold-repository/skills/scaffold-repository/`
- `plugins/bootstrap/skills/bootstrap/SKILL.md` → `plugins/scaffold-repository/skills/scaffold-repository/SKILL.md`

**Plugin manifests (inside the renamed plugin):**

- `plugins/scaffold-repository/.claude-plugin/plugin.json` — `name`, `keywords` (drop the `bootstrap` keyword in favor of `scaffold-repository`; the existing `scaffold` keyword stays), `homepage`, `repository` (homepage and repository continue to point at `patinaproject/bootstrap` while it exists as the archived upstream; if/when the upstream is renamed or redirected, these update in a follow-up)
- `plugins/scaffold-repository/.codex-plugin/plugin.json` — `name`, `keywords`, `interface.displayName` (`Bootstrap` → `Scaffold Repository`), `interface.shortDescription`, `interface.longDescription`, `interface.defaultPrompt` (rewrite `$bootstrap` → `$scaffold-repository` in each prompt string), `homepage`, `repository`
- `plugins/scaffold-repository/package.json` (if present) — `name`

**Plugin SKILL.md (inside the renamed plugin):**

- Frontmatter `name:` value `bootstrap` → `scaffold-repository`
- Frontmatter `description:` — trigger phrases revised: `"bootstrap this repo"` → `"scaffold this repo"`; the upstream phrase `"scaffold a Patina plugin"` stays as-is. Other trigger phrases (`"realign with the baseline"`, `"audit our repo conventions"`, `"set up commitlint and husky"`, `"add Codex/Cursor/Windsurf surfaces"`) are unchanged.
- H1 heading `# bootstrap` → `# scaffold-repository`
- Body references to the plugin name (e.g. the opening sentence `` `bootstrap` scaffolds a repository... `` → `` `scaffold-repository` scaffolds a repository... ``) — all in-tree references to "bootstrap" as a plugin name are rewritten.
- References to the upstream repo URL (`https://github.com/patinaproject/bootstrap`) are preserved because that URL still resolves to the archived upstream.

**Marketplace manifests (root of this repo):**

- `.agents/plugins/marketplace.json` — plugin entry `slug` `bootstrap` → `scaffold-repository`; `name` / `displayName` follow; `description` updated to remove the standalone word "Bootstrap" as plugin label; `source.path` (dev overlay) and `source.ref`-based variant updated to point at `plugins/scaffold-repository`
- `.claude-plugin/marketplace.json` — same fields updated in the Claude schema
- Both `marketplace.local.json` dev overlays — `path` entries updated to `plugins/scaffold-repository`

**Canonical workspace overlay:**

- `.agents/skills/bootstrap` (symlink, if it ever existed) removed
- `.agents/skills/scaffold-repository` (symlink) created pointing at `../../plugins/scaffold-repository/skills/scaffold-repository`
- `.claude/skills/bootstrap` (symlink, if it ever existed) removed
- `.claude/skills/scaffold-repository` (symlink) created pointing at `../../.agents/skills/scaffold-repository`

**Scripts and pnpm wiring:**

- `scripts/apply-bootstrap.js` → `scripts/apply-scaffold-repository.js`
- `package.json` script names: `apply:bootstrap` → `apply:scaffold-repository` (and any other `:bootstrap` shorthand introduced by Workstream 2)
- Any CI workflow step that references the script path or pnpm script name follows

**Release-please configuration:**

- `release-please-config.json` — package key `plugins/bootstrap` → `plugins/scaffold-repository`; `package-name` `bootstrap` → `scaffold-repository`; `tag-format` includes `scaffold-repository-v${version}` (or the equivalent in the chosen monorepo config shape)
- `.release-please-manifest.json` — entry key `plugins/bootstrap` → `plugins/scaffold-repository`; the seed version carries the previously-published `1.10.0`

**Documentation:**

- `README.md` — quickstart commands, links table, headings
- `docs/release-flow.md` — every reference to the `bootstrap` plugin name, including the rewrite of the self-apply step
- `docs/file-structure.md` — the `plugins/` table entry
- `AGENTS.md` — the marketplace section's plugin enumeration; the per-plugin install examples; the source-of-truth boundary discussion
- This design doc — already revised per the rename delta
- `docs/superpowers/plans/2026-05-11-58-...-plan.md` — Planner absorbs the rename in its next pass; renamed-surface checklist is the implementation guide
- GitHub wiki pages — any per-plugin install walkthrough or troubleshooting article that names `bootstrap` as a plugin is renamed in the wiki migration step (Wiki migration plan section). The wiki landing-page link in the marketplace manifest entry follows.

**SKILL.md trigger-phrase decision (recorded explicitly):** the upstream SKILL.md body uses the verb `bootstrap` in a single trigger phrase (`"bootstrap this repo"`). The rename rewrites that phrase to `"scaffold this repo"`. Rationale: (a) the in-tree SKILL.md is the user-facing artifact post-rename and must surface the new plugin name in its triggers for discoverability, (b) the upstream archived copy at `patinaproject/bootstrap@v1.10.0` preserves the original wording for anyone auditing the pre-rename version, (c) AC-58-7's SHA-256 round-trip binds `superteam` only — the scaffold plugin SKILL.md is explicitly exempt and free to be edited within the rename surface listed above. The "Plugin rename" PR diff includes the SKILL.md word-level edits as a reviewable change.

**Out of scope for the rename (preserved as-is):**

- `patinaproject/bootstrap` upstream repository name, `v1.10.0` git tag, and history. The upstream is archived (per AC-58-8) but not renamed.
- The word "bootstrap" used in **unrelated contexts**: `pnpm install` referred to as a "bootstrap command" in AC-58-3, Husky bootstrap hooks, the verb in commit message templates like `chore: bootstrap commit hooks`, and similar generic English usage. The Planner's search-and-replace must be word-boundary aware and avoid blast-radius rewrites in these unrelated occurrences.
- Search blast-radius safeguard: prefer `rg -F 'bootstrap'` with manual triage over a `sed -i` global replace; the rename happens in a finite list of surfaces enumerated above, not across the whole tree.

## `release-please` configuration shape

- Monorepo mode with three packages: `plugins/scaffold-repository`, `plugins/superteam`, and `plugins/using-github`. Per Gate G6 (CLOSED), no `packages/skills-cli` is published from this repo; the vercel-labs CLI is consumed via `npx`.
- Each plugin package gets independent semver based on its own conventional commits (commits whose path falls under `plugins/<name>/` map to that package).
- `release-please` produces tags `scaffold-repository-v1.11.0`, `superteam-v1.6.0`, `using-github-v2.1.0`, etc. The marketplace manifests pin per-plugin `vX.Y.Z` refs derived from the per-plugin tag (the per-package prefix `scaffold-repository-` / `superteam-` / `using-github-` is stripped to match the manifest's existing `vX.Y.Z` regex). The release-please workflow extends the existing validator's checks to assert that mapping.
- **Tag prefix collision check:** the chosen prefix `scaffold-repository-` is unambiguous against the existing prefixes (`superteam-`, `using-github-`) under a longest-match strip rule. The Planner G1 gate's `^(scaffold-repository|superteam|using-github)-v(\d+\.\d+\.\d+)$` regex applies; the trailing `v\d+\.\d+\.\d+` is the produced ref. No existing tag in the marketplace repo uses the `scaffold-repository-` prefix (verified at design time), so the first emitted tag `scaffold-repository-v1.11.0` (or whichever bump release-please derives from the rename commit) is unambiguous.
- The "release-please-action" step opens release PRs from `release-please--*` branches; AGENTS.md is updated to list this prefix alongside `bot/bump-*` as the only no-issue PRs.
- The scaffold-repository self-application step that today lives as a TODO in `plugin-release-bump.yml` becomes `scripts/apply-scaffold-repository.js` invoked from the release-please workflow when `plugins/scaffold-repository/` is part of the release. The same workflow signs commits as `github-actions[bot]` and enables auto-merge, preserving the existing signing/auto-merge guarantees described in `docs/release-flow.md`.
- `scripts/validate-marketplace.js` keeps its `vX.Y.Z`-only check for the released manifests. The dev overlay's `path:` entries are validated against the working tree only.

## Wiki migration plan

Move to the wiki:

- Per-host install walkthroughs (Claude Code, Codex) with screenshots
- Per-skill usage examples and FAQs that today live in upstream `README.md`s
- Troubleshooting notes for `npx skills`, marketplace upgrades, and host detection
- The "how superteam runs end-to-end" narrative currently in `patinaproject/superteam/README.md`

Keep in the repo:

- `AGENTS.md` (root) and the existing `CLAUDE.md` import shim
- `docs/release-flow.md` (rewritten for release-please)
- `docs/file-structure.md` (rewritten for `plugins/`, `packages/`, and overlay files)
- `docs/superpowers/specs/` and `docs/superpowers/plans/`
- `README.md` reduced to: one-paragraph repo description, `npx skills` quickstart, links to the wiki for everything else, and a links table for the three skills

Marketplace manifest descriptions link the wiki landing page for each plugin so install pages in Claude Code and Codex surface the migration target naturally.

## Open questions

1. **Per-plugin tag prefix vs. unified tag line.** `release-please` monorepo mode emits prefixed tags by default (`scaffold-repository-v1.11.0`). The existing manifest validator regex is `^v(\d+\.\d+\.\d+)$`. The plan must extend the validator or strip the prefix when writing manifests. Either is fine; flagging so the Planner picks one explicitly rather than the Executor improvising.
2. **Codex `path:` source support.** Confirm Codex's marketplace manifest accepts a path-style source equivalent to Claude's. If it does not, the dev overlay for Codex may need to fall back to a `git+file://` URL or a `--ref local` convention; the Planner should validate against the current Codex release before locking in the overlay schema.
3. **Scaffold-repository self-apply during release.** Today the scaffold self-apply is a TODO step in the legacy `plugin-release-bump.yml`. The plan must decide whether `scripts/apply-scaffold-repository.js` runs every release or only on `plugins/scaffold-repository/` releases, and whether the result is committed to the release-please PR branch or to a follow-up PR.
4. **CLI host detection robustness.** Resolved by adopting the vercel-labs `skills` CLI (Gate G6 closed). Host detection is the upstream CLI's concern. Auto-invocation from this repo is not in scope.
5. **Wiki content ownership.** Wikis are not branch-protected. The plan should decide whether wiki content has an "owner of record" in `docs/` (e.g. a `docs/wiki-sources/` folder that the wiki mirrors from), or whether the wiki is the canonical surface. Recommendation: canonical wiki, with a single doc in `docs/` listing the wiki pages that exist so review of wiki link-rot stays in-repo.

## Gates resolved in-design

### Gate G6 — `npx skills` package name (CLOSED)

**Resolution:** the bare npm name `skills` is owned by `vercel-labs/skills` (`skills@1.5.6` at the time of this design). The vercel-labs CLI already implements `add <owner/repo@skill>`, `init`, `find`, `experimental_sync`, and per-agent install via `--agent claude-code` / `--agent codex`. It does what we would have built. **Integration, not invention.**

**Rationale:**

- Publishing `@patinaproject/skills` as a competing scoped CLI would split user intuition (`npx skills` vs. `npx @patinaproject/skills`) and put us on the hook for maintaining a CLI that duplicates an actively-developed upstream.
- The upstream's `<owner/repo@skill>` install syntax already targets exactly the granularity we need (per-plugin install against `patinaproject/skills`).
- Marketplace-add (`/plugin marketplace add` / `codex plugin marketplace add`) remains a host-native fallback if a user distrusts npm-distributed tooling.

**Consequence:** Workstream 5 in the previous plan (build and publish our own CLI) is **replaced** by a documentation/integration workstream. No new package directory under `packages/`, no new `bin`, no `npm publish` step in the release workflow. AC-58-4 is rewritten to reflect this (see above).

## Risks

- **Workflow-contract drift in `superteam`.** Moving SKILL.md changes its path and may inadvertently change line endings, trailing newlines, or YAML key order, which would shift the non-negotiable-rules SHA-256 prefix. Mitigation: AC-58-7 explicitly asserts the SHA-256 prefix round-trips, and the merge uses `git subtree add` rather than a fresh copy so byte content is preserved.
- **Local-path overlay leaking into a release.** If `marketplace.local.json` ever lands in a published release artifact, downstream users get an install that points at a path that does not exist on their machine. Mitigation: `release-please` and the marketplace manifest published surface both exclude `*.local.json`; the validator's release-mode check refuses to publish if either overlay file is present at the path it would resolve from.
- **Canonical-layout symlinks leaking into a release.** `.agents/skills/<name>/` and `.claude/skills/<name>/` are symlinks into `plugins/<name>/skills/<name>/`. They are workspace-iteration aids and must not appear in the package payload consumers receive via `npx skills add` or marketplace install. Mitigations: (a) the `release-please` `extra-files` configuration only targets the marketplace manifests, not the overlay directories; (b) the overlay directories are listed in `.gitattributes` `export-ignore` so `git archive`-derived tarballs strip them; (c) the validator's release-mode check refuses to publish if a `.agents/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md` entry is not a symlink whose target resolves under `plugins/`. The dogfood check (AC-58-3) verifies the symlinks point at the right place; the release-mode validator inverts that to refuse the publish if the layout drifts.
- **Vercel-labs CLI supply-chain.** Adopting an upstream CLI for the primary install path means an unpublish or compromise upstream affects our docs. Mitigations: (a) pin a tested version range in install docs (`skills@^1.5.6` initially); (b) recommend `npm_config_ignore_scripts=true` as the default invocation; (c) document the marketplace-add fallback so a contributor can avoid the npm-distributed CLI entirely; (d) record the upstream repo URL and tested version in `docs/release-flow.md`.
- **Cross-host install asymmetry.** Codex and Claude Code differ in how their marketplace manifests resolve `path:` sources. If only one host supports the overlay, in-repo iteration for the other host falls back to "publish a dev tag." Mitigation: open question (2) above must resolve before plan handoff.
- **History-preservation cost.** `git subtree add` adds repo size proportional to the three source histories. Combined, this is small (the three repos are <50 MB), but it does mean `pnpm install` clone-time grows. Acceptable.
- **Single-release blast radius.** Once consolidated, a bad merge can break all three skills at once. Mitigation: `release-please`'s per-package versioning still produces three independent tags, so a single bad release can be rolled back per-plugin; combined with the existing `vX.Y.Z` validator, this matches the current rollback story.
- **Wiki link rot.** Wiki content is easy to lose track of. Mitigation: see open question (5).

## Workflow-contract considerations (writing-skills)

This design touches `skills/**/*.md` and the workflow-contract surfaces of `superteam`. Per the `superpowers:writing-skills` discipline:

- **RED/GREEN baseline.** The existing `superteam` SKILL.md has a tested baseline at `v1.5.0`. Consolidation must preserve baseline behavior; AC-58-7's SHA-256 round-trip is the GREEN check (binding for `superteam` only).
- **Rationalization resistance.** No SKILL.md edits to `superteam` or `using-github` are in scope of this design — those moves are byte-equivalent. The `scaffold-repository` SKILL.md is the **single** rename-scoped exception, edited only for the bytes called out in the Plugin rename section below (frontmatter `name:`, manifest references, install commands); behavioral content of that SKILL.md is unchanged. Any later behavior change is its own issue and follows the same SKILL.md TDD discipline.
- **Red flags.** "We can clean up the SKILL.md while we're moving it" is the obvious failure mode. The plan must explicitly forbid this in its execution steps; the SHA-256 check enforces it for `superteam`. For `scaffold-repository`, the rename diff itself is reviewed line-by-line in the PR so opportunistic edits beyond the rename surface are visible.
- **Token-efficiency targets.** No content is being added to SKILL.md, so the existing token targets stay green.
- **Role ownership.** AGENTS.md and `docs/release-flow.md` are owned in this repo. `SKILL.md` for each plugin is owned in `plugins/<name>/skills/<name>/SKILL.md` after the move (with `<name>` ∈ `{scaffold-repository, superteam, using-github}`); the source-of-truth boundary that AGENTS.md describes shifts from "upstream repo owns the package" to "this repo's `plugins/<name>/` owns the package." For `scaffold-repository` the boundary shift also covers the rename: the AGENTS.md update documents that the in-tree plugin is named `scaffold-repository` and that `patinaproject/bootstrap` remains as the archived upstream reference. This shift is documented in the AGENTS.md update that ships with the consolidation PR.
- **Stage-gate bypass paths.** The `release-please` workflow must not allow a manifest publish without `vX.Y.Z` (the existing validator enforces this) and must not allow a manifest publish with a `marketplace.local.json` overlay present (added validator check). Both gates are machine-enforceable, not advisory.

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

No material findings required further revisions beyond what the delta absorption already encodes. The byte-for-byte port of `office-hours/SKILL.md` is verified by inspection at port time; no SHA-256 round-trip assertion is added because AC-58-7's round-trip scope is bound to `superteam` only and the operator prompt explicitly notes "byte-equivalence is documented but not SHA-asserted." The provenance row in the catalog is the audit surface; future drift would be detected by re-fetching the upstream PR head SHA and diffing against `.agents/skills/office-hours/SKILL.md`.
