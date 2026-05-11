# Design: PR template should make context, evidence, and testing instructions self-explanatory to reviewers [#90](https://github.com/patinaproject/bootstrap/issues/90)

## Intent

Make the canonical pull request template legible to a first-time
reviewer without forcing them to open the markdown source. Today,
load-bearing guidance — per-bullet rationale and linked context for
`## What changed`, the test-coverage symbol legend, the `AC` column
meaning, and the definition of "evidence" — lives in HTML comments,
invisible to QA, GitHub mobile, and anyone reading the rendered PR
body. QA reading a recent PR could not parse what `AC` and "evidence"
referred to and could not reconstruct what the PR addressed from the
rendered bullets alone.

This design lands the smallest set of rendered prompts and
definitions that close those specific gaps, while leaving the
machine-validated per-AC grammar (`Test gap:`, `Non-blocking gap:`,
`Operator check:`, the colon-style evidence row) intact. #87 already
shipped: the new `⚠️` legend wording, the `<!-- pr-checkbox: optional
-->` marker, the prose-vs-checkbox rule for blocking vs non-blocking
gaps, and the supporting CI script (`scripts/check-pr-template-checkboxes.mjs`)
that depends on those labels. #90 coordinates with #87 by adopting
its legend wording into the rendered body and by leaving its
machine-readable contract untouched.

A larger humanization pass on the per-AC entries (renaming
`Operator check:` to `Confirm by:`, prose-style verification
sentences, dropping `Test gap:` in favor of `Open concerns:`) was
considered and dropped: it requires updating
`scripts/check-pr-template-checkboxes.mjs` and
`docs/ac-traceability.md` to match, which expands scope past
"rendered-body legibility" into a contract migration. If reviewer
demand persists after this PR lands, it can be reopened as a
separate issue with explicit contract-migration scope.

## Approved Revision: Merge AC Coverage And Add Testing Steps

Post-publication reviewer feedback from Hillary changed the chosen
shape: the issue should perform the contract migration now. The
separate `## Acceptance criteria` section is retired from the PR
template. Its per-AC content moves into `## Test coverage`, where
each `### AC-<issue>-<n>` subsection contains only tester-useful
coverage information: what was validated, where it ran, evidence,
known gaps or caveats, and whether manual testing is still needed.
No checkboxes are allowed in `## Test coverage`.

A new top-level `## Testing steps` section carries human tester
actions as checkboxes. The template should encourage authors to add
steps that cover any `❌` or `⚠️` coverage gaps when a human can
close or evaluate the gap. This revision intentionally updates the
PR-readiness validator, fixtures, `docs/ac-traceability.md`, and
agent PR-body guidance so the new rendered contract is enforceable.

Supersession note: any earlier or later wording in this artifact that
describes `Test gap:`, `Non-blocking gap:`, or `Operator check:` rows
as preserved, keeps manual testing under `## Acceptance criteria`, or
treats validator/docs/fixture updates as out of scope is historical
context from the pre-Hillary design and is superseded by this approved
revision.

## Requirements

- R1: The `## What changed` section forces linked prior context
  (prior PR, prior QA pass, follow-up issue) and per-bullet
  rationale into the rendered body via the rendered template
  *structure*, not via rendered instructive prose. Concretely: a
  rendered `Context:` line the author replaces with the actual
  context (or `Context: standalone — <reason>` when there is none)
  and a rendered bullet shape that pairs the change with its
  rationale (e.g. `- <change> — <why>`). Detailed *instructions* —
  what counts as "context", how to phrase rationale — remain in
  HTML comments per PR-template convention. The rendered body's
  job is to show *filled output*, not to lecture authors.
- R2: The `## Test coverage` section renders a visible legend
  defining `✅`, `❌`, `⚠️`, `➖` using the wording #87 already
  shipped: `✅` = required validation passed with no known relevant
  gap; `⚠️` = validation exists and is sufficient to merge with a
  known non-blocking gap documented under the AC; `❌` = required
  validation is missing, failing, pending, or merge-blocked; `➖` =
  not relevant to this AC. The legend lives in the rendered body,
  not in a comment.
