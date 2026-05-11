# Design: Clarify non-blocking warning semantics in PR coverage matrix [#87](https://github.com/patinaproject/bootstrap/issues/87)

## Intent

Clarify the PR template's coverage-matrix symbol contract so `⚠️` means
"validation exists and the remaining gap is known, documented, and non-blocking"
instead of "the PR is blocked until this unchecked gap row is resolved." This
keeps reviewer attention visible without turning accepted coverage caveats into
merge gates.

## Requirements

- R1: The `## Test coverage` legend defines `✅` as required validation passed
  with no known relevant gap for the AC and column.
- R2: The legend defines `⚠️` as validation that exists and is sufficient to
  merge, while a known non-blocking coverage gap remains.
- R3: The legend defines `❌` as required validation missing, failing, pending,
  or blocked by a gap that must be resolved before merge.
- R4: The legend keeps `➖` for verification types that are not relevant to the
  AC.
- R5: The template instructions state that a `⚠️` matrix cell must be explained
  under the matching AC, but that explanation must not be a required unchecked
  merge gate solely because the gap exists.
- R6: The template gives authors an explicit non-blocking gap form: prose or an
  explicitly optional checkbox using the existing `pr-checkbox: optional`
  marker.
- R7: Blocking gaps, failing validation, and pending required validation still
  use required unchecked checklist rows when operator action or conscious
  pre-merge resolution is required.
- R8: `docs/ac-traceability.md` stays aligned with the canonical PR-template
  grammar without duplicating the full template instructions.
- R9: Because `.github/pull_request_template.md` is a bootstrapped baseline
  file, edits are made in `skills/bootstrap/templates/core/.github/pull_request_template.md`
  first and mirrored to the root template in the same change.
- R10: The required-template-checkbox checker continues to treat unmarked
  visible unchecked checkboxes as required and explicitly optional checkboxes as
  non-blocking.
- R11: The template removes the stale reverse mapping that says every
  `⚠️ Test gap:` row must have a corresponding `⚠️` matrix cell. Required
  unchecked gap rows for blocking, failing, or pending validation map to `❌`;
  non-blocking `⚠️` cells map only to prose or explicitly optional gap notes.
- R12: The plan must preserve the observed RED pressure result before
  implementation: a fresh agent using the current template chose `✅` for a
  known non-blocking Safari gap, hiding the warning in prose instead of using a
  visible `⚠️` table state.

## Acceptance Criteria

- AC-87-1: Given an author reads the PR template coverage legend, when
  validation exists but a known non-blocking gap remains, then the legend tells
  the author to use `⚠️` rather than `✅` or `❌`.
- AC-87-2: Given an author reads the PR template coverage legend, when required
  validation is missing, failing, pending, or blocked by a merge-blocking gap,
  then the legend tells the author to use `❌`.
- AC-87-3: Given an author marks a coverage matrix cell with `⚠️`, when they
  fill the corresponding acceptance-criteria section, then the template tells
  them to document the non-blocking gap without creating a required unchecked
  merge gate.
- AC-87-4: Given a PR body includes an optional or prose non-blocking gap
  explanation, when the required-template-checkbox check runs, then the
  non-blocking gap does not block merge solely because it exists.

## Proposed Shape

Update the matrix legend from the current issue-83 wording:

```markdown
✅ = required validation passed, with no blocking gap for this column
❌ = tests that should exist are missing
⚠️ = required validation has an acknowledged gap, warning, unresolved
     concern, or failing/pending state that needs reviewer attention
➖ = not relevant to this AC
```

to wording that separates merge-blocking and non-blocking states:

```markdown
✅ = required validation passed, with no known relevant gap for this column
⚠️ = validation exists and is sufficient to merge, with a known non-blocking
     gap documented under this AC
❌ = required validation is missing, failing, pending, or blocked by a
     merge-blocking gap
➖ = not relevant to this AC
```

Then update the AC guidance so a `⚠️` cell maps to either:

- a short prose note such as `Non-blocking gap: Safari persistence was not
  verified; accepted because this PR changes only Chrome-specific behavior.`
- an explicitly optional checkbox when a maintainer wants visible review
  acknowledgement:

```markdown
<!-- pr-checkbox: optional -->
- [ ] ⚠️ Non-blocking gap: Safari persistence was not verified.
```

Required unchecked gap rows remain available for merge-blocking validation
concerns, but those rows map to `❌`, not `⚠️`. The template must stop saying
every matrix `⚠️` requires a required unchecked `⚠️ Test gap:` checkbox, and it
must stop saying every `⚠️ Test gap:` row maps back to a `⚠️` matrix cell.

## RED Baseline

Current behavior after issue #83 makes `⚠️` carry too many meanings:
acknowledged gap, warning, unresolved concern, failing state, and pending state.
The template also says every matrix `⚠️` must have corresponding `⚠️ Test gap:`
checkboxes. Because unmarked visible checkboxes are required by default, an
author who honestly marks a non-blocking caveat with `⚠️` can accidentally make
the PR look blocked.

