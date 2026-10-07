import {
  type BodyClaim,
  type CandidateIdentity,
  type Obligation,
  type ObligationRule,
  type Observation,
  type ReadinessPacket,
  type ValidityDecision,
  type Validity,
  freezePacket,
  sha256,
} from "./domain.ts";

export interface EvaluationInput {
  readonly candidate: CandidateIdentity;
  readonly observations: readonly Observation[];
  readonly bodyClaims?: readonly BodyClaim[];
  readonly now?: string;
  readonly body?: string;
  readonly rules?: readonly ObligationRule[];
  readonly executionInputs?: Readonly<Partial<Record<Obligation, string>>>;
}

export interface EvaluationReport {
  readonly ready: boolean;
  readonly decisions: readonly ValidityDecision[];
  readonly bodyErrors: readonly string[];
  readonly packet?: ReadinessPacket;
}

const DEFAULT_RULES: readonly ObligationRule[] = [
  { obligation: "standards", producer: "code-review", applies: () => true },
  { obligation: "spec", producer: "code-review", applies: () => true },
  { obligation: "hygiene", producer: "deslop/no-comments", applies: () => true },
  { obligation: "tests", producer: "test", applies: () => true },
  { obligation: "lint", producer: "lint", applies: () => true },
  {
    obligation: "behavior",
    producer: "runtime-verification",
    applies: (candidate) => candidate.diffDigest !== sha256({ files: [] }),
  },
];

const equivalence: Record<Obligation, (current: CandidateIdentity, captured: CandidateIdentity, observation: Observation, input?: string) => boolean> = {
  standards: (a, b) => a.patchId === b.patchId && a.requirementsDigest === b.requirementsDigest && a.policyDigest === b.policyDigest,
  spec: (a, b) => a.patchId === b.patchId && a.requirementsDigest === b.requirementsDigest && a.policyDigest === b.policyDigest,
  hygiene: (a, b) => a.diffDigest === b.diffDigest && a.policyDigest === b.policyDigest,
  tests: (a, b, o, input) => a.diffDigest === b.diffDigest && input !== undefined && o.inputDigest === input,
  lint: (a, b, o, input) => a.diffDigest === b.diffDigest && input !== undefined && o.inputDigest === input,
  behavior: () => false,
};

