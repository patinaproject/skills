# Labels

This file is the source of truth for when to apply each issue and pull-request label in this repository. It exists so reporters and agents can pick labels without guessing, and so label drift stays visible in review. For the authoritative runtime inventory, run `gh label list --json name,description`.

## Current labels

- `bug`: Apply when the report describes a defect, regression, or unexpected behavior in shipped code or docs.
- `documentation`: Apply when the change is primarily to Markdown, in-repo docs, or comments that describe behavior.
- `duplicate`: Apply when another open or closed issue already tracks the same problem; link the canonical issue in the body.
- `enhancement`: Apply when the report proposes a new capability or improves an existing one without fixing a defect.
- `good first issue`: Apply when the work is small, well-scoped, and safe for a first-time contributor to pick up.
- `help wanted`: Apply when maintainers are actively soliciting outside contributions on the issue.
- `invalid`: Apply when the report is not actionable as filed (wrong repo, not reproducible, out of scope) and cannot be salvaged by editing.
- `question`: Apply when the issue is a support request or clarification rather than a change request.
- `wontfix`: Apply when the behavior described is intentional or the maintainers have decided not to act on it; leave a short rationale before closing.
- `autorelease: pending`: Tool-managed by release-please; do not apply manually. Its GitHub description is currently empty, which is a known gap tracked for follow-up.

## Adding or changing labels

Use `gh label list --json name,description` as the canonical inventory and follow the label-hygiene rule in [`AGENTS.md`](../AGENTS.md) (every label must have a non-empty description). Do not introduce new labels in an issue or PR without first updating the repository label set and this file.
