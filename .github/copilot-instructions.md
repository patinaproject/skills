# GitHub Copilot Instructions

This repository follows the conventions documented in [`AGENTS.md`](../AGENTS.md). Copilot should prefer guidance from that file for workflow, commit message, and file-layout rules.

For GitHub work, start from `/using-github`. It is the central behavior guide
and owns issue, branch, PR, and changelog workflows from the single remaining
skill.

Highlights:

- Commits use Conventional Commits with no scope and a required GitHub issue tag: `type: #123 short description`.
- PR titles match the commit format so squash merges reuse them verbatim.
- Markdown is linted with `markdownlint-cli2` via a husky `pre-commit` hook.
- Skills live under `skills/`, one directory per skill, with `SKILL.md` as the main contract.
