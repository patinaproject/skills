const READER_TYPE = /^patina-reader(?:-(?:low|medium|high|xhigh|max))?$/;

export function isReadOnlyType(type: string): boolean {
  return READER_TYPE.test(type);
}

export function excludedTools(readonly: boolean, atMaxDepth: boolean): string[] {
  return [...(readonly ? ["edit", "write"] : []), ...(atMaxDepth ? ["agent"] : [])];
}
