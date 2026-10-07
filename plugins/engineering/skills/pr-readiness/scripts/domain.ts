import { createHash } from "node:crypto";

export type Validity =
  | "observed-current"
  | "valid-by-equivalence"
  | "rerun-required"
  | "invalid"
  | "not-applicable";

export type Obligation =
  | "standards"
  | "spec"
  | "hygiene"
  | "tests"
  | "lint"
  | "behavior";

export const OBLIGATIONS: readonly Obligation[] = [
  "standards",
  "spec",
  "hygiene",
  "tests",
  "lint",
  "behavior",
];

export interface CandidateIdentity {
  readonly repository: string;
  readonly pullRequest: number;
  readonly base: string;
  readonly mergeBase: string;
  readonly head: string;
  readonly patchId: string;
  readonly diffDigest: string;
  readonly requirementsDigest: string;
  readonly policyDigest: string;
}

export interface Observation {
  readonly id: string;
  readonly obligation: Obligation;
  readonly candidate: CandidateIdentity;
  readonly inputDigest: string;
  readonly scope: string;
  readonly target?: string;
  readonly runtime?: string;
  readonly environment?: string;
  readonly fixtures?: string;
  readonly artifactRefs: readonly string[];
  readonly producerVersion: string;
  readonly capturedAt: string;
  readonly expiresAt?: string;
  readonly verdict: "pass" | "fail";
}

export interface BodyClaim {
  readonly observationId: string;
  readonly obligation: Obligation;
  readonly validity: Validity;
}

export interface ValidityDecision {
  readonly obligation: Obligation;
  readonly observationId?: string;
  readonly validity: Validity;
  readonly reason: string;
  readonly capturedHead?: string;
}

export interface ObligationRule {
  readonly obligation: Obligation;
  readonly applies: (candidate: CandidateIdentity) => boolean;
  readonly producer: string;
}

export interface ReadinessPacket {
  readonly version: 1;
  readonly candidate: CandidateIdentity;
  readonly observationIds: readonly string[];
  readonly decisions: readonly ValidityDecision[];
  readonly requirementsDigest: string;
  readonly policyDigest: string;
  readonly bodyDigest: string;
  readonly receiptRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly expiresAt?: string;
  readonly digest: string;
}

export function canonicalize(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
    .join(",")}}`;
}

export function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

export function isObligation(value: unknown): value is Obligation {
  return typeof value === "string" && (OBLIGATIONS as readonly string[]).includes(value);
}

export function freezePacket(packet: Omit<ReadinessPacket, "digest">): ReadinessPacket {
  const withDigest = { ...packet, digest: sha256(packet) } as ReadinessPacket;
  return deepFreeze(withDigest);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
