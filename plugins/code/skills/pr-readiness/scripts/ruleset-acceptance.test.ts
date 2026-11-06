import { describe, expect, it } from "bun:test";
import type { ValidityDecision } from "./domain.ts";
import { deriveObservations } from "./evidence.ts";
import { evaluateReadiness, type EvaluationReport } from "./evaluator.ts";
import { parsePolicy, rulesFromPolicy } from "./policy.ts";
import { parsePullRequestRules } from "./ruleset.ts";
import { BRANCH_RULES, HEAD, RULESET_POLICY, SRC_REVIEWER, fakeForge, invoke, pullRequestRule, review, type FakeForgeOptions } from "./fake-forge.ts";

function check(options: FakeForgeOptions): { code: number; stderr: string; decision: (obligation: string) => ValidityDecision } {
  const result = invoke(["check", "--repo", "o/r", "--pr", "7"], fakeForge({ policy: RULESET_POLICY, ...options }));
  const parsed = JSON.parse(result.stdout) as EvaluationReport;
  return { code: result.code, stderr: result.stderr, decision: (obligation) => parsed.decisions.find((d) => d.obligation === obligation)! };
}
const PRODUCE = `the reviewers the base ruleset requires approve 0123456789ab, after the cause above is fixed: gh api repos/o/r/pulls/7/reviews -f commit_id=${HEAD} -f event=APPROVE`;
const RULE = "ruleset 15382168 (patinaproject)";
const MATCH = 'Team 456 (pattern "src/**" matched src/index.ts)';
const missing = (reason: string) => ({ validity: "rerun-required", reason: `missing standards observation: ${reason}`, produce: PRODUCE });
const flags = (dismiss: boolean, last: boolean) => [pullRequestRule({ dismiss_stale_reviews_on_push: dismiss, require_last_push_approval: last })];

