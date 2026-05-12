# Design: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Summary

Consolidate the `superteam`, `bootstrap`, and `using-github` skills into `patinaproject/skills` as a flat tree of skills under `skills/<name>/` at the repo root, renaming the in-tree `bootstrap` copy to `scaffold-repository` so the directory and skill name match the skill's own description ("Use when scaffolding a new repository..."). Replace the cross-repo `repository_dispatch` bump flow with in-repo `release-please` releases (a single root package with `release-type: simple`, no per-skill `package.json` required), document `npx skills add patinaproject/skills@<name>` (the vercel-labs CLI) as the single primary install path **alongside the host-native `/plugin marketplace add patinaproject/skills` path** (enabled by the mattpocock-style `.claude-plugin/` catalog), and migrate non-essential contributor and user docs to the repo's GitHub wiki. After this change, all four in-repo skills iterate side-by-side, can be exercised locally from a clone via a thin `.claude/skills/<name>/` symlink overlay without publishing, and ship through a single repo-wide release surface tagged `v<X.Y.Z>`.

**Layout: flat `skills/<name>/` tree at the repo root (delta 7 de-categorizes the mattpocock-style category subdirs delta 6 introduced), a small `.claude-plugin/` catalog (`marketplace.json` + `plugin.json`) for host-native installation, per-skill `README.md` for the three ex-plugin skills (imported from upstream), and a root `README.md` framed around "skills used by the Patina Project team."** The four in-repo skills are `scaffold-repository`, `superteam`, `using-github`, and `office-hours`. Two install paths are supported in parallel — the vercel-labs CLI (`npx skills@1.5.6 add patinaproject/skills@<name>`) for granular per-skill install, and the host-native marketplace path (`/plugin marketplace add patinaproject/skills` then `/plugin install patinaproject-skills@patinaproject-skills`) for the user who prefers the in-host flow. No per-skill `package.json` (release-please uses `release-type: simple`). No `plugins/` wrappers (those were deleted in delta 4). **`find-skills` is no longer part of `patinaproject-skills`** (delta 7b drops it): it remains available as a third-party vendored skill at `.agents/skills/find-skills/` (installed via `npx skills add vercel-labs/skills@find-skills`) but is not a row in the marketplace catalog and not a path in `plugin.json.skills[]`.

## Goals

- Single repository for the three Patina Project skills plus one standalone skill (`office-hours`) with a single PR review surface for changes that touch multiple skills at once.
- Local-first iteration: a fresh clone is sufficient to exercise every skill against itself (the `superteam` orchestration skill must be able to drive a workflow in this repo using the in-repo copy of itself).
- Flat layout: every in-repo skill is reachable at `skills/<name>/SKILL.md` from the repo root (delta 7a de-categorizes the delta-6 mattpocock-style category subdirs). No `plugins/` wrappers and no per-skill `package.json`, but a small `.claude-plugin/` catalog (`marketplace.json` + `plugin.json`) is present so host-native install (`/plugin marketplace add patinaproject/skills`) works alongside the vercel-labs CLI install path.
- Two parallel install paths are supported:
  - `npx skills@1.5.6 add patinaproject/skills@<name>` against the vercel-labs CLI for per-skill granular install (Codex and Claude users; the CLI handles host detection).
  - `/plugin marketplace add patinaproject/skills` followed by `/plugin install patinaproject-skills@patinaproject-skills` for the host-native Claude Code flow, made possible by the `.claude-plugin/marketplace.json` re-introduced in delta 6.
- A `release-please`-driven release flow with a single root `release-type: simple` package replaces `plugin-release-bump.yml` and the cross-repo dispatch in `docs/release-flow.md`. Tags (`v<X.Y.Z>`) exist as repo-wide version markers consumers can pin via `npx skills add patinaproject/skills@<name>#v<X.Y.Z>`; release-please does **not** rewrite a `source.ref` field on the marketplace.json because the mattpocock-style marketplace.json points its single plugin entry at `./` (the repo root), not at an externally-versioned source.
- The contributor and user surface in `docs/` shrinks to what must live in the repo (AGENTS.md, release-flow notes, superpowers design/plan artifacts); per-skill READMEs travel with the skill folders (`skills/<name>/README.md` for the three ex-plugin skills); user-facing onboarding lives in the root `README.md` (mattpocock-format, framed around "skills used by the Patina Project team").
- Workflow-contract surfaces in `superteam` (SKILL.md, agents/, pre-flight, routing-table, project-deltas, workflow-diagrams) remain bit-for-bit equivalent across the move so existing `docs/superpowers/<role>.md` deltas and `AC-<issue>-<n>` patterns keep working.

## Non-Goals

- Redesigning the `superteam`, `bootstrap`, or `using-github` skills themselves. Behavior changes outside what consolidation forces (paths, install commands) are out of scope.
- Maintaining a **Codex** marketplace catalog. `.agents/plugins/marketplace.json` and `.agents/plugins/marketplace.local.json` stay deleted; Codex install resolves through `npx skills add ... --agent codex` only. The **Claude Code** marketplace catalog is **reintroduced in delta 6** at `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` (mattpocock/skills shape) so the host-native `/plugin marketplace add patinaproject/skills` path becomes available again as a parallel install surface. This reverses delta 4's blanket "no marketplace catalog" decision for the Claude Code surface only (Codex remains catalog-free).
- Rewriting the `obra/superpowers` workflow contract or the SKILL.md `## Done-report contracts`. Those remain authoritative.
- Promoting Claude Code or Codex specifics that are not already in scope of these three skills. (For example, no Cowork integration work.)
- Building a public `npx skills` registry of our own. The vercel-labs CLI is consumed via `npx`; Gate G6 stays CLOSED.

## Acceptance Criteria

### AC-58-1

After consolidation, the canonical home of every in-repo skill is `skills/<name>/SKILL.md` at the repo root (flat; delta 7a de-categorizes the delta-6 category subdirs), where `<name>` is one of the **four** in-repo skills: `{scaffold-repository, superteam, using-github, office-hours}`. **`find-skills` is no longer a patinaproject-skills skill** (delta 7b): it is removed from `skills/` entirely and continues to exist only as a third-party vendored skill at `.agents/skills/find-skills/` installed via `npx skills add vercel-labs/skills@find-skills`.

There are no `plugins/<name>/` wrapper directories anywhere in the tree, no `.codex-plugin/plugin.json`, and no per-skill `package.json`. The repo does carry **one** `.claude-plugin/plugin.json` and **one** `.claude-plugin/marketplace.json` at the repo root (mattpocock-derived shape; see AC-58-2 for the explicit content shape); these are the only plugin manifests in the tree. The in-tree `bootstrap` skill is renamed to `scaffold-repository` (directory and `SKILL.md` frontmatter `name:`); `superteam` and `using-github` names are unchanged. The three ex-plugin skills' content moves from `skills/engineering/<name>/` (delta-6 home) back to `skills/<name>/` via `git mv` so blob SHAs are preserved (Git tracks content by hash, not by path; `git mv` is rename detection plus index update, not a new write). `office-hours` moves from `skills/productivity/office-hours/` back to `skills/office-hours/` the same way. This is the **fifth** `git mv` chain in the consolidation sequence (subtree-add → bootstrap→scaffold-repository rename → plugins/<name>/skills/<name>→skills/<name> flatten → skills/<name>→skills/<category>/<name> categorize (delta 6) → skills/<category>/<name>→skills/<name> de-categorize (delta 7a)); each step has been pure-`git mv` so per-file blame survives the chain.

**Order within delta 7.** Delta 7b (drop `find-skills`) is executed **before** delta 7a (de-categorize the survivors). Rationale: removing `skills/productivity/find-skills/` first keeps the de-categorize chain at exactly four moves (`skills/engineering/{scaffold-repository,superteam,using-github}` and `skills/productivity/office-hours` each → `skills/<name>/`). The reverse order would `git mv skills/productivity/find-skills skills/find-skills` first and then delete it, adding a no-op move to the chain.

Falsifiable checks: (a) `find . -path ./node_modules -prune -o -name plugin.json -print -o -name package.json -print -o -name marketplace.json -print` returns at most three results: the repo-root `package.json`, `./.claude-plugin/plugin.json`, and `./.claude-plugin/marketplace.json`; (b) `find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort` returns exactly the four expected paths (`skills/office-hours/SKILL.md`, `skills/scaffold-repository/SKILL.md`, `skills/superteam/SKILL.md`, `skills/using-github/SKILL.md`); (c) `git log --follow --format=%H skills/superteam/SKILL.md | tail -1` resolves to the same commit and tree-blob that `git log --follow --format=%H plugins/superteam/skills/superteam/SKILL.md` resolved to before the rename chain; (d) `find skills/find-skills -type d 2>/dev/null | wc -l` returns 0 (the directory does not exist under `skills/`); (e) `test -f .agents/skills/find-skills/SKILL.md` succeeds (the third-party vendored copy survives under the overlay).

### AC-58-2

The repository carries exactly **one** marketplace catalog directory (`.claude-plugin/`) containing exactly **two** files (`marketplace.json` and `plugin.json`), in the mattpocock-derived shape verified at design time against the operator's reference (`fuleinist/skills-1` PR introducing the pattern to mattpocock/skills, plus mattpocock/skills HEAD which ships the same `plugin.json` shape under `.claude-plugin/`). The Codex catalog (`.agents/plugins/`) and its `marketplace.local.json` dev overlays stay deleted from delta 4 — Codex installs go through the vercel-labs CLI only.

