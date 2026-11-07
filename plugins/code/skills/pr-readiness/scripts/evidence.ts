import { invalidPattern, matchEntries, matchName, printable, reviewerName, ruleName, type PullRequestRule, type ReviewerMatch, type RulesetFacts } from "./ruleset.ts";
import { EVALUATOR_VERSION, OBLIGATIONS, provenanceUrls, sha256, type CandidateIdentity, type CheckProvenance, type Obligation, type Observation, type Provenance, type ReadinessPolicy } from "./domain.ts";

export const ACTIONS_APP = "github-actions";
export interface CheckRunFact {
  readonly id: number;
  readonly name: string;
  readonly appSlug: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly checkSuiteId: number;
  readonly detailsUrl: string;
  readonly htmlUrl: string;
  readonly completedAt: string | null;
}
export interface ReviewFact {
  readonly id: number;
  readonly login: string;
  readonly userType: string;
  readonly permission: string;
  readonly state: string;
  readonly commitId: string;
  readonly submittedAt: string | null;
  readonly htmlUrl: string;
}
export type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | "none";
export interface ForgeEvidence { readonly author: string; readonly reviewDecision: ReviewDecision; readonly checkRuns: readonly CheckRunFact[]; readonly reviews: readonly ReviewFact[]; }
export interface Derivation { readonly observations: Observation[]; readonly notApplicable: Obligation[]; readonly notes: Partial<Record<Obligation, string>>; readonly failedRunIds: Partial<Record<Obligation, readonly number[]>>; }

const WRITERS: readonly string[] = ["admin", "write"];
const DECISIVE: readonly string[] = ["APPROVED", "CHANGES_REQUESTED", "DISMISSED"];
type Outcome = { readonly verdict: "pass" | "fail"; readonly provenance: Provenance; readonly capturedAt: string; readonly inputDigest?: string; readonly note?: string } | { readonly note: string; readonly skipped?: true };

export interface RulesetInput { readonly facts: RulesetFacts; readonly now: string; }

export function deriveObservations(candidate: CandidateIdentity, policy: ReadinessPolicy, evidence: ForgeEvidence, ruleset?: RulesetInput): Derivation {
  const observations: Observation[] = [];
  const notes: Partial<Record<Obligation, string>> = {};
  const failedRunIds: Partial<Record<Obligation, readonly number[]>> = {};
  const notApplicable: Obligation[] = [];
  const approval = approvalOutcome(candidate, evidence);
  let rulesetResult: Outcome | undefined;
  for (const obligation of OBLIGATIONS) {
    const spec = policy.obligations[obligation];
    const outcome = spec.producer === "approval" ? approval
      : spec.producer === "ruleset" ? (rulesetResult ??= rulesetOutcome(candidate, evidence, requireRuleset(ruleset)))
      : checksOutcome(spec.checks, spec.allowSkipped === true, evidence.checkRuns);
    if (outcome.note) notes[obligation] = outcome.note;
    if (!("verdict" in outcome)) { if (outcome.skipped) notApplicable.push(obligation); continue; }
    observations.push(observation(candidate, obligation, outcome));
    if (outcome.verdict === "fail" && outcome.provenance.kind === "checks") {
      failedRunIds[obligation] = [...new Set(outcome.provenance.checks.filter((check) => check.conclusion !== "success" && check.runId !== undefined).map((check) => check.runId!))];
    }
  }
  return { observations, notApplicable, notes, failedRunIds };
}

