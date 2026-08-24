import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('health endpoint', () => {
  it('reports that the API is available', async () => {
    const response = await app.request('/api/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      service: 'prism-api',
      status: 'ok',
    })
  })
})

describe('pull request endpoint', () => {
  it('rejects invalid pull request URLs before calling GitHub', async () => {
    const response = await app.request('/api/pull-requests/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/not-a-pull-request' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'INVALID_PULL_REQUEST_URL' },
    })
  })

  it('rejects unsupported review languages', async () => {
    const response = await app.request('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://github.com/acme/widgets/pull/7',
        language: 'es',
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'INVALID_REVIEW_LANGUAGE' },
    })
  })
})
