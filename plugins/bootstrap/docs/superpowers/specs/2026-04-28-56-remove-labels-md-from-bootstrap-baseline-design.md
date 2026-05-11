# Design: Remove LABELS.md from bootstrap baseline and rely on `gh label list` instead [#56](https://github.com/patinaproject/bootstrap/issues/56)

## Problem

The bootstrap baseline currently treats `.github/LABELS.md` as a source of truth
for the label inventory in target repositories. Three facts make that position
incoherent today:

1. **There is no template.** `skills/bootstrap/templates/**` does not contain a
   `LABELS.md` file. The bootstrap skill never emits one; it only audits target
   repos for its presence (`skills/bootstrap/audit-checklist.md:41`).
2. **The runtime authority is already `gh label list`.** `skills/bootstrap/SKILL.md:161`
   and the `using-github` skill both direct contributors at `gh label list` for
   the live inventory. `AGENTS.md:102` redundantly names `LABELS.md` as the
   source of truth in the same paragraph that points at the gh command.
3. **AGENTS.md falsely claims a round-trip.** `AGENTS.md:27` lists
   `.github/LABELS.md` under "Covered files (any change here must round-trip
   through a template edit)" – but no template exists for it. Any agent who
   takes that line at face value cannot complete the loop.

Concrete drift in this very repo: `.github/ISSUE_TEMPLATE/bug_report.md:8` and
`.github/ISSUE_TEMPLATE/feature_request.md:8` carry comments that point at
`LABELS.md`, while their corresponding templates under
`skills/bootstrap/templates/core/.github/ISSUE_TEMPLATE/` carry no such
reference. The root files are already out of sync with the baseline they claim
to descend from.

A maintained `LABELS.md` would also duplicate metadata GitHub already serves
authoritatively – name, color, description – and the duplication is exactly
where drift lives. The fix is to delete the document, the audit row, and the
prose that names it, and to keep `gh label list` as the single live source.

## Proposal

Delete the file and every reference to it across the bootstrap surface and the
repo root. Touch only the surfaces listed below; do not retroactively edit the
historical artifacts under `docs/superpowers/specs/` or
`docs/superpowers/plans/`.

### Bootstrap skill surfaces (templates + skill body)

- `skills/bootstrap/audit-checklist.md:41`: remove the `.github/LABELS.md` row
  in full. The row currently asserts a `## Labels` heading, an alphabetised
  table, and an agent-plugin-only `### Release-please (tool-managed)` subsection
  naming `autorelease: pending` and `autorelease: tagged`. Removing the row
  removes all of those obligations from realignment runs.
- `skills/bootstrap/SKILL.md:161`: keep the `gh label list` direction; replace
  any phrase that frames `LABELS.md` as authoritative or as the place to "add"
  a label. The current line already favours `gh label list`; verify no
  collateral mention of `LABELS.md` was missed in the surrounding bullets.
- `skills/bootstrap/templates/**`: confirm by `grep -r "LABELS"` that the
  template tree contains no references; this is already the case at the time of
  writing and must remain so after the change.

### Repo-root contract surfaces (AGENTS.md, CLAUDE.md, READMEs)

- `AGENTS.md:27`: drop the `.github/LABELS.md` bullet from the "Covered files"
  list. That list is the round-trip contract; an entry with no template is a
  contradiction.
- `AGENTS.md:100-108` ("Issue and PR labels"): rewrite the paragraph so
  `gh label list` is the only named source of truth. The verification snippet
  (`gh label list --json name,description --jq ...`) stays. Add a sentence that
  says new labels are created with `gh label create` (or the GitHub UI) against
  the live repo, not by editing a tracked Markdown file.

### Repo-root issue templates (drift cleanup)

- `.github/ISSUE_TEMPLATE/bug_report.md:8` and
  `.github/ISSUE_TEMPLATE/feature_request.md:8`: remove the trailing
  `Labels: see .github/LABELS.md.` clause from the HTML comment. The templated
  versions under `skills/bootstrap/templates/core/.github/ISSUE_TEMPLATE/` do
  not contain that clause, so this edit closes drift rather than introducing
  it. No template edit is required for this surface.

### File deletion

- Delete `.github/LABELS.md` from this repo. Do not replace it with a redirect
  stub or a "moved" note; an empty file or stub is itself a drift hazard.

### Out-of-scope rows that stay

