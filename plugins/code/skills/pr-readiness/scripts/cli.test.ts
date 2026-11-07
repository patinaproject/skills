import { describe, expect, it } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./cli.ts";
import { MemoryPacketStore } from "./adapters.ts";
import { AUTO_MERGE_POLICY, CHECKS_ONLY_POLICY, CHECK_NAMES, HEAD, MERGE_OID, POLICY, checkRun, fakeForge, invoke, pullRequestRule, review, type FakeForge, type FakeForgeOptions } from "./fake-forge.ts";
import type { EvaluationReport } from "./evaluator.ts";

const report = (stdout: string): EvaluationReport => JSON.parse(stdout) as EvaluationReport;

describe("pr-readiness check", () => {
  it("exits 0 when ready without marking the PR ready", () => {
    const forge = fakeForge();
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], forge);
    expect(result.code).toBe(0);
    expect(report(result.stdout).ready).toBe(true);
    expect(forge.markReadyCalls).toEqual([]);
  });
  it("fails with the policy parse error for a malformed policy file", () => {
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], fakeForge({ policy: "{ not json" }));
    expect(result.code).toBe(1);
    expect(result.stderr).toStartWith("pr-readiness: .github/pr-readiness.json is not valid JSON");
  });
  it("fails naming an unknown obligation in the policy file", () => {
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], fakeForge({ policy: JSON.stringify({ version: 1, obligations: { vibes: { producer: "approval" } } }) }));
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: .github/pr-readiness.json names unknown obligation: vibes\n");
  });
  it("requires approval for every obligation when the base has no policy file", () => {
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], fakeForge({ policy: undefined, reviews: [] }));
    expect(result.code).toBe(1);
    const produce = `a maintainer other than @patinaproject-goodyear[bot] reviews 0123456789ab and approves it: gh api repos/o/r/pulls/7/reviews -f commit_id=${HEAD} -f event=APPROVE`;
    expect(report(result.stdout).decisions.map((d) => [d.obligation, d.validity, d.produce])).toEqual([
      ["standards", "rerun-required", produce], ["spec", "rerun-required", produce], ["hygiene", "rerun-required", produce],
      ["tests", "rerun-required", produce], ["lint", "rerun-required", produce], ["behavior", "rerun-required", produce],
    ]);
  });
});

describe("pr-readiness publish", () => {
  it("rejects a head race without forge mutation", () => {
    const forge = fakeForge({ heads: [HEAD, "f".repeat(40)] });
    const store = new MemoryPacketStore();
    const result = invoke(["publish", "--repo", "o/r", "--pr", "7", "--takeover", "true"], forge, store);
    expect(result.code).toBe(1);
    expect(forge.markReadyCalls).toEqual([]);
    expect(store.packets.size).toBe(0);
  });
  it("is idempotent for an already-ready PR", () => {
    const forge = fakeForge({ isDraft: false });
    const result = invoke(["publish", "--repo", "o/r", "--pr", "7"], forge);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe(`PR #7 is already ready at ${HEAD}\n`);
  });
  it("refuses an unready candidate", () => {
    const forge = fakeForge({ checkRuns: [checkRun("Unit tests", { conclusion: "failure" })], reviews: [review({ state: "CHANGES_REQUESTED" })] });
    const result = invoke(["publish", "--repo", "o/r", "--pr", "7", "--takeover", "true"], forge);
    expect(result.code).toBe(1);
    expect(forge.markReadyCalls).toEqual([]);
  });
});

describe("pr-readiness run", () => {
  it("returns 1 through the error path when no command is given", () => {
    const err = process.stderr.write.bind(process.stderr); let stderr = "";
    process.stderr.write = ((chunk: string) => { stderr += chunk; return true; }) as typeof process.stderr.write;
    const store = process.env.PATINA_READINESS_STORE; process.env.PATINA_READINESS_STORE = mkdtempSync(join(tmpdir(), "readiness-run-"));
    try { expect(run([])).toBe(1); } finally { process.stderr.write = err; if (store === undefined) delete process.env.PATINA_READINESS_STORE; else process.env.PATINA_READINESS_STORE = store; }
    expect(stderr).toBe("pr-readiness: usage: pr-readiness open|check|publish\n");
  });
});

