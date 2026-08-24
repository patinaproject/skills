// Lint-staged configuration.
//
// Exclusions are not repeated here: `.markdownlint-cli2.jsonc` (`ignores`)
// applies to the explicit file paths lint-staged passes, just as it does to a
// glob run, so vendored skill payloads are filtered by the same single source.
export default {
  "*.md": "markdownlint-cli2",
};