**Required `.claude-plugin/marketplace.json` shape (one plugin entry, source `./`)**:

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
      "description": "Skills used by the Patina Project team — scaffold-repository, superteam, using-github, office-hours",
      "source": "./"
    }
  ]
}
```

**Required `.claude-plugin/plugin.json` shape (ordered skill paths)**:

```json
{
  "name": "patinaproject-skills",
  "skills": [
    "./skills/scaffold-repository",
    "./skills/superteam",
    "./skills/using-github",
    "./skills/office-hours"
  ]
}
```

The plugin slug `patinaproject-skills` appears in three places: `marketplace.json`'s top-level `name`, `marketplace.json`'s `plugins[0].name`, and `plugin.json`'s top-level `name`. All three must match.

The `plugin.json.skills[]` array has **four** entries (delta 7b drops `find-skills`). `find-skills` is not a row in `marketplace.json.plugins` and not a path in `plugin.json.skills[]`; consumers install it separately via `npx skills add vercel-labs/skills@find-skills` (documented as a "Related skills" note in `README.md`).

The host-native install path is enabled: `/plugin marketplace add patinaproject/skills` followed by `/plugin install patinaproject-skills@patinaproject-skills` registers the marketplace and installs the four in-repo skills (the plugin scope name and the plugin name are the same — they form the marketplace-qualified handle). The vercel-labs CLI install path remains available for per-skill granular install (`npx skills add patinaproject/skills@<name>`) and is documented as the **first-listed** install path in `README.md` (mattpocock-style quickstart). Both paths resolve to the same underlying skill content under `skills/<name>/`.

The `scripts/validate-marketplace.js` script — deleted in delta 4 — stays deleted; the mattpocock-style marketplace.json has no `source.ref` field for any tag-shape regex to validate, and the `plugins[0].source` value is the literal string `"./"` (not a tag-pinned upstream). A lighter marketplace-shape sanity check (one plugin entry, name matches plugin.json, source is `"./"`) is mechanized as a new `scripts/verify-marketplace.sh` step in `.github/workflows/verify.yml`; full specification is a Planner implementation detail.

Falsifiable checks:

- `find . -path ./node_modules -prune -o -name 'marketplace*.json' -print` returns exactly `./.claude-plugin/marketplace.json` (and nothing under `.agents/plugins/`).
- `jq -r '.name, .plugins[0].name' .claude-plugin/marketplace.json` returns `patinaproject-skills` twice.
- `jq -r '.name' .claude-plugin/plugin.json` returns `patinaproject-skills`.
- `jq -r '.plugins[0].source' .claude-plugin/marketplace.json` returns `./`.
- `jq -r '.skills[]' .claude-plugin/plugin.json | sort` matches the four `./skills/<name>` paths (`./skills/office-hours`, `./skills/scaffold-repository`, `./skills/superteam`, `./skills/using-github`) in AC-58-1.
- `jq -r '.skills[]' .claude-plugin/plugin.json | grep -c find-skills` returns 0.

### AC-58-3

A contributor can clone `patinaproject/skills`, run `pnpm install` to initialize Husky and dev tooling, and exercise any of the four in-repo skills against this repository itself without first publishing or installing from any registry. Specifically, the `superteam` skill can drive an issue workflow in this repo using its own in-repo copy, the `scaffold-repository` skill can apply its scaffolding to this repo without reaching the network, and the `using-github` skill's slash commands can be exercised from this clone. Local resolution is documented in `README.md`. Falsifiable checks: (a) `scripts/apply-scaffold-repository.js skills/scaffold-repository` runs against this repo without network access and exits 0 (path updated for the de-categorized layout), and (b) the dogfood verification below passes.

#### AC-58-3 dogfood verification

A fresh `claude` session opened at the repo root must discover all four in-repo skills (`scaffold-repository`, `superteam`, `using-github`, `office-hours`) via Claude's own skill loader without any user action beyond `git clone && pnpm install` (the `pnpm install` step is only required for husky/commitlint; skill discovery itself needs no install). `find-skills` is **not** in scope of this check — it is a third-party vendored skill (per delta 7b), discovered separately via the `.agents/skills/find-skills/` real-file overlay produced by `npx skills add vercel-labs/skills@find-skills`.

Claude Code does not expose a public "list installed skills" CLI command, so this check is mechanized as a file-presence + frontmatter check. The check script (`scripts/verify-dogfood.sh`) exits 0 if and only if all four conditions hold:

1. Each path `skills/<name>/SKILL.md` exists as a real file (no symlink chain to dereference) for the four `<name>` values enumerated in AC-58-1.
2. Each `SKILL.md` begins with a YAML frontmatter block whose first two non-delimiter keys include `name:` and `description:`, matching the skill loader's contract documented in Claude Code's skill format.
3. The `name:` value in each frontmatter matches the directory name (`name: scaffold-repository` under `skills/scaffold-repository/`, `name: office-hours` under `skills/office-hours/`, etc.). For `scaffold-repository` this verifies that the rename touched the SKILL.md frontmatter, not only the directory path.
4. Each thin overlay path `.claude/skills/<name>/SKILL.md` resolves (via symlink) to the matching `skills/<name>/SKILL.md` real file. (Test with `readlink -f .claude/skills/<name>/SKILL.md` and assert the result equals the absolute path of `skills/<name>/SKILL.md`; reject broken or wrong-targeted links explicitly.) The committed overlay symlinks at `.claude/skills/<name>/` -> `../../skills/<name>/` are what give a fresh clone discoverable skills in Claude Code without any post-clone install step (Option D1, see Gate G7). Codex sees the same content via its `.agents/skills/` scan, which the overlay also satisfies (committed `.agents/skills/<name>/` -> `../../skills/<name>/` symlinks). The overlay link target updates from `../../skills/<category>/<name>/` (delta 6) back to `../../skills/<name>/` (delta 7a) — same depth as the original delta-4 shape.

   **Worked example for `superteam`**: the symlink lives at `.claude/skills/superteam`. Its parent is `.claude/skills/`. To reach `skills/superteam` from `.claude/skills/`, the relative path is `../../skills/superteam`. This works because `.claude/skills/` and `skills/` are siblings at depth 1; the `../..` ascends to the repo root, then descends into `skills/superteam`.

Pass criterion: `scripts/verify-dogfood.sh` exits 0. The check is mechanical and runs in CI on every PR that touches `skills/**` or `.claude/skills/**` or `.agents/skills/**` or `.claude-plugin/**`. Every in-repo skill has the same flat shape at `skills/<name>/SKILL.md`, so the check is uniform across all four. **Update from delta 6:** the check covers four skills, not five (`find-skills` removed per delta 7b). The script must not iterate over `find-skills` in its in-repo skill loop.

A new condition 5 is **deferred** to a Planner follow-up: validate that `.claude-plugin/plugin.json`'s `skills[]` array matches the canonical home paths exactly (now four entries, not five). The design records it as a binding requirement but defers the script-author exact-shape to the Planner.

### AC-58-4

Two documented install entry points are supported in parallel; both must work against the same underlying skill content under `skills/<name>/` (flat layout, delta 7a). `find-skills` is **not** installable via either patinaproject-skills path — it is documented as a separate "Related skills" install via `npx skills add vercel-labs/skills@find-skills` (delta 7b).

**Primary path — vercel-labs CLI (per-skill granular install):**

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@<name> --agent <agent> -y
```

This is the first-listed install path in `README.md` (mattpocock-style quickstart) for both Claude Code (`--agent claude-code`) and Codex (`--agent codex`) users. The release process pins a tested CLI version at the invocation site (`skills@1.5.6` — the version observed during this design); the docs include the CLI's homepage (`https://github.com/vercel-labs/skills`) and the pinned version's published-to-npm date. The deliberate deviation from mattpocock's `@latest` in the upstream reference is recorded in the Delta 6 history appendix (supply-chain hardening over reference fidelity).

**Secondary path — Claude Code host-native marketplace (all-five-skills install):**

```text
/plugin marketplace add patinaproject/skills
/plugin install patinaproject-skills@patinaproject-skills
```

Re-enabled in delta 6 by the `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` re-introduction (AC-58-2). The host-native path installs **all four** in-repo skills as one plugin (`patinaproject-skills`), which is the granularity the mattpocock-derived `plugin.json` exposes (`find-skills` excluded per delta 7b). Users who want per-skill granular install use the primary path. Codex has no equivalent host-native install path against this repo's catalog (the Codex marketplace catalog stays deleted from delta 4); Codex users always use the primary path with `--agent codex`.

**Related skills (delta 7b).** `find-skills` is shipped separately by vercel-labs; install with `npm_config_ignore_scripts=true npx skills@1.5.6 add vercel-labs/skills@find-skills --agent <agent> -y`. This is documented as a short "Related skills" note in `README.md`'s Quickstart section, immediately below the two primary install paths. The note is a one-liner with the command and a link to `https://github.com/vercel-labs/skills`; it does not duplicate the upstream README. `find-skills` is **not** removed from contributor capability — a contributor who clones this repo gets `find-skills` via the existing third-party vendor at `.agents/skills/find-skills/` (real file, installed via the same CLI command and recorded in `skills-lock.json`).

`README.md` lists both paths in the Quickstart section. The vercel-labs CLI version is pinned at `skills@1.5.6`; the host-native path version is the version of the consumer's Claude Code install at install time.

Falsifiable checks:

- **Primary path.** From a fresh temp directory, `npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y` (equivalents for each of `superteam`, `using-github`, `office-hours`) against this repo's current branch resolves the skill from `skills/<name>/SKILL.md` (where the CLI finds the matching frontmatter `name:`), writes `skills-lock.json`, and produces an installed skill discoverable by Claude Code's loader. The Executor records the command (with the pinned CLI version), the resolved lock entries, and the SHA of the branch the install resolved against in the PR body. `find-skills` is not tested against `patinaproject/skills` (it is not a skill in this repo); a separate falsifiable check installs it from `vercel-labs/skills` to verify the "Related skills" note resolves.
- **Secondary path.** In a Claude Code session, `/plugin marketplace add patinaproject/skills` registers the marketplace (using `.claude-plugin/marketplace.json`), and `/plugin install patinaproject-skills@patinaproject-skills` installs the plugin and exposes the four in-repo skills as commands/slash entries to the host. CI exercises this manually during release verification; full mechanization is a Planner follow-up.
- **Related-skills path.** `npm_config_ignore_scripts=true npx skills@1.5.6 add vercel-labs/skills@find-skills --agent claude-code -y` resolves against the upstream `vercel-labs/skills` repo and writes/refreshes the `skills.find-skills` entry in `skills-lock.json`. This is the third-party install, not part of patinaproject-skills.

**How the CLI resolves `@<name>` (verified at design time, recorded in adversarial review).** The vercel-labs CLI's `<owner/repo@skill>` resolver walks the cloned repository's tree for `SKILL.md` files and matches the requested `<skill>` against either the leaf directory name or the frontmatter `name:` field of each `SKILL.md` it finds. The layout (flat or category-organized) does not affect resolution — the CLI walks recursively and matches against the leaf segment / frontmatter. Reference: `vercel-labs/skills@1.5.6` README and source. Confirmed by the existing `skills-lock.json` entry under `skills.find-skills` (`source: vercel-labs/skills`), where `vercel-labs/skills` itself uses a flat `skills/<name>/` layout — the resolver does not depend on the layout being flat or categorized.

### AC-58-5

**Single marketplace version.** `release-please-config.json` declares **one** root package (key `"."`) with `release-type: simple`; `.release-please-manifest.json` has exactly one entry (`".": "1.0.0"`). The tag form is plain `v<X.Y.Z>` — no component prefix, no `tag-separator`, no `include-component-in-tag`. There is one `CHANGELOG.md` at the repo root rather than three under `skills/<name>/`. The seed version is `1.0.0` (rationale recorded below); the underlying per-skill upstream tags (`bootstrap-v1.10.0`, `superteam-v1.5.0`, `using-github-v2.0.0`) are preserved in the migration-history records on the subtree-merge commits (`912d6d9`, `028165e`, `54157bc`) and in `docs/file-structure.md`'s Migration history section, not as live tags on this repo.

**Why single-version, not per-skill.** Surveyed comparable repos confirm ecosystem unanimity on single-version marketplaces:

- `vercel-labs/skills` (the upstream CLI itself): one tag stream (`v1.5.6` at the time of this design).
- `obra/superpowers` (14 sub-skills): one tag stream (`v5.1.0`), synced via `.version-bump.json`.
- `anthropics/skills` (3 plugins, ~14 skills): one `marketplace.metadata.version: 1.0.0`; plugins have no per-plugin version field.

The CLI constraint reinforces the choice: `npx skills add patinaproject/skills@<name>#<ref>` resolves **one** Git ref per repo. The CLI clones the repo at `<ref>` and walks for `SKILL.md` files matching the requested slug, so any per-skill tag (`superteam-v1.5.0`, etc.) would resolve to "the entire repo at that tag's commit," not "just the superteam skill at v1.5.0 with everything else at HEAD." Per-skill tags were never independently consumable in this layout — they only selected commits. `skills-lock.json`'s `computedHash` already records per-skill content provenance for reproducible re-installs; per-skill version tags would duplicate that signal without adding pin granularity.

**`release-type: simple` is chosen explicitly** (over `node`) because the new layout has no `package.json` carrying a `version` field that release-please should rewrite. The `simple` strategy reads the current version from `.release-please-manifest.json`, bumps it based on conventional-commit types across the repo (`feat:` → minor, `fix:` → patch, breaking → major), and writes the new version back to the manifest. **The mattpocock-style `.claude-plugin/marketplace.json` re-introduced in delta 6 carries a `metadata.version` field** (per AC-58-2's shape). Release-please's `extra-files` block is configured to rewrite **this single field** (`metadata.version` in `.claude-plugin/marketplace.json`) on each release so host-native install consumers see the same version the Git tag advertises. The `plugins[0].source` value stays as the literal `"./"` (no `ref` field to rewrite — the plugin's source is the repo itself, not an externally-versioned tag). The Codex marketplace stays deleted, so no Codex-side rewrite is configured. The only artifacts of a release-please run are: the `v<X.Y.Z>` tag, the manifest bump in `.release-please-manifest.json`, the root `CHANGELOG.md` entry, and the `metadata.version` rewrite in `.claude-plugin/marketplace.json`.

**Scaffold-repository self-apply trigger.** With one release per repo, the previous "tag matches `scaffold-repository-*` prefix" gate no longer fits. The trigger condition in `.github/workflows/release-please.yml` is rewritten to check whether the release scope includes any path under `skills/scaffold-repository/` (path updated for delta-7a de-categorize; matches delta-4 shape). The mechanism is `release-please-action`'s `paths_released` output (a JSON array of package paths that were released in the run) — though with a single root package the output's shape is different, so the trigger falls back to either (a) inspecting the `release-please-action`'s commit-list output for paths matching `skills/scaffold-repository/**`, or (b) running the apply step unconditionally on every release-please run and relying on `scripts/apply-scaffold-repository.js` being idempotent (it writes a no-op commit when there are no scaffolding changes — already verified in the existing workflow's "No scaffolding changes to commit" branch). Option (b) is the simpler default; the Planner picks the exact mechanism during execution. The signing and auto-merge guarantees described in `docs/release-flow.md` are preserved either way. The script's input path argument is `skills/scaffold-repository` (delta 4 shape restored by delta 7a); the script itself doesn't change shape.

**Conventional-commit grouping in the CHANGELOG.** This repo's commitlint config forbids scopes (per AGENTS.md: "Commits must use conventional commit types, no scopes, and a required GitHub issue tag"). Per-skill grouping inside a single CHANGELOG release-section therefore cannot be driven by scopes (`feat(superteam): …`) without amending the commit convention, and amending the commit convention is out of scope for this delta. The accepted trade-off: each commit message already references the issue and identifies the changed paths via the diff, so readers cross-reference per-skill attribution via the linked issue rather than via a scope token in the changelog header. This information-loss is recorded as a non-blocking trade-off, not a regression.

**Tag form.** `v<X.Y.Z>` (e.g. `v1.0.0`, `v1.1.0`, `v2.0.0`). Plain SemVer. Consumers pin via `npx skills add patinaproject/skills@<name>#v<X.Y.Z>` — the same ref pins all five skills to the repo state at that tag.

**Initial version: `1.0.0`.** Rationale: `patinaproject/skills` is a fresh consolidated marketplace, not a continuation of any single underlying skill's version stream. Carrying forward `2.0.0` (from `using-github@v2.0.0`, the highest underlying major) would imply this repo had a `v1` history that doesn't exist. Carrying `5.0.0` to "signal multi-skill provenance" (the way `obra/superpowers` arrived at `v5.1.0`) would be misleading for the same reason — `obra/superpowers` reached `v5` through its own release stream, not by adoption from elsewhere. The underlying upstream version history is preserved in the Migration history section of `docs/file-structure.md` and in the subtree-merge commits; it does not need to be encoded into this repo's initial version. `1.0.0` is the canonical "first stable release of this surface" and matches `anthropics/skills`'s starting point.

The pre-existing `plugin-release-bump.yml` workflow and the cross-repo `repository_dispatch` step in `docs/release-flow.md` are removed in the same change, with `docs/release-flow.md` rewritten to describe the new flow. Bot-generated `release-please--*` PRs remain the documented exception to the issue-tag rule that already covers `bot/bump-*` PRs in AGENTS.md.

The pre-existing per-plugin `release-please-config.json` files imported by `git subtree add` at `plugins/<name>/release-please-config.json` are deleted alongside the `plugins/` directories themselves — they were never live release-please packages in this repo, only carry-over noise from the upstream packages.

**Falsifiable checks:** (a) `release-please-config.json` has exactly one key under `packages` and that key is `"."`; (b) `.release-please-manifest.json` has exactly one entry and that entry is `".": "1.0.0"` at design time; (c) `find . -name "CHANGELOG.md" -not -path "./node_modules/*" -not -path "./.git/*"` returns at most one path (the repo-root `CHANGELOG.md` once release-please has run, or zero before the first release); (d) the first release-please tag matches the regex `^v\d+\.\d+\.\d+$` with no component prefix.

### AC-58-6

The wiki's role in the user-facing surface is reduced in delta 6 and further trimmed in delta 7: **per-skill `README.md` files now travel in-repo at `skills/<name>/README.md`** (for the three ex-plugin skills that have substantial upstream README content — see AC-58-9; flat path restored by delta 7a), and the root `README.md` (AC-58-9) carries the quickstart and the linked table of the four in-repo skills. The wiki retains a smaller scope:

- **Wiki keeps:** longer-form troubleshooting (`npx skills` failure modes, CLI version-pinning rationale, Windows-symlink hosts), Cowork install walkthroughs that exceed README scope, the multi-step "how superteam runs end-to-end" narrative.
- **Wiki drops (moves to in-repo `README.md` files):** the per-skill usage walkthroughs that were planned to live on the wiki. Each ex-plugin skill's wiki page is replaced by its in-repo `skills/<name>/README.md` imported from upstream. The wiki index records this as a "moved to in-repo README" line per skill rather than maintaining duplicate content.
- **Wiki drops (delta 7b):** the `find-skills` wiki page, if one was planned. `find-skills` is no longer a patinaproject-skills skill; its install instructions are a one-liner in the root README's "Related skills" note (pointer to `vercel-labs/skills@find-skills`).

`docs/` retains AGENTS.md (root), the rewritten `docs/release-flow.md`, `docs/file-structure.md`, `docs/wiki-index.md`, and the `superpowers/` design and plan artifacts. The root `README.md` links per-skill in-repo READMEs (preferred); the wiki is linked from `README.md` only for the longer-form troubleshooting topics enumerated above. Path references throughout in-repo docs point at `skills/<name>/SKILL.md` and `skills/<name>/README.md` (delta-7a canonical homes).

The remaining standalone in-repo skill `office-hours` does **not** get a per-skill `README.md` — its `SKILL.md` is comprehensive on its own (matching mattpocock's pattern for per-skill folders that ship only `SKILL.md` plus optional companion `.md` files). The wiki entry for `office-hours` is dropped entirely in favor of the SKILL.md being self-contained; the linked table in root `README.md` is the entry point.

### AC-58-7

The workflow-contract surfaces in `skills/superteam/` (SKILL.md, agents/, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md`) are present at the final flat path (delta 7a) and reachable by both hosts under the dogfood overlay, so an in-repo `/superteam` run on this repo resolves the same SKILL.md it would after an `npx skills add` install. The non-negotiable-rules SHA-256 prefix computed by `Team Lead` during `resolve_role_config` for each shipped role matches across the full `git mv` chain: pre-flatten (`plugins/superteam/skills/superteam/SKILL.md`), post-flatten / pre-categorize (`skills/superteam/SKILL.md`, delta 4), post-categorize (`skills/engineering/superteam/SKILL.md`, delta 6), and post-de-categorize (`skills/superteam/SKILL.md`, delta 7a). No silent edit slipped in during the chain.

**Scope of the SHA-256 round-trip:** the byte-equivalence assertion in this AC covers `skills/superteam/SKILL.md` (and the `agents/`, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md` surfaces alongside it) **only**. The `scaffold-repository` SKILL.md at `skills/scaffold-repository/SKILL.md` is **exempt** from any SHA-256 round-trip assertion: the rename delta (now landed) rewrites the in-tree SKILL.md frontmatter and body bytes as cataloged in the "Plugin rename" section, so its post-flatten SHA-256 will differ from the upstream `patinaproject/bootstrap@v1.10.0` reference; the rename diff itself is the audit surface. The same exemption applies to `skills/using-github/SKILL.md` — only `superteam` is bound by the SHA-256 round-trip rule because only `superteam`'s `Team Lead` consumes that hash as a runtime contract.

**Why `git mv` preserves the SHA:** Git stores file content as blobs hashed by SHA-1 (legacy) and SHA-256 (with the `--object-format=sha256` setting; this repo uses SHA-1 for its own object store but the file-content SHA-256 used by `Team Lead`'s `resolve_role_config` is computed independently on the file's bytes). `git mv` updates the index path of an existing blob without rewriting the blob, and rename detection in `git log --follow` and `git diff -M` tracks the path change. The file-content SHA-256 we audit is therefore identical before and after each `git mv` in the chain (`plugins/superteam/skills/superteam` → `skills/superteam` → `skills/engineering/superteam` → `skills/superteam`) so long as no editor touched the file between the moves. Note the chain ends where it started after delta 4 (the categorize+de-categorize is a round trip that returns to the flat path). Verification: `sha256sum skills/superteam/SKILL.md` must match the pre-flatten value recorded in PR #59 (`87867b669c97d06b7076f155ab6aa9d61833aee06fd14fe14af88e363de34356`).

### AC-58-8

The merge approach for the three source repositories is explicitly chosen and documented: Git history is preserved via `git subtree add --prefix=plugins/<name>` per source repo. The plan derived from this design follows the choice without revisiting it. The three source repos remain readable as archived references for at least one release cycle after consolidation. The migration history record produced by this AC notes the **five** events for the scaffold skill in order:

1. `git subtree add --prefix=plugins/bootstrap patinaproject/bootstrap v1.10.0` import (commit `912d6d9`).
2. `git mv plugins/bootstrap plugins/scaffold-repository` rename (commit `794e199`).
3. `git mv plugins/scaffold-repository/skills/scaffold-repository skills/scaffold-repository` flatten (delta 4, landed during execution after operator PR #59 comments).
4. `git mv skills/scaffold-repository skills/engineering/scaffold-repository` categorize (delta 6).
5. `git mv skills/engineering/scaffold-repository skills/scaffold-repository` de-categorize (delta 7a; this design's amendment; commit to land during execution). Returns the canonical home to the delta-4 path.

The corresponding four events for `superteam` and `using-github`: subtree import, flatten (delta 4), categorize (delta 6), de-categorize (delta 7a).

The corresponding four events for `office-hours`: initial port to `.agents/skills/office-hours/` (from `patinaproject/patinaproject` PR #1143), `git mv .agents/skills/office-hours skills/office-hours` flatten (delta 4), `git mv skills/office-hours skills/productivity/office-hours` categorize (delta 6), `git mv skills/productivity/office-hours skills/office-hours` de-categorize (delta 7a).

**`find-skills` history (delta 7b — drop from patinaproject-skills).** Recorded as a discrete event in the migration history: `find-skills` was initially installed via `npx skills add vercel-labs/skills@find-skills` (real-file copy under `.claude/skills/find-skills/`), reconciled to `.agents/skills/find-skills/` (delta 1 canonical-layout reconciliation), flattened to `skills/find-skills/` (delta 4), categorized to `skills/productivity/find-skills/` (delta 6), and finally **removed from the in-repo skills tree entirely** in delta 7b. The third-party vendored copy at `.agents/skills/find-skills/` (real file, governed by `skills-lock.json`) survives the removal and continues to serve contributors as the immediate-editor-access vendored skill. The simplest execution path is to re-install via the vercel-labs CLI (`npm_config_ignore_scripts=true npx skills@1.5.6 add vercel-labs/skills@find-skills --agent claude-code -y`), which (a) writes the real file at `.agents/skills/find-skills/`, (b) makes `.claude/skills/find-skills/` a symlink pointing into the third-party install topology shared by the 22+ other vendored skills, and (c) refreshes the `skills-lock.json` entry. The previous in-repo source-of-truth copy at `skills/productivity/find-skills/` is then deleted with `git rm -rf`. `skills-lock.json`'s `skills.find-skills` entry is **preserved** — it records the third-party vendor and is unchanged by the drop.

Per-skill READMEs imported from upstream (`scaffold-repository`, `superteam`, `using-github`) are recorded as **new file creation** under `skills/<name>/README.md` in delta 6 + delta 7a (READMEs follow the SKILL.md `git mv` chain so their final home is the de-categorized flat path), not as `git mv` from upstream — the import is a manual content-copy with light edits to strip the obsolete `patinaproject/skills` marketplace install blocks and reframe install instructions. The upstream commit SHA the import resolves against (`v1.10.0` for `bootstrap`, `v1.5.0` for `superteam`, `v2.0.0` for `using-github`) is recorded in the README file itself as a "Source" line below the title; the same provenance is mirrored in `docs/file-structure.md`'s Migration history section.

Per-file blame survives the `git mv` chain because `git mv` is a rename, not a rewrite (verified by `git log --follow`). Per-skill READMEs imported in delta 6 do **not** carry upstream blame — their git history starts at the delta-6 import commit. The upstream `patinaproject/bootstrap` repository keeps its original name and `v1.10.0` tag as the archived reference; the rename, flatten, categorize, and de-categorize are local to the imported copy in this repository only.

### AC-58-9

Delta 6 rewrites the user-facing README surface to match the mattpocock/skills format, framed around "skills used by the Patina Project team." Three concrete artifacts are produced:

**1. Rewritten root `README.md` (mattpocock format).** The root README is restructured to follow the mattpocock/skills shape:

1. Title: `# Skills used by the Patina Project team` (Patina-equivalent of mattpocock's "Skills For Real Engineers")
2. Optional skills.sh badge (`[![skills.sh](https://skills.sh/b/patinaproject/skills)](https://skills.sh/patinaproject/skills)`) — included if the badge endpoint resolves at design time; otherwise omitted as a follow-up.
3. One-paragraph tagline framing the repo as a curated set used in practice, not a generic marketplace.
4. **Quickstart** section with both install paths from AC-58-4 (vercel-labs CLI first; host-native marketplace second). The vercel-labs invocation pins `skills@1.5.6` per the supply-chain decision; the deliberate deviation from mattpocock's `@latest` is footnoted with a one-line rationale ("we pin the CLI version at the invocation site for supply-chain reasons; see docs/release-flow.md").
5. **Why these skills exist** — a problem-narrative for each of the **four** in-repo skills (one paragraph per skill, lifted from the upstream README or the SKILL.md `description:` field as appropriate). This mirrors mattpocock's "Why These Skills Exist" section structure. `find-skills` is **not** included here (delta 7b dropped it from patinaproject-skills); a separate one-line "Related skills" note in the Quickstart points readers at the vercel-labs install command.
6. **Skills table** linking to each in-repo skill's folder, replacing the prior version-pinned table. Columns: `Skill`, `Description`. **No version column** — release-please publishes one tag per repo (AC-58-5), so per-skill versions are not meaningful. **No category column** either (delta 7a de-categorizes, so there is no category to display). Each `Skill` cell links to the in-repo skill folder (`skills/scaffold-repository/`, `skills/superteam/`, `skills/using-github/`, `skills/office-hours/`). Clicking through goes to the skill's README (for the three ex-plugin skills) or its SKILL.md (for `office-hours`). The table has exactly **four rows** (delta 7b drops `find-skills`).
7. Newsletter-signup section from mattpocock is **omitted** (we don't have one).
8. Logo/banner is **omitted** (no Patina branding asset prepared for this delta; the title alone carries identification).

The 180-line delta-4 README is replaced. Length target: 100–200 lines, matching mattpocock's compact-but-narrative shape (their README is ~155 lines at HEAD).

**2. Per-skill `README.md` for the three ex-plugin skills.** Each of `skills/scaffold-repository/`, `skills/superteam/`, `skills/using-github/` (flat paths, delta 7a) gets a `README.md` imported from the upstream tagged release:

- `scaffold-repository/README.md` ← `patinaproject/bootstrap@v1.10.0/README.md` (269 lines).
- `superteam/README.md` ← `patinaproject/superteam@v1.5.0/README.md` (250 lines).
- `using-github/README.md` ← `patinaproject/using-github@v2.0.0/README.md` (236 lines).

Each imported README requires three categories of edit before commit:

a. **Title rename.** `# Bootstrap` → `# scaffold-repository` (lowercase to match the skill's frontmatter `name:`); `# Superteam` → `# superteam`; `# using-github` is already lowercase.
b. **Install-block reframe.** Strip the obsolete pre-delta-6 install blocks (`/plugin marketplace add patinaproject/skills` followed by `/plugin install <name>@patinaproject-skills`, and the various `npx skills add patinaproject/skills@<name>` examples). Replace with a short pointer back to the root `README.md`'s Quickstart section ("See [the root README](../../README.md) for install instructions" — relative-path updated for the flat-layout delta 7a, where per-skill folder is two segments deep from repo root). Rationale: install instructions live in one place to prevent drift; per-skill READMEs focus on the skill's behavior and rationale.
c. **Source line.** Add a one-line `Source:` reference immediately below the title pointing at the upstream tag (e.g. `Source: imported from [patinaproject/bootstrap@v1.10.0](https://github.com/patinaproject/bootstrap/tree/v1.10.0)`). This records provenance without a separate provenance catalog edit.

No other edits to imported README content. The README is a verbatim port of upstream-tagged content modulo the three categories above; mermaid diagrams, prose, code blocks, and link targets to in-repo files (which resolve relative to the new `skills/<name>/` flat location) are preserved.

**3. No per-skill `README.md` for the `office-hours` standalone skill.** `skills/office-hours/` ships only its `SKILL.md` (matching mattpocock's pattern for per-skill folders without imported README content). The root README's "Skills table" links this cell to the SKILL.md directly rather than to the folder. `find-skills` is **not** a row in the Skills table (delta 7b dropped it from patinaproject-skills).

**Why this is a re-introduction of catalog material (delta 6 reverses delta 4's catalog deletion for the Claude Code surface, by operator direction).** The deliberate reversal is recorded explicitly in the Delta 6 history appendix; delta 4's "no marketplace catalog at all" decision was operator-driven, and delta 6's "re-introduce one marketplace catalog at `.claude-plugin/` per mattpocock/skills" is also operator-driven. The cost (re-introducing files we just deleted) is accepted as a learning iteration: the operator's binding direction shifted from "vercel-labs pure" (F1) to "mattpocock hybrid" (F2) after surveying the mattpocock reference. Both decisions are honored in sequence, not papered over.

**Falsifiable checks:**

- (a) Root `README.md` H1 reads `# Skills used by the Patina Project team` (or a verbally equivalent phrasing the operator approves).
- (b) Root `README.md` contains a section heading `## Why these skills exist` (case-insensitive) and a section heading `## Quickstart` (or `## Quick start`).
- (c) Root `README.md` skills table has exactly **four rows** (delta 7b), each row's first cell linking via Markdown to `skills/<name>/` (folder) for the three ex-plugin skills and `skills/office-hours/SKILL.md` (file) for the standalone, and **no** column carrying a version string and **no** column carrying a category string (delta 7a).
- (d) `skills/scaffold-repository/README.md` exists (flat path, delta 7a), has a `Source:` line referencing `patinaproject/bootstrap@v1.10.0` (regex `patinaproject/bootstrap.*v1\.10\.0`), and its H1 starts with `# scaffold-repository`. Equivalent checks for `skills/superteam/README.md` (v1.5.0) and `skills/using-github/README.md` (v2.0.0).
- (e) `skills/office-hours/README.md` does **not** exist (`SKILL.md` is the only `.md` at that leaf). `skills/find-skills/` does **not** exist as a directory (delta 7b dropped it).
- (f) Root `README.md` contains a "Related skills" note (case-insensitive) pointing at `vercel-labs/skills@find-skills` with the install command `npx skills@1.5.6 add vercel-labs/skills@find-skills`.

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

### Option F1 (delta 4 selection — vercel-labs pure): Flat `skills/<name>/` with single-package `release-type: simple`, no marketplace catalog

Move each skill to `skills/<name>/` at the repo root. No `plugins/` directory. No marketplace manifests of any kind. No per-skill `package.json`. The vercel-labs CLI resolves `npx skills add patinaproject/skills@<name>` by walking the cloned tree for `SKILL.md` files matching the requested slug (verified design-time against `vercel-labs/skills@1.5.6`). `release-please` runs against a single root package with `release-type: simple` (delta 5). Releases emit a plain `v<X.Y.Z>` tag that consumers pin via `npx skills add patinaproject/skills@<name>#v<X.Y.Z>`. Dogfood overlay is the only structural sugar that remains: `.claude/skills/<name>/` and `.agents/skills/<name>/` are committed thin symlinks pointing at `../../skills/<name>/` so a fresh clone is discoverable to both Claude Code and Codex without a post-clone install step.

**F1 was selected in delta 4** and matched the operator's PR #59 review direction. Delta 6 supersedes F1 with F2 below; F1 is preserved here as part of the design history.

### Option F2 (selected — mattpocock hybrid): Category-organized `skills/<category>/<name>/` with `.claude-plugin/` catalog and per-skill READMEs

Move each skill to `skills/<category>/<name>/` at the repo root with two categories (`engineering/`, `productivity/`), matching the mattpocock/skills HEAD layout. Reintroduce a Claude Code marketplace catalog at `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` (mattpocock-style: one plugin entry named `patinaproject-skills`, `source: "./"`, ordered skill paths in `plugin.json.skills[]`). The Codex marketplace catalog stays deleted (delta 4); Codex installs via the vercel-labs CLI only. The three ex-plugin skills each get a per-skill `README.md` imported from their upstream tagged release (`bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`); the two standalones get `SKILL.md` only. The root `README.md` is rewritten in mattpocock format, framed around "skills used by the Patina Project team," with both install paths documented and a no-version skills table linking to each skill folder.

Two install paths coexist:

- **vercel-labs CLI (primary, per-skill granular)** — `npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@<name> --agent <agent> -y`. CLI version pinned at `@1.5.6` (deviating from mattpocock's `@latest` for supply-chain reasons; trade-off documented in delta 6 adversarial review).
- **Host-native Claude Code marketplace (secondary, all-five-skills install)** — `/plugin marketplace add patinaproject/skills` then `/plugin install patinaproject-skills@patinaproject-skills`. Re-enabled by the reintroduced `.claude-plugin/marketplace.json` (mattpocock-shape).

`release-please` runs against a single root package with `release-type: simple` (carried forward from delta 5); the `extra-files` block rewrites the `metadata.version` field in `.claude-plugin/marketplace.json` on each release so host-native install consumers see the same version the Git tag advertises. Dogfood overlay symlinks update target from `../../skills/<name>/` (F1) to `../../skills/<category>/<name>/` (F2); same depth, no extra `..` segments needed.

**Selected approach: F2.** It matches the operator's binding delta-6 direction (adopt mattpocock structure), preserves the vercel-labs CLI install path as the primary user-facing flow, restores the host-native install path that was lost in delta 4, and imports substantive upstream README content into the repo where reviewers can find it via folder navigation. The cost — re-introducing two `.claude-plugin/` files that delta 4 deleted, plus one round of `git mv` to categorize — is accepted as a learning iteration recorded in the Delta history. F1 is retained above for design-history continuity; F1's "no marketplace catalog" decision is replaced by F2's "mattpocock-shape catalog for Claude only" decision in delta 6.

## Proposed file layout

```text
patinaproject/skills/
  .claude-plugin/                          # Claude Code marketplace catalog (delta 6, mattpocock-derived; delta 7b drops find-skills)
    marketplace.json                       # one plugin entry, name="patinaproject-skills", source="./"
    plugin.json                            # name="patinaproject-skills", skills: [./skills/<name>, ...] (4 entries)
  skills/                                  # CANONICAL skill home (real files; FLAT in delta 7a)
    scaffold-repository/
      SKILL.md                             # frontmatter "name: scaffold-repository"
      README.md                            # imported from patinaproject/bootstrap@v1.10.0/README.md (delta 6)
      ... (supporting files lifted from upstream: templates/, scripts/, etc.)
    superteam/
      SKILL.md
      README.md                            # imported from patinaproject/superteam@v1.5.0/README.md (delta 6)
      agents/...
      pre-flight.md
      routing-table.md
      project-deltas.md
      workflow-diagrams.md
    using-github/
      SKILL.md
      README.md                            # imported from patinaproject/using-github@v2.0.0/README.md (delta 6)
      ... (supporting files: workflows/, slash commands, etc.)
    office-hours/
      SKILL.md                             # standalone; ported from patinaproject/patinaproject#1143; no README.md
    # NOTE: skills/find-skills/ DELETED in delta 7b. find-skills is no longer a patinaproject-skills skill;
    # it survives at .agents/skills/find-skills/ as a third-party vendored install only (see overlay below).
  .claude/skills/                          # Dogfood overlay (Option D1 — committed symlinks; see Gate G7)
    scaffold-repository  -> ../../skills/scaffold-repository
    superteam            -> ../../skills/superteam
    using-github         -> ../../skills/using-github
    office-hours         -> ../../skills/office-hours
    find-skills          -> ../../.agents/skills/find-skills   # third-party install symlink (delta 7b; matches other vendored skills)
  .agents/skills/                          # Dogfood overlay for Codex AND third-party vendored copies
    scaffold-repository  -> ../../skills/scaffold-repository
    superteam            -> ../../skills/superteam
    using-github         -> ../../skills/using-github
    office-hours         -> ../../skills/office-hours
    find-skills/                           # delta 7b: REAL files (vendored from vercel-labs/skills), not a symlink into skills/
      SKILL.md                             # third-party content; provenance recorded in skills-lock.json
    # ...plus the 22+ other third-party vendored skills already tracked here (brainstorming, writing-skills, etc.)
  skills-lock.json                         # committed; tracks the vercel-labs find-skills install (entry SURVIVES delta 7b)
  scripts/
    apply-scaffold-repository.js           # in-repo invocation of skills/scaffold-repository on release (path: delta 7a)
    verify-dogfood.sh                      # AC-58-3 dogfood check (4 in-repo skills; flat path; find-skills NOT iterated)
    verify-marketplace.sh                  # AC-58-2 sanity check; plugin.json.skills[] has 4 entries (delta 7b)
  release-please-config.json               # one root package; release-type: simple; extra-files rewrites .claude-plugin/marketplace.json metadata.version
  .release-please-manifest.json            # one entry: ".": "1.0.0"
  CHANGELOG.md                             # repo-root, written by release-please after the first release
  docs/
    AGENTS.md → ../AGENTS.md               # (kept at repo root; CLAUDE.md import shim references AGENTS.md)
    release-flow.md                        # rewritten for release-please; documents vercel-labs CLI version pin
    file-structure.md                      # rewritten for the flat layout
    wiki-index.md                          # canonical index of GitHub wiki pages
    superpowers/specs/...
    superpowers/plans/...
  .github/workflows/
    release-please.yml                     # single-package release-please; runs apply-scaffold-repository on every release (idempotent)
    verify.yml                             # renamed from verify-iteration.yml; display name "Verify"
    markdown.yml
    actions.yml
    pull-request.yml
  README.md, AGENTS.md, CLAUDE.md
  package.json                             # repo-root only; husky/commitlint/markdownlint dev deps
  .gitignore                               # includes .agents/skills/<third-party>/ and .claude/skills/<third-party>/
                                           # for CLI-installed skills that are NOT part of the in-repo five
```

**Deleted from the pre-flatten tree (delta 4) and still deleted after delta 6:**

- `plugins/` (entire tree — scaffold-repository, superteam, using-github wrappers)
- `.agents/plugins/` (Codex marketplace catalog tree — stays deleted; Codex installs via vercel-labs CLI only)
- `.agents/plugins/marketplace.json` and `.agents/plugins/marketplace.local.json`
- `scripts/validate-marketplace.js` (the old multi-file marketplace validator)
- `.gitattributes` `export-ignore` rules that pointed at deleted overlay directories
- Pre-existing per-plugin `release-please-config.json` / `.release-please-manifest.json` files imported as carry-over from upstream (`plugins/<name>/release-please-config.json`, `plugins/<name>/.release-please-manifest.json`)
- Per-plugin `package.json` files at `plugins/<name>/package.json` (subtree carry-over; not part of the live release pipeline)
- `packages/skills-cli/` (already absent from the prior delta)

**Re-introduced in delta 6 (reverses part of delta 4's catalog deletion):**

- `.claude-plugin/marketplace.json` — Claude Code marketplace catalog, mattpocock-style; explicit shape recorded in AC-58-2.
- `.claude-plugin/plugin.json` — Plugin definition with ordered skill paths; explicit shape recorded in AC-58-2.
- `scripts/verify-marketplace.sh` — Lighter sanity check for the mattpocock-shape catalog (one plugin entry, name matches, source is `"./"`); replaces the deleted `scripts/validate-marketplace.js`'s role in CI.

**Note on the F1→F2 reversal:** delta 4 deleted both `.claude-plugin/` and `.agents/plugins/` on operator direction (PR #59 comments objected to "local marketplace" files). Delta 6 partially reverses this on operator direction (the mattpocock/skills hybrid pattern is now the binding reference). The asymmetry — Claude Code catalog re-introduced, Codex catalog stays deleted — reflects that the operator-cited reference (mattpocock/skills) is Claude-Code-specific; Codex install continues to flow through the vercel-labs CLI with `--agent codex`. Both deltas are operator-driven and recorded in the Delta history appendix.

The wiki carries everything that used to live in per-plugin `README.md` install walkthroughs, user-facing troubleshooting, and any non-design tutorial content.

**Gitignore strategy for CLI-installed third-party skills.** A contributor running `npx skills add <some-other-source>@<some-skill>` (e.g. installing more obra/superpowers skills locally) will see the CLI write to `.claude/skills/<name>/` and `.agents/skills/<name>/`. Those CLI-installed third-party skills are gitignored so a local install doesn't pollute the repo's commit surface. The committed dogfood symlinks (five entries; one per in-repo skill) are explicitly tracked via a negative `!.claude/skills/scaffold-repository` (etc.) pattern in `.gitignore`, so they survive a directory-wide ignore rule. The exact `.gitignore` shape (negated entries vs. an allowlist sub-block) is an Executor implementation detail; the design constraint is "the five in-repo overlay symlinks are tracked; everything else under `.claude/skills/` and `.agents/skills/` is ignored."

## Canonical skill layout

This repo has one canonical home for each skill — `skills/<category>/<name>/` at the repo root (delta 6 category-organized layout), holding real files. Two thin overlay directories exist solely so the repo's own Claude Code and Codex sessions discover the five in-repo skills out of a fresh clone with no install step. A separate Claude Code marketplace catalog at `.claude-plugin/` (delta 6, mattpocock-style) enables host-native `/plugin marketplace add` installation:

```text
skills/<category>/<name>/SKILL.md     <-- canonical home (real file; the source of truth and the install target)
  ^
  | symlink (dogfood overlay; Option D1)
  |
.claude/skills/<name>/SKILL.md        <-- Claude Code skill loader scans here (dogfood overlay; flat name)
.agents/skills/<name>/SKILL.md        <-- Codex skill loader scans here (dogfood overlay; flat name)

.claude-plugin/marketplace.json       <-- delta 6: Claude Code marketplace catalog (one plugin entry, source "./")
.claude-plugin/plugin.json            <-- delta 6: plugin manifest with ordered skill paths
```

The dogfood overlay paths remain flat (`.claude/skills/<name>/`, `.agents/skills/<name>/`) because the host scanners walk the immediate children of `.claude/skills/` and `.agents/skills/`; introducing category subdirs at the overlay level would break host discovery. The symlink *targets* are category-organized (`../../skills/<category>/<name>/`), but the *symlink locations* are flat.

Rationale:

- `skills/<category>/<name>/` is the **canonical home** (delta 6). It is what the vercel-labs CLI's `<owner/repo@skill>` resolver finds when it walks the cloned repo tree for `SKILL.md` files matching `<skill>` (the CLI resolves by walking, so the category subdir does not affect resolution). It is also what `npx skills add patinaproject/skills@<name>` copies (with `--agent <agent>`) or symlinks (without `--agent`) to the consumer's local agent directory. It is also what the `.claude-plugin/plugin.json`'s `skills[]` array references (one entry per skill, `./skills/<category>/<name>` shape). For `superteam` and `using-github` the SKILL.md content is byte-equivalent to the upstream tag (and to the pre-flatten path under `plugins/<name>/skills/<name>/` and the post-delta-4 path under `skills/<name>/`) per AC-58-7. For `scaffold-repository` it carries the rename surfaces cataloged in the "Plugin rename" section.
- `.claude/skills/<name>/` and `.agents/skills/<name>/` are **dogfood overlays**. Each is a single committed symlink whose target is `../../skills/<category>/<name>/`. They exist because Claude Code's skill loader scans `.claude/skills/**/SKILL.md` and Codex's scans `.agents/skills/**/SKILL.md`; neither host scans `skills/<category>/<name>/` directly. Without the overlay, a fresh clone would have skills that are invisible to the host running in this repo's worktree. Committing the overlay symlinks (Option D1; see Gate G7) makes dogfood work without a post-clone install command.
- The overlay symlinks are **dev-time iteration aids**. The Claude Code marketplace catalog at `.claude-plugin/marketplace.json` (delta 6) points its single plugin entry at `./` (the repo root), so the catalog effectively distributes the entire repo — including the overlay symlinks. This is the operator-binding mattpocock pattern; mattpocock/skills HEAD ships exactly the same shape. The overlay symlinks are harmless under host-native install because they are symlinks to *the same skills* the consumer is installing; they do not pollute the consumer's `.claude/skills/` directory. The consumer install path (`npx skills add patinaproject/skills@<name>`) targets `skills/<category>/<name>/` directly and does not touch the overlays. The overlay symlinks travel with the repo as ordinary tracked content.
- Third-party skills installed locally via `npx skills add <other-source>@<other-skill>` land in `.claude/skills/<other-skill>/` and `.agents/skills/<other-skill>/`. These are gitignored (negated allowlist for the five in-repo overlay symlinks); see "Gitignore strategy" in the file layout above.

The vercel-labs `skills` CLI defaults to copying skill content when `--agent <agent>` is passed and to symlinking otherwise. For the in-repo `find-skills` install (`npx skills add vercel-labs/skills@find-skills --agent claude-code -y`), the CLI wrote a copy and produced `skills-lock.json` at the repo root. As part of the delta-4 flatten, the copied content is moved to `skills/find-skills/SKILL.md` (the canonical home) and the `.claude/skills/find-skills/` directory is replaced by a symlink — same shape as the four other in-repo skills. `skills-lock.json` stays committed at the repo root for reproducible re-installs.

### Skill shapes after the flatten (single pattern)

The previous design distinguished "plugin-scoped" and "standalone" skill patterns. The category-organized layout (delta 6) keeps that distinction collapsed: **every skill is a directory under `skills/<category>/` with a `SKILL.md` real file inside, possibly accompanied by supporting files (sub-skill assets, scripts, sub-directories, and — for the three ex-plugin skills — an imported `README.md`).** The shape is the same whether the skill has two files (`office-hours`, `find-skills`: SKILL.md only) or many (`superteam` with its `agents/`, `pre-flight.md`, README.md, etc.). The difference between simple and complex skills is visible from `ls skills/<category>/<name>/`, not from a wrapper directory.

What this collapses:

- **Codex plugin manifests.** Gone. There is no `.codex-plugin/plugin.json` anywhere in the tree. The vercel-labs CLI is the only Codex install path.
- **Codex marketplace entries.** Gone (delta 4; unchanged by delta 6). The `.agents/plugins/` tree stays deleted. The vercel-labs CLI resolves `@<name>` by walking the tree for Codex consumers.
- **Per-skill `package.json`.** Gone. `release-please` uses `release-type: simple`, which does not require a `package.json` per package.
- **The "promote a standalone skill to a plugin" PR shape.** No longer needed. A skill that grows files just gets more files under `skills/<category>/<name>/`. No structural promotion happens. (Re-categorization between `engineering/` and `productivity/` is a `git mv`; promotion to a different shape is not a workflow this repo supports.)

What is reintroduced (delta 6, Claude Code surface only):

- **`.claude-plugin/marketplace.json`** and **`.claude-plugin/plugin.json`** at the repo root. Mattpocock-style hybrid: marketplace.json carries one plugin entry pointing at `./`; plugin.json carries the ordered `skills[]` array. Both files together enable the host-native `/plugin marketplace add patinaproject/skills` → `/plugin install patinaproject-skills@patinaproject-skills` flow. See AC-58-2 for the exact JSON shape.

What stays:

- **A single repo-wide version stream** managed by release-please's `release-type: simple` against one root package. Tags (`v<X.Y.Z>`) exist as install pins consumers pass via `npx skills add patinaproject/skills@<name>#v<X.Y.Z>` — the same ref applies to all five skills because the CLI clones the repo at the requested ref. Per-skill version pinning was never independently meaningful in this layout (the CLI walks the cloned tree at one ref); the consolidated tag is the honest representation of what consumers actually get. The two non-release-please-managed skills (`find-skills` vendored from upstream; `office-hours` repo-versioned) install at HEAD when no `#<ref>` is given. Per-skill upstream version provenance (`bootstrap-v1.10.0`, `superteam-v1.5.0`, `using-github-v2.0.0`) is preserved on the subtree-merge commits and in the Migration history section of `docs/file-structure.md`.
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
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository#v1.0.0 --agent claude-code -y
```

The `#v<X.Y.Z>` ref pins the entire repo state, which is what the CLI actually resolves against; the same `#v1.0.0` ref works for every `@<name>` because release-please publishes one tag per repo (not one per skill). See AC-58-5 for the single-version rationale.

