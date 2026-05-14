# Upgrade semantic pull request action to v6.1.1

## Issue

- Issue: #78
- Title: Upgrade semantic pull request action to v6.1.1

## Intent

Update the skills repository PR-title workflow to use the current
`amannn/action-semantic-pull-request` release already adopted by the Patina
Project app repository, while preserving the repository's existing title and
PR-body policy.

## Requirements

### AC-78-1

Both `.github/workflows/pull-request.yml` and the scaffold-owned template at
`skills/scaffold-repository/templates/core/.github/workflows/pull-request.yml`
name `amannn/action-semantic-pull-request@v6.1.1` in the comment immediately
above the semantic-title action step and pin `uses:` to the full v6.1.1 commit
SHA `48f256284bd46cdaab1048c3721360e808335d50`.

### AC-78-2

The action upgrade preserves the existing `Validate conventional commits`
configuration in both workflow copies, including allowed types,
`requireScope: false`, `disallowScopes`, `subjectPattern`,
`subjectPatternError`, and `ignoreLabels: dependencies`.

### AC-78-3

After the pull request is opened, PR workflow evidence shows that the upgraded
action executes and passes for a compliant PR title. Evidence must show the
`Validate conventional commits` step actually ran rather than skipped, and that
the triggering run payload did not include an ignored label such as
`dependencies`.

### AC-78-4

After the pull request is opened, PR workflow evidence shows that the upgraded
action executes and fails for a temporary non-compliant PR title. Evidence must
show the `Validate conventional commits` step actually ran rather than skipped,
and that the triggering run payload did not include an ignored label such as
`dependencies`; the PR title is restored after capturing that evidence.

## Non-goals

- Do not change PR-title policy, commit conventions, issue templates, or PR-body
  requirements.
- Do not introduce a new generated scaffold template for this workflow unless a
  separate issue requests it. Keeping the existing static scaffold template in
  sync is required scope.
- Do not rewrite historical Superteam planning artifacts that mention the old
  action version.

## Implementation Notes

- The expected code change is the same two-line workflow edit in both the root
  workflow and the existing scaffold template copy.
- The v6.1.1 action commit is
  `48f256284bd46cdaab1048c3721360e808335d50`.
- The PR must not carry the `dependencies` label while collecting AC-78-3 and
  AC-78-4 evidence because the workflow skips semantic validation for that
  label.

## Adversarial Review

Status: findings dispositioned.

- High configuration-drift finding dispositioned by requiring the root workflow
  and scaffold-owned template to be updated together.
- Medium skipped-validation evidence finding dispositioned by requiring run
  evidence that the semantic action step executed rather than skipped and that
  the triggering run payload did not include `dependencies`.
- Medium scope-language finding dispositioned by clarifying that no new
  generated scaffold template is in scope, while the existing static template
  must remain in sync.
