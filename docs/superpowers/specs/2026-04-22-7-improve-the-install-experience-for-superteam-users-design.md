# Design: Improve the install experience for Superteam users [#7](https://github.com/patinaproject/superteam/issues/7)

## Summary

Improve the install experience for `superteam` by treating the repository landing page as the primary onboarding surface for new users. The design focuses on helping a first-time visitor quickly understand what Superteam does, what problem it solves, how it works with agent teams or subagents, and how the workflow continues cleanly across handoffs.

The design keeps the issue outcome-focused rather than prescribing a README-only rewrite. The repository landing page is the primary surface to improve first, but the broader install experience should be evaluated in terms of whether the user can move from discovery to first use without losing clarity.

## Goals

- Make the repository landing page explain what Superteam does before it explains repository structure or install surfaces
- Help a first-time visitor understand the problem Superteam solves
- Make the continuity and handoff model visible early in the docs experience
- Clarify that Superteam works with agent teams or subagents
- Avoid implying that one runtime is better than the other without evidence
- Connect installation to a clear first-use path instead of ending at setup

## Non-Goals

- Reworking the underlying `superteam` skill behavior
- Expanding the scope into contributor-focused documentation improvements
- Defining final README copy line-by-line in the design
- Committing to a README-only solution before evaluating the broader install journey

## User And Problem

The primary user is someone landing on the repository to evaluate or install Superteam. That user should not need to understand the repo structure first. They need to understand the product first.

The main problem is that the current landing experience explains install surfaces, but it does not yet explain the product value clearly enough. A new user can discover that there are multiple install surfaces, but still leave without understanding that Superteam is intended to get teams to a real, demoable, testable artifact as quickly as possible.

The failure mode is not just fragmentation. It is that multi-agent work often produces a lot of activity without producing something concrete enough to review. Without stronger structure:

- what Superteam actually does
- why it exists
- how it differs from a simpler ad hoc subagent workflow
- why continuity across agent handoffs is a core part of the system
- what to do immediately after installation

## Recommended Approach

Use a problem-first onboarding model for the install experience, with the repository landing page as the lead surface.

The landing page should introduce Superteam as a workflow for orchestrating teams of agents with Superpowers. It should establish the user problem before it explains installation mechanics. The problem statement should set up the continuity and handoff story, because the skill itself is built around durable artifacts, stage ownership, and resumable progress across a single issue workflow.

The preferred headline direction is:

`Orchestrate teams of agents with Superpowers`

That positioning should be followed immediately by copy that explains the actual operating model. Superteam is not just generic agent automation. It is a structured issue workflow that builds on Superpowers to get teams to a real, demoable, testable artifact as quickly as possible, with enough structure to review it, iterate on it, and keep moving.

## Approach Options Considered

### Option 1: Problem-first landing page with a single flagship workflow

Pros:
- Aligns the repo landing page with the actual `superteam` skill behavior
- Gives first-time users a clear mental model before setup details
- Makes continuity and team handoff visible early
- Leaves room to explain compatibility without implying a runtime preference

Cons:
- Requires restructuring the current landing-page narrative
- May expose supporting docs gaps that also need follow-up work

### Option 2: Install-first landing page with stronger product copy

Pros:
- Smaller documentation change
- Easier to implement incrementally

Cons:
- Keeps setup mechanics ahead of understanding
- Does not solve the core problem that users may still not understand the product after landing

### Option 3: Docs hub approach with a short landing page and deeper subpages

Pros:
- Scales well if the docs set grows
- Makes it easier to separate install, workflow, and contributor topics

Cons:
- Weakens the repository landing page as the primary onboarding surface
- Adds indirection before the user understands what Superteam does

Selected option: Option 1.

## Information Architecture

### Landing Page Role

The repository landing page should act as product onboarding for the install experience. It should not begin as a repository structure reference.

The top of the page should help a new user answer these questions in order:

1. What is Superteam?
2. What problem does it solve?
3. How does it work at a high level?
4. Does it work with agent teams or subagents?
5. How do I install it and what do I do next?

