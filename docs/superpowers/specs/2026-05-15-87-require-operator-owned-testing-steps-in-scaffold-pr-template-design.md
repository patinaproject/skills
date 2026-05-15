# Design: Require operator-owned testing steps in scaffold PR template [#87](https://github.com/patinaproject/skills/issues/87)

## Intent

Clean up the scaffold-repository PR body contract so operator-owned QA work is
visible, ordered, and actionable without making reviewers reconcile three
overlapping evidence sections. The scaffolded PR template should keep
`## Testing steps` as the only section for human verification actions, replace
the current split `## Test coverage` plus per-AC prose pattern with a combined
coverage and risk section, support multiple linked issues, and avoid any
scaffolded CI gate that fails merely because operator-owned testing checkboxes
remain unchecked.

## Skill guidance

This design applies the repo-required `write-a-skill` structure review because
the implementation will touch scaffold-repository skill and template surfaces.
The design also applies `writing-skills` as a workflow-contract quality gate
because the PR template, generated `AGENTS.md` guidance, and helper docs teach
future agents how to report verification. The review dimensions are recorded
below: RED/GREEN baseline obligations, rationalization resistance, red flags,
token-efficiency targets, role ownership, and stage-gate bypass paths.

## Problem

The current scaffolded PR template has three places that can describe the same
validation story:

- `## Testing steps` for human tester actions;
- `## Test coverage` with a matrix plus one prose subsection per AC;
- acceptance-criteria detail in generated contributor guidance or downstream PR
  bodies that repeats the same pass state again.

That shape makes downstream PRs bulky. It also creates failure modes that matter
to both humans and agents: manual checks can be buried in prose, every UI click
can become a noisy checkbox, every passed unit test can get narrated, and
operator-owned testing checkboxes can be treated as automated merge gates even
though the operator still owns those decisions.

## Requirements

### AC-87-1

The scaffold-repository PR template contains a section named exactly
`## Testing steps`.

### AC-87-2

The `## Testing steps` instructions require all operator-owned verification
steps to be included in the order needed to verify the changes.

### AC-87-3

The template requires every operator-owned pass/fail verification decision to
use a checkbox.

### AC-87-4

The template instructs authors not to put a checkbox on every individual UI
action, and to reserve checkboxes for verification decisions or outcomes.

### AC-87-5

The template states that anything the operator needs to see or manually verify
belongs in `## Testing steps`.

### AC-87-6

The scaffolded PR body no longer has separate `## Test coverage` and
`## Acceptance criteria` sections that duplicate the same validation story.

### AC-87-7

The template provides one combined reader-friendly section for acceptance
criteria, validation evidence, and known gaps.

### AC-87-8

The combined coverage/acceptance-criteria section uses the table as the primary
AC summary and provides a bottom `Risks` subsection for warnings, missing
coverage, merge-blocking gaps, manual-only validation, deferred checks, or
caveats.

### AC-87-9

The `Risks` subsection is omitted when there are no notable risks, gaps,
warnings, or caveats to report.

### AC-87-10

The template does not require one prose subsection per AC when the coverage
table already communicates the pass state.

### AC-87-11

The template guides authors to report test coverage in a way that helps humans
and agents identify remaining risk, not simply inventory every passed test
command.

### AC-87-12

`## Testing steps` examples use direct checklist wording and do not repeat a
redundant prefix such as `Operator check:` on every item.

### AC-87-13

Each `## Testing steps` checkbox names an observable pass/fail outcome rather
than merely listing UI actions.

### AC-87-14

Scaffolded CI does not fail a PR merely because `## Testing steps` contains
unchecked operator-owned verification checkboxes.

### AC-87-15

The `## Linked issue` guidance supports multiple issue references, including
combinations such as `Closes #<issue>` and `Related to #<issue>`.

### AC-87-16

Any scaffold-repository PR-body helper docs or generated PR-body templates that
describe linked issues, testing steps, test coverage, acceptance-criteria
reporting, risks, or checkbox validation are consistent with this contract.

