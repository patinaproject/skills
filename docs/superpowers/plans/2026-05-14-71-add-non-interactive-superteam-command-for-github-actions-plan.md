# Add Non-Interactive Superteam Command for GitHub Actions Plan

Issue: #71

## Acceptance Criteria

- AC-71-1: `skills/superteam-non-interactive/SKILL.md` exists and declares
  `name: superteam-non-interactive`.
- AC-71-2: `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`,
  `.agents/skills/`, and `.claude/skills/` expose the new skill.
- AC-71-3: The skill documents required issue input and optional CI policy
  inputs for clean design approval, publish permission, and draft PR creation.
- AC-71-4: The skill forbids prompts, implicit approvals, skipped adversarial
  review, unauthorized publishing, and premature completion.
- AC-71-5: README, release-flow, file-structure, marketplace description, and
  dogfood verification reflect six in-repo skills.

## Workstreams

1. Add the new skill folder and concise `SKILL.md`.
2. Wire plugin manifests and overlay symlinks.
3. Update repository docs and verification scripts from five to six skills.
4. Run dogfood, marketplace, and Superteam contract verification.

## Verification

- `bash scripts/verify-dogfood.sh`
- `bash scripts/verify-marketplace.sh`
- `bash scripts/verify-superteam-contract.sh`
- `pnpm lint:md`

## Blockers

None.
