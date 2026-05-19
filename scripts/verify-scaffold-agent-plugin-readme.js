#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const templatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/agent-plugin/README.md.tmpl",
);
const skillTemplatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/agent-plugin/skills/{{primary-skill-name}}/SKILL.md.tmpl",
);
const codexPluginTemplatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/agent-plugin/.codex-plugin/plugin.json.tmpl",
);
const corePackageTemplatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/core/package.json.tmpl",
);
const coreAgentsTemplatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/core/AGENTS.md.tmpl",
);
const coreGitignoreTemplatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/core/.gitignore.tmpl",
);
const coreInstallSkillsTemplatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/core/scripts/install-skills.mjs",
);
const coreUpdateSkillsTemplatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/core/scripts/update-skills.mjs",
);
const skillContractPath = path.join(repoRoot, "skills/scaffold-repository/SKILL.md");
const auditChecklistPath = path.join(repoRoot, "skills/scaffold-repository/audit-checklist.md");
const releaseFlowPath = path.join(repoRoot, "docs/release-flow.md");
const verifyWorkflowPath = path.join(repoRoot, ".github/workflows/verify.yml");

const values = {
  owner: "patinaproject",
  repo: "workflow-kit",
  "repo-description": "Workflow coordination test plugin.",
  "primary-skill-name": "issue-router",
};

function fail(message) {
  console.error(`verify-scaffold-agent-plugin-readme: ${message}`);
  process.exit(1);
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    fail(`${label}: expected to find ${JSON.stringify(expected)}`);
  }
}

function assertNotIncludes(content, unexpected, label) {
  if (content.includes(unexpected)) {
    fail(`${label}: did not expect to find ${JSON.stringify(unexpected)}`);
  }
}

function getSection(content, heading, nextHeading) {
  const start = content.indexOf(heading);
  if (start === -1) {
    fail(`missing section heading ${JSON.stringify(heading)}`);
  }

  const end = content.indexOf(nextHeading, start + heading.length);
  if (end === -1) {
    fail(`missing next section heading ${JSON.stringify(nextHeading)}`);
  }

  return content.slice(start, end);
}

function renderTemplate(template, replacements) {
  if (!replacements["primary-skill-name"]?.trim()) {
    throw new Error("primary-skill-name is required for agent-plugin README rendering");
  }

  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    if (!Object.hasOwn(replacements, key)) {
      return match;
    }

    return replacements[key];
  });
}