- R3: The `## Test coverage` section renders a one-line
  clarification of the `AC` column ("`AC` references the
  acceptance-criteria IDs from the linked issue, in
  `AC-<issue>-<n>` form"), so a non-author reviewer can interpret
  the column without prior context from `docs/ac-traceability.md`.
- R4: The `## Acceptance criteria` section opens with two short
  rendered lines that close the two specific gaps QA reported:
  what an evidence row attests to, and where reviewers find
  manual-test steps. Example wording (Planner picks final copy):
  "Evidence rows take the form `<Platform> test: <command>,
  <environment>[, <verifier>]` — verifier is who or what proves
  the test ran. Reviewers and QA exercising the change manually
  follow the `Operator check:` rows under each AC." The
  orientation does not enumerate AC structure (outcome,
  checkboxes) that is already visible from the section's headings
  and bullets, and does not retire the canonical grammar
  `docs/ac-traceability.md` and the CI script depend on, and does
  not invent a parallel top-level section.
- R5: The change does not retire or rename the existing
  machine-validated per-AC grammar (`Test gap:`,
  `Non-blocking gap:`, `Operator check:`, the colon-style evidence
  row, the `<!-- pr-checkbox: optional -->` marker). Retiring those
  labels would require migrating
  `scripts/check-pr-template-checkboxes.mjs` and
  `docs/ac-traceability.md`, which is out of scope for "make the
  rendered body legible". A future issue may revisit the labels
  with explicit contract-migration scope.
- R6: The rendered template body must not bake
  product-surface-specific build-acquisition language for any
  surface (mobile, web, CLI, library, infra) into the new
  rendered prompts. Repo-specific examples live in HTML comments
  as illustrative hints; the rendered body stays
  product-surface-agnostic.
- R7: The template body's added rendered prose stays under a
  token-efficiency budget. Target: the diff against the current
  template adds no more than roughly 15 rendered lines (excluding
  HTML comments) across R1–R4. Calibration: R1 ≈ 1 line plus a
  bullet-shape change, R2 ≈ 4–6 lines (one per symbol or compact
  list), R3 ≈ 1 line, R4 ≈ 2–3 lines. Each individual rendered
  prompt is one to three lines.
- R8: Root `.github/pull_request_template.md` remains
  byte-identical to the bootstrap template source at
  `skills/bootstrap/templates/core/.github/pull_request_template.md`.
  The edit lands in the template first; the root file is mirrored
  via the bootstrap skill in realignment mode in the same PR.
- R9: PR authors and Superteam `Finisher` own filling the rendered
  context placeholder under `## What changed` and choosing matrix
  cells against the rendered legend. `Reviewer` and `Finisher` own
  flagging missing or placeholder values before publish-state
  readiness — including unfilled `Context:` lines, bullets without
  rationale, and matrix cells that contradict the rendered legend.
  Per-AC content (evidence rows, `Test gap:`, `Operator check:`)
  remains owned per the existing PR-template grammar.
- R10: The approved Hillary-feedback revision supersedes R4/R5/R9
  where they point reviewers at `Operator check:` rows under
  `## Acceptance criteria`. Per-AC coverage now lives under
  `## Test coverage` with no checkboxes, and human tester actions
  live under `## Testing steps` as checkboxes.

## Non-Goals

- Do not redesign the test-coverage matrix schema, the AC ID
  grammar, or the issue-side Given/When/Then convention.
- Do not adopt QA's literal section names (`Summary`, `Verification`,
  `QA findings → AC mapping`, `AC platform coverage`,
  `Testing instructions`).
- Do not add a top-level `## How to verify` (or any equivalent
  name) to the canonical template. Reviewer-facing manual exercise
  instructions stay in `Operator check:` rows under each AC, where
  the existing CI gate already validates them.
- Do not retire or rename `Test gap:`, `Non-blocking gap:`,
  `Operator check:`, or the colon-style evidence row. #87 just
  shipped CI validation against those exact labels; renaming
  requires a contract migration that is out of scope for this
  issue.
- Do not update `scripts/check-pr-template-checkboxes.mjs` or
  `docs/ac-traceability.md` beyond what the rendered prompts
  require for self-consistency (e.g. if a rendered prompt
  paraphrases the colon-grammar, ac-traceability.md must not
  contradict the paraphrase).
- Do not bake mobile/web/CLI/library/infra-specific
  build-acquisition copy into the canonical template body.
- Do not duplicate `docs/ac-traceability.md` content inside the PR
  body.
- Do not adopt "QA findings → AC mapping" as a canonical section.

## Acceptance Criteria

- AC-90-1: Given an author opens the PR template, when they fill
  the `## What changed` section, then the rendered template
  structure (a `Context:` line and a bullet shape that pairs each
  change with a rationale) forces linked prior context and
  per-bullet rationale into the rendered body. Detailed
  how-to-phrase instructions may stay in HTML comments per template
  convention; the *output* in the rendered body must show context
  and rationale, not lingering template prose.
