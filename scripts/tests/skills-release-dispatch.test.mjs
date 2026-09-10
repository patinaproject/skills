import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

const repoRoot = new URL('../..', import.meta.url).pathname;
const commitSha = '0123456789abcdef0123456789abcdef01234567';
const tagSha = 'abcdef0123456789abcdef0123456789abcdef01';

async function run(command, env) {
  const child = spawn(process.execPath, [command], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
  const [code] = await once(child, 'close');
  return { code, stdout, stderr };
}

async function withServer(handler, callback) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
}

function release(overrides = {}) {
  return {
    id: 123,
    tag_name: 'v2.47.0',
    draft: false,
    prerelease: false,
    published_at: '2026-09-09T00:00:00Z',
    ...overrides,
  };
}

async function eventFile(releaseValue) {
  const directory = await mkdtemp(join(tmpdir(), 'patinaproject-skills-dispatch-'));
  const path = join(directory, 'event.json');
  await writeFile(path, JSON.stringify({
    action: 'published',
    repository: { full_name: 'patinaproject/skills' },
    release: releaseValue,
  }));
  return { directory, path };
}

test('published release validates an annotated tag and sends the exact receiver payload', async () => {
  const fixture = await eventFile(release());
  const requests = [];
  try {
    await withServer(async (request, response) => {
      let body = '';
      for await (const chunk of request) body += chunk;
      requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization, body });
      if (request.url === '/repos/patinaproject/skills/releases/123') return json(response, 200, release());
      if (request.url === '/repos/patinaproject/skills/git/ref/tags/v2.47.0') return json(response, 200, { object: { type: 'tag', sha: tagSha } });
      if (request.url === `/repos/patinaproject/skills/git/tags/${tagSha}`) return json(response, 200, { object: { type: 'commit', sha: commitSha } });
      if (request.url === `/repos/patinaproject/skills/commits/${commitSha}`) return json(response, 200, { sha: commitSha });
      if (request.url === '/repos/patinaproject/patinaproject/dispatches') {
        response.writeHead(204).end();
        return;
      }
      response.writeHead(404).end();
    }, async (apiUrl) => {
      const result = await run('scripts/dispatch-skills-release.ts', {
        GITHUB_API_URL: apiUrl,
        GITHUB_EVENT_NAME: 'release',
        GITHUB_EVENT_PATH: fixture.path,
        GITHUB_REPOSITORY: 'patinaproject/skills',
        GITHUB_SHA: commitSha,
        GITHUB_TOKEN: 'source-token',
        TARGET_REPOSITORY_TOKEN: 'target-token',
      });
      assert.equal(result.code, 0, result.stderr);
    });
    const dispatch = requests.at(-1);
    assert.equal(dispatch.authorization, 'Bearer target-token');
    assert.deepEqual(JSON.parse(dispatch.body), {
      event_type: 'skills_stable_release',
      client_payload: {
        schema_version: 1,
        source_repository: 'patinaproject/skills',
        release_id: 123,
        tag_name: 'v2.47.0',
        commit_sha: commitSha,
      },
    });
    assert(requests.slice(0, -1).every((request) => request.authorization === 'Bearer source-token'));
  } finally {
    await rm(fixture.directory, { recursive: true, force: true });
  }
});

test('manual dispatch validates a lightweight tag through the same producer', async () => {
  let dispatches = 0;
  await withServer((request, response) => {
    if (request.url === '/repos/patinaproject/skills/releases/tags/v2.47.0') return json(response, 200, release());
    if (request.url === '/repos/patinaproject/skills/git/ref/tags/v2.47.0') return json(response, 200, { object: { type: 'commit', sha: commitSha } });
    if (request.url === `/repos/patinaproject/skills/commits/${commitSha}`) return json(response, 200, { sha: commitSha });
    if (request.url === '/repos/patinaproject/patinaproject/dispatches') {
      dispatches += 1;
      response.writeHead(204).end();
      return;
    }
    response.writeHead(404).end();
  }, async (apiUrl) => {
    const result = await run('scripts/dispatch-skills-release.ts', {
      GITHUB_API_URL: apiUrl,
      GITHUB_EVENT_NAME: 'workflow_dispatch',
      GITHUB_SHA: 'a'.repeat(40),
      GITHUB_REPOSITORY: 'patinaproject/skills',
      GITHUB_TOKEN: 'source-token',
      RELEASE_TAG: 'v2.47.0',
      TARGET_REPOSITORY_TOKEN: 'target-token',
    });
    assert.equal(result.code, 0, result.stderr);
  });
  assert.equal(dispatches, 1);
});

