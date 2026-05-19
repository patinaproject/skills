const { localReviewInstruction } = require("./safety");

function extractClaudeArgs(rawArgs) {
  const args = [];
  const allowedMatch = rawArgs.match(/(?:--allowedTools|--allowed-tools)\s+([^\n]+)/);
  if (allowedMatch) {
    // Claude Code Action workflows in this repo use a simple comma-separated
    // list; preserve that contract while removing mutating local tools.
    const allowed = allowedMatch[1]
      .split(",")
      .map((tool) => tool.trim())
      .filter(Boolean)
      .filter((tool) => !/^Bash\(gh pr comment:/.test(tool))
      .filter((tool) => !/^(Edit|Write|MultiEdit)$/.test(tool));
    if (allowed.length > 0) args.push("--allowedTools", allowed.join(","));
  } else {
    args.push("--allowedTools", "Read,Bash(gh pr diff:*),Bash(gh pr view:*),Bash(git diff:*),Bash(git status:*)");
  }

  const maxTurns = rawArgs.match(/--max-turns\s+(\d+)/);
  if (maxTurns) args.push("--max-turns", maxTurns[1]);

  args.push(
    "--disallowedTools",
    "Edit,Write,MultiEdit,Bash(gh pr comment:*),Bash(gh api:*),Bash(git add:*),Bash(git commit:*),Bash(git push:*),Bash(git reset:*)",
  );
  args.push(
    "--append-system-prompt",
    "LOCAL REVIEW-ACTION MODE: terminal-only, read-only, no GitHub mutation, no file mutation.",
  );
  return args;
}

function normalizeHostedPrompt(prompt, context) {
  if (!prompt) return "Review the local branch diff.";

  return prompt
    .replaceAll("${{ env.PR_NUMBER }}", context.pr?.number ? String(context.pr.number) : "the current branch")
    .replaceAll("${{ env.PR_REPO }}", context.pr?.repository || "the current repository");
}

function planClaude(workflow, context) {
  // Keep the hosted prompt intact for fidelity; local no-mutation behavior is
  // enforced through the appended system prompt and disallowed tool list.
  const prompt = [localReviewInstruction(context), "", normalizeHostedPrompt(workflow.with.prompt, context)].join("\n");
  return {
    command: "claude",
    args: ["--print", ...extractClaudeArgs(workflow.with.claude_args || ""), prompt],
    displayCommand: "claude --print",
    stdin: null,
  };
}

function planCodex(workflow, context) {
  const prompt = [localReviewInstruction(context), "", normalizeHostedPrompt(workflow.with.prompt, context)].join("\n");
  const args = ["review", "--base", `origin/${context.defaultBranch}`];
  if (context.dirty) args.push("--uncommitted");
  if (workflow.with.model) args.push("-c", `model="${workflow.with.model}"`);
  if (workflow.with.reasoning_effort) args.push("-c", `model_reasoning_effort="${workflow.with.reasoning_effort}"`);
  args.push("-");
  return {
    command: "codex",
    args,
    displayCommand: "codex review --base origin/" + context.defaultBranch,
    stdin: prompt,
  };
}

function planInvocation(workflow, context) {
  if (workflow.family === "claude") return planClaude(workflow, context);
  if (workflow.family === "codex") return planCodex(workflow, context);
  throw new Error(`Unsupported workflow family '${workflow.family}'.`);
}

module.exports = { planInvocation };