## Proposed change

Update the scaffolded PR body contract at
`skills/scaffold-repository/templates/core/.github/pull_request_template.md`.
Because the root `.github/pull_request_template.md` currently mirrors the
scaffolded baseline, update it in the implementation as well so this repository
continues to dogfood the emitted shape. Keep the section order:

1. `## Linked issue`
2. `## What changed`
3. optional `## Do before merging`
4. combined `## Coverage and risks`
5. `## Testing steps`

Do not add a separate `## Acceptance criteria` section. Do not leave the old
`## Test coverage` section name in scaffolded PR bodies unless the Planner
explicitly chooses to preserve the name and can still satisfy AC-87-6 through
AC-87-8. The recommended direction is a new `## Coverage and risks` section
because the issue asks for one combined reader-friendly section whose table is
the primary AC summary and whose bottom `Risks` subsection carries caveats.

Update `skills/scaffold-repository/templates/core/AGENTS.md.tmpl` so generated
agent guidance names the combined coverage section, removes the one-subsection
per-AC rule, and routes human QA work to `Testing steps`.

Update `skills/scaffold-repository/pr-body-template.md` so its helper note no
longer tells authors to put AC-54-7 parity grep output under an
`Acceptance criteria` entry. The replacement should route parity evidence to
the combined coverage table or the `Risks` subsection when non-empty output is
a blocker.

Audit adjacent scaffold-repository docs that mention PR body shape, especially
`skills/scaffold-repository/SKILL.md`, `audit-checklist.md`, and
`templates/core/CONTRIBUTING.md.tmpl`. Keep edits minimal and only update text
that would otherwise contradict the new contract.

## Proposed PR template shape

```markdown
# Pull Request

## Linked issue

- `Closes #<issue>` for each issue this PR completes.
- `Related to #<issue>` / `Blocks #<issue>` / `Partially satisfies #<issue>`
  for each additional issue, with a short explanation when the relationship is
  not obvious.
- `None` when no issue applies.

## What changed

Context: <prior PR, prior QA pass, follow-up issue, or `standalone - <reason>`>

- <change> - <why>

<!-- Optional, include only for PR-level operator work before merge. -->
## Do before merging

- [ ] <imperative pre-merge action not covered by QA or CI>

## Coverage and risks

Legend for status cells:

- PASS - required validation passed with no known relevant gap.
- WARN - sufficient to merge with a known non-blocking gap in Risks.
- BLOCKED - missing, failing, pending, or merge-blocking.
- N/A - not relevant to this AC.

| AC | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| AC-<issue>-<n> | <short title> | <command, job, manual source, or doc review> | PASS |

<!-- Omit this subsection when there are no notable risks or gaps. -->
### Risks

- <warning, missing coverage, merge blocker, manual-only validation, deferred
  check, or caveat>

## Testing steps

<!--
  List every operator-owned verification step here in the order the operator
  should perform or inspect it. Use checkboxes for pass/fail verification
  decisions or outcomes, not for every individual UI action. Anything the
  operator needs to see or manually verify belongs here.
-->

- [ ] Verify <observable outcome> after <minimal action context>.
```

The implementation can choose compact status labels or the existing symbols if
Markdown lint and downstream readability are better that way. The design
requirement is the section ownership: the table summarizes AC coverage, the
optional bottom `Risks` subsection carries caveats, and `Testing steps` carries
operator-owned pass/fail work.

## QA, merge chores, coverage, and risks

`## Testing steps` is for QA decisions the operator can perform or verify. It
should use direct imperative checklist wording and name observable outcomes:
`Verify the preview updates within one refresh after changing the template`, not
`Operator check: click through the page`.

`## Do before merging` is narrower. It is only for PR-level operator chores that
must happen after review and before merge, such as rotating a secret, toggling a
GitHub repository setting, or coordinating a release window. It must not repeat
testing steps, AC coverage gaps, or pending CI checks.

