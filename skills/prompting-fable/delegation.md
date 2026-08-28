# Use a non-Claude model from Claude

Use these instructions when a Fable task should run work through another
model's command-line tool. Replace the example Codex command with the tool that
is actually installed.

## Run the command-line tool

When the session has no direct model API, run the model's non-interactive CLI
from Bash. Prefer a skill that already defines the job and exact command. For
uncatalogued investigation or data work, give the CLI a self-contained prompt.
For example:

```sh
codex exec -s read-only '<complete request>'
```

Ask for a report that says what it inspected and says explicitly when it found
nothing. This lets the calling Claude task trust a clean result without doing
the same work again.

## Use from workflows and subagents

Claude workflow and agent model settings accept only Claude models. To call a
different model:

1. Start a small Claude agent on the least expensive suitable tier. In a
   workflow, for example:

   ```js
   agent(prompt, { model: 'sonnet', effort: 'low' })
   ```

2. Tell that agent to write a complete prompt, run the other model's CLI, and
   return its report. Use a schema when the caller needs structured output.
3. Label the agent with the actual worker, such as `gpt-5.6:review-auth`, because
   the workflow UI otherwise shows only the Claude wrapper.
4. Set an explicit timeout for work that may exceed ten minutes, or run it in
   the background and poll for its report file.
5. Give parallel implementation agents separate worktrees so their edits do not
   collide.

Workflow token counters include only Claude tokens. Track any CLI model usage
separately.