Observed pressure scenario:

```markdown
| AC | Title | Unit | Browser |
| --- | --- | --- | --- |
| AC-87-1 | Saves settings | ✅ | ⚠️ |

### AC-87-1

Settings save behavior is covered in Chrome. Safari was not verified and is
accepted as non-blocking for this PR.

- Browser test: Chrome smoke test, local
- Non-blocking gap: Safari settings persistence was not verified.
```

Fresh-agent RED result, recorded before implementation:

- Prompt: using the current template, choose the Browser matrix symbol and
  per-AC detail when Chrome validation exists, Safari was not verified, and the
  maintainer says the Safari gap is explicitly non-blocking.
- Result: the agent chose `✅` and put the Safari caveat in prose because the
  current legend says `✅` means required validation passed "with no blocking
  gap" and `⚠️` requires matching `⚠️ Test gap:` checkboxes.
- Failure: a known relevant non-blocking gap disappeared from the matrix, so
  reviewers scanning the table would see a full pass instead of a visible
  warning.

## GREEN Target

After the change, authors can express four distinct states:

| Cell | Meaning | Per-AC detail |
| --- | --- | --- |
| `✅` | validation passed, no known relevant gap | optional evidence only |
| `⚠️` | enough validation to merge, known non-blocking gap | prose or optional checkbox |
| `❌` | missing, failing, pending, or merge-blocking validation | required gap/operator row when action is needed |
| `➖` | not relevant | no mapped detail required |

The required-template-checkbox checker remains simple: it does not infer
semantic blocking state from emoji. It only enforces visible unchecked
checkboxes unless they are explicitly marked optional. The PR template owns the
authoring guidance that keeps non-blocking gaps out of required checkbox form.

## Rationalization Resistance

| Rationalization | Reality |
| --- | --- |
| "Any gap means `❌`." | `❌` is for missing, failing, pending, or merge-blocking validation. Non-blocking documented gaps use `⚠️`. |
| "`⚠️` is still a warning, so it must be a required checkbox." | Warning visibility and merge blocking are separate. Use prose or an explicitly optional checkbox for non-blocking gaps. |
| "A `✅` plus a prose caveat is good enough." | `✅` means no known relevant gap. If a relevant non-blocking gap exists, the matrix cell should be `⚠️`. |
| "The checkbox checker should detect emoji semantics." | The checker enforces checkbox syntax only. The template tells authors which form to use. |
| "Pending CI can be `⚠️` because it needs attention." | Pending required validation is not enough to merge; use `❌` until it passes or is explicitly accepted as non-blocking by the project. |
| "A required `⚠️ Test gap:` row must map to `⚠️` because the label says warning." | Required unchecked gap rows are merge-blocking by form and must map to `❌`; `⚠️` is reserved for non-blocking documented gaps. |

## Red Flags

- `⚠️` still described as failing, pending, unresolved, or otherwise
  merge-blocking.
- Any instruction saying every `⚠️` cell must have a required unchecked
  `⚠️ Test gap:` checkbox.
- Any instruction saying every required `⚠️ Test gap:` checkbox maps back to a
  `⚠️` cell.
- `✅` allowed when a known relevant non-blocking gap remains.
- `❌` narrowed only to missing tests while failing or pending required
  validation loses a clear symbol.
- Optional checkbox examples missing the `pr-checkbox: optional` marker.
- Root `.github/pull_request_template.md` changed without the matching
  template-source edit.
- `docs/ac-traceability.md` left pointing only at required gap checkboxes.

## Implementation Notes

- Update `skills/bootstrap/templates/core/.github/pull_request_template.md`
  first, then mirror `.github/pull_request_template.md`.
- Update `docs/ac-traceability.md` only enough to mention non-blocking gap prose
  or optional checkbox explanations as part of the canonical PR-template grammar.
- Add or adjust checker tests only if the optional-checkbox behavior needs a
  direct regression fixture for the new non-blocking gap example. The checker
  already supports `pr-checkbox: optional`, so the main behavior change may be
  template-only.
- Verify no stale issue-83 wording remains with targeted `rg` checks for
  the literal text `Every ⚠️ matrix cell`, `failing/pending state`, and
  `one or more corresponding`.
- Verify no stale reverse-mapping wording remains with a targeted `rg` check
  for the literal text `Every ⚠️ Test gap:` and
  `corresponding.*⚠️.*matrix`.

## Self-Review

- Placeholder scan: no placeholders remain.
- Internal consistency: `⚠️` is non-blocking, `❌` is blocking/missing/failing,
  and `✅` excludes known relevant gaps.
- Scope check: focused on PR-template grammar and its one summary doc.
- Ambiguity check: optional checkbox versus required checkbox behavior is
  explicit, reverse mapping is assigned to `❌` for blocking gaps, and checker
  responsibility is separated from template guidance.