describe("acceptance: ruleset producer", () => {
  it("meets the obligation with no review when no entry matches, whatever the decision", () => {
    for (const reviewDecision of ["none", "APPROVED"] as const) {
      const result = check({ changedPaths: ["docs/a.md"], reviews: [], reviewDecision });
      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.decision("standards")).toMatchObject({ validity: "observed-current", reason: `observation matches current candidate: rules ${RULE}; no required reviewers matched; no approval required` });
    }
  });

  it("names every collected rule in the pass reason", () => {
    const other = pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true }, { ruleset_id: 9, ruleset_source: "acme" });
    const result = check({ changedPaths: ["docs/a.md"], reviews: [], reviewDecision: "none", branchRules: [...BRANCH_RULES, other] });
    expect(result.decision("spec").reason).toBe(`observation matches current candidate: rules ruleset 9 (acme), ${RULE}; no required reviewers matched; no approval required`);
  });

  it("fails while fewer approvals than the entry's minimum are at the head", () => {
    const result = check({ reviews: [review({ id: 1, login: "ted" })] });
    expect(result.code).toBe(1);
    expect(result.decision("standards")).toMatchObject(missing(`has 1 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched ${MATCH}`));
    expect(result.stderr).toBe([
      `standards: missing standards observation: has 1 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched ${MATCH} -> ${PRODUCE}`,
      `spec: missing spec observation: has 1 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched ${MATCH} -> ${PRODUCE}`,
      "",
    ].join("\n"));
  });

  it("fails with enough approvals while GitHub reports no decision", () => {
    const result = check({ reviews: [review({ id: 1, login: "ted" }), review({ id: 2, login: "mia" })], reviewDecision: "none" });
    expect(result.decision("standards")).toMatchObject(missing(`has 2 of 2 required approvals at 0123456789ab and GitHub review decision none; matched ${MATCH}`));
  });

  it("does not count an approval on an older commit", () => {
    const result = check({ reviews: [review({ id: 1, login: "ted" }), review({ id: 2, login: "mia", commitId: "f".repeat(40) })] });
    expect(result.decision("standards").reason).toBe(`missing standards observation: has 1 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched ${MATCH}`);
  });

  it("passes with the required approvals and an APPROVED decision, naming the entry and path", () => {
    const result = check({ reviews: [review({ id: 1, login: "ted" }), review({ id: 2, login: "mia" })] });
    expect(result.code).toBe(0);
    expect(result.decision("standards")).toMatchObject({ validity: "observed-current", reason: `observation matches current candidate: rules ${RULE}; matched ${MATCH}; 2 approvals required, 2 at 0123456789ab` });
  });

  it("matches a rename by its old name", () => {
    const result = check({ changedFiles: [{ filename: "docs/new.md", previous_filename: "src/old.ts" }], reviews: [] });
    expect(result.decision("standards").reason).toBe(`missing standards observation: has 0 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched Team 456 (pattern "src/**" matched src/old.ts)`);
  });

  it("matches a rename by its new name", () => {
    const result = check({ changedFiles: [{ filename: "src/new.ts", previous_filename: "docs/old.md" }], reviews: [] });
    expect(result.decision("standards")).toMatchObject(missing('has 0 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched Team 456 (pattern "src/**" matched src/new.ts)'));
  });

  it("matches a dotfile under a pattern", () => {
    const result = check({ changedPaths: ["src/.env"], reviews: [] });
    expect(result.decision("standards")).toMatchObject(missing('has 0 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched Team 456 (pattern "src/**" matched src/.env)'));
  });

  it("escapes control characters in a path it echoes", () => {
    const result = check({ changedPaths: ["src/a\nb.ts"], reviews: [] });
    const reason = 'missing standards observation: has 0 of 2 required approvals at 0123456789ab and GitHub review decision APPROVED; matched Team 456 (pattern "src/**" matched src/a\\nb.ts)';
    expect(result.decision("standards").reason).toBe(reason);
    expect(result.stderr).toContain('matched src/a\\nb.ts)');
    expect(result.stderr.split("\n").length).toBe(3);
  });

  it("fails closed on an entry with an invalid file pattern", () => {
    const rules = [pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true, required_reviewers: [{ ...SRC_REVIEWER, file_patterns: ["src/**", "[z-a]"] }] })];
    expect(check({ branchRules: rules }).decision("standards").reason).toBe(`missing standards observation: required reviewer Team 456 in ${RULE} has an invalid file pattern "[z-a]"`);
  });

  it("fails closed on an entry with more than three stars in one segment", () => {
    const rules = [pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true, required_reviewers: [{ ...SRC_REVIEWER, file_patterns: ["*a*a*a*b"] }] })];
    expect(check({ branchRules: rules }).decision("standards").reason).toBe(`missing standards observation: required reviewer Team 456 in ${RULE} has an invalid file pattern "*a*a*a*b"`);
  });

  it("applies a base count above zero without a matching entry", () => {
    const rules = [pullRequestRule({ required_approving_review_count: 1, dismiss_stale_reviews_on_push: true, require_last_push_approval: true })];
    const result = check({ branchRules: rules, reviews: [] });
    expect(result.decision("standards").reason).toBe("missing standards observation: has 0 of 1 required approvals at 0123456789ab and GitHub review decision APPROVED; no required reviewers matched");
    expect(check({ branchRules: rules }).decision("standards").reason).toBe(`observation matches current candidate: rules ${RULE}; no required reviewers matched; 1 approval required, 1 at 0123456789ab`);
  });

  it("creates no requirement from a matched entry with zero minimum approvals", () => {
    const rules = [pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true, required_reviewers: [{ ...SRC_REVIEWER, minimum_approvals: 0 }] })];
    const result = check({ branchRules: rules, reviews: [], reviewDecision: "none" });
    expect(result.code).toBe(0);
    expect(result.decision("standards")).toMatchObject({ validity: "observed-current", reason: `observation matches current candidate: rules ${RULE}; matched ${MATCH}; no approval required` });
  });

  it("fails closed on a zero-minimum match while GitHub still wants a review", () => {
    const rules = [pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true, required_reviewers: [{ ...SRC_REVIEWER, minimum_approvals: 0 }] })];
    const result = check({ branchRules: rules, reviews: [], reviewDecision: "REVIEW_REQUIRED" });
    expect(result.code).toBe(1);
    expect(result.decision("standards")).toMatchObject(missing(`no approval is required by ${RULE} and matched ${MATCH}, but GitHub review decision is REVIEW_REQUIRED`));
  });

  it("fails closed and names a stale-review flag that is off", () => {
    expect(check({ branchRules: flags(false, true) }).decision("standards")).toMatchObject(missing(`dismiss_stale_reviews_on_push is off in ${RULE}`));
    expect(check({ branchRules: flags(true, false) }).decision("standards")).toMatchObject(missing(`require_last_push_approval is off in ${RULE}`));
  });

  it("names both flags in a fixed order when both are off", () => {
    expect(check({ branchRules: flags(false, false) }).decision("standards").reason).toBe(`missing standards observation: dismiss_stale_reviews_on_push is off in ${RULE}; require_last_push_approval is off in ${RULE}`);
  });

  it("fails on an eligible reviewer's standing change request, with or without a match", () => {
    for (const changedPaths of [["docs/a.md"], ["src/a.ts"]]) {
      const result = check({ changedPaths, reviews: [review({ id: 3, login: "ted", state: "CHANGES_REQUESTED" })], reviewDecision: "CHANGES_REQUESTED" });
      expect(result.decision("standards")).toMatchObject(missing("@ted requested changes"));
    }
  });

  it("ignores a change request from a reviewer without write access", () => {
    const result = check({ changedPaths: ["docs/a.md"], reviews: [review({ id: 3, login: "rando", permission: "read", state: "CHANGES_REQUESTED" })] });
    expect(result.code).toBe(0);
  });

  it("fails closed with no pull_request rule on the base", () => {
    expect(check({ branchRules: [BRANCH_RULES[0]] }).decision("standards")).toMatchObject(missing("no pull_request rule applies to main"));
  });

  it("fails closed when the rules cannot be read", () => {
    expect(check({ branchRulesError: "HTTP 502" }).decision("standards")).toMatchObject(missing("cannot read the rules of main: HTTP 502"));
    expect(check({ branchRules: [pullRequestRule({}, { ruleset_id: "x" })] }).decision("standards").reason).toBe("missing standards observation: cannot read the rules of main: forge returned a malformed pull_request rule: ruleset_id");
  });

  it("fails closed when the changed files cannot be read", () => {
    expect(check({ changedFilesError: "HTTP 500" }).decision("standards")).toMatchObject(missing("cannot read the changed files: HTTP 500"));
  });

  it("fails closed on a truncated file list, by total or by the 3000 cap", () => {
    const truncated = "missing standards observation: the changed-file list is truncated, so the required reviewers cannot be matched against every path";
    expect(check({ changedFilesTotal: 3 }).decision("standards").reason).toBe(truncated);
    const rows = Array.from({ length: 3000 }, (_, index) => ({ filename: `f${index}.ts` }));
    expect(check({ changedFiles: rows }).decision("standards").reason).toBe(truncated);
  });

  it("fails closed on an entry with empty or missing file_patterns", () => {
    const reason = `missing standards observation: required reviewer Team 456 in ${RULE} has no file_patterns`;
    const entry = (patterns: object) => [pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true, required_reviewers: [{ ...SRC_REVIEWER, file_patterns: undefined, ...patterns }] })];
    expect(check({ branchRules: entry({ file_patterns: [] }) }).decision("standards").reason).toBe(reason);
    expect(check({ branchRules: entry({}) }).decision("standards").reason).toBe(reason);
  });

  it("fails closed when GitHub still wants a review or changes that no entry explains", () => {
    expect(check({ changedPaths: ["docs/a.md"], reviews: [], reviewDecision: "REVIEW_REQUIRED" }).decision("standards")).toMatchObject(missing(`no approval is required by ${RULE} and no required reviewers matched, but GitHub review decision is REVIEW_REQUIRED`));
    expect(check({ changedPaths: ["docs/a.md"], reviews: [], reviewDecision: "CHANGES_REQUESTED" }).decision("standards").reason).toBe(`missing standards observation: no approval is required by ${RULE} and no required reviewers matched, but GitHub review decision is CHANGES_REQUESTED`);
  });

  it("changes nothing and reads nothing new under the default policy", () => {
    const forge = fakeForge();
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], forge);
    expect(result.code).toBe(0);
    expect(forge.readBranchRulesCalls).toEqual([]);
    expect(forge.readChangedFilesCalls).toEqual([]);
  });

  it("reads the rules and files once per check", () => {
    const forge = fakeForge({ policy: RULESET_POLICY, changedPaths: ["docs/a.md"], reviews: [] });
    invoke(["check", "--repo", "o/r", "--pr", "7"], forge);
    expect(forge.readBranchRulesCalls).toEqual(["main"]);
    expect(forge.readChangedFilesCalls).toEqual([7]);
  });
});

