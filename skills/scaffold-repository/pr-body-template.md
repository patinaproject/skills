# Pull request body

`scaffold-repository` does not create pull requests. Use
`.github/pull_request_template.md` at the repository root. The setup copies
that template into new repositories.

GitHub Checks report routine automated verification. Do not copy successful
lint, test, type-check, or repository comparison output into the pull request
body.
When a required check is missing or blocked, explain the affected behavior and
limitation in `What changed` or one result-focused `Testing steps` item. Use
`Do before merging` only for a specific action a person must complete after
review.
