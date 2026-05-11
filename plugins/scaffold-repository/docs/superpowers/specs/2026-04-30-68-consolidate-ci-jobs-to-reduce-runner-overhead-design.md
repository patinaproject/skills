# Design: Consolidate CI jobs to reduce runner overhead [#68](https://github.com/patinaproject/bootstrap/issues/68)

## Intent

Reduce avoidable GitHub Actions runner overhead in the bootstrap baseline by
consolidating compatible short-lived CI jobs into fewer jobs with named steps.
The change should preserve validation coverage, keep failures easy to diagnose,
and round-trip through `skills/bootstrap/templates/**` before mirrored root
workflow files change.

## Requirements

- Preserve the existing validation behavior for PR title format, closing
  keyword detection, required PR-template checkboxes, breaking-change marker
  consistency, Markdown linting, and workflow linting.
- Consolidate only checks with compatible triggers, permissions, runner needs,
  and failure-reporting expectations.
- Run Markdown lint through the standalone `markdownlint-cli2-action` against
  the repository Markdown globs so CI avoids dependency installation.
- Keep heavier, security-sensitive, or materially independent checks separate
  when job isolation is useful for permissions, reporting, or future extension.
- Preserve the documented required status check name
  `Lint`, or update every repository guidance surface
  that tells maintainers which check to require before merge.
- Preserve full-length SHA pinning and adjacent action/version comments on
  every `uses:` reference.
- Edit workflow templates first, then realign root workflow files from those
  templates.
- Document the consolidation principle so future bootstrap workflow changes do
  not reintroduce avoidable runner overhead for short-lived checks.
- Keep public issue and PR text free of private downstream repository details.

## Current Shape

The core bootstrap template ships three CI workflow files that mirror the root
workflow files in this repository:

- `pull-request.yml` runs four jobs for PR title validation, closing keyword
  enforcement, required template checkbox validation, and breaking-change marker
  consistency.
- `actions.yml` runs `actionlint` for workflow changes.
- `markdown.yml` runs Markdown linting against every Markdown file on all pull
  requests, even when only one Markdown file changed.

The largest immediate runner-overhead opportunity is inside `pull-request.yml`.
The four jobs share the same trigger and broadly compatible read-only
permissions, but each starts a separate runner. Three of those jobs do not need
checkout. The checkbox job does need checkout because it runs the repository
script.

The Markdown workflow should stay simple because repository-wide Markdown lint
is cheap for this baseline.

## Approaches Considered

### Recommended: consolidate `pull-request.yml` while preserving required status

Merge the currently separate PR metadata checks into the existing
`lint` job and keep that job's display name exactly
`Lint`. The consolidated job can contain named
sequential steps for title validation, closing-keyword enforcement, checkbox
validation, and breaking-change marker consistency. Preserve the existing
conditions by applying the release-PR skip at the job level and the Dependabot
closing-keyword skip at that step. Checkout happens only before the checkbox
script, after the no-checkout checks.

This captures the clearest consolidation win while keeping the workflow
behavior easy to review. It also minimizes risk because all candidate checks
already share one workflow, trigger, and permission envelope. It also avoids
breaking branch protection or rulesets that already require `Required template
checkboxes`.

The tradeoff is that named sequential steps report the first failing check in
the job instead of reporting all independent PR metadata failures in parallel.
That is acceptable for this baseline because the checks are fast, deterministic
PR hygiene checks and the runner-overhead reduction is the purpose of the
change. AC-68-2 requires the failing step and error output to remain clear.

### Run the Markdown lint action

Keep `markdown.yml` as a separate workflow that reports a status on every pull
request. Check out the repository and run `markdownlint-cli2-action` against
the same Markdown globs used by the local script: `**/*.md`, `#node_modules`,
and `#CHANGELOG.md`. This avoids dependency installation and avoids a custom
changed-file detector for a cheap lint operation.

### Broader consolidation across lint workflows

Fold Markdown linting and actionlint into the same workflow or job family as PR
validation. This could reduce another runner on workflow-changing PRs, but the
triggers and path filters differ. Combining them risks making always-on PR
checks heavier and makes path-scoped workflow linting less obvious.

This is not the first implementation target. It can remain a follow-up if
measured overhead still justifies it.

### Status quo with documentation only

Document a preference for consolidation without changing the workflows. This is
low risk, but it does not improve the shipped baseline and leaves future repos
to rediscover the same CI overhead pattern.

This does not satisfy the issue because the baseline should model the efficient
default directly.

## Proposed Design

Update the core template `skills/bootstrap/templates/core/.github/workflows/pull-request.yml`
to replace the current four-job layout with a single consolidated `lint`
job whose display name remains exactly `Lint`.

The job should:

- keep the existing workflow trigger;
- keep `contents: read` and `pull-requests: read`;
- skip `autorelease: pending` PRs at the job level;
- keep the required status check name documented in `AGENTS.md` and
  `skills/bootstrap/templates/core/AGENTS.md.tmpl` accurate;
