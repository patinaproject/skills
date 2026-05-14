# Design: Clarify Superteam's Superpowers prerequisite [#68](https://github.com/patinaproject/skills/issues/68)

## Intent

Make the Superteam install path explicit that Superpowers is a prerequisite before users install or run `superteam`. The warning belongs in the Superteam-specific install flow, with a lightweight root README pointer so repository-level onboarding does not hide the prerequisite.

## Problem

The Superteam README says the plugin builds on Superpowers, but the install section currently starts with the Superteam install command. A user can follow the install block without realizing the recommended `superpowers` skills must be installed first, then encounter missing-skill gaps once Team Lead delegates to Brainstormer, Planner, Executor, Reviewer, or Finisher.

## Requirements

- AC-68-1: Superteam-specific install documentation warns users before installing Superteam that Superpowers is a prerequisite.
- AC-68-2: The warning includes an `npx skills` command for installing Superpowers.
- AC-68-3: The warning links to the Superpowers repository for other installation methods.
- AC-68-4: Repository-level install guidance points Superteam users to the prerequisite warning or otherwise prevents the root README from obscuring the prerequisite.

## Proposed change

Update `skills/superteam/README.md` in the `## Install` section so the first install content is a prerequisite note. The note should:

- State that Superteam expects Superpowers to be installed first.
- Show the primary CLI command:

```bash
npx skills@latest add obra/superpowers
```

- Link to `https://github.com/obra/superpowers` for other installation methods.
- Keep the existing Superteam install commands after the prerequisite note.

Update the root `README.md` Superteam section or Quickstart area with a short pointer that Superteam users should read the Superteam README's prerequisite note before installing or invoking it. This keeps the repo-level quickstart from looking complete for Superteam-specific setup while preserving the existing all-skills installation command.

## Non-goals

- Do not change `skills/superteam/SKILL.md`, teammate contracts, routing, gates, or runtime behavior.
- Do not vendor or install Superpowers as part of this repository's package scripts.
- Do not replace the existing `patinaproject/skills` install commands.
- Do not document every individual Superpowers skill in the root README.

## Design notes

This is a documentation clarification, not a workflow-contract change. The Superteam README already has an install section and is the most precise place for a prerequisite warning because users installing only `superteam` land there. The root README should stay concise and avoid duplicating the full prerequisite block, but it should make the prerequisite discoverable from the repository-level overview.

## Verification

- Inspect `skills/superteam/README.md` to confirm the prerequisite warning appears before the Superteam install command.
- Inspect `skills/superteam/README.md` to confirm it includes `npx skills@latest add obra/superpowers`.
- Inspect `skills/superteam/README.md` to confirm it links to `https://github.com/obra/superpowers`.
- Inspect `README.md` to confirm repository-level Superteam guidance points to the prerequisite note.
- Run `pnpm lint:md` after the implementation.
