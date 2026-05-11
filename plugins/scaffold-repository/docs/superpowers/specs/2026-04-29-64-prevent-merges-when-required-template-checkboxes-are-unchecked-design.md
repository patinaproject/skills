# Design: Prevent merges when required template checkboxes are unchecked [#64](https://github.com/patinaproject/bootstrap/issues/64)

## Context

GitHub renders Markdown checkboxes in pull request bodies, but an unchecked
box is not a merge blocker by itself. This repository's pull request template
uses checklist rows for acceptance-criteria evidence, optional E2E gap
acknowledgement, manual testing, and docs confirmation. Those rows look like
readiness gates, but today a PR can merge while required rows remain unchecked
unless a reviewer notices manually.

The repository already has `.github/workflows/lint-pr.yml` for PR title,
closing-keyword, and breaking-change validation. That is the right workflow
surface for another PR-body gate because it already runs on `opened`,
`edited`, `synchronize`, and `reopened`, has `pull-requests: read`, and is
already expected to be required by branch protection. The new gate should live
there, or in a clearly named sibling workflow only if implementation discovers
that separate status-check naming is cleaner.

The rule cannot be a blind search for every `- [ ]` row. The current template
has mutually exclusive `Docs updated` choices where one unchecked row is
expected when the other row is checked. The template also contains an E2E gap
row that is included only when real automated coverage is missing and, when
included, must be checked before merge. The design therefore needs a small,
template-aware checklist contract: required rows are explicit, optional or
alternative rows are explicit, and the check fails only for unchecked required
items or unsatisfied required choice groups.

Because `.github/pull_request_template.md`, `.github/workflows/**`, and
`AGENTS.md` are source-of-truth baseline files in this repo, implementation
must edit the templates under `skills/bootstrap/templates/**` first and then
realign the mirrored root files through the local bootstrap skill. This issue
is a shipped workflow-contract change, so the implementation commit type will
be `feat:` or `fix:` by path-first rule even though this design artifact uses
`docs:`.

## Requirement Set

- **AC-64-1**: Given a pull request uses the repository pull request
  template, when a required checklist item remains unchecked, then a required
  CI check fails and clearly identifies the unchecked item.
- **AC-64-2**: Given a pull request contains only checked required checklist
  items or explicitly optional unchecked items, when the merge gate runs, then
  the check passes.
- **AC-64-3**: Given maintainers review the repository guidance, when they
  configure branch protection or a ruleset, then the documentation identifies
  the status check that must be required to block merges.
- **AC-64-4**: Given the repository ships baseline templates through the
  bootstrap skill, when this merge gate is added, then the template source and
  mirrored root files remain in sync according to the repo's round-trip
  discipline.

## Recommended Approach

Extend the PR lint surface with a template-aware checklist gate named
`Required template checkboxes` (or a similarly exact job/check name chosen by
the implementer and documented verbatim). The gate reads the pull request body
from the `pull_request` event payload and validates only the repository-owned
template contract.

The PR template should mark checklist semantics in plain Markdown plus HTML
comments that survive in the template but do not clutter the rendered PR. The
implementation can choose the exact marker names, but the contract should
support these cases:

- Required individual rows: evidence rows, manual test rows, and any included
  E2E gap acknowledgement row must be checked before merge.
- Optional unchecked rows: rows explicitly marked optional, examples in HTML
  comments, and placeholder guidance must not fail the check.
- Required choice groups: the `Docs updated` section should pass when exactly
  one of the mutually exclusive choices is checked and fail when none or more
  than one are checked.
- Clear failures: each failure should emit a GitHub Actions error that includes
  the section or AC heading, the checklist text, and the line number when
  available.

Keep the validator small and local. A shell, JavaScript, or Python script is
acceptable, but it should be checked into the repository if it grows beyond a
few lines. If Python is used, call `python3` for simple scripts or `uv run
python` only if the project adopts uv. Do not add a third-party action solely
for checklist parsing; avoiding another action also avoids a new SHA-pinning
maintenance burden.

## Considered Approaches

### Recommended: Template-aware parser in PR lint

This gives the most precise behavior with the smallest operational surface.
It catches unchecked required rows, allows intentional optional or alternative
unchecked rows, and produces targeted failure messages. It also keeps the
status check near the existing PR-body rules that maintainers already expect
to require.

### Simpler but rejected: Fail on any unchecked checkbox

This is easy to implement, but it conflicts with the current `Docs updated`
choice pattern and any future optional checklist item. It would train
maintainers to remove useful checklist rows or check inaccurate boxes just to
get CI green.

### Broader but rejected: GitHub App or policy bot

A bot could inspect more surfaces and manage review comments, but this issue
only needs a merge gate for repository templates. A local CI check is easier
to audit, works in forks, and fits the existing branch-protection model.

## Affected Surfaces

- `skills/bootstrap/templates/core/.github/pull_request_template.md`: source
  template for required, optional, and choice-group checklist markers.
- `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml`: source
  workflow for the required status check, unless implementation chooses a
  sibling workflow with a better check name.
- `skills/bootstrap/templates/core/AGENTS.md.tmpl`: source guidance naming the
  exact status check maintainers must require in branch protection or rulesets.
- Mirrored root files after bootstrap realignment:
  `.github/pull_request_template.md`, `.github/workflows/lint-pr.yml` or the
  chosen sibling workflow, and `AGENTS.md`.
- Optional supporting script path if needed, for example
  `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs`
  mirrored to `scripts/check-pr-template-checkboxes.mjs`.

## Testing And Verification Strategy

The implementation should use acceptance-test style fixtures before wiring the
workflow. At minimum, add representative PR-body fixture cases or inline tests
for:

