---
name: merge-pr
description: Merge a pull request through repository-managed auto-merge. Use when the caller expresses merge intent for a PR, or another workflow needs to land a ready PR.
workflow-role: merge-intent
remediation-skill: ready-pr
refresh-after-remediation: true
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
feedback, conflict remediation, and draft-to-ready handling; do not reproduce
that loop here.

Report only the observed outcome defined by the authoritative workflow and any
human-owned blocker.

Never force-merge, use administrator bypass, disable protections, merge with
local git, or claim an open PR merged.