### Workflow Presentation

The docs should center on one flagship workflow rather than several entry points. That workflow should show how a GitHub issue moves through:

- brainstorm
- plan
- execute
- pre-push review
- finish
- comment handling

This matters because the skill itself is explicitly stage-based. The workflow is not just conceptual marketing. It is the actual operating model enforced by the skill.

### Agent Roster

The README should also include a compact roster for users who already know Superpowers and want to understand how Superteam composes those skills into one workflow.

This should be a small table near the workflow section, not a long reference section.

The table should map:

- stage
- agent role
- Superpowers skill

It should stay intentionally compact and cover only the core flow, so the README remains scannable.

### Runtime Positioning

The landing page should state clearly that Superteam works with agent teams or subagents. It should avoid saying one runtime works better than the other unless that claim has been validated.

Compatibility language should support the main story about structured issue workflows and continuity, rather than becoming the primary claim.

## Continuity And Handoff Model

The design should explain continuity as the core differentiator in the install experience.

From the skill itself, continuity comes from:

- explicit stages
- owned artifacts for each stage
- approval gates between stages
- verification and reporting requirements
- finish-stage publication and review follow-through

The landing page should help users understand that Superteam is designed so another agent, or a human, can resume work without reconstructing intent from scratch. The docs do not need to describe every rule in detail, but they should make the handoff model legible.

## Install Experience Expectations

Installation guidance should follow understanding rather than lead it. The broader install experience should be evaluated against whether the user can move cleanly through these steps:

1. Understand the problem and value
2. Understand the flagship workflow
3. Understand runtime compatibility
4. Choose the relevant install surface
5. Understand the first step after installation

If installation instructions exist without that narrative, the user experience remains incomplete even if the commands themselves are correct.

### Runtime-Specific Setup Guidance

The user-facing install guidance should follow a structure similar to `obra/superpowers`: keep the install section brief, then provide separate setup subsections for each supported tool.

For this repository, the README should include:

- `### Claude Code`
- `### OpenAI Codex CLI`
- `### OpenAI Codex App`

Each runtime section should include a concrete install-to-first-use path rather than relying on a shared generic setup block.

### Superpowers Prerequisite

Superteam should treat Superpowers as an explicit dependency rather than silently assuming it is already installed.

The README should therefore add a prerequisite step before the Superteam-specific runtime sections:

- explain that Superpowers must be installed first
- link users to the Superpowers repository for installation guidance: `https://github.com/obra/superpowers`
- avoid duplicating the full Superpowers installation instructions inside this repository

This keeps the README focused on the Superteam-specific setup path while making the dependency boundary clear.

### Marketplace Setup Guidance

Each runtime section should instruct users how to set up access to the `patinaproject/skills` marketplace after Superpowers is installed and before they try to use Superteam.

The runtime-specific setup path should therefore explain:

- how that tool connects to or installs from the `patinaproject/skills` marketplace
- how the user accesses Superteam once the marketplace is available
- what the first-use action looks like in that runtime

This matters because the real install experience has two dependency steps:

1. install Superpowers
2. set up access to the `patinaproject/skills` marketplace for Superteam

Without both steps, the runtime sections are incomplete even if the rest of the README is clear.

### Claude Code Setup Guidance

Within the user-facing install guidance, the Claude Code path should remain complete and usable on its own. It should not require Agent Teams to make sense.

That same Claude Code section should also include a short optional subsection for enabling Agent Teams. The purpose of that subsection is to help users who want a team-oriented runtime without making that setup feel mandatory.

The optional subsection should:

- give quick setup guidance for Agent Teams
- keep the default setup path intact for regular single-agent or subagent use
- include one short factual explanation of the difference

The difference should be explained briefly: Agent Teams provides a team-oriented runtime where multiple agents can coordinate through the staged workflow, while the regular setup runs the same workflow with a single agent or subagents.

### Codex Setup Guidance

