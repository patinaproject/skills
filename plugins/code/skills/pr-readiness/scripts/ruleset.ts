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

type Range = readonly [number, number];
const POSIX_CLASSES: Readonly<Record<string, readonly Range[]>> = {
  alnum: [[48, 57], [65, 90], [97, 122]], alpha: [[65, 90], [97, 122]], blank: [[32, 32], [9, 9]], cntrl: [[0, 31], [127, 127]], digit: [[48, 57]], graph: [[33, 126]],
  lower: [[97, 122]], print: [[32, 126]], punct: [[33, 47], [58, 64], [91, 96], [123, 126]], space: [[32, 32], [9, 10], [13, 13]], upper: [[65, 90]], xdigit: [[48, 57], [65, 70], [97, 102]],
};

type Token =
  | { readonly kind: "char"; readonly char: string }
  | { readonly kind: "one" }
  | { readonly kind: "any" }
  | { readonly kind: "class"; readonly test: (char: string) => boolean }
  | { readonly kind: "star" }
  | { readonly kind: "anyStar" }
  | { readonly kind: "dirs" };

/** Reads a wildmatch bracket class at `start`. Returns undefined when it never closes, and throws on an unknown [:name:]. A class never matches a slash. A reversed range matches nothing. */
function bracketToken(glob: string, start: number): { token: Token; end: number } | undefined {
  const negated = glob[start + 1] === "!" || glob[start + 1] === "^";
  let i = start + (negated ? 2 : 1);
  const first = i;
  const ranges: Range[] = [];
  while (i < glob.length) {
    const char = glob[i]!;
    if (char === "]" && i > first) {
      const test = (c: string): boolean => {
        if (c === "/") return false;
        const code = c.charCodeAt(0);
        return ranges.some(([low, high]) => code >= low && code <= high) !== negated;
      };
      return { token: { kind: "class", test }, end: i + 1 };
    }
    if (char === "[" && glob[i + 1] === ":") {
      const close = glob.indexOf(":]", i + 2);
      if (close !== -1) {
        const name = glob.slice(i + 2, close);
        const set = POSIX_CLASSES[name];
        if (set === undefined) throw new Error(`unknown character class [:${name}:]`);
        ranges.push(...set);
        i = close + 2;
        continue;
      }
    }
    let low = char;
    if (char === "\\") {
      if (i + 1 >= glob.length) return undefined;
      low = glob[++i]!;
    }
    i++;
    if (glob[i] === "-" && i + 1 < glob.length && glob[i + 1] !== "]") {
      let high = glob[i + 1]!;
      i += 2;
      if (high === "\\") {
        if (i >= glob.length) return undefined;
        high = glob[i++]!;
      }
      ranges.push([low.charCodeAt(0), high.charCodeAt(0)]);
    } else ranges.push([low.charCodeAt(0), low.charCodeAt(0)]);
  }
  return undefined;
}

/** Tokenizes a glob once. Throws on an unknown [:name:]. */
function tokenize(glob: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < glob.length) {
    const char = glob[i]!;
    if (char === "*") {
      let end = i;
      while (glob[end] === "*") end++;
      const afterSlashOrStart = i === 0 || glob[i - 1] === "/";
      if (end - i >= 2 && afterSlashOrStart && glob[end] === "/") tokens.push({ kind: "dirs" });
      else if (end - i >= 2 && afterSlashOrStart && end === glob.length) {
        if (i > 0) tokens.push({ kind: "any" });
        tokens.push({ kind: "anyStar" });
      } else tokens.push({ kind: "star" });
      i = tokens[tokens.length - 1]!.kind === "dirs" ? end + 1 : end;
    } else if (char === "?") { tokens.push({ kind: "one" }); i++; }
    else if (char === "\\" && i + 1 < glob.length) { tokens.push({ kind: "char", char: glob[i + 1]! }); i += 2; }
    else if (char === "[") {
      const bracket = bracketToken(glob, i);
      if (bracket === undefined) { tokens.push({ kind: "char", char }); i++; continue; }
      tokens.push(bracket.token);
      i = bracket.end;
    } else { tokens.push({ kind: "char", char }); i++; }
  }
  return tokens;
}

const isSkippable = (token: Token): boolean => token.kind === "star" || token.kind === "anyStar" || token.kind === "dirs";

/**
 * Matches without backtracking by tracking the set of live token positions, so the cost is tokens times text length.
 * Returns, for every length n, whether the first n characters of the text match the whole pattern.
 */
