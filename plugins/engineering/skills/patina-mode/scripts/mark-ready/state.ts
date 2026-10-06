import type { ReviewRecord } from "./types.ts";

export interface ReadinessCheck {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

export function checkReadiness(
  record: ReviewRecord,
  pullRequestHead: string,
  isDraft: boolean
): ReadinessCheck {
  const errors: string[] = [];
  if (!isDraft) errors.push("pull request is already ready");
  if (record.head !== pullRequestHead)
    errors.push(
      `review head ${record.head} does not match current head ${pullRequestHead}`
    );
  if (record.status !== "resolved")
    errors.push(`review status is ${record.status}; expected resolved`);
  if (record.standards.trim() === "") errors.push("Standards axis is missing");
  if (record.spec.trim() === "") errors.push("Spec axis is missing");
  if (record.blockingFindings > 0)
    errors.push(
      `${record.blockingFindings} blocking finding(s) remain unresolved`
    );
  const resolvedIds = new Set<string>();
  const anonymous: string[] = [];
  for (const resolution of record.resolutions) {
    const match = resolution.match(/^\s*(?:(\S+):\s*)?(Fixed in|Dismissed:)/i);
    if (match?.[1]) resolvedIds.add(match[1]);
    else if (match) anonymous.push(resolution);
  }
  for (const [index, finding] of record.findings.entries()) {
    if (!resolvedIds.has(finding.id) && anonymous[index]) {
      resolvedIds.add(finding.id);
      if (/^\s*Dismissed:/i.test(anonymous[index]) && finding.kind === "hard")
        errors.push(`hard finding was dismissed: ${finding.id}`);
    }
    if (!resolvedIds.has(finding.id))
      errors.push(`finding ${finding.id} has no resolution`);
  }
  for (const resolution of record.resolutions) {
    if (
      !/^\s*(?:\S+:\s*)?(?:Fixed in \S+|Dismissed:\s*\S.*)$/i.test(resolution)
    )
      errors.push(`invalid resolution: ${resolution}`);
    if (
      /Dismissed:/i.test(resolution) &&
      /\b(?:hard|missing|wrong|blocking)\b/i.test(resolution)
    )
      errors.push(`blocking finding was dismissed: ${resolution}`);
    const id = resolution.match(/^\s*(\S+):\s*Dismissed:/i)?.[1];
    if (
      id &&
      record.findings.some(
        (finding) => finding.id === id && finding.kind === "hard"
      )
    )
      errors.push(`hard finding was dismissed: ${id}`);
  }
  return { ok: errors.length === 0, errors };
}