for (const [name, eventSha, error] of [
  ['moved tag', 'a'.repeat(40), /release event commit does not match the peeled release commit/],
  ['missing event SHA', '', /GITHUB_SHA is required/],
  ['malformed event SHA', 'not-a-sha', /release event commit must be a full lowercase hexadecimal SHA/],
]) {
  test(`${name} fails without a dispatch`, async () => {
    const fixture = await eventFile(release());
    let dispatches = 0;
    try {
      await withServer((request, response) => {
        if (request.url === '/repos/patinaproject/skills/releases/123') return json(response, 200, release());
        if (request.url === '/repos/patinaproject/skills/git/ref/tags/v2.47.0') return json(response, 200, { object: { type: 'commit', sha: commitSha } });
        if (request.url === `/repos/patinaproject/skills/commits/${commitSha}`) return json(response, 200, { sha: commitSha });
        if (request.url === '/repos/patinaproject/patinaproject/dispatches') {
          dispatches += 1;
          response.writeHead(204).end();
          return;
        }
        response.writeHead(404).end();
      }, async (apiUrl) => {
        const result = await run('scripts/dispatch-skills-release.ts', {
          GITHUB_API_URL: apiUrl,
          GITHUB_EVENT_NAME: 'release',
          GITHUB_EVENT_PATH: fixture.path,
          GITHUB_REPOSITORY: 'patinaproject/skills',
          GITHUB_SHA: eventSha,
          GITHUB_TOKEN: 'source-token',
          TARGET_REPOSITORY_TOKEN: 'target-token',
        });
        assert.equal(dispatches, 0, `Expected no dispatch; command exited ${result.code}: ${result.stdout}`);
        assert.notEqual(result.code, 0);
        assert.match(result.stderr, error);
      });
    } finally {
      await rm(fixture.directory, { recursive: true, force: true });
    }
  });
}

for (const [kind, overrides] of [
  ['draft', { draft: true, published_at: null }],
  ['prerelease', { prerelease: true, tag_name: 'v2.47.0-beta.1' }],
]) {
  test(`${kind} releases exit successfully without a dispatch`, async () => {
    const value = release(overrides);
    const fixture = await eventFile(value);
    let dispatches = 0;
    try {
      await withServer((request, response) => {
        if (request.url === '/repos/patinaproject/skills/releases/123') return json(response, 200, value);
        if (request.url === '/repos/patinaproject/patinaproject/dispatches') dispatches += 1;
        response.writeHead(404).end();
      }, async (apiUrl) => {
        const result = await run('scripts/dispatch-skills-release.ts', {
          GITHUB_API_URL: apiUrl,
          GITHUB_EVENT_NAME: 'release',
          GITHUB_EVENT_PATH: fixture.path,
          GITHUB_REPOSITORY: 'patinaproject/skills',
          GITHUB_SHA: commitSha,
          GITHUB_TOKEN: 'source-token',
          TARGET_REPOSITORY_TOKEN: 'target-token',
        });
        assert.equal(result.code, 0, result.stderr);
        assert.match(result.stdout, /Ignored draft or prerelease/);
      });
      assert.equal(dispatches, 0);
    } finally {
      await rm(fixture.directory, { recursive: true, force: true });
    }
  });
}

test('mismatched release metadata fails before tag resolution or dispatch', async () => {
  const fixture = await eventFile(release());
  let requestCount = 0;
  try {
    await withServer((request, response) => {
      requestCount += 1;
      json(response, 200, release({ tag_name: 'v2.48.0' }));
    }, async (apiUrl) => {
      const result = await run('scripts/dispatch-skills-release.ts', {
        GITHUB_API_URL: apiUrl,
        GITHUB_EVENT_NAME: 'release',
        GITHUB_EVENT_PATH: fixture.path,
        GITHUB_REPOSITORY: 'patinaproject/skills',
        GITHUB_SHA: commitSha,
        GITHUB_TOKEN: 'source-token',
        TARGET_REPOSITORY_TOKEN: 'target-token',
      });
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /Release tag mismatch/);
    });
    assert.equal(requestCount, 1);
  } finally {
    await rm(fixture.directory, { recursive: true, force: true });
  }
});