function matchingPrefixes(tokens: readonly Token[], text: string): boolean[] {
  const matches: boolean[] = new Array(text.length + 1).fill(false);
  const count = tokens.length;
  let live = new Uint8Array(count + 1);
  let next = new Uint8Array(count + 1);
  const close = (set: Uint8Array): void => { for (let p = 0; p < count; p++) if (set[p] === 1 && isSkippable(tokens[p]!)) set[p + 1] = 1; };
  live[0] = 1;
  close(live);
  matches[0] = live[count] === 1;
  for (let j = 0; j < text.length; j++) {
    const char = text[j]!;
    const slash = char === "/";
    next.fill(0);
    let any = false;
    for (let p = 0; p < count; p++) {
      if (live[p] === 0) continue;
      const token = tokens[p]!;
      switch (token.kind) {
        case "char": if (char === token.char) { next[p + 1] = 1; any = true; } break;
        case "one": if (!slash) { next[p + 1] = 1; any = true; } break;
        case "any": next[p + 1] = 1; any = true; break;
        case "class": if (token.test(char)) { next[p + 1] = 1; any = true; } break;
        case "star": if (!slash) { next[p] = 1; any = true; } break;
        case "anyStar": next[p] = 1; any = true; break;
        case "dirs": next[p] = 1; if (slash) next[p + 1] = 1; any = true; break;
      }
    }
    if (!any) return matches;
    close(next);
    const swap = live; live = next; next = swap;
    matches[j + 1] = live[count] === 1;
  }
  return matches;
}

interface Compiled { readonly pattern: string; readonly negated: boolean; readonly directoryOnly: boolean; readonly tokens: readonly Token[]; }
function compile(line: string): Compiled | undefined {
  let text = line.replace(/(?<!\\) +$/, "");
  if (text === "" || text.startsWith("#")) return undefined;
  const negated = text.startsWith("!");
  if (negated) text = text.slice(1);
  const directoryOnly = text.endsWith("/");
  if (directoryOnly) text = text.slice(0, -1);
  if (text === "") return undefined;
  const anchored = text.includes("/");
  if (text.startsWith("/")) text = text.slice(1);
  const body = tokenize(text);
  return { pattern: line, negated, directoryOnly, tokens: anchored ? body : [{ kind: "dirs" }, ...body] };
}

// GitHub documents file_patterns as .gitignore syntax, negation and ordering included.
// https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#required-reviewers
/** Last matching pattern wins. A directory-only pattern applies to directories only. `length` is how much of the path is the target. */
function decide(patterns: readonly Compiled[], matched: readonly (readonly boolean[])[], length: number, isDirectory: boolean): Compiled | undefined {
  let decided: Compiled | undefined;
  patterns.forEach((compiled, index) => {
    if (compiled.directoryOnly && !isDirectory) return;
    if (matched[index]![length]) decided = compiled.negated ? undefined : compiled;
  });
  return decided;
}

/** Returns the first pattern that cannot be compiled, or undefined when every pattern is valid. */
export function invalidPattern(patterns: readonly string[]): string | undefined {
  return patterns.find((line) => { try { compile(line); return false; } catch { return true; } });
}

/**
 * Returns the pattern that excludes the path under git's walk: from the shallowest parent directory down,
 * a directory the patterns exclude excludes everything under it, so a later negation cannot re-include a file.
 * https://git-scm.com/docs/gitignore
 */
export function matchPatterns(patterns: readonly string[], path: string): string | undefined {
  const compiled = patterns.flatMap((line) => compile(line) ?? []);
  const matched = compiled.map(({ tokens }) => matchingPrefixes(tokens, path));
  let length = 0;
  const parts = path.split("/");
  for (let depth = 1; depth < parts.length; depth++) {
    length += parts[depth - 1]!.length + (depth > 1 ? 1 : 0);
    const excluding = decide(compiled, matched, length, true);
    if (excluding) return excluding.pattern;
  }
  return decide(compiled, matched, path.length, false)?.pattern;
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
const UNSAFE = /[\p{Cc}\p{Cf}\u2028\u2029]/u;
const MAX_PRINTED = 200;
/** Escapes control, format, and separator characters and truncates long text, so a path or pattern cannot forge lines or flood a note or stderr. */
export function printable(text: string): string {
  const characters = [...text];
  const shown = characters.length > MAX_PRINTED ? `${characters.slice(0, MAX_PRINTED).join("")}…(${characters.length - MAX_PRINTED} more)` : text;
  if (!UNSAFE.test(shown)) return shown;
  return JSON.stringify(shown).slice(1, -1).replace(/[\p{Cc}\p{Cf}\u2028\u2029]/gu, (char) => {
    const code = char.codePointAt(0)!;
    return code > 0xffff ? `\\u{${code.toString(16)}}` : `\\u${code.toString(16).padStart(4, "0")}`;
  });
}
export const matchName = (match: ReviewerMatch): string => `${reviewerName(match)} (pattern "${printable(match.pattern)}" matched ${printable(match.path)})`;

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
