#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REQUIRED_MARKER = /^<!--\s*pr-checkbox:\s*required\s*-->$/i;
const OPTIONAL_MARKER = /^<!--\s*pr-checkbox:\s*optional\s*-->$/i;
const CHOICE_MARKER =
  /^<!--\s*pr-checkbox-choice:\s*([a-z0-9-]+)\s+exactly-one\s*-->$/i;
const CHECKBOX = /^\s*-\s+\[( |x|X)\]\s+(.+)$/;
const HEADING = /^\s{0,3}(#{2,6})\s+(.+?)\s*$/;
const COMMENT_START = /^\s*<!--/;
const COMMENT_END = /-->\s*$/;
const AC_HEADING = /^AC-\d+-\d+\b/;
const TEST_GAP = /^⚠️\s*Test gap:\s*(.+)$/i;
const NON_BLOCKING_GAP = /^⚠️\s*Non-blocking gap:\s*(.+)$/i;
const OPERATOR_CHECK = /^Operator check:/i;
const PROSE_GAP = /^\s*(?:[-*]\s*)?Blocking validation gap:/i;
const NON_BLOCKING_PROSE = /^\s*(?:[-*]\s*)?Non-blocking gap:/i;

function ensureAc(acMap, acId, section, lineNumber) {
  const entry = acMap.get(acId) ?? {
    section,
    lineNumber,
    hasWarning: false,
    testGaps: [],
    nonBlockingGaps: 0,
  };
  if (section) entry.section = section;
  if (lineNumber && !entry.lineNumber) entry.lineNumber = lineNumber;
  acMap.set(acId, entry);
  return entry;
}

function readMatrixAc(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;

  const cells = trimmed
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
  const acId = cells[0];
  if (!AC_HEADING.test(acId)) return null;

  return {
    acId,
    hasWarning: cells.slice(2).some((cell) => cell === '⚠️'),
  };
}

export function validatePrBody(body) {
  const errors = [];
  const choices = new Map();
  const acs = new Map();
  const lines = String(body ?? '').split(/\r?\n/);
  let pending = null;
  let section = 'PR body';
  let activeAc = null;
  let inComment = false;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const heading = line.match(HEADING);
    if (heading) {
      section = heading[2];
      activeAc = AC_HEADING.test(section) ? section.split(/\s+/)[0] : null;
      if (activeAc) ensureAc(acs, activeAc, section, lineNumber);
    }

    const matrixAc = readMatrixAc(line);
    if (matrixAc?.hasWarning) {
      ensureAc(acs, matrixAc.acId, matrixAc.acId, lineNumber).hasWarning = true;
    }

    const choiceMarker = line.match(CHOICE_MARKER);
    if (choiceMarker) {
      pending = { kind: 'choice', group: choiceMarker[1], lineNumber };
      continue;
    }
    if (REQUIRED_MARKER.test(line)) {
      pending = { kind: 'required', lineNumber };
      continue;
    }
    if (OPTIONAL_MARKER.test(line)) {
      pending = { kind: 'optional', lineNumber };
      continue;
    }

    if (inComment || COMMENT_START.test(line)) {
      inComment = !COMMENT_END.test(line);
      continue;
    }

    if (PROSE_GAP.test(line)) {
      errors.push(
        `line ${lineNumber}: ${section}: use canonical ⚠️ Test gap checkbox instead of prose: ${line.trim()}`,
      );
      continue;
    }

    if (NON_BLOCKING_PROSE.test(line) && activeAc) {
      ensureAc(acs, activeAc, section, lineNumber).nonBlockingGaps += 1;
      continue;
    }

    const checkbox = line.match(CHECKBOX);
    if (!checkbox) continue;

    const checked = checkbox[1].toLowerCase() === 'x';
    const text = checkbox[2].trim();
    const marker = pending ?? { kind: 'required', lineNumber };
    pending = null;

    if (PROSE_GAP.test(text)) {
      errors.push(
        `line ${lineNumber}: ${section}: use canonical ⚠️ Test gap checkbox instead of prose: ${text}`,
      );
      continue;
    }

    const nonBlockingGap = text.match(NON_BLOCKING_GAP);
    if (nonBlockingGap) {
      const acId = activeAc ?? section;
      const ac = ensureAc(acs, acId, section, lineNumber);
      ac.nonBlockingGaps += 1;
      if (marker.kind === 'optional') continue;
      errors.push(
        `line ${lineNumber}: ${section}: ⚠️ Non-blocking gap rows must be marked optional with \`<!-- pr-checkbox: optional -->\` immediately above: ${text}`,
      );
      continue;
    }

    const testGap = text.match(TEST_GAP);
    if (testGap) {
      const acId = activeAc ?? section;
      const ac = ensureAc(acs, acId, section, lineNumber);
      ac.testGaps.push({ checked, lineNumber, text });
      const message = checked
        ? `test gap checkbox must remain unchecked while unresolved: ${testGap[1]}`
        : `unresolved validation gap: ${testGap[1]}`;
      errors.push(`line ${lineNumber}: ${section}: ${message}`);
      continue;
    }

    if (!marker) continue;
    if (marker.kind === 'optional') continue;

    if (marker.kind === 'required') {
      if (!checked) {
        const label = OPERATOR_CHECK.test(text)
          ? 'operator check is unchecked'
          : 'required checklist item is unchecked';
        errors.push(
          `line ${lineNumber}: ${section}: ${label}: ${text}`,
        );
      }
      continue;
    }

    const group = choices.get(marker.group) ?? {
      checked: 0,
      rows: [],
      firstLine: lineNumber,
    };
    group.rows.push({ checked, lineNumber, section, text });
    if (checked) group.checked += 1;
    choices.set(marker.group, group);
  }

  for (const [groupName, group] of choices.entries()) {
    if (group.checked !== 1) {
      const rows = group.rows.map((row) => row.text).join('; ');
      errors.push(
        `line ${group.firstLine}: ${groupName}: choice group must have exactly one checked item; ${group.checked} checked among: ${rows}`,
      );
    }
  }

  for (const [acId, ac] of acs.entries()) {
    if (ac.hasWarning && ac.testGaps.length === 0 && ac.nonBlockingGaps === 0) {
      errors.push(
        `line ${ac.lineNumber}: ${acId}: missing ⚠️ Test gap or Non-blocking gap explanation for warning matrix cell`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

function readBodyFromArgs() {
  const bodyFileIndex = process.argv.indexOf('--body-file');
  if (bodyFileIndex !== -1) {
    const bodyFile = process.argv[bodyFileIndex + 1];
    if (!bodyFile) {
      throw new Error('--body-file requires a path');
    }
    return readFileSync(bodyFile, 'utf8');
  }
  return process.env.PR_BODY ?? '';
}

function emitGithubError(message) {
  const escaped = message.replaceAll('%', '%25').replaceAll('\n', '%0A');
  console.error(`::error title=PR readiness validation::${escaped}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validatePrBody(readBodyFromArgs());
  if (!result.ok) {
    for (const error of result.errors) emitGithubError(error);
    process.exit(1);
  }
  console.log('PR readiness validation passed.');
}
