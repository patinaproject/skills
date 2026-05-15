# Plan: Require operator-owned testing steps in scaffold PR template [#87](https://github.com/patinaproject/skills/issues/87)

## Approved design

- Design artifact: `docs/superpowers/specs/2026-05-15-87-require-operator-owned-testing-steps-in-scaffold-pr-template-design.md`
- Gate 1 approval: operator explicitly approved on 2026-05-15.
- Handoff commit: `00a859243c4282223aa9086e9a2a42d144362eb9`
- Binding ACs: `AC-87-1` through `AC-87-16`.

## Goal

Make the scaffolded PR-body contract shorter and clearer by moving all
operator-owned pass/fail verification into ordered `## Testing steps`, replacing
the old `## Test coverage` plus per-AC prose pattern with one combined
`## Coverage and risks` section, supporting multiple linked issues, and keeping
CI out of operator checkbox completion.

Requirement-changing deltas are out of scope for Executor. If implementation
uncovers a need to rename sections differently, add new CI behavior, remove AC
coverage, or otherwise change the approved ownership model, halt and route the
delta back to Brainstormer.

## Workstreams

### W1: Update the root and scaffolded PR templates

Update both PR template surfaces together so this repo keeps dogfooding the
baseline emitted by `scaffold-repository`.

Files:

- `.github/pull_request_template.md`
- `skills/scaffold-repository/templates/core/.github/pull_request_template.md`

Tasks:

- W1.1 Preserve the section order from the approved design: `Linked issue`,
  `What changed`, optional `Do before merging`, `Coverage and risks`, and
  `Testing steps`.
- W1.2 Update `Linked issue` guidance so authors can include multiple issue
  relationships, including `Closes #<issue>`, `Related to #<issue>`,
  `Blocks #<issue>`, and `Partially satisfies #<issue>`, plus `None` when no
  issue applies.
- W1.3 Replace `## Test coverage` with `## Coverage and risks`.
- W1.4 Make the coverage table the primary AC summary with columns for AC,
  requirement, evidence, and status.
- W1.5 Include compact status guidance for pass, warning, blocked, and not
  applicable states; ASCII labels are acceptable and avoid symbol rendering
  variance.
- W1.6 Add an optional bottom `### Risks` subsection for warnings, missing
  coverage, merge-blocking gaps, manual-only validation, deferred checks, and
  caveats, with comments instructing authors to omit it when empty.
- W1.7 Remove the one-prose-subsection-per-AC requirement while preserving the
  requirement to report AC coverage when linked issues define ACs.
- W1.8 Keep `## Testing steps` named exactly, with instructions that every
  operator-owned verification step belongs there in the order the operator
  should perform or inspect it.
- W1.9 Require checkboxes for operator-owned pass/fail verification decisions or
  outcomes, and tell authors not to put a checkbox on every individual UI
  action.
- W1.10 Use direct checklist example wording that names an observable outcome and
  does not repeat a prefix such as `Operator check:`.
- W1.11 Keep `Do before merging` limited to PR-level operator chores, not manual
  QA, AC gaps, or pending CI checks.

Acceptance criteria covered: AC-87-1, AC-87-2, AC-87-3, AC-87-4, AC-87-5,
AC-87-6, AC-87-7, AC-87-8, AC-87-9, AC-87-10, AC-87-11, AC-87-12, AC-87-13,
AC-87-15.

### W2: Align generated AGENTS guidance

Update generated contributor guidance so downstream agents follow the new PR
body contract.

File:

- `skills/scaffold-repository/templates/core/AGENTS.md.tmpl`

Tasks:

- W2.1 Change `.github` template guidance so `Do before merging`, when present,
  sits between `What changed` and `Coverage and risks`.
- W2.2 Replace references to the template's `Test coverage` section with
  `Coverage and risks`.
- W2.3 Remove the rule requiring one `### AC-<issue>-<n>` heading per relevant
  AC.
- W2.4 State that AC rows belong in the coverage table and that extra prose is
  only for reader-useful context that changes reviewer judgment.
- W2.5 Route anything the operator needs to see or manually verify to
  `Testing steps`.
- W2.6 Keep checkbox ownership narrow: operator pass/fail verification outcomes
  in `Testing steps`, pre-merge chores in `Do before merging`, no checkboxes in
  `Coverage and risks`.
- W2.7 Update the Round-trip discipline reference if it still names the old
  `skills/bootstrap/templates/core/AGENTS.md.tmpl` path in a way that conflicts
  with the current `skills/scaffold-repository` source of truth.

Acceptance criteria covered: AC-87-2, AC-87-3, AC-87-4, AC-87-5, AC-87-6,
AC-87-7, AC-87-8, AC-87-10, AC-87-11, AC-87-13, AC-87-16.

### W3: Align helper docs and adjacent scaffold guidance

Update only adjacent docs that would otherwise contradict the new contract.
Keep edits minimal.

Files to inspect and update as needed:

- `skills/scaffold-repository/pr-body-template.md`
- `skills/scaffold-repository/SKILL.md`
- `skills/scaffold-repository/audit-checklist.md`
- `skills/scaffold-repository/templates/core/CONTRIBUTING.md.tmpl`

