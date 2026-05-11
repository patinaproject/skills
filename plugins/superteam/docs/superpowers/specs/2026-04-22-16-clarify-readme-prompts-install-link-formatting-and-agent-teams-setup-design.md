# Design: Clarify README prompts, install link formatting, and Agent Teams setup [#16](https://github.com/patinaproject/superteam/issues/16)

## Summary

Clarify the README so a first-time user can understand how to resume Superteam work, how to introduce a requirement change, where to install Superpowers, and how optional Claude Agent Teams setup fits into the default workflow.

The design keeps scope tightly focused on README wording and structure. It does not change the `superteam` skill contract, install commands, or runtime behavior.

## Goals

- Rewrite the generic lifecycle guidance into concrete example prompts a user can copy and adapt
- Replace the raw Superpowers installation URL with a repository-name link label
- Add optional Claude Agent Teams setup guidance without making it feel required
- Remove or tighten nearby README wording that is likely to confuse first-time users in the same flow
- Preserve the current install surfaces and runtime sections while making the path from install to first use easier to follow

## Non-Goals

- Changing any `superteam` skill behavior or teammate contracts
- Adding new install surfaces or support claims
- Writing a full Claude Agent Teams guide beyond the minimal setup note needed in the README
- Reworking the overall README architecture beyond the sections touched by this issue

## User And Problem

The user is a repository visitor trying to install or invoke Superteam from the README.

The current confusion points are concentrated in one part of the document:

- The "Run superteam anytime" section describes resumed work and requirement changes in abstract instructions rather than user-facing prompt examples
- The Superpowers prerequisite is shown as a raw URL instead of a readable repository reference
- The optional Agent Teams section explains the concept, but not how a Claude Code user should enable it in their config
- Nearby wording leaves some first-time users to infer details that the README can state directly

The result is a README that has the right concepts, but still asks the user to translate parts of the workflow into their own phrasing at the moment they are trying to act.

## Recommended Approach

Make the README more action-oriented by replacing abstract guidance with direct examples, tightening labels, and adding one small setup note where the current text stops short.

This should be a targeted documentation pass, not a full rewrite. The issue is best solved by improving the exact sections users encounter during install and first invocation:

1. Replace the two abstract lifecycle sentences with concrete example prompts for:
   - resuming an issue from the current teammate or artifact state
   - introducing a new requirement so Superteam routes back through the right gate
2. Change the Superpowers prerequisite from a raw URL block to a normal Markdown link labeled `obra/superpowers`
3. Expand the optional Claude Agent Teams note so it tells the user where to enable Agent Teams in Claude config and keeps that setup clearly optional
4. Fix a small set of adjacent wording issues in the README when they directly affect comprehension of install or first-use behavior

## Approach Options Considered

### Option 1: Tight README patch in the affected sections

Pros:

- Directly addresses the confusion reported in the issue
- Keeps scope small and easy to review
- Avoids reworking unrelated parts of the README

Cons:

- Leaves the broader README structure unchanged

### Option 2: Broader onboarding rewrite around install and invocation

Pros:

- Could improve readability more dramatically
- Might surface additional onboarding improvements

Cons:

- Expands beyond the issue's stated scope
- Makes review harder because more wording changes would be subjective

### Option 3: Move clarifications into separate docs instead of the README

Pros:

- Keeps the README shorter
- Makes room for more detailed runtime notes elsewhere

Cons:

- Pushes first-use clarification away from the place where confusion currently happens
- Adds navigation overhead for a problem that should be solved inline

Selected option: Option 1.

## README Changes In Scope

### Example Prompt Rewrite

The "Run superteam anytime" section should show example invocation text, not meta-instructions about how to compose a prompt.

The revised copy should:

- present one example for resuming existing work
- present one example for introducing a new requirement
- use runtime-agnostic wording that still reads like a real prompt
- preserve the existing workflow rule that requirement-bearing changes route back through the appropriate gate

The examples do not need to be identical across runtimes. They do need to read as prompts a user could actually send with minor adaptation to their host runtime.

### Superpowers Installation Link Label

The prerequisite step should reference the Superpowers repository as a labeled Markdown link, not a fenced raw URL.

The README should say that users should follow setup instructions in [`obra/superpowers`](https://github.com/obra/superpowers).

This keeps the dependency clear while making the docs read like maintained product documentation instead of copied raw text.

### Optional Claude Agent Teams Guidance

The optional Agent Teams subsection should remain clearly optional and should not interrupt the default Claude Code install path.

The added guidance should:

- tell the user to enable Agent Teams in Claude Code configuration
- include the minimal config shape or location guidance needed to make that actionable
- explain that the same Superteam workflow still works without Agent Teams
- avoid implying that Agent Teams is required or preferred for successful use

If the repository already documents a Claude config path or format elsewhere, the README should align with that wording rather than inventing a different phrasing.

### Additional README Confusion Fixes

This issue also allows a small pass for nearby confusing wording discovered during review, as long as the changes stay tied to install, invocation, or runtime clarity.

The active candidates are:

1. Make the "Run superteam anytime" examples explicitly user-directed instead of descriptive prose
2. Clarify that the Claude Code invocation example is the command to run after installation, not a section label or conceptual example
3. Tighten the "Install surfaces" wording so users do not confuse repository structure with end-user setup steps
4. Keep Codex CLI and Codex App steps parallel where possible so the user can compare them without re-parsing different sentence structures

These are wording and presentation fixes only. Any larger README reorganization should be deferred to a separate issue.

## Acceptance Criteria

### AC-16-1

The README rewrites the resumed-work and new-requirement guidance as concrete example prompts rather than abstract prompt-writing instructions.

### AC-16-2

The README changes the Superpowers prerequisite from a raw URL block to a Markdown link labeled `obra/superpowers`.

### AC-16-3

The README adds an optional Claude Agent Teams setup note that tells the user how to enable Agent Teams in Claude configuration while clearly preserving the default non-Agent-Teams workflow.

### AC-16-4

The README fixes any additional confusing wording found in the same install and invocation flow, but keeps the scope limited to clarity edits directly related to this issue.

## Verification Strategy

- Review the updated README sections in rendered Markdown or plain text to confirm the example prompts read like prompts a user could send
- Confirm the Superpowers prerequisite renders as a labeled Markdown link instead of a raw URL block
- Confirm the Agent Teams subsection contains actionable Claude configuration guidance and still reads as optional
- Compare the surrounding install and first-use sections to ensure any adjacent wording edits remain narrow and issue-aligned

## Risks And Guardrails

- Over-expanding into a full README rewrite would make the issue harder to review; keep edits local to the affected flow
- Agent Teams wording could accidentally imply a preferred runtime; the copy should stay factual and optional
- Example prompts could become too runtime-specific; they should stay adaptable while still being concrete enough to copy