- The `autorelease: pending` and `autorelease: tagged` reservation in
  `AGENTS.md` ("Issue and PR labels" section, last paragraph) stays exactly as
  written – that is a release-please contract, not a `LABELS.md` artifact.
- The `gh label list` verification snippet stays.
- Historical specs and plans under `docs/superpowers/specs/` and
  `docs/superpowers/plans/` that mention `LABELS.md` are immutable artifacts of
  prior work and must not be edited.

## Acceptance Criteria

### AC-56-1

`.github/LABELS.md` is absent from the repository.

Given the worktree at HEAD after this change merges,
when an agent runs `test ! -e .github/LABELS.md`,
then the command exits 0.

### AC-56-2

The bootstrap audit no longer requires `.github/LABELS.md` in target repos.

Given `skills/bootstrap/audit-checklist.md` at HEAD,
when an agent runs `grep -n 'LABELS.md' skills/bootstrap/audit-checklist.md`,
then the command exits non-zero with no matching lines.

### AC-56-3

`AGENTS.md` no longer lists `LABELS.md` in the round-trip-covered-files list
and no longer treats it as the source of truth for labels.

Given `AGENTS.md` at HEAD,
when an agent runs `grep -n 'LABELS.md' AGENTS.md`,
then the command exits non-zero with no matching lines.

### AC-56-4

`AGENTS.md` keeps `gh label list` as the named runtime authority and keeps
the `gh label list --json name,description` verification snippet.

Given `AGENTS.md` at HEAD,
when an agent reads the "Issue and PR labels" section,
then the section names `gh label list` as the source of truth and contains the
existing `gh label list --json name,description --jq '.[] | select(.description == "")'`
verification command.

### AC-56-5

Issue templates at the repo root no longer reference `LABELS.md`.

Given `.github/ISSUE_TEMPLATE/bug_report.md` and
`.github/ISSUE_TEMPLATE/feature_request.md` at HEAD,
when an agent runs `grep -n 'LABELS.md' .github/ISSUE_TEMPLATE/*.md`,
then the command exits non-zero with no matching lines.

### AC-56-6

The bootstrap skill body and template tree contain no `LABELS.md` references.

Given `skills/bootstrap/` at HEAD,
when an agent runs `grep -rn 'LABELS.md' skills/bootstrap/`,
then the command exits non-zero with no matching lines.

### AC-56-7

The release-please reservation for `autorelease: pending` and
`autorelease: tagged` in `AGENTS.md` is preserved verbatim.

Given `AGENTS.md` at HEAD,
when an agent searches for the existing release-please paragraph naming both
labels and the rule that PR-title lint is intentionally skipped while
`autorelease: pending` is present,
then the paragraph is present and unchanged from main.

### AC-56-8

Historical Superpowers artifacts are untouched.

Given `git diff main...HEAD -- docs/superpowers/specs docs/superpowers/plans`,
when run after the implementation commits land,
then no pre-existing files under those paths appear in the diff (the only
addition is the design and plan docs for this very issue).

## Out of Scope

- The `autorelease: pending` / `autorelease: tagged` reservation rules in
  `AGENTS.md` and the audit-checklist rows that check release-please's
  generated artifacts. Release-please owns those labels and the rules around
  them; this change does not touch them.
- `gh label list` itself remains the runtime source of truth. This issue is
  about removing the redundant tracked-file claim on top of it, not changing
  the runtime authority.
- Historical artifacts under `docs/superpowers/specs/` and
  `docs/superpowers/plans/` are not edited even when they mention `LABELS.md`.
  Those are point-in-time records.
- No new mechanism for codifying labels in code (e.g. a YAML labels file or a
  sync script). If a future need arises, it is a separate design.
- No changes to the `using-github` skill; it already depends on `gh label list`.

## Workflow-contract pressure tests

Each surface below names the rationalisation an agent could use to walk this
change back, and the spec wording that forecloses the rationalisation. Use
these as the red-flag list when reviewing implementation PRs.

### Surface: `skills/bootstrap/audit-checklist.md` row removal

- **Rationalisation:** "Auditing for a tracked label inventory is harmless
  defence-in-depth; let's keep the row but soften it to optional."
- **Foreclosure:** the Problem section names the contradiction (no template
  exists; `gh label list` is already authoritative). An audit row that the
  bootstrap skill cannot itself satisfy in a fresh scaffold is a self-inflicted
  realignment-gap and must be deleted, not softened.
