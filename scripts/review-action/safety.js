const SECRET_PATTERN = /\$\{\{\s*secrets\.[^}]+}}/;

const KNOWN_WITH_KEYS = {
  claude: new Set([
    "claude_code_oauth_token",
    "include_fix_links",
    "display_report",
    "show_full_output",
    "use_sticky_comment",
    "prompt",
    "claude_args",
  ]),
  codex: new Set([
    "codex_args",
    "openai_api_key",
    "prompt",
    "model",
    "reasoning_effort",
    "sandbox",
    "allowed_tools",
    "disallowed_tools",
  ]),
};

function containsMutation(value) {
  return /\b(gh\s+pr\s+comment|gh\s+api|git\s+push|git\s+commit|git\s+add|git\s+checkout|git\s+reset|Edit|Write|MultiEdit)\b/.test(
    value || "",
  );
}

function safetyReview(workflow) {
  const knownKeys = KNOWN_WITH_KEYS[workflow.family] || new Set();
  const ignoredSecrets = [];
  const unmappedSettings = [];
  const safetyOverrides = [];
  const haltingIssues = [];

  for (const [key, value] of Object.entries(workflow.with)) {
    if (!knownKeys.has(key)) {
      haltingIssues.push(`Unsupported ${workflow.action} setting '${key}' may affect review scope or safety.`);
      unmappedSettings.push(key);
      continue;
    }

    if (typeof value === "string" && SECRET_PATTERN.test(value)) {
      ignoredSecrets.push(key);
    }

    if (containsMutation(value)) {
      safetyOverrides.push(`Tightened mutating instruction or tool setting in '${key}' for terminal-only local review.`);
    }
  }

  return {
    haltingIssues,
    ignoredSecrets,
    safetyOverrides,
    unmappedSettings,
  };
}

function localReviewInstruction(context) {
  const files = context.classification.reviewableFiles.map((file) => `- ${file}`).join("\n") || "- None";
  const pr = context.pr
    ? `Pull request: ${context.pr.title} (${context.pr.url})`
    : "Pull request: not found for the current branch";

  return [
    "LOCAL REVIEW-ACTION EMULATION.",
    "This run is terminal-only and read-only.",
    "Do not edit files, stage changes, commit changes, push branches, create pull requests, post GitHub comments, call mutating GitHub APIs, or mutate review threads.",
    "Report critical and major findings with file-line detail. Summarize minor issues only when concrete and actionable.",
    `Repository branch: ${context.branch}`,
    `Base: origin/${context.defaultBranch} at ${context.baseSha}`,
    `Head: ${context.headSha}`,
    `Include uncommitted changes: ${context.dirty ? "yes" : "no"}`,
    pr,
    "Reviewable files:",
    files,
    "Use the local diff between the base and head above as the review scope.",
  ].join("\n");
}

module.exports = { localReviewInstruction, safetyReview };
