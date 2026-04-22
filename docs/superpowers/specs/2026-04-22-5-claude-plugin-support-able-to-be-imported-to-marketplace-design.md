# Design: Claude plugin support (able to be imported to marketplace) [#5](https://github.com/patinaproject/superteam/issues/5)

## Summary

Add Claude-native installation support for the `superteam` plugin in `patinaproject/superteam`, and add marketplace support for discovering that Claude-native package through `patinaproject/skills`.

The design keeps `patinaproject/superteam` as the source of truth for the actual packaged plugin, while `patinaproject/skills` remains the marketplace catalog that points users at installable plugin sources.

## Goals

- Make `patinaproject/superteam` directly installable through Claude-native plugin flows
- Make `patinaproject/skills` able to advertise or route to the Claude-native install surface
- Avoid maintaining duplicate plugin payloads across both repositories
- Keep the existing Codex packaging intact while adding Claude-native support

## Non-Goals

- Reworking the existing `superteam` skill behavior
- Changing the marketplace ownership model so `skills` becomes the package source of truth
- Building a general plugin publishing framework for every Patina Project repository

## Repositories And Ownership

### `patinaproject/superteam`

Owns the installable plugin package and any Claude-native metadata, structure, and install documentation required for direct installation.

### `patinaproject/skills`

Owns marketplace discovery metadata and documentation for installing Patina Project plugins, including the Claude-compatible install route that points at `patinaproject/superteam`.

## Recommended Approach

Use a single-source packaging model:

- `superteam` contains the real Claude-native plugin artifacts
- `skills` references those artifacts through marketplace metadata
- both direct install and marketplace-driven install remain valid

This avoids package drift and matches the current Codex marketplace pattern already used by `skills`.

## Approach Options Considered

### Option 1: Direct install only from `superteam`

Pros:
- Minimal implementation
- One package source

Cons:
- `skills` adds little value for Claude users
- Marketplace discovery remains incomplete

### Option 2: Duplicate Claude package in both repos

Pros:
- Each repo can stand alone
- Marketplace repo can fully vendor the package

Cons:
- High drift risk
- More maintenance and release overhead

### Option 3: Source package in `superteam`, marketplace metadata in `skills`

Pros:
- One package source of truth
- Supports both direct install and marketplace discovery
- Fits the existing repo split

Cons:
- Requires clear documentation of the source-of-truth boundary

Selected option: Option 3.

## Architecture

### Package Layer

`patinaproject/superteam` should gain the Claude-native package structure required for direct installation. That package should be colocated with the existing plugin assets so repository consumers can find the supported install surfaces without guessing.

The package metadata should clearly identify:

- plugin name
- human-facing display text
- repository homepage and support links
- installable skill/artifact paths
- any Claude-specific compatibility metadata needed by the package format

### Marketplace Layer

`patinaproject/skills` should extend its marketplace catalog so the `superteam` entry includes the Claude-compatible install path or source definition. The catalog should continue to reference `patinaproject/superteam` rather than carrying a second copy of the package.

### Documentation Layer

Both repos need explicit installation guidance:

- `superteam` explains direct Claude-native installation and identifies itself as the package source of truth
- `skills` explains marketplace-based installation and states that the underlying package is sourced from `patinaproject/superteam`

## Expected File Areas

### `patinaproject/superteam`

- Claude-native plugin/package manifest files
- plugin packaging docs in `README.md` and related contributor docs
- sync or packaging scripts if the current packaging flow needs to emit Claude-native artifacts

### `patinaproject/skills`

- `.agents/plugins/marketplace.json`
- `README.md`
- optional vendored plugin metadata only if required by the Claude marketplace format

## Data Flow

1. Maintainers update the package in `patinaproject/superteam`
2. Claude users may install directly from the `superteam` package source
3. `patinaproject/skills` exposes marketplace metadata that points to the same package source
4. Claude marketplace consumers discover `superteam` through `skills` and resolve the package from `patinaproject/superteam`

## Error Handling And Constraints

- If Claude-native packaging requires metadata not currently present in `superteam`, that metadata must be added there rather than synthesized in `skills`
- If the Claude marketplace format cannot reference a remote subdirectory cleanly, the fallback is to vendor only the minimum metadata wrapper in `skills`, not the whole plugin payload
- Documentation must make the ownership boundary explicit so future changes do not fork the package

## Testing And Verification

### `patinaproject/superteam`

- inspect the resulting package files
- run any existing sync or packaging command that updates published plugin contents
- verify README instructions match the actual package paths

### `patinaproject/skills`

- inspect `.agents/plugins/marketplace.json`
- verify referenced paths, refs, and repository URLs
- verify README instructions reflect both marketplace and direct-install options

## Acceptance Criteria

- AC-5-1: `patinaproject/superteam` contains the Claude-native package artifacts needed for direct installation
- AC-5-2: `patinaproject/superteam` documentation explains Claude-native direct installation
- AC-5-3: `patinaproject/skills` marketplace metadata exposes a Claude-compatible installation route for `superteam`
- AC-5-4: `patinaproject/skills` documentation explains that its marketplace entry depends on the package maintained in `patinaproject/superteam`
- AC-5-5: The implementation does not create two independently maintained copies of the `superteam` package

## Implementation Notes

- Preserve existing Codex plugin support rather than replacing it
- Keep names aligned across manifests, marketplace entries, and docs
- Prefer small metadata additions over introducing a new build system
