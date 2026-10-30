# ADR-791: The agent brief is the agent contract, and issue artifacts carry the issue ID

## Status

Accepted. Supersedes the Document titles and the single `Research` Document rule of [ADR-654](ADR-654-linear-issue-documents.md). Amends the wording of [ADR-675](ADR-675-automated-triage-playbook.md).

## Context

Triage, `to-spec`, and the implementing agent each read a different source for what to build. `to-spec` published its whole spec as the issue description, triage wrote a separate brief, and `working-on-issues` read neither. ADR-654 titled Documents `Triage notes`, `Agent brief`, and `Research`, so a title alone did not say which issue it belonged to, and every research question was appended to one Document. The readiness check fell back to a comment when a tracker defined no artifact operation, and the GitHub, GitLab, and local setup templates defined none.

## Decision

The `<identifier> Agent brief` is the one agent contract. The issue description is for people. Triage and `to-spec` write the brief from one template, and `working-on-issues` fetches it before any branch or file step. When the description changes after the brief, the worker amends the brief only for a newer value that adds or removes no acceptance criterion and no scope, and stops and asks otherwise.

Issue artifacts are titled `<identifier> Agent brief`, `<identifier> Triage notes`, and `<identifier> Research: <question>`, with one Research artifact per question. `<identifier>` is the tracker's issue reference, such as `PAT-123` or `#123`. Private repositories keep Linear Documents.

Every tracker template defines an **Attach an artifact** operation. GitHub and GitLab use one issue comment per artifact, edited in place. The local tracker writes a file beside the issue. The readiness check saves only through that operation, in both of its copies. When a repository's adapter defines none, triage and `to-spec` stop before writing and ask for a `setup-work-skills` re-run. ADR-675's two identical readiness copies and parity lint stand.

## Consequences

An agent can find an issue's artifacts by title without knowing which issue it was opened from. Triage never edits the issue description and posts no summary comment on a ready outcome. Artifacts on issues triaged before this change keep their bare titles and are not renamed. A factory deploy must use the same titles, or triage and implementation runs look for different ones.