`## Coverage and risks` is for reviewer evidence. It should help humans and
agents answer: which ACs are covered, by what evidence, what is warning-level,
what is missing, and what blocks merge. It should not narrate every passed test
command or require one prose subsection per AC when the table is already clear.

`### Risks` belongs at the bottom of the combined coverage section and is
omitted when there are no notable risks, gaps, warnings, or caveats. Use it for
warnings, missing coverage, merge-blocking gaps, manual-only validation,
deferred checks, or caveats that change reviewer judgment.

## CI checkbox decision

The scaffolded baseline should not include CI enforcement that fails a PR merely
because an operator-owned checkbox under `## Testing steps` is unchecked. Those
checkboxes are operator work, not an automated assertion that a bot can close.

The current scaffolded `pull-request.yml` validates PR title shape, closing
keywords, and breaking-change marker consistency. It does not currently ship a
`check-pr-template-checkboxes.mjs` gate. Preserve that by avoiding any new
unchecked-checkbox failure path. If future structure validation is added, it may
check for required section headings or disallowed duplicate sections, but it
must not require `Testing steps` checkboxes to be checked before CI passes.

The design intentionally allows unchecked `Do before merging` and
`Testing steps` checkboxes to remain visible in a PR. Reviewers and operators
can use them as collaboration state. CI should not force authors to pre-check
human-owned verification before the operator has performed it.

## RED/GREEN baseline

RED baseline behavior:

- A PR body can contain `Testing steps`, a dense `Test coverage` matrix, and
  separate AC prose that repeat the same pass state.
- Human QA can be hidden under coverage prose instead of appearing as ordered
  operator-owned steps.
- A manual checklist can become noisy by placing a checkbox on every UI click or
  prefixing every item with `Operator check:`.
- A CI checkbox linter can make unchecked operator-owned testing steps fail the
  PR, pressuring authors to pre-check work that the operator has not verified.
- A single `Linked issue` slot can make related, blocked, or partially satisfied
  issues awkward to report.

GREEN target behavior:

- The scaffolded template has one `## Testing steps` section containing all
  operator-owned verification decisions in order.
- Each testing checkbox names an observable pass/fail outcome.
- The combined coverage section uses the table as the primary AC summary and
  only adds `Risks` when caveats exist.
- The template no longer requires per-AC prose subsections that duplicate the
  table's pass state.
- Scaffolded CI permits unchecked operator-owned testing checkboxes.
- Linked-issue guidance supports multiple issue relationships naturally.

## Rationalization resistance

| Rationalization | Design response |
| --- | --- |
| "The coverage table already implies manual QA." | Anything the operator needs to see or manually verify belongs in `Testing steps`. |
| "Every click is safer as a checkbox." | Checkboxes mark verification decisions or outcomes, not individual UI actions. |
| "One AC subsection per criterion is more complete." | Completeness comes from the table plus `Risks`; per-AC prose is optional only when it adds reader-useful context. |
| "Unchecked boxes should fail CI so nobody forgets." | Operator-owned checkboxes are collaboration state; CI may validate structure but must not require those boxes to be checked. |
| "A single closing issue is enough." | PRs can close one issue while relating to, blocking, or partially satisfying others. |

## Red flags

- A scaffolded PR body includes both `## Test coverage` and
  `## Acceptance criteria` sections that restate the same validation story.
- `## Testing steps` is absent, renamed, unordered, or contains prose-only human
  verification with no pass/fail checkboxes.
- Testing checklist items start with repeated labels such as `Operator check:`.
- Testing checklist items only list UI actions and do not name observable
  outcomes.
- The combined coverage section inventories every successful command but makes
  warnings, missing coverage, manual-only validation, or blockers hard to find.
- `Risks` appears as an empty or placeholder subsection.
- Scaffolded CI fails because a `Testing steps` checkbox is unchecked.
- Helper docs still tell authors to add an `Acceptance criteria` section or a
  prose subsection for every AC.

## Token-efficiency targets

