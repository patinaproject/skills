# Plan: Clarify Superteam's Superpowers prerequisite [#68](https://github.com/patinaproject/skills/issues/68)

## Approved design

- Design artifact: `docs/superpowers/specs/2026-05-14-68-clarify-superteams-superpowers-prerequisite-design.md`
- Gate 1 approval: operator explicitly approved on 2026-05-14.
- Handoff commit: `5f676d1935492f36e62b4ae1303728e91018cbd0`

## Workstreams

### W1: Add the Superteam prerequisite warning

Update `skills/superteam/README.md` in `## Install` before the Superteam install command.

Tasks:

- W1.1 Add a visible prerequisite note stating that Superteam expects Superpowers to be installed first.
- W1.2 Add the CLI command `npx skills@latest add obra/superpowers`.
- W1.3 Link to `https://github.com/obra/superpowers` for other installation methods.
- W1.4 Keep the existing Superteam install commands intact after the prerequisite note.

Acceptance criteria covered: AC-68-1, AC-68-2, AC-68-3.

### W2: Add the root README pointer

Update `README.md` so the repository-level Superteam guidance points users to the Superteam README prerequisite note.

Tasks:

- W2.1 Add a concise sentence in the `superteam` overview pointing to `skills/superteam/README.md#install`.
- W2.2 Preserve the root all-skills quickstart and host marketplace install commands.

Acceptance criteria covered: AC-68-4.

### W3: Verify documentation

Tasks:

- W3.1 Inspect `skills/superteam/README.md` for the warning, command, and repository link.
- W3.2 Inspect `README.md` for the root pointer.
- W3.3 Run `pnpm lint:md`.

## Blockers

None.