- **Rationalisation:** "We can keep the row but only require the
  release-please subsection."
- **Foreclosure:** the release-please labels are already covered by AGENTS.md
  prose and by release-please's own behaviour; a Markdown assertion adds no
  enforcement and reintroduces drift potential. AC-56-2 requires zero matches.

### Surface: `AGENTS.md` "Issue and PR labels" prose change

- **Rationalisation:** "`LABELS.md` is helpful onboarding context; demote it
  to a 'see also' link instead of removing it."
- **Foreclosure:** the file does not exist after this change (AC-56-1). A
  link to a non-existent file is worse than no link. AC-56-3 requires zero
  matches.
- **Rationalisation:** "Reintroduce `LABELS.md` later as generated output from
  `gh label list`."
- **Foreclosure:** that is a separate design decision; this spec's Out of Scope
  forbids it inside this change. A future proposal would need its own issue,
  template, and round-trip story.

### Surface: `skills/bootstrap/SKILL.md` and templates

- **Rationalisation:** "Add a `LABELS.md` template so the round-trip claim in
  AGENTS.md becomes true."
- **Foreclosure:** the issue's stated direction (and Problem section) is to
  remove the duplication, not to legitimise it. AC-56-3 also removes the
  AGENTS.md round-trip entry, eliminating the constraint that would force a
  template into existence.

### Red flags to add or preserve

When reviewing any PR that descends from this design, flag and reject:

- A new file at `.github/LABELS.md` (in this repo or in any emitted template
  tree).
- Any `grep -rn 'LABELS.md' skills/bootstrap/` or `grep -n 'LABELS.md' AGENTS.md`
  hit after the change merges.
- A "see also" or compatibility-shim link that names `LABELS.md`.
- An audit-checklist row that conditionally requires `LABELS.md` (e.g. only
  for agent plugins, only when X) – same drift surface, smaller blast radius
  is still drift.
- Removal of the existing `gh label list` verification snippet from
  `AGENTS.md` in the same change. Removing the live check while removing the
  tracked file would leave the repo with no label hygiene at all.

### Adversarial Review

reviewer_context: same-thread fallback

Dimensions checked:

- **RED/GREEN baseline obligations.** This is a documentation/contract change,
  not a discipline-enforcing skill. The "RED" is the demonstrable
  contradiction: `AGENTS.md:27` claims a round-trip for a file that has no
  template under `skills/bootstrap/templates/**`. A `find` and a `grep` confirm
  the contradiction today. The "GREEN" is the post-change state encoded as
  AC-56-1 through AC-56-8, all of which are observable by file absence,
  `grep` exit codes, or `git diff` output. No subagent pressure test was run
  because the change is mechanical removal across a fixed file list, not a
  behavioural rule.
- **Rationalisation resistance.** The "Workflow-contract pressure tests"
  section enumerates four named rationalisations and ties each to a specific
  AC that forecloses it. The most plausible regression – "demote to a 'see
  also' link" – is killed by AC-56-3's zero-match grep.
- **Red flags.** Five-item explicit list at the bottom of the pressure-tests
  section. Each is observable by `grep` or by inspection of a future PR diff.
- **Token-efficiency targets.** This is a one-shot design doc, not a
  frequently-loaded skill. No word-count budget applies; the relevant
  efficiency target is "no historical files edited" (AC-56-8) so the diff
  stays minimal.
- **Role ownership.** Brainstormer wrote the doc; Architect/Implementer will
  execute against the ACs; Reviewer will run the greps. The spec leaves
  `using-github` and release-please scope-fences explicit so adjacent role
  owners aren't drawn in.
- **Stage-gate bypass paths.** The most likely bypass is "add a stub LABELS.md
  to make AC-56-1 less alarming" – explicitly forbidden in the Proposal's
  "File deletion" subsection. The second-most-likely bypass – "keep the
  AGENTS.md round-trip line and add a template later" – is forbidden by
  AC-56-3 (zero LABELS.md matches in AGENTS.md).

clean_pass_rationale: The design has one observable end state per surface,
each AC is mechanically verifiable by `test`, `grep`, or `git diff`, the four
named rationalisations all map to a foreclosing AC, and Out of Scope
explicitly fences off the release-please labels and the historical
Superpowers artifacts. No findings require disposition.
