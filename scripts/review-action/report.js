function listLines(items, empty = "- None") {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : empty;
}

function renderPlanReport(plan) {
  return [
    "## Local Review Action Plan",
    "",
    `Workflow: ${plan.workflow.workflowPath}`,
    `Action: ${plan.workflow.action}${plan.workflow.actionRef ? `@${plan.workflow.actionRef}` : ""}`,
    `Command family: ${plan.workflow.commandFamily}`,
    `Local command: ${plan.invocation.displayCommand}`,
    "",
    "## Diff Scope",
    "",
    `Branch: ${plan.context.branch}`,
    `Base: origin/${plan.context.defaultBranch} (${plan.context.baseSha})`,
    `Head: ${plan.context.headSha}`,
    `Uncommitted changes present: ${plan.context.dirty ? "yes" : "no"}`,
    "",
    "## Changed Files",
    "",
    listLines(plan.context.changedFiles),
    "",
    "## Skip Classification",
    "",
    `Should review: ${plan.context.classification.shouldReview ? "yes" : "no"}`,
    `Reason: ${plan.context.classification.reason}`,
    "Reviewable files:",
    listLines(plan.context.classification.reviewableFiles),
    "Skipped files:",
    listLines(plan.context.classification.skippedFiles),
    "",
    "## Translation Notes",
    "",
    `Ignored secret-backed settings: ${plan.safety.ignoredSecrets.join(", ") || "none"}`,
    `Unmapped settings: ${plan.safety.unmappedSettings.join(", ") || "none"}`,
    "Safety overrides:",
    listLines(plan.safety.safetyOverrides),
  ].join("\n");
}

function renderOutputReport(plan, output) {
  return [
    renderPlanReport(plan),
    "",
    "## Review Output",
    "",
    output || "(local CLI produced no output)",
  ].join("\n");
}

module.exports = { renderOutputReport, renderPlanReport };
