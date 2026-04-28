# Design: Sharpen commit-type guidance for product-surface changes [#54](https://github.com/patinaproject/bootstrap/issues/54)

## Context

Issue #48 already established the rule that behavior-changing Markdown on
product surfaces (`skills/**`, plugin metadata, agent-facing instructions,
workflow gates) must use a release-triggering Conventional Commit type
(`feat:` / `fix:`) rather than `docs:` or `chore:`. The guidance landed in
`AGENTS.md`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`,
`agent-plugin/README.md.tmpl`, and `.github/copilot-instructions.md` via
templates.

The rule is not landing in practice. A `git log` survey of this repository
shows repeated `docs:` commits that touched product surfaces:

- `082c5e9 docs: #46 standardize Patina Project name` — touched
  `.codex-plugin/plugin.json`, `skills/bootstrap/SKILL.md`,
  `skills/bootstrap/agent-spawn-template.md`,
  `skills/bootstrap/pr-body-template.md`, and three template files under
  `skills/bootstrap/templates/**`. Plugin manifest + skill body + templates
  are all product surfaces; this should have been `feat:`.
- `d6fe7d5 docs: #14 align agents and pr template with source-of-truth docs`
  — touched `AGENTS.md` and `.github/pull_request_template.md` (the
  workflow contract).
- `0b6ebf0 docs: #11 incorporate issue filing style into templates` —
  touched `.github/ISSUE_TEMPLATE/**`, `.github/LABELS.md`.
- `7f1a1a5 docs: #7 instruct agents to follow .github/ templates` —
  touched `AGENTS.md` and `skills/bootstrap/templates/core/AGENTS.md.tmpl`
  (a workflow contract that ships through every bootstrapped repo).
- `9e32a1b docs: #3 align marketplace id and add per-tool install docs` —
  touched `skills/bootstrap/SKILL.md`,
  `skills/bootstrap/audit-checklist.md`,
  `skills/bootstrap/templates/agent-plugin/README.md.tmpl`,
  `skills/bootstrap/templates/core/.claude/settings.json`.

Every one of those commits is a release-triggering product-surface change
that was typed as `docs:`. Release Please's `node` configuration treats
`docs:` and `chore:` as non-bumping, so each misclassification silently
suppresses a release for changes that do alter installed behavior in
downstream consumers.

The current `AGENTS.md` "Commit type selection" section already states the
correct rule, including the explicit sentence "Edits to `skills/**/SKILL.md`
and adjacent skill workflow contracts are product/runtime changes by
default, not documentation edits." Despite that, agents continue to choose
`docs:`. The current guidance fails on three independent dimensions:

