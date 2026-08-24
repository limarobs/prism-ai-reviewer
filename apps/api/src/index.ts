import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createGithubClient, GithubApiError, parsePullRequestUrl } from './github'
import { createReviewClient, ReviewProviderError } from './review'

interface Bindings {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GITHUB_TOKEN?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

app.get('/api/health', (context) =>
  context.json({
    service: 'prism-api',
    status: 'ok',
  }),
)

app.post('/api/pull-requests/resolve', async (context) => {
  const body = await context.req.json<{ url?: unknown }>().catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const locator = parsePullRequestUrl(url)

  if (!locator) {
    return context.json(
      {
        error: {
          code: 'INVALID_PULL_REQUEST_URL',
          message: 'Enter a valid public GitHub pull request URL.',
        },
      },
      400,
    )
  }

  try {
    const github = createGithubClient({ token: context.env.GITHUB_TOKEN })
    const snapshot = await github.getPullRequest(locator)
    return context.json({ data: snapshot })
  } catch (error) {
    if (error instanceof GithubApiError) {
      return context.json(
        {
          error: {
            code: error.status === 404 ? 'PULL_REQUEST_NOT_FOUND' : 'GITHUB_API_ERROR',
            message: error.message,
          },
        },
        error.status === 404 ? 404 : 502,
      )
    }

    throw error
  }
})

app.post('/api/reviews', async (context) => {
  const body = await context.req.json<{ url?: unknown }>().catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const locator = parsePullRequestUrl(url)

  if (!locator) {
    return context.json(
      {
        error: {
          code: 'INVALID_PULL_REQUEST_URL',
          message: 'Enter a valid public GitHub pull request URL.',
        },
      },
      400,
    )
  }

  if (!context.env.GEMINI_API_KEY) {
    return context.json(
      {
        error: {
          code: 'REVIEW_SERVICE_NOT_CONFIGURED',
          message: 'The review service has not been configured.',
        },
      },
      503,
    )
  }

  try {
    const github = createGithubClient({ token: context.env.GITHUB_TOKEN })
    const snapshot = await github.getPullRequest(locator)
    const reviewer = createReviewClient({
      apiKey: context.env.GEMINI_API_KEY,
      model: context.env.GEMINI_MODEL,
    })
    const result = await reviewer.review(snapshot)

    return context.json({
      data: {
        repository: snapshot.repository,
        pullRequest: snapshot.pullRequest,
        files: snapshot.files.map((file) => ({
          additions: file.additions,
          blobUrl: file.blobUrl,
          changes: file.changes,
          deletions: file.deletions,
          filename: file.filename,
          status: file.status,
        })),
        truncated: snapshot.truncated,
        ...result,
      },
    })
  } catch (error) {
    if (error instanceof GithubApiError) {
      return context.json(
        {
          error: {
            code: error.status === 404 ? 'PULL_REQUEST_NOT_FOUND' : 'GITHUB_API_ERROR',
            message: error.message,
          },
        },
        error.status === 404 ? 404 : 502,
      )
    }

    if (error instanceof ReviewProviderError) {
      return context.json(
        {
          error: {
            code: error.status === 429 ? 'REVIEW_RATE_LIMITED' : 'REVIEW_PROVIDER_ERROR',
            message: error.message,
          },
        },
        error.status === 429 ? 429 : 502,
      )
    }

    throw error
  }
})

export default app
