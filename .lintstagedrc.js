// Lint-staged configuration
// Filters out vendored skill files and canonical skill overlay files (from
// external sources) so each source can use its own markdownlint config without
// conflicting with ours.
export default {
  "*.md": (files) => {
    const filtered = files.filter(
      (f) =>
        !f.includes("/skills/") &&
        !f.includes("/.agents/skills/") &&
        !f.includes("/.claude/skills/")
    );
    if (filtered.length === 0) return [];
    return [`markdownlint-cli2 ${filtered.join(" ")}`];
  },
};