- An unchecked required evidence row under an AC heading fails and names the
  row.
- An unchecked required manual test row fails and names the row.
- An included unchecked E2E gap row fails and names the row.
- Checked required rows pass.
- An explicitly optional unchecked row passes.
- `Docs updated` passes with exactly one checked choice and fails with zero or
  two checked choices.

Workflow-level verification should include:

- Running the validator locally against the failing and passing fixtures.
- Running `pnpm lint:md` after template and root Markdown updates.
- Running `pnpm exec actionlint .github/workflows/*.yml` or the repo's
  documented actionlint path after workflow changes.
- Verifying bootstrap round-trip parity by editing templates first, running the
  local bootstrap skill in realignment mode, and confirming the mirrored root
  files match the template intent.
- Recording the exact status check name in the PR body and in guidance for
  maintainers configuring branch protection or repository rulesets.

## Documentation Requirements

Repository guidance must identify the exact required check name. The guidance
should be concrete enough that a maintainer can open branch protection or a
ruleset and select the status check without reading the workflow file.

Recommended wording target:

> Require the `Required template checkboxes` status check before merge. This
> check fails when required PR-template checklist rows remain unchecked and
> passes when required rows are checked or unchecked rows are explicitly
> optional.

The exact final check name must match the workflow job name, because GitHub's
branch protection UI uses status-check names rather than the design intent.

## Non-Goals

- Do not make every checkbox in every Markdown file merge-blocking.
- Do not require all future optional checklist rows to be removed.
- Do not introduce a GitHub App, repository label state, hidden sidecar state,
  or manual reviewer convention as the enforcement mechanism.
- Do not change acceptance-criteria ID conventions beyond what is needed to
  validate the existing PR-template checklist rows.
- Do not configure branch protection through code in this repository; document
  the required status check so maintainers can configure it in GitHub.

## Writing-Skills Pressure-Test Considerations

### RED Baseline Obligation

Before implementing the gate, the executor should demonstrate a failing
baseline using a PR-body fixture with an unchecked required template row. The
baseline should show that the current repo has no required check that fails
for that body. The first new validator test should fail for the right reason
before production validation logic is added.

### GREEN Obligation

The minimum passing behavior is not "grep finds unchecked boxes." The green
behavior is that required unchecked rows fail, optional or alternative
unchecked rows pass, and failure output names the actionable item. The
validator must pass all fixture cases before the workflow is treated as ready.

### Rationalization Resistance

| Rationalization | Counter |
|---|---|
| "A grep for `- [ ]` is enough." | It breaks legitimate unchecked alternative rows such as `Docs updated`; use the template-aware contract. |
| "The template comments already say reviewer MUST check it." | Prose is advisory; the issue asks for a required CI check that fails before merge. |
| "Branch protection can be configured later without docs." | AC-64-3 requires guidance naming the exact status check to require. |
| "Editing root files is enough." | AC-64-4 and repo guidance require template-first edits and bootstrap realignment. |
| "A passing CI run means production readiness." | Workflow-contract readiness also needs documented fixture coverage and round-trip evidence. |

### Red Flags

- A validator that fails every unchecked checkbox without optional/choice-group
  semantics.
- Failure messages that only say "unchecked checkbox found" without the row or
  section.
- A status check name in docs that does not exactly match the workflow job.
- Root `.github/` or `AGENTS.md` edits without corresponding template edits.
- A workflow change using an unpinned action reference, or adding an action
  when local scripting would suffice.

### Token-Efficiency Target

Keep generated guidance short. The PR template may use compact HTML comments
for machine-readable markers, and `AGENTS.md` should name the required status
check in one short subsection rather than duplicating the validator algorithm.
Implementation details belong in tests or a small script.

### Role Ownership

- Brainstormer owns this design and the acceptance intent.
- Planner must convert the design into ordered, test-first implementation
  tasks.
- Executor owns fixture-first validator behavior, workflow wiring, and
  bootstrap realignment.
- Reviewer owns checking that workflow-contract changes have pressure-test
  evidence and do not leave a bypass.
- Finisher owns PR publication and confirming the status-check name is visible
  in the PR body for branch-protection configuration.

### Stage-Gate Bypass Paths

The main bypass risk is treating unchecked rows as a reviewer convention
instead of a required status check. The second bypass risk is making the check
non-required in practice by failing to document the exact status-check name.
The third bypass risk is merging root-only changes that disappear the next time
the bootstrap baseline is realigned. The design closes those by requiring CI
failure behavior, status-check documentation, and template/source round trip.

## Self-Review Findings

| Source | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| Brainstormer self-review | Material | Recommended approach | A naive unchecked-checkbox scan would fail legitimate mutually exclusive `Docs updated` rows. | Dispositioned by requiring explicit optional rows and required choice groups. |
| Brainstormer self-review | Material | Affected surfaces | Root `.github/` changes could drift from bootstrap templates. | Dispositioned by making template-first edits and bootstrap realignment part of AC-64-4 verification. |

## Clean-Pass Rationale

Checked dimensions:

- RED/GREEN baseline obligations are explicit and require fixture-first
  failure then passing validator behavior.
- Rationalization resistance names the likely shortcuts and their counters.
- Red flags cover the major bypasses: naive grep, unclear failures, mismatched
  status-check names, root-only edits, and action pinning.
- Token-efficiency target keeps guidance compact and leaves details in tests or
  a small script.
- Role ownership assigns design, planning, execution, review, and publish-state
  duties.
- Stage-gate bypass paths are identified and tied back to enforceable CI,
  documented required checks, and bootstrap round-trip discipline.

No approval-blocking self-review findings remain open.
