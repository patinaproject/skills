# Design: PR templates should prohibit accidental agent trigger mentions [#79](https://github.com/patinaproject/bootstrap/issues/79)

## Intent

Make the bootstrap PR body contract prevent accidental agent trigger mentions in
verifier fields while keeping acceptance-criteria reports compact. The template
should name neutral verifier values, avoid bot-handle examples, keep the `Unit`
summary column in the `Test coverage` matrix, and keep detailed unit command
output out of per-AC summaries so reviewers see the decisions they need.

## Requirements

- R1: The canonical PR template explicitly says not to include `@claude`,
  `@codex`, or similar agent trigger mentions unless the trigger is
  intentional.
- R2: Test verifier guidance uses neutral values such as a person, role, or run
  identifier.
- R3: The `Test coverage` matrix keeps the `Unit` column and only adds
  supported platform columns affected by the PR.
- R4: Per-AC test rows report meaningful platform validation.
- R5: Per-AC reports summarize the AC outcome and keep detailed unit command
  output in the coverage matrix.
- R6: The emitted bootstrap core template, root template, and traceability docs
  describe the same PR-body grammar.
- R7: `Test coverage` matrix status cells use the template's status symbols.
- R8: `Operator check:` rows capture every known operator action, including
  product checks and evidence review.
- R9: Test-gap rows capture every known coverage gap the operator needs to
  review.
- R10: Operator-check rows and test-gap rows are unchecked operator checkboxes.
- R11: When updating an existing PR body, every existing manual-review or
  manual-test instruction stays under its AC as an unchecked operator-check
  checkbox.
- R12: Operator-check checkbox items use imperative style so the operator can
  act on them directly.
- R13: Matrix status cells contain only the status symbols, with explanatory
  text kept outside the cells.
- R14: Missing relevant platform validation is reported as a test-gap checkbox.
- R15: Operator-check checkboxes describe operator actions and expected
  decisions or results without implying the agent has observed the outcome.
- R16: Per-AC content order is stable: summary, evidence rows, test-gap
  checkboxes, then operator-check checkboxes.
- R17: Evidence rows stay compact, with the verifier or timestamp optional.
- R18: Matrix `➖` means not relevant, not omitted; shown evidence, gaps, or
  operator checks make the matching matrix cell non-`➖` only when they clearly
  map to that matrix column.
- R19: Unresolved critical or major review findings that affect validation may
  produce test-gap checkboxes, but those gaps describe the missing observable
  behavior or validation rather than restating the finding.
- R20: Matrix rows are limited to ACs with validation evidence, a required test
  gap, or an operator check.
- R21: Evidence rows use a colon after the evidence label and name the concrete
  command, workflow job, tool, or harness when known.
- R22: Placeholder checkbox rows are deleted when unused.
- R23: Generic diff-review checks are not added unless tied to a specific risk,
  artifact, or unresolved decision.
- R24: A test gap is not duplicated as an operator check unless the operator
  action can close or validate that gap.
- R25: The agent-trigger rule applies to the whole PR body, not only evidence
  rows.
- R26: Every relevant AC keeps an AC heading even when it is omitted from the
  matrix.
- R27: Unit evidence rows are used only when unit evidence is the meaningful
  validation for that AC.
- R28: Test-gap checkboxes describe missing coverage or unresolved validation
  concerns rather than issuing operator commands.
- R29: Operator-check rows include an expected decision or result.
- R30: Evidence rows may include an optional link in the verifier/timestamp
  slot.
- R31: Matrix status symbols describe the required-validation state for each
  AC/column pair, including blocking gaps.
- R32: `Do before merging` excludes failing or pending PR check status because
  GitHub already reports checks.
- R33: Pending required validation is reported as `❌` plus a test-gap checkbox
  until the validation passes.
- R34: Partial examples shown outside a PR body are labeled as excerpts before
  the first omitted section or table, while actual PR bodies keep every
  relevant AC heading.
- R35: Per-AC summaries state the current reviewer-relevant result, including
  blockers or pending validation when present.
