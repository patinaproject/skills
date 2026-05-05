# Design: Revert PR checkbox validation behavior that hides blocking test gaps [#86](https://github.com/patinaproject/bootstrap/issues/86)

## Intent

Restore honest PR readiness reporting for unresolved validation gaps. The
current `check-pr-template-checkboxes` gate treats every unchecked visible
checkbox as a required template checkbox unless the row is explicitly optional.
That collides with the PR template's canonical `⚠️ Test gap:` rows, which are
intentionally unchecked while validation is still unresolved. The fix should
remove the incentive to rewrite real gaps as prose while keeping unresolved
blocking validation visible to reviewers and publish-state checks.

## Requirements

- R1: PR authors must keep real unresolved validation gaps in the canonical
  unchecked `⚠️ Test gap:` checkbox format under the relevant AC.
- R2: A PR with unresolved blocking validation gaps must remain visibly not
  ready until those gaps are resolved or deliberately deferred.
- R3: The repository must not reward converting unresolved test gaps to prose
  solely to satisfy a checkbox validator.
- R4: Operator-action checkboxes remain distinct from test-gap checkboxes.
  Operator actions can still require explicit completion before merge.
- R5: The broad required-checkbox validator must no longer fail canonical
  unchecked `⚠️ Test gap:` rows as though they were ordinary required operator
  tasks; unresolved gaps must be handled by a semantic readiness-gap contract
  with gap-specific failure messages.
- R6: If implementation keeps a checkbox validator, it must validate only
  checkboxes whose semantics are genuinely "must be checked before merge,"
  such as `Operator check:` rows or explicitly marked required operator rows.
- R7: If implementation removes the checkbox validator entirely, it must also
  remove or update its workflow step, package script, fixtures, and template
  marker guidance so stale enforcement claims do not remain.
- R8: Root baseline files must stay mirrored from
  `skills/bootstrap/templates/**`; template edits happen first, then root files
  are realigned.
- R9: The implementation must include a RED baseline showing the current
  conflict: a canonical unchecked `⚠️ Test gap:` row fails
  `check-pr-template-checkboxes`.
- R10: The implementation must include GREEN verification that canonical test
  gaps no longer need prose workarounds, while any retained required
  operator-action checkbox behavior is covered by fixtures.
- R11: A prose workaround such as `Blocking validation gap:` must not satisfy
  readiness when the PR body otherwise indicates a warning, unresolved
  validation concern, or pending/failing check.

## Acceptance Criteria

- AC-86-1: Given a PR body contains a canonical unchecked `⚠️ Test gap:` row,
  when repository PR validation runs, then the row is preserved as the
  canonical way to report the unresolved validation gap and any failure names
  the unresolved validation gap instead of treating it as a generic required
  checkbox.
- AC-86-2: Given a PR body contains a real unresolved blocking validation gap,
  when reviewers inspect PR readiness or required PR-body validation runs, then
  the PR remains visibly not ready until the gap is resolved or explicitly
  deferred.
- AC-86-3: Given a PR body contains an unchecked operator-action checkbox,
  when any retained checkbox validation runs, then that operator action still
  fails readiness unless it is explicitly optional.
- AC-86-4: Given bootstrap ships repository baseline files from templates,
  when the validation behavior changes, then template source files and mirrored
  root files remain in sync.

## Recommended Approach

Replace broad "all visible unchecked checkboxes are required" validation with
semantic readiness validation:

1. Treat `⚠️ Test gap:` rows as readiness blockers that must stay visible in
   the PR body while unresolved. They may fail readiness, but the failure must
   say the unresolved validation gap is blocking instead of saying a generic
   required checkbox is unchecked.
2. Reject prose workarounds when a PR body shows a warning state, pending or
   failing validation, or a missing test-gap row where the template requires a
   canonical `⚠️ Test gap:` checkbox.
3. Retain checkbox enforcement only for operator-action checkboxes whose text
   starts with `Operator check:` or rows explicitly marked with a required
   operator checkbox marker.