function checksOutcome(names: readonly string[], allowSkipped: boolean, runs: readonly CheckRunFact[]): Outcome {
  const kept = new Map<string, CheckRunFact[]>();
  for (const name of names) {
    const newestPerSuite = new Map<number, CheckRunFact>();
    for (const run of runs) {
      if (run.appSlug !== ACTIONS_APP || run.name !== name) continue;
      const current = newestPerSuite.get(run.checkSuiteId);
      if (!current || run.id > current.id) newestPerSuite.set(run.checkSuiteId, run);
    }
    kept.set(name, [...newestPerSuite.values()]);
  }
  const missing = names.filter((name) => kept.get(name)!.length === 0);
  const pending = names.filter((name) => kept.get(name)!.some((run) => run.status !== "completed"));
  if (missing.length || pending.length) {
    return { note: [missing.length ? `no GitHub Actions run of ${quote(missing)}` : "", pending.length ? `${quote(pending)} still running` : ""].filter(Boolean).join("; ") };
  }
  const all = names.flatMap((name) => kept.get(name)!);
  if (allowSkipped && all.every((run) => run.conclusion === "skipped")) return { note: `${quote(names)} skipped`, skipped: true };
  const failing = all.filter((run) => run.conclusion !== "success");
  const checks: CheckProvenance[] = all.map((run) => ({ name: run.name, checkRunId: run.id, runId: runIdFrom(run.detailsUrl), conclusion: run.conclusion ?? "none", url: run.htmlUrl }));
  const capturedAt = all.map((run) => run.completedAt!).sort().at(-1)!;
  return {
    verdict: failing.length ? "fail" : "pass",
    provenance: { kind: "checks", checks },
    capturedAt,
    note: failing.length ? `failing: ${failing.map((run) => `"${run.name}" (${run.conclusion ?? "none"})`).join(", ")}` : undefined,
  };
}

interface Standing { readonly ignored: string[]; readonly blocking: ReviewFact | undefined; readonly approvalsOnAnyCommit: ReviewFact[]; }

function standingReviews(evidence: ForgeEvidence): Standing {
  const ignored: string[] = [];
  const latest = new Map<string, ReviewFact>();
  for (const review of evidence.reviews) {
    if (!DECISIVE.includes(review.state)) continue;
    const reason = review.login === evidence.author ? `review by PR author @${review.login} ignored`
      : review.userType !== "User" ? `review by ${review.userType} @${review.login} ignored`
      : !WRITERS.includes(review.permission) ? `review by @${review.login} without write access (${review.permission}) ignored`
      : undefined;
    if (reason) { ignored.push(reason); continue; }
    const current = latest.get(review.login);
    if (!current || review.id > current.id) latest.set(review.login, review);
  }
  const standing = [...latest.values()].sort((a, b) => a.id - b.id);
  return { ignored, blocking: standing.find((review) => review.state === "CHANGES_REQUESTED"), approvalsOnAnyCommit: standing.filter((review) => review.state === "APPROVED") };
}

function approvalOutcome(candidate: CandidateIdentity, evidence: ForgeEvidence): Outcome {
  const { ignored, blocking, approvalsOnAnyCommit: approvals } = standingReviews(evidence);
  if (blocking) return { verdict: "fail", provenance: approvalProvenance(blocking), capturedAt: blocking.submittedAt!, note: `@${blocking.login} requested changes` };
  for (const stale of approvals) if (stale.commitId !== candidate.head) ignored.push(`review by @${stale.login} on older commit ${stale.commitId.slice(0, 12)} ignored`);
  const approved = approvals.find((review) => review.commitId === candidate.head);
  if (!approved) return { note: [`no maintainer approval at ${candidate.head.slice(0, 12)}`, ...ignored].join("; ") };
  if (evidence.reviewDecision !== "APPROVED") {
    return { note: evidence.reviewDecision === "none" ? "GitHub computes no review decision, so the ruleset requires no approving review" : `GitHub review decision is ${evidence.reviewDecision}, not APPROVED` };
  }
  return { verdict: "pass", provenance: approvalProvenance(approved), capturedAt: approved.submittedAt! };
}

function requireRuleset(ruleset: RulesetInput | undefined): RulesetInput {
  if (!ruleset) throw new Error("a ruleset obligation needs the ruleset facts");
  return ruleset;
}

const STALE_FLAGS: readonly { readonly name: string; readonly off: (rule: PullRequestRule) => boolean }[] = [
  { name: "dismiss_stale_reviews_on_push", off: (rule) => !rule.dismissStaleReviewsOnPush },
  { name: "require_last_push_approval", off: (rule) => !rule.requireLastPushApproval },
];

export type ApprovalRequirement =
  | { readonly kind: "unreadable"; readonly cause: string }
  | { readonly kind: "no-rule"; readonly decision: ReviewDecision }
  | {
    readonly kind: "rules";
    readonly rules: readonly PullRequestRule[];
    readonly changedPaths: readonly string[];
    readonly matches: readonly ReviewerMatch[];
    readonly staleFlagsOff: readonly string[];
    readonly blocking: ReviewFact | undefined;
    readonly required: number;
    readonly atHead: readonly ReviewFact[];
    readonly decision: ReviewDecision;
  };

