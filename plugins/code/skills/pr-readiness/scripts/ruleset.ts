import { parseChangedPaths, type Forge } from "./adapters.ts";

export interface RequiredReviewer { readonly reviewerId: number; readonly reviewerType: string; readonly filePatterns: readonly string[]; readonly minimumApprovals: number; }
export interface PullRequestRule {
  readonly rulesetId: number;
  readonly rulesetSource: string;
  readonly requiredApprovingReviewCount: number;
  readonly dismissStaleReviewsOnPush: boolean;
  readonly requireLastPushApproval: boolean;
  readonly requiredReviewers: readonly RequiredReviewer[];
}
export interface ReviewerMatch { readonly rulesetId: number; readonly rulesetSource: string; readonly reviewerId: number; readonly reviewerType: string; readonly minimumApprovals: number; readonly pattern: string; readonly path: string; }
export type RulesetFacts =
  | { readonly kind: "read"; readonly rules: readonly PullRequestRule[]; readonly changedPaths: readonly string[]; readonly truncated: boolean }
  | { readonly kind: "unreadable"; readonly cause: string };

/** GitHub caps the pull request files API at 3000 files. */
export const FILE_LIST_CAP = 3000;

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function member<T>(row: Record<string, unknown>, key: string, check: (value: unknown) => value is T): T {
  const value = row[key];
  if (!check(value)) throw new Error(`forge returned a malformed pull_request rule: ${key}`);
  return value;
}
const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;
const isId = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;
const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

export function parsePullRequestRules(raw: readonly unknown[]): PullRequestRule[] {
  return raw.flatMap((row) => {
    if (!isObject(row) || row.type !== "pull_request") return [];
    const parameters = member(row, "parameters", isObject);
    const reviewers = parameters.required_reviewers === undefined ? [] : member(parameters, "required_reviewers", isArray);
    return [{
      rulesetId: member(row, "ruleset_id", isId),
      rulesetSource: member(row, "ruleset_source", isString),
      requiredApprovingReviewCount: member(parameters, "required_approving_review_count", isCount),
      dismissStaleReviewsOnPush: member(parameters, "dismiss_stale_reviews_on_push", isBoolean),
      requireLastPushApproval: member(parameters, "require_last_push_approval", isBoolean),
      requiredReviewers: reviewers.map((entry): RequiredReviewer => {
        if (!isObject(entry)) throw new Error("forge returned a malformed pull_request rule: required_reviewers");
        const reviewer = member(entry, "reviewer", isObject);
        return {
          reviewerId: member(reviewer, "id", isId),
          reviewerType: member(reviewer, "type", isString),
          filePatterns: entry.file_patterns === undefined ? [] : member(entry, "file_patterns", (value): value is string[] => isArray(value) && value.every(isString)),
          minimumApprovals: member(entry, "minimum_approvals", isCount),
        };
      }),
    }];
  });
}

const escapeRegex = (char: string): string => char.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");

function globSource(glob: string): string {
  let out = "";
  let i = 0;
  while (i < glob.length) {
    const char = glob[i]!;
    if (char === "*") {
      let end = i;
      while (glob[end] === "*") end++;
      const afterSlashOrStart = i === 0 || glob[i - 1] === "/";
      if (end - i >= 2 && afterSlashOrStart && glob[end] === "/") { out += "(?:.*/)?"; i = end + 1; continue; }
      if (end - i >= 2 && afterSlashOrStart && end === glob.length) { out += ".*"; i = end; continue; }
      out += "[^/]*";
      i = end;
    } else if (char === "?") { out += "[^/]"; i++; }
    else if (char === "\\" && i + 1 < glob.length) { out += escapeRegex(glob[i + 1]!); i += 2; }
    else if (char === "[") {
      const close = glob.indexOf("]", i + 2);
      if (close === -1) { out += "\\["; i++; continue; }
      const body = glob.slice(i + 1, close);
      const negated = body[0] === "!" || body[0] === "^";
      out += `[${negated ? "^" : ""}${(negated ? body.slice(1) : body).replace(/\\/g, "\\\\")}]`;
      i = close + 1;
    } else { out += escapeRegex(char); i++; }
  }
  return out;
}

