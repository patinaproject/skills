import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

const AXES = ["standards", "spec"];
const OID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;

class InputError extends Error {}

function requireObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError(`${name} must be an object`);
  }
  return value;
}

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new InputError(`${name} must be a nonempty string`);
  }
  return value;
}

function requireArray(value, name) {
  if (!Array.isArray(value)) {
    throw new InputError(`${name} must be an array`);
  }
  return value;
}

function parseJson(file, name) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new InputError(`${name} is not valid JSON: ${error.message}`);
  }
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!["--report", "--repo", "--criteria"].includes(flag) || !value) {
      throw new InputError("usage: check-identity.mjs --report <file> --repo <path> --criteria <file>");
    }
    if (values[flag]) {
      throw new InputError(`${flag} may appear only once`);
    }
    values[flag] = value;
  }
  for (const flag of ["--report", "--repo", "--criteria"]) {
    requireString(values[flag], flag);
  }
  return values;
}

function git(repo, args) {
  try {
    return execFileSync("git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new InputError(`git ${args.join(" ")} failed: ${detail}`);
  }
}

function repositoryIdentity(repo) {
  try {
    return git(repo, ["remote", "get-url", "origin"]);
  } catch {
    return `local:${realpathSync(repo)}`;
  }
}

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function axesFor(value, name) {
  const axes = requireArray(value, name);
  if (axes.length === 0 || new Set(axes).size !== axes.length || axes.some((axis) => !AXES.includes(axis))) {
    throw new InputError(`${name} must contain unique standards or spec values`);
  }
  return [...axes].sort();
}

function validateComparison(value, name) {
  const comparison = requireObject(value, name);
  requireString(comparison.repositoryIdentity, `${name}.repositoryIdentity`);
  requireString(comparison.intendedParentRef, `${name}.intendedParentRef`);
  for (const field of ["headOid", "parentTipOid", "mergeBaseOid"]) {
    if (!OID.test(comparison[field] || "")) {
      throw new InputError(`${name}.${field} must be a full Git object ID`);
    }
  }
  if (comparison.mode !== "committed") {
    throw new InputError(`${name}.mode must be committed`);
  }
  return comparison;
}

function sameComparison(left, right) {
  return ["repositoryIdentity", "headOid", "intendedParentRef", "parentTipOid", "mergeBaseOid", "mode"]
    .every((field) => left[field] === right[field]);
}

function resolveEvidence(base, value, name) {
  const location = requireString(value, name);
  const path = isAbsolute(location) ? location : resolve(base, location);
  if (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0) {
    return null;
  }
  return path;
}

function validateFinding(finding, axis, sources, name) {
  requireObject(finding, name);
  if (finding.axis !== axis) {
    throw new InputError(`${name}.axis must equal ${axis}`);
  }
  if (!["documentedViolation", "requirementFailure", "heuristic"].includes(finding.classification)) {
    throw new InputError(`${name}.classification is unknown`);
  }
  const sourceKey = requireString(finding.sourceKey, `${name}.sourceKey`);
  const source = sources.get(sourceKey);
  if (!source || !source.affects.includes(axis)) {
    throw new InputError(`${name}.sourceKey is not assigned to ${axis}`);
  }
  for (const field of ["criterionLocator", "citedText", "location", "semanticLocation", "evidence", "impact"]) {
    requireString(finding[field], `${name}.${field}`);
  }
  if (!DIGEST.test(finding.sourceDigest || "") || finding.sourceDigest !== source.contentDigest) {
    throw new InputError(`${name}.sourceDigest must match its criteria source`);
  }
  if (!DIGEST.test(finding.evidenceDigest || "")) {
    throw new InputError(`${name}.evidenceDigest must be a SHA-256 digest`);
  }
  if (finding.evidenceDigest !== sha256(finding.evidence)) {
    throw new InputError(`${name}.evidenceDigest must match its evidence`);
  }
  const tuple = {
    axis,
    evidenceDigest: finding.evidenceDigest,
    semanticLocation: finding.semanticLocation,
    sourceDigest: finding.sourceDigest,
    sourceKey,
  };
  if (finding.identity !== sha256(stableJson(tuple))) {
    throw new InputError(`${name}.identity does not match its stable finding tuple`);
  }
}

function readReport(reportPath) {
  const report = requireObject(parseJson(reportPath, "report"), "report");
  if (report.schemaVersion !== 1) {
    throw new InputError("report.schemaVersion must equal 1");
  }
  const comparison = validateComparison(report.comparison, "report.comparison");
  const criteria = requireObject(report.criteria, "report.criteria");
  if (criteria.digestAlgorithm !== "sha256") {
    throw new InputError("report.criteria.digestAlgorithm must equal sha256");
  }
  const reportDir = dirname(reportPath);
  const sources = new Map();
  const sourceValues = requireArray(criteria.sources, "report.criteria.sources");
  if (sourceValues.length === 0) {
    throw new InputError("report.criteria.sources must not be empty");
  }
  for (const [index, value] of sourceValues.entries()) {
    const name = `report.criteria.sources[${index}]`;
    const source = requireObject(value, name);
    const sourceKey = requireString(source.sourceKey, `${name}.sourceKey`);
    if (sources.has(sourceKey)) {
      throw new InputError(`duplicate report sourceKey ${sourceKey}`);
    }
    requireString(source.origin, `${name}.origin`);
    requireString(source.acceptanceBasis, `${name}.acceptanceBasis`);
    if (!DIGEST.test(source.contentDigest || "")) {
      throw new InputError(`${name}.contentDigest must be a SHA-256 digest`);
    }
    source.affects = axesFor(source.affects, `${name}.affects`);
    source.snapshotPath = resolveEvidence(reportDir, source.snapshotLocation, `${name}.snapshotLocation`);
    sources.set(sourceKey, source);
  }
  const axes = requireObject(report.axes, "report.axes");
  for (const axis of AXES) {
    requireObject(axes[axis], `report.axes.${axis}`);
    if (!["complete", "incomplete"].includes(axes[axis].status)) {
      throw new InputError(`report.axes.${axis}.status is unknown`);
    }
    if (axes[axis].status === "incomplete") {
      requireString(axes[axis].reason, `report.axes.${axis}.reason`);
      requireArray(axes[axis].availableEvidence, `report.axes.${axis}.availableEvidence`);
      continue;
    }
    requireString(axes[axis].reviewerSession, `report.axes.${axis}.reviewerSession`);
    validateComparison(axes[axis].examinedComparison, `report.axes.${axis}.examinedComparison`);
    const examined = requireArray(axes[axis].examinedSources, `report.axes.${axis}.examinedSources`);
    for (const [index, source] of examined.entries()) {
      requireString(source.sourceKey, `report.axes.${axis}.examinedSources[${index}].sourceKey`);
      if (!DIGEST.test(source.contentDigest || "")) {
        throw new InputError(`report.axes.${axis}.examinedSources[${index}].contentDigest must be a SHA-256 digest`);
      }
    }
    const execution = requireObject(axes[axis].execution, `report.axes.${axis}.execution`);
    requireString(execution.assignedRoute, `report.axes.${axis}.execution.assignedRoute`);
    requireString(execution.observedRouteEvidence, `report.axes.${axis}.execution.observedRouteEvidence`);
    requireString(execution.transcriptLocation, `report.axes.${axis}.execution.transcriptLocation`);
    for (const field of ["comparisonReads", "sourceReads", "coverage"]) {
      requireArray(execution[field], `report.axes.${axis}.execution.${field}`);
    }
    for (const [index, finding] of requireArray(axes[axis].findings, `report.axes.${axis}.findings`).entries()) {
      validateFinding(finding, axis, sources, `report.axes.${axis}.findings[${index}]`);
    }
  }
  if (axes.standards.status === "complete" && axes.spec.status === "complete" &&
      axes.standards.reviewerSession === axes.spec.reviewerSession) {
    throw new InputError("complete axes must use distinct reviewer sessions");
  }
  requireObject(report.excludedWorkingChanges, "report.excludedWorkingChanges");
  for (const field of ["staged", "unstaged", "untracked"]) {
    if (typeof report.excludedWorkingChanges[field] !== "boolean") {
      throw new InputError(`report.excludedWorkingChanges.${field} must be boolean`);
    }
  }
  return { report, comparison, sources, axes, reportDir };
}

function readCurrentCriteria(criteriaPath) {
  const criteria = requireObject(parseJson(criteriaPath, "criteria"), "criteria");
  if (criteria.schemaVersion !== 1) {
    throw new InputError("criteria.schemaVersion must equal 1");
  }
  const base = dirname(criteriaPath);
  const sources = new Map();
  const sourceValues = requireArray(criteria.sources, "criteria.sources");
  if (sourceValues.length === 0) {
    throw new InputError("criteria.sources must not be empty");
  }
  for (const [index, value] of sourceValues.entries()) {
    const name = `criteria.sources[${index}]`;
    const source = requireObject(value, name);
    const sourceKey = requireString(source.sourceKey, `${name}.sourceKey`);
    if (sources.has(sourceKey)) {
      throw new InputError(`duplicate current sourceKey ${sourceKey}`);
    }
    const affects = axesFor(source.affects, `${name}.affects`);
    const snapshotPath = resolveEvidence(base, source.snapshotPath, `${name}.snapshotPath`);
    if (!snapshotPath) {
      throw new InputError(`${name}.snapshotPath does not name a readable file`);
    }
    sources.set(sourceKey, {
      affects,
      contentDigest: sha256(readFileSync(snapshotPath)),
      snapshotPath,
    });
  }
  return sources;
}

function inspectRepository(repoArg, intendedParentRef) {
  const repo = realpathSync(repoArg);
  const root = realpathSync(git(repo, ["rev-parse", "--show-toplevel"]));
  if (repo !== root) {
    throw new InputError(`--repo must be the repository root: ${root}`);
  }
  const headOid = git(repo, ["rev-parse", "--verify", "HEAD^{commit}"]);
  const parentTipOid = git(repo, ["rev-parse", "--verify", `${intendedParentRef}^{commit}`]);
  const mergeBaseOid = git(repo, ["merge-base", parentTipOid, headOid]);
  const status = git(repo, ["status", "--porcelain=v1", "--untracked-files=all"]);
  let diffEmpty = false;
  try {
    execFileSync("git", ["-C", repo, "--no-pager", "-c", "diff.external=", "-c", "diff.trustExitCode=false", "diff", "--quiet", "--no-ext-diff", "--no-textconv", mergeBaseOid, headOid], {
      stdio: "ignore",
    });
    diffEmpty = true;
  } catch (error) {
    if (error.status !== 1) {
      throw new InputError("git diff identity check failed");
    }
  }
  return {
    comparison: {
      repositoryIdentity: repositoryIdentity(repo),
      headOid,
      intendedParentRef,
      parentTipOid,
      mergeBaseOid,
      mode: "committed",
    },
    dirty: status.length > 0,
    diffEmpty,
  };
}

function addReason(reasons, affectedAxes, code, message, axes = AXES) {
  reasons.push({ code, message });
  for (const axis of axes) {
    affectedAxes.add(axis);
  }
}

function compareSources(reportSources, currentSources, reasons, affectedAxes) {
  const keys = new Set([...reportSources.keys(), ...currentSources.keys()]);
  for (const key of [...keys].sort()) {
    const prior = reportSources.get(key);
    const current = currentSources.get(key);
    if (!prior || !current) {
      const axes = prior?.affects || current?.affects || AXES;
      addReason(reasons, affectedAxes, "criteria-source-set-changed", `criteria source ${key} was ${prior ? "removed" : "added"}`, axes);
      continue;
    }
    const axes = [...new Set([...prior.affects, ...current.affects])];
    if (prior.affects.join(",") !== current.affects.join(",")) {
      addReason(reasons, affectedAxes, "criteria-axis-map-changed", `criteria source ${key} changed affected axes`, axes);
    }
    if (prior.contentDigest !== current.contentDigest) {
      addReason(reasons, affectedAxes, "criteria-content-changed", `criteria source ${key} changed content`, axes);
    }
    if (!prior.snapshotPath || sha256(readFileSync(prior.snapshotPath)) !== prior.contentDigest) {
      addReason(reasons, affectedAxes, "reviewed-snapshot-missing", `reviewed snapshot ${key} is missing or changed`, prior.affects);
    }
  }
}

function checkAxis(axis, state, context, reasons, affectedAxes) {
  if (state.status === "incomplete") {
    addReason(reasons, affectedAxes, "axis-incomplete", `${axis} review is incomplete: ${state.reason}`, [axis]);
    return;
  }
  if (!sameComparison(state.examinedComparison, context.comparison)) {
    addReason(reasons, affectedAxes, "axis-comparison-mismatch", `${axis} did not record the report comparison`, [axis]);
  }
  const expected = [...context.sources.entries()]
    .filter(([, source]) => source.affects.includes(axis))
    .map(([sourceKey, source]) => `${sourceKey}\0${source.contentDigest}`)
    .sort();
  if (expected.length === 0) {
    addReason(reasons, affectedAxes, "axis-source-missing", `${axis} has no accepted criteria source`, [axis]);
  }
  const examined = state.examinedSources
    .map((source) => `${source.sourceKey}\0${source.contentDigest}`)
    .sort();
  if (JSON.stringify(expected) !== JSON.stringify(examined)) {
    addReason(reasons, affectedAxes, "axis-source-mismatch", `${axis} examined sources do not match its assigned criteria`, [axis]);
  }
  const execution = state.execution;
  for (const [field, label] of [["observedRouteEvidence", "route evidence"], ["transcriptLocation", "transcript"]]) {
    if (!resolveEvidence(context.reportDir, execution[field], `report.axes.${axis}.execution.${field}`)) {
      addReason(reasons, affectedAxes, "execution-artifact-missing", `${axis} ${label} is missing`, [axis]);
    }
  }
  const readKinds = new Set();
  for (const read of execution.comparisonReads) {
    const kind = requireString(read.kind, `report.axes.${axis}.execution.comparisonReads.kind`);
    const artifact = resolveEvidence(context.reportDir, read.artifactPath, `report.axes.${axis}.execution.comparisonReads.artifactPath`);
    readKinds.add(kind);
    if (!artifact) {
      addReason(reasons, affectedAxes, "comparison-artifact-missing", `${axis} ${kind} artifact is missing`, [axis]);
    }
  }
  const requiredKinds = context.diffEmpty ? ["merge-base", "diff", "log"] : ["merge-base", "diff", "log", "show"];
  for (const kind of requiredKinds) {
    if (!readKinds.has(kind)) {
      addReason(reasons, affectedAxes, "comparison-read-missing", `${axis} lacks a ${kind} read`, [axis]);
    }
  }
  for (const field of ["sourceReads", "coverage"]) {
    const records = new Map();
    for (const record of execution[field]) {
      const sourceKey = requireString(record.sourceKey, `report.axes.${axis}.execution.${field}.sourceKey`);
      const artifact = resolveEvidence(context.reportDir, record.artifactPath, `report.axes.${axis}.execution.${field}.artifactPath`);
      if (artifact) {
        records.set(sourceKey, artifact);
      }
    }
    for (const key of expected.map((entry) => entry.split("\0")[0])) {
      if (!records.has(key)) {
        addReason(reasons, affectedAxes, `${field}-missing`, `${axis} lacks ${field} evidence for ${key}`, [axis]);
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = realpathSync(args["--report"]);
  const criteriaPath = realpathSync(args["--criteria"]);
  const parsed = readReport(reportPath);
  const currentSources = readCurrentCriteria(criteriaPath);
  const observed = inspectRepository(args["--repo"], parsed.comparison.intendedParentRef);
  const reasons = [];
  const affectedAxes = new Set();

  if (!sameComparison(parsed.comparison, observed.comparison)) {
    addReason(reasons, affectedAxes, "comparison-changed", "repository, head, parent, or merge-base no longer matches the report");
  }
  if (observed.dirty) {
    addReason(reasons, affectedAxes, "working-tree-dirty", "the publication candidate has staged, unstaged, or untracked changes");
  }
  compareSources(parsed.sources, currentSources, reasons, affectedAxes);
  const context = { ...parsed, diffEmpty: observed.diffEmpty };
  for (const axis of AXES) {
    checkAxis(axis, parsed.axes[axis], context, reasons, affectedAxes);
  }

  if (reasons.length > 0) {
    process.stdout.write(`${JSON.stringify({ valid: false, affectedAxes: AXES.filter((axis) => affectedAxes.has(axis)), reasons }, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const axisSourceDigests = Object.fromEntries(AXES.map((axis) => [
    axis,
    [...parsed.sources.entries()]
      .filter(([, source]) => source.affects.includes(axis))
      .map(([sourceKey, source]) => ({ sourceKey, contentDigest: source.contentDigest })),
  ]));
  process.stdout.write(`${JSON.stringify({ valid: true, affectedAxes: [], reasons: [], comparison: observed.comparison, axisSourceDigests }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ error: message })}\n`);
  process.exitCode = 2;
}