describe("pr-readiness publish auto-merge", () => {
  const publish = (forge: FakeForge) => invoke(["publish", "--repo", "o/r", "--pr", "7", "--takeover", "true"], forge);
  // This repository's live main rule: no approval required, no reviewers, both stale-review flags off.
  const autoForge = (options: FakeForgeOptions = {}) => fakeForge({ branchRules: [pullRequestRule()], ...options });
  it("arms one squash auto-merge at the published head after the ready transition", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY });
    const result = publish(forge);
    expect(result.code).toBe(0);
    expect(forge.markReadyCalls).toEqual([HEAD]);
    expect(forge.enableAutoMergeCalls).toEqual([{ head: HEAD, method: "SQUASH" }]);
    expect(result.stdout).toBe(`PR #7 is ready at ${HEAD}\nauto-merge (squash) armed at ${HEAD}\n`);
  });
  it("arms nothing and reads no rules when autoMerge is false or missing", () => {
    for (const policy of [JSON.stringify({ ...JSON.parse(POLICY), autoMerge: false }), POLICY]) {
      const forge = fakeForge({ policy });
      const result = publish(forge);
      expect(result.code).toBe(0);
      expect(forge.enableAutoMergeCalls).toEqual([]);
      expect(forge.readRequiredChecksCalls).toEqual([]);
      expect(forge.readAutoMergeStateCalls).toEqual([]);
      expect(result.stdout).toBe(`PR #7 is ready at ${HEAD}\n`);
    }
  });
  it("skips a stacked child whose base is not the default branch", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, baseRef: "feature/parent" });
    const result = publish(forge);
    expect(result.code).toBe(0);
    expect(forge.markReadyCalls).toEqual([HEAD]);
    expect(forge.enableAutoMergeCalls).toEqual([]);
    expect(forge.readRequiredChecksCalls).toEqual([]);
    expect(result.stdout).toContain("auto-merge skipped: base feature/parent is not the default branch main\n");
  });
  it("skips a diff that touches workflows or the policy file, naming the paths", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, changedPaths: ["src/a.ts", ".github/workflows/x.yml", ".github/pr-readiness.json"] });
    const result = publish(forge);
    expect(result.code).toBe(0);
    expect(forge.enableAutoMergeCalls).toEqual([]);
    expect(result.stdout).toContain("auto-merge skipped: the diff touches .github/workflows/x.yml, .github/pr-readiness.json\n");
  });
  it("fails closed without marking ready when the default branch is unknown", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, defaultBranch: null });
    const result = publish(forge);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("default branch");
    expect(forge.markReadyCalls).toEqual([]);
  });
  it("refuses, leaving the PR untouched, when the base does not require a policy check", () => {
    const store = new MemoryPacketStore();
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, requiredChecks: CHECK_NAMES.filter((name) => name !== "Unit tests" && name !== "Lint Markdown") });
    const result = invoke(["publish", "--repo", "o/r", "--pr", "7", "--takeover", "true"], forge, store);
    expect(result.code).toBe(1);
    expect(result.stderr).toBe('pr-readiness: cannot arm auto-merge: main does not require "Unit tests", "Lint Markdown"\n');
    expect(forge.markReadyCalls).toEqual([]);
    expect(forge.enableAutoMergeCalls).toEqual([]);
    expect(store.packets.size).toBe(0);
  });
  it("fails closed when the rules read throws", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, requiredChecksError: "HTTP 502" });
    const result = publish(forge);
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: HTTP 502\n");
    expect(forge.markReadyCalls).toEqual([]);
    expect(forge.enableAutoMergeCalls).toEqual([]);
  });
  it("fails closed before the ready transition when the arm-state read throws", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, autoMergeStateError: "forge graphql failed" });
    const result = publish(forge);
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: forge graphql failed\n");
    expect(forge.readAutoMergeStateCalls).toEqual([7]);
    expect(forge.markReadyCalls).toEqual([]);
    expect(forge.enableAutoMergeCalls).toEqual([]);
  });
  it("does nothing when already armed with squash at the published head", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, isDraft: false, armed: { mergeMethod: "SQUASH", head: HEAD } });
    const result = publish(forge);
    expect(result.code).toBe(0);
    expect(forge.enableAutoMergeCalls).toEqual([]);
    expect(result.stdout).toBe(`PR #7 is already ready at ${HEAD}\nauto-merge already armed (squash) at ${HEAD}\n`);
  });
  it("replaces an arm at an older head, an unknown head, or another method", () => {
    for (const armed of [{ mergeMethod: "SQUASH", head: "e".repeat(40) }, { mergeMethod: "SQUASH" }, { mergeMethod: "MERGE", head: HEAD }]) {
      const forge = autoForge({ policy: AUTO_MERGE_POLICY, armed });
      expect(publish(forge).code).toBe(0);
      expect(forge.enableAutoMergeCalls).toEqual([{ head: HEAD, method: "SQUASH" }]);
    }
  });
  const merged = (state = "ready") => `PR #7 is ${state} at ${HEAD}\nPR #7 merged (squash) at ${HEAD} as ${MERGE_OID}\n`;
  const armedOut = `PR #7 is ready at ${HEAD}\nauto-merge (squash) armed at ${HEAD}\n`;
  it("squash-merges a PR that is already mergeable instead of arming it", () => {
    for (const status of ["CLEAN", "HAS_HOOKS", "UNSTABLE"]) {
      const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: [status] });
      const result = publish(forge);
      expect(result).toEqual({ code: 0, stdout: merged(), stderr: "" });
      expect(forge.markReadyCalls).toEqual([HEAD]);
      expect(forge.mergeCalls).toEqual([{ head: HEAD, method: "SQUASH" }]);
      expect(forge.enableAutoMergeCalls).toEqual([]);
      expect(forge.readMergeStateCalls).toEqual([7]);
    }
  });
  it("reads again while the merge state is UNKNOWN, then merges", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: ["UNKNOWN", "UNKNOWN", "CLEAN"] });
    expect(publish(forge)).toEqual({ code: 0, stdout: merged(), stderr: "" });
    expect(forge.readMergeStateCalls).toHaveLength(3);
    expect(forge.mergeCalls).toHaveLength(1);
  });
  it("arms after five UNKNOWN reads", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: ["UNKNOWN"] });
    const result = publish(forge);
    expect(result).toEqual({ code: 0, stdout: armedOut, stderr: "" });
    expect(forge.readMergeStateCalls).toHaveLength(5);
    expect(forge.mergeCalls).toEqual([]);
  });
  it("arms every state that is not immediately mergeable", () => {
    for (const status of ["BLOCKED", "BEHIND", "DIRTY", "DRAFT"]) {
      const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: [status] });
      expect(publish(forge)).toEqual({ code: 0, stdout: armedOut, stderr: "" });
      expect(forge.readMergeStateCalls).toHaveLength(1);
      expect(forge.mergeCalls).toEqual([]);
    }
  });
  it("arms a CLEAN PR on a base with a merge queue", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: ["CLEAN"], isMergeQueueEnabled: true });
    expect(publish(forge)).toEqual({ code: 0, stdout: armedOut, stderr: "" });
    expect(forge.mergeCalls).toEqual([]);
    expect(forge.enableAutoMergeCalls).toEqual([{ head: HEAD, method: "SQUASH" }]);
  });
  it("merges a CLEAN PR that is already armed at the head", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, isDraft: false, armed: { mergeMethod: "SQUASH", head: HEAD }, mergeStates: ["CLEAN"] });
    expect(publish(forge)).toEqual({ code: 0, stdout: merged("already ready"), stderr: "" });
    expect(forge.mergeCalls).toEqual([{ head: HEAD, method: "SQUASH" }]);
    expect(forge.enableAutoMergeCalls).toEqual([]);
  });
  it("keeps an armed PR armed when it is not mergeable", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, isDraft: false, armed: { mergeMethod: "SQUASH", head: HEAD } });
    expect(publish(forge)).toEqual({ code: 0, stdout: `PR #7 is already ready at ${HEAD}\nauto-merge already armed (squash) at ${HEAD}\n`, stderr: "" });
    expect(forge.mergeCalls).toEqual([]);
  });
  it("exits 1 when the arm replacing an older-head arm is refused and the PR is not mergeable", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, armed: { mergeMethod: "SQUASH", head: "e".repeat(40) }, enableAutoMergeError: "Pull request is in clean status" });
    const result = publish(forge);
    expect(result).toEqual({ code: 1, stdout: `PR #7 is ready at ${HEAD}\n`, stderr: "pr-readiness: PR #7 is ready but auto-merge is not on: Pull request is in clean status\n" });
    expect(forge.mergeCalls).toEqual([]);
  });
  it("merges when the arm is refused and the PR then reads CLEAN", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, enableAutoMergeError: "Pull request is in clean status", mergeStates: ["BLOCKED", "CLEAN"] });
    const result = publish(forge);
    expect(result).toEqual({ code: 0, stdout: merged(), stderr: "" });
    expect(forge.readMergeStateCalls).toHaveLength(2);
    expect(forge.markReadyCalls).toEqual([HEAD]);
    expect(forge.mergeCalls).toEqual([{ head: HEAD, method: "SQUASH" }]);
  });
  it("reports a ready PR without auto-merge when the forge refuses to arm and the PR is not mergeable", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, enableAutoMergeError: "Auto merge is not allowed for this repository" });
    const result = publish(forge);
    expect(result.code).toBe(1);
    expect(forge.markReadyCalls).toEqual([HEAD]);
    expect(forge.readMergeStateCalls).toHaveLength(2);
    expect(forge.mergeCalls).toEqual([]);
    expect(result.stderr).toBe("pr-readiness: PR #7 is ready but auto-merge is not on: Auto merge is not allowed for this repository\n");
  });
  it("fails closed when the merge-state read is malformed", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY });
    forge.readMergeState = () => { throw new Error("malformed pull request merge state: mergeStateStatus"); };
    const result = publish(forge);
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: PR #7 is ready but not merged: malformed pull request merge state: mergeStateStatus\n");
    expect(forge.enableAutoMergeCalls).toEqual([]);
    expect(forge.mergeCalls).toEqual([]);
  });
  it("accepts a failed merge call when a reread finds the PR merged", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: ["CLEAN"], mergeError: "socket hang up", stateAfterMergeFailure: "MERGED" });
    expect(publish(forge)).toEqual({ code: 0, stdout: merged(), stderr: "" });
    expect(forge.mergeCalls).toHaveLength(1);
    expect(forge.readMergeOutcomeCalls).toEqual([7]);
  });
  it("fails closed, without retry or arming, when the merge fails and the PR is still open", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: ["CLEAN"], mergeError: "Squash merges are not allowed" });
    const result = publish(forge);
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: PR #7 is ready but not merged: Squash merges are not allowed\n");
    expect(forge.mergeCalls).toHaveLength(1);
    expect(forge.enableAutoMergeCalls).toEqual([]);
    expect(forge.readMergeOutcomeCalls).toEqual([7]);
  });
  it("treats a merge response without state MERGED as a failure", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: ["CLEAN"], mergeResponseState: "OPEN" });
    const result = publish(forge);
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: PR #7 is ready but not merged: merge answered with state OPEN\n");
    expect(forge.readMergeOutcomeCalls).toEqual([7]);
  });
  it("never merges a PR whose policy checks the base does not require", () => {
    const forge = autoForge({ policy: AUTO_MERGE_POLICY, mergeStates: ["CLEAN"], requiredChecks: ["Unit tests"] });
    expect(publish(forge).code).toBe(1);
    expect(forge.markReadyCalls).toEqual([]);
    expect(forge.mergeCalls).toEqual([]);
    expect(forge.readMergeStateCalls).toEqual([]);
  });
  it("reads no merge state on the skip and off paths", () => {
    for (const forge of [autoForge({ policy: AUTO_MERGE_POLICY, baseRef: "feature/parent", mergeStates: ["CLEAN"] }), autoForge({ policy: AUTO_MERGE_POLICY, changedPaths: [".github/workflows/x.yml"], mergeStates: ["CLEAN"] }), fakeForge({ policy: POLICY, mergeStates: ["CLEAN"] })]) {
      expect(publish(forge).code).toBe(0);
      expect(forge.readMergeStateCalls).toEqual([]);
      expect(forge.mergeCalls).toEqual([]);
    }
  });
});