The `<owner/repo@skill>` syntax resolves against the published GitHub repository. The CLI clones the repo at the requested ref (default branch HEAD if no `#<ref>` is given), walks the tree for `SKILL.md` files whose frontmatter `name:` matches the requested slug, and either symlinks (no `--agent`) or copies (with `--agent`) the content into the agent's expected skill directory. `skills-lock.json` records the resolved skill SHA so subsequent re-installs reproduce the same content. The `skills@<version>` segment in the `npx` invocation is what pins the CLI itself; updating that version is a deliberate act recorded in `docs/release-flow.md`.

**Supply-chain considerations:**

- The CLI is a third-party dependency. The README install instructions pin a tested CLI **version at invocation** (e.g. `npx skills@1.5.6 add patinaproject/skills@scaffold-repository --agent claude-code -y`), not a recommended version range in prose. `npx <package>@<version>` resolves to that exact version regardless of the npm `latest` dist-tag at run time. The docs include both the upstream repo URL (`https://github.com/vercel-labs/skills`) and the tested version's published-to-npm date.
- `npx skills add` should be run with `--ignore-scripts` (`npm_config_ignore_scripts=true npx skills@<pinned> add ...`). The README documents this env-var-prefix form as the **default** invocation.
- `skills-lock.json` (produced by the CLI and committed) pins the resolved **skill** SHA, not the **CLI** version. CLI-version pinning lives in the install command syntax and in `docs/release-flow.md`.
- **Claude Code host-native marketplace fallback (re-enabled in delta 6).** `/plugin marketplace add patinaproject/skills` followed by `/plugin install patinaproject-skills@patinaproject-skills` installs all five skills via the reintroduced `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` (AC-58-2). The Codex `codex plugin marketplace add` path remains deleted; Codex consumers always go through the vercel-labs CLI with `--agent codex`.
- **Clone-and-copy fallback.** For users who distrust both the npm-distributed CLI and the host-native marketplace flow, clone the repo and copy `skills/<category>/<name>/SKILL.md` directly into the agent's skill directory; this is the manual fallback documented in `docs/release-flow.md`.
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

