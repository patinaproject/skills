import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = realpathSync(execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim());
const checker = join(root, "plugins/engineering/skills/code-review/scripts/check-identity.mjs");
const work = mkdtempSync(join(tmpdir(), "code-review-identity-"));

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function makeFixture(name) {
  const base = join(work, name);
  const repo = join(base, "repo");
  const evidence = join(base, "evidence");
  mkdirSync(repo, { recursive: true });
  mkdirSync(evidence, { recursive: true });
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  writeFileSync(join(repo, "source.txt"), "base\n");
  git(repo, ["add", "source.txt"]);
  git(repo, ["commit", "-q", "-m", "base"]);
  git(repo, ["branch", "parent"]);
  writeFileSync(join(repo, "source.txt"), "head\n");
  git(repo, ["add", "source.txt"]);
  git(repo, ["commit", "-q", "-m", "head"]);

  const comparison = {
    repositoryIdentity: `local:${realpathSync(repo)}`,
    headOid: git(repo, ["rev-parse", "HEAD"]),
    intendedParentRef: "parent",
    parentTipOid: git(repo, ["rev-parse", "parent"]),
    mergeBaseOid: git(repo, ["merge-base", "parent", "HEAD"]),
    mode: "committed",
  };
  const sources = [
    {
      sourceKey: "standards-source",
      origin: "fixture:standards",
      acceptanceBasis: "fixture standard",
      snapshotLocation: "standards.md",
      contentDigest: digest("standard\n"),
      affects: ["standards"],
    },
    {
      sourceKey: "spec-source",
      origin: "fixture:spec",
      acceptanceBasis: "fixture requirement",
      snapshotLocation: "spec.md",
      contentDigest: digest("requirement\n"),
      affects: ["spec"],
    },
  ];
  writeFileSync(join(evidence, "standards.md"), "standard\n");
  writeFileSync(join(evidence, "spec.md"), "requirement\n");

  function axisResult(axis) {
    const source = sources.find((candidate) => candidate.affects.includes(axis));
    const axisDir = join(evidence, axis);
    mkdirSync(axisDir);
    for (const file of ["route.json", "transcript.jsonl", "merge-base.txt", "diff.txt", "log.txt", "show.txt", "source-read.txt", "coverage.json"]) {
      writeFileSync(join(axisDir, file), `${file}\n`);
    }
    return {
      status: "complete",
      reviewerSession: `${axis}-session`,
      examinedComparison: structuredClone(comparison),
      examinedSources: [{ sourceKey: source.sourceKey, contentDigest: source.contentDigest }],
      execution: {
        assignedRoute: "fixture-route",
        observedRouteEvidence: `${axis}/route.json`,
        transcriptLocation: `${axis}/transcript.jsonl`,
        comparisonReads: [
          { kind: "merge-base", artifactPath: `${axis}/merge-base.txt` },
          { kind: "diff", artifactPath: `${axis}/diff.txt` },
          { kind: "log", artifactPath: `${axis}/log.txt` },
          { kind: "show", artifactPath: `${axis}/show.txt` },
        ],
        sourceReads: [{ sourceKey: source.sourceKey, artifactPath: `${axis}/source-read.txt` }],
        coverage: [{ sourceKey: source.sourceKey, artifactPath: `${axis}/coverage.json` }],
      },
      findings: [],
    };
  }

  const report = {
    schemaVersion: 1,
    comparison,
    criteria: { digestAlgorithm: "sha256", sources },
    axes: { standards: axisResult("standards"), spec: axisResult("spec") },
    excludedWorkingChanges: { staged: false, unstaged: false, untracked: false },
  };
  const reportPath = join(evidence, "report.json");
  const criteriaPath = join(evidence, "current-criteria.json");
  writeJson(reportPath, report);
  writeJson(criteriaPath, {
    schemaVersion: 1,
    sources: sources.map((source) => ({
      sourceKey: source.sourceKey,
      snapshotPath: source.snapshotLocation,
      affects: source.affects,
    })),
  });
  return { repo, evidence, report, reportPath, criteriaPath };
}

function run(fixture) {
  return spawnSync(process.execPath, [checker, "--report", fixture.reportPath, "--repo", fixture.repo, "--criteria", fixture.criteriaPath], {
    encoding: "utf8",
  });
}

function expectValid(fixture) {
  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).valid, true);
}

function expectInvalid(fixture, code, axes) {
  const result = run(fixture);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, false);
  assert.deepEqual(output.affectedAxes, axes);
  assert(output.reasons.some((reason) => reason.code === code), `missing reason ${code}`);
}

