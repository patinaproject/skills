# Issue 4: README Claude Code Install Instructions

## Summary

Add README guidance for using the `superteam` workflow from Claude Code.

## Context

This repository documents Codex marketplace installation today, but Claude Code uses a different extension model. The README should make that distinction explicit so users do not look for a nonexistent Claude Code marketplace command.

## Acceptance Criteria

1. The README includes an `Install In Claude Code` section near the existing installation guidance.
2. The new section explains that Claude Code uses project or user subagents instead of Codex marketplaces.
3. The new section points users to the `patinaproject/superteam` source path they should copy into `.claude/agents/superteam.md`.
4. The README keeps the existing Codex installation instructions intact.