Keep the template comments short and operational. The template should teach the
section ownership once, use one compact example row or checklist item, and avoid
repeating the same instruction in visible body text and HTML comments. Move
long-form explanation into generated `AGENTS.md` only if a future Planner finds
the template too terse for agents to follow.

The combined coverage section should reduce PR body size by making the table the
primary summary. Extra prose belongs only where it changes reviewer judgment.

## Role ownership

PR authors own filling the template. Operators own completing or rejecting
human verification decisions under `Testing steps` and pre-merge chores under
`Do before merging`. Reviewers own evaluating the coverage table, risks, and
remaining unchecked operator work. CI owns structure, commit-title, closing
keyword, and marker consistency checks only; CI does not own operator checkbox
completion.

Within Superteam, Brainstormer owns this design artifact, Planner owns the
implementation plan, Executor owns template and helper-doc edits, Reviewer owns
local review, and Finisher owns PR publication and latest-head follow-through.

## Stage-gate bypass paths

Gate 1 must not advance unless this design is committed and adversarial review
is clean or dispositioned. Implementation must not start from this design until
the operator explicitly approves it.

During implementation, do not treat the new combined section as permission to
drop acceptance-criteria coverage. AC rows remain required when an issue defines
ACs. Do not treat unchecked operator checkboxes as merge approval. Do not move
operator-owned QA into `Do before merging` to avoid visible testing gaps.

## Adversarial review

Reviewer context: same-thread fallback.

Findings:

- source: brainstormer
  severity: material
  location: Proposed change
  finding: Keeping the section name `## Test coverage` could technically be a
  combined section, but it risks preserving the old mental model and missing
  the issue's request for a reader-friendly coverage, AC, and risk section.
  disposition: Addressed by recommending `## Coverage and risks` while noting
  the only acceptable alternative would still need to satisfy AC-87-6 through
  AC-87-8.
- source: adversarial-review
  severity: material
  location: CI checkbox decision
  finding: The design could accidentally remove all PR-body structure checks
  while trying to avoid unchecked-checkbox enforcement.
  disposition: Addressed by allowing structure validation but forbidding CI from
  requiring operator-owned testing checkboxes to be checked.
- source: adversarial-review
  severity: material
  location: QA, merge chores, coverage, and risks
  finding: `Do before merging` can become a loophole for moving manual QA out of
  `Testing steps`.
  disposition: Addressed by defining `Do before merging` as pre-merge chores
  only and listing manual-QA relocation as a stage-gate bypass path.
- source: adversarial-review
  severity: minor
  location: Proposed PR template shape
  finding: ASCII status labels avoid emoji/symbol rendering variance, but the
  existing template already uses symbols. Over-specifying labels could create an
  unnecessary implementation constraint.
  disposition: Addressed by making status labels flexible while keeping section
  ownership binding.

Adversarial review status: findings dispositioned.

Clean pass rationale: The design has falsifiable RED/GREEN behavior, closes the
main rationalizations from the issue, keeps the user-facing template concise,
preserves author/operator/reviewer/CI ownership boundaries, and blocks the
specific bypass paths that would hide manual QA or make unchecked operator-owned
checkboxes fail CI. No approval-blocking findings remain.

## Verification

- Inspect `skills/scaffold-repository/templates/core/.github/pull_request_template.md`
  for exact `## Testing steps` heading, ordered operator-step guidance, checkbox
  outcome wording, multiple linked-issue guidance, and the combined coverage
  plus optional risks shape.
- Inspect root `.github/pull_request_template.md` for the same dogfood shape.
- Inspect `skills/scaffold-repository/templates/core/AGENTS.md.tmpl` and
  `skills/scaffold-repository/pr-body-template.md` for consistent PR-body
  guidance and no stale `Acceptance criteria` entry requirement.
- Inspect scaffolded workflows and scripts to confirm no CI path fails merely
  because `## Testing steps` contains unchecked operator-owned checkboxes.
- Run `pnpm lint:md`.
- Run `pnpm apply:scaffold-repository:check`.
