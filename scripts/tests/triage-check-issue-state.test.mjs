import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const script = resolve('plugins/team/skills/triage/scripts/check-issue-state.mjs');
const fixtures = await mkdtemp(join(tmpdir(), 'check-issue-state-'));

const githubIssues = {
  'repos/acme/app/issues/1': { state: 'closed', labels: [{ name: 'needs-triage' }, { name: 'bug' }] },
  'repos/acme/app/issues/2': { state: 'open', labels: [{ name: 'ready-for-agent' }, { name: 'bug' }] },
  'repos/acme/app/issues/3': { state: 'open', labels: [{ name: 'needs-triage' }, { name: 'enhancement' }] },
  'repos/acme/app/issues/4': { state: 'open', labels: [{ name: 'bug' }] },
  'repos/acme/app/issues/5': { state: 'open', labels: [{ name: 'Needs-Triage' }, { name: 'needs-info' }] },
};
await writeFile(
  join(fixtures, 'gh'),
  `#!/usr/bin/env node
const issues = ${JSON.stringify(githubIssues)};
const issue = issues[process.argv[3]];
if (!issue) { console.error('HTTP 404: Not Found'); process.exit(1); }
console.log(JSON.stringify(issue));
`
);
await chmod(join(fixtures, 'gh'), 0o755);

const linearIssues = {
  'PAT-1': { state: { type: 'completed' }, labels: { nodes: [{ name: 'needs-triage' }] } },
  'PAT-2': { state: { type: 'triage' }, labels: { nodes: [{ name: 'needs-info' }] } },
  'PAT-3': { state: { type: 'triage' }, labels: { nodes: [{ name: 'Needs Triage' }, { name: 'Bug' }] } },
};
const linearAuth = [];
const linear = createServer((request, response) => {
  let body = '';
  request.on('data', (chunk) => (body += chunk));
  request.on('end', () => {
    linearAuth.push(request.headers.authorization);
    const issue = linearIssues[JSON.parse(body).variables.id];
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(issue ? { data: { issue } } : { data: { issue: null }, errors: [{ message: 'Entity not found' }] }));
  });
});
await new Promise((done) => linear.listen(0, '127.0.0.1', done));

function check(args, env = {}) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [script, ...args], {
      env: {
        ...process.env,
        PATH: `${fixtures}:${process.env.PATH}`,
        LINEAR_API_URL: `http://127.0.0.1:${linear.address().port}/graphql`,
        LINEAR_API_KEY: 'oauth-token',
        ...env,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (code) => done({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
  });
}

try {
  assert.deepEqual(await check(['acme/app#1', '--state', 'needs-triage']), {
    code: 2, stdout: 'skip: acme/app#1 is closed', stderr: '',
  });
  assert.deepEqual(await check(['https://github.com/acme/app/pull/2', '--state', 'needs-triage']), {
    code: 2, stdout: 'skip: https://github.com/acme/app/pull/2 state label is now ready-for-agent, not needs-triage', stderr: '',
  });
  assert.deepEqual(await check(['acme/app#3', '--state', 'needs-triage']), {
    code: 0, stdout: 'proceed: acme/app#3 is open with state label needs-triage', stderr: '',
  });
  assert.deepEqual(await check(['acme/app#4', '--state', 'none']), {
    code: 0, stdout: 'proceed: acme/app#4 is open with no state label', stderr: '',
  });
  assert.deepEqual(await check(['acme/app#3', '--state', 'none']), {
    code: 2, stdout: 'skip: acme/app#3 state label is now needs-triage, not none', stderr: '',
  });
  assert.deepEqual(await check(['acme/app#5', '--state', 'needs-triage']), {
    code: 2, stdout: 'skip: acme/app#5 state label is now Needs-Triage, needs-info, not needs-triage', stderr: '',
  });
  assert.equal((await check(['acme/app#9', '--state', 'none'])).code, 1, 'an unreadable issue blocks the write');

  assert.deepEqual(await check(['PAT-1', '--state', 'needs-triage']), {
    code: 2, stdout: 'skip: PAT-1 is closed', stderr: '',
  });
  assert.deepEqual(await check(['https://linear.app/acme/issue/PAT-2/some-title', '--state', 'needs-triage']), {
    code: 2, stdout: 'skip: https://linear.app/acme/issue/PAT-2/some-title state label is now needs-info, not needs-triage', stderr: '',
  });
  assert.deepEqual(
    await check(['PAT-3', '--state', 'needs triage', '--state-labels', 'Needs Triage,Needs Info,Ready for Agent'], { LINEAR_API_KEY: 'lin_api_personal' }),
    { code: 0, stdout: 'proceed: PAT-3 is open with state label needs triage', stderr: '' },
  );
  assert.deepEqual(linearAuth, ['Bearer oauth-token', 'Bearer oauth-token', 'lin_api_personal']);
  assert.equal((await check(['PAT-9', '--state', 'none'])).code, 1, 'a missing Linear issue blocks the write');
  assert.equal((await check(['PAT-2', '--state', 'none'], { LINEAR_API_KEY: '' })).code, 1, 'a missing key blocks the write');

  assert.equal((await check(['acme/app#3', '--state', 'triaged'])).code, 1, 'an unknown state label is refused');
  assert.equal((await check(['acme/app#3'])).code, 1, 'the expected state is required');
  assert.equal((await check(['acme/app#3', '--state', 'none', '--state-labels', ''])).code, 1, 'an empty state label list is refused');
  assert.equal((await check(['issue-3', '--state', 'none'])).code, 1, 'an unrecognized reference is refused');
} finally {
  linear.close();
  await rm(fixtures, { recursive: true, force: true });
}
