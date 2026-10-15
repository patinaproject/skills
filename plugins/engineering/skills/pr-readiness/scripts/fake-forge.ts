import { MemoryPacketStore, type Forge, type PacketStore, type PullRequestState } from "./adapters.ts";
import { operation } from "./cli.ts";
import type { CheckRunFact, ReviewFact } from "./evidence.ts";
import { OBLIGATIONS } from "./domain.ts";

export const HEAD = "0123456789abcdef0123456789abcdef01234567";
export const AUTHOR = "patinaproject-goodyear[bot]";
export const POLICY = JSON.stringify({
  version: 1,
  obligations: {
    standards: { producer: "approval" },
    spec: { producer: "approval" },
    hygiene: { producer: "checks", checks: ["Validate pull request", "Check diff hygiene"] },
    tests: { producer: "checks", checks: ["Unit tests"] },
    lint: { producer: "checks", checks: ["Lint Actions workflows", "Lint Markdown"] },
    behavior: { producer: "checks", checks: ["Verify skill overlay"] },
  },
});
export const CHECK_NAMES = ["Validate pull request", "Check diff hygiene", "Unit tests", "Lint Actions workflows", "Lint Markdown", "Verify skill overlay"];

let nextId = 1000;
export function checkRun(name: string, extra: Partial<CheckRunFact> & { runId?: number } = {}): CheckRunFact {
  const id = extra.id ?? nextId++;
  const runId = extra.runId ?? 500;
  return { id, name, appSlug: "github-actions", status: "completed", conclusion: "success", checkSuiteId: 1, detailsUrl: `https://github.com/o/r/actions/runs/${runId}/job/${id}`, htmlUrl: `https://github.com/o/r/runs/${id}`, completedAt: "2026-10-01T00:00:00Z", ...extra };
}
export function review(extra: Partial<ReviewFact> = {}): ReviewFact {
  return { id: 77, login: "ted", userType: "User", permission: "write", state: "APPROVED", commitId: HEAD, submittedAt: "2026-10-01T01:00:00Z", htmlUrl: "https://github.com/o/r/pull/7#pullrequestreview-77", ...extra };
}
export const evidenceBody = (head = HEAD): string => [
  "## Why", "", "Close the self-approval path.", "", "## Evidence", "",
  ...OBLIGATIONS.map((obligation) => `<!-- pr-readiness: ${JSON.stringify({ observationId: `${obligation}@${head}`, obligation, validity: "observed-current" })} -->`),
].join("\n");

export interface FakeForgeOptions {
  readonly isDraft?: boolean;
  readonly body?: string;
  readonly policy?: string;
  readonly checkRuns?: readonly CheckRunFact[];
  readonly reviews?: readonly ReviewFact[];
  readonly heads?: readonly string[];
}
export interface FakeForge extends Forge {
  readonly markReadyCalls: string[];
  readonly statusCalls: { head: string; state: string; description: string; targetUrl?: string }[];
}
export function fakeForge(options: FakeForgeOptions = {}): FakeForge {
  const heads = options.heads ?? [HEAD];
  let reads = 0;
  const pr = (): PullRequestState => ({
    repository: "o/r", number: 7, pullRequest: 7, base: "b".repeat(40), baseSha: "b".repeat(40), baseRef: "main", mergeBase: "b".repeat(40),
    head: heads[Math.min(reads++, heads.length - 1)]!, patchId: "p", diffDigest: "d", behaviorApplicable: true, requirementsDigest: "rq", reviewContextDigest: "rv", isDraft: options.isDraft ?? true,
    body: options.body ?? evidenceBody(),
  });
  const markReadyCalls: string[] = [];
  const statusCalls: FakeForge["statusCalls"] = [];
  return {
    markReadyCalls,
    statusCalls,
    readPullRequest: pr,
    openPullRequest: pr,
    markReady: (_repository, _number, head) => { markReadyCalls.push(head); },
    readPolicy: () => ("policy" in options ? options.policy : POLICY),
    readEvidence: () => ({ checkRuns: options.checkRuns ?? CHECK_NAMES.map((name) => checkRun(name)), reviews: options.reviews ?? [review()], author: AUTHOR }),
    publishStatus: (_repository, head, state, description, targetUrl) => { statusCalls.push({ head, state, description, targetUrl }); },
  };
}

export function invoke(argv: readonly string[], forge: Forge, store: PacketStore = new MemoryPacketStore()): { code: number; stdout: string; stderr: string } {
  const out = process.stdout.write.bind(process.stdout); const err = process.stderr.write.bind(process.stderr);
  let stdout = ""; let stderr = "";
  process.stdout.write = ((chunk: string) => { stdout += chunk; return true; }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string) => { stderr += chunk; return true; }) as typeof process.stderr.write;
  try { return { code: operation(argv, { forge, store }), stdout, stderr }; } finally { process.stdout.write = out; process.stderr.write = err; }
}