/** The one reader of a pull request's live approval requirement. Callers decide what a stale-review flag or a missing approval means for them. */
export function approvalRequirement(head: string, evidence: ForgeEvidence, facts: RulesetFacts): ApprovalRequirement {
  if (facts.kind === "unreadable") return { kind: "unreadable", cause: facts.cause };
  const rules = [...facts.rules].sort((a, b) => a.rulesetId - b.rulesetId);
  if (rules.length === 0) return { kind: "no-rule", decision: evidence.reviewDecision };
  if (facts.truncated) return { kind: "unreadable", cause: "the changed-file list is truncated, so the required reviewers cannot be matched against every path" };
  for (const rule of rules) {
    for (const entry of [...rule.requiredReviewers].sort((a, b) => a.reviewerId - b.reviewerId)) {
      if (entry.filePatterns.length === 0) return { kind: "unreadable", cause: `required reviewer ${entry.reviewerType} ${entry.reviewerId} in ${ruleName(rule)} has no file_patterns` };
      const invalid = invalidPattern(entry.filePatterns);
      if (invalid !== undefined) return { kind: "unreadable", cause: `required reviewer ${reviewerName(entry)} in ${ruleName(rule)} has an invalid file pattern "${printable(invalid)}"` };
    }
  }
  const staleFlagsOff = STALE_FLAGS.flatMap((flag) => {
    const offBy = rules.filter(flag.off);
    return offBy.length ? [`${flag.name} is off in ${offBy.map(ruleName).join(", ")}`] : [];
  });
  const { blocking, approvalsOnAnyCommit } = standingReviews(evidence);
  const matches = matchEntries(rules, facts.changedPaths);
  const baseCount = Math.max(...rules.map((rule) => rule.requiredApprovingReviewCount));
  return {
    kind: "rules", rules, changedPaths: facts.changedPaths, matches, staleFlagsOff, blocking,
    required: Math.max(baseCount, ...matches.map((match) => match.minimumApprovals)),
    atHead: approvalsOnAnyCommit.filter((review) => review.commitId === head),
    decision: evidence.reviewDecision,
  };
}

const matchedText = (matches: readonly ReviewerMatch[]): string => matches.length ? `matched ${matches.map(matchName).join(", ")}` : "no required reviewers matched";

export type MergeGate =
  | { readonly kind: "open" }
  | { readonly kind: "closed"; readonly reason: string }
  | { readonly kind: "unreadable"; readonly cause: string };

/** Whether `publish` may arm or merge. Stale-review flags matter only while an approval is required. */
export function mergeGate(head: string, requirement: ApprovalRequirement): MergeGate {
  if (requirement.kind === "unreadable") return { kind: "unreadable", cause: requirement.cause };
  if (requirement.kind === "no-rule") {
    return requirement.decision === "REVIEW_REQUIRED" || requirement.decision === "CHANGES_REQUESTED"
      ? { kind: "closed", reason: `no pull_request rule applies, but GitHub review decision is ${requirement.decision}` }
      : { kind: "open" };
  }
  const { rules, matches, staleFlagsOff, blocking, required, atHead, decision } = requirement;
  const names = rules.map(ruleName).join(", ");
  if (blocking) return { kind: "closed", reason: `@${blocking.login} requested changes under ${names}` };
  if (required === 0) {
    return decision === "REVIEW_REQUIRED" || decision === "CHANGES_REQUESTED"
      ? { kind: "closed", reason: `no approval is required by ${names} and ${matchedText(matches)}, but GitHub review decision is ${decision}` }
      : { kind: "open" };
  }
  if (atHead.length >= required && decision === "APPROVED" && staleFlagsOff.length === 0) return { kind: "open" };
  const matched = matches.length ? `matched ${matches.map((match) => `${ruleName(match)} ${matchName(match)}`).join(", ")}` : "no required reviewers matched";
  const flags = staleFlagsOff.length ? `; ${staleFlagsOff.join("; ")}` : "";
  return { kind: "closed", reason: `${required} required ${required === 1 ? "approval" : "approvals"} under ${names}, ${atHead.length} at ${head.slice(0, 12)}, GitHub review decision ${decision}; ${matched}${flags}` };
}