interface Compiled { readonly pattern: string; readonly negated: boolean; readonly directoryOnly: boolean; readonly regex: RegExp; }
function compile(line: string): Compiled | undefined {
  let text = line.replace(/(?<!\\)\s+$/, "");
  if (text === "" || text.startsWith("#")) return undefined;
  const negated = text.startsWith("!");
  if (negated) text = text.slice(1);
  const directoryOnly = text.endsWith("/");
  if (directoryOnly) text = text.slice(0, -1);
  if (text === "") return undefined;
  const anchored = text.includes("/");
  if (text.startsWith("/")) text = text.slice(1);
  const body = globSource(text);
  return { pattern: line, negated, directoryOnly, regex: new RegExp(anchored ? `^${body}$` : `^(?:.*/)?${body}$`) };
}

// GitHub documents file_patterns as .gitignore syntax, negation and ordering included.
// https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#required-reviewers
/** Returns the positive pattern whose match survives every later negation, or undefined. */
export function matchPatterns(patterns: readonly string[], path: string): string | undefined {
  const parts = path.split("/");
  const directories = parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("/"));
  let decided: string | undefined;
  for (const line of patterns) {
    const compiled = compile(line);
    if (!compiled) continue;
    const targets = compiled.directoryOnly ? directories : [...directories, path];
    if (targets.some((target) => compiled.regex.test(target))) decided = compiled.negated ? undefined : line;
  }
  return decided;
}

export function matchEntries(rules: readonly PullRequestRule[], changedPaths: readonly string[]): ReviewerMatch[] {
  const paths = [...changedPaths].sort();
  const matches: ReviewerMatch[] = [];
  for (const rule of [...rules].sort((a, b) => a.rulesetId - b.rulesetId)) {
    for (const entry of [...rule.requiredReviewers].sort((a, b) => a.reviewerId - b.reviewerId)) {
      for (const path of paths) {
        const pattern = matchPatterns(entry.filePatterns, path);
        if (pattern === undefined) continue;
        matches.push({ rulesetId: rule.rulesetId, rulesetSource: rule.rulesetSource, reviewerId: entry.reviewerId, reviewerType: entry.reviewerType, minimumApprovals: entry.minimumApprovals, pattern, path });
        break;
      }
    }
  }
  return matches;
}

export const ruleName = (rule: { readonly rulesetId: number; readonly rulesetSource: string }): string => `ruleset ${rule.rulesetId} (${rule.rulesetSource})`;
export const reviewerName = (entry: { readonly reviewerType: string; readonly reviewerId: number }): string => `${entry.reviewerType} ${entry.reviewerId}`;
export const matchName = (match: ReviewerMatch): string => `${reviewerName(match)} (pattern "${match.pattern}" matched ${match.path})`;

function cause(error: unknown): string { return error instanceof Error ? error.message : String(error); }

export function readRulesetFacts(forge: Forge, repository: string, baseRef: string, number: number): RulesetFacts {
  if (!baseRef) return { kind: "unreadable", cause: "the forge did not report the base branch, so its rules cannot be read" };
  let rules: PullRequestRule[];
  try { rules = parsePullRequestRules(forge.readBranchRules(repository, baseRef)); }
  catch (error) { return { kind: "unreadable", cause: `cannot read the rules of ${baseRef}: ${cause(error)}` }; }
  try {
    const { rows, total } = forge.readChangedFiles(repository, number);
    return { kind: "read", rules, changedPaths: parseChangedPaths(rows), truncated: rows.length < total || rows.length >= FILE_LIST_CAP };
  } catch (error) { return { kind: "unreadable", cause: `cannot read the changed files: ${cause(error)}` }; }
}
