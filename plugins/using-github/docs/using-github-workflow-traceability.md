# using-github Workflow Traceability

This matrix proves that removing the specialized skill entry points does not
remove their workflow behavior. The remaining installable skill is
`skills/using-github/SKILL.md`; detailed procedures live beside it under
`skills/using-github/workflows/`.

| Removed entry point | New location | Happy-path coverage | Refusal-condition coverage |
|---|---|---|---|
| `new-issue` | `skills/using-github/workflows/new-issue.md` | Loads labels, checks duplicates, selects labels/milestones/relationships, drafts from the issue style guide, runs the public-repo leak guard, creates the issue, and applies relationship mutations. | Refuses missing labels, malformed repo state, cross-repo creation through this workflow, reserved labels, unknown milestones, unresolvable relationships, public leaks, and explicit duplicate-check aborts. |
| `edit-issue` | `skills/using-github/workflows/edit-issue.md` | Resolves the current repository, edits issue title/body/labels/assignees/milestone/state/relationships, and uses GraphQL where REST lacks relationship support. | Refuses cross-repo edits, missing or malformed current repo state, unresolvable issues, invalid labels, reserved labels, invalid milestones, unsupported relationship targets, and public leaks. |
| `new-branch` | `skills/using-github/workflows/new-branch.md` | Resolves an issue, computes GitHub-style `<issue-number>-<kebab-title>` branch names, fetches the default branch, checks out or rebases the branch, and installs dependencies by lockfile priority. | Refuses missing or closed issues, dirty working trees, unknown default branch, cross-repo operation, fetch failure, and rebase conflicts without auto-aborting user work. |
| `write-changelog` | `skills/using-github/workflows/write-changelog.md` | Resolves a milestone, reads closed issues and merge PRs, renders user-facing changelog bullets, preserves release-please boundaries, and inserts content under `## [Unreleased]` when requested. | Refuses malformed current repo state, cross-repo rendering, missing milestones, open issues when policy requires closed issues, private repo URLs in public output, and unsafe changelog insertion targets. |
| Pull request preparation | `skills/using-github/SKILL.md` plus `.github/pull_request_template.md` | Reads the repository PR template, uses the squash-title format, links the issue, includes acceptance-criteria evidence, and records validation. | Refuses invented template sections, invalid PR titles, missing AC coverage when the issue defines ACs, and public-repo leak-guard failures. |

The breaking change is limited to direct specialized skill invocations. Agents
must start from `using-github`, which then requires the relevant procedure file
for the GitHub task at hand.
