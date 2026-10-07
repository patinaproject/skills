import { evaluateReadiness } from "../../../pr-readiness/scripts/evaluator.ts";
import type { CandidateIdentity, Observation } from "../../../pr-readiness/scripts/domain.ts";
import type { ReviewRecord } from "./types.ts";

export interface ReadinessCheck { readonly ok: boolean; readonly errors: readonly string[]; }

/** Translate the legacy Markdown record into the central evaluator's observations. */
export function reviewRecordObservations(record: ReviewRecord, repository: string, pullRequest: number, head: string): readonly Observation[] {
  const candidate: CandidateIdentity = { repository, pullRequest, base: "unknown", mergeBase: "unknown", head, patchId: head, diffDigest: head, requirementsDigest: "legacy", policyDigest: "legacy" };
  const pass = record.status === "resolved" && record.standards.trim() !== "" && record.spec.trim() !== "" && record.blockingFindings === 0;
  return ["standards", "spec"].map((obligation) => ({ id: `legacy-${obligation}-${head}`, obligation: obligation as "standards" | "spec", candidate, inputDigest: head, scope: "legacy Markdown review", artifactRefs: [record.path], producerVersion: "mark-ready-compat", capturedAt: new Date(0).toISOString(), verdict: pass ? "pass" : "fail" }));
}

export function checkReadiness(record: ReviewRecord, pullRequestHead: string, isDraft: boolean): ReadinessCheck {
  const errors: string[] = [];
  if (!isDraft) errors.push("pull request is already ready");
  if (record.head !== pullRequestHead) errors.push(`review head ${record.head} does not match current head ${pullRequestHead}`);
  const candidate: CandidateIdentity = { repository: "legacy", pullRequest: 1, base: "unknown", mergeBase: "unknown", head: pullRequestHead, patchId: pullRequestHead, diffDigest: pullRequestHead, requirementsDigest: "legacy", policyDigest: "legacy" };
  const report = evaluateReadiness({ candidate, observations: reviewRecordObservations(record, "legacy", 1, pullRequestHead), rules: [{ obligation: "standards", producer: "mark-ready", applies: () => true }, { obligation: "spec", producer: "mark-ready", applies: () => true }] });
  if (!report.ready) errors.push(...report.decisions.filter((d) => !["observed-current", "valid-by-equivalence", "not-applicable"].includes(d.validity)).map((d) => d.reason));
  return { ok: errors.length === 0, errors };
}
