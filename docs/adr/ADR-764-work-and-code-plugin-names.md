# ADR-764: The Team and Engineering plugins are named Work and Code

## Status

Accepted. Amends ADR-665 and ADR-570.

## Context

The repository published two plugins, `team` and `engineering`. The names
described who used them rather than what they covered. `team` also collided
with the internal `team` plugin in the patinaproject marketplace.

## Decision

The plugins are renamed:

| Old | New |
| --- | --- |
| `team` (Team), `plugins/team` | `work` (Work), `plugins/work` |
| `engineering` (Engineering), `plugins/engineering` | `code` (Code), `plugins/code` |
| `setup-team-skills` | `setup-work-skills` |
| `setup-engineering-skills` | `setup-code-skills` |

Namespaced references follow the plugin id: `work:<name>` and `code:<name>`.
ADR-665's bare-name rule now applies to Code skills and agents. The pstack sync
renames the `pstack:` prose label to `code:` and unprefixes `pstack:` and `code:`.

## Consequences

- Installs move to `work@patinaproject-skills` and `code@patinaproject-skills`.
  An existing install of `team` or `engineering` stops receiving updates until
  the operator installs the new plugin.
- `setup-code-skills` still removes managed mandate blocks marked
  `engineering:patina-mode` and SessionStart hooks that run
  `plugins/engineering/hooks/session-start.sh`, so a repository set up under
  the old name converges on the new one.
- Both upstream sources record new `transformsHash` values for the changed
  rename rules.