try {
  expectValid(makeFixture("valid"));

  const changedHead = makeFixture("changed-head");
  writeFileSync(join(changedHead.repo, "source.txt"), "next head\n");
  git(changedHead.repo, ["add", "source.txt"]);
  git(changedHead.repo, ["commit", "-q", "-m", "next"]);
  expectInvalid(changedHead, "comparison-changed", ["standards", "spec"]);

  const changedParent = makeFixture("changed-parent");
  git(changedParent.repo, ["branch", "-f", "parent", "HEAD"]);
  expectInvalid(changedParent, "comparison-changed", ["standards", "spec"]);

  const invalidMergeBase = makeFixture("invalid-merge-base");
  invalidMergeBase.report.comparison.mergeBaseOid = "0000000000000000000000000000000000000000";
  invalidMergeBase.report.axes.standards.examinedComparison = structuredClone(invalidMergeBase.report.comparison);
  invalidMergeBase.report.axes.spec.examinedComparison = structuredClone(invalidMergeBase.report.comparison);
  writeJson(invalidMergeBase.reportPath, invalidMergeBase.report);
  expectInvalid(invalidMergeBase, "comparison-changed", ["standards", "spec"]);

  const changedCriteria = makeFixture("changed-criteria");
  writeFileSync(join(changedCriteria.evidence, "spec.md"), "changed requirement\n");
  expectInvalid(changedCriteria, "criteria-content-changed", ["spec"]);

  const missingEvidence = makeFixture("missing-evidence");
  rmSync(join(missingEvidence.evidence, "standards", "coverage.json"));
  expectInvalid(missingEvidence, "coverage-missing", ["standards"]);

  const incomplete = makeFixture("incomplete");
  incomplete.report.axes.spec = { status: "incomplete", reason: "reviewer failed", availableEvidence: [] };
  writeJson(incomplete.reportPath, incomplete.report);
  expectInvalid(incomplete, "axis-incomplete", ["spec"]);

  const missingSpec = makeFixture("missing-spec");
  missingSpec.report.criteria.sources = missingSpec.report.criteria.sources.filter((source) => source.sourceKey !== "spec-source");
  missingSpec.report.axes.spec.examinedSources = [];
  const currentCriteria = JSON.parse(readFileSync(missingSpec.criteriaPath, "utf8"));
  currentCriteria.sources = currentCriteria.sources.filter((source) => source.sourceKey !== "spec-source");
  writeJson(missingSpec.reportPath, missingSpec.report);
  writeJson(missingSpec.criteriaPath, currentCriteria);
  expectInvalid(missingSpec, "axis-source-missing", ["spec"]);

  const dirty = makeFixture("dirty");
  writeFileSync(join(dirty.repo, "untracked.txt"), "excluded\n");
  expectInvalid(dirty, "working-tree-dirty", ["standards", "spec"]);

  const finding = makeFixture("finding");
  const source = finding.report.criteria.sources[0];
  const tuple = {
    axis: "standards",
    evidenceDigest: digest("evidence"),
    semanticLocation: "source behavior",
    sourceDigest: source.contentDigest,
    sourceKey: source.sourceKey,
  };
  finding.report.axes.standards.findings.push({
    identity: digest(stableJson(tuple)),
    axis: "standards",
    classification: "documentedViolation",
    sourceKey: source.sourceKey,
    sourceDigest: source.contentDigest,
    criterionLocator: "fixture rule",
    citedText: "standard",
    location: "source.txt:1",
    semanticLocation: tuple.semanticLocation,
    evidence: "evidence",
    evidenceDigest: tuple.evidenceDigest,
    impact: "fixture impact",
  });
  writeJson(finding.reportPath, finding.report);
  expectValid(finding);

  finding.report.axes.standards.findings[0].identity = digest("wrong tuple");
  writeJson(finding.reportPath, finding.report);
  const malformedFinding = run(finding);
  assert.equal(malformedFinding.status, 2);
  assert.match(JSON.parse(malformedFinding.stderr).error, /stable finding tuple/);

  const malformed = makeFixture("malformed");
  malformed.report.schemaVersion = 2;
  writeJson(malformed.reportPath, malformed.report);
  const malformedResult = run(malformed);
  assert.equal(malformedResult.status, 2);
  assert.match(JSON.parse(malformedResult.stderr).error, /schemaVersion/);

  process.stdout.write("PASS: code-review-identity.test.mjs\n");
} finally {
  rmSync(work, { recursive: true, force: true });
}
