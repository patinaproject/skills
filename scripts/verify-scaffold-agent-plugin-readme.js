#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const templatePath = path.join(
  repoRoot,
  "skills/scaffold-repository/templates/agent-plugin/README.md.tmpl",
);

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
const rendered = renderTemplate(template, values);

assertNotIncludes(rendered, "{{", "rendered README");
assertIncludes(rendered, "/workflow-kit:issue-router", "Claude invocation");
assertNotIncludes(rendered, "/workflow-kit:workflow-kit", "Claude invocation");
assertIncludes(
  rendered,
  "[`skills/issue-router/SKILL.md`](./skills/issue-router/SKILL.md)",
  "Related skill link",
);
assertIncludes(rendered, ".cursor/rules/workflow-kit.mdc", "Cursor rule path");

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
