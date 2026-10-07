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
}

export interface Forge {
  readPullRequest(repository: string, number: number): PullRequestState;
  openPullRequest(input: { repository: string; base: string; head: string; draft?: boolean }): PullRequestState;
  markReady(repository: string, number: number, expectedHead: string): void;
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
    if (existing) return existing;
    this.packets.set(key, packet);
    return packet;
  }
}
