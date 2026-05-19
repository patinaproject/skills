const fs = require("node:fs");
const path = require("node:path");

const SUPPORTED_ACTIONS = [
  {
    family: "claude",
    action: "anthropics/claude-code-action",
    commandFamily: "claude --print",
  },
  {
    family: "codex",
    action: "openai/codex-action",
    commandFamily: "codex review",
  },
];

function listWorkflowFiles(root) {
  const dir = path.join(root, ".github", "workflows");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => /\.ya?ml$/i.test(file))
    .map((file) => path.join(dir, file));
}

function countIndent(line) {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseWithBlock(lines, startIndex, stepIndent) {
  const withValues = {};
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const indent = countIndent(line);
    const trimmed = line.trim();

    if (index > startIndex && indent <= stepIndent && trimmed.startsWith("- ")) break;
    if (trimmed !== "with:") continue;

    const withIndent = indent;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const current = lines[cursor];
      if (!current.trim()) continue;
      const currentIndent = countIndent(current);
      const currentTrimmed = current.trim();
      if (currentIndent <= withIndent) break;

      const keyMatch = current.match(/^(\s*)([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
      if (!keyMatch) continue;

      const key = keyMatch[2];
      const value = keyMatch[3] || "";
      if (value.trim() === "|" || value.trim() === ">") {
        const blockIndent = currentIndent;
        const blockLines = [];
        cursor += 1;
        while (cursor < lines.length) {
          const blockLine = lines[cursor];
          if (blockLine.trim() && countIndent(blockLine) <= blockIndent) {
            cursor -= 1;
            break;
          }
          blockLines.push(blockLine.slice(Math.min(blockLine.length, blockIndent + 2)));
          cursor += 1;
        }
        withValues[key] = blockLines.join("\n").replace(/\s+$/, "");
      } else {
        withValues[key] = parseScalar(value);
      }
    }
    break;
  }
  return withValues;
}

function parseWorkflow(filePath, root) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    const usesMatch = line.match(/uses:\s*([^@\s#]+)(?:@([^\s#]+))?/);
    if (!usesMatch) return;

    const supported = SUPPORTED_ACTIONS.find((entry) => usesMatch[1] === entry.action);
    if (!supported) return;

    matches.push({
      ...supported,
      workflowPath: path.relative(root, filePath),
      actionRef: usesMatch[2] || "",
      with: parseWithBlock(lines, index + 1, countIndent(line)),
    });
  });

  return matches;
}

function detectReviewWorkflow(root) {
  const matches = listWorkflowFiles(root).flatMap((file) => parseWorkflow(file, root));
  if (matches.length === 0) {
    throw new Error("No supported AI review workflow found.");
  }
  if (matches.length > 1) {
    const names = matches.map((match) => `${match.workflowPath}:${match.action}`).join(", ");
    throw new Error(`Multiple supported AI review workflows found; choose one before local emulation: ${names}`);
  }
  return matches[0];
}

module.exports = { detectReviewWorkflow, SUPPORTED_ACTIONS };
