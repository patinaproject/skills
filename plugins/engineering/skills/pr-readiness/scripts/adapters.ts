import { execFileSync } from "node:child_process";
import type { CandidateIdentity, ReadinessPacket } from "./domain.ts";

export interface PullRequestState {
  readonly repository: string;
  readonly number: number;
  readonly base: string;
  readonly mergeBase: string;
  readonly head: string;
  readonly patchId: string;
  readonly diffDigest: string;
  readonly requirementsDigest: string;
  readonly policyDigest: string;
  readonly isDraft: boolean;
  readonly body?: string;
}

export interface Forge {
  readPullRequest(repository: string, number: number): PullRequestState;
  openPullRequest(input: { repository: string; base: string; head: string; draft?: boolean }): PullRequestState;
  markReady(repository: string, number: number, expectedHead: string): void;
}

/** The only production owner of the direct forge ready transition. */
export function markReadyIfCurrent(
  command: "gh" | "origin",
  repository: string,
  number: number,
  expectedHead: string
): void {
  const args = ["pr", "view", String(number), "--json", "headRefOid,isDraft"];
  if (repository) args.push("--repo", repository);
  const current = JSON.parse(execFileSync(command, args, { encoding: "utf8" })) as {
    headRefOid?: unknown;
    isDraft?: unknown;
  };
  if (current.headRefOid !== expectedHead)
    throw new Error(`head race: assessed ${expectedHead}, remote is ${String(current.headRefOid)}`);
  if (current.isDraft !== true) return;
  const readyArgs = ["pr", "ready", String(number)];
  if (repository) readyArgs.push("--repo", repository);
  execFileSync(command, readyArgs, { stdio: "inherit" });
}

export interface PacketStore {
  get(key: string): ReadinessPacket | undefined;
  putIfAbsent(key: string, packet: ReadinessPacket): ReadinessPacket;
}

export function candidateFromPullRequest(pr: PullRequestState): CandidateIdentity {
  return {
    repository: pr.repository,
    pullRequest: pr.number,
    base: pr.base,
    mergeBase: pr.mergeBase,
    head: pr.head,
    patchId: pr.patchId,
    diffDigest: pr.diffDigest,
    requirementsDigest: pr.requirementsDigest,
    policyDigest: pr.policyDigest,
  };
}

export class MemoryPacketStore implements PacketStore {
  readonly packets = new Map<string, ReadinessPacket>();
  get(key: string): ReadinessPacket | undefined { return this.packets.get(key); }
  putIfAbsent(key: string, packet: ReadinessPacket): ReadinessPacket {
    const existing = this.packets.get(key);
    if (existing) {
      if (existing.digest !== packet.digest) throw new Error(`packet digest collision for ${key}`);
      return existing;
    }
    this.packets.set(key, packet);
    return packet;
  }
}
