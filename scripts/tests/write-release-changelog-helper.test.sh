#!/usr/bin/env bash
# write-release-changelog-helper.test.sh — runs the fixture-based behavior tests
# for the write-release-changelog bundled helper (provider detection, release →
# feedback traversal, the approval-gated adapter orchestration, and the trace
# CLI). These assert executable behavior on fixtures, never markdown prose.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

node --test "skills/write-release-changelog/scripts/**/*.test.mjs"