- AC-90-2: Given a reviewer opens a rendered PR body, when they
  read the `## Test coverage` matrix, then the symbol legend
  (`✅ ❌ ⚠️ ➖`) and the meaning of the `AC` column are visible
  in the rendered body without opening the markdown source.
- AC-90-3: Given a reviewer opens a rendered PR body, when they
  read the `## Acceptance criteria` section, then the rendered
  body answers the two questions QA could not answer from the
  previous template — what evidence rows attest to (verifier,
  environment, command/workflow job/tool/harness) and where to
  find manual-test instructions — by rendering a brief
  orientation that points at the canonical colon-style evidence
  row format and at `Operator check:` rows for manual exercise
  steps.
- AC-90-4: Given the canonical template under
  `skills/bootstrap/templates/core/.github/pull_request_template.md`
  changes, when the bootstrap skill runs in realignment mode
  against this repo, then the root
  `.github/pull_request_template.md` matches the template
  byte-for-byte (round-trip parity).

## Implementation Shape

1. Edit `skills/bootstrap/templates/core/.github/pull_request_template.md`:
   - Restructure `## What changed` so the rendered template carries
     a `Context:` line and a bullet shape that pairs change with
     rationale (e.g. `- <change> — <why>`). Keep detailed
     instructions in HTML comments per template convention (R1,
     AC-90-1).
   - Add a rendered legend block under `## Test coverage` defining
     the four symbols using the #87-shipped wording (R2, AC-90-2).
   - Add a one-line rendered clarification of the `AC` column in
     `## Test coverage` (R3, AC-90-2).
   - Add a one-line rendered orientation under
     `## Acceptance criteria` naming the per-AC content and
     pointing at the canonical colon-style evidence row format
     (R4, AC-90-3).
   - Leave `Test gap:`, `Non-blocking gap:`, `Operator check:`,
     the colon-style evidence row, and the
     `<!-- pr-checkbox: optional -->` marker untouched (R5).
   - Keep the rendered additions within the R7 token-efficiency
     budget.
2. Run the bootstrap skill in realignment mode against this repo,
   accept the proposed root diff, and commit the template change
   and the mirrored root change together (R8, AC-90-4).
3. Sanity-check `docs/ac-traceability.md` for consistency with the
   new rendered orientation; update only if a direct contradiction
   exists. The colon-grammar reference must remain canonical.

## Verification

- RED-phase baseline (record before the template change lands):
  - Confirm the current rendered template body (HTML comments
    stripped) does not contain the four symbol meanings, the `AC`
    column meaning, an orientation for the AC section, or a
    `Context:` line under `## What changed`. Capture this as the
    failing baseline so the rendered fix is observable.
  - Confirm the root and template files are already byte-identical
    (`cmp -s`) so any later drift is attributable to the change.
- GREEN-phase rendered checks after the change. Each
  rendered-visibility check first strips HTML comment blocks so
  the assertion is "this string appears in the rendered body",
  not "this string appears anywhere in the file" — because the
  existing template already mentions these strings inside HTML
  comments and the failure mode this issue fixes is comment-only
  guidance. Use a portable strip such as:
  `sed -e '/<!--/,/-->/d'`.
  - `cmp -s skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md`
    exits 0.
  - `sed -e '/<!--/,/-->/d' .github/pull_request_template.md | grep -F 'Context:'`
    matches at least once.
  - `sed -e '/<!--/,/-->/d' .github/pull_request_template.md | grep -F '✅'`
    matches at least once. Naive per-symbol greps are insufficient
    for `⚠️` and `➖` because the existing `⚠️ Test gap:` row and
    the existing `➖` matrix-cell placeholders already match them
    today; instead, anchor on a phrase the Planner introduces with
    the legend, e.g.:
    `sed -e '/<!--/,/-->/d' .github/pull_request_template.md | grep -F 'required validation passed'`
    matches the rendered legend's `✅` clause at least once
    (analogous unique-phrase checks for the `❌`, `⚠️`, and `➖`
    clauses, keyed off whatever exact wording the Planner adopts
    from #87 — e.g. `non-blocking gap documented` for `⚠️`,
    `merge-blocked` or `merge-blocking` for `❌`, `not relevant`
    for `➖`).
  - `sed -e '/<!--/,/-->/d' .github/pull_request_template.md | grep -F 'acceptance-criteria IDs'`
    matches the rendered `AC` column clarification at least once
    (a phrase chosen to be unique to the new clarification line so
    the check does not pass on the existing `AC-<issue>-<n>`
    matrix placeholder).
  - `sed -e '/<!--/,/-->/d' .github/pull_request_template.md | grep -F 'evidence'`
    matches the rendered AC-section orientation at least once.