4. Update the PR template comments to state that test-gap checkboxes are
   intentionally unchecked while unresolved and must not be rewritten as prose.
5. Replace or rename `check-pr-template-checkboxes` if needed so the check name
   reflects semantic readiness rather than generic checkbox completion.
6. Update `scripts/check-pr-template-checkboxes.mjs` and its template copy so
   canonical `⚠️ Test gap:` rows are reported as unresolved validation gaps,
   not as ordinary required checklist items.
7. Add or update fixtures for:
   - current failing baseline: unchecked `⚠️ Test gap:` fails the old validator;
   - green target: unchecked `⚠️ Test gap:` fails, when appropriate, with a
     gap-specific readiness message rather than a generic checkbox message;
   - prose workaround: `Blocking validation gap:` does not satisfy canonical
     test-gap requirements when the matrix or AC summary indicates a warning;
   - retained failure: unchecked `Operator check:` remains a readiness failure;
   - optional checkbox and docs-choice behavior remains covered if retained.

This is a targeted correction rather than a full PR-template redesign. It keeps
the useful distinction introduced by #83 while undoing the over-broad behavior
introduced by #64.

## Considered Approaches

### Recommended: Narrow the checkbox validator to operator-action semantics

This removes the prose workaround incentive while preserving enforcement for
the rows that are truly "must be checked before merge." It is acceptable only
if a separate semantic readiness-gap rule blocks unresolved test gaps and
rejects prose substitutes.

### Simpler: Remove the checkbox validator and workflow step entirely

This fully reverts the misleading gate and is acceptable if implementation
finds that the validator's remaining operator-action coverage is too coupled
to the broken assumption. The cost is losing automated enforcement for real
operator-action checkboxes unless another gate already covers them. It also
requires a replacement readiness-gap gate; otherwise this approach leaves the
core issue unsolved.

### Rejected: Mark every test gap as optional

Optional markers would make the checkbox gate pass, but they teach the wrong
readiness model. A real blocking test gap is not optional; it is unresolved
validation that must stay visible and prevent readiness until addressed or
explicitly deferred.

### Rejected: Keep the current validator and rely on agent discipline

The reported failure mode is that agents already rationalize around the red
check by converting canonical rows to prose. Leaving the gate unchanged keeps
the same incentive in place.

## Affected Surfaces

- `skills/bootstrap/templates/core/.github/pull_request_template.md`
- `.github/pull_request_template.md`
- `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs`
- `scripts/check-pr-template-checkboxes.mjs`
- `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`
- `scripts/check-pr-template-checkboxes.test.mjs`
- `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/*`
- `scripts/fixtures/pr-template-checkboxes/*`
- `skills/bootstrap/templates/core/.github/workflows/pull-request.yml`
- `.github/workflows/pull-request.yml`
- `skills/bootstrap/templates/core/package.json.tmpl`
- `package.json`
- Related guidance if it names the checkbox gate or required PR-template
  checkbox behavior, including `AGENTS.md`, template copies, and
  `docs/ac-traceability.md`.

## Verification

- RED baseline: run the current validator against a fixture containing an
  unchecked canonical `⚠️ Test gap:` and record that it fails with the generic
  required-checkbox message.
- RED bypass baseline: run or inspect a fixture that rewrites the same gap as
  prose and record that the current gate lets the prose workaround pass.
- GREEN fixture tests: run `node --test scripts/check-pr-template-checkboxes.test.mjs`
  after the semantic change.
- Template parity: compare each edited root file with its corresponding
  `skills/bootstrap/templates/core/**` source.
- Search check: run `rg 'Required template checkboxes|pr-checkbox|Test gap'`
  across root and template files to confirm stale claims were removed or
  narrowed.
- Markdown lint: run `pnpm lint:md`.
- Workflow lint: if `.github/workflows/pull-request.yml` changes, run
  `pnpm exec actionlint .github/workflows/*.yml` or report if actionlint is
  unavailable.

## Non-Goals

