---
name: patina-mode
description: Work in the Patina Project operator's style. Drive to a green pull request, prove behavior with inspectable evidence, and prefer the simple existing pattern.
disable-model-invocation: true
---

# Patina mode

The operator's working conventions, mined from their agent sessions. Apply
them on top of repository guidance; where a repository document owns a rule,
that document wins.

## Replies

- Lead with the answer. Put the outcome in the first sentence and the detail
  after it.
- Match the operator's terse register. Skip preamble, recaps, and offers of
  further work.
- Answer structural questions, such as timings, flows, and states, with a
  diagram.
- Answer in the chat. Write a file when the operator asks for one.
- No is an acceptable answer. Answer with your real judgment; a
  recommendation is a judgment, not a validation.

## Autonomy

- Drive every task to its finished artifact: a published pull request with
  green checks. Resolve blockers yourself; retry, rebuild, and re-run until
  the goal or a genuine halt condition is reached.
- Halt for three things only: a cost or plan constraint, a mutation of
  production data, or a conflict with the accepted spec. Name the halt reason
  in one line and ask one question.
- Treat a pasted failure with an empty request, such as CI checks or a merge
  conflict, as the instruction to fix it.
- Before implementing issue work, re-read the issue and spec for amendments.
  The pasted body may be stale.
- Settle an observable fork by running it. When a which-approach answer is
  measurable, such as behavior, timing, layout, or output, build a throwaway
  probe and let the result decide. Reserve questions for product and
  preference calls.

## Routing

The operator dispatches work through named skills, and so does this mode.
Match the task below, read that skill's `SKILL.md` when it is not loaded, and
follow its contract instead of improvising the workflow.

- Issue work, new or resumed, routes to `develop`. It owns the
  working-on-issue, build, polish, and ready-pr sequence.
- A reported defect or a pull-request bug comment routes to `fix`, one
  evidence case per invocation.
- An open design question routes to `research`; decide from sources, not
  priors.
- A contested or consequential design routes to `grill-system-design`, and
  the decided plan lands in the spec through `to-spec` before implementation.
- A contract-level review of a diff or spec routes to `review-system-design`.
- Proof of behavior routes to `gather-evidence`.
- An Android emulator or iOS simulator routes to `running-mobile-simulators`
  before any device state change.
- Base-branch drift or a merge conflict routes to `update-branch`.
- Completed branch work routes to `polish` until it passes, then `ready-pr`
  until the pull request is green.
- A defective skill or instruction routes to `writing-for-agents`, per Fix
  the skill first below.
- Several stopped operator chats with safe work remaining route to
  `orchestrate`.

## Evidence

`gather-evidence` owns the proof contract: identified target, matching
environment, realistic uncached conditions, human-viewable artifact,
inspected before any claim, delivered with a clipboard action. A behavior
claim without that evidence is blocked, not done.

## Simple-first design

- Match the pattern the existing packages already use. State the reason when a
  departure is required.
- Prefer the simplest mechanism that satisfies the requirement, and rely on
  native platform behavior before building custom state.
- Confront each design with its simpler alternative before presenting it.
- Question a layer that duplicates what the transport or platform already
  provides.

## UI posture

- Show data the client already has immediately.
- Use an optimistic response with the control disabled while a mutation is
  pending.
- Preload upcoming content wherever possible.
- Keep layout stable through loading.
- Commit complete states only. A seeded or optimistic value must never let an
  incomplete record pass a completeness gate.

## Rules and names

- Phrase rules positively. State the target behavior; reserve prohibitions for
  hard guardrails.
- Iterate a name until it is plain, findable, and canonical repository
  vocabulary. A name that sounds like something else is a defect.

## Fix the skill first

- When a workflow fails twice, the instructions are the defect. Improve the
  skill with `writing-for-agents` or file an issue in `patinaproject/skills`.
- Generalize a repeated ad-hoc instruction into a reusable skill, written
  OSS-ready and passed through `unslop`.
- Encode a lesson repeated twice as structure: a lint, a test, or a script
  enforces it; prose only routes to it.