Tasks:

- W3.1 In `pr-body-template.md`, replace the stale instruction to put AC-54-7
  parity grep output under an `Acceptance criteria` entry. Route passing parity
  evidence to the `Coverage and risks` table, and route non-empty blocking
  output to the `Risks` subsection.
- W3.2 In `SKILL.md`, update the PR body convention summary so it names multiple
  linked-issue guidance, `Coverage and risks`, and `Testing steps` ownership
  instead of `Closes #<issue>` plus an AC block.
- W3.3 In `audit-checklist.md`, update the PR-template baseline check so it
  expects multiple linked-issue guidance, `Coverage and risks`, exact
  `## Testing steps`, and no stale one-subsection-per-AC requirement.
- W3.4 In `CONTRIBUTING.md.tmpl`, replace the instruction to include an
  `Acceptance criteria` section with guidance to fill the template's
  `Coverage and risks` table and use `Testing steps` for operator-owned
  verification.
- W3.5 Search adjacent scaffold docs for stale `Test coverage`,
  `Acceptance criteria`, `Testing steps`, `Coverage and risks`, `checkbox`, and
  `Linked issue` wording. Update only references that describe the scaffolded PR
  body contract.

Acceptance criteria covered: AC-87-6, AC-87-7, AC-87-8, AC-87-9, AC-87-10,
AC-87-11, AC-87-15, AC-87-16.

### W4: Audit scaffolded CI checkbox behavior

Confirm the scaffolded baseline has no unchecked-operator-checkbox failure path,
and avoid adding one.

Files to inspect:

- `skills/scaffold-repository/templates/core/.github/workflows/pull-request.yml`
- Other scaffolded workflow or script files surfaced by search.

Tasks:

- W4.1 Confirm `pull-request.yml` still validates PR title shape, closing
  keywords, and breaking-change marker consistency only.
- W4.2 Confirm no scaffolded script or workflow such as
  `check-pr-template-checkboxes.mjs` fails because `## Testing steps` or
  `## Do before merging` contains unchecked boxes.
- W4.3 If future structure validation is discovered, keep or adjust it only so
  it validates headings or duplicate-section structure without requiring
  operator-owned checkboxes to be checked.
- W4.4 Do not add any new CI gate that checks off operator work or pressures
  authors to pre-check manual verification before the operator performs it.

Acceptance criteria covered: AC-87-14, AC-87-16.

### W5: Verify implementation

Run the full scaffold and Markdown verification set, plus targeted contract
searches.

Commands and expected outcomes:

- W5.1 `rg -n "## Test coverage|## Acceptance criteria|Acceptance criteria entry|one subsection per AC|Operator check:" .github skills/scaffold-repository`
  should return no stale scaffolded PR-body contract requirements. If matches
  remain, each must be unrelated historical context or explicitly not part of
  the scaffolded PR-body contract.
- W5.2 `rg -n "Coverage and risks|## Testing steps|Partially satisfies|Risks" .github/pull_request_template.md skills/scaffold-repository`
  should show the new section names and multiple linked-issue guidance on the
  root template, scaffolded template, and helper guidance.
- W5.3 `rg -n "check-pr-template-checkboxes|unchecked|Testing steps.*checkbox|Do before merging.*checkbox" skills/scaffold-repository/templates/core/.github skills/scaffold-repository/scripts scripts`
  should show no CI path that fails merely because operator-owned checkboxes are
  unchecked. It may show instructional text that permits unchecked operator
  work.
- W5.4 `pnpm apply:scaffold-repository:check` should pass, proving the current
  repo remains aligned with the emitted scaffold baseline.
- W5.5 `pnpm verify:dogfood` should pass, confirming the six in-repo skills are
  still discoverable through the flat layout.
- W5.6 `pnpm verify:marketplace` should pass, confirming marketplace metadata
  remains valid.
- W5.7 `pnpm lint:md` should pass. No approved-design-specific pre-existing lint
  caveat is known; if lint fails on unrelated pre-existing files, capture the
  exact file and rule, then also run targeted lint on the files changed for this
  issue.

Acceptance criteria covered: AC-87-1 through AC-87-16.

### W6: Prepare PR body expectations for Finisher

When implementation is complete and reviewed, the PR body should itself use the
new template contract.

Tasks:

- W6.1 Use `## Linked issue` with `Closes #87`.
- W6.2 Use `## Coverage and risks` as the single AC/evidence/risk section.
- W6.3 Include one table row per AC from `AC-87-1` through `AC-87-16`; do not add
  a separate `## Acceptance criteria` section or one prose subsection per AC.
- W6.4 Include `### Risks` only if implementation leaves a warning, caveat,
  missing coverage, manual-only validation, deferred check, or merge blocker.
- W6.5 Put operator-owned manual verification decisions, if any, under
  `## Testing steps` as ordered pass/fail checkboxes naming observable outcomes.
- W6.6 Do not mark unchecked `Testing steps` boxes as CI failures or merge
  approval.

Acceptance criteria covered: AC-87-1 through AC-87-16.

## Blockers

None.
