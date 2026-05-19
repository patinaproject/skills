#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { classifyChangedFiles } = require("./review-action/classify");
const {
  changedFiles,
  currentBranch,
  defaultBranch,
  hasUncommittedChanges,
  headSha,
  mergeBase,
  prMetadata,
  repoRoot,
} = require("./review-action/git");
const { planInvocation } = require("./review-action/planner");
const { renderOutputReport, renderPlanReport } = require("./review-action/report");
const { safetyReview } = require("./review-action/safety");
const { detectReviewWorkflow } = require("./review-action/workflow-parser");

function parseArgs(argv) {
  return {
    planOnly: argv.includes("--plan-only"),
  };
}

function buildPlan() {
  const root = repoRoot();
  process.chdir(root);

  const workflow = detectReviewWorkflow(root);
  const defaultRef = defaultBranch();
  const baseSha = mergeBase(defaultRef);
  const files = changedFiles(baseSha);
  const classification = classifyChangedFiles(files, {
    reviewWorkflowPath: workflow.workflowPath,
  });
  const context = {
    baseSha,
    branch: currentBranch(),
    changedFiles: files,
    classification,
    defaultBranch: defaultRef,
    dirty: hasUncommittedChanges(),
    headSha: headSha(),
    pr: prMetadata(),
  };
  const safety = safetyReview(workflow);

  if (files.length === 0) {
    safety.haltingIssues.push("No branch changes found against the default-branch merge base.");
  }
  if (!classification.shouldReview) {
    safety.haltingIssues.push(`Workflow skip rule matched: ${classification.reason}.`);
  }

  const invocation = planInvocation(workflow, context);
  return { context, invocation, safety, workflow };
}

function ensureCli(command) {
  const result = spawnSync(command, ["--help"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`Required local CLI '${command}' is missing or unavailable.`);
  }
}

function runInvocation(invocation) {
  ensureCli(invocation.command);
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: "utf8",
    input: invocation.stdin || undefined,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  if (result.status !== 0) {
    throw new Error(`Local review command failed with exit ${result.status}.\n${output}`);
  }
  return output;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = buildPlan();

  if (plan.safety.haltingIssues.length > 0) {
    console.log(renderPlanReport(plan));
    console.error("\n## Halted\n");
    for (const issue of plan.safety.haltingIssues) console.error(`- ${issue}`);
    process.exit(1);
  }

  if (options.planOnly) {
    console.log(renderPlanReport(plan));
    return;
  }

  const output = runInvocation(plan.invocation);
  console.log(renderOutputReport(plan, output));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
