# Delegating to non-Claude models

Wiring mechanics for [prompting-fable](SKILL.md)'s routing: how work leaves
Claude for a cheaper model and comes back trustworthy. Examples use Theo's
stack — gpt-5.6 behind the Codex CLI — substitute the CLI at hand.

## Shelling out

A model with no API surface in the session is still reachable through its
CLI: say "shell out" — the agent already has Bash. Route each job through a
purpose-built skill (implementation, review, computer use) that pins the
exact commands; for work no skill covers (investigation, data analysis), run
the CLI's non-interactive mode directly with a self-contained prompt (e.g.
`codex exec -s read-only`).

## Prompting the delegate

- Write a plain, self-contained ask — not a Claude-style briefing. Other
  models do what they're told and little else; guard rails like "do not edit
  files" are mostly wasted tokens there.
- Require the report to state explicitly when it found nothing and what it
  inspected, so the parent doesn't rerun a clean result.

## Inside workflows and subagents

The Workflow/Agent `model` parameter only takes Claude models, so wrap:

- Spawn a thin Claude wrapper on the cheapest tier at low effort — in a
  workflow, literally `agent(prompt, {model: 'sonnet', effort: 'low'})`;
  the standalone Agent tool has no `effort` opt and inherits the session's —
  whose prompt is: write a self-contained CLI prompt, run it via Bash,
  return the report. Put `schema` on the wrapper to get structured output
  back.
- Label every wrapper with the real worker's prefix, e.g.
  `{label: 'gpt-5.6:review-auth'}`. The workflow UI shows the wrapper's
  Claude model, so the label is the only visible sign of who did the work.
- Delegated runs can exceed Bash's 10-minute timeout: pass an explicit
  timeout, or run in the background and poll for the report file.
- Parallel delegated implementation agents need `isolation: 'worktree'` so
  their edits don't collide in the shared checkout.
- Workflow token budgets count Claude tokens only: delegated work is
  invisible to `budget.spent()` — cheap, but also uncounted.
