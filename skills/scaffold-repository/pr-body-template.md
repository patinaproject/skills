# Pull request body

`scaffold-repository` does not create pull requests. Use
`.github/pull_request_template.md` at the repository root. The setup copies
that template into new repositories. The template contains HTML comments only:
it reminds authors to add a closing reference for each completed issue and to
avoid accidental agent mentions. It does not define visible body sections.

Use the repository's pull request instructions for the body structure.

GitHub Checks report routine automated verification. Do not copy successful
lint, test, type-check, or repository comparison output into the pull request
body. When a required check is missing or blocked, explain the affected
behavior and limitation in the relevant body section.