describe("ruleset observations", () => {
  const candidate = { repository: "o/r", pullRequest: 7, base: "b", baseRef: "main", mergeBase: "m", head: HEAD, patchId: "p", diffDigest: "d", requirementsDigest: "rq", policyDigest: "pol" };
  const rules = parsePullRequestRules(BRANCH_RULES.slice());
  const facts = (changedPaths: string[]) => ({ kind: "read" as const, rules, changedPaths, truncated: false });
  const evidence = { author: "bot", reviewDecision: "APPROVED" as const, checkRuns: [], reviews: [review({ id: 1, login: "ted" }), review({ id: 2, login: "mia", submittedAt: "2026-10-02T00:00:00Z" })] };
  const policy = parsePolicy(RULESET_POLICY);
  const standards = (paths: string[], now = "2026-11-01T00:00:00Z", reviews = evidence.reviews) =>
    deriveObservations(candidate, policy, { ...evidence, reviews }, { facts: facts(paths), now }).observations.find((o) => o.obligation === "standards")!;

  it("hashes pattern order into the digest but not rule or path order", () => {
    const withEntry = (patterns: string[], id = 15382168) => parsePullRequestRules([pullRequestRule({ dismiss_stale_reviews_on_push: true, require_last_push_approval: true, required_reviewers: [{ ...SRC_REVIEWER, file_patterns: patterns }] }, { ruleset_id: id })]);
    const digest = (found: ReturnType<typeof parsePullRequestRules>, paths: string[]) =>
      deriveObservations(candidate, policy, evidence, { facts: { kind: "read", rules: found, changedPaths: paths, truncated: false }, now: "2026-11-01T00:00:00Z" }).observations.find((o) => o.obligation === "standards")!.inputDigest;
    const base = digest(withEntry(["src/**", "!src/gen/"]), ["src/a.ts"]);
    expect(digest(withEntry(["!src/gen/", "src/**"]), ["src/a.ts"])).not.toBe(base);
    expect(digest([...withEntry(["src/**", "!src/gen/"]), ...withEntry(["docs/**"], 3)].reverse(), ["src/a.ts"])).toBe(digest([...withEntry(["src/**", "!src/gen/"]), ...withEntry(["docs/**"], 3)], ["src/a.ts"]));
    expect(digest(withEntry(["src/**", "!src/gen/"]), ["src/a.ts", "src/b.ts"])).toBe(digest(withEntry(["src/**", "!src/gen/"]), ["src/b.ts", "src/a.ts"]));
  });

  it("hashes the same input to the same digest whatever the order", () => {
    expect(standards(["src/a.ts", "src/b.ts"]).inputDigest).toBe(standards(["src/b.ts", "src/a.ts"], "2027-01-01T00:00:00Z", [...evidence.reviews].reverse()).inputDigest);
    expect(standards(["src/a.ts"]).inputDigest).not.toBe(standards(["src/a.ts", "src/b.ts"]).inputDigest);
  });

  it("takes capturedAt from the latest cited review, else the injected time", () => {
    expect(standards(["src/a.ts"]).capturedAt).toBe("2026-10-02T00:00:00Z");
    expect(standards(["docs/a.md"], "2026-11-01T00:00:00Z", []).capturedAt).toBe("2026-11-01T00:00:00Z");
  });

  it("is never reused on another head, even with an equal patch id", () => {
    const observation = standards(["src/a.ts"]);
    const rulesFor = rulesFromPolicy(policy).filter((rule) => rule.obligation === "standards");
    const moved = { ...candidate, head: "f".repeat(40) };
    const report = evaluateReadiness({ candidate: moved, observations: [{ ...observation, candidate }], rules: rulesFor });
    expect(report.decisions[0]).toMatchObject({ obligation: "standards", validity: "rerun-required", reason: "standards observation does not describe current candidate" });
  });
});
