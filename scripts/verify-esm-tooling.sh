#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(packageJson.type, "module", "package.json must declare ESM mode");

await access("scripts/verify-esm-tooling.sh", constants.X_OK);

const commitizenConfig = JSON.parse(await readFile("commitizen.config.json", "utf8"));
assert.equal(typeof commitizenConfig, "object", "commitizen config must be JSON data");

const commitlintConfig = await import("./commitlint.config.js");
assert.equal(typeof commitlintConfig.default, "object", "commitlint config must export a default object");

const lintStagedConfig = await import("./.lintstagedrc.js");
assert.equal(typeof lintStagedConfig.default, "object", "lint-staged config must export a default object");

await assert.rejects(
  access(".lintstagedrc.cjs"),
  "lint-staged config should use the package ESM module type"
);

await assert.rejects(
  access("commitizen.config.js"),
  "commitizen config should be JSON because cz-customizable requires it from CommonJS"
);
NODE

echo "OK: ESM tooling assertions passed"
