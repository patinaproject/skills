# Design: Fix scaffold agent-plugin README install and skill references

Issue: [patinaproject/skills#72](https://github.com/patinaproject/skills/issues/72)

## Intent

Make the `scaffold-repository` agent-plugin README template emit install,
invocation, usage, and related-link guidance that stays correct when the
generated plugin repository name and the generated primary skill name differ.

## Context

- The affected template is
  [`skills/scaffold-repository/templates/agent-plugin/README.md.tmpl`](../../../skills/scaffold-repository/templates/agent-plugin/README.md.tmpl).
- `skills/scaffold-repository/SKILL.md` treats `<repo>` and
  `<primary-skill-name>` as separate scaffold inputs. The primary skill name is
  optional and, when present, represents the emitted `skills/<name>/SKILL.md`
  entry point.
- The current Claude Code install section registers the Patina Project
  marketplace correctly but invokes `/{{repo}}:{{repo}}`. That is only correct
  when the plugin slug and primary skill name are identical.
- The current Usage examples repeat `/{{repo}}:{{repo}}`, so the generated
  README can teach the same wrong command in more than one place.
- The current Related section links to `skills/{{repo}}/SKILL.md`, which can
  point at a missing file when `<primary-skill-name>` differs from `<repo>`.
- The current Codex CLI install section registers `patinaproject/skills`, then
  tells users to run `codex plugin marketplace add {{owner}}/{{repo}}@v0.1.0`.
  That second command registers the generated plugin repository as another
  marketplace source instead of installing the generated plugin from the
  already-registered Patina Project skills marketplace.
- The `write-a-skill` structure check is relevant because the change affects a
  skill-owned template, not because it creates a new skill. The fix should keep
  template behavior concise and avoid introducing extra reference material.
- The `writing-skills` pressure-test dimensions apply because the change lives
  under `skills/`: preserve testable RED/GREEN behavior, make the failure case
  explicit, keep role/ownership boundaries clear, avoid rationalizing the
  `<repo> == <primary-skill-name>` shortcut, and verify the generated docs from
  rendered output rather than only inspecting the template.

## Requirements

1. The agent-plugin README template must use `{{primary-skill-name}}` anywhere
   it points at, invokes, or describes the generated primary skill entry point.
2. The template may continue to use `{{repo}}` for plugin identity, repository
   identity, marketplace plugin installation, and editor/project surfaces that
   are keyed by the plugin repository slug.
3. Claude Code invocation examples must install the plugin by plugin slug but
   invoke the primary skill by primary skill name.
4. Usage examples must not reintroduce the repo-name shortcut for skill
   invocation.
5. The Related skill link must point at the emitted
   `skills/{{primary-skill-name}}/SKILL.md` path.
6. The Codex CLI section must install the generated plugin from the
   already-registered `patinaproject/skills` marketplace instead of registering
   the generated plugin repository as a second marketplace source.
7. The implementation must include a verification path that renders or otherwise
   evaluates the template with `<repo> != <primary-skill-name>`.
8. Existing guidance for editor surfaces that read repository files directly
   must remain keyed to `{{repo}}` unless those surfaces are explicitly invoking
   the primary skill.

## Acceptance Criteria

### AC-72-1

Given a scaffold request where `<primary-skill-name>` differs from `<repo>`,
when the generated README is rendered, then the Claude Code invocation examples
reference the primary skill name rather than the repo name.

### AC-72-2

Given that same generated README, when a reader follows the Related skill link,
then it points at the emitted `skills/<primary-skill-name>/SKILL.md` file.

### AC-72-3

Given the generated README's Codex CLI installation section, when a reader
follows the marketplace instructions, then the commands install the generated
plugin from the registered `patinaproject/skills` marketplace instead of
registering the generated plugin repo as a second marketplace.

## Approaches Considered

### Recommended: Split plugin slug from primary skill name in README guidance

Update only the agent-plugin README template so plugin installation commands
keep using `{{repo}}`, while skill invocation examples and the Related skill
link use `{{primary-skill-name}}`. Add a focused regression check that renders
the template with intentionally different values, then asserts the relevant
Claude Code, Usage, Related, and Codex CLI lines.

This directly matches the issue's failure mode and keeps the scaffold prompt
contract intact: repo slug and skill name remain independent inputs.

### Document `<primary-skill-name> == <repo>` as a constraint

Make the scaffold prompt table declare that the primary skill name must match
the repository name. This would make the current template easier to defend, but
it would remove useful flexibility, contradict the current prompt shape, and
still leave existing callers with confusing generated docs.

### Rename every `{{repo}}` reference in the README template

Replace all README-template uses of `{{repo}}` with `{{primary-skill-name}}`.
This would fix invocation and Related links, but it would break plugin install
commands, repository references, Cursor rule names, and places where the plugin
slug is the correct identifier.

## Decision

Use the targeted split between plugin slug and primary skill identity.

The implementation should update the agent-plugin README template so:

- Claude Code install remains `/plugin install {{repo}}@patinaproject-skills`;
- Claude Code invocation becomes `/{{repo}}:{{primary-skill-name}}`;
- Usage examples use `/{{repo}}:{{primary-skill-name}}`;
- Related links use `skills/{{primary-skill-name}}/SKILL.md`;
- Codex CLI install uses a plugin-install command against the already-added
  `patinaproject/skills` marketplace, not another marketplace-add command for
  `{{owner}}/{{repo}}@v0.1.0`.

If the exact Codex CLI install subcommand is already established elsewhere in
the repository, reuse that wording. If it is not established, choose the form
that mirrors the Claude Code marketplace flow: register the marketplace once,
then install `{{repo}}` from that marketplace with a tag or marketplace
qualifier rather than adding the generated plugin repository as a marketplace.

## Verification

- Render or programmatically substitute the README template with:
  - `repo = "workflow-kit"`
  - `owner = "patinaproject"`
  - `primary-skill-name = "issue-router"`
- Assert the rendered Claude Code invocation and Usage examples contain
  `/workflow-kit:issue-router`.
- Assert the rendered README does not contain `/workflow-kit:workflow-kit`.
- Assert the Related skill link points to
  `./skills/issue-router/SKILL.md`.
- Assert the Codex CLI section registers `patinaproject/skills` and does not
  contain `codex plugin marketplace add patinaproject/workflow-kit@v0.1.0`.
- Run `pnpm lint:md`.
- Run `pnpm verify:dogfood`.
- Run `pnpm apply:scaffold-repository:check` to confirm the scaffold baseline
  remains idempotent.

## Out of Scope

- Changing the scaffold prompt contract to require matching repo and primary
  skill names.
- Changing generated plugin manifest names or marketplace metadata outside the
  README template.
- Reworking non-plugin README templates.
- Rewriting historical Superpowers artifacts that contain older example
  commands.

## Concerns

No approval-blocking concerns remain. The main implementation risk is choosing
an unsupported Codex CLI install subcommand; the executor should confirm the
current expected command from repo-local docs or the available Codex plugin
surface before changing that line.