- R36: Operator checks avoid product retest checkboxes for
  maintainability-only findings unless there is behavior risk the operator can
  validate.
- R37: CI that must rerun after a fix is reported as a test gap unless an
  operator must manually trigger or inspect a specific job.
- R38: Test-gap checkboxes are about observable behavior, missing coverage, or
  validation that cannot yet be trusted.
- R39: Manual product or workflow validation stays as an operator check when a
  human must exercise observable behavior after a gap is fixed.

## Acceptance criteria

- AC-79-1: Given an agent or human opens the bootstrap PR template, when they
  read the PR body guidance, then it explicitly says not to include `@claude`,
  `@codex`, or similar agent trigger mentions unless the trigger is
  intentional.
- AC-79-2: Given the bootstrap core template is emitted into a downstream
  repository, when a PR body follows the generated template, then test evidence
  uses a neutral verifier value and does not encourage bot handles.
- AC-79-3: Given the root bootstrap PR template and the emitted core template
  both define the canonical PR body structure, when this issue is implemented,
  then both templates contain aligned guidance for avoiding accidental agent
  mentions.
- AC-79-4: Given an author fills the acceptance-criteria reports in the
  bootstrap PR template, when they add test coverage or per-AC verification,
  then the template keeps the `Unit` coverage summary column and keeps detailed
  unit command output out of the per-AC summaries.
- AC-79-5: Given an author fills the `Test coverage` matrix, when they mark an
  AC status, then the template tells them to use the status symbols.
- AC-79-6: Given an author fills an acceptance-criteria report, when they add an
  `Operator check:` row, then the template tells them to include every known
  operator action.
- AC-79-7: Given an author fills an acceptance-criteria report, when they add
  an operator-check or test-gap row, then the template shows every known item
  as an unchecked operator checkbox.
- AC-79-8: Given an author updates an existing PR body, when that body already
  contains manual-review or manual-test instructions, then the template
  preserves each instruction under its AC as an unchecked operator-check
  checkbox.
- AC-79-9: Given an author adds an operator-check checkbox, when the checkbox
  is written, then its text uses imperative style.
- AC-79-10: Given an author fills the `Test coverage` matrix, when they mark an
  AC status, then each status cell contains only a status symbol.
- AC-79-11: Given an AC has a relevant supported platform without validation,
  when the author fills that AC report, then the missing validation appears as
  a test-gap checkbox.
- AC-79-12: Given an author adds an operator-check checkbox, when they describe
  the operator work, then the checkbox names an action and expected decision or
  result instead of implying an already observed outcome.
- AC-79-13: Given an author fills an AC report, when they include evidence,
  gaps, and operator checks, then the content follows the template order with
  operator checks below test gaps.
- AC-79-14: Given an author adds operator work, when the work reviews evidence
  or exercises product behavior, then the checkbox uses the `Operator check:`
  prefix.
- AC-79-15: Given an author fills the matrix and per-AC report, when an AC
  includes evidence, a gap, or an operator check that clearly maps to a matrix
  column, then the matching matrix cell is not `➖`.
- AC-79-16: Given a critical or major review finding affects validation, when
  the author updates the AC report, then the test-gap checkbox describes the
  missing observable behavior or validation unless it belongs in
  `Do before merging`.
- AC-79-17: Given an AC has no validation evidence, required test gap, or
  operator check, when the author fills the `Test coverage` matrix, then the AC
  may be omitted from the matrix and summarized only in the AC section.
- AC-79-18: Given an author adds an evidence row, when the row is written, then
  it uses a colon after the evidence label and names the concrete command,
  workflow job, tool, or harness when known.
- AC-79-19: Given a placeholder checkbox row is unused, when the PR body is
  finalized, then the placeholder row is deleted.
- AC-79-20: Given an author adds an operator-check row, when the check is a
  diff review, then it names the specific risk, artifact, or unresolved
  decision the operator must inspect.
- AC-79-21: Given an author reports a test gap, when an operator check appears
  under the same AC, then it does not duplicate the gap unless the operator
  action can close or validate that gap.
