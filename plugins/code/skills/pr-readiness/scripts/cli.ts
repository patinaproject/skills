import { OBLIGATIONS, type CandidateIdentity, type ReadinessPolicy, type ValidityDecision } from "./domain.ts";
import { ACCEPTED, evaluateReadiness, type EvaluationReport } from "./evaluator.ts";
import { approvalRequirement, deriveObservations, mergeGate, type ForgeEvidence } from "./evidence.ts";
import { autoMergePlan, parsePolicy, produceCommand, requiredCheckNames, rulesFromPolicy } from "./policy.ts";
import { readRulesetFacts, type RulesetFacts } from "./ruleset.ts";
import { GhForge, FilePacketStore, candidateFromPullRequest, packetKey, type Forge, type MergeStateStatus, type PacketStore, type PullRequestState } from "./adapters.ts";

export interface ReadinessDependencies { readonly forge: Forge; readonly store: PacketStore; readonly mergeStateReads?: number; readonly mergeStateDelayMs?: number; }
const sleep = (ms: number): void => { if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));
const orUndefined = <T>(read: () => T): T | undefined => { try { return read(); } catch { return undefined; } };
const MERGEABLE_NOW: readonly MergeStateStatus[] = ["CLEAN", "HAS_HOOKS", "UNSTABLE"];
function mergeableNow(deps: ReadinessDependencies, repository: string, number: number): boolean {
  const reads = deps.mergeStateReads ?? 5;
  for (let read = 1; ; read++) {
    const { mergeStateStatus, isMergeQueueEnabled } = deps.forge.readMergeState(repository, number);
    if (mergeStateStatus === "UNKNOWN" && read < reads) { sleep(deps.mergeStateDelayMs ?? 2000); continue; }
    return !isMergeQueueEnabled && MERGEABLE_NOW.includes(mergeStateStatus);
  }
}
function squashMerge(deps: ReadinessDependencies, repository: string, number: number, head: string): void {
  const done = (oid: string) => process.stdout.write(`PR #${number} merged (squash) at ${head} as ${oid}\n`);
  try {
    const result = deps.forge.mergePullRequest(repository, number, head);
    if (result.state !== "MERGED" || !result.mergeCommitOid) throw new Error(`merge answered with state ${result.state}`);
    return done(result.mergeCommitOid);
  } catch (error) {
    const now = orUndefined(() => deps.forge.readMergeOutcome(repository, number));
    if (now?.state === "MERGED" && now.mergeCommitOid) return done(now.mergeCommitOid);
    throw new Error(`PR #${number} is ready but not merged: ${message(error)}`);
  }
}
interface Assessment { readonly pr: PullRequestState; readonly candidate: CandidateIdentity; readonly policy: ReadinessPolicy; readonly report: EvaluationReport; readonly evidence: ForgeEvidence; readonly facts: RulesetFacts | undefined; }

function value(argv: readonly string[], name: string): string | undefined { const i = argv.indexOf(name); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined; }
function required(argv: readonly string[], name: string): string { const result = value(argv, name); if (!result || result.startsWith("--")) throw new Error(`${name} is required`); return result; }
const unmet = (report: EvaluationReport): readonly ValidityDecision[] => report.decisions.filter((d) => !ACCEPTED.includes(d.validity));
function reportError(report: EvaluationReport): string { return [...unmet(report).map((d) => d.reason), ...report.errors].join("; ") || "readiness failed"; }

function assess(forge: Forge, repository: string, number: number, bodyOverride: string | undefined, now: string | undefined): Assessment {
  const pr = forge.readPullRequest(repository, number);
  const policy = parsePolicy(forge.readPolicy(repository));
  const candidate = candidateFromPullRequest(pr, policy.digest);
  const evidence = forge.readEvidence(repository, number, candidate.head);
  const facts = OBLIGATIONS.some((obligation) => policy.obligations[obligation].producer === "ruleset")
    ? readRulesetFacts(forge, repository, pr.baseRef ?? "", number)
    : undefined;
  const { observations, notApplicable, notes, failedRunIds } = deriveObservations(candidate, policy, evidence, facts && { facts, now: now ?? new Date().toISOString() });
  const rules = rulesFromPolicy(policy).map((rule) => notApplicable.includes(rule.obligation) ? { ...rule, applies: () => false } : rule);
  const evaluated = evaluateReadiness({ candidate, observations, body: bodyOverride ?? pr.body, now, rules });
  const decisions = evaluated.decisions.map((decision): ValidityDecision => {
    const spec = policy.obligations[decision.obligation];
    const note = notes[decision.obligation];
    if (ACCEPTED.includes(decision.validity)) return spec.producer === "ruleset" && note ? { ...decision, reason: `${decision.reason}: ${note}` } : decision;
    return { ...decision, reason: note ? `${decision.reason}: ${note}` : decision.reason, produce: produceCommand(spec, { repository, pullRequest: number, head: candidate.head, author: evidence.author, failedRunIds: failedRunIds[decision.obligation] }) };
  });
  return { pr, candidate, policy, evidence, facts, report: { ...evaluated, decisions } };
}