- run the ASCII title check and semantic PR title action as named steps;
- run the closing-keyword check as a named step guarded by the existing
  Dependabot condition;
- check out the repository before running
  `scripts/check-pr-template-checkboxes.mjs`;
- run the required template checkbox script as a named step;
- run the breaking-change marker consistency check as a named step.

Add a short CI workflow guidance note to the template-owned repository
guidance. The note should say that overhead-bound checks with compatible
triggers, permissions, and runner requirements should prefer named steps within
an existing job over separate jobs, while required status check names must be
preserved or migrated deliberately.

Update the core template `skills/bootstrap/templates/core/.github/workflows/markdown.yml`
to run `markdownlint-cli2-action` against the repository Markdown globs on
every pull request. Do not use `pull_request.paths`, because a skipped workflow
can leave required checks pending. Realign the root `.github/workflows/markdown.yml`
file from the template.

After the template changes are made, run the local bootstrap realignment
workflow so `.github/workflows/pull-request.yml`, `.github/workflows/markdown.yml`,
and updated root guidance match the template output. If the realignment command
is not available or cannot be run safely, document the blocker instead of
hand-copying root workflow changes.

## Acceptance Criteria

- AC-68-1: Given the bootstrap `pull-request.yml` template contains compatible PR
  metadata checks, when the workflow is updated, then those checks run as named
  steps in the `Lint` job without removing existing
  validation behavior.
- AC-68-2: Given a consolidated PR validation step fails, when a maintainer
  opens the GitHub Actions run, then the first failing validation is
  identifiable from the step name and error output.
- AC-68-3: Given an action reference is moved during consolidation, when the
  workflow is reviewed, then the `uses:` reference remains pinned to a full
  40-character commit SHA with an adjacent comment naming the action and
  version.
- AC-68-4: Given template changes are complete, when the repo is realigned from
  `skills/bootstrap/templates/**`, then the root `.github/workflows/pull-request.yml`,
  root `.github/workflows/markdown.yml`, and any updated root guidance match the
  generated template output.
- AC-68-5: Given maintainers configure branch protection or repository rulesets,
  when they follow repo guidance after the consolidation, then the guidance
  still names the exact required status check `Lint`.
- AC-68-6: Given future bootstrap workflow changes add short-lived checks, when
  contributors read the repo guidance, then it tells them to consolidate
  overhead-bound checks with compatible triggers, permissions, and runner needs
  into named steps instead of separate jobs.
- AC-68-7: Given a pull request changes no Markdown files, when the Markdown
  workflow runs, then it still reports a successful required-check-safe status.
- AC-68-8: Given the Markdown workflow runs, when it reaches the lint step,
  then it executes `markdownlint-cli2-action` against the repository Markdown
  globs.
- AC-68-9: Given implementation is complete, when verification runs, then
  markdown linting and workflow validation either pass or any unavailable check
  is documented as a blocker in the PR.

## Non-Goals

- Do not consolidate `markdown.yml` or `actions.yml` into another workflow
  in this issue.
  Broadening consolidation beyond `pull-request.yml` requires a Brainstormer and
  Planner update with revised acceptance criteria.
- Do not add a `pull_request.paths` filter to `markdown.yml` unless branch
  protection guidance is also changed to ensure skipped workflows cannot leave
  required checks pending.
- Do not remove, weaken, or bypass PR metadata requirements.
- Do not rename the required `Lint` status check unless
  guidance and branch-protection migration are made explicit first.
- Do not change runner vendors, workflow billing settings, or downstream
  repositories.
- Do not publish private downstream CI analysis in issue, commit, or PR text.

## Verification Strategy

- Run Markdown linting for the new design and changed repository Markdown.
- Run `actionlint` or the repository's equivalent workflow validation against
  the changed workflow files.
- Run the checkbox validation script test if workflow changes touch
  `scripts/check-pr-template-checkboxes.mjs` or its invocation.
- Inspect the final diff to confirm template and root workflow parity for
  `.github/workflows/pull-request.yml`, `.github/workflows/markdown.yml`, and any
  updated guidance files.
- Grep for `Lint` across root and template guidance to
  confirm every required-check reference remains exact.
- Inspect `markdown.yml` to confirm it has no `pull_request.paths` filter and
  runs `markdownlint-cli2-action` against the repository Markdown globs.

## Brainstormer Self-Review

- Placeholder scan: no placeholders or unresolved TODOs remain.
- Consistency check: the proposal targets the one workflow whose jobs share the
  same trigger and permissions.
- Scope check: the first pass includes one job-consolidation change and one
  path-filter change, both narrow enough for one implementation plan.
- Ambiguity check: broader lint workflow consolidation is explicitly deferred
  to a future Brainstormer/Planner pass.