- AC-79-22: Given an author writes any part of the PR body, when they mention
  agent names, then the template applies the trigger-warning guidance across
  the full PR body.
- AC-79-23: Given a relevant AC is omitted from the matrix because it has no
  validation signal, when the PR body is finalized, then the AC still has a
  heading in the Acceptance criteria section.
- AC-79-24: Given an author adds a unit evidence row under an AC, when the row
  is written, then unit evidence is the meaningful validation for that AC.
- AC-79-25: Given an author adds a test-gap checkbox, when the checkbox is
  written, then it describes missing coverage or an unresolved validation
  concern rather than issuing an operator command.
- AC-79-26: Given an author adds an operator-check checkbox, when the checkbox
  is written, then it includes an expected decision or result.
- AC-79-27: Given an author adds an evidence row, when useful evidence has a
  link, then the optional evidence slot can contain that link instead of a
  verifier or timestamp.
- AC-79-28: Given an author fills a matrix status cell, when validation for
  that AC and column is complete, blocked, or irrelevant, then the cell uses
  `✅` only for passed required validation with no blocking gap, `❌` for
  missing, failing, or blocked required validation, and `➖` only when the
  column is not relevant to the AC.
- AC-79-29: Given a PR has failing or pending GitHub checks, when the author
  fills `Do before merging`, then check status is not duplicated there.
- AC-79-30: Given required validation for an AC/column is pending, when the
  author fills the matrix, then that cell uses `❌` and the AC includes a
  test-gap checkbox until validation passes.
- AC-79-31: Given an author shows a partial PR-body example outside GitHub,
  when relevant sections, rows, or AC headings are omitted for brevity, then
  the whole example is labeled as an excerpt before the first omitted section
  or table.
- AC-79-32: Given an author writes an AC summary, when blockers or pending
  validation are present, then the summary states that current
  reviewer-relevant status.
- AC-79-33: Given a review finding is maintainability-only, when the author
  records follow-up under an AC, then the PR body does not add product retest
  operator checkboxes unless there is behavior risk the operator can validate.
- AC-79-34: Given CI must rerun after a fix, when the author records that
  validation state under an AC, then the rerun is reported as a test gap unless
  the operator must manually trigger or inspect a specific job.
- AC-79-35: Given an author writes a test-gap checkbox, when the gap comes from
  a code review finding, then the checkbox describes observable behavior,
  missing coverage, or validation that cannot yet be trusted rather than
  restating the code review finding.
- AC-79-36: Given a validation gap requires a human to exercise product or
  workflow behavior after the fix, when the author records follow-up under the
  AC, then that manual validation remains an operator-check checkbox.

## Surfaces

- `skills/bootstrap/templates/core/.github/pull_request_template.md`
- `.github/pull_request_template.md`
- `docs/ac-traceability.md`
- `docs/superpowers/specs/2026-04-30-79-pr-templates-should-prohibit-accidental-agent-trigger-mentions-design.md`

## Workflow-Contract Safeguards

- RED baseline: the previous PR template required per-AC unit/platform rows,
  which encouraged noisy AC reports even when unit-test details did not add
  reviewer-useful evidence.
- GREEN target: the template keeps the `Unit` summary column, platform
  validation, every known operator action, and every known test gap visible
  while keeping detailed unit command output out of AC prose.
- Rationalization resistance: the template explicitly keeps the `Unit` matrix
  column, names symbol-only matrix statuses, requires platform evidence or an
  explicit gap for relevant supported platforms, requires colon-style evidence
  rows with concrete commands/jobs/tools/harnesses when known, shows
  operator-check and test-gap rows as unchecked operator checkboxes, and
  prevents `➖` from hiding clearly mapped evidence or gaps.
- Token efficiency: detailed grammar stays in the PR template comments, while
  `docs/ac-traceability.md` points to the canonical template for the full rule
  set.
- Role ownership: authors decide which platform evidence is meaningful;
  reviewers inspect AC outcomes and gaps; operators see checkboxes only for
  actual pre-merge actions.
