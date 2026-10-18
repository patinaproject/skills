import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface Sheet {
  text: string;
  hookOff: boolean;
  piModels: Map<string, string>;
}

export function parseSheet(text: string): Sheet {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const piModels = new Map<string, string>();
  for (const line of lines) {
    const m = /^pi models:\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    for (const pair of m[1].split(",")) {
      const [alias, id] = pair.split("=").map((s) => s.trim());
      if (alias && id) piModels.set(alias, id);
    }
  }
  return { text, hookOff: lines.some((l) => l === "session hook: off"), piModels };
}

export function decodeSheet(bytes: Uint8Array): string {
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || bytes[1] === 0x00) {
    return new TextDecoder("utf-16le", { fatal: true }).decode(bytes);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return Buffer.from(bytes).toString("latin1");
  }
}

export function readSheet(agentDir: string): Sheet | undefined {
  try {
    return parseSheet(decodeSheet(readFileSync(join(agentDir, "pstack-models.md"))));
  } catch {
    return undefined;
  }
}
