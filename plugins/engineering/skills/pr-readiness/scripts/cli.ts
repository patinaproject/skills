import { readFileSync } from "node:fs";
import type { BodyClaim, Observation } from "./domain.ts";
import { evaluateReadiness } from "./evaluator.ts";
import { candidateFromPullRequest, type Forge, MemoryPacketStore, type PacketStore, type PullRequestState } from "./adapters.ts";

export interface ReadinessDependencies { readonly forge: Forge; readonly store: PacketStore; readonly observations?: (pr: PullRequestState) => readonly Observation[]; readonly bodyClaims?: (pr: PullRequestState) => readonly BodyClaim[]; }

function value(argv: readonly string[], name: string): string | undefined { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; }
function required(argv: readonly string[], name: string): string { const v = value(argv, name); if (!v) throw new Error(`${name} is required`); return v; }

export function operation(argv: readonly string[], deps: ReadinessDependencies): number {
  try {
    const command = argv[0];
    if (!["open", "check", "publish"].includes(command)) throw new Error("usage: pr-readiness open|check|publish");
    const repository = required(argv, "--repo");
    if (command === "open") {
      const state = deps.forge.openPullRequest({ repository, base: required(argv, "--base"), head: required(argv, "--head"), draft: value(argv, "--draft") !== "false" });
      process.stdout.write(JSON.stringify(state) + "\n");
      return 0;
    }
    const number = Number(required(argv, "--pr"));
    if (!Number.isInteger(number) || number < 1) throw new Error("--pr requires a positive integer");
    const initial = deps.forge.readPullRequest(repository, number);
    const observations = deps.observations?.(initial) ?? loadObservations();
    const bodyClaims = deps.bodyClaims?.(initial);
    const report = evaluateReadiness({ candidate: candidateFromPullRequest(initial), observations, bodyClaims, body: value(argv, "--body") });
    if (command === "check") {
      process.stdout.write(JSON.stringify(report) + "\n");
      return report.ready ? 0 : 1;
    }
    if (!report.ready || !report.packet) throw new Error([...report.decisions.filter((d) => !["observed-current", "valid-by-equivalence", "not-applicable"].includes(d.validity)).map((d) => d.reason), ...report.bodyErrors].join("; ") || "readiness failed");
    const finalState = deps.forge.readPullRequest(repository, number);
    if (finalState.head !== initial.head) throw new Error(`head race: assessed ${initial.head}, remote is ${finalState.head}`);
    const key = `${repository}#${number}:${initial.head}:${report.packet.digest}`;
    deps.store.putIfAbsent(key, report.packet);
    if (!finalState.isDraft) {
      process.stdout.write(`PR #${number} is already ready at ${finalState.head}\n`);
      return 0;
    }
    deps.forge.markReady(repository, number, initial.head);
    process.stdout.write(`PR #${number} is ready at ${initial.head}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`pr-readiness: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function loadObservations(): readonly Observation[] {
  const file = process.env.PATINA_READINESS_OBSERVATIONS;
  if (!file) return [];
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("observations file must contain an array");
  return parsed;
}

export function run(argv: readonly string[], deps?: ReadinessDependencies): number {
  if (!deps) throw new Error("CLI forge adapter is not configured; inject a Forge for execution");
  return operation(argv, deps);
}

export { MemoryPacketStore };
