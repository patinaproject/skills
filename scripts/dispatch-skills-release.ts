import { readFile } from 'node:fs/promises';

const SOURCE_REPOSITORY = 'patinaproject/skills';
const TARGET_REPOSITORY = 'patinaproject/patinaproject';
const EVENT_TYPE = 'skills_stable_release';
const STABLE_TAG = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/;

type Release = {
  id?: unknown;
  tag_name?: unknown;
  draft?: unknown;
  prerelease?: unknown;
  published_at?: unknown;
};

type ReleaseRequest = {
  releaseId: number | null;
  tagName: string;
  eventRelease: Release | null;
  eventCommitSha: string | null;
};

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function releaseId(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new Error('The release ID must be a positive integer');
  }
  return Number(value);
}

function tagName(value: unknown): string {
  if (typeof value !== 'string' || !STABLE_TAG.test(value)) {
    throw new Error(`The release tag must match ${STABLE_TAG.source}`);
  }
  return value;
}

function requestedTag(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
    throw new Error('The release tag must be a nonempty string of at most 100 characters');
  }
  return value;
}

async function readReleaseRequest(): Promise<ReleaseRequest> {
  const eventName = requireEnvironment('GITHUB_EVENT_NAME');
  if (eventName === 'workflow_dispatch') {
    return {
      releaseId: null,
      tagName: requestedTag(requireEnvironment('RELEASE_TAG')),
      eventRelease: null,
      eventCommitSha: null,
    };
  }
  if (eventName !== 'release') {
    throw new Error(`Unsupported GitHub event: ${eventName}`);
  }

  const event = JSON.parse(await readFile(requireEnvironment('GITHUB_EVENT_PATH'), 'utf8'));
  if (event.action !== 'published') {
    throw new Error(`Unsupported release action: ${String(event.action)}`);
  }
  if (event.repository?.full_name !== SOURCE_REPOSITORY) {
    throw new Error(`Unexpected source repository: ${String(event.repository?.full_name)}`);
  }
  const release = event.release as Release;
  if (!release || typeof release !== 'object') {
    throw new Error('The release event has no release object');
  }
  const eventCommitSha = requireEnvironment('GITHUB_SHA');
  if (!COMMIT_SHA.test(eventCommitSha)) {
    throw new Error('The release event commit must be a full lowercase hexadecimal SHA');
  }
  return {
    eventCommitSha,
    releaseId: releaseId(release.id),
    tagName: requestedTag(release.tag_name),
    eventRelease: release,
  };
}

async function githubRequest(path: string, token: string, init: RequestInit = {}): Promise<unknown> {
  const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${init.method ?? 'GET'} ${path} failed with ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function validateRelease(release: Release, request: ReleaseRequest): 'stable' | 'ignored' {
  const id = releaseId(release.id);
  const tag = requestedTag(release.tag_name);
  if (request.releaseId !== null && id !== request.releaseId) {
    throw new Error(`Release ID mismatch: expected ${request.releaseId}, received ${id}`);
  }
  if (tag !== request.tagName) {
    throw new Error(`Release tag mismatch: expected ${request.tagName}, received ${tag}`);
  }
  if (request.eventRelease) {
    if (request.eventRelease.id !== release.id || request.eventRelease.tag_name !== release.tag_name) {
      throw new Error('The release event does not match the named GitHub release');
    }
    if (request.eventRelease.draft === true || request.eventRelease.prerelease === true) {
      return 'ignored';
    }
  }
  if (release.draft === true || release.prerelease === true) return 'ignored';
  tagName(tag);
  if (release.draft !== false || release.prerelease !== false || typeof release.published_at !== 'string' || !release.published_at) {
    throw new Error('The named release is not a published stable release');
  }
  return 'stable';
}

async function peelTag(tag: string, token: string): Promise<string> {
  let object = (await githubRequest(
    `/repos/${SOURCE_REPOSITORY}/git/ref/tags/${encodeURIComponent(tag)}`,
    token,
  )) as { object?: { type?: unknown; sha?: unknown } };

  for (let depth = 0; depth < 8; depth += 1) {
    const type = object.object?.type;
    const sha = object.object?.sha;
    if (typeof sha !== 'string' || !COMMIT_SHA.test(sha)) {
      throw new Error('The release tag did not resolve to a full lowercase hexadecimal SHA');
    }
    if (type === 'commit') {
      const commit = (await githubRequest(`/repos/${SOURCE_REPOSITORY}/commits/${sha}`, token)) as {
        sha?: unknown;
      };
      if (commit.sha !== sha) {
        throw new Error('GitHub did not return the peeled release commit');
      }
      return sha;
    }
    if (type !== 'tag') {
      throw new Error(`The release tag resolved to unsupported object type: ${String(type)}`);
    }
    object = (await githubRequest(`/repos/${SOURCE_REPOSITORY}/git/tags/${sha}`, token)) as typeof object;
  }
  throw new Error('The release tag nesting exceeds the supported depth');
}

async function main(): Promise<void> {
  if (requireEnvironment('GITHUB_REPOSITORY') !== SOURCE_REPOSITORY) {
    throw new Error(`This command runs only in ${SOURCE_REPOSITORY}`);
  }
  const request = await readReleaseRequest();
  const sourceToken = requireEnvironment('GITHUB_TOKEN');
  const targetToken = requireEnvironment('TARGET_REPOSITORY_TOKEN');
  const path = request.releaseId === null
    ? `/repos/${SOURCE_REPOSITORY}/releases/tags/${encodeURIComponent(request.tagName)}`
    : `/repos/${SOURCE_REPOSITORY}/releases/${request.releaseId}`;
  const release = (await githubRequest(path, sourceToken)) as Release;
  if (validateRelease(release, request) === 'ignored') {
    process.stdout.write(`Ignored draft or prerelease ${request.tagName}\n`);
    return;
  }
  const commitSha = await peelTag(request.tagName, sourceToken);
  if (request.eventCommitSha !== null && request.eventCommitSha !== commitSha) {
    throw new Error('The release event commit does not match the peeled release commit');
  }
  await githubRequest(`/repos/${TARGET_REPOSITORY}/dispatches`, targetToken, {
    method: 'POST',
    body: JSON.stringify({
      event_type: EVENT_TYPE,
      client_payload: {
        schema_version: 1,
        source_repository: SOURCE_REPOSITORY,
        release_id: releaseId(release.id),
        tag_name: request.tagName,
        commit_sha: commitSha,
      },
    }),
  });
  process.stdout.write(`Dispatched ${request.tagName} at ${commitSha}\n`);
}

await main();
