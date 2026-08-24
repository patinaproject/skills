---
name: merge-pr
description: Merge a pull request through repository-managed auto-merge. Use when the caller expresses merge intent for a PR, or another workflow needs to land a ready PR.
---

# Merge PR

## Quick Start

When the caller intends to merge the current pull request, follow
[workflows/enable-auto-merge.md](workflows/enable-auto-merge.md) end to end.

This skill owns merge intent. It enables the repository-supported auto-merge
mode and lets branch protection, required checks, review requirements, and the
repository merge strategy govern when integration occurs.

If readiness inspection finds branch-local remediation, invoke `ready-pr` with
the current PR scope, then resume this workflow against the resulting latest PR
head. `ready-pr` is the single source of truth for publication, checks, review
feedback, conflict remediation, base-update verification recovery, and
draft-to-ready handling; do not reproduce that loop here. Use `ready-pr`'s
[canonical readiness predicate](../ready-pr/references/readiness-predicate.md)
to distinguish readiness state from unresolved feedback, and its
[base-update recovery contract](../ready-pr/references/base-update-recovery.md)
as the shared behavior when a clean base merge's verification fails during
delegated remediation.

Report only the observed outcome defined by the authoritative workflow and any
human-owned blocker.

Never force-merge, use administrator bypass, disable protections, merge with
local git, or claim an open PR merged.