export function evaluateReadiness(input: EvaluationInput): EvaluationReport {
  const rules = input.rules ?? DEFAULT_RULES;
  const now = input.now ? Date.parse(input.now) : Date.now();
  const decisions: ValidityDecision[] = [];
  for (const rule of rules) {
    if (!rule.applies(input.candidate)) {
      decisions.push({ obligation: rule.obligation, validity: "not-applicable", reason: `change does not require ${rule.obligation} evidence` });
      continue;
    }
    const candidates = input.observations.filter((observation) => observation.obligation === rule.obligation);
    const observation = candidates[candidates.length - 1];
    if (!observation) {
      decisions.push({ obligation: rule.obligation, validity: "rerun-required", reason: `missing ${rule.obligation} observation` });
      continue;
    }
    if (!observation.id || !observation.candidate || observation.candidate.repository !== input.candidate.repository || observation.candidate.pullRequest !== input.candidate.pullRequest) {
      decisions.push({ obligation: rule.obligation, observationId: observation?.id, validity: "invalid", reason: `${rule.obligation} observation belongs to another candidate`, capturedHead: observation?.candidate?.head });
      continue;
    }
    if (observation.verdict !== "pass") {
      decisions.push({ obligation: rule.obligation, observationId: observation.id, validity: "invalid", reason: `${rule.obligation} observation failed`, capturedHead: observation.candidate.head });
      continue;
    }
    if (observation.expiresAt && Date.parse(observation.expiresAt) <= now) {
      decisions.push({ obligation: rule.obligation, observationId: observation.id, validity: "rerun-required", reason: `${rule.obligation} observation expired`, capturedHead: observation.candidate.head });
      continue;
    }
    if (sameCandidate(input.candidate, observation.candidate)) {
      decisions.push({ obligation: rule.obligation, observationId: observation.id, validity: "observed-current", reason: "observation matches current candidate", capturedHead: observation.candidate.head });
      continue;
    }
    if (equivalence[rule.obligation](input.candidate, observation.candidate, observation, input.executionInputs?.[rule.obligation])) {
      decisions.push({ obligation: rule.obligation, observationId: observation.id, validity: "valid-by-equivalence", reason: "producer equivalence contract permits reuse", capturedHead: observation.candidate.head });
      continue;
    }
    decisions.push({ obligation: rule.obligation, observationId: observation.id, validity: "rerun-required", reason: `${rule.obligation} observation does not describe current candidate`, capturedHead: observation.candidate.head });
  }
  const bodyErrors = validateBodyClaims(input.body, input.bodyClaims, decisions);
  const ready = decisions.every((decision) => decision.validity === "observed-current" || decision.validity === "valid-by-equivalence" || decision.validity === "not-applicable") && bodyErrors.length === 0;
  if (!ready) return { ready, decisions, bodyErrors };
  const packet = freezePacket({
    version: 1,
    candidate: input.candidate,
    observationIds: decisions.flatMap((d) => d.observationId ? [d.observationId] : []),
    decisions,
    requirementsDigest: input.candidate.requirementsDigest,
    policyDigest: input.candidate.policyDigest,
    bodyDigest: sha256(input.body ?? ""),
    receiptRefs: decisions.flatMap((d) => d.observationId ? [`receipt:${d.observationId}`] : []),
    artifactRefs: input.observations.flatMap((o) => o.artifactRefs),
  });
  return { ready, decisions, bodyErrors, packet };
}

function sameCandidate(a: CandidateIdentity, b: CandidateIdentity): boolean {
  return a.repository === b.repository && a.pullRequest === b.pullRequest && a.base === b.base && a.mergeBase === b.mergeBase && a.head === b.head && a.patchId === b.patchId && a.diffDigest === b.diffDigest && a.requirementsDigest === b.requirementsDigest && a.policyDigest === b.policyDigest;
}

function validateBodyClaims(body: string | undefined, claims: readonly BodyClaim[] | undefined, decisions: readonly ValidityDecision[]): string[] {
  if (!claims && !body) return [];
  const errors: string[] = [];
  const byId = new Map(decisions.filter((d) => d.observationId).map((d) => [d.observationId!, d]));
  const seen = new Set<string>();
  for (const claim of claims ?? []) {
    if (seen.has(claim.observationId)) errors.push(`duplicate observation ID: ${claim.observationId}`);
    seen.add(claim.observationId);
    const decision = byId.get(claim.observationId);
    if (!decision) errors.push(`unknown observation ID: ${claim.observationId}`);
    else if (decision.obligation !== claim.obligation || decision.validity !== claim.validity) errors.push(`body claim disagrees for ${claim.observationId}`);
    if (body && !body.includes(claim.observationId)) errors.push(`body omits observation ID: ${claim.observationId}`);
  }
  for (const decision of decisions) if (decision.observationId && !seen.has(decision.observationId)) errors.push(`body omits observation ID: ${decision.observationId}`);
  return errors;
}

export function parseBodyClaims(body: string): readonly BodyClaim[] {
  const claims: BodyClaim[] = [];
  for (const match of body.matchAll(/<!--\s*pr-readiness:\s*(\{[^\n]+\})\s*-->/g)) {
    const parsed: unknown = JSON.parse(match[1]);
    if (!parsed || typeof parsed !== "object") throw new Error("malformed readiness body claim");
    const claim = parsed as Partial<BodyClaim>;
    if (typeof claim.observationId !== "string" || typeof claim.obligation !== "string" || typeof claim.validity !== "string") throw new Error("malformed readiness body claim");
    claims.push(claim as BodyClaim);
  }
  return claims;
}
