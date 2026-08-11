# Issue Publishing

Canonical tracker-agnostic rules for filing and publishing patinaproject
issues. Provider mechanics live only in
[the issue-tracker adapter](issue-tracker.md); ready-state transitions live in
[the triage workflow](triage-workflow.md).

## Who applies these rules

This repository owns no filing skill. The operator files with the third-party
`/to-spec`, and these rules bind that act: they are the reviewer's checklist
before publishing and the agent's checklist when asked to prepare a draft for
the operator to file.

`/to-spec` writes a feature-spec body and labels the result `ready-for-agent`
outright. Two reconciliations follow every run of it. Work that has not cleared
[the ready bar](triage-workflow.md) takes the triage state instead, and routine
work that is not feature-shaped takes the body framing below rather than a full
spec template.

## Body framing

Describe the problem, desired outcome, and context needed for triage. A proposal
and non-goals are optional. Avoid converting incidental implementation details
into requirements. Keep a supplied complete body verbatim.

Acceptance criteria use Given / When / Then and describe observable behavior.

## Fields

- **Title:** short and outcome-oriented, with no identifier prefix or trailing
  period.
- **Labels:** load the live inventory and never invent one.
- **Assignee:** blank unless the filer is taking the work or assignment was
  explicitly confirmed.
- **Lifecycle:** new work enters the adapter's triage state unless it already
  meets the ready bar.
- **Planning:** set the adapter's planning fields only for a named delivery
  effort.
- **Relationships:** use native parent, blocker, related, and duplicate fields
  only when explicitly stated.

## Publishing guardrails

- Resolve the destination team and every referenced remote entity.
- Search titles and full text for duplicates before mutation.
- Refuse confirmed credential, private-repository, or customer-data leaks;
  surface ambiguous sensitive content for review.
- Verify the created or updated issue and its native relationships afterward.

Interactive publishing presents the final mutation for approval. Unattended
publishing proceeds only when every value is already unambiguous.
