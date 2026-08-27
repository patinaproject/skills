---
name: merge-pr
description: Merge a pull request with the repository's configured auto-merge. Use when the user asks to merge a pull request or another skill needs to merge one.
---

# Merge a pull request

Follow [the auto-merge instructions](workflows/enable-auto-merge.md) from start
to finish. Let branch protection, required checks, review requirements, and the
repository's merge method decide when GitHub completes the merge.

If the branch needs work before it can merge, run `ready-pr` with the current
pull request request, then start these instructions again on the new head
commit. Use `ready-pr` for conflicts, failed checks, review feedback, target
branch updates, and draft pull requests. Its
[readiness checks](../ready-pr/references/readiness-predicate.md) define when
the pull request is ready. Its
[target branch update instructions](../ready-pr/references/base-update-recovery.md)
define how to handle verification failures after merging the target branch.

Report whether auto-merge was enabled, the pull request merged, or a person
must act. If the repository has auto-merge turned off, ask the operator to
enable it. If the GitHub plan does not support auto-merge, say so.

Never force a merge, bypass protections, disable checks, merge with local Git,
or report an open pull request as merged.
