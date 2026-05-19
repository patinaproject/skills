function isLowSignal(file) {
  if (!file) return true;
  if (file === "CHANGELOG.md") return true;
  if (file === "pnpm-lock.yaml" || file === "package-lock.json" || file === "yarn.lock") return true;
  if (file === "bun.lockb") return true;
  // This repo keeps AI-agent plan artifacts under docs/superpowers.
  if (file.startsWith("docs/superpowers/")) return true;
  // The hosted prompt skips dogfood overlays during review; mirror that in the
  // deterministic local scope so symlink churn does not dominate the packet.
  if (file.startsWith(".agents/skills/")) return true;
  if (file.startsWith(".claude/skills/")) return true;
  return /\.(lock|lockb|snap|png|jpg|jpeg|gif|webp|svg)$/.test(file);
}

function classifyChangedFiles(files, options = {}) {
  const reviewWorkflowPath = options.reviewWorkflowPath || ".github/workflows/code-review.yml";

  if (files.includes(reviewWorkflowPath)) {
    return {
      shouldReview: false,
      reason: "review workflow changed",
      reviewableFiles: [],
      skippedFiles: files,
    };
  }

  const reviewableFiles = files.filter((file) => !isLowSignal(file));
  const skippedFiles = files.filter(isLowSignal);

  if (reviewableFiles.length === 0) {
    return {
      shouldReview: false,
      reason: "only low-signal files changed",
      reviewableFiles,
      skippedFiles,
    };
  }

  return {
    shouldReview: true,
    reason: "reviewable changes detected",
    reviewableFiles,
    skippedFiles,
  };
}

module.exports = { classifyChangedFiles };