- Stage-gate bypass prevention: root/template parity and traceability checks
  keep downstream bootstrap output aligned with the root PR template.

## Adversarial Review

Status: clean.

Reviewer context: same-thread fallback.

Checked dimensions:

- RED/GREEN baseline obligations are documented above.
- Rationalization resistance is present through explicit Unit-summary vs.
  unit-detail-row wording.
- Matrix status rationalization is closed by tying each symbol to the
  required-validation state for the AC/column pair.
- Pending-validation overclaiming is closed by requiring `❌` plus a test-gap
  checkbox until required validation passes.
- Matrix status copying is closed by requiring symbol-only cells.
- PR-check duplication is closed by keeping GitHub check status out of
  `Do before merging`.
- Operator-check rationalization is closed by naming operator-needed actions as
  the included operator-check content.
- Operator result invention is closed by asking for expected decisions or
  results instead of observed outcomes.
- Test-gap and operator-check checkbox rationalization is closed by showing the
  unchecked operator checkbox form.
- Test-gap omission is closed by showing a visible test-gap checkbox placeholder.
- Lossy summarization is closed by requiring every known operator action and
  every known test gap to be carried forward.
- Manual-review ambiguity is closed by using one `Operator check:` prefix.
- Matrix inconsistency is closed by requiring clearly mapped evidence, gaps, or
  operator checks to make the matching cell non-`➖`.
- Review-finding loss is closed by requiring validation-affecting critical or
  major findings to surface as observable validation gaps or pre-merge tasks.
- Matrix bloat is closed by allowing bookkeeping-only ACs to stay out of the
  matrix.
- Evidence vagueness is closed by requiring a concrete command, workflow job,
  tool, or harness when known.
- Placeholder leakage is closed by requiring unused checkbox placeholders to be
  deleted.
- Generic review noise is closed by requiring diff-review checks to name a
  specific risk, artifact, or unresolved decision.
- Gap/check duplication is closed by separating unresolved validation concerns
  from operator actions that can close or validate them.
- Maintainability-only retest creep is closed by requiring behavior risk before
  product retest operator checkboxes are added.
- Whole-body trigger safety is closed by moving trigger guidance to the PR-wide
  template comment.
- AC omission loss is closed by requiring every relevant AC to keep an AC
  heading even when it is omitted from the matrix.
- Unit-detail creep is closed by allowing unit evidence rows only when unit
  evidence is the meaningful validation for that AC.
- Gap wording ambiguity is closed by making test gaps descriptive rather than
  command-shaped.
- Code-review gap laundering is closed by requiring test gaps to describe
  observable behavior, missing coverage, or validation that cannot yet be
  trusted rather than restating findings.
- Operator-check vagueness is closed by requiring an expected decision or
  result.
- Evidence traceability is improved by allowing evidence links in the optional
  evidence slot.
- Platform loss is closed by requiring evidence or a test-gap checkbox for each
  relevant supported platform.
- PR-update loss is closed by requiring existing manual-review and manual-test
  instructions to stay attached to their ACs as operator checks.
- Checkbox ambiguity is closed by requiring imperative operator-check text and
  descriptive test-gap text.
- AC section drift is closed by naming the summary, evidence, test-gap, and
  operator-check order.
- Example truncation drift is closed by labeling partial examples before the
  first omitted section or table.
- Summary vagueness is closed by asking for the current reviewer-relevant
  result, including blockers or pending validation.
- CI-rerun checkbox creep is closed by treating reruns after fixes as test gaps
  unless the operator must manually trigger or inspect a specific job.
- Manual-validation loss is closed by keeping human product or workflow checks
  as operator checks when the operator must exercise observable behavior after a
  gap is fixed.
- Red flags are addressed by preserving platform evidence and visible
  gap reporting.
- Token efficiency is preserved by avoiding duplicate grammar outside the
  template.
- Role ownership is explicit in the template and design.
- Stage-gate bypass paths are closed by root/template parity checks.

Findings: none.