1. **It explains correctness, not the mistake.** The table tells you what
   each type means but does not show side-by-side WRONG vs RIGHT examples
   keyed off the most common rationalizations ("it's just Markdown", "it's
   just a template", "I'm aligning wording").
2. **It is rationalizable.** The qualifying clause "unless the change is
   clearly explanatory-only and does not alter installed skill behavior"
   gives an agent a self-selected escape hatch. Agents under time pressure
   read every change as "explanatory-only" because the bar for "alters
   installed behavior" is not anchored to a concrete test.
3. **The rule lives only in `AGENTS.md` / `CONTRIBUTING.md` / `RELEASING.md`
   prose.** It is not surfaced in the per-tool agent instructions
   (`.cursor/rules/{{repo}}.mdc`, `.windsurfrules`,
   `.github/copilot-instructions.md`) with the same level of detail.
   Those surfaces give a one-line summary that is easy to skim past, and
   they do not list the rationalizations the table needs to close.

This design closes those failure modes by treating commit-type guidance the
way `superpowers:writing-skills` treats discipline rules: the rule must be
unmissable, every common rationalization must be named and refuted, and
WRONG → RIGHT examples must appear at the decision point. Per-surface
parity is required so an agent that only loads one of `.cursor`,
`.windsurfrules`, or `copilot-instructions.md` still sees enough of the
rule to pick correctly.

The fix is shipped through `skills/bootstrap/templates/**` so every
bootstrapped repo inherits it, and the templates-first / round-trip
discipline (template edit → bootstrap realignment → root mirror) is
preserved.

This issue was split from #53 and is the agent-facing-guidance half of
that pair. Per the issue's non-goals, this design does **not** introduce
new commitlint rules, PR-title CI checks, or any other automated
enforcement, and does not retroactively re-type past commits.

## Requirements

- **AC-54-1**: Given an agent reads the updated `AGENTS.md` guidance, when
  it commits a change that touches a product surface (`skills/**`,
  `.claude-plugin/**`, `.codex-plugin/**`, `.cursor/**`, `.windsurfrules`,
  `.github/copilot-instructions.md`, or the templates that generate them),
  then it selects a release-triggering type (`feat:` or `fix:`) rather
  than `docs:` or `chore:`.

  **GREEN-phase verification step (the implementer must perform this
  before claiming AC-54-1):** dispatch at least one cold-context
  subagent against a synthetic skill-edit diff (e.g. a one-line wording
  change to `skills/bootstrap/SKILL.md`) and ask it to choose a commit
  type using only the updated guidance. Record the chosen type and the
  agent's reasoning verbatim in the PR body. If the cold-context
  subagent picks `feat:` or `fix:` without prompting, AC-54-1 is met.
  If it picks `docs:`/`chore:`, the guidance still has a leak; iterate
  before merge.

- **AC-54-2**: Given the guidance is shipped through
  `skills/bootstrap/templates/**`, when the local `bootstrap` skill is run
  against this repo in realignment mode, then this repo's own root config
  mirrors the templates and both sides are committed together (template
  change and root mirror in the same PR / coordinated commits).

- **AC-54-3** (refined from issue text): Given an agent reads the per-tool
  agent-instruction surfaces shipped by Bootstrap
  (`.cursor/rules/{{repo}}.mdc`, `.windsurfrules`,
  `.github/copilot-instructions.md`, plus any `agent-plugin` README/AGENTS
  template that summarizes commit rules), when commit-type guidance
  appears on a surface, then that surface contains all four of the
  following elements: (a) the verbatim product-surface glob list (matching
  AC-54-6), (b) the one-sentence path-first rule ("any diff touching one
  of these globs uses `feat:` or `fix:`"), (c) at least one concrete
  WRONG → RIGHT example, and (d) a link to the canonical
  "Commit type selection" section in `AGENTS.md` for the full
  rationalization table.

- **AC-54-4** (new): Given an agent considers a rationalization (e.g.
  "Markdown only", "wording alignment", "just a template", "non-goals
  addition", "example update", "fixing a typo in a skill body"), when the
  agent reads the updated guidance, then a rationalization-table row
  explicitly addresses that excuse and resolves it to a release-triggering
  type when the surface is a product surface.

- **AC-54-5** (new): Given an agent reads the updated guidance, when the
  guidance presents the rule, then it includes at least one concrete
  WRONG → RIGHT pair drawn from real product surfaces in this repo
  (e.g. an edit to `skills/bootstrap/SKILL.md`, a template under
  `skills/bootstrap/templates/**`, or a plugin manifest under
  `.claude-plugin/` / `.codex-plugin/`).

- **AC-54-6** (new): Given the canonical "Commit type selection" section
  in `AGENTS.md` (and its `CONTRIBUTING.md.tmpl` mirror), when the section
  is read, then **the product-surface path-glob list and the
  one-sentence path-first rule appear FIRST in the section, before the
  type table**, and the glob list contains: `skills/**`,
  `skills/bootstrap/templates/**`, `.claude-plugin/**`,
  `.codex-plugin/**`, `.cursor/**`, `.windsurfrules`,
  `.github/copilot-instructions.md`, `.github/workflows/**`,
  `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md`,
  `.github/LABELS.md`, `AGENTS.md`, `AGENTS.md.tmpl`, `CONTRIBUTING.md`,
  `CONTRIBUTING.md.tmpl`, `RELEASING.md`, `RELEASING.md.tmpl` — so the
  agent can match its diff against a concrete list rather than a verbal
  category.

- **AC-54-7** (new): Given the `bootstrap` skill is the source of truth
  for these surfaces, when this design's implementation lands, then the
  template edit lands first under `skills/bootstrap/templates/**`, root
  files (`AGENTS.md`, `CONTRIBUTING.md`, `.github/copilot-instructions.md`,
  `.cursor/rules/*.mdc`, `.windsurfrules`, plus any agent-plugin template
  README) are realigned via the bootstrap skill in realignment mode, the
  realignment commit is tied to the same issue (`#54`) so both sides are
  visible in one PR, **and** round-trip parity is verified by running the
  following one-liner and pasting its output (which must be empty) in the
  PR body's `Validation` section:

  ```bash
  # Parity check: the canonical glob list must appear verbatim on every
  # surface. Run from repo root. Empty output = pass.
  for f in \
    AGENTS.md \
    skills/bootstrap/templates/core/AGENTS.md.tmpl \
    CONTRIBUTING.md \
    skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl \
    .github/copilot-instructions.md \
    skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md \
    .cursor/rules/*.mdc \
    skills/bootstrap/templates/agent-plugin/.cursor/rules/*.mdc \
    .windsurfrules \
    skills/bootstrap/templates/agent-plugin/.windsurfrules ; do
    grep -q 'skills/\*\*' "$f" && \
    grep -q '\.claude-plugin/\*\*' "$f" && \
    grep -q '\.codex-plugin/\*\*' "$f" && \
    grep -q '\.windsurfrules' "$f" && \
    grep -q 'copilot-instructions\.md' "$f" \
      || echo "MISSING glob list in: $f"
  done
  ```

  This check verifies the glob list is present on all six per-tool
  surfaces plus their templates. It does not enforce wording of the
  full canonical sentence (that remains a reviewer judgement), but it
  closes the leak where a surface silently omits the path list.

- **AC-54-8** (meta-example, new): Given the implementation PR for issue
  #54 itself changes shipped agent-facing instructions in
  `skills/bootstrap/templates/**` and root `AGENTS.md`, when commits are
  authored, then the implementation commits use `feat:` (the very rule
  being sharpened), while a pure design-doc commit such as this one uses
  `docs:`. The PR body must call this out as a worked example.

  **Carve-out justification for `docs/superpowers/specs/**`:** these
  files are brainstormer-output artifacts. They are read once by a
  Planner subagent in the same workflow that produced them, never
  shipped to downstream consumers, never installed by the bootstrap
  skill, and never referenced by any plugin manifest under
  `.claude-plugin/` or `.codex-plugin/`. They are not part of any
  agent-instruction surface that a bootstrapped repo inherits. The
  path-first rule treats them as non-product, and `docs:` is the
  correct type for spec edits. (By contrast, `AGENTS.md` IS shipped
  through the bootstrap templates and IS a product surface; that
  asymmetry is the whole point.)

## Failure-mode analysis

The design must address WHY agents misclassify. Three concrete failure
modes, with the planted counter:

| # | Failure mode | Why current guidance fails | Counter required |
|---|--------------|----------------------------|------------------|
| 1 | "It's just Markdown" | The table says behavior expressed in Markdown counts, but the agent reads its own diff and sees text changes. | Anchor the rule to **path globs**, not "behavior". If the diff touches one of the listed globs, the type is `feat:` / `fix:` unless a named exception applies. Path is verifiable; "behavior" is judgment. |
| 2 | "Explanatory-only" escape hatch | The qualifier "unless explanatory-only and does not alter installed behavior" is self-selected. | **Delete the qualifier entirely. There is no escape hatch.** Replace with a hard, path-only rule: `docs:` and `chore:` apply if and only if the diff touches **zero** product-surface globs. If any file in the diff is under a product-surface glob, the type is `feat:` or `fix:` — full stop, no PR-body call-out, no reviewer sign-off, no "but this one is explanatory" override. Reviewers do not have authority to grant the exception because no exception exists. |
| 3 | Surface fragmentation | `.cursor`, `.windsurfrules`, `copilot-instructions.md` give a one-line summary that omits the rationalizations and the path-glob list. | Each per-tool surface must include the product-surface glob list and a single WRONG → RIGHT example, or must inline-link to the canonical `AGENTS.md` section with the explicit instruction "read this before classifying any commit that touches a tracked path". |

## Considered approaches

### Recommended: Rewrite the canonical section path-first, propagate per-surface, plant rationalization rows

Restructure the `AGENTS.md` "Commit type selection" section so it leads
with a **product-surface path-glob list** (the source of truth for
"product surface" in this repo) and the rule "any diff touching one of
these globs uses `feat:` or `fix:` by default". Keep the existing
WHAT-each-type-means table, but add:

- a rationalization table listing the named excuses ("just Markdown",
  "wording alignment", "template-only", "non-goals", "example update",
  "skill-body typo", "config tweak", "lockstep version bump",
  "alignment with source of truth") and the resolution for each;
- a Red Flags list ("you are about to commit `docs:` but the diff touches
  `skills/**` — STOP");
- two concrete WRONG → RIGHT pairs lifted from the historical commits
  identified in Context (e.g. `docs: #46 standardize Patina Project name`
  → `feat: #46 standardize Patina Project name across product surfaces`).

Mirror the canonical section into `CONTRIBUTING.md.tmpl` (already does so
today; keep parity). Update the per-tool surfaces
(`.cursor/rules/{{repo}}.mdc`, `.windsurfrules`,
`.github/copilot-instructions.md`) so each one carries:

- the product-surface glob list (verbatim, short);
- the one-sentence rule;
- a single WRONG → RIGHT example;
- a link to the canonical section in `AGENTS.md` for the full
  rationalization table.

Land the change in `skills/bootstrap/templates/**` first, then run the
local `bootstrap` skill in realignment mode to mirror the same content
into this repo's root files. Commit both sides under issue #54.

**Trade-offs:** longest content surface (canonical section grows ~25
lines; per-tool surfaces grow ~10 lines each). Acceptable: the rule
needs to be unmissable, not minimal.

**Why preferred:** matches `superpowers:writing-skills` discipline
(rationalization table + red flags + WRONG → RIGHT). Closes the three
named failure modes directly. No CI / commitlint changes — pure
guidance.

### Alternative A: Tighten only the canonical AGENTS.md section, leave per-tool surfaces alone

Pro: smallest diff. Con: agents that load only `.cursor` or
`copilot-instructions.md` still see the one-line summary and miss the
rationalization table. AC-54-3 fails.

### Alternative B: Add a CI check that flags `docs:`/`chore:` commits touching product-surface paths

Pro: hard enforcement. Con: explicitly out of scope per the issue's
non-goals. Reject.

## Cross-cutting design constraints (writing-skills dimensions)

The implementation must satisfy each of these dimensions; the Planner
should enumerate them as task-level acceptance criteria.

### Loophole closure

The current "explanatory-only" qualifier is the primary loophole. The
design closes it by:

- **Deleting the qualifier outright.** There is no "default", no
  "unless", and no PR-body / reviewer override. The rule is a hard
  path-only test: if the diff touches any product-surface glob, the
  commit type is `feat:` or `fix:`. Otherwise `docs:` / `chore:` are
  available.
- Removing all self-selectable language ("clearly", "does not alter
  installed skill behavior", "explanatory-only"). The path-glob test is
  the only test.
- Removing reviewer-discretion language. Reviewers do not have
  authority to grant an exception because no exception exists.

### Rationalization table (planted in canonical section)

| Rationalization | Reality |
|-----------------|---------|
| "It's just Markdown." | Markdown on `skills/**`, plugin manifests, or agent-instruction surfaces is the shipped product. Type by path, not by file extension. |
| "I'm only aligning wording with the source of truth." | If the source of truth is itself a product surface (skill, template, agent instruction), wording IS behavior. Use `feat:`. |
| "It's just a template change." | Templates under `skills/bootstrap/templates/**` ship to every bootstrapped repo on the next realignment. They are product. Use `feat:` / `fix:`. |
| "I'm only adding a non-goal or an example to a skill." | Examples and non-goals on a `SKILL.md` change how the skill is interpreted by agents. Product. `feat:`. |
| "I'm fixing a typo in a skill body." | Path-only rule: any edit inside `skills/**`, `.claude-plugin/**`, `.codex-plugin/**`, `.cursor/**`, `.windsurfrules`, or `.github/copilot-instructions.md` is `fix:` when correcting wrong shipped content and `feat:` when adding or changing shipped content. Do not assess "whether it affects how the skill is read" — the path test already settled it. `chore:` is only available when the diff touches zero product-surface globs. |
| "It's a plugin manifest version bump." | Release-please owns version bumps under `chore: release X.Y.Z`. Hand-editing a manifest version outside that flow is a `fix:` (lockstep correction) or a release-PR commit, never `docs:`. |
| "I'm rewording an agent instruction." | Agent instructions ARE the contract. `feat:`. |
| "It's a markdown-lint cleanup with no semantic change." | Allowed as `chore:` only if zero product-surface globs are touched. If any product-surface glob is touched, `feat:` (or `fix:` if the lint fix corrected wrong shipped content). |
| "The change is too small to bump a version." | Version magnitude is release-please's job. Type by intent. Small `feat:` is fine. |

### Red Flags

The canonical section must end with a STOP block:

> **STOP and reconsider if any of these are true:**
>
> - You are about to commit `docs:` or `chore:` but `git diff --name-only`
>   shows a file under `skills/**`, `.claude-plugin/**`,
>   `.codex-plugin/**`, `.cursor/**`, `.windsurfrules`,
>   `.github/copilot-instructions.md`, `.github/workflows/**`,
>   `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md`,
>   `.github/LABELS.md`, `AGENTS.md`, `AGENTS.md.tmpl`,
>   `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`, or
>   `RELEASING.md.tmpl`.
> - Your commit message says "align", "standardize", "clarify", "rename",
>   "rewrite", or "rework" AND the diff touches a product-surface glob.
> - You are using `docs:` or `chore:` for any change to `AGENTS.md`,
>   `AGENTS.md.tmpl`, `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`,
>   `RELEASING.md`, or `RELEASING.md.tmpl`. These files are agent-facing
>   and contributor-facing contracts — every edit is `feat:` (new or
>   changed rule) or `fix:` (corrected wrong rule).

### Token-efficiency targets

- Canonical `AGENTS.md` section: ~80 lines (table + rationalization
  table + red flags + WRONG → RIGHT pairs). Acceptable; this is the
  unmissable surface.
- Per-tool surfaces (`.cursor`, `.windsurfrules`, `copilot-instructions.md`):
  ≤ 20 lines added each. They cite the canonical section by link.
- `agent-plugin/README.md.tmpl`: only changed if it currently teaches
  commit types; if not, leave alone and let the canonical
  `AGENTS.md.tmpl` do the work.

### Role ownership

| Surface | Owns |
|---------|------|
| `skills/bootstrap/templates/core/AGENTS.md.tmpl` | Canonical decision table, rationalization table, red flags, WRONG → RIGHT pairs, product-surface glob list. |
| `skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl` | Mirror of the canonical decision table + product-surface glob list (CONTRIBUTING is contributor-facing, AGENTS is agent-facing; both ship). |
| `skills/bootstrap/templates/core/RELEASING.md` (and `RELEASING.md.tmpl`) | Cross-link to AGENTS / CONTRIBUTING; explain that mistyped commits silently suppress releases. |
| `.github/LABELS.md` (and its template under `skills/bootstrap/templates/**`) | Listed in the product-surface glob set. Edits use `feat:`/`fix:` per the path-only rule. No special ownership beyond inclusion. |
| `skills/bootstrap/templates/agent-plugin/.cursor/rules/{{repo}}.mdc` | Short rule + glob list + one WRONG → RIGHT + link to canonical. |
| `skills/bootstrap/templates/agent-plugin/.windsurfrules` | Same as cursor. |
| `skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md` | Same as cursor. |
| Repo root mirrors of all of the above | Generated by bootstrap-skill realignment; never hand-edited first. |

### Stage-gate bypass paths

Possible bypasses an agent could rationalize past, and the planted
counter:

| Bypass | Counter |
|--------|---------|
| Agent commits with `docs:` and squashes into a PR titled `feat:`. | PR-title-lint already exists. Squash inherits PR title. Acceptable. |
| Agent commits multiple changes, types the commit by the "biggest" change. | Commit-by-impact rule already in place. Add explicit guidance: if any file in the diff is on a product-surface glob, the commit type is at least `feat:`. |
| Agent uses `docs:` and adds an explanatory-only call-out in PR body even though the change is behavioral. | Not available. The escape hatch is deleted; there is no "explanatory-only call-out" option. PR template MUST NOT include any reviewer-grant checkbox for this — see LOW-3 disposition. |
| Agent edits root `AGENTS.md` directly without round-tripping through the template. | Round-trip parity is verified by the AC-54-7 grep one-liner, whose output must be pasted in the PR body's `Validation` section. An empty grep output is the verification artifact; the Planner does not need to invent a separate check. |

## Round-trip discipline

For AC-54-2 and AC-54-7:

1. Edit templates under `skills/bootstrap/templates/**` first.
2. Run the local `bootstrap` skill in realignment mode against this repo.
3. Accept the proposed root diff.
4. Commit template change and root mirror in coordinated commits, both
   referencing `#54`.
5. PR body explicitly references the templates-first / realignment loop
   so reviewers see both halves.
6. Run the AC-54-7 parity grep one-liner from the repo root and paste
   its output (which must be empty) into the PR body's `Validation`
   section. Non-empty output is a hard blocker — the listed surface(s)
   missed the glob list and must be updated before merge.

The implementation commits are themselves a worked example of the rule
they ship: the template edit and the root mirror both touch product
surfaces, so both must be `feat:` (not `docs:`). Call this out in the
PR body. The pure design-doc commit (this file, in
`docs/superpowers/specs/**`) is not a product surface and uses `docs:`;
that contrast is the meta-example for AC-54-8.

## Non-goals

- No new commitlint rules.
- No PR-title-lint changes.
- No CI check that scans diff paths against commit type.
- No retroactive re-typing of historical commits.
- No `skill-improver` run against `skills/bootstrap/` (tracked
  separately).

## Adversarial review findings

```yaml
adversarial_review_findings:
  - source: brainstormer
    severity: medium
    location: requirements/AC-54-1
    finding: |
      Issue text says "selects a release-triggering type rather than
      docs: or chore:". This is outcome-not-artifact phrasing but
      doesn't constrain WHEN the agent reads the guidance. Could be
      satisfied by any update.
    disposition: |
      Accepted as-is. The path-glob list (AC-54-6) and rationalization
      table (AC-54-4) constrain the *content* of the guidance enough
      that AC-54-1 is verifiable by inspection: read the updated
      AGENTS.md and check whether an agent can pick the right type for
      a skill / template / plugin manifest change without further
      prompting.
  - source: brainstormer
    severity: high
    location: rationalization-table
    finding: |
      The "version bump" row is ambiguous: in this repo, plugin manifest
      versions are sync'd by scripts/sync-plugin-versions.mjs and only
      change inside release-please PRs. An agent could read the row and
      conclude that any plugin.json edit is fix:.
    disposition: |
      Tightened the row to distinguish (a) release-please-driven version
      changes (which arrive under "chore: release X.Y.Z" and are owned
      by automation), (b) lockstep corrections done by a human/agent
      outside that flow (which are fix:), and (c) other manifest edits
      such as description / homepage / keywords (which are feat:
      because they change marketplace-visible product). Planner should
      reflect this three-way split in the implementation table.
  - source: brainstormer
    severity: medium
    location: per-surface-parity
    finding: |
      The .cursor / .windsurfrules / copilot-instructions surfaces are
      currently one-liners pointing to AGENTS.md. Adding a glob list
      and a WRONG -> RIGHT example to each grows them ~10 lines. Risk
      that those surfaces drift out of sync with the canonical section
      over time.
    disposition: |
      Accepted. Mitigation: the per-tool surfaces are templates under
      skills/bootstrap/templates/agent-plugin/**. They share a single
      author (this repo) and update via the same realignment loop.
      Drift cost is low. The Planner should add a verification step
      that checks the glob list is identical across all four surfaces
      after edit (a simple grep diff).
  - source: brainstormer
    severity: medium
    location: explanatory-only-escape-hatch
    finding: |
      Inverting the default (docs: requires explicit call-out inside
      product-surface globs) puts the burden on the PR reviewer.
      Without a CI check (out of scope), this is enforceable only by
      review discipline. Could regress.
    disposition: |
      Accepted as a known limitation. The issue explicitly forbids CI
      enforcement. The mitigation is the rationalization table + red
      flags list, which targets the agent author rather than relying
      on the reviewer. The PR-template "Validation" / "Acceptance
      criteria" sections already exist; the Planner should consider a
      one-line addition to the PR template asking the author to
      confirm "no product-surface globs touched, OR commit type is
      feat:/fix:".
  - source: brainstormer
    severity: low
    location: token-efficiency
    finding: |
      ~80 lines for the canonical AGENTS.md section is large for a
      single section. Risk that agents skim past the rationalization
      table.
    disposition: |
      Accepted. The writing-skills dimension explicitly trades token
      efficiency for unmissability on discipline rules. The
      per-tool surfaces stay short and link to the canonical section.
      Net per-surface load is bounded.
  - source: brainstormer
    severity: medium
    location: red-flags-coverage
    finding: |
      The Red Flags STOP block lists docs: + skills/** as the canonical
      bad pattern. It does not flag chore: + skills/** with the same
      visibility, but the historical commit log shows docs: was the
      far more common offender. chore: should still be in the list.
    disposition: |
      Already covered: the STOP block lists "docs: or chore:" in the
      first bullet. Confirmed.
  - source: brainstormer
    severity: high
    location: meta-example-AC-54-8
    finding: |
      The implementation PR for #54 will itself edit AGENTS.md and
      templates. If the Planner uses the wrong commit type on those
      edits, it undermines the whole design. The design must be
      explicit about what type each implementation commit takes.
    disposition: |
      Made AC-54-8 explicit and added a worked example to the
      Round-trip discipline section: design-doc commit (this file) =
      docs:; template edits + root realignment = feat:. The Planner
      MUST encode this in task-level commit messages and the PR body.
  - source: brainstormer
    severity: low
    location: RED-phase-baseline
    finding: |
      writing-skills requires a RED-phase baseline (watch agents fail
      without the rule) before authoring discipline guidance. We have
      a strong observational baseline (5 historical docs: commits on
      product surfaces in 30 commits ~= 17% misclassification rate)
      but no controlled subagent test.
    disposition: |
      Accepted as observational baseline in lieu of a synthetic
      pressure test. The 5 named historical commits in Context are
      the RED evidence: they show the failure mode, the
      rationalizations used in commit subjects ("standardize",
      "align", "incorporate"), and the surfaces touched. The
      implementation phase MAY add a subagent pressure test as part
      of skill-improver work but it is not a blocker for landing this
      design's guidance update. The Planner should record the
      baseline as part of the verification narrative for AC-54-1.
```

```yaml
adversarial_review_findings_round_2:
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: high
    location: failure-mode-counter-row-2 + rationalization-typo-row
    finding: |
      Design claimed to remove the "explanatory-only" escape hatch but
      reintroduced it twice: (a) failure-mode row 2 said docs: inside
      product-surface globs requires "explanatory-only call-out + reviewer
      sign-off", which IS the escape hatch relabeled; (b) the typo
      rationalization-table row preserved agent judgement ("if the typo
      affects how the skill is read") on the very file class the
      design's path-first thesis covers.
    disposition: |
      Closed both. Failure-mode row 2 now states explicitly: docs:/chore:
      apply iff the diff touches zero product-surface globs; no PR-body
      call-out, no reviewer override, no exception exists. Loophole-closure
      section rewritten to match. Rationalization typo row tightened to a
      pure path-only rule: any edit inside skills/**, .claude-plugin/**,
      .codex-plugin/**, .cursor/**, .windsurfrules, or
      .github/copilot-instructions.md is fix: when correcting wrong shipped
      content and feat: when adding/changing it; the "affects how skill is
      read" qualifier is removed. Stage-gate-bypass row 3 ("agent uses docs:
      with explanatory call-out") updated to "Not available."
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: high
    location: AC-54-7
    finding: |
      AC-54-7 named a verification mechanism (round-trip parity) but did
      not design one. An implementer could satisfy AC-54-7 by writing the
      words "templates-first loop" in the PR body while still missing the
      glob list on one of the four per-tool surfaces.
    disposition: |
      Closed. AC-54-7 now embeds a concrete grep-based parity one-liner
      that checks every per-tool surface and template for the verbatim
      glob list. Empty output is the verification artifact; the
      implementer must paste it in the PR body's Validation section. The
      Round-trip discipline section adds step 6 making this mandatory and
      a hard blocker.
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: medium
    location: AC-54-3
    finding: |
      AC-54-3 only required per-tool surfaces to "name the rule and point
      to canonical." An implementer could satisfy it by leaving the
      existing one-liner and adding a link, which the failure-mode
      analysis says is insufficient.
    disposition: |
      Closed. AC-54-3 now enumerates four required elements per surface:
      (a) verbatim product-surface glob list, (b) one-sentence path-first
      rule, (c) at least one WRONG -> RIGHT example, (d) link to canonical
      AGENTS.md section. This matches the Role-ownership table.
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: medium
    location: AC-54-6
    finding: |
      AC-54-6 omitted .github/LABELS.md (touched by RED-baseline commits
      0b6ebf0 and d6fe7d5) and AGENTS.md / CONTRIBUTING.md / RELEASING.md
      and their .tmpl counterparts. Red-flags bullet 3 partially patched
      this but reintroduced "adds or changes a rule" judgement,
      inconsistent with the path-first thesis.
    disposition: |
      Closed. AC-54-6 glob list extended to include .github/LABELS.md,
      AGENTS.md, AGENTS.md.tmpl, CONTRIBUTING.md, CONTRIBUTING.md.tmpl,
      RELEASING.md, RELEASING.md.tmpl. Red-flags bullet 3 rewritten to
      drop the "adds or changes a rule" qualifier — every edit to those
      files is feat: or fix: by path. Role-ownership table extended to
      include LABELS.md.
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: medium
    location: AC-54-8
    finding: |
      The design types its own commit docs: under
      docs/superpowers/specs/**, but per the path-first thesis design docs
      themselves are agent-instruction product. The carve-out was implied
      but not justified.
    disposition: |
      Justified explicitly under AC-54-8. Spec files are
      brainstormer-output artifacts, read once by a Planner subagent in
      the same workflow, never shipped to consumers, never installed by
      bootstrap, never referenced by any plugin manifest. They are not on
      any agent-instruction surface a bootstrapped repo inherits. The
      path-first rule treats them as non-product; docs: is correct.
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: low
    location: canonical-section-ordering
    finding: |
      No explicit ordering requirement for where the glob list and
      path-first rule appear in the canonical section.
    disposition: |
      Closed. AC-54-6 now requires the glob list and one-sentence
      path-first rule to appear FIRST in the "Commit type selection"
      section, before the type table.
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: low
    location: GREEN-followup
    finding: |
      No GREEN follow-up for the cold-context subagent pressure test.
    disposition: |
      Closed. AC-54-1 now includes a GREEN-phase verification step: the
      implementer dispatches at least one cold-context subagent against a
      synthetic skill-edit diff and records the chosen commit type and
      reasoning in the PR body.
  - source: adversarial-review
    reviewer_context: fresh subagent
    severity: low
    location: PR-template-language
    finding: |
      The earlier disposition softly suggested "Planner should consider"
      a PR-template addition. Ambiguous given the no-escape-hatch posture.
    disposition: |
      Closed by removing the suggestion implicitly: with the escape hatch
      deleted, no PR-template checkbox is needed or wanted. Stage-gate-
      bypass row 3 explicitly forbids any reviewer-grant checkbox. The
      PR template's existing Validation section already accommodates
      pasting the AC-54-7 grep output; no new template field is added.
```

**Adversarial review status:** `findings dispositioned`.
**Reviewer context:** fresh subagent.
**Dimensions re-checked:** loophole closure, rationalization-table
internal consistency, glob-list completeness vs. RED-baseline commits,
canonical-section ordering, AC-54-7 verification mechanism, AC-54-8
carve-out justification, PR-template alignment with the no-escape-hatch
posture. All seven original brainstormer findings remain dispositioned;
all eight new fresh-context findings are closed (six material + two
LOW). Two HIGH findings (escape-hatch leakage, AC-54-7 mechanism) are
fully closed in the requirements / failure-mode / round-trip sections.
