import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createGithubClient, GithubApiError, parsePullRequestUrl } from './github'

interface Bindings {
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

export default app
