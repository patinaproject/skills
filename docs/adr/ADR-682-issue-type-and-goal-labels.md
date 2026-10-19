# ADR-682: Issues are classified by a Type and an optional Goal, named in Sentence case

## Status

Accepted

## Context

Triage classified issues with two upstream category roles, `bug` and `enhancement`, which the tracker adapter mapped to label strings through role IDs. Those two roles could not distinguish product work from tooling work, visible from invisible change, or code changes from one-off operations. Ad hoc labels (`Feature`, `Improvement`, `Tech debt`, `Tools`, `SEO`, `Support`, `Legal`, `Security`, `B2B`) grew up beside them, overlapping, stacking on the same issue, and mixing what kind of work an issue is with why it matters. Label names mixed kebab-case, colon prefixes and Sentence case.

## Decision

Every issue carries exactly one **Type**: Feature, Bug, Refactor, Tools or Task. A Type predicts the commit type of the pull request that closes the issue: Feature is `feat` or `perf`, Bug is `fix`, Refactor is `refactor`, Tools is `chore`, `ci`, `test`, `docs` or `style`, and Task needs no commit. Bug, Feature and Refactor apply only to product behavior, meaning what users observe in Production; any change confined to project files is Tools.

An issue may carry at most one **Goal**: Legal, Security, Delivery and stability, Revenue, Support or Tech debt. When two apply, the earlier in that order wins.

Type, Goal, triage state and Wayfinder kind are each a Linear label group, so only one label from each applies. GitHub carries the same strings without groups.

Every label is in Sentence case: capitalize the first word only, keep proper nouns and acronyms, and capitalize the word after a `Prefix:`. The exception is release-please's `autorelease: pending` and `autorelease: tagged`.

Skills name labels by these exact strings. The adapter no longer maps role IDs to labels.

## Alternatives considered

- **Keep `bug` and `enhancement`, and add more category roles.** Rejected: one axis can't hold both what the work is and why it matters without forcing several labels onto most issues.
- **A single Type axis that includes SEO, Support, Security and Legal.** Rejected: those describe goals, so they overlap with every kind of work.
- **Separate Performance, Docs, CI and Test Types that mirror every commit type.** Rejected as too fine-grained for issues. Performance folds into Feature, and the rest fold into Tools.
- **Keep role IDs, and map them to Sentence case labels in the adapter.** Rejected: every Patina tracker uses the same strings, so the mapping is indirection with no benefit.
- **Enforce Sentence case with a script against the live trackers.** Rejected for now: labels are created rarely and mostly by agents that read the adapter.

## Consequences

The vendored triage, setup and Wayfinder files diverge further from upstream, and each upstream sync must reconcile them through fork declarations. Both copies of the readiness check change together. Linear can't group labels while an issue carries two of them, so adopting the groups required reclassifying open issues first. Closed issues keep their retired labels. A label added later must fit the Sentence case rule and either join a group or justify standing alone.
