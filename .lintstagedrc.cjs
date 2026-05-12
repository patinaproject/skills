// Lint-staged configuration
// Filters out vendored skill files, canonical skill overlay files (from
// external sources), and superpowers artifacts from markdownlint so each
// source can use its own markdownlint config without conflicting with ours.
module.exports = {
  "*.md": (files) => {
    const filtered = files.filter(
      (f) =>
        !f.includes("/skills/") &&
        !f.includes("/docs/superpowers/") &&
        !f.includes("/.agents/skills/") &&
        !f.includes("/.claude/skills/")
    );
    if (filtered.length === 0) return [];
    return [`markdownlint-cli2 ${filtered.join(" ")}`];
  },
};