export function operation(argv: readonly string[], deps: ReadinessDependencies): number {
  try {
    const command = argv[0]; if (!command || !["open", "check", "publish"].includes(command)) throw new Error("usage: pr-readiness open|check|publish");
    const repository = required(argv, "--repo");
    if (command === "open") { const mode = value(argv, "--mode"); if (mode !== undefined && mode !== "draft" && mode !== "ready") throw new Error("--mode must be draft or ready"); const draft = mode ? mode === "draft" : value(argv, "--draft") !== "false"; const state = deps.forge.openPullRequest({ repository, base: required(argv, "--base"), head: required(argv, "--head"), draft }); process.stdout.write(JSON.stringify(state) + "\n"); return 0; }
    const number = Number(required(argv, "--pr")); if (!Number.isInteger(number) || number < 1) throw new Error("--pr requires a positive integer");
    const now = value(argv, "--now");
    const initial = assess(deps.forge, repository, number, value(argv, "--body"), now);
    const { report } = initial;
    if (command === "check") {
      process.stdout.write(JSON.stringify(report) + "\n");
      for (const d of unmet(report)) process.stderr.write(`${d.obligation}: ${d.reason} -> ${d.produce}\n`);
      for (const error of report.errors) process.stderr.write(`error: ${error}\n`);
      return report.ready ? 0 : 1;
    }
    if (initial.pr.body === undefined && value(argv, "--body") === undefined) throw new Error("pull request body is required for readiness publication");
    // A ready PR is still evaluated, so stale evidence cannot be hidden by an earlier transition.
    if (!report.ready || !report.packet) throw new Error(reportError(report));
    if (initial.pr.isDraft && value(argv, "--takeover") !== "true" && process.env.PATINA_READINESS_AUTOMATION !== "true") throw new Error("publishing a draft requires --takeover=true");
    const final = assess(deps.forge, repository, number, undefined, now);
    if (!final.report.ready || !final.report.packet) throw new Error(`remote changed before publication: ${reportError(final.report)}`);
    if (JSON.stringify(initial.candidate) !== JSON.stringify(final.candidate) || initial.pr.body !== final.pr.body) throw new Error(`candidate/body race: assessed ${initial.candidate.head}, remote is ${final.candidate.head}`);
    const state = final.policy.autoMerge ? deps.forge.readAutoMergeState(repository, number) : undefined;
    const plan = autoMergePlan(final.policy, final.pr.baseRef, state);
    if (plan.kind === "arm") {
      const live = new Set(deps.forge.readRequiredChecks(repository, final.pr.baseRef!));
      const missing = requiredCheckNames(final.policy).filter((name) => !live.has(name));
      if (missing.length) throw new Error(`cannot arm auto-merge: ${final.pr.baseRef} does not require ${missing.map((name) => `"${name}"`).join(", ")}`);
    }
    let gateReason: string | undefined;
    if (plan.kind === "arm") {
      const facts = final.facts ?? readRulesetFacts(deps.forge, repository, final.pr.baseRef ?? "", number);
      const gate = mergeGate(final.candidate.head, approvalRequirement(final.candidate.head, final.evidence, facts));
      if (gate.kind === "unreadable") throw new Error(`cannot arm auto-merge: ${gate.cause}`);
      if (gate.kind === "closed") {
        gateReason = gate.reason;
        if (state?.armed) deps.forge.disableAutoMerge(repository, number);
      }
    }
    deps.store.putIfAbsent(packetKey(final.candidate, final.report.packet.bodyDigest), final.report.packet);
    deps.forge.markReady(repository, number, final.candidate.head);
    process.stdout.write(`PR #${number} is ${final.pr.isDraft ? "ready" : "already ready"} at ${final.candidate.head}\n`);
    if (plan.kind === "skip") process.stdout.write(`auto-merge skipped: ${plan.reason}\n`);
    if (gateReason !== undefined) process.stdout.write(`auto-merge skipped: ${gateReason}\n`);
    else if (plan.kind === "arm") {
      const head = final.candidate.head, armed = state?.armed;
      let mergeable: boolean;
      try { mergeable = mergeableNow(deps, repository, number); } catch (error) { throw new Error(`PR #${number} is ready but not merged: ${message(error)}`); }
      if (mergeable) squashMerge(deps, repository, number, head);
      else if (armed?.mergeMethod === "SQUASH" && armed.head === head) process.stdout.write(`auto-merge already armed (squash) at ${head}\n`);
      else {
        try { deps.forge.enableAutoMerge(repository, number, head); } catch (error) {
          if (!orUndefined(() => mergeableNow(deps, repository, number))) throw new Error(`PR #${number} is ready but auto-merge is not on: ${message(error)}`);
          squashMerge(deps, repository, number, head);
          return 0;
        }
        process.stdout.write(`auto-merge (squash) armed at ${head}\n`);
      }
    }
    return 0;
  } catch (error) { process.stderr.write(`pr-readiness: ${error instanceof Error ? error.message : String(error)}\n`); return 1; }
}
export function run(argv: readonly string[], deps?: ReadinessDependencies): number {
  return operation(argv, deps ?? { forge: new GhForge(process.env.PATINA_FORGE === "origin" ? "origin" : "gh"), store: new FilePacketStore() });
}
export { FilePacketStore };