describe("pr-readiness publish approval gate", () => {
  const publish = (forge: FakeForge) => invoke(["publish", "--repo", "o/r", "--pr", "7", "--takeover", "true"], forge);
  const RULE = "ruleset 15382168 (patinaproject)";
  const gated = (parameters: Record<string, unknown>) => pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true, ...parameters });
  const reviewer = (file_patterns: string[], minimum_approvals = 1) => ({ reviewer: { id: 456, type: "Team" }, file_patterns, minimum_approvals });
  const ready = `PR #7 is ready at ${HEAD}\n`;
  const armed = `${ready}auto-merge (squash) armed at ${HEAD}\n`;
  const skipped = (reason: string) => `${ready}auto-merge skipped: ${reason}\n`;
  const nothing = (forge: FakeForge) => { expect(forge.enableAutoMergeCalls).toEqual([]); expect(forge.mergeCalls).toEqual([]); };
  const unapproved = (options: FakeForgeOptions) => fakeForge({ policy: CHECKS_ONLY_POLICY, reviews: [], reviewDecision: "REVIEW_REQUIRED", ...options });

  it("arms for this repository's live shape whatever the review decision", () => {
    for (const reviewDecision of ["none", "APPROVED"] as const) {
      const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRules: [pullRequestRule()], reviewDecision });
      expect(publish(forge)).toEqual({ code: 0, stdout: armed, stderr: "" });
      expect(forge.readBranchRulesCalls).toEqual(["main"]);
      expect(forge.enableAutoMergeCalls).toEqual([{ head: HEAD, method: "SQUASH" }]);
    }
  });
  it("arms with no pull_request rule at all", () => {
    const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRules: [], reviewDecision: "none" });
    expect(publish(forge)).toEqual({ code: 0, stdout: armed, stderr: "" });
  });
  it("skips with no pull_request rule while GitHub still requires a review", () => {
    for (const reviewDecision of ["REVIEW_REQUIRED", "CHANGES_REQUESTED"] as const) {
      const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRules: [], reviewDecision });
      expect(publish(forge)).toEqual({ code: 0, stdout: skipped(`no pull_request rule applies, but GitHub review decision is ${reviewDecision}`), stderr: "" });
      expect(forge.markReadyCalls).toEqual([HEAD]);
      nothing(forge);
    }
  });
  it("skips a required approval the head lacks", () => {
    const forge = unapproved({ branchRules: [gated({ required_approving_review_count: 1 })] });
    expect(publish(forge)).toEqual({ code: 0, stdout: skipped(`1 required approval under ${RULE}, 0 at ${HEAD.slice(0, 12)}, GitHub review decision REVIEW_REQUIRED; no required reviewers matched`), stderr: "" });
    expect(forge.markReadyCalls).toEqual([HEAD]);
    nothing(forge);
  });
  it("skips naming the rule and the file when a required_reviewers pattern matches", () => {
    const cases: [string, string[], string, FakeForgeOptions][] = [
      ["docs/**", ["docs/a/b.md"], "docs/a/b.md", {}],
      ["*", [".env"], ".env", {}],
      ["secrets/**", ["docs/new.md"], "secrets/old.txt", { changedFiles: [{ filename: "docs/new.md", previous_filename: "secrets/old.txt", status: "renamed" }] }],
    ];
    for (const [pattern, changedPaths, path, extra] of cases) {
      const forge = unapproved({ branchRules: [gated({ required_reviewers: [reviewer([pattern])] })], changedPaths, ...extra });
      expect(publish(forge)).toEqual({ code: 0, stdout: skipped(`1 required approval under ${RULE}, 0 at ${HEAD.slice(0, 12)}, GitHub review decision REVIEW_REQUIRED; matched ${RULE} Team 456 (pattern "${pattern}" matched ${path})`), stderr: "" });
      expect(forge.markReadyCalls).toEqual([HEAD]);
      nothing(forge);
    }
  });
  it("arms when no required_reviewers pattern matches a changed file", () => {
    const forge = unapproved({ branchRules: [gated({ required_reviewers: [reviewer(["docs/**"])] })], reviewDecision: "none" });
    expect(publish(forge)).toEqual({ code: 0, stdout: armed, stderr: "" });
  });
  it("skips when an approval is required and a stale-review flag is off, even with an approval at the head", () => {
    for (const flag of ["dismiss_stale_reviews_on_push", "require_last_push_approval"]) {
      const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRules: [gated({ required_approving_review_count: 1, [flag]: false })] });
      expect(publish(forge)).toEqual({ code: 0, stdout: skipped(`1 required approval under ${RULE}, 1 at ${HEAD.slice(0, 12)}, GitHub review decision APPROVED; no required reviewers matched; ${flag} is off in ${RULE}`), stderr: "" });
      nothing(forge);
    }
  });
  it("skips on REVIEW_REQUIRED or CHANGES_REQUESTED when nothing is required", () => {
    for (const reviewDecision of ["REVIEW_REQUIRED", "CHANGES_REQUESTED"] as const) {
      const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRules: [pullRequestRule()], reviewDecision, reviews: [] });
      expect(publish(forge)).toEqual({ code: 0, stdout: skipped(`no approval is required by ${RULE} and no required reviewers matched, but GitHub review decision is ${reviewDecision}`), stderr: "" });
      nothing(forge);
    }
  });
  it("skips on a standing change request", () => {
    const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRules: [pullRequestRule()], reviews: [review({ state: "CHANGES_REQUESTED", login: "hill" })] });
    expect(publish(forge)).toEqual({ code: 0, stdout: skipped(`@hill requested changes under ${RULE}`), stderr: "" });
    nothing(forge);
  });
  it("exits 1 before the ready transition when the rules read fails", () => {
    const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRulesError: "HTTP 502" });
    expect(publish(forge)).toEqual({ code: 1, stdout: "", stderr: "pr-readiness: cannot arm auto-merge: cannot read the rules of main: HTTP 502\n" });
    expect(forge.markReadyCalls).toEqual([]);
    nothing(forge);
  });
  it("exits 1 before the ready transition on a malformed rule, a failed file read, or an unreadable reviewer entry", () => {
    const cases: [FakeForgeOptions, string][] = [
      [{ branchRules: [{ type: "pull_request", parameters: {}, ruleset_id: 1, ruleset_source: "x" }] }, "cannot read the rules of main: forge returned a malformed pull_request rule: required_approving_review_count"],
      [{ branchRules: [pullRequestRule()], changedFilesError: "HTTP 500" }, "cannot read the changed files: HTTP 500"],
      [{ branchRules: [pullRequestRule()], changedFilesTotal: 5 }, "the changed-file list is truncated, so the required reviewers cannot be matched against every path"],
      [{ branchRules: [gated({ required_reviewers: [reviewer([])] })] }, `required reviewer Team 456 in ${RULE} has no file_patterns`],
    ];
    for (const [options, cause] of cases) {
      const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, ...options });
      expect(publish(forge)).toEqual({ code: 1, stdout: "", stderr: `pr-readiness: cannot arm auto-merge: ${cause}\n` });
      expect(forge.markReadyCalls).toEqual([]);
      nothing(forge);
    }
  });
  it("arms an approval-gated policy once the head has its required approval", () => {
    const forge = fakeForge({ policy: AUTO_MERGE_POLICY, branchRules: [gated({ required_approving_review_count: 1 })] });
    expect(publish(forge)).toEqual({ code: 0, stdout: armed, stderr: "" });
    expect(forge.readBranchRulesCalls).toEqual(["main"]);
  });
  it("disarms an existing arm and skips when the required approval is gone", () => {
    for (const armedState of [{ mergeMethod: "SQUASH", head: HEAD }, { mergeMethod: "MERGE" }]) {
      const forge = unapproved({ isDraft: false, armed: armedState, branchRules: [gated({ required_approving_review_count: 1 })] });
      expect(publish(forge)).toEqual({ code: 0, stdout: `PR #7 is already ready at ${HEAD}\nauto-merge skipped: 1 required approval under ${RULE}, 0 at ${HEAD.slice(0, 12)}, GitHub review decision REVIEW_REQUIRED; no required reviewers matched\n`, stderr: "" });
      expect(forge.disableAutoMergeCalls).toEqual([7]);
      nothing(forge);
    }
  });
  it("does not disarm when the gate is open", () => {
    const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, branchRules: [pullRequestRule()], isDraft: false, armed: { mergeMethod: "SQUASH", head: HEAD } });
    expect(publish(forge).code).toBe(0);
    expect(forge.disableAutoMergeCalls).toEqual([]);
  });
  it("reads no rules when autoMerge is false", () => {
    const forge = fakeForge({ policy: POLICY, branchRules: [gated({ required_approving_review_count: 1 })] });
    expect(publish(forge).code).toBe(0);
    expect(forge.readBranchRulesCalls).toEqual([]);
    expect(forge.readChangedFilesCalls).toEqual([]);
  });
  it("keeps the base-branch skip without reading rules", () => {
    const forge = fakeForge({ policy: CHECKS_ONLY_POLICY, baseRef: "feature/parent", branchRules: [gated({ required_approving_review_count: 1 })], reviews: [] });
    expect(publish(forge).code).toBe(0);
    expect(forge.readBranchRulesCalls).toEqual([]);
  });
});
