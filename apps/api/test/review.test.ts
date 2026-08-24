import { describe, expect, it, vi } from 'vitest'
import type { PullRequestSnapshot } from '../src/github'
import { createReviewClient, ReviewProviderError } from '../src/review'

const snapshot: PullRequestSnapshot = {
  repository: {
    owner: 'acme',
    name: 'widgets',
    fullName: 'acme/widgets',
    url: 'https://github.com/acme/widgets',
  },
  pullRequest: {
    additions: 2,
    author: 'octocat',
    baseRef: 'main',
    body: null,
    changedFiles: 1,
    deletions: 1,
    headRef: 'feature',
    headSha: 'abc123',
    number: 7,
    title: 'Handle missing users',
    url: 'https://github.com/acme/widgets/pull/7',
  },
  files: [
    {
      additions: 2,
      blobUrl: 'https://github.com/acme/widgets/blob/abc123/src/user.ts',
      changes: 3,
      deletions: 1,
      filename: 'src/user.ts',
      patch: '@@ -1 +1,2 @@\n-return user.name\n+return user!.name',
      status: 'modified',
    },
  ],
  truncated: false,
}

describe('Gemini review client', () => {
  it('requests and validates a structured code review', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    summary: 'The change may dereference a missing user.',
                    riskLevel: 'medium',
                    findings: [
                      {
                        severity: 'medium',
                        category: 'bug',
                        title: 'Unsafe user dereference',
                        explanation: 'The assertion hides a possible null value.',
                        file: 'src/user.ts',
                        line: 2,
                        recommendation: 'Handle the missing user explicitly.',
                        confidence: 0.92,
                      },
                    ],
                    suggestedTests: ['Returns a fallback when the user is missing.'],
                  }),
                },
              ],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      }),
    )

    const reviewer = createReviewClient({
      apiKey: 'test-key',
      fetch: request,
      model: 'test-model',
    })
    const result = await reviewer.review(snapshot)

    expect(result.model).toBe('test-model')
    expect(result.review.findings[0]?.title).toBe('Unsafe user dereference')
    expect(result.usage.totalTokens).toBe(150)
    expect(request).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent',
      expect.objectContaining({ method: 'POST' }),
    )
    const requestBody = JSON.parse(request.mock.calls[0]?.[1]?.body as string)
    expect(requestBody.contents[0].parts[0].text).toContain('<UNTRUSTED_PULL_REQUEST>')
    expect(requestBody.generationConfig.responseMimeType).toBe('application/json')
  })

  it('maps rate limits to a safe provider error', async () => {
    const reviewer = createReviewClient({
      apiKey: 'test-key',
      fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 429 })),
    })

    await expect(reviewer.review(snapshot)).rejects.toEqual(
      expect.objectContaining<Partial<ReviewProviderError>>({ status: 429 }),
    )
  })
})