test('a tag that does not peel to a full commit SHA fails without dispatch', async () => {
  let dispatches = 0;
  await withServer((request, response) => {
    if (request.url === '/repos/patinaproject/skills/releases/tags/v2.47.0') return json(response, 200, release());
    if (request.url === '/repos/patinaproject/skills/git/ref/tags/v2.47.0') return json(response, 200, { object: { type: 'commit', sha: 'not-a-sha' } });
    if (request.url === '/repos/patinaproject/patinaproject/dispatches') dispatches += 1;
    response.writeHead(404).end();
  }, async (apiUrl) => {
    const result = await run('scripts/dispatch-skills-release.ts', {
      GITHUB_API_URL: apiUrl,
      GITHUB_EVENT_NAME: 'workflow_dispatch',
      GITHUB_SHA: 'a'.repeat(40),
      GITHUB_REPOSITORY: 'patinaproject/skills',
      GITHUB_TOKEN: 'source-token',
      RELEASE_TAG: 'v2.47.0',
      TARGET_REPOSITORY_TOKEN: 'target-token',
    });
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /full lowercase hexadecimal SHA/);
  });
  assert.equal(dispatches, 0);
});

test('workflow contracts use the dedicated target App token and existing Slack route', async () => {
  const dispatchWorkflow = await readFile(join(repoRoot, '.github/workflows/skills-release-dispatch.yml'), 'utf8');
  assert.match(dispatchWorkflow, /^name: Skills release dispatch$/m);
  assert.match(dispatchWorkflow, /^  release:\n    types: \[published\]$/m);
  assert.match(dispatchWorkflow, /^  workflow_dispatch:$/m);
  assert.match(dispatchWorkflow, /^          owner: patinaproject$/m);
  assert.match(dispatchWorkflow, /^          repositories: patinaproject$/m);
  assert.match(dispatchWorkflow, /^          permission-contents: write$/m);
  assert.match(dispatchWorkflow, /^          TARGET_REPOSITORY_TOKEN: \$\{\{ steps\.target-app-token\.outputs\.token \}\}$/m);

  const alertWorkflow = await readFile(join(repoRoot, '.github/workflows/slack-failure-alerts.yml'), 'utf8');
  assert.match(alertWorkflow, /^    workflows: \[Skills release dispatch\]$/m);
  assert.match(alertWorkflow, /^          SLACK_WEBHOOK_URL: \$\{\{ secrets\.SLACK_RELEASE_FAILURES_WEBHOOK_URL \}\}$/m);
});

for (const curlExitCode of [0, 22]) {
  test(`Slack workflow preserves the failed run message and exits with delivery status ${curlExitCode}`, async () => {
    const workflow = await readFile(join(repoRoot, '.github/workflows/slack-failure-alerts.yml'), 'utf8');
    const match = workflow.match(/        run: \|\n((?:          .*\n)+)/);
    assert(match);
    const script = match[1].replace(/^          /gm, '');
    const directory = await mkdtemp(join(tmpdir(), 'patinaproject-skills-slack-'));
    const bin = join(directory, 'bin');
    const argsPath = join(directory, 'args');
    const bodyPath = join(directory, 'body');
    await mkdir(bin);
    await writeFile(join(bin, 'curl'), `#!/usr/bin/env bash\nprintf '%s\\0' "$@" > "$CURL_ARGS_PATH"\ncat > "$CURL_BODY_PATH"\nexit "$CURL_EXIT_CODE"\n`);
    await chmod(join(bin, 'curl'), 0o755);
    try {
      const child = spawn('bash', ['-euo', 'pipefail', '-c', script], {
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          SLACK_WEBHOOK_URL: 'https://hooks.slack.test/services/example',
          WORKFLOW_NAME: 'Skills release dispatch',
          BRANCH_NAME: 'main',
          RUN_URL: 'https://github.com/patinaproject/skills/actions/runs/123',
          CURL_ARGS_PATH: argsPath,
          CURL_BODY_PATH: bodyPath,
          CURL_EXIT_CODE: String(curlExitCode),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const [code] = await once(child, 'close');
      assert.equal(code, curlExitCode);
      assert.deepEqual(JSON.parse(await readFile(bodyPath, 'utf8')), {
        text: ':rotating_light: *Skills release dispatch workflow failed* on branch main. <https://github.com/patinaproject/skills/actions/runs/123|View failed run>.',
      });
      const args = (await readFile(argsPath, 'utf8')).split('\0').filter(Boolean);
      assert(args.includes('--fail-with-body'));
      assert(args.includes('https://hooks.slack.test/services/example'));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}
