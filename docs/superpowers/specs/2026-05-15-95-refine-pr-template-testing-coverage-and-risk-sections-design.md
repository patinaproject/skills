# Design: Refine PR template testing, coverage, and risk sections [#95](https://github.com/patinaproject/skills/issues/95)

## Intent

Refine the PR-body contract after the #87 follow-up feedback so reviewers see
operator-owned testing steps before the acceptance-criteria evidence, coverage
and risks are separate sections again, and PR bodies use compact emoji status
signals without a legend. The change should preserve #87's most important
ownership rule: authors must not pre-check operator testing steps, and should
not include manual-test noise when no operator action is needed.

## Skill guidance

This design may lead to edits under `skills/scaffold-repository/**`, including
skill-facing guidance and scaffolded contributor templates. Implementation must
use the repository-required `write-a-skill` structure review before editing any
skill file. If the implementation changes workflow-contract language under
`skills/superteam/**`, it must also use `writing-skills`; this design does not
expect Superteam workflow-contract edits.

The Gate 1 adversarial review for this design uses the Superteam
workflow-contract dimensions because the PR template teaches future agent
workflow behavior: RED/GREEN baseline obligations, rationalization resistance,
red flags, token-efficiency targets, role ownership, and stage-gate bypass
paths.

## Problem

PRs #91 and #92 exposed that the current #87 template went too far in combining
reader jobs. `## Coverage and risks` is dense, the status legend is extra
ceremony, and `## Testing steps` appears too late for the operator who must
actually perform manual verification. The template also still contains a
checked-row fallback for "no manual testing needed," which makes authors create
operator-looking work even when there is no operator action to perform.

The desired contract is simpler:

- operator-owned manual verification decisions appear early in
  `## Testing steps`;
- AC evidence appears in `## Test coverage`;
- risk callouts appear in `## Risks` only when they exist;
- status cells use the prior emoji language instead of a legend; and
- checkboxes are never pre-checked by the template or generated PR bodies.

## Requirements

### AC-95-1

`## Testing steps` appears above `## Test coverage` in the canonical PR
template.

### AC-95-2

The combined `## Coverage and risks` section is replaced by separate
`## Test coverage` and optional `## Risks` sections.

### AC-95-3

The status legend is removed from rendered PR template guidance.

### AC-95-4

Test coverage rows use emoji statuses: `✅` for covered, `⚠️` for covered with
an associated risk, and `❌` for missing test coverage.

### AC-95-5

Any `⚠️` coverage row requires a corresponding risk entry in the `## Risks`
section tied to the relevant AC.

### AC-95-6

`## Risks` is hidden or omitted when there are no notable risks.

### AC-95-7

Testing-step checkboxes are never pre-checked by the template or generated PR
bodies.

### AC-95-8

`## Testing steps` includes only operator-owned actions or inspections; it must
not include automated command output, no-op placeholders, or noise.

### AC-95-9

Repo guidance continues to route linked-issue AC evidence into the PR body
without duplicating coverage gaps, testing steps, or pre-merge chores across
sections.

## Proposed change

Update `.github/pull_request_template.md` as the canonical PR body contract and
then update the scaffold-repository surfaces that describe or emit that
contract:

- `skills/scaffold-repository/templates/core/.github/pull_request_template.md`;
- root `AGENTS.md`;
- `skills/scaffold-repository/templates/core/AGENTS.md.tmpl`;
- `skills/scaffold-repository/templates/core/CONTRIBUTING.md.tmpl`;
- `skills/scaffold-repository/SKILL.md`;
- `skills/scaffold-repository/audit-checklist.md`;
- `skills/scaffold-repository/pr-body-template.md`; and
- any adjacent scaffold docs surfaced by targeted searches for the old combined
  section or stale status language.

`scripts/apply-scaffold-repository.js` copies
`skills/scaffold-repository/templates/core/.github/pull_request_template.md` to
the root `.github/pull_request_template.md` during scaffold self-apply, so the
scaffold template is the emitted baseline source of truth and the root template
is the dogfooded copy. Update both together and verify self-apply remains
idempotent.

Keep the PR body section order:

1. `## Linked issue`
2. `## What changed`
3. optional `## Do before merging`
4. `## Testing steps`
5. `## Test coverage`
6. optional `## Risks`

## Proposed PR template shape

```markdown
# Pull Request

## Linked issue

- At least one GitHub closing keyword is required for normal PRs:
  `Closes #<issue>`, `Fixes #<issue>`, or `Resolves #<issue>`.
- Add one closing-keyword line for each issue this PR completes.
- `Related to #<issue>` / `Blocks #<issue>` / `Partially satisfies #<issue>`
  are additional references, not replacements for the required closing keyword.
  Include a short explanation when the relationship is not obvious.

## What changed

Context: <prior PR, prior QA pass, follow-up issue, or `standalone - <reason>`>

- <change> - <why>

<!-- Optional, include only for PR-level operator work before merge. -->
## Do before merging

- [ ] <imperative pre-merge action not covered by QA, coverage gaps, or CI>

<!--
  Optional: include this whole section only when operator-owned manual
  verification is needed. Delete the full commented example when there is no
  operator-owned manual verification; do not leave a checked or unchecked "no
  manual testing needed" row.

## Testing steps

  Include only operator-owned actions or inspections. Use unchecked checkboxes
  for pass/fail verification decisions or outcomes, not for automated command
  output, no-op placeholders, or every individual UI action.

- [ ] Verify <observable outcome> after <minimal action context>.
-->

## Test coverage