- Do not redesign the PR body top-level sections.
- Do not remove canonical `⚠️ Test gap:` rows.
- Do not make agents check unresolved test-gap boxes just to satisfy CI.
- Do not introduce hidden state, labels, or sidecar files to track readiness.
- Do not change GitHub issue or commit-message conventions.
- Do not configure branch protection in this repository.

## Writing-Skills Pressure-Test Considerations

### RED Baseline Obligation

The first executable evidence must show the present conflict: the existing
checkbox validator fails a PR body that uses the template's canonical unchecked
`⚠️ Test gap:` row for an unresolved validation gap. Without that failing
baseline, the implementation has not proven it is fixing the reported
misleading incentive.

### GREEN Obligation

The green behavior is not "unchecked boxes never fail." The green behavior is
that test gaps keep their honest unresolved representation, unresolved gaps
still block readiness through a gap-specific contract, prose substitutes do
not satisfy the PR body, and genuine operator-action checkboxes keep their
completion semantics.

### Role Ownership

- Planner owns splitting implementation into separate tasks for readiness-gap
  semantics, operator-action checkbox semantics, template wording, and
  template/root parity.
- Executor owns RED/GREEN fixtures for both the current conflict and the prose
  workaround bypass before changing validation behavior.
- Reviewer owns pressure-testing the changed PR-body contract for loopholes,
  including matrix warning without test-gap detail, prose-only gap reporting,
  and stale generic checkbox wording.
- Finisher owns PR-body rendering and publish-state follow-through: an
  unresolved `⚠️ Test gap:` is a blocker until resolved, explicitly deferred,
  or represented by an intentionally still-red required check.

### Stage-Gate Bypass Cases

- A PR body with `⚠️` in the matrix but no matching `⚠️ Test gap:` row must not
  pass readiness.
- A prose-only `Blocking validation gap:` row must not replace the canonical
  test-gap checkbox.
- A checked or deleted test-gap row without replacement evidence must not be
  treated as resolved.
- A generic "required checkbox is unchecked" failure for a test-gap row is not
  enough; the failure must teach that unresolved validation is the blocker.
- Removing the checkbox validator without adding or preserving semantic gap
  readiness is a failed implementation.

### Rationalization Resistance

| Rationalization | Reality |
| --- | --- |
| "Just write `Blocking validation gap:` as prose." | R1 and R3 require canonical unchecked `⚠️ Test gap:` rows for real unresolved validation gaps. |
| "Mark test gaps optional so the gate passes." | Test gaps are unresolved validation, not optional tasks. Optional markers hide the readiness problem. |
| "Keep failing every unchecked checkbox because red CI is safer." | The broad rule caused the dishonest workaround; validation must follow row semantics. |
| "Root script edits are enough." | R8 requires template-first edits and mirrored root files. |
| "A passing checkbox test means readiness." | Readiness also depends on visible unresolved gaps, AC evidence, PR metadata, and publish-state checks. |

### Red Flags

- A canonical `⚠️ Test gap:` row still fails only because it is unchecked.
- A real unresolved test gap is converted to prose, hidden in a summary, or
  marked optional.
- An unchecked `Operator check:` row passes without an explicit optional marker
  or documented deferral.
- Root files and bootstrap templates diverge.
- Stale documentation still says every visible unchecked checkbox is forbidden.

### Token-Efficiency Target

Keep the template instructions short: one comment should explain that test-gap
checkboxes are intentionally unchecked while unresolved, and one comment should
explain which operator-action checkboxes remain enforced. Detailed parser
behavior belongs in tests, not in the PR template.

## Brainstormer Self-Review

- Placeholder scan: no placeholders remain.
- Internal consistency: test gaps stay visible and unresolved; operator
  checkboxes retain completion semantics.
- Scope check: the design is limited to PR checkbox validation behavior,
  shipped templates, mirrored root files, and directly related guidance.
- Ambiguity check: if the executor chooses full validator removal, R7 requires
  stale workflow, script, fixture, package, and guidance cleanup so the result
  is not half-reverted.