- Machine-validation regression check: run
  `node scripts/check-pr-template-checkboxes.mjs` (or its npm
  alias if one exists) against a fixture PR body that uses the
  new template; the script must still parse `Test gap:`,
  `Non-blocking gap:`, and `Operator check:` rows correctly. The
  existing fixtures under `scripts/fixtures/pr-template-checkboxes/`
  must still pass without modification.
- Token-efficiency check: `git diff --stat` against the previous
  template shows the rendered additions stay within the R7 budget
  (≈15 rendered lines).
- Pressure test: open a sample PR body that uses the new template
  and verify a reader who has never opened
  `docs/ac-traceability.md` can answer (a) what the four symbols
  mean, (b) what the `AC` column references, and (c) what an
  evidence row attests to.

## Loophole Closure

The new rendered prompts introduce one new author/reviewer
discipline (the structural `Context:` placeholder and bullet
shape). The rest of the change is purely rendering existing
HTML-comment content, so loophole exposure is small. Closures:

- Forbid moving the new rendered prompts back into HTML comments.
  HTML-comment-only guidance is exactly the failure mode this
  design fixes.
- Forbid retiring `Test gap:`, `Non-blocking gap:`,
  `Operator check:`, or the colon-style evidence row in this PR.
  Such a retirement is a contract migration and belongs in a
  separate issue with explicit scope including
  `scripts/check-pr-template-checkboxes.mjs` and
  `docs/ac-traceability.md` updates.
- Forbid adding a top-level `## How to verify` section, or any
  equivalent name (`Testing instructions`, `Verification`,
  `Manual test plan`). Reviewer-facing manual instructions live
  per-AC in `Operator check:` rows where the CI gate already
  validates them.
- Forbid baking repo-specific build-acquisition copy (native
  build location, web build URL, CLI install command, library
  import snippet, infra dry-run command) into the rendered
  template body. Such hints belong in HTML comments as
  illustrative examples; the rendered body must remain
  product-surface-agnostic.
- Forbid editing only the root
  `.github/pull_request_template.md`. Every change must land in
  the bootstrap template source first and round-trip to root in
  the same PR.

## Rationalization Resistance

| Excuse | Reality |
|--------|---------|
| "The HTML comment already explains it; rendering is noise." | HTML comments are invisible to QA, GitHub mobile, and screenshot reviewers. The whole point of #90 is that comment-only guidance failed in production. |
| "I'll keep the legend in the comment because the symbols are obvious." | They were not obvious; QA literally asked what `AC` and `evidence` meant. Render the legend. |
| "While we're touching the AC section, let's rename `Operator check:` to `Confirm by:` for legibility." | Rename is a contract migration. #87 just shipped CI validation against `Operator check:`; renaming requires updating `scripts/check-pr-template-checkboxes.mjs`, `docs/ac-traceability.md`, every fixture under `scripts/fixtures/pr-template-checkboxes/`, and every consuming repo's open PRs. That belongs in its own issue. |
| "Let's at least drop the colon-grammar evidence row in favor of prose." | Same blocker — `docs/ac-traceability.md` and the CI script depend on the colon-grammar. R5 explicitly forbids retirement in this PR. |
| "I'll just add a top-level `## How to verify` because reviewers ask for it." | A top-level recipe duplicates per-AC `Operator check:` rows the CI gate already validates. The orientation line under `## Acceptance criteria` (R4) tells the reader to look at `Operator check:` rows for manual exercise instructions; that is the answer to QA's "how do I test?" question without inventing a parallel section. |
| "I'll just put the iOS / TestFlight / Vercel preview steps in the canonical template." | Repo-specific build-acquisition copy is a non-goal. Put it in the consuming repo's `Operator check:` rows, not the bootstrap template. |
| "I'll edit the root template directly and round-trip later." | Round-trip discipline exists because every bootstrapped repo regresses on the next realignment otherwise. Template-first, mirror in the same PR. |
| "QA asked for a `Verification` section; I'll add one with that exact name." | Adopt the underlying need, not the literal section name. Rendering the legend, the `AC` column meaning, and the evidence-row orientation answers QA's parsing problem without inventing a competing section. |
| "Per-bullet rationale will balloon `What changed`." | One rendered structural placeholder (`Context:` plus `— <why>` in the bullet shape) does not balloon anything. The R7 budget keeps rendered additions under ~15 lines combined. |
| "Author guidance should be rendered too so authors don't ignore it." | PR-template convention puts author instructions in HTML comments. The QA failure mode was about *what the author wrote*, not about a missing visible prompt. The fix is rendered structural placeholders the author *replaces* (`Context:` line, `— <why>` bullets), not rendered prose the reviewer must skim past on every PR. |

