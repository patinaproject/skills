const { execFileSync } = require("node:child_process");

function runGit(args, options = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", options.allowFailure ? "pipe" : "inherit"],
    }).trim();
  } catch (error) {
    if (options.allowFailure) return "";
    throw error;
  }
}

function runGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function repoRoot() {
  return runGit(["rev-parse", "--show-toplevel"]);
}

function currentBranch() {
  return runGit(["branch", "--show-current"], { allowFailure: true }) || "HEAD";
}

function defaultBranch() {
  try {
    return runGh(["repo", "view", "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"]);
  } catch (_error) {
    const originHead = runGit(["rev-parse", "--abbrev-ref", "origin/HEAD"], { allowFailure: true });
    if (originHead.startsWith("origin/")) return originHead.slice("origin/".length);
    throw new Error("Default branch could not be resolved. Authenticate gh or fetch origin/HEAD.");
  }
}

function mergeBase(baseRef) {
  try {
    return runGit(["merge-base", `origin/${baseRef}`, "HEAD"]);
  } catch (_error) {
    throw new Error(`Could not compute merge base with origin/${baseRef}. Run 'git fetch origin ${baseRef}' first.`);
  }
}

function headSha() {
  return runGit(["rev-parse", "HEAD"]);
}

function changedFiles(baseSha) {
  const tracked = runGit(["diff", "--name-only", "--diff-filter=ACDMRTUXB", baseSha], {
    allowFailure: true,
  });
  const untracked = runGit(["ls-files", "--others", "--exclude-standard"], {
    allowFailure: true,
  });
  const files = [...tracked.split("\n"), ...untracked.split("\n")].filter(Boolean);
  return [...new Set(files)].sort();
}

function hasUncommittedChanges() {
  return Boolean(runGit(["status", "--porcelain"], { allowFailure: true }));
}

function prMetadata() {
  try {
    const json = runGh([
      "pr",
      "view",
      "--json",
      "number,title,body,url,baseRefName,headRefName,headRefOid,baseRefOid",
    ]);
    const metadata = JSON.parse(json);
    try {
      metadata.repository = runGh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
    } catch (_error) {
      metadata.repository = null;
    }
    return metadata;
  } catch (_error) {
    return null;
  }
}

module.exports = {
  changedFiles,
  currentBranch,
  defaultBranch,
  hasUncommittedChanges,
  headSha,
  mergeBase,
  prMetadata,
  repoRoot,
};
