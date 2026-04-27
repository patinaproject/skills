#!/usr/bin/env node

const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const remote = process.argv.includes("--remote");
const semverTag = /^v(\d+\.\d+\.\d+)$/;

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function fail(message) {
  throw new Error(message);
}

function normalizeCodexRepo(plugin) {
  const source = plugin.source || {};
  if (source.source !== "url") {
    fail(`Codex plugin ${plugin.name} must use source=url`);
  }
  if (
    !source.url ||
    !source.url.startsWith("https://github.com/") ||
    !source.url.endsWith(".git")
  ) {
    fail(`Codex plugin ${plugin.name} has invalid source URL: ${source.url}`);
  }
  return source.url.replace("https://github.com/", "").replace(/\.git$/, "");
}

function normalizeClaudeRepo(plugin) {
  const source = plugin.source || {};
  if (source.source !== "github") {
    fail(`Claude plugin ${plugin.name} must use source=github`);
  }
  if (!source.repo || !/^[^/]+\/[^/]+$/.test(source.repo)) {
    fail(`Claude plugin ${plugin.name} has invalid source repo: ${source.repo}`);
  }
  return source.repo;
}

function assertNoDuplicates(kind, plugins) {
  const counts = new Map();
  for (const plugin of plugins) {
    counts.set(plugin.name, (counts.get(plugin.name) || 0) + 1);
  }
  const duplicates = [...counts].filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    fail(
      `${kind} marketplace has duplicate plugin names: ${duplicates
        .map(([name]) => name)
        .join(", ")}`
    );
  }
}

function assertRefs(kind, plugins) {
  for (const plugin of plugins) {
    if (!semverTag.test(plugin.source?.ref || "")) {
      fail(
        `${kind} plugin ${plugin.name} ref is not an explicit vX.Y.Z tag: ${plugin.source?.ref}`
      );
    }
  }
}

function apiJson(repo, ref, path) {
  const content = execFileSync(
    "gh",
    [
      "api",
      "-X",
      "GET",
      `repos/${repo}/contents/${path}`,
      "-f",
      `ref=${ref}`,
      "--jq",
      ".content"
    ],
    { encoding: "utf8" }
  );
  return JSON.parse(
    Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf8")
  );
}

function assertRemoteManifest(plugin, repo, manifestPath, expectedVersion) {
  const manifest = apiJson(repo, plugin.source.ref, manifestPath);
  if (manifest.name !== plugin.name) {
    fail(
      `${repo}@${plugin.source.ref} ${manifestPath} name=${manifest.name}; expected ${plugin.name}`
    );
  }
  if (manifest.version !== expectedVersion) {
    fail(
      `${repo}@${plugin.source.ref} ${manifestPath} version=${manifest.version}; expected ${expectedVersion}`
    );
  }
}

function assertRemotePackage(plugin, repo, expectedVersion) {
  const pkg = apiJson(repo, plugin.source.ref, "package.json");
  if (pkg.name !== plugin.name) {
    fail(
      `${repo}@${plugin.source.ref} package.json name=${pkg.name}; expected ${plugin.name}`
    );
  }
  if (pkg.version !== expectedVersion) {
    fail(
      `${repo}@${plugin.source.ref} package.json version=${pkg.version}; expected ${expectedVersion}`
    );
  }
}

const codex = readJson(".agents/plugins/marketplace.json").plugins;
const claude = readJson(".claude-plugin/marketplace.json").plugins;

assertNoDuplicates("Codex", codex);
assertNoDuplicates("Claude", claude);
assertRefs("Codex", codex);
assertRefs("Claude", claude);

const codexByName = new Map(codex.map((plugin) => [plugin.name, plugin]));
const claudeByName = new Map(claude.map((plugin) => [plugin.name, plugin]));

for (const name of new Set([...codexByName.keys(), ...claudeByName.keys()])) {
  const codexPlugin = codexByName.get(name);
  const claudePlugin = claudeByName.get(name);
  if (!codexPlugin || !claudePlugin) {
    fail(`Plugin ${name} must be present in both Codex and Claude marketplaces`);
  }

  const codexRepo = normalizeCodexRepo(codexPlugin);
  const claudeRepo = normalizeClaudeRepo(claudePlugin);
  if (codexRepo !== claudeRepo) {
    fail(
      `Plugin ${name} repo mismatch: Codex=${codexRepo}, Claude=${claudeRepo}`
    );
  }
  if (codexPlugin.source.ref !== claudePlugin.source.ref) {
    fail(
      `Plugin ${name} ref mismatch: Codex=${codexPlugin.source.ref}, Claude=${claudePlugin.source.ref}`
    );
  }

  if (remote) {
    const expectedVersion = codexPlugin.source.ref.match(semverTag)[1];
    assertRemoteManifest(
      codexPlugin,
      codexRepo,
      ".codex-plugin/plugin.json",
      expectedVersion
    );
    assertRemoteManifest(
      claudePlugin,
      claudeRepo,
      ".claude-plugin/plugin.json",
      expectedVersion
    );
    assertRemotePackage(codexPlugin, codexRepo, expectedVersion);
  }
}

console.log(`Marketplace validation passed for ${codex.length} plugin(s).`);