<!--
  Add one table row per relevant AC when linked issues define ACs. Use `✅` for
  covered, `⚠️` for covered with an associated risk, and `❌` for missing test
  coverage. Any `⚠️` row must have a matching `## Risks` entry tied to the same
  AC. Do not use checkboxes in this section.
-->

| AC | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| AC-<issue>-<n> | <short title> | <command, job, manual source, or doc review> | ✅ |

<!--
  Optional: include this whole section only when there are notable risks. Delete
  the full commented example when there are no risks.

## Risks

- `AC-<issue>-<n>`: <risk, caveat, missing coverage, manual-only validation,
  deferred check, or merge blocker>.
-->
```

The implementation should keep optional-section instructions inside comments so
rendered PR bodies stay short. `## Testing steps` is an optional commented
example in the template, not an always-rendered heading: PR authors and
generated PR bodies must include the section only when there is operator-owned
manual verification. Do not include a checked or unchecked "no manual testing
needed" row.

## Section ownership

`## Testing steps` is for operator-owned verification. It contains unchecked
checkboxes only when the operator needs to do or inspect something. Automated
command output, CI results, and no-op confirmations belong elsewhere or should
be omitted. A PR body with no operator-owned manual action should have no
`## Testing steps` section.

`## Test coverage` is the AC evidence table. It should show the smallest useful
evidence per AC and should not narrate every passing command. The emoji status
is the scan cue; no separate legend is needed in the rendered template.

`## Risks` is an optional commented example in the template, not an
always-rendered heading. It appears only when the implementation leaves a risk,
caveat, missing coverage, manual-only validation, deferred check, or merge
blocker. Any `⚠️` row in `## Test coverage` must point to a corresponding
AC-tied risk entry.

`## Do before merging` remains narrower than testing. It is only for concrete
pre-merge operational chores, not QA, coverage gaps, or pending CI.

## Guidance updates

Root and scaffolded contributor guidance should describe the new section names
without creating a parallel PR body structure. In particular:

- replace references to `Coverage and risks` with `Test coverage` plus optional
  `Risks`;
- update any guidance that says `Do before merging` sits before
  `Coverage and risks` so it now sits before `Testing steps`;
- keep the rule that one row per relevant `AC-<issue>-<n>` belongs in the
  coverage table;
- route warnings and missing coverage to `Risks`, not `Testing steps`;
- route operator-owned manual verification to `Testing steps`, not
  `Test coverage`;
- remove any instruction to include a checked row when no manual testing is
  needed; and
- ensure generated docs do not require authors to pre-check operator-owned
  checkboxes.

`skills/scaffold-repository/pr-body-template.md` should route AC-54-7 parity
grep output to `## Test coverage`; non-empty blocking output belongs in
`## Risks`.

`skills/scaffold-repository/audit-checklist.md` should expect the canonical PR
template to include required closing-keyword guidance, `## Testing steps`,
`## Test coverage`, optional `## Risks`, emoji status guidance, and the
no-pre-checked-testing rule.

`scripts/apply-scaffold-repository.js` should not need behavior changes, but
Executor must account for its source/destination relationship while verifying:
the scaffold template drives the root PR template, not the other way around.

## Verification strategy

Implementation should run:

- `rg --hidden -n "Coverage and risks|PASS|WARN|BLOCKED|N/A|checked row|no manual testing needed" .github AGENTS.md skills/scaffold-repository`;
- `rg --hidden -n "## Testing steps|## Test coverage|## Risks|✅|⚠️|❌" .github/pull_request_template.md AGENTS.md skills/scaffold-repository`;
- `pnpm apply:scaffold-repository:check`;
- `pnpm verify:dogfood`;
- `pnpm verify:marketplace`; and
- `pnpm lint:md`.

If Markdown lint objects to emoji width or punctuation, the implementation
should fix the surrounding Markdown rather than reverting to text status labels.

## Risks and tradeoffs

- Moving `## Testing steps` above coverage makes operator work prominent but
  would create noise when no manual testing exists. Omitting the whole section
  in that case is intentional and required.
- Emoji statuses improve scanning but require exact guidance that `⚠️` is not a
  vague caution marker. It must have a matching AC-tied risk entry.
- This design deliberately reopens part of #87's combined-section decision. The
  new split keeps #87's role separation while accepting the later feedback that
  risks deserve their own optional section.

## Brainstorming output

Problem framing: the current template satisfies the prior desire to centralize
coverage, but it makes the operator's manual work late and the risk model too
busy. The follow-up issue is not asking for more validation; it is asking for
less ceremony and sharper section ownership.

Directions considered:

- Keep `Coverage and risks` and only move `Testing steps` above it. Rejected
  because AC-95-2 explicitly asks for separate `Test coverage` and `Risks`
  sections.
- Keep text statuses but remove the legend. Rejected because AC-95-4 explicitly
  asks to bring back emoji statuses.
- Always render `## Testing steps` with a "no manual testing" row or placeholder.
  Rejected because that creates the exact operator-noise failure called out in
  AC-95-8.

Recommended direction: split the rendered body into `Testing steps`,
`Test coverage`, and optional `Risks`, with comments enforcing ownership and
the `⚠️` to risk-entry link.

Notable tradeoffs: the template will have one more possible top-level section
than the #87 version, but in no-risk and no-manual-test PRs the rendered body
should become shorter because the legend, testing placeholder, checked fallback
row, and empty risk block disappear.

Open risks or questions: none blocking. The main implementation risk is stale
scaffold guidance that still says `Coverage and risks`; targeted search should
catch it.