## Red Flags — STOP and reconsider

- You are about to land a PR-template change as `docs:` or
  `chore:`. The template is a product-surface glob (path-first
  rule, AGENTS.md). Use `feat:` or `fix:`.
- You are about to put the new author prompt, legend, AC column
  clarification, or AC-section orientation inside `<!-- ... -->`.
  That is the failure mode this design fixes.
- You are renaming `Operator check:`, `Test gap:`, or
  `Non-blocking gap:`, or retiring the colon-style evidence row.
  Stop. R5 explicitly forbids this in #90; reopen as a separate
  contract-migration issue if the demand is real.
- You are adding a top-level `## How to verify`, `## Verification`,
  `## Testing instructions`, or `## Manual test plan` section.
  Stop. The orientation line under `## Acceptance criteria`
  points readers at `Operator check:` rows, which is where the
  reviewer-facing manual instructions live.
- You are editing only `.github/pull_request_template.md` and
  leaving `skills/bootstrap/templates/core/.github/pull_request_template.md`
  untouched. Stop. Edit the template first, then mirror.
- You are baking iOS/TestFlight/Vercel/`npm install`/`pip install`/
  `terraform plan` copy into the rendered body. Stop. That copy
  is repo-specific; the canonical template stays
  product-surface-agnostic.
- The diff adds substantially more than the R7 budget of rendered
  lines. Stop. The fix is meant to be the smallest rendered
  prompts that make the body legible, not a rewrite.

## Token-Efficiency Targets

- Rendered additions across R1–R4 combined: ~15 lines or fewer in
  the rendered body (HTML comments excluded). Calibration: R1 ≈ 1
  line plus a bullet-shape change, R2 ≈ 4–6 lines, R3 ≈ 1 line,
  R4 ≈ 2–3 lines. Each individual rendered prompt is one to three
  lines.
- HTML-comment additions are bounded — comments may carry
  illustrative hints but must not balloon to replace contributor
  docs.
- The rendered template, opened on GitHub web at default zoom,
  should remain scannable in roughly one screen above
  `## Acceptance criteria`, matching the current template's
  scan-density.

## Role Ownership

- PR authors and Superteam `Finisher` own filling the rendered
  context placeholder under `## What changed` and choosing matrix
  cells against the rendered legend.
- `Reviewer` and `Finisher` own flagging missing or placeholder
  values in the new rendered prompts before publish-state
  readiness — unfilled `Context:` lines, bullets without
  rationale, and matrix cells that contradict the rendered
  legend. Per-AC content (evidence rows, `Test gap:`,
  `Operator check:`) remains owned per the existing CI-validated
  PR-template grammar.
- `Brainstormer` (this artifact) owns the rendered prompts and
  the loophole-closure language; later issues that refine the
  prompts must preserve the loophole-closure invariants in this
  design.

## Stage-Gate Bypass Resistance

- "We can land the template edit without round-tripping" —
  bypassed by R8 plus the AGENTS.md round-trip discipline; the
  PR must include both the template change and the root mirror.
- "We can keep the new prompts in HTML comments to avoid breaking
  consumers" — bypassed by R1, R2, R3, R4, which require rendered
  visibility; HTML-comment-only versions of these prompts do not
  satisfy the ACs.
- "We can rename `Operator check:` while we're here" — bypassed
  by R5, the loophole closure, and the red-flag list.
- "We can drop AC-90-4 because round-trip is implied" — bypassed
  by R8 and the explicit AC-90-4 verifier; round-trip is part of
  every template change on this repo and must be observable in
  the PR.

## Cross-Reference

- `docs/ac-traceability.md`: AC-ID convention, Given/When/Then
  phrasing for issue-side ACs, and the canonical PR-body grammar
  including the colon-style evidence row.
- `.github/pull_request_template.md`: current canonical template
  (will be mirrored from the bootstrap template source after this
  design's plan and implementation land).
- `skills/bootstrap/templates/core/.github/pull_request_template.md`:
  source of truth for the canonical template.
- `scripts/check-pr-template-checkboxes.mjs`: machine-validates
  `Test gap:`, `Non-blocking gap:`, `Operator check:`, and the
  `<!-- pr-checkbox: optional -->` marker. Untouched by #90.
- Issue #87: `⚠️` semantics. Already merged; #90 adopts its
  legend wording into the rendered body.
- AGENTS.md: path-first commit-type rule (template change is a
  product-surface glob and ships as `feat:`).
