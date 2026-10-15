import { OBLIGATIONS, sha256, type CandidateIdentity, type CheckProvenance, type Obligation, type Observation, type Provenance, type ReadinessPolicy } from "./domain.ts";

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
export interface ForgeEvidence { readonly checkRuns: readonly CheckRunFact[]; readonly reviews: readonly ReviewFact[]; }
export interface Derivation { readonly observations: Observation[]; readonly notes: Partial<Record<Obligation, string>>; }

const WRITERS: readonly string[] = ["admin", "write"];
const DECISIVE: readonly string[] = ["APPROVED", "CHANGES_REQUESTED"];
type Outcome = { readonly verdict: "pass" | "fail"; readonly provenance: Provenance; readonly capturedAt: string; readonly note?: string } | { readonly note: string };

export function deriveObservations(candidate: CandidateIdentity, policy: ReadinessPolicy, evidence: ForgeEvidence, author: string): Derivation {
  const observations: Observation[] = [];
  const notes: Partial<Record<Obligation, string>> = {};
  const approval = approvalOutcome(candidate, evidence.reviews, author);
  for (const obligation of OBLIGATIONS) {
    const spec = policy.obligations[obligation];
    const outcome = spec.producer === "approval" ? approval : checksOutcome(spec.checks, evidence.checkRuns);
    if (outcome.note) notes[obligation] = outcome.note;
    if ("verdict" in outcome) observations.push(observation(candidate, obligation, outcome));
  }
  return { observations, notes };
}

function checksOutcome(names: readonly string[], runs: readonly CheckRunFact[]): Outcome {
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

function approvalOutcome(candidate: CandidateIdentity, reviews: readonly ReviewFact[], author: string): Outcome {
  const ignored: string[] = [];
  const latest = new Map<string, ReviewFact>();
  for (const review of reviews) {
    if (!DECISIVE.includes(review.state)) continue;
    const reason = review.login === author ? `review by PR author @${review.login} ignored`
      : review.userType !== "User" ? `review by ${review.userType} @${review.login} ignored`
      : !WRITERS.includes(review.permission) ? `review by @${review.login} without write access (${review.permission}) ignored`
      : review.commitId !== candidate.head ? `review by @${review.login} on older commit ${review.commitId.slice(0, 12)} ignored`
      : undefined;
    if (reason) { ignored.push(reason); continue; }
    const current = latest.get(review.login);
    if (!current || review.id > current.id) latest.set(review.login, review);
  }
  const decisive = [...latest.values()].sort((a, b) => a.id - b.id);
  const chosen = decisive.find((review) => review.state === "CHANGES_REQUESTED") ?? decisive.find((review) => review.state === "APPROVED");
  if (!chosen) return { note: [`no maintainer approval at ${candidate.head.slice(0, 12)}`, ...ignored].join("; ") };
  const verdict = chosen.state === "APPROVED" ? "pass" : "fail";
  return {
    verdict,
    provenance: { kind: "approval", reviewer: chosen.login, reviewId: chosen.id, url: chosen.htmlUrl },
    capturedAt: chosen.submittedAt!,
    note: verdict === "fail" ? `@${chosen.login} requested changes` : undefined,
  };
}

function observation(candidate: CandidateIdentity, obligation: Obligation, outcome: Extract<Outcome, { verdict: unknown }>): Observation {
  const { provenance } = outcome;
  const scope = provenance.kind === "checks" ? provenance.checks.map((check) => check.name).join(", ") : `review ${provenance.reviewId}`;
  return {
    id: `${obligation}@${candidate.head}`,
    obligation,
    candidate,
    inputDigest: sha256(provenance),
    scope,
    artifactRefs: provenance.kind === "checks" ? provenance.checks.map((check) => check.url) : [provenance.url],
    producerVersion: "pr-readiness/3",
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
