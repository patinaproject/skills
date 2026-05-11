// Lint-staged configuration
// Filters out vendored plugin files and superpowers artifacts from markdownlint
// so each plugin can use its own markdownlint config without conflicting with ours.
module.exports = {
  "*.md": (files) => {
    const filtered = files.filter(
      (f) => !f.includes("/plugins/") && !f.includes("/docs/superpowers/")
    );
    if (filtered.length === 0) return [];
    return [`markdownlint-cli2 ${filtered.join(" ")}`];
  },
};
