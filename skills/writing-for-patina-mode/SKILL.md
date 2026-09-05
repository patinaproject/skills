---
name: writing-for-patina-mode
description: Write or tighten an operator prompt for a patina-mode run. Use when the operator asks to write, revise, or review a prompt that will be passed to patina-mode.
---

# Write a prompt for patina-mode

Return a short prompt that starts one `patina-mode` run. Do not start the run or
perform the work that the prompt describes.

## Read the current contracts

1. Read the `writing-for-agents` skill in full. Apply its leading-word,
   positive-phrasing, and completion-criterion rules.
2. Open the active `patina-mode` skill's `SKILL.md` from the skills catalog.
   Read it in full without executing it. Treat its Playbooks section as the
   routing source of truth.
3. Select the one governing playbook that most specifically matches the
   operator's work. Read that playbook in full from the path named by
   `patina-mode`; let it invoke other playbooks internally.
4. When a repository is in scope, read `AGENTS.md` at the repository root and
   the repository documents that it says govern the work.

If either required skill is unavailable, stop and name the missing skill.

## Keep only operator-owned facts

Extract these facts from the intent or draft:

- the work definition;
- ownership boundaries with other sessions or people;
- the proof that must exist;
- a checkable done predicate;
- any condition that requires a person's decision.

Infer a fact when the operator's intent already determines it. Ask only when a
missing product choice would materially change the prompt.

Remove instructions that the selected playbook, a principle skill, project
memory, or a repository document already owns. For each removed instruction,
record the exact owning playbook path, principle skill, memory file, or
repository path for the reply. Keep an operator-specific limit or exception
even when its general mechanism already has an owner.

## Write the prompt

Write one line containing `/patina-mode` and a plain-English sentence of at
most 30 words:

```text
/patina-mode <sentence>
```

Fold the proof into the done condition. Weave in an ownership boundary only
when the operator sets one. Name the governing playbook once inside the sentence
with `Use <canonical playbook name> to`. Let it own any internal composition;
do not name alternatives or use field labels.

For Autopilot-full and Orchestrate, begin the sentence with `Go, be fully
autonomous, and use <canonical playbook name> to`, call the work the `program
objective`, and keep the proof and done condition in that sentence. Those words
supply the route, standing objective, session override, and authorization to
start.

When the intent names a condition that requires a person's decision, weave this
clause into the sentence:

```text
and treat <condition> as a checkpoint gate for <person> while continuing independent work
```

Keep the condition and owner. Let the selected playbook own storage, batching,
and notification mechanics.

## Check the result

Before returning the prompt, confirm all of these statements:

- The prompt names exactly one governing `patina-mode` playbook.
- The prompt matches `/patina-mode <sentence>` on one line, with exactly one
  plain-English sentence of at most 30 words.
- The done predicate contains an observable result, count, state, or artifact.
- Every line changes the run beyond what its governing documents already say.
- An Autopilot-full or Orchestrate sentence begins `Go, be fully autonomous,
  and use <canonical playbook name> to` and contains `program objective`.
- A human escalation appears as a checkpoint gate, never as a mid-run question.
- The prompt uses positive, direct instructions.

Return the prompt in one fenced text block. If you removed draft instructions,
follow the block with `Removed from the draft` and name each removed rule's
owner. Otherwise, return only the prompt.
