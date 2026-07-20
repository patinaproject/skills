# ADR-PAT-2776: Preserve immutable release history with alias tags

## Status

Accepted

## Context

Releases through `2.19.2` were published as immutable GitHub Releases under
`patinaproject-skills-v<X.Y.Z>` tags. Replacing them would discard stable release URLs,
publication history, and attestations.

## Decision

Keep every immutable legacy Release and prefixed tag. Add a lightweight `v<X.Y.Z>` alias
at the exact same commit for each historical version, and treat the unprefixed form as the
canonical consumer pin. Do not create duplicate GitHub Releases for the aliases.

From PAT-2776 onward, release-please emits only `v<X.Y.Z>` tags. Bootstrap the migration
from the last prefixed release commit so version and changelog continuity do not depend on
renaming immutable history.

## Consequences

Both historical tag forms continue to resolve, but only the prefixed form owns the
historical GitHub Release. Alias tags are not protected by immutable Release objects, so
repository maintainers must never move or delete them. The Releases page adopts clean tag
names only for releases published after the migration.
