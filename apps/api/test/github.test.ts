import { describe, expect, it, vi } from 'vitest'
import { createGithubClient, parsePullRequestUrl } from '../src/github'

describe('parsePullRequestUrl', () => {
  it('extracts a pull request locator from a canonical URL', () => {
    expect(parsePullRequestUrl('https://github.com/openai/openai-node/pull/42')).toEqual({
      owner: 'openai',
      repository: 'openai-node',
      number: 42,
    })
  })

  it.each([
    'http://github.com/openai/openai-node/pull/42',
    'https://example.com/openai/openai-node/pull/42',
    'https://github.com/openai/openai-node/issues/42',
    'not-a-url',
  ])('rejects invalid URL %s', (url) => {
    expect(parsePullRequestUrl(url)).toBeNull()
  })
})

describe('GitHub client', () => {
  it('returns normalized pull request metadata and files', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          additions: 12,
          base: { ref: 'main' },
          body: 'Improves validation',
          changed_files: 1,
          deletions: 2,
          head: { ref: 'feature/validation', sha: 'abc123' },
          html_url: 'https://github.com/acme/widgets/pull/7',
          number: 7,
          title: 'Improve validation',
          user: { login: 'octocat' },
        }),
      )
      .mockResolvedValueOnce(
        Response.json([
          {
            additions: 12,
            blob_url: 'https://github.com/acme/widgets/blob/abc123/src/input.ts',
            changes: 14,
            deletions: 2,
            filename: 'src/input.ts',
            patch: '@@ -1 +1 @@',
            status: 'modified',
          },
        ]),
      )

    const github = createGithubClient({ fetch: request, token: 'test-token' })
    const snapshot = await github.getPullRequest({
      owner: 'acme',
      repository: 'widgets',
      number: 7,
    })

    expect(snapshot.repository.fullName).toBe('acme/widgets')
    expect(snapshot.pullRequest.headSha).toBe('abc123')
    expect(snapshot.files).toHaveLength(1)
    expect(snapshot.truncated).toBe(false)
    expect(request).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/widgets/pulls/7',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    )
  })
})
