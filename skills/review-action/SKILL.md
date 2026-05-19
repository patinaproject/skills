---
name: review-action
description: Emulate supported AI code-review GitHub Actions locally and print a terminal-only review. Use when running /review-action, pnpm review-action, or checking local PR-review feedback before publishing.
---

# Review Action

## Quick Start

Run from the repository root:

```sh
pnpm review-action
```

The helper detects a supported AI review workflow, computes the branch diff
against the default branch merge base, translates supported action settings,
invokes the matching local CLI, and prints a terminal-only report.

Prerequisites:

- Fetch the default branch locally, for example `git fetch origin main`.
- Authenticate `gh` for pull request metadata. If `gh` is unavailable, the
  helper falls back to `origin/HEAD` for default-branch detection and runs
  without pull request metadata.
- Authenticate the matching local AI CLI (`claude` or `codex`).

## Safety Boundary

Local review emulation is read-only and terminal-only.

- Do not edit files, stage changes, commit, push, create pull requests, post
  GitHub comments, or mutate review threads.
- Do not read, require, print, or emulate GitHub Actions secrets.
- If hosted workflow settings would allow mutation, tighten the local run and
  report the override.
- Halt when unsupported workflow settings affect review scope or safety.

## Supported Actions

- `anthropics/claude-code-action` runs through `claude --print`.
- `openai/codex-action` runs through `codex review`.

If no supported AI review workflow is found, halt instead of falling back to a
generic review.

## Expected Output

The terminal report should include:

- Detected workflow and action family
- Base and head used for the PR-equivalent diff
- Changed files and skip classification
- Uncommitted and untracked files when local dirty-state review is needed
- Local command family and translated settings
- Ignored secrets, unmapped settings, and safety overrides
- Review output from the local CLI

## Deterministic Planning

Use `pnpm review-action -- --plan-only` to inspect workflow detection, file
classification, safety decisions, and command shape without invoking a model.
