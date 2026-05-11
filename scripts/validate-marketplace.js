#!/usr/bin/env node
// validate-marketplace.js — Validates Patina Project marketplace manifests.
//
// Modes:
//   (default)  Release mode: validates .agents/plugins/marketplace.json and
//              .claude-plugin/marketplace.json. Enforces vX.Y.Z refs, rejects
//              the pre-rename "bootstrap" slug, and rejects standalone-skill
//              slugs in released manifests.
//   --dev      Dev mode: validates *.local.json overlays. Asserts path sources
//              resolve to plugin directories; skips vX.Y.Z check.
//   --remote   Remote mode: additionally reads in-tree plugin manifests to
//              assert each plugin's name and version match the marketplace ref.
//              Network-free (reads HEAD files, not upstream).

const fs = require("node:fs");
const path = require("node:path");

const devMode = process.argv.includes("--dev");
const remoteMode = process.argv.includes("--remote");

const semverTag = /^v(\d+\.\d+\.\d+)$/;

// Slugs that must NEVER appear as marketplace plugin entries.
// These are standalone skills distributed via .agents/skills/ directly.
const STANDALONE_SKILL_SLUGS = ["office-hours", "find-skills"];

// The pre-rename slug must never appear in a released manifest.
// Defense-in-depth: catches accidental revert of the W9 rename.
const BANNED_RELEASED_SLUGS = ["bootstrap"];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    fail(`Cannot read/parse ${filePath}: ${err.message}`);
  }
}