**Release-please configuration (post-flatten, post-delta-5 shape):**

- `release-please-config.json` — single root package keyed `"."`; `release-type: simple`; tag form `v<X.Y.Z>`; no `extra-files` block (no marketplace.json to rewrite). The per-package `skills/scaffold-repository` shape used between delta 4 and delta 5 is recorded in the Delta 4 / Delta 5 appendix entries for history; it is not the current configuration.
- `.release-please-manifest.json` — single entry `".": "1.0.0"`. The per-package seed `skills/scaffold-repository: 1.10.0` shape is similarly historical; the underlying upstream `bootstrap-v1.10.0` tag is preserved in `docs/file-structure.md`'s Migration history.

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

- Single-package mode with one root package using `release-type: simple`:
  - Package key `"."` (the repo root)
  - Tag form `v<X.Y.Z>` (no component prefix; no `tag-separator`; no `include-component-in-tag`)
  - Seed version `1.0.0` in `.release-please-manifest.json`
  - Single `CHANGELOG.md` at the repo root
- `release-type: simple` is chosen because the layout has no `package.json` at the repo root that carries a `version` field release-please should rewrite. The `simple` strategy reads the current version from `.release-please-manifest.json`, bumps it based on conventional-commit types across the whole repo (`feat:` → minor, `fix:` → patch, `BREAKING CHANGE:` → major), and writes the new version back to the manifest plus a CHANGELOG entry. No `extra-files` block — the marketplace catalog that the prior config rewrote no longer exists.
- Prior Gate G1 (tag-prefix stripping) is CLOSED-OBSOLETE: with no component prefix and no marketplace `ref` to rewrite, the rule is trivially satisfied by the plain `v<X.Y.Z>` tag form.
- The "release-please-action" step opens release PRs from `release-please--*` branches; AGENTS.md already lists this prefix alongside `bot/bump-*` as the only no-issue PRs.
- The scaffold-repository self-application step runs `scripts/apply-scaffold-repository.js` from the release-please workflow on each release-please run. With one release per repo there is no per-skill release event to gate on; the apply script is already idempotent (the existing workflow's "No scaffolding changes to commit" branch confirms this), so running it on every release is safe. An optional optimization is to inspect the release commit list for paths under `skills/scaffold-repository/**` and skip the apply when none are present — the Planner picks the exact mechanism during execution. Either way, the same workflow signs commits as `github-actions[bot]` and enables auto-merge, preserving the existing signing/auto-merge guarantees described in `docs/release-flow.md`. This is Gate G3 (STAYS — trigger condition rewritten for single-version; signing and auto-merge unchanged).
- `scripts/validate-marketplace.js` is **deleted** in this delta. There is no marketplace to validate. The workflow that ran it (`verify-iteration.yml`, renamed to `verify.yml`) loses the marketplace validation step entirely.

## Wiki migration plan

Move to the wiki (delta 6 reduced scope):

- Per-host install walkthroughs (Claude Code, Codex) with screenshots; install commands cover both the vercel-labs CLI form (`npx skills@1.5.6 add patinaproject/skills@<name>`) and — for Claude Code — the host-native form (`/plugin marketplace add patinaproject/skills`).
- Troubleshooting notes for `npx skills` install failures, CLI version pinning, and host-native install issues.
- The "how superteam runs end-to-end" narrative (longer-form than what fits in the in-repo `skills/engineering/superteam/README.md`).
- Cowork install walkthroughs (out of scope of any in-repo README).

Keep in the repo (delta 6 expanded scope — per-skill READMEs now travel in-repo):

- `AGENTS.md` (root) and the existing `CLAUDE.md` import shim
- `docs/release-flow.md` (rewritten for release-please with `release-type: simple` and the `.claude-plugin/marketplace.json` extra-files entry)
- `docs/file-structure.md` (rewritten for the category-organized `skills/<category>/<name>/` layout and dogfood overlays)
- `docs/wiki-index.md` (canonical index of remaining wiki pages — smaller after delta 6 since per-skill content moved into the repo)
- `docs/superpowers/specs/` and `docs/superpowers/plans/`
- `README.md` rewritten in mattpocock format per AC-58-9: one-paragraph tagline, two-install-path Quickstart, "Why these skills exist" problem-narrative section, no-version skills table linking to each skill folder. (Replaces the prior "reduced to" framing — the README is the primary user-facing landing surface again, not just a wiki pointer.)
- `skills/engineering/scaffold-repository/README.md`, `skills/engineering/superteam/README.md`, `skills/engineering/using-github/README.md` (per AC-58-9 imports).

The `.claude-plugin/marketplace.json`'s `metadata.description` field carries the one-line repo description so host-native `/plugin marketplace browse` users see it; the `metadata.repository` field links to the GitHub repo. The wiki link is not surfaced in the marketplace catalog — it lives in the root README only.

## Open questions

1. **(Resolved — Gate G1 CLOSED-OBSOLETE.)** Tag-prefix stripping is no longer applicable. With one release per repo and tag form `v<X.Y.Z>` (no component prefix), the rule is trivially satisfied and release-please rewrites only the `metadata.version` field in `.claude-plugin/marketplace.json` — a plain SemVer string with no prefix to strip.
2. **(Resolved — Gate G2 removed for Codex; Claude side reintroduced in delta 6.)** Codex `path:` source support is no longer applicable; the Codex marketplace catalog stays deleted. Delta 6 reintroduces the Claude Code catalog at `.claude-plugin/marketplace.json` (mattpocock-style, `plugins[0].source: "./"`); Claude Code's host-native install path is re-enabled.
3. **Scaffold-repository self-apply during release.** Gate G3 STAYS. The trigger condition is "release-please tag with prefix `scaffold-repository-`"; the self-apply runs in the same workflow run that publishes the tag. Whether the result is committed to a follow-up PR vs. directly on the default branch is a Planner-implementation detail; the M2 baseline already on this branch chose direct commit on the default branch with `github-actions[bot]` signing.
4. **CLI host detection robustness.** Resolved by adopting the vercel-labs `skills` CLI. Gate G4 REMOVED.
5. **Wiki content ownership.** Gate G5 STAYS. Recommendation: canonical wiki, with `docs/wiki-index.md` listing the wiki pages so review of wiki link-rot stays in-repo.
6. **Dogfood overlay shape (Gate G7).** D1, D2, or D3 — see Gate G7 disposition below. Recommended: D1 (committed symlinks).

## Gates resolved in-design

### Gate G1 — Tag-prefix stripping (CLOSED-OBSOLETE)

The prior design had a gate around how `release-please`'s component-prefixed tags (`scaffold-repository-v1.11.0`, etc.) would be stripped to the bare `vX.Y.Z` form required by the marketplace validator's regex. Three subsequent deltas obsoleted this gate from different angles:

- **Delta 4 (flatten).** The marketplace catalogs were deleted, so there was no manifest `ref` field for release-please to rewrite and no validator regex to satisfy.
- **Delta 5 (single-version).** Release-please now publishes a single repo-wide tag (`v<X.Y.Z>`) with no component prefix at all, so there is nothing to strip.
- **Delta 6 (mattpocock structure).** The Claude Code marketplace catalog is re-introduced at `.claude-plugin/marketplace.json`, but its `plugins[0].source` is the literal `"./"` (no `ref` field) and the field release-please rewrites is `metadata.version` (a plain `X.Y.Z` semver string, no `v` prefix and no per-skill prefix). The release-please `extra-files` block does a single-field rewrite; no regex stripping needed.

The gate remains closed-obsolete on all three grounds. Consumers pass the plain `v<X.Y.Z>` ref directly to the vercel-labs CLI: `npx skills add patinaproject/skills@<name>#v<X.Y.Z>`. Host-native marketplace consumers do not pass a ref; they get whatever `metadata.version` the catalog at HEAD advertises.

### Gate G2 — Codex `path:` source support (REMOVED)

The prior design needed Codex to accept a `path:` source in `marketplace.local.json` for the dev overlay. With the Codex marketplace catalog deleted (delta 4, unchanged by delta 6) there is no Codex `marketplace.json` to consult. Codex's skill discovery reads `.agents/skills/<name>/SKILL.md` directly, and the dogfood overlay (Option D1) satisfies that scan with committed symlinks. The gate is removed. **Delta 6 reintroduces a Claude Code catalog at `.claude-plugin/marketplace.json` (mattpocock-style); the Codex side stays gated-out because the operator's reference (mattpocock/skills) is Claude-Code-specific.**

### Gate G3 — Scaffold-repository self-apply (STAYS)

The release-please workflow runs `scripts/apply-scaffold-repository.js` on each release-please run. With single-version release-please there is no per-skill release event to gate on; the apply script is idempotent (already verified by the existing workflow's "No scaffolding changes to commit" no-op branch), so running it on every release is safe. The script's input path is `skills/scaffold-repository/` (post-flatten). An optional Planner-level optimization is to skip the apply when the release commit list contains no paths under `skills/scaffold-repository/**`; either approach satisfies the gate. Signing and auto-merge configuration are unchanged.

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
- **Vercel-labs CLI supply-chain.** Adopting an upstream CLI for the primary install path means an unpublish or compromise upstream affects our docs. Delta 6 re-introduces a host-native install fallback (Claude Code marketplace via `.claude-plugin/marketplace.json`), reducing this risk for Claude Code users — they have a working alternative if the CLI is unavailable. Codex users have no host-native fallback; their only mitigation is the clone-and-copy fallback. Mitigations: (a) pin the CLI version at the invocation site (`npx skills@1.5.6 add ...`) so README drift cannot silently change what installs; (b) recommend `npm_config_ignore_scripts=true` as the default invocation; (c) document a clone-and-copy fallback (clone the repo, copy `skills/<category>/<name>/SKILL.md` into the agent's skill directory manually) as the universal rollback in `docs/release-flow.md`; (d) record the upstream repo URL and tested version in `docs/release-flow.md`. The dogfood overlay symlinks let the user verify the fallback locally before adopting it elsewhere.
- **Dogfood overlay symlinks committed (Option D1).** Committing `.claude/skills/<name>/` and `.agents/skills/<name>/` symlinks means the repo tree includes content that doesn't function on Windows hosts without symlink support enabled. Mitigation: this repo already has symlinks via `find-skills`'s prior install; no Windows-only contributor has been encountered. If/when one is, the fallback is to clone with `git config core.symlinks true` (admin shell on Windows) or to use WSL. Documented in `README.md`. The committed symlinks resolve at file-open time on all POSIX hosts; no per-clone setup step is required there.
- **Single-release blast radius.** Once consolidated under one repo-wide version (delta 5), a bad release tag affects every skill in the repo at once — there are no per-skill version streams to roll back independently. Mitigation: a consumer holding a working `npx skills add patinaproject/skills@<name>#v<prev>` install can stay pinned to the previous tag while a follow-up release ships; the CLI's `skills-lock.json` records the resolved commit so re-installs of `@<name>#v<prev>` are reproducible. For the two non-release-please-tracked skills (`find-skills` vendored upstream; `office-hours` repo-versioned), HEAD-pinned installs propagate a bad commit immediately; mitigation is the standard PR-review gate before merge to the default branch. The blast-radius cost is the deliberate trade-off of single-version simplicity over per-skill granularity, recorded in AC-58-5.
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

### 2026-05-11 — Operator delta revision: single marketplace version (delta 5)

Source: operator-confirmed delta supplied to the Brainstormer in this thread after the delta-4 flatten landed and CI was green at commit `a930463`. The delta replaces the per-skill release-please configuration that delta 4 carried forward (one `release-type: simple` package per skill, three component-prefixed tag streams) with a single repo-wide release-please configuration (one root `release-type: simple` package, one `v<X.Y.Z>` tag stream).

Rationale (operator-supplied, recorded for audit):

1. **Ecosystem convention.** Comparable repos surveyed at the time of this delta all ship a single tag stream:
   - `vercel-labs/skills` (the CLI itself): one tag at `v1.5.6`.
   - `obra/superpowers` (14 sub-skills): one tag at `v5.1.0`, with sub-skill versions synced via `.version-bump.json`.
   - `anthropics/skills` (3 plugins, ~14 skills): single `marketplace.metadata.version: 1.0.0` with no per-plugin version field.
2. **CLI consumption shape.** `npx skills add patinaproject/skills@<name>#<ref>` resolves one Git ref per repo. The CLI clones the cloned-repo's tree at that ref and walks for `SKILL.md` files matching the slug. Component-prefixed per-skill tags like `superteam-v1.5.0` are therefore not "the superteam skill at v1.5.0 with everything else at HEAD" — they are "the entire repo at the commit pointed to by the `superteam-v1.5.0` tag," which is functionally identical to any repo-wide tag pointing at the same commit.
3. **Reproducibility duplication.** `skills-lock.json`'s `computedHash` already pins per-skill content for reproducible re-installs; per-skill version tags would duplicate that signal without adding pin granularity.

The operator-binding deltas absorbed in this revision:

1. **AC-58-5 rewritten.** Replaces the per-skill `release-type: simple` description with the single root package configuration: `release-please-config.json` declares one package keyed `"."`; `.release-please-manifest.json` has one entry `".": "1.0.0"`; tag form is `v<X.Y.Z>`; single `CHANGELOG.md` at the repo root. The seed version is `1.0.0` (rationale below). Falsifiable checks added.
2. **Initial version `1.0.0`.** Considered alternatives: `2.0.0` (carry forward `using-github@v2.0.0`'s major), `5.0.0` (match `obra/superpowers`'s consolidated `v5.x` cadence). Both rejected because they imply prior-major history of `patinaproject/skills` that does not exist. `1.0.0` is the canonical "first stable release of this consolidated surface" and matches `anthropics/skills`'s starting point. Underlying upstream version provenance (`bootstrap-v1.10.0`, `superteam-v1.5.0`, `using-github-v2.0.0`) lives on the subtree-merge commits and in `docs/file-structure.md`'s Migration history.
3. **Gate G1 reframed from REMOVED to CLOSED-OBSOLETE.** The tag-prefix stripping rule is obsoleted on two grounds: delta 4 deleted the marketplace catalog (no `ref` field to write), and delta 5 eliminated component prefixes entirely (nothing to strip).
4. **Gate G3 trigger condition rewritten.** With one release per repo, the previous "tag prefix `scaffold-repository-`" trigger no longer fits. The scaffold-repository self-apply step runs unconditionally on every release-please run, relying on the script's existing idempotency (the "No scaffolding changes to commit" no-op branch is already in the live workflow). Optional Planner-level optimization: skip the apply when the release commit list contains no paths under `skills/scaffold-repository/**`. Signing and auto-merge guarantees unchanged.
5. **Consistency edits.** Summary, Goals, Proposed file layout, Option F1 description, "What stays" bullet, `npx skills` examples, `release-please` configuration shape section, Plugin rename release-please configuration block, Open questions Gate G1 entry, and Risks "Single-release blast radius" bullet all updated for the single-version configuration.

No prior acceptance criterion was weakened. AC-58-5 was rewritten in scope rather than removed; AC-58-1 through AC-58-4 and AC-58-6 through AC-58-8 are unchanged. No non-negotiable rule was removed.

#### Delta-only adversarial review (single-version)

Reviewer context: same-thread Brainstormer fallback. No fresh subagent was available in this thread; the review below is the same teammate re-reading the delta-5 absorption against the four dimensions named in the operator prompt (per-skill version-signal loss, initial version choice, consumer pin path, migration history preservation).

1. **Loss of per-skill version communication.** With one version, a `scaffold-repository` patch and a `superteam` feature both bump the same version. Acceptable trade-off: (a) the *kind* of change is still preserved via conventional-commit types (`feat:` → minor, `fix:` → patch, breaking → major), so the version still signals "what severity of change shipped"; (b) per-skill grouping inside the CHANGELOG cannot be driven by conventional-commit scopes because this repo's commitlint config forbids scopes (per AGENTS.md), and amending the commit convention is out of scope for this delta. The accepted mitigation is "commit messages already reference the issue and identify changed paths via the diff; readers cross-reference per-skill attribution via the linked issue." Disposition: documented in AC-58-5; not a regression because per-skill version-pin granularity was never independently consumable (see finding 3 below).

2. **Initial version choice.** Is `1.0.0` confusing given the underlying skills are at v1.10.0 / v1.5.0 / v2.0.0? Slightly, but correctly framed: `patinaproject/skills@v1.0.0` is the version of the *marketplace repository*, not of any individual underlying skill. Consumers no longer pin per-skill versions (the repo-wide tag is what the CLI resolves), so the underlying-skill version numbers stop being a public pin surface. The Migration history section of `docs/file-structure.md` and the Plugin rename / Ported skills catalogs in this design doc preserve the upstream version provenance for audit. Alternatives `2.0.0` and `5.0.0` were rejected because they imply prior-major history of this repo that does not exist. Disposition: `1.0.0` chosen; documented in AC-58-5 with rationale.

3. **Consumer pin path.** The pre-delta-5 *theoretical* per-skill pin shape `patinaproject/skills@superteam#superteam-v1.5.0` was never independently meaningful. The vercel-labs CLI's `<owner/repo@skill>#<git-ref>` resolver clones the repo at `<git-ref>` and walks the cloned tree for `SKILL.md` files — so the user gets "the superteam skill as it existed at that tag's commit," not "just the superteam skill at v1.5.0 with everything else at HEAD." Post-delta-5 pins `patinaproject/skills@<name>#v<X.Y.Z>` work identically for any of the five skills. Disposition: not a regression; the user-visible install behavior is unchanged. Documented in AC-58-5 and the "What stays" bullet.

4. **Migration history preservation.** The upstream tags `bootstrap-v1.10.0`, `superteam-v1.5.0`, `using-github-v2.0.0` live on the upstream archived repos (`patinaproject/bootstrap`, `patinaproject/superteam`, `patinaproject/using-github`), not in this repo's `git tag` output. The subtree-merge commits in this repo (`912d6d9`, `028165e`, `54157bc`) carry the imported history and are referenced in `docs/file-structure.md`'s Migration history section. AC-58-5 explicitly records that the underlying per-skill upstream tags are preserved in those records rather than as live tags on this repo. Disposition: clean pass; existing migration-history records are sufficient and no new artifact is required.

No material findings required further revisions beyond what the delta absorption already encodes. The single-version configuration aligns this repo with the ecosystem convention surveyed in the operator's rationale and removes one layer of release-please configuration complexity (three packages → one package) without affecting any AC-58-1 through AC-58-4 or AC-58-6 through AC-58-8 invariant. The information-loss of per-skill version-signal in the CHANGELOG header is the deliberate trade-off recorded in AC-58-5; it is not a regression because per-skill pin granularity was never independently meaningful.

### 2026-05-12 — Operator delta revision: adopt mattpocock/skills structure (delta 6)

Source: three operator feedback items supplied to the Brainstormer in this thread after delta 5 landed and CI was green at commit `6d945df`. The operator's reference is [mattpocock/skills](https://github.com/mattpocock/skills) (verified at HEAD during this delta) plus the [fuleinist/skills-1 PR](https://github.com/fuleinist/skills-1/pull/1) that introduces the same pattern variant with the marketplace.json shape. The operator-binding deltas absorbed in this revision are organized by feedback item.

#### Feedback item 1: adopt mattpocock-style marketplace catalog with plugin name `patinaproject-skills`

This **partially reverses delta 4's catalog deletion**. Delta 4 deleted `.claude-plugin/marketplace.json` and `.claude-plugin/marketplace.local.json` on operator direction (PR #59 comments 3220051689 and 3220059128). Delta 6 reintroduces both `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` (the latter is new in delta 6; the former is reinstated) in the mattpocock/skills hybrid shape, also on operator direction. The Codex-side `.agents/plugins/` catalog stays deleted because the mattpocock reference is Claude-Code-only.

The reversal is explicit, not silent: the operator's prior PR-59 comments and the operator's delta-6 prompt are both binding direction. Both are honored in sequence; neither is papered over. The cost — re-creating files we just deleted, plus one new `.claude-plugin/plugin.json` — is the deliberate trade-off accepted as a learning iteration. (Adversarial review records the cost; the operator's binding direction makes acceptance non-negotiable.)

Absorbed deltas:

1. **AC-58-2 rewritten.** The "no marketplace manifests" assertion is replaced by the explicit mattpocock-shape catalog spec: one `.claude-plugin/marketplace.json` and one `.claude-plugin/plugin.json`, both at the repo root. The exact JSON shape for both files is recorded in AC-58-2 with the plugin name `patinaproject-skills` (operator-specified slug) appearing in three places: `marketplace.json.name`, `marketplace.json.plugins[0].name`, and `plugin.json.name`. The `plugins[0].source` is the literal `"./"` (the plugin's source is the repo itself), and `plugins[0]` does **not** carry a `ref` field — release-please rewrites only the `metadata.version` field on each release.
2. **AC-58-1 amended.** A new bullet records that the repo carries exactly one `.claude-plugin/plugin.json` and one `.claude-plugin/marketplace.json` at the root (the only plugin manifests in the tree); the `find` falsifiable check is updated to allow these two paths in addition to the repo-root `package.json`.
3. **AC-58-4 rewritten.** Two install paths now coexist: vercel-labs CLI (primary, per-skill granular) and host-native marketplace (secondary, all-five-skills install). The host-native path uses `/plugin marketplace add patinaproject/skills` followed by `/plugin install patinaproject-skills@patinaproject-skills`. Both paths are documented in the new root README.
4. **AC-58-5 amended.** Release-please's `extra-files` block is reintroduced for one purpose: rewrite `metadata.version` in `.claude-plugin/marketplace.json` on each release. The `simple` strategy still drives the version bump; the `extra-files` block ensures host-native install consumers see the same version the Git tag advertises. No `plugins[0].source.ref` rewrite (the field doesn't exist in the mattpocock shape).
5. **Gate G1 disposition extended.** The CLOSED-OBSOLETE state is reaffirmed for a third reason (delta 6): the reintroduced `marketplace.json` carries no `ref` field for release-please to rewrite, and the `metadata.version` field is a plain SemVer string with no prefix — so there is still nothing to strip.
6. **Gate G2 disposition refined.** REMOVED for Codex stays in force; the gate now notes explicitly that the Claude side has a catalog (re-introduced in delta 6) while the Codex side does not.

#### Feedback item 2: per-skill READMEs and a no-version table linking to each skill folder

Absorbed deltas:

1. **New AC-58-9** captures the README rewrites: root `README.md` follows mattpocock format, per-skill READMEs imported from upstream for the three ex-plugin skills, no per-skill READMEs for the two standalones (matching mattpocock's pattern for per-skill folders without imported README content). The five `Source:` references and the install-block reframe are recorded explicitly.
2. **Reference correction on mattpocock per-skill README pattern.** Verification at design time of `mattpocock/skills` HEAD showed that per-skill folders contain `SKILL.md` plus optional companion `.md` files (e.g. `tests.md`, `mocking.md`) — **not** `README.md` files. Per-skill READMEs are an *addition* on top of mattpocock's pattern for skills that have substantial upstream README content worth preserving (the three ex-plugin skills); the two standalones get `SKILL.md` only, which is fidelity to mattpocock. The category-level READMEs that mattpocock ships (`skills/engineering/README.md`, `skills/productivity/README.md`) are **not** carried into delta 6 because the root README's "Skills table" subsumes the category-overview role; the Planner may revisit this if the root README grows too long.
3. **AC-58-6 wiki migration reframed.** Per-skill walkthroughs are no longer on the wiki — they live in `skills/<category>/<name>/README.md` for the three ex-plugin skills. The wiki retains longer-form troubleshooting and the multi-step "how superteam runs end-to-end" narrative only.

#### Feedback item 3: rewrite root README in mattpocock format, framed around "skills used by the Patina Project team"

Absorbed deltas:

1. **AC-58-9 root-README rewrite spec.** The mattpocock structure is followed (title, optional badge, tagline, Quickstart, Why these skills exist, Skills table) with Patina-equivalent content. The newsletter signup and logo banner are dropped (we don't have them). The version column is dropped from the Skills table (release-please publishes one tag per repo per AC-58-5; per-skill versions are not meaningful).
2. **CLI pin retained at `@1.5.6`**, deviating from mattpocock's `@latest`. The deviation is footnoted in the README and elaborated in the adversarial review below. Operator direction for this delta is "match mattpocock for structure"; the supply-chain hardening from delta 4 is a binding prior decision the operator did not waive in delta 6. The two directives are reconciled by adopting the structure but documenting the pin deviation; if the operator wants `@latest` instead, the Planner can swap the version-pin during execution without affecting any AC text.
3. **Skills table links to in-repo skill folders.** Each row's first cell links to `skills/<category>/<name>/` (folder) for the three ex-plugin skills and to `skills/<category>/<name>/SKILL.md` (file) for the two standalones. Reviewers can click through to see the skill source.

#### Category subdir decision (operator-deferred; this design picks)

The operator's prompt presented two options: adopt `skills/<category>/<name>/` (mattpocock fidelity) or keep `skills/<name>/` flat. This design picks **category subdirs** for the following reasons:

1. **Reference fidelity.** mattpocock's HEAD ships `skills/engineering/<name>/` and `skills/productivity/<name>/`; matching the reference structure makes the operator's "adopt mattpocock structure" directive maximally honored.
2. **Future scale.** As the skill count grows past five, a flat directory becomes harder to navigate. Categorization shifts the navigation cost from "scan 10+ entries" to "pick category, then pick from 2-5 entries per category."
3. **Cost is bounded.** The categorize step is one `git mv` per skill (five total). Per-file blame survives the `git mv` chain (delta-1 subtree → delta-2 rename → delta-4 flatten → delta-6 categorize is four steps; `git mv` rename detection handles arbitrary chains).

The cost is recorded as an item in AC-58-8 (migration history extended to four events for the scaffold skill, three events for `superteam`/`using-github`, two events for the two standalones). The category assignment is `engineering/` for `scaffold-repository`, `superteam`, `using-github`; `productivity/` for `office-hours`, `find-skills` (per the operator's prompt's recommended assignment).

#### Other delta-6 amendments

1. **AC-58-3 dogfood verification path-updated.** The overlay symlink targets shift from `../../skills/<name>/` (delta 4) to `../../skills/<category>/<name>/` (delta 6); the AC's worked-example section is added so reviewers can verify the relative-path math is correct (both sides depth 2; the symlink resolves cleanly).
2. **AC-58-7 SHA-256 round-trip extended to the four-step chain.** The pre-flatten value at `plugins/superteam/skills/superteam/SKILL.md` must equal the post-delta-4 value at `skills/superteam/SKILL.md` must equal the post-delta-6 value at `skills/engineering/superteam/SKILL.md`. Each `git mv` is index-only; the file bytes are preserved across all three transitions.
3. **AC-58-8 migration history extended.** The categorize event is recorded as the fourth event for `scaffold-repository`, the third event for `superteam` and `using-github`, and the third event for the standalones. README imports are recorded as new-file creations (no `git mv` chain) with the upstream tag SHA as provenance.
4. **`Deleted from the pre-flatten tree` section reframed.** The "Re-introduced in delta 6" subsection makes the partial F1→F2 reversal explicit and lists the two re-created files plus the new `verify-marketplace.sh`.
5. **Proposed file layout regenerated** to show the category-organized tree, the `.claude-plugin/` catalog, and the new per-skill `README.md` files at the right places.
6. **`scripts/validate-marketplace.js` stays deleted (delta 4).** The replacement check is a lighter `scripts/verify-marketplace.sh` (delta 6) that validates the mattpocock-shape (one plugin entry, name matches plugin.json, source is `"./"`) — full script specification is a Planner implementation detail.

No prior acceptance criterion was weakened. AC-58-1, AC-58-2, AC-58-3, AC-58-4, AC-58-5, AC-58-6, AC-58-7, and AC-58-8 are all amended in scope; AC-58-9 is added. No non-negotiable rule was removed. The byte-equivalence requirement for `superteam` workflow-contract surfaces (AC-58-7) is reinforced by the categorize being another pure `git mv`.

#### Delta-only adversarial review (mattpocock structure)

Reviewer context: same-thread Brainstormer fallback. No fresh subagent was available in this thread; the review below is the same teammate re-reading the delta-6 absorption against the four dimensions named in the operator prompt (F1→F2 reversal cost, category subdirs vs. flat, per-skill README import quality, CLI install pin `@1.5.6` vs. `@latest`).

1. **F1→F2 reversal cost** (source: AC-58-2 rewrite, "Re-introduced in delta 6" subsection in the file layout). Delta 4 deleted the marketplace catalog on the operator's PR-59 directive. Delta 6 reintroduces a subset of it (Claude side only, mattpocock shape) on the operator's delta-6 directive. The cost is concrete: re-creating one `.claude-plugin/marketplace.json` (similar shape to the deleted file but with `source: "./"` instead of `source: { source: 'github', ... }`) and creating one new `.claude-plugin/plugin.json` (not present in any prior delta). Reviewer position: the cost is bounded (two small JSON files, no code) and the iteration is legitimate — the operator's reference (mattpocock/skills HEAD) is materially different from the delta-4 reference (vercel-labs/skills) and the operator has updated direction accordingly. Accepted as a learning iteration. Recorded explicitly in the "Re-introduced in delta 6" subsection so the F1→F2 reversal is visible to future reviewers; the alternative ("keep F1, ignore delta 6") would have ignored binding operator direction. Disposition: clean pass; accept the reversal.

2. **Category subdirs vs. flat** (source: AC-58-1 rewrite, Category subdir decision section above). The trade-off was named in the operator prompt and resolved by picking category subdirs for the three reasons above (fidelity, scale, bounded cost). Reviewer position: the alternative (keep flat) has one significant benefit — the existing five-skill tree is small enough that the navigation cost of categorization is arguably unnecessary today. However, the operator's reference is unambiguously category-organized at mattpocock HEAD (`skills/engineering/`, `skills/productivity/`), and "adopt mattpocock structure" with category subdirs absent would be a partial adoption that costs *more* over time than committing to the structure now. The `git mv` chain extension cost is one-time and bounded. Disposition: clean pass; category subdirs adopted.

3. **Per-skill README import quality** (source: AC-58-9, line counts surveyed at design time). The three upstream READMEs are substantive (`bootstrap` 269 lines, `superteam` 250 lines, `using-github` 236 lines) and contain real onboarding content: mermaid flowcharts, problem narratives, code examples, "what you get" sections. Each contains an obsolete install block referencing the pre-delta-4 marketplace install pattern; AC-58-9 specifies stripping these blocks and pointing back to the root README. Concrete edits per file are mechanical (three categories: title rename, install-block reframe, `Source:` line addition); no rewriting of content. Reviewer position: the content is good enough to import; the alternative ("write per-skill READMEs from scratch") would discard 700+ lines of existing high-quality content the original authors already produced. mattpocock's per-skill folders do **not** ship README.md (corrected reference; mattpocock ships category-level READMEs at `skills/<category>/README.md`), so introducing per-skill READMEs is a slight *extension* of the reference pattern rather than fidelity to it. The extension is justified by the existing high-quality upstream content; without it, the imported content would be lost. Disposition: clean pass; import the three READMEs with the three categories of edit.

4. **CLI install pin (`@1.5.6` vs. `@latest`)** (source: AC-58-4, AC-58-9). mattpocock's reference uses `npx skills@latest add mattpocock/skills`. Delta 6's adopted README spec uses `npx skills@1.5.6 add patinaproject/skills@<name>`. The deviation is deliberate: delta 4's adversarial review (recorded in the delta-4 history entry) made supply-chain hardening a binding decision — `npx <pkg>@<latest-tag>` resolves to whatever the npm `latest` dist-tag points at when the command runs, which means a compromised or unpublished upstream changes installed behavior silently; `npx <pkg>@<version>` resolves to that exact version regardless of the dist-tag. This decision was operator-confirmed in delta 4. Delta 6's operator direction ("adopt mattpocock structure") is structural; it does not explicitly waive the supply-chain decision. Reviewer position: keep the `@1.5.6` pin and footnote the deviation; if the operator explicitly waives the supply-chain pin during Gate 1 review, the Planner can swap `@1.5.6` for `@latest` in the README without affecting any AC text. Both options are documented in the Gate 1 packet so the operator can make the trade-off explicit. Disposition: clean pass with explicit trade-off recorded; default is `@1.5.6` pin retained.

No material findings required further revisions beyond what the delta absorption already encodes. The four dimensions in the operator prompt are all resolved with clean passes (1 and 3 with explicit acceptance of bounded cost, 2 with explicit decision, 4 with explicit trade-off and reversible default). One observation worth flagging for the Gate 1 packet: the operator's note that mattpocock's marketplace.json shape (as quoted in the operator prompt) matches the `fuleinist/skills-1` PR rather than mattpocock HEAD — at HEAD, mattpocock ships only `.claude-plugin/plugin.json` (no `marketplace.json`). Both shapes are valid Claude Code marketplace patterns; the operator's reference is the PR-shape, so this delta adopts the PR-shape. If the operator prefers HEAD-shape (plugin.json only, no marketplace.json), the design would need to drop `.claude-plugin/marketplace.json` from AC-58-2 and the host-native install path from AC-58-4 (the host-native flow requires `marketplace.json`). This option is left as a Gate 1 question rather than as a design decision because the operator's prompt explicitly cited the PR-shape with the exact JSON.

### 2026-05-12 — Operator delta revision: de-categorize and drop find-skills (delta 7)

Source: two operator feedback items supplied to the Brainstormer in this thread after delta 6 landed and CI was green at commit `518f9df` on PR #59. The two operator-binding deltas are:

**Delta 7a — De-categorize.** Operator direction verbatim: "remove engineering/productivity separation in the skills directory." Revert delta 6's category subdirs. The four in-repo skills move from `skills/<category>/<name>/` back to `skills/<name>/`:

- `skills/engineering/scaffold-repository/` → `skills/scaffold-repository/`
- `skills/engineering/superteam/` → `skills/superteam/`
- `skills/engineering/using-github/` → `skills/using-github/`
- `skills/productivity/office-hours/` → `skills/office-hours/`

The dogfood overlay targets revert from `../../skills/<category>/<name>/` (delta 6) back to `../../skills/<name>/` (delta 4 + delta 7a shape). The `.claude-plugin/plugin.json.skills[]` array entries revert from `./skills/<category>/<name>` to `./skills/<name>`. All other delta-6 absorptions (mattpocock-style catalog at `.claude-plugin/`, per-skill READMEs, mattpocock-format root README, single-version release-please) are preserved.

**Delta 7b — Drop `find-skills` from `patinaproject-skills`.** Operator direction verbatim: "Remove find-skills from patinaproject-skills entirely... document that users install it separately via `npx skills add vercel-labs/skills@find-skills`." Concrete changes:

- `skills/find-skills/` (the patinaproject-skills source-of-truth copy at the end of delta 7a, prior to delta 7b) is deleted entirely.
- `.claude-plugin/plugin.json.skills[]` drops the `find-skills` entry (4 paths remaining, not 5).
- `.claude-plugin/marketplace.json.plugins[0].description` drops the `find-skills` mention from its skill enumeration.
- `.agents/skills/find-skills/` becomes a **real-file vendored copy** (not a symlink into `skills/`). The simplest mechanism is to re-run `npm_config_ignore_scripts=true npx skills@1.5.6 add vercel-labs/skills@find-skills --agent claude-code -y`, which writes the real file at `.agents/skills/find-skills/SKILL.md`, creates `.claude/skills/find-skills` as a symlink into `.agents/skills/find-skills/` (matching the install topology of the 22+ other third-party vendored skills already at `.agents/skills/`), and refreshes the `skills-lock.json` entry. The previous in-tree symlink at `.claude/skills/find-skills` -> `../../skills/productivity/find-skills` is replaced by the CLI-managed symlink to the vendored copy.
- `scripts/verify-dogfood.sh` is updated to iterate over **four** skills instead of five (the `find-skills` row is removed from the in-repo skill loop).
- `scripts/verify-marketplace.sh` (if it spot-checks `find-skills` against the plugin.json skills array) is updated to assert `find-skills` is absent.
- Root `README.md`: `find-skills` is removed from the "Why these skills exist" section and from the Skills table. A new short "Related skills" note appears in the Quickstart section pointing at `vercel-labs/skills@find-skills` with the pinned install command.
- `skills-lock.json`: the `find-skills` entry **is preserved** — it records the third-party vendored install (source `vercel-labs/skills`) and is unchanged by the drop. The drop only removes `find-skills` from the in-repo `skills/` tree and from `patinaproject-skills`-the-plugin; it does not remove `find-skills` from the contributor's editor or from the dogfood overlay.
- Migration history (`docs/file-structure.md`): records delta 7b as a discrete event in the `find-skills` provenance chain (initial install → flatten → categorize → drop). The categorize event remains recorded (it happened); the drop is the new terminal event.

**Order decision.** Delta 7b executes **before** delta 7a within the same commit cycle. Rationale: removing `skills/productivity/find-skills/` first keeps the de-categorize `git mv` chain at four moves (the four survivors). The reverse order (de-categorize first, then drop) would require a no-op intermediate move of `skills/productivity/find-skills/` → `skills/find-skills/` followed immediately by a `git rm -rf skills/find-skills/`. Delta 7b → 7a is one step shorter. The order is recorded in AC-58-1 explicitly so the Planner inherits the constraint.

ACs amended in this delta: AC-58-1 (flat layout, 4 skills, 7b-then-7a order recorded), AC-58-2 (catalog skills[] has 4 entries, find-skills excluded), AC-58-3 (dogfood check covers 4 skills with flat-path overlay targets), AC-58-4 (Related-skills install path documented), AC-58-5 (scaffold-repository self-apply path reverts to `skills/scaffold-repository`), AC-58-6 (wiki migration drops the find-skills page and references flat paths), AC-58-7 (SHA-256 round-trip extends to a five-step chain that returns to the flat path — categorize+de-categorize is a round trip), AC-58-8 (migration history extended with delta 7 events for all four survivors plus the find-skills drop), AC-58-9 (skills table has 4 rows, no category column, Related skills note added). No AC was deleted. No non-negotiable rule was removed.

#### Delta-only adversarial review (delta 7)

Reviewer context: same-thread Brainstormer fallback. No fresh subagent was available; the review below is the same teammate re-reading the delta-7 absorption against the four dimensions named in the operator prompt (de-categorize reversal cost, find-skills removal coherence, single-skill drop precedent, PR #59 amend cost).

1. **De-categorize reversal cost.** Delta 6 categorized; delta 7a de-categorizes. Yet another reversal. The cost is concrete: four `git mv` operations (one per surviving skill) and an in-place edit of `.claude-plugin/plugin.json.skills[]` to drop the `engineering/` and `productivity/` segments. The dogfood overlay symlinks have to be re-targeted (delete the four delta-6 symlinks, recreate them pointing at the flat path); equivalently a `git mv` of the symlink file plus a `ln -sfn` to update the target — either approach is in the noise. The cost is bounded and reviewable. Reviewer position: accept as iteration. The reversal is the operator's binding direction; the alternative ("keep delta-6 categorization") would ignore that direction. Both delta 6 and delta 7 are honored in sequence. **Disposition: clean pass; accept the reversal; document explicitly so future reviewers see the reversal rather than confused inconsistency.**

2. **find-skills removal coherence.** Three questions: (a) Does the third-party vendored copy at `.agents/skills/find-skills/` survive the move? (b) Does the overlay topology match the 22+ other third-party vendored skills already at `.agents/skills/`? (c) Does `skills-lock.json` remain self-consistent? Reviewer answers:
   - (a) Yes. The `.agents/skills/find-skills/` real-file copy is produced by `npx skills add vercel-labs/skills@find-skills`, which is the same CLI-managed third-party install topology used for the other 22+ vendored skills (`brainstorming`, `writing-skills`, `superpowers`, etc. — see `ls .agents/skills/` in the current working tree, which lists 30+ vendored skills). The find-skills entry blends into that set after the in-repo source-of-truth is removed.
   - (b) Yes. The other vendored skills already at `.agents/skills/` are managed by the same CLI; the `.claude/skills/<name>` symlinks for them point at `../../.agents/skills/<name>/` (the CLI's default cross-host topology). The post-delta-7b shape for `find-skills` matches: real file at `.agents/skills/find-skills/SKILL.md`, symlink at `.claude/skills/find-skills` → `../../.agents/skills/find-skills`. This is a topology change from delta 6 (where the symlink pointed into `skills/productivity/find-skills/`) but it brings `find-skills` in line with all other third-party skills. **Topology is coherent.**
   - (c) Yes. `skills-lock.json`'s `skills.find-skills` entry records `source: vercel-labs/skills` and the resolved skill SHA. It does not reference `skills/` (the in-repo source-of-truth tree) at all; the lock entry is about the third-party install, not about the in-repo marketplace. The drop preserves the entry verbatim.
   - **Disposition: clean pass. All three sub-questions resolve to "yes, coherent." The drop is a clean reframing from "patinaproject-skills owns find-skills" to "vercel-labs/skills owns find-skills and we just install it like any other third-party skill."**

3. **Single-skill drop precedent.** If `find-skills` can be dropped because "it belongs to vercel-labs," does that suggest a future where the line between "ours" and "vendored" blurs? Reviewer position: yes, and the design should record the criterion explicitly so future drops/keeps are decidable. The criterion is: **a skill is part of `patinaproject-skills` (= a row in the catalog and a real file at `skills/<name>/`) if the Patina Project team wrote and maintains it. A skill is vendored (= real file at `.agents/skills/<name>/`, recorded in `skills-lock.json`, installed via the vercel-labs CLI from its source repo) if it is authored and maintained elsewhere and we consume it as a third party.** By that criterion:
   - `scaffold-repository`, `superteam`, `using-github` are ours (originally three separate Patina repos, now consolidated here).
   - `office-hours` is ours (authored by the Patina team for the Patina internal flow; ported from `patinaproject/patinaproject` PR #1143).
   - `find-skills` is vendored (authored and maintained at `vercel-labs/skills`; we install it as a third-party dependency).
   - The other 22+ skills at `.agents/skills/` (superpowers, etc.) are vendored.
   This criterion lets future drops/keeps be decided without operator input on each one. **Disposition: criterion recorded in this adversarial review entry; the Planner is expected to propagate it into `AGENTS.md`'s "Skill Releases" section as part of executing delta 7.**

4. **PR #59 amend cost.** Delta 7 adds: ~5 directory moves (4 surviving skills back to flat + 1 directory deletion for find-skills), edits to `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (drop find-skills, restore flat paths), edits to `scripts/verify-dogfood.sh` and `scripts/verify-marketplace.sh` (4 instead of 5; drop find-skills mentions), edits to `README.md` (drop find-skills row, add Related skills note), edits to the three per-skill READMEs (`scaffold-repository/README.md`, `superteam/README.md`, `using-github/README.md`) only if those README files use any path string that mentions `engineering/` (regex `skills/engineering/`) — most don't and stay verbatim. The `.agents/skills/find-skills/` directory gains real files via CLI re-install. The diff is bounded and reviewable. PR #59 stays open and amends in place per operator's binding instruction. **Disposition: clean pass; bounded cost; recorded.**

No material findings required further revisions beyond what the delta absorption already encodes. The four dimensions in the operator prompt are all resolved with clean passes. The single-skill drop precedent (#3) introduces a new design rule (the ours-vs-vendored criterion) that the Planner is expected to propagate into AGENTS.md during execution; this is not an AC change because AGENTS.md is not bound by an AC, but it is a concrete handoff item to the Planner.