const template = fs.readFileSync(templatePath, "utf8");
const skillTemplate = fs.readFileSync(skillTemplatePath, "utf8");
const codexPluginTemplate = fs.readFileSync(codexPluginTemplatePath, "utf8");
const corePackageTemplate = fs.readFileSync(corePackageTemplatePath, "utf8");
const coreAgentsTemplate = fs.readFileSync(coreAgentsTemplatePath, "utf8");
const coreGitignoreTemplate = fs.readFileSync(coreGitignoreTemplatePath, "utf8");
const coreInstallSkillsTemplate = fs.readFileSync(coreInstallSkillsTemplatePath, "utf8");
const coreUpdateSkillsTemplate = fs.readFileSync(coreUpdateSkillsTemplatePath, "utf8");
const skillContract = fs.readFileSync(skillContractPath, "utf8");
const auditChecklist = fs.readFileSync(auditChecklistPath, "utf8");
const releaseFlow = fs.readFileSync(releaseFlowPath, "utf8");
const verifyWorkflow = fs.readFileSync(verifyWorkflowPath, "utf8");
const rendered = renderTemplate(template, values);
const renderedSkill = renderTemplate(skillTemplate, values);
const renderedCodexPlugin = renderTemplate(codexPluginTemplate, {
  ...values,
  "author-name": "Test Author",
  "author-email": "test@example.com",
  "author-handle": "test-author",
});
assertNotIncludes(rendered, "{{", "rendered README");
assertIncludes(rendered, "pnpm skills:install", "Consumer skill install wrapper");
assertIncludes(rendered, "pnpm skills:update", "Consumer skill update wrapper");
assertIncludes(rendered, "pnpm skills:list", "Consumer skill list wrapper");
assertNotIncludes(rendered, "obra/superpowers", "Retired Superpowers install source");
assertIncludes(rendered, "/workflow-kit:issue-router", "Claude invocation");
assertNotIncludes(rendered, "/workflow-kit:workflow-kit", "Claude invocation");
assertIncludes(
  rendered,
  "[`skills/issue-router/SKILL.md`](./skills/issue-router/SKILL.md)",
  "Related skill link",
);
assertIncludes(
  skillContract,
  "skills/{{primary-skill-name}}/SKILL.md",
  "Agent plugin emitted primary skill surface",
);
assertIncludes(
  skillContract,
  "required when `<is-agent-plugin>` is yes",
  "Primary skill prompt requirement",
);
assertIncludes(
  skillContract,
  "must collect `<primary-skill-name>` before rendering the README and primary skill starter",
  "Primary skill render requirement",
);
assertNotIncludes(skillContract, "obra/superpowers", "Skill contract retired Superpowers source");
assertIncludes(corePackageTemplate, "\"skills:install\"", "Core package skill install script");
assertIncludes(corePackageTemplate, "\"skills:update\"", "Core package skill update script");
assertIncludes(corePackageTemplate, "\"skills:list\"", "Core package skill list script");
assertIncludes(coreAgentsTemplate, "pnpm skills:install", "Core AGENTS skill install command");
assertIncludes(coreAgentsTemplate, "pnpm skills:update", "Core AGENTS skill update command");
assertIncludes(coreAgentsTemplate, "pnpm skills:list", "Core AGENTS skill list command");
assertIncludes(coreGitignoreTemplate, ".agents/skills/", "Generated Agents skill payload ignore");
assertIncludes(coreGitignoreTemplate, ".claude/skills/", "Generated Claude skill payload ignore");
assertIncludes(coreGitignoreTemplate, "skills-lock.json.bak", "Generated skill rollback backup ignore");
assertIncludes(coreInstallSkillsTemplate, "No skills-lock.json found", "Install no-lockfile no-op");
assertIncludes(coreInstallSkillsTemplate, "experimental_install", "Install read-only lockfile command");
assertIncludes(coreInstallSkillsTemplate, "--list", "Install list mode");
assertIncludes(coreUpdateSkillsTemplate, "npx --yes skills@latest add patinaproject/skills", "Update marketplace refresh command");
assertIncludes(coreUpdateSkillsTemplate, "pinPatinaRefs", "Update immutable ref pinning");
assertIncludes(coreUpdateSkillsTemplate, "needsImmutableRef", "Update re-pins mutable refs");
assertIncludes(coreUpdateSkillsTemplate, "experimental_install", "Update install verification");
assertIncludes(coreUpdateSkillsTemplate, "restoreLockfile", "Update rollback on failure");
assertNotIncludes(releaseFlow, "skills@1.5.6", "Release flow stale exact CLI version");
assertNotIncludes(verifyWorkflow, "skills@1.5.6", "Verify workflow stale exact CLI version");
assertIncludes(
  releaseFlow,
  "npx skills@latest add patinaproject/skills --skill scaffold-repository",
  "Release flow current single-skill example",
);
assertIncludes(
  releaseFlow,
  "npx skills@latest add patinaproject/skills#v1.0.0 --skill scaffold-repository",
  "Release flow current pinned single-skill example",
);
assertNotIncludes(coreAgentsTemplate, "obra/superpowers", "Core AGENTS retired Superpowers source");
assertIncludes(
  auditChecklist,
  "skills/<primary-skill-name>/SKILL.md",
  "Realignment primary skill check",
);
assertIncludes(
  auditChecklist,
  "`skills/.gitkeep` alone is stale for agent-plugin repos",
  "Realignment stale gitkeep check",
);
assertNotIncludes(auditChecklist, "obra/superpowers", "Audit checklist retired Superpowers source");
assertIncludes(rendered, ".cursor/rules/workflow-kit.mdc", "Cursor rule path");
assertNotIncludes(renderedSkill, "{{", "rendered primary skill starter");
assertIncludes(renderedSkill, "name: issue-router", "primary skill frontmatter");
assertIncludes(renderedSkill, "Use this skill to run the `workflow-kit` workflow.", "primary skill body");

const codexPlugin = JSON.parse(renderedCodexPlugin);
const defaultPrompt = codexPlugin.interface.defaultPrompt.join("\n");
assertIncludes(defaultPrompt, "$issue-router", "Codex plugin default prompt");
assertNotIncludes(defaultPrompt, "$workflow-kit", "Codex plugin default prompt");

const codexCliSection = getSection(
  rendered,
  "### OpenAI Codex CLI",
  "### OpenAI Codex App",
);
assertIncludes(
  codexCliSection,
  "codex plugin marketplace add patinaproject/skills",
  "Codex CLI marketplace registration",
);
assertIncludes(codexCliSection, "$issue-router", "Codex CLI prompt");
assertNotIncludes(codexCliSection, "$workflow-kit", "Codex CLI prompt");
assertIncludes(
  codexCliSection,
  "Install or enable `workflow-kit` from the registered Patina Project marketplace/plugin source.",
  "Codex CLI install guidance",
);

const marketplaceAddCommands = codexCliSection.match(/codex plugin marketplace add /g) ?? [];
if (marketplaceAddCommands.length !== 1) {
  fail(
    `Codex CLI marketplace registration: expected exactly one marketplace add command, found ${marketplaceAddCommands.length}`,
  );
}

assertNotIncludes(
  codexCliSection,
  "codex plugin marketplace add patinaproject/workflow-kit@v0.1.0",
  "Codex CLI generated plugin repo registration",
);
assertNotIncludes(codexCliSection, "codex plugin install", "Codex CLI unsupported install command");

const codexAppSection = getSection(
  rendered,
  "### OpenAI Codex App",
  "### GitHub Copilot",
);
assertIncludes(codexAppSection, "$issue-router", "Codex App prompt");
assertNotIncludes(codexAppSection, "$workflow-kit", "Codex App prompt");

try {
  renderTemplate(template, { ...values, "primary-skill-name": "" });
  fail("empty primary skill name should be rejected before rendering");
} catch (error) {
  if (!/primary-skill-name is required/.test(error.message)) {
    throw error;
  }
}

console.log("verify-scaffold-agent-plugin-readme: ok");