function fail(message) {
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// Source normalizers
// ---------------------------------------------------------------------------

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

function normalizeCodexPath(plugin) {
  const source = plugin.source || {};
  if (source.source !== "path") {
    fail(`Codex dev plugin ${plugin.name} must use source=path`);
  }
  if (!source.path) {
    fail(`Codex dev plugin ${plugin.name} missing source.path`);
  }
  return source.path;
}

function normalizeClaudePath(plugin) {
  const source = plugin.source || {};
  if (source.source !== "path") {
    fail(`Claude dev plugin ${plugin.name} must use source=path`);
  }
  if (!source.path) {
    fail(`Claude dev plugin ${plugin.name} missing source.path`);
  }
  return source.path;
}

// ---------------------------------------------------------------------------
// Shared assertions
// ---------------------------------------------------------------------------

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

function assertNoBannedReleasedSlugs(kind, plugins) {
  for (const plugin of plugins) {
    if (BANNED_RELEASED_SLUGS.includes(plugin.name)) {
      fail(
        `${kind} released manifest contains banned slug "${plugin.name}". ` +
          `This slug was renamed (bootstrap -> scaffold-repository). ` +
          `Check for an accidental revert.`
      );
    }
  }
}

function assertNoStandaloneSkillSlugs(kind, plugins) {
  for (const plugin of plugins) {
    if (STANDALONE_SKILL_SLUGS.includes(plugin.name)) {
      fail(
        `${kind} released manifest contains standalone-skill slug "${plugin.name}". ` +
          `Standalone skills are distributed via .agents/skills/, not as marketplace entries.`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Remote (in-tree) verification helpers
// ---------------------------------------------------------------------------

function assertInTreeManifest(plugin, pluginsDir, manifestRelPath, expectedVersion) {
  const manifestPath = path.join(pluginsDir, plugin.name, manifestRelPath);
  if (!fs.existsSync(manifestPath)) {
    fail(`In-tree manifest not found: ${manifestPath}`);
  }
  const manifest = readJson(manifestPath);
  if (manifest.name !== plugin.name) {
    fail(
      `${manifestPath} name="${manifest.name}"; expected "${plugin.name}"`
    );
  }
  if (manifest.version !== expectedVersion) {
    fail(
      `${manifestPath} version="${manifest.version}"; expected "${expectedVersion}" ` +
        `(from marketplace ref ${plugin.source.ref})`
    );
  }
}

function assertInTreePackage(plugin, pluginsDir, expectedVersion) {
  const pkgPath = path.join(pluginsDir, plugin.name, "package.json");
  if (!fs.existsSync(pkgPath)) {
    fail(`In-tree package.json not found: ${pkgPath}`);
  }
  const pkg = readJson(pkgPath);
  if (pkg.name !== plugin.name) {
    fail(
      `${pkgPath} name="${pkg.name}"; expected "${plugin.name}"`
    );
  }
  if (pkg.version !== expectedVersion) {
    fail(
      `${pkgPath} version="${pkg.version}"; expected "${expectedVersion}" ` +
        `(from marketplace ref ${plugin.source.ref})`
    );
  }
}

// ---------------------------------------------------------------------------
// Dev-mode validation
// ---------------------------------------------------------------------------

function validateDevOverlays() {
  const codexPath = ".agents/plugins/marketplace.local.json";
  const claudePath = ".claude-plugin/marketplace.local.json";

  if (!fs.existsSync(codexPath)) {
    fail(`Dev overlay not found: ${codexPath}`);
  }
  if (!fs.existsSync(claudePath)) {
    fail(`Dev overlay not found: ${claudePath}`);
  }

  const codex = readJson(codexPath).plugins;
  const claude = readJson(claudePath).plugins;
  const codexDir = path.dirname(path.resolve(codexPath));
  const claudeDir = path.dirname(path.resolve(claudePath));

  assertNoDuplicates("Codex dev", codex);
  assertNoDuplicates("Claude dev", claude);

  // Validate each Codex path source resolves to a dir with .codex-plugin/plugin.json
  // Path is relative to the manifest file's directory.
  for (const plugin of codex) {
    const relPath = normalizeCodexPath(plugin);
    const absPath = path.resolve(codexDir, relPath);
    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) {
      fail(
        `Codex dev plugin ${plugin.name}: path "${relPath}" does not resolve to a directory`
      );
    }
    const codexManifest = path.join(absPath, ".codex-plugin", "plugin.json");
    if (!fs.existsSync(codexManifest)) {
      fail(
        `Codex dev plugin ${plugin.name}: no .codex-plugin/plugin.json at "${absPath}"`
      );
    }
  }

  // Validate each Claude path source resolves to a dir with .claude-plugin/plugin.json
  // Path is relative to the manifest file's directory.
  for (const plugin of claude) {
    const relPath = normalizeClaudePath(plugin);
    const absPath = path.resolve(claudeDir, relPath);
    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) {
      fail(
        `Claude dev plugin ${plugin.name}: path "${relPath}" does not resolve to a directory`
      );
    }
    const claudeManifest = path.join(absPath, ".claude-plugin", "plugin.json");
    if (!fs.existsSync(claudeManifest)) {
      fail(
        `Claude dev plugin ${plugin.name}: no .claude-plugin/plugin.json at "${absPath}"`
      );
    }
  }

  console.log(`Dev overlay validation passed for ${codex.length} Codex + ${claude.length} Claude plugin(s).`);
}

// ---------------------------------------------------------------------------
// Release-mode validation
// ---------------------------------------------------------------------------

function validateRelease() {
  const codex = readJson(".agents/plugins/marketplace.json").plugins;
  const claude = readJson(".claude-plugin/marketplace.json").plugins;

  assertNoDuplicates("Codex", codex);
  assertNoDuplicates("Claude", claude);

  // Release-mode deny rules
  assertNoBannedReleasedSlugs("Codex", codex);
  assertNoBannedReleasedSlugs("Claude", claude);
  assertNoStandaloneSkillSlugs("Codex", codex);
  assertNoStandaloneSkillSlugs("Claude", claude);

  assertRefs("Codex", codex);
  assertRefs("Claude", claude);

  // Defense-in-depth: reject if any *.local.json is placed where released manifests live
  const localCodex = ".agents/plugins/marketplace.local.json";
  const localClaude = ".claude-plugin/marketplace.local.json";
  // These are allowed at their canonical paths (they're tracked for dev use).
  // The leak risk is if someone copies them into a release-eligible location
  // like plugins/<name>/marketplace.local.json. We can't enumerate all possible
  // leak targets here, but the .gitattributes export-ignore rules and the
  // release-please extra-files config provide the primary defense.
  // This validator checks the most obvious risk: that the released manifest
  // files themselves don't have 'local' content (path sources).
  const codexSources = codex.map((p) => p.source?.source);
  const claudeSources = claude.map((p) => p.source?.source);
  if (codexSources.includes("path")) {
    fail(
      'Codex released manifest contains a "path" source — dev overlay leaked into release manifest.'
    );
  }
  if (claudeSources.includes("path")) {
    fail(
      'Claude released manifest contains a "path" source — dev overlay leaked into release manifest.'
    );
  }

  // Scan the working tree for any marketplace.local.json placed outside the two
  // canonical overlay paths. A stray overlay at e.g. plugins/<name>/marketplace.local.json
  // would be included in a release artifact and could override production marketplace
  // entries for consumers who happen to land on an overlaid path.
  const CANONICAL_OVERLAY_PATHS = new Set([
    path.normalize(".agents/plugins/marketplace.local.json"),
    path.normalize(".claude-plugin/marketplace.local.json"),
  ]);
  const SCAN_DIRS = ["plugins", "packages", ".agents", ".claude-plugin", "scripts", "docs", ".github"];
  function findMisplacedOverlays(dirs) {
    const found = [];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      function walk(current) {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (entry.isFile() && entry.name === "marketplace.local.json") {
            const normalized = path.normalize(full);
            if (!CANONICAL_OVERLAY_PATHS.has(normalized)) {
              found.push(normalized);
            }
          }
        }
      }
      walk(dir);
    }
    return found;
  }
  const misplacedOverlays = findMisplacedOverlays(SCAN_DIRS);
  if (misplacedOverlays.length > 0) {
    fail(
      `Release mode detected marketplace.local.json outside canonical overlay paths:\n` +
        misplacedOverlays.map((p) => `  ${p}`).join("\n") +
        `\nCanonical paths: .agents/plugins/marketplace.local.json, .claude-plugin/marketplace.local.json\n` +
        `Remove the stray overlay(s) before releasing.`
    );
  }

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

    if (remoteMode) {
      const expectedVersion = codexPlugin.source.ref.match(semverTag)[1];
      const pluginsDir = "plugins";
      assertInTreeManifest(codexPlugin, pluginsDir, ".codex-plugin/plugin.json", expectedVersion);
      assertInTreeManifest(claudePlugin, pluginsDir, ".claude-plugin/plugin.json", expectedVersion);
      assertInTreePackage(codexPlugin, pluginsDir, expectedVersion);
    }
  }

  const modeLabel = remoteMode ? " (with --remote in-tree checks)" : "";
  console.log(`Marketplace validation passed${modeLabel} for ${codex.length} plugin(s).`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

try {
  if (devMode) {
    validateDevOverlays();
  } else {
    validateRelease();
  }
} catch (err) {
  console.error(`Validation FAILED: ${err.message}`);
  process.exit(1);
}
