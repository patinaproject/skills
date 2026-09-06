import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
      examinedSources: [{
        sourceKey: source.sourceKey,
        origin: source.origin,
        acceptanceBasis: source.acceptanceBasis,
        contentDigest: source.contentDigest,
        affects: [...source.affects],
      }],
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
      origin: source.origin,
      acceptanceBasis: source.acceptanceBasis,
      snapshotPath: source.snapshotLocation,
      affects: source.affects,
    })),
  });
  return { repo, evidence, report, reportPath, criteriaPath, intendedParentRef: "parent" };
}

function run(fixture) {
  return spawnSync(process.execPath, [checker, "--report", fixture.reportPath, "--repo", fixture.repo, "--criteria", fixture.criteriaPath, "--intended-parent", fixture.intendedParentRef], {
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

  for (const field of ["origin", "acceptanceBasis"]) {
    const changed = makeFixture(`changed-${field}`);
    const current = JSON.parse(readFileSync(changed.criteriaPath, "utf8"));
    current.sources[1][field] = `replacement ${field}`;
    writeJson(changed.criteriaPath, current);
    expectInvalid(changed, "criteria-provenance-changed", ["spec"]);

    changed.report.criteria.sources[1][field] = current.sources[1][field];
    writeJson(changed.reportPath, changed.report);
    expectInvalid(changed, "axis-source-mismatch", ["spec"]);

    changed.report.axes.spec.examinedSources[0][field] = current.sources[1][field];
    writeJson(changed.reportPath, changed.report);
    expectValid(changed);
    const output = JSON.parse(run(changed).stdout);
    assert.equal(output.axisSourceIdentities.spec[0][field], current.sources[1][field]);

    delete current.sources[1][field];
    writeJson(changed.criteriaPath, current);
    const missing = run(changed);
    assert.equal(missing.status, 2);
    assert(JSON.parse(missing.stderr).error.includes(`criteria.sources[1].${field}`));
  }

  for (const [field, value] of [
    ["origin", "different reviewer origin"],
    ["acceptanceBasis", "different reviewer acceptance"],
    ["contentDigest", digest("different reviewer bytes")],
    ["affects", ["standards", "spec"]],
  ]) {
    const changed = makeFixture(`changed-axis-${field}`);
    changed.report.axes.spec.examinedSources[0][field] = value;
    writeJson(changed.reportPath, changed.report);
    expectInvalid(changed, "axis-source-mismatch", ["spec"]);
  }

  const changedAxes = makeFixture("changed-source-axes");
  const axesManifest = JSON.parse(readFileSync(changedAxes.criteriaPath, "utf8"));
  axesManifest.sources[1].affects = ["standards"];
  axesManifest.sources[1].origin = "different authority with identical bytes";
  writeJson(changedAxes.criteriaPath, axesManifest);
  expectInvalid(changedAxes, "criteria-provenance-changed", ["standards", "spec"]);
  expectInvalid(changedAxes, "criteria-axis-map-changed", ["standards", "spec"]);

  const shared = makeFixture("shared-source-provenance");
  const sharedManifest = JSON.parse(readFileSync(shared.criteriaPath, "utf8"));
  shared.report.criteria.sources[1].affects = ["standards", "spec"];
  sharedManifest.sources[1].affects = ["spec", "standards"];
  shared.report.axes.spec.examinedSources[0].affects = ["spec", "standards"];
  shared.report.axes.standards.examinedSources.push(structuredClone(shared.report.axes.spec.examinedSources[0]));
  for (const field of ["sourceReads", "coverage"]) {
    shared.report.axes.standards.execution[field].push({
      sourceKey: "spec-source", artifactPath: "standards/transcript.jsonl",
    });
  }
  writeJson(shared.reportPath, shared.report);
  writeJson(shared.criteriaPath, sharedManifest);
  expectValid(shared);
  sharedManifest.sources[1].acceptanceBasis = "replacement accepted decision";
  writeJson(shared.criteriaPath, sharedManifest);
  expectInvalid(shared, "criteria-provenance-changed", ["standards", "spec"]);

  for (const operation of ["add", "remove"]) {
    const changed = makeFixture(`source-set-${operation}`);
    const current = JSON.parse(readFileSync(changed.criteriaPath, "utf8"));
    if (operation === "add") {
      current.sources.push({ ...current.sources[1], sourceKey: "new-source" });
    } else {
      current.sources.pop();
    }
    writeJson(changed.criteriaPath, current);
    expectInvalid(changed, "criteria-source-set-changed", ["spec"]);
  }

  const changedHead = makeFixture("changed-head");
  writeFileSync(join(changedHead.repo, "source.txt"), "next head\n");
  git(changedHead.repo, ["add", "source.txt"]);
  git(changedHead.repo, ["commit", "-q", "-m", "next"]);
  expectInvalid(changedHead, "comparison-changed", ["standards", "spec"]);

  const changedParent = makeFixture("changed-parent");
  git(changedParent.repo, ["branch", "-f", "parent", "HEAD"]);
  expectInvalid(changedParent, "comparison-changed", ["standards", "spec"]);

  for (const tip of ["parent", "HEAD"]) {
    const changedRef = makeFixture(`changed-ref-${tip}`);
    git(changedRef.repo, ["branch", "new-parent", tip]);
    changedRef.intendedParentRef = "new-parent";
    expectInvalid(changedRef, "comparison-changed", ["standards", "spec"]);
  }

  const stack = makeFixture("stack-parent");
  stack.report.comparison.forgeTargetRef = "main";
  stack.report.comparison.forgeTargetOid = git(stack.repo, ["rev-parse", "main"]);
  for (const axis of ["standards", "spec"]) {
    stack.report.axes[axis].examinedComparison = structuredClone(stack.report.comparison);
  }
  writeJson(stack.reportPath, stack.report);
  expectValid(stack);
  stack.intendedParentRef = "main";
  expectInvalid(stack, "comparison-changed", ["standards", "spec"]);

  const missingParent = makeFixture("missing-parent-input");
  const missingParentResult = spawnSync(process.execPath, [checker, "--report", missingParent.reportPath,
    "--repo", missingParent.repo, "--criteria", missingParent.criteriaPath], { encoding: "utf8" });
  assert.equal(missingParentResult.status, 2);
  assert.match(JSON.parse(missingParentResult.stderr).error, /--intended-parent/);

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

  for (const field of ["observedRouteEvidence", "transcriptLocation", "comparisonReads", "sourceReads", "coverage"]) {
    const shared = makeFixture(`shared-${field}`);
    const standards = shared.report.axes.standards.execution;
    const spec = shared.report.axes.spec.execution;
    if (Array.isArray(spec[field])) {
      spec[field][0].artifactPath = standards[field][0].artifactPath;
    } else {
      spec[field] = standards[field];
    }
    writeJson(shared.reportPath, shared.report);
    expectInvalid(shared, "execution-artifact-shared", ["standards", "spec"]);
  }

  for (const [name, alias] of [["symlink", symlinkSync], ["hardlink", linkSync]]) {
    const shared = makeFixture(`shared-${name}`);
    const specPath = join(shared.evidence, "spec/transcript.jsonl");
    rmSync(specPath);
    alias(join(shared.evidence, "standards/transcript.jsonl"), specPath);
    expectInvalid(shared, "execution-artifact-shared", ["standards", "spec"]);
  }

  const combinedTranscript = makeFixture("combined-transcript");
  for (const axis of ["standards", "spec"]) {
    const execution = combinedTranscript.report.axes[axis].execution;
    for (const field of ["comparisonReads", "sourceReads", "coverage"]) {
      for (const record of execution[field]) record.artifactPath = execution.transcriptLocation;
    }
  }
  writeJson(combinedTranscript.reportPath, combinedTranscript.report);
  expectValid(combinedTranscript);

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
    classification: "documentedViolation",
    criterionLocator: "fixture rule",
    citedText: "standard",
    evidenceDigest: digest("evidence"),
    semanticLocation: "source behavior",
    sourceDigest: source.contentDigest,
    sourceKey: source.sourceKey,
    sourceOrigin: source.origin,
    sourceAcceptanceBasis: source.acceptanceBasis,
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

  const originalFinding = structuredClone(finding.report.axes.standards.findings[0]);
  for (const [field, value] of [
    ["criterionLocator", "another rule"],
    ["citedText", "another criterion in the same section"],
    ["classification", "heuristic"],
  ]) {
    const changed = { ...originalFinding, [field]: value };
    finding.report.axes.standards.findings[0] = changed;
    writeJson(finding.reportPath, finding.report);
    const staleIdentity = run(finding);
    assert.equal(staleIdentity.status, 2, `reused identity accepted for changed ${field}`);
    assert.match(JSON.parse(staleIdentity.stderr).error, /stable finding tuple/);
    changed.identity = digest(stableJson({ ...tuple, [field]: value }));
    assert.notEqual(changed.identity, originalFinding.identity);
    writeJson(finding.reportPath, finding.report);
    expectValid(finding);
  }

  for (const [field, tupleField] of [["origin", "sourceOrigin"], ["acceptanceBasis", "sourceAcceptanceBasis"]]) {
    const originalSourceValue = source[field];
    source[field] = `new accepted ${field}`;
    finding.report.axes.standards.examinedSources[0][field] = source[field];
    const current = JSON.parse(readFileSync(finding.criteriaPath, "utf8"));
    current.sources[0][field] = source[field];
    writeJson(finding.criteriaPath, current);
    finding.report.axes.standards.findings[0] = structuredClone(originalFinding);
    writeJson(finding.reportPath, finding.report);
    const staleIdentity = run(finding);
    assert.equal(staleIdentity.status, 2, `finding identity omitted ${field}`);
    assert.match(JSON.parse(staleIdentity.stderr).error, /stable finding tuple/);
    const replacement = digest(stableJson({ ...tuple, [tupleField]: source[field] }));
    assert.notEqual(replacement, originalFinding.identity);
    finding.report.axes.standards.findings[0].identity = replacement;
    writeJson(finding.reportPath, finding.report);
    expectValid(finding);
    source[field] = originalSourceValue;
    finding.report.axes.standards.examinedSources[0][field] = originalSourceValue;
    current.sources[0][field] = originalSourceValue;
    writeJson(finding.criteriaPath, current);
  }

  finding.report.axes.standards.findings[0] = {
    ...originalFinding, location: "source.txt:900", impact: "reworded fixture impact",
  };
  writeJson(finding.reportPath, finding.report);
  expectValid(finding);
  git(finding.repo, ["commit", "-q", "--allow-empty", "-m", "new head, identical behavior"]);
  finding.report.comparison.headOid = git(finding.repo, ["rev-parse", "HEAD"]);
  for (const axis of ["standards", "spec"]) {
    finding.report.axes[axis].examinedComparison = structuredClone(finding.report.comparison);
  }
  writeJson(finding.reportPath, finding.report);
  expectValid(finding);

  const substantiated = { ...originalFinding, evidence: "evidence with a newly demonstrated consequence" };
  substantiated.evidenceDigest = digest(substantiated.evidence);
  finding.report.axes.standards.findings[0] = substantiated;
  writeJson(finding.reportPath, finding.report);
  assert.equal(run(finding).status, 2);
  substantiated.identity = digest(stableJson({ ...tuple, evidenceDigest: substantiated.evidenceDigest }));
  assert.notEqual(substantiated.identity, originalFinding.identity);
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