The README should give OpenAI Codex users their own concrete runtime paths rather than treating Codex as a secondary mention under install surfaces.

That means:

- one subsection for `### OpenAI Codex CLI`
- one subsection for `### OpenAI Codex App`

Both subsections should explain how the `patinaproject/skills` marketplace fits into setup, and both should end with a clear first-use action for Superteam in that runtime.

### Contributor Boundary

Maintainer-oriented packaging guidance should not sit inside the user-facing runtime setup flow. Instructions such as authoring in `skills/superteam/` or running `pnpm sync:plugin` belong in contributor docs rather than the main install walkthrough.

## Inspiration

Near the end of the README, add a short `Inspiration` section with concise bullets only.

It should include:

- `BMAD-Method`: brief gratitude for introducing the team to agentic frameworks, while noting that earlier quick-dev and TEA experiments helped shape this workflow
- `Superpowers`: identify it as the foundational skills framework that made Superteam possible
- `Ken Kocienda's "Creative Selection"`: identify the importance of demo culture as an influence

Keep this section short and appreciative. It should add context without pulling focus from the main workflow and installation story.

## Inspiration And Constraints

The design may borrow patterns from strong open source landing pages and workflow-first repositories, including:

- direct problem and value framing near the top
- early workflow explanation
- concise diagrams to communicate system behavior quickly
- install instructions that follow product understanding instead of preceding it

Those references should inform the shape of the docs, but the design should stay grounded in the actual `superteam` skill behavior rather than imitating another repository's structure.

## Testing And Verification

Validation for this work should focus on clarity and narrative flow rather than code execution.

- review the repository landing page for whether the product purpose is understandable in a short scan
- verify that compatibility with agent teams or subagents is stated clearly
- verify that the landing page does not imply an unvalidated runtime preference
- verify that the flagship workflow and continuity story are understandable before installation details
- verify that the README includes a compact roster table mapping Superteam stages to agent roles and Superpowers skills
- verify that install guidance leads into an explicit first-use next step
- verify that the README makes Superpowers an explicit prerequisite and links to the Superpowers repository for installation
- verify that the README includes separate setup sections for Claude Code, OpenAI Codex CLI, and OpenAI Codex App
- verify that each runtime section explains the `patinaproject/skills` marketplace setup path
- verify that the Claude Code install path includes an optional Agent Teams subsection with a brief explanation of how it differs from regular setup
- verify that the README includes a short Inspiration section near the end

## Acceptance Criteria

- AC-7-1: The user-facing install experience leads with what Superteam does and the problem it solves before explaining install surfaces
- AC-7-2: The repository landing page presents one clear flagship workflow for how Superteam operates across an issue
- AC-7-3: The landing experience explains that Superteam works with agent teams or subagents
- AC-7-4: The landing experience avoids implying an unvalidated runtime preference
- AC-7-5: The continuity and handoff model is understandable from the initial docs experience
- AC-7-12: The README includes a compact roster table that maps the core Superteam stages to agent roles and Superpowers skills
- AC-7-6: Installation guidance connects to a clear first-use next step instead of ending at setup
- AC-7-7: The Claude Code install guidance includes an optional Agent Teams subsection with a brief explanation of how Agent Teams differs from regular setup
- AC-7-8: The README includes separate setup sections for Claude Code, OpenAI Codex CLI, and OpenAI Codex App
- AC-7-9: Each runtime section explains how to set up access to the `patinaproject/skills` marketplace before first use
- AC-7-10: Maintainer-oriented packaging guidance is not mixed into the user-facing runtime setup flow
- AC-7-11: The README makes Superpowers an explicit prerequisite and links to the Superpowers repository for installation guidance
- AC-7-13: The README includes a short Inspiration section near the end with BMAD-Method, Superpowers, and Creative Selection

## Implementation Notes

- Keep the issue focused on the install experience as a whole, not just a README rewrite
- Prefer capability and workflow language that reflects orchestration and continuity over generic automation language
- Keep contributor-facing structural details below the initial onboarding story
