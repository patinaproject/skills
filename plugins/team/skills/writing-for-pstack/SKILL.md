---
name: writing-for-pstack
description: Write or tighten an operator prompt for a patina-mode run. Use when the operator asks to write, revise, or review a prompt that will be passed to patina-mode.
---

# Write a prompt for patina-mode

Return a short prompt that starts one `patina-mode` run. Do not start the run or
perform the work that the prompt describes.

## Read the current contracts

1. Read the `writing-for-agents` skill in full. Apply its leading-word,
   positive-phrasing, and completion-criterion rules.
   Read the Engineering plugin's `unslop` skill in full and apply it to every
   response, including clarifications, the prompt, and accompanying prose.
2. Open the active `patina-mode` skill's `SKILL.md` from the skills catalog.
   Read it in full without executing it. Treat its Playbooks section as the
   routing source of truth.
3. Select the one governing playbook that most specifically matches the
   operator's work. Read that playbook in full from the path named by
   `patina-mode`; let it invoke other playbooks internally. Map each needed
   operator concept to the playbook's canonical term before drafting. Use that
   term in the prompt with the playbook's meaning. For example, express an
   Orchestrate worker-concurrency limit as `Set the in-flight cap to <limit>
   concurrent workers.` Leave unused concepts out. Other playbooks supply
   their own vocabulary.
4. When a repository is in scope, read `AGENTS.md` at the repository root and
   the repository documents that it says govern the work.

If a required skill is unavailable, stop and name the missing skill.

## Keep only operator-owned facts

Extract these facts from the intent or draft:

- the work definition;
- ownership boundaries with other sessions or people;
- the proof that must exist;
- a checkable done predicate;
- any condition that requires a person's decision.

Resolve execution-changing ambiguity before drafting. Use the operator's
context and the selected playbook first. If they leave materially different
instructions possible, ask one concise question before expressing either.

For Orchestrate, distinguish the program objective and its units from workers
and the in-flight cap. An in-flight cap limits concurrent workers; an issue
count does not establish that cap. An issue can require several units. Keep
issue counts, workers, threads, and execution capacity distinct. Use standing
orders, inbox, drain, frontier, and verification ledger only for the concepts
the playbook defines.

Remove instructions that the selected playbook, a principle skill, project
memory, or a repository document already owns. For each removed instruction,
record the exact owning playbook path, principle skill, memory file, or
repository path for the reply. Keep an operator-specific limit or exception
even when its general mechanism already has an owner.

## Write the prompt

Write the shortest usable prompt beginning with `/patina-mode`. Use concise
plain-English sentences, one idea per sentence. Split dense instructions at
their logical boundaries while preserving every operator requirement:

```text
/patina-mode <prompt>
```

Connect the proof to the done condition. Include an ownership boundary only
when the operator sets one. Name the governing playbook once in the opening
with `Use <canonical playbook name> to`. Let it own any internal composition;
do not name alternatives or use field labels.

For Autopilot-full and Orchestrate, begin the text after `/patina-mode` with
`Go, be fully autonomous, and use <canonical playbook name> to`. Call the work
the `program objective` and retain the proof and done condition. Those words
supply the route, standing objective, session override, and authorization to
start.

When the intent requires a person's decision, name its condition and owner as
a checkpoint gate. State that independent work continues while the gate waits.
Let the selected playbook own storage, batching, and notification mechanics.

## Check the result

Apply `unslop` to the entire response on every draft and revision. Preserve
canonical playbook terms when editing; remove filler around them. Then confirm
all of these statements:

- The prompt names exactly one governing `patina-mode` playbook.
- The prompt begins with `/patina-mode` and uses concise sentences. Independent
  requirements have their own sentences when combining them would be dense.
- Every operator requirement survives: ownership, scope, limits, proof,
  completion, and escalation. Earlier requirements remain unless the operator
  changes them in the revision.
- Each selected playbook concept expressed in the prompt keeps its canonical
  name and meaning. Every limit names what it counts. Unused concepts stay out.
- The done predicate contains an observable result, count, state, or artifact.
- Every line changes the run beyond what its governing documents already say.
- An Autopilot-full or Orchestrate prompt opens with `/patina-mode Go, be fully
  autonomous, and use <canonical playbook name> to` and contains `program objective`.
- A human escalation appears as a checkpoint gate, never as a mid-run question.
- The prompt uses positive, direct instructions.

Return the prompt in one fenced text block. If you removed draft instructions,
follow the block with `Removed from the draft` and name each removed rule's
owner. Otherwise, return only the prompt.
