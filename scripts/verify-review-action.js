#!/usr/bin/env node
const assert = require("node:assert/strict");
const { classifyChangedFiles } = require("./review-action/classify");
const { planInvocation } = require("./review-action/planner");
const { safetyReview } = require("./review-action/safety");
const { detectReviewWorkflow } = require("./review-action/workflow-parser");

const context = {
  baseSha: "base-sha",
  branch: "110-add-local-review-action-emulator-skill",
  changedFiles: ["scripts/review-action.js"],
  classification: {
    reviewableFiles: ["scripts/review-action.js"],
  },
  defaultBranch: "main",
  dirty: true,
  headSha: "head-sha",
  pr: {
    number: 110,
    repository: "patinaproject/skills",
    title: "Add local review action emulator skill",
    url: "https://github.com/patinaproject/skills/pull/110",
  },
};

const workflow = detectReviewWorkflow(process.cwd());
assert.equal(workflow.family, "claude");
assert.equal(workflow.action, "anthropics/claude-code-action");
assert.equal(workflow.workflowPath, ".github/workflows/code-review.yml");
assert.match(workflow.with.prompt, /NON-INTERACTIVE CI REVIEW/);
assert.match(workflow.with.claude_args, /--allowedTools/);

const classification = classifyChangedFiles([
  ".agents/skills/review-action",
  ".claude/skills/review-action",
  "README.md",
  "pnpm-lock.yaml",
]);
assert.equal(classification.shouldReview, true);
assert.deepEqual(classification.reviewableFiles, ["README.md"]);
assert.deepEqual(classification.skippedFiles, [
  ".agents/skills/review-action",
  ".claude/skills/review-action",
  "pnpm-lock.yaml",
]);

const workflowSkip = classifyChangedFiles([".github/workflows/custom-review.yml"], {
  reviewWorkflowPath: ".github/workflows/custom-review.yml",
});
assert.equal(workflowSkip.shouldReview, false);
assert.equal(workflowSkip.reason, "review workflow changed");

const lowSignal = classifyChangedFiles(["CHANGELOG.md", "image.png"]);
assert.equal(lowSignal.shouldReview, false);
assert.equal(lowSignal.reason, "only low-signal files changed");

const safety = safetyReview(workflow);
assert.deepEqual(safety.ignoredSecrets, ["claude_code_oauth_token"]);
assert.equal(safety.unmappedSettings.length, 0);
assert.ok(safety.safetyOverrides.some((entry) => entry.includes("prompt")));
assert.ok(safety.safetyOverrides.some((entry) => entry.includes("claude_args")));

const multiSecretSafety = safetyReview({
  family: "claude",
  action: "anthropics/claude-code-action",
  with: {
    claude_code_oauth_token: "${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}",
    prompt: "${{ secrets.REVIEW_PROMPT }}",
  },
});
assert.deepEqual(multiSecretSafety.ignoredSecrets, ["claude_code_oauth_token", "prompt"]);

const unsupportedClaudeArgsSafety = safetyReview({
  family: "claude",
  action: "anthropics/claude-code-action",
  with: {
    claude_args: "--max-turns 25\n--model claude-opus-4-7",
  },
});
assert.deepEqual(unsupportedClaudeArgsSafety.unmappedSettings, ["claude_args.--model"]);
assert.match(unsupportedClaudeArgsSafety.haltingIssues[0], /--model/);

const claudePlan = planInvocation(workflow, context);
assert.equal(claudePlan.command, "claude");
assert.equal(claudePlan.args[0], "--print");
assert.ok(claudePlan.args.includes("--disallowedTools"));
assert.deepEqual(claudePlan.args.slice(claudePlan.args.indexOf("--max-turns"), claudePlan.args.indexOf("--max-turns") + 2), [
  "--max-turns",
  "25",
]);
const allowedTools = claudePlan.args[claudePlan.args.indexOf("--allowedTools") + 1];
assert.ok(!allowedTools.includes("Bash(gh pr comment:*)"));
const claudePrompt = claudePlan.args.at(-1);
assert.ok(claudePrompt.includes("PR 110 in patinaproject/skills"));
assert.ok(!claudePrompt.includes("${{ env.PR_NUMBER }}"));
assert.ok(!claudePrompt.includes("${{ env.PR_REPO }}"));

const codexPlan = planInvocation(
  {
    family: "codex",
    with: {
      model: "gpt-5.2",
      prompt: "Review this diff.",
      reasoning_effort: "high",
    },
  },
  context,
);
assert.equal(codexPlan.command, "codex");
assert.deepEqual(codexPlan.args.slice(0, 4), ["review", "--base", "origin/main", "--uncommitted"]);
assert.equal(codexPlan.args.at(-1), "-");

console.log("OK: review-action parser, classifier, safety, and planner verified");
