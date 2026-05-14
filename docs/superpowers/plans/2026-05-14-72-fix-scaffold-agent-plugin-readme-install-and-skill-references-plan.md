# Plan: Fix scaffold agent-plugin README install and skill references [#72](https://github.com/patinaproject/skills/issues/72)

## Approved design

- Design artifact: `docs/superpowers/specs/2026-05-14-72-fix-scaffold-agent-plugin-readme-install-and-skill-references-design.md`
- Gate 1 approval: operator explicitly approved on 2026-05-14.
- Handoff commit: `51f1d2f98947f20f0466612f8fa5561e126f0fb0`

## Workstreams

### W1: Add rendered-template regression coverage

Create `scripts/verify-scaffold-agent-plugin-readme.js`.

Tasks:

- W1.1 Read `skills/scaffold-repository/templates/agent-plugin/README.md.tmpl`.
- W1.2 Render a test README by replacing:
  - `{{owner}}` with `patinaproject`
  - `{{repo}}` with `workflow-kit`
  - `{{repo-description}}` with `Workflow coordination test plugin.`
  - `{{primary-skill-name}}` with `issue-router`
- W1.3 Assert the rendered README contains `/workflow-kit:issue-router`.
- W1.4 Assert the rendered README does not contain `/workflow-kit:workflow-kit`.
- W1.5 Assert Codex CLI/App prompt examples contain `$issue-router` and do not contain `$workflow-kit`.
- W1.6 Assert the Related skill link points at `./skills/issue-router/SKILL.md`.
- W1.7 Assert the Codex CLI section contains `codex plugin marketplace add patinaproject/skills`.
- W1.8 Assert the rendered README does not contain `codex plugin marketplace add patinaproject/workflow-kit@v0.1.0`.
- W1.9 Assert the rendered README does not contain `codex plugin install`.
- W1.10 Assert the rendered README still contains `.cursor/rules/workflow-kit.mdc`.
- W1.11 Add a second render with an empty primary skill name and fail unless the renderer refuses before producing `/workflow-kit:` or `skills//SKILL.md`.
- W1.12 Add package script `verify:scaffold-readme` that runs the new script.

Acceptance criteria covered: AC-72-1, AC-72-2, AC-72-3.

### W2: Fix the agent-plugin README template

Modify `skills/scaffold-repository/templates/agent-plugin/README.md.tmpl`.

Tasks:

- W2.1 Keep Claude install keyed to the plugin slug:
  `/plugin install {{repo}}@patinaproject-skills`.
- W2.2 Change Claude invocation from `/{{repo}}:{{repo}}` to
  `/{{repo}}:{{primary-skill-name}}`.
- W2.3 Replace the Codex CLI second marketplace-add command with prose that tells users to install or enable `{{repo}}` from the registered Patina Project marketplace/plugin source.
- W2.4 Change Codex CLI and Codex App prompt examples from `${{repo}}` to `${{primary-skill-name}}`.
- W2.5 Change Usage examples from `/{{repo}}:{{repo}}` to
  `/{{repo}}:{{primary-skill-name}}`.
- W2.6 Change Related from `skills/{{repo}}/SKILL.md` to
  `skills/{{primary-skill-name}}/SKILL.md`.
- W2.7 Preserve repo-keyed surfaces such as `.cursor/rules/{{repo}}.mdc`.

Acceptance criteria covered: AC-72-1, AC-72-2, AC-72-3.

### W3: Document the primary skill requirement

Modify `skills/scaffold-repository/SKILL.md`.

Tasks:

- W3.1 Update the prompt table so `<primary-skill-name>` is required when `<is-agent-plugin>` is yes.
- W3.2 Add a short note in `## Agent plugin surfaces` explaining that the agent-plugin README documents a primary skill invocation, so agent-plugin mode must collect a primary skill name before rendering that README.

Acceptance criteria covered: AC-72-1, AC-72-2.

### W4: Verify and commit implementation

Tasks:

- W4.1 Run `pnpm verify:scaffold-readme`; expect pass.
- W4.2 Run `pnpm verify:dogfood`; expect pass.
- W4.3 Run `pnpm apply:scaffold-repository:check`; expect pass.
- W4.4 Run `pnpm lint:md`; if it fails only on pre-existing `CHANGELOG.md` blank-line errors, record that as a known blocker and run targeted markdownlint for changed Markdown files.
- W4.5 Commit implementation with `fix: #72 fix scaffold README skill references`.

## Blockers

None.