function rulesetOutcome(candidate: CandidateIdentity, evidence: ForgeEvidence, { facts, now }: RulesetInput): Outcome {
  const requirement = approvalRequirement(candidate.head, evidence, facts);
  if (requirement.kind === "unreadable") return { note: requirement.cause };
  if (requirement.kind === "no-rule") return { note: `no pull_request rule applies to ${candidate.baseRef || candidate.base}` };
  const { rules, matches, staleFlagsOff, blocking, required, atHead, decision } = requirement;
  if (staleFlagsOff.length) return { note: staleFlagsOff.join("; ") };
  if (blocking) return { note: `@${blocking.login} requested changes` };
  const applies = required > 0;
  const matched = matchedText(matches);
  if (!applies) {
    if (decision === "REVIEW_REQUIRED" || decision === "CHANGES_REQUESTED") {
      return { note: `no approval is required by ${rules.map(ruleName).join(", ")} and ${matched}, but GitHub review decision is ${decision}` };
    }
  } else if (decision !== "APPROVED" || atHead.length < required) {
    return { note: `has ${atHead.length} of ${required} required approvals at ${candidate.head.slice(0, 12)} and GitHub review decision ${decision}; ${matched}` };
  }
  const sortedAtHead = [...atHead].sort((a, b) => a.id - b.id);
  const provenance: Provenance = {
    kind: "ruleset",
    rules: rules.map((rule) => ({ rulesetId: rule.rulesetId, rulesetSource: rule.rulesetSource })),
    changedPathsDigest: sha256([...requirement.changedPaths].sort()),
    matches: matches.map(provenanceMatch),
    requiredApprovals: applies ? required : 0,
    approvals: sortedAtHead.map((review) => ({ reviewer: review.login, reviewId: review.id, url: review.htmlUrl })),
  };
  const inputDigest = sha256({
    rules: rules.map((rule) => ({ ...rule, requiredReviewers: [...rule.requiredReviewers].sort((a, b) => a.reviewerId - b.reviewerId) })),
    changedPaths: [...requirement.changedPaths].sort(),
    approvals: provenance.approvals,
  });
  const capturedAt = sortedAtHead.map((review) => review.submittedAt!).sort().at(-1) ?? now;
  const need = applies ? `${required} ${required === 1 ? "approval" : "approvals"} required, ${atHead.length} at ${candidate.head.slice(0, 12)}` : "no approval required";
  return { verdict: "pass", provenance, capturedAt, inputDigest, note: `rules ${rules.map(ruleName).join(", ")}; ${matched}; ${need}` };
}

function provenanceMatch(match: ReviewerMatch) { return { rulesetId: match.rulesetId, reviewerType: match.reviewerType, reviewerId: match.reviewerId, pattern: match.pattern, path: match.path }; }

function approvalProvenance(review: ReviewFact): Provenance { return { kind: "approval", reviewer: review.login, reviewId: review.id, url: review.htmlUrl }; }

function observation(candidate: CandidateIdentity, obligation: Obligation, outcome: Extract<Outcome, { verdict: unknown }>): Observation {
  const { provenance } = outcome;
  const scope = provenance.kind === "checks" ? provenance.checks.map((check) => check.name).join(", ")
    : provenance.kind === "ruleset" ? `rules ${provenance.rules.map((rule) => rule.rulesetId).join(", ")}`
    : `review ${provenance.reviewId}`;
  return {
    id: `${obligation}@${candidate.head}`,
    obligation,
    candidate,
    inputDigest: outcome.inputDigest ?? sha256(provenance),
    scope,
    artifactRefs: provenanceUrls(provenance),
    producerVersion: EVALUATOR_VERSION,
    capturedAt: outcome.capturedAt,
    verdict: outcome.verdict,
    provenance,
  };
}

function runIdFrom(detailsUrl: string): number | undefined {
  const match = detailsUrl.match(/\/actions\/runs\/(\d+)\//);
  return match ? Number(match[1]) : undefined;
}
function quote(names: readonly string[]): string { return names.map((name) => `"${name}"`).join(", "); }
