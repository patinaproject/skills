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
- Local `codex plugin --help` and `codex plugin marketplace --help` expose
  marketplace management commands (`add`, `upgrade`, `remove`) and no separate
  `codex plugin install` subcommand. The template must not invent a CLI command
  that is unsupported by the installed Codex surface.
- When `<primary-skill-name>` is absent, there is no emitted
  `skills/<primary-skill-name>/SKILL.md` file to invoke or link. Agent-plugin
  README generation must either require a primary skill name before emitting the
  skill-specific README variant, or omit skill-specific invocation examples and
  Related links. For this issue, the intended fix is to require
  `<primary-skill-name>` for agent-plugin README generation so the generated
  plugin has one documented primary skill entry point.
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
   This includes Claude Code slash-command examples and Codex CLI/App prompt
   examples that currently say `${{repo}}`.
2. The template may continue to use `{{repo}}` for plugin identity, repository
   identity, marketplace plugin installation, and editor/project surfaces that
   are keyed by the plugin repository slug.
3. Claude Code invocation examples must install the plugin by plugin slug but
   invoke the primary skill by primary skill name.
4. Usage examples must not reintroduce the repo-name shortcut for skill
   invocation.
5. The Related skill link must point at the emitted
   `skills/{{primary-skill-name}}/SKILL.md` path.
6. The Codex CLI section must not describe a command-based plugin install path
   that the installed Codex CLI does not expose. Its command sequence must only
   register the `patinaproject/skills` marketplace and must direct the user to
   install or enable the generated plugin from that registered marketplace or
   Codex plugin source.
7. Because the current Codex CLI exposes marketplace management but no install
   subcommand, the Codex CLI section must use exactly one CLI command:
   `codex plugin marketplace add patinaproject/skills`. It must then instruct
   users to install or enable `{{repo}}` from that registered Patina Project
   marketplace/plugin source, without adding `{{owner}}/{{repo}}` as another
   marketplace.
8. Agent-plugin README generation must require `<primary-skill-name>` when the
   README includes skill invocation examples or Related skill links.
9. The implementation must include a verification path that renders or otherwise
   evaluates the template with `<repo> != <primary-skill-name>`.
10. Existing guidance for editor surfaces that read repository files directly
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
follows the marketplace instructions, then the command sequence registers only
the `patinaproject/skills` marketplace and the surrounding instruction tells the
reader to install or enable the generated plugin from that registered source
instead of registering the generated plugin repo as a second marketplace.

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
- Codex CLI/App prompt examples become `Use ${{primary-skill-name}} for the
  workflow described above.`;
- Usage examples use `/{{repo}}:{{primary-skill-name}}` when showing Claude Code
  slash commands and `${{primary-skill-name}}` when showing Codex prompt
  examples;
- Related links use `skills/{{primary-skill-name}}/SKILL.md`;
- Codex CLI install uses only
  `codex plugin marketplace add patinaproject/skills`, then tells the user to
  install or enable `{{repo}}` from the registered Patina Project marketplace or
  Codex plugin source; it must not include
  `codex plugin marketplace add {{owner}}/{{repo}}@v0.1.0`;
- the scaffold path that emits this README requires `<primary-skill-name>` for
  agent-plugin mode, or otherwise refuses/asks before rendering the README.

## Verification

- Render or programmatically substitute the README template with:
  - `repo = "workflow-kit"`
  - `owner = "patinaproject"`
  - `primary-skill-name = "issue-router"`
- Assert the rendered Claude Code invocation and Usage examples contain
  `/workflow-kit:issue-router`.
- Assert the rendered README does not contain `/workflow-kit:workflow-kit`.
- Assert the rendered Codex CLI and Codex App prompt examples contain
  `$issue-router` and do not contain `$workflow-kit`.
- Assert the Related skill link points to
  `./skills/issue-router/SKILL.md`.
- Assert the Codex CLI section registers `patinaproject/skills` and does not
  contain `codex plugin marketplace add patinaproject/workflow-kit@v0.1.0`.
- Assert the Codex CLI section contains a positive instruction to install or
  enable `workflow-kit` from the registered Patina Project marketplace/plugin
  source, and does not contain an unsupported `codex plugin install` command.
- Assert the generated README keeps repository-keyed editor/project surfaces as
  `workflow-kit`, including the Cursor rule path `.cursor/rules/workflow-kit.mdc`.
- Verify the scaffold path refuses or prompts when agent-plugin README
  generation lacks `<primary-skill-name>`, so it cannot emit an empty
  skill-invocation command or `skills//SKILL.md` link.
- Run `pnpm lint:md`.
- Run `pnpm verify:dogfood`.
- Run `pnpm apply:scaffold-repository:check` to confirm the scaffold baseline
  remains idempotent.

## Out of Scope

- Changing the scaffold prompt contract to require matching repo and primary
  skill names.
- Supporting agent-plugin README generation with no primary skill entry point in
  this issue. The fix requires `<primary-skill-name>` for this README variant
  because the template documents a primary skill invocation and Related skill
  link.
- Changing generated plugin manifest names or marketplace metadata outside the
  README template.
- Reworking non-plugin README templates.
- Rewriting historical Superpowers artifacts that contain older example
  commands.

## Concerns

No approval-blocking concerns remain. The main implementation risk is preserving
existing repo-keyed editor guidance while tightening primary-skill-specific
examples; the rendered-output regression should catch that split.
