# Design: /new-issue should work without LABELS.md [#13](https://github.com/patinaproject/github-flows/issues/13)

## Intent

Make `/github-flows:new-issue` usable in repositories that do not carry a local
`.github/LABELS.md` file. The workflow should rely on GitHub's remote label
inventory via `gh label list`, matching the repository guidance that label
descriptions on the remote are the canonical source for selection.

## Requirements

- `skills/new-issue/workflow.md` must no longer halt when `.github/LABELS.md`
  is absent.
- Step 1 must load labels with `gh label list --json name,description`.
- Label suggestion guidance must use remote label descriptions and continue to
  treat zero selected labels as a valid path.
- Pre-creation label validation must check chosen labels against the remote
  label inventory, not against local label documentation.
- Local `.github/LABELS.md` may remain as human-facing documentation, but the
  skill must describe it as optional.
- `docs/issue-filing-style.md` must align with the runtime workflow and tell
  contributors that skills use `gh label list`.
- Dependabot-only and Release Please-reserved label rules stay unchanged.

## Design

Update Step 1 of `skills/new-issue/workflow.md` from a Markdown-table parser to
a remote inventory fetch:

```bash
gh label list --json name,description --jq '.'
```

The workflow validates that the command succeeds, the JSON parses, the list is
non-empty, and every returned label has a non-empty `name`. Empty label
descriptions should warn rather than block, because AGENTS.md asks contributors
to verify descriptions but the issue-filing flow should still be able to proceed
when a repository has imperfect metadata.

The Step 8 remote label existence check should reuse the Step 1 inventory, or
refresh with `gh label list --json name --jq '.[].name'` if needed. The refusal
message should say the label does not exist on the remote repository, with no
reference to `.github/LABELS.md`.

`docs/issue-filing-style.md` should describe `gh label list --json
name,description` as the runtime source of truth and note that `.github/LABELS.md`
is optional documentation only.

## Acceptance Criteria

- AC-13-1: Given a repository with remote GitHub labels and no local
  `.github/LABELS.md`, when an agent follows `/github-flows:new-issue`, then
  Step 1 loads labels through `gh label list` and does not halt on the missing
  file.
- AC-13-2: Given a user-selected label, when `/github-flows:new-issue` performs
  pre-creation checks, then it validates the label against the remote label list
  and reports missing labels as absent from the remote repository.
- AC-13-3: Given repository documentation for issue filing, when contributors
  read the label guidance, then it points to `gh label list --json
  name,description` and says `.github/LABELS.md` is optional for skills.
- AC-13-4: Given this is a workflow-contract change, when review runs, then the
  reviewer performs a pressure-test walkthrough covering the missing
  `.github/LABELS.md` path.

## Verification

- Run `pnpm lint:md`.
- Run `git diff --check`.
- Run `gh label list --json name,description --jq 'length'` from the repository
  root to verify the remote label command works.
- Search changed docs for stale mandatory `.github/LABELS.md` halt language.

## Out of Scope

- Removing `.github/LABELS.md` from this repository.
- Synchronizing local label documentation with GitHub labels.
- Changing label names, colors, or descriptions on GitHub.
- Changing `/github-flows:edit-issue`, which already uses `gh label list`.
